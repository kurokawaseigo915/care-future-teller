#!/usr/bin/env python3
"""
Extract nurse/patient keypoints for the Patient Transfer Future Teller demo.

The transfer video contains THREE people: two nurses and one patient who starts
seated in a wheelchair. Detections are therefore tracked across frames first,
then roles are assigned once per video (patient = the seated person by default)
so identities cannot swap between frames.

Supported paths:
1. RTMPose/MMPose:
   python scripts/extract_keypoints.py rtmpose \
     --video assets/sample-transfer.mp4 \
     --output assets/sample-keypoints.json \
     --pose2d rtmpose-m_8xb256-420e_coco-256x192 --device cpu \
     --raw-cache /tmp/raw-detections.json

2. OpenPose JSON conversion:
   python scripts/extract_keypoints.py openpose \
     --json-dir openpose_output \
     --video assets/sample-transfer.mp4 \
     --output assets/sample-keypoints.json

The output JSON matches the browser demo:
{
  "frames": [
    {
      "time": 0.0,
      "nurse": {"head": {"x": 0.1, "y": 0.2, "c": 0.9}, ...},
      "nurse2": {...},
      "patient": {...},
      "patientFeedback": "unknown"
    }
  ]
}
"""

from __future__ import annotations

import argparse
import json
import math
import subprocess
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any


DEMO_JOINTS = [
    "head",
    "neck",
    "lShoulder",
    "rShoulder",
    "lElbow",
    "rElbow",
    "lWrist",
    "rWrist",
    "hip",
    "lKnee",
    "rKnee",
    "lAnkle",
    "rAnkle",
]

COCO = {
    "nose": 0,
    "lShoulder": 5,
    "rShoulder": 6,
    "lElbow": 7,
    "rElbow": 8,
    "lWrist": 9,
    "rWrist": 10,
    "lHip": 11,
    "rHip": 12,
    "lKnee": 13,
    "rKnee": 14,
    "lAnkle": 15,
    "rAnkle": 16,
}

BODY_25 = {
    "nose": 0,
    "neck": 1,
    "rShoulder": 2,
    "rElbow": 3,
    "rWrist": 4,
    "lShoulder": 5,
    "lElbow": 6,
    "lWrist": 7,
    "midHip": 8,
    "rHip": 9,
    "rKnee": 10,
    "rAnkle": 11,
    "lHip": 12,
    "lKnee": 13,
    "lAnkle": 14,
}

MIN_PERSON_CONFIDENCE = 0.18
MIN_PERSON_HEIGHT = 0.22  # rejects tiny false skeletons (wall photos/posters)
DEDUP_RADIUS = 0.05  # duplicate detector boxes of the same person
MAX_PEOPLE_PER_FRAME = 4
JOINT_HOLD_CONFIDENCE = 0.2
TRACK_MATCH_GATE = 0.13
TRACK_EXPIRE_FRAMES = 15
# Identity linking works on pure tracker segments (no anonymous merging):
# chains are seeded from long segments that overlap in time (guaranteed to be
# different people) and extended with the spatially closest fragments, with
# temporal overlap forbidden. This survives the lift, when everyone converges.
SEGMENT_MIN_FRAMES = 15
DUPLICATE_OVERLAP_MIN = 4
DUPLICATE_DIST = 0.09
CHAIN_MAX_GAP = 150
CHAIN_DIST_GATE = 0.20
CHAIN_DIST_GATE_PER_GAP = 0.0007
CHAIN_OVERLAP_TOLERANCE = 2
ROLE_HOLD_FRAMES = 12
SMOOTH_ALPHA = 0.65
# Appearance: an HSV color histogram of the torso (clothing) per detection.
# Position alone cannot keep identities apart when people cross or lean over
# each other - the nearest-center tracker then swaps them, and the patient
# label lands on a nurse. Clothing color separates the people in essentially
# every care video, so matching vetoes pairs whose appearance disagrees.
APP_EMA = 0.15  # how fast a track's running appearance adapts
APP_VETO_SIM = 0.30  # below this similarity, a match is a different person
# Appearance is a veto, not a preference: reordering the greedy spatial
# matching by appearance similarity proved to hand a track to the wrong
# person during heavy occlusion (crops fill with bedding/background), so
# only clear disagreement rejects a match and distance decides the rest.
APP_COST_WEIGHT = 0.0
APP_SWITCH_FRAMES = 3  # sustained flips inside one track = identity switch


@dataclass
class Person:
    joints: dict[str, dict[str, float]]
    confidence: float
    app: list[float] | None = None
    coco: list[list[float]] | None = None  # raw COCO-17 [x,y,score] in pixels, for 3D lifting


def video_info(video: Path) -> tuple[int, int, float, float]:
    cmd = [
        "ffprobe",
        "-v",
        "error",
        "-select_streams",
        "v:0",
        "-show_entries",
        "stream=width,height,duration,r_frame_rate",
        "-of",
        "json",
        str(video),
    ]
    try:
        data = json.loads(subprocess.check_output(cmd, text=True, stderr=subprocess.DEVNULL))
        stream = data["streams"][0]
        num, _, den = str(stream.get("r_frame_rate", "30/1")).partition("/")
        fps = float(num) / float(den or 1)
        return int(stream["width"]), int(stream["height"]), float(stream.get("duration") or 0.0), fps
    except (FileNotFoundError, subprocess.CalledProcessError, KeyError, IndexError, ValueError, ZeroDivisionError):
        return video_info_cv2(video)


def video_info_cv2(video: Path) -> tuple[int, int, float, float]:
    import cv2

    cap = cv2.VideoCapture(str(video))
    if not cap.isOpened():
        raise SystemExit(f"Could not open video: {video}")
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    frame_count = cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0.0
    cap.release()
    duration = (frame_count / fps) if fps else 0.0
    return width, height, duration, fps


def phase_at(t: float) -> str:
    if t < 0.18:
        return "preparation"
    if t < 0.38:
        return "sit-to-stand"
    if t < 0.62:
        return "lifting"
    if t < 0.82:
        return "pivot"
    return "seating"


def avg_point(a: dict[str, float], b: dict[str, float]) -> dict[str, float]:
    return {
        "x": (a["x"] + b["x"]) / 2,
        "y": (a["y"] + b["y"]) / 2,
        "c": min(a.get("c", 0.0), b.get("c", 0.0)),
    }


def empty_point() -> dict[str, float]:
    return {"x": 0.0, "y": 0.0, "c": 0.0}


def normalize_xy(x: float, y: float, width: int, height: int) -> dict[str, float]:
    return {"x": x / max(width, 1), "y": y / max(height, 1), "c": 1.0}


def coco_to_demo(keypoints: list[list[float]], scores: list[float], width: int, height: int) -> Person:
    def kp(name: str) -> dict[str, float]:
        idx = COCO[name]
        if idx >= len(keypoints):
            return empty_point()
        x, y = keypoints[idx][:2]
        c = float(scores[idx]) if idx < len(scores) else 1.0
        p = normalize_xy(float(x), float(y), width, height)
        p["c"] = c
        return p

    left_shoulder = kp("lShoulder")
    right_shoulder = kp("rShoulder")
    left_hip = kp("lHip")
    right_hip = kp("rHip")
    joints = {
        "head": kp("nose"),
        "neck": avg_point(left_shoulder, right_shoulder),
        "lShoulder": left_shoulder,
        "rShoulder": right_shoulder,
        "lElbow": kp("lElbow"),
        "rElbow": kp("rElbow"),
        "lWrist": kp("lWrist"),
        "rWrist": kp("rWrist"),
        "hip": avg_point(left_hip, right_hip),
        "lKnee": kp("lKnee"),
        "rKnee": kp("rKnee"),
        "lAnkle": kp("lAnkle"),
        "rAnkle": kp("rAnkle"),
    }
    confidence = sum(p.get("c", 0.0) for p in joints.values()) / len(joints)
    return Person(joints=joints, confidence=confidence)


def openpose_to_demo(flat: list[float], width: int, height: int) -> Person:
    def kp(name: str) -> dict[str, float]:
        idx = BODY_25[name] * 3
        if idx + 2 >= len(flat):
            return empty_point()
        x, y, c = float(flat[idx]), float(flat[idx + 1]), float(flat[idx + 2])
        p = normalize_xy(x, y, width, height)
        p["c"] = c
        return p

    left_hip = kp("lHip")
    right_hip = kp("rHip")
    joints = {
        "head": kp("nose"),
        "neck": kp("neck"),
        "lShoulder": kp("lShoulder"),
        "rShoulder": kp("rShoulder"),
        "lElbow": kp("lElbow"),
        "rElbow": kp("rElbow"),
        "lWrist": kp("lWrist"),
        "rWrist": kp("rWrist"),
        "hip": avg_point(left_hip, right_hip) if left_hip["c"] and right_hip["c"] else kp("midHip"),
        "lKnee": kp("lKnee"),
        "rKnee": kp("rKnee"),
        "lAnkle": kp("lAnkle"),
        "rAnkle": kp("rAnkle"),
    }
    confidence = sum(p.get("c", 0.0) for p in joints.values()) / len(joints)
    return Person(joints=joints, confidence=confidence)


def torso_descriptor(cv2: Any, image: Any, keypoints: list[list[float]], scores: list[float]) -> list[float] | None:
    """Small HSV histogram of the shoulders-to-hips crop (the clothing).
    Computed in pixel coordinates on the frame the pose came from."""
    idxs = [COCO["lShoulder"], COCO["rShoulder"], COCO["lHip"], COCO["rHip"]]
    pts = []
    for i in idxs:
        if i < len(keypoints) and (i >= len(scores) or float(scores[i]) > 0.2):
            pts.append(keypoints[i][:2])
    if len(pts) < 3:
        return None
    h, w = image.shape[:2]
    xs = [float(p[0]) for p in pts]
    ys = [float(p[1]) for p in pts]
    pad_x = 0.12 * (max(xs) - min(xs)) + 2
    pad_y = 0.08 * (max(ys) - min(ys)) + 2
    x0 = max(0, int(min(xs) - pad_x))
    x1 = min(w, int(max(xs) + pad_x))
    y0 = max(0, int(min(ys) - pad_y))
    y1 = min(h, int(max(ys) + pad_y))
    if x1 - x0 < 6 or y1 - y0 < 6:
        return None
    hsv = cv2.cvtColor(image[y0:y1, x0:x1], cv2.COLOR_BGR2HSV)
    hist = cv2.calcHist([hsv], [0, 1, 2], None, [6, 4, 4], [0, 180, 0, 256, 0, 256]).flatten()
    total = float(hist.sum())
    if total <= 0:
        return None
    return [round(float(v) / total, 4) for v in hist]


def app_similarity(a: list[float], b: list[float]) -> float:
    """Histogram intersection of two L1-normalized descriptors: 1.0 = same
    clothing colors, ~0.0 = entirely different."""
    return sum(min(x, y) for x, y in zip(a, b))


def track_mean_app(track: "Track") -> list[float] | None:
    apps = [p.app for p in track.persons.values() if p.app]
    if not apps:
        return None
    n = len(apps)
    return [sum(vals) / n for vals in zip(*apps)]


def parse_raw_person(entry: Any) -> Person:
    """Raw-cache people are either {'joints', 'app', 'coco'} (format 4),
    {'joints', 'app'} (format 3), or a plain joints dict (older caches,
    OpenPose path - no appearance or raw COCO keypoints available)."""
    if isinstance(entry, dict) and "joints" in entry:
        joints = entry["joints"]
        app = entry.get("app")
        coco = entry.get("coco")
    else:
        joints = entry
        app = None
        coco = None
    confidence = sum(p.get("c", 0.0) for p in joints.values()) / max(len(joints), 1)
    return Person(joints=joints, confidence=confidence, app=app, coco=coco)


def confident_points(person: Person, threshold: float = 0.05) -> list[dict[str, float]]:
    return [p for p in person.joints.values() if p.get("c", 0.0) > threshold]


def center(person: Person) -> tuple[float, float]:
    pts = confident_points(person)
    if not pts:
        return 0.0, 0.0
    return sum(p["x"] for p in pts) / len(pts), sum(p["y"] for p in pts) / len(pts)


def person_height(person: Person) -> float:
    pts = confident_points(person)
    if len(pts) < 2:
        return 0.0
    ys = [p["y"] for p in pts]
    return max(ys) - min(ys)


def median(values: list[float]) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    return ordered[len(ordered) // 2]


# ---------------------------------------------------------------------------
# Tracking: keep person identities stable across the whole video first, then
# assign the nurse/nurse2/patient roles once, so roles can never swap mid-video.
# ---------------------------------------------------------------------------


@dataclass
class Track:
    tid: int
    persons: dict[int, Person] = field(default_factory=dict)
    last_center: tuple[float, float] = (0.0, 0.0)
    last_seen: int = -1
    app: list[float] | None = None  # running (EMA) clothing descriptor

    def add(self, frame_i: int, person: Person) -> None:
        self.persons[frame_i] = person
        self.last_center = center(person)
        self.last_seen = frame_i
        if person.app:
            if self.app is None:
                self.app = list(person.app)
            else:
                self.app = [(1 - APP_EMA) * a + APP_EMA * b for a, b in zip(self.app, person.app)]

    @property
    def first_seen(self) -> int:
        return min(self.persons) if self.persons else -1


def build_tracks(people_per_frame: list[list[Person]]) -> list[Track]:
    tracks: list[Track] = []
    next_id = 0
    for frame_i, people in enumerate(people_per_frame):
        alive = [t for t in tracks if frame_i - t.last_seen <= TRACK_EXPIRE_FRAMES]
        # Matching is purely spatial. Appearance was tried here in several
        # forms (cost term, hard veto, anti-swap veto) and every variant
        # handed a track to the wrong person during heavy occlusion, when
        # the torso crop fills with bedding or another body. Identity
        # mistakes that slip through are handled at the role level instead
        # (see split_appearance_switches and trim_unseated_regime).
        pairs = []
        for person_i, person in enumerate(people):
            c = center(person)
            for track in alive:
                d = math.dist(c, track.last_center)
                if d <= TRACK_MATCH_GATE:
                    pairs.append((d, person_i, track))
        pairs.sort(key=lambda item: item[0])
        used_people: set[int] = set()
        used_tracks: set[int] = set()
        for d, person_i, track in pairs:
            if person_i in used_people or track.tid in used_tracks:
                continue
            track.add(frame_i, people[person_i])
            used_people.add(person_i)
            used_tracks.add(track.tid)
        for person_i, person in enumerate(people):
            if person_i in used_people:
                continue
            track = Track(tid=next_id)
            next_id += 1
            track.add(frame_i, person)
            tracks.append(track)
    return tracks


def split_segments(tracks: list[Track]) -> tuple[list[Track], list[Track]]:
    """Break tracks at internal gaps. Substantial pieces become segments for
    role assignment; shorter-but-real pieces (5+ frames) are kept as scraps
    so the rescue pass can fill coverage holes with them - dropping them
    outright made visible people lose their skeleton for seconds at a time."""
    segments: list[Track] = []
    scraps: list[Track] = []
    next_id = 0
    for track in tracks:
        frames = sorted(track.persons)
        if not frames:
            continue
        piece: dict[int, Person] = {}
        prev = None
        for i in frames + [None]:
            if i is not None and (prev is None or i - prev <= TRACK_EXPIRE_FRAMES):
                piece[i] = track.persons[i]
                prev = i
                continue
            if len(piece) >= 5:
                seg = Track(tid=next_id)
                next_id += 1
                for k, v in piece.items():
                    seg.add(k, v)
                (segments if len(piece) >= SEGMENT_MIN_FRAMES else scraps).append(seg)
            piece = {i: track.persons[i]} if i is not None else {}
            prev = i
    return segments, scraps


def split_appearance_switches(segments: list[Track]) -> list[Track]:
    """A tracker swap that slipped through shows up as the clothing colors
    flipping mid-segment and staying flipped. Split the segment at the flip,
    so each piece is one person and chaining can reassemble identities."""
    out: list[Track] = []
    next_id = 0

    def close(piece: dict[int, Person]) -> None:
        nonlocal next_id
        if len(piece) >= SEGMENT_MIN_FRAMES:
            seg = Track(tid=next_id)
            next_id += 1
            for k, v in piece.items():
                seg.persons[k] = v
            seg.last_seen = max(piece)
            seg.last_center = center(piece[seg.last_seen])
            out.append(seg)

    for track in segments:
        idxs = sorted(track.persons)
        piece: dict[int, Person] = {}
        ema: list[float] | None = None
        run: list[int] = []  # consecutive frames that disagree with the EMA
        for i in idxs:
            person = track.persons[i]
            if person.app and ema is not None and app_similarity(person.app, ema) < APP_VETO_SIM:
                run.append(i)
                if len(run) >= APP_SWITCH_FRAMES:
                    for j in run:
                        piece.pop(j, None)
                    print(f"  appearance switch inside [{track.first_seen}-{track.last_seen}]: split at frame {run[0]}")
                    close(piece)
                    piece = {j: track.persons[j] for j in run}
                    ema = list(person.app)
                    run = []
                    continue
            else:
                run = []
            piece[i] = person
            if person.app and not run:
                ema = list(person.app) if ema is None else [(1 - APP_EMA) * a + APP_EMA * b for a, b in zip(ema, person.app)]
        close(piece)
    return out


def merge_duplicate_segments(segments: list[Track]) -> list[Track]:
    """The tracker sometimes follows the same person twice (duplicate detector
    boxes drifting apart). Segments that coexist in time at nearly the same
    place are one person: keep the higher-confidence detection per frame."""
    changed = True
    while changed:
        changed = False
        for a in segments:
            for b in segments:
                if a is b or not a.persons or not b.persons:
                    continue
                shared = [i for i in a.persons if i in b.persons]
                if len(shared) < DUPLICATE_OVERLAP_MIN:
                    continue
                ds = sorted(math.dist(center(a.persons[i]), center(b.persons[i])) for i in shared)
                if ds[len(ds) // 2] > DUPLICATE_DIST:
                    continue
                small, big = (a, b) if len(a.persons) <= len(b.persons) else (b, a)
                print(
                    f"  duplicate: segment [{small.first_seen}-{small.last_seen}] folded into "
                    f"[{big.first_seen}-{big.last_seen}]"
                )
                for i, p in small.persons.items():
                    q = big.persons.get(i)
                    if q is None or p.confidence > q.confidence:
                        big.persons[i] = p
                big.last_seen = max(big.persons)
                big.last_center = center(big.persons[big.last_seen])
                small.persons = {}
                changed = True
        segments = [s for s in segments if s.persons]
    return segments


def segments_overlap(a: Track, b: Track) -> int:
    lo = max(a.first_seen, b.first_seen)
    hi = min(a.last_seen, b.last_seen)
    return max(0, hi - lo + 1)


def link_cost(chain: Track, seg: Track) -> float | None:
    """How well the segment continues the chain: distance between the segment
    endpoints and the chain detections nearest to them in time, plus an
    appearance term - a fragment can only continue a chain whose clothing it
    matches. Segments and chains may interleave sparsely (duplicate boxes
    around the lift), so the overlap ban counts actually-shared frames, not
    the spanned range."""
    shared = sum(1 for i in seg.persons if i in chain.persons)
    if shared > CHAIN_OVERLAP_TOLERANCE:
        return None
    app_cost = 0.0
    chain_app = track_mean_app(chain)
    seg_app = track_mean_app(seg)
    if chain_app and seg_app:
        sim = app_similarity(chain_app, seg_app)
        if sim < APP_VETO_SIM:
            return None
        app_cost = APP_COST_WEIGHT * (1.0 - sim)
    chain_frames = sorted(chain.persons)
    best: float | None = None
    before = [i for i in chain_frames if i <= seg.first_seen]
    if before:
        gap = seg.first_seen - before[-1]
        if gap <= CHAIN_MAX_GAP:
            d = math.dist(center(chain.persons[before[-1]]), center(seg.persons[seg.first_seen]))
            if d <= CHAIN_DIST_GATE + CHAIN_DIST_GATE_PER_GAP * gap:
                best = d
    after = [i for i in chain_frames if i >= seg.last_seen]
    if after:
        gap = after[0] - seg.last_seen
        if gap <= CHAIN_MAX_GAP:
            d = math.dist(center(chain.persons[after[0]]), center(seg.persons[seg.last_seen]))
            if d <= CHAIN_DIST_GATE + CHAIN_DIST_GATE_PER_GAP * gap and (best is None or d < best):
                best = d
    return None if best is None else best + app_cost


def build_chains(segments: list[Track], people_expected: int) -> tuple[list[Track], list[Track]]:
    """Seed one chain per real person from long, temporally-overlapping
    segments (which must be different people), then greedily absorb the
    remaining segments closest-first in both directions. Segments that fit
    no chain are returned so the rescue pass can still use them."""
    pool = sorted(segments, key=lambda s: len(s.persons), reverse=True)
    chains: list[Track] = []
    for seg in pool:
        if len(chains) >= people_expected:
            break
        if all(segments_overlap(seg, c) >= 10 for c in chains):
            chains.append(seg)
    seeded = {id(c) for c in chains}
    remaining = [s for s in pool if id(s) not in seeded]
    while True:
        best = None
        for seg in remaining:
            for chain in chains:
                d = link_cost(chain, seg)
                if d is not None and (best is None or d < best[0]):
                    best = (d, chain, seg)
        if best is None:
            break
        d, chain, seg = best
        print(
            f"  link: segment [{seg.first_seen}-{seg.last_seen}] (n={len(seg.persons)}) "
            f"-> chain [{chain.first_seen}-{chain.last_seen}] (dist {d:.3f})"
        )
        chain.persons.update(seg.persons)
        chain.last_center = center(chain.persons[max(chain.persons)])
        chain.last_seen = max(chain.persons)
        remaining.remove(seg)
    return chains, remaining


def frame_seatedness(person: Person) -> float | None:
    """Vertical leg extent over vertical trunk extent for one detection.
    Standing ~1.6-2.2, seated in a wheelchair ~0.0-1.1 (knees near hip
    height, feet on the rest)."""
    j = person.joints
    hip, neck = j.get("hip"), j.get("neck")
    if not hip or not neck or hip.get("c", 0) < 0.2 or neck.get("c", 0) < 0.2:
        return None
    trunk_v = hip["y"] - neck["y"]
    if trunk_v < 0.02:
        return None
    ankles = [j[a] for a in ("lAnkle", "rAnkle") if j.get(a, {}).get("c", 0) > 0.2]
    if ankles:
        leg_v = sum(a["y"] for a in ankles) / len(ankles) - hip["y"]
    else:
        knees = [j[k] for k in ("lKnee", "rKnee") if j.get(k, {}).get("c", 0) > 0.2]
        if not knees:
            return None
        leg_v = (sum(k["y"] for k in knees) / len(knees) - hip["y"]) * 2.0
    return leg_v / trunk_v


def coexists_apart(frag: Track, other: Track) -> bool:
    """The two tracks were detected simultaneously at clearly different
    places for several frames - so they are provably different people."""
    shared = [i for i in frag.persons if i in other.persons]
    if len(shared) < DUPLICATE_OVERLAP_MIN:
        return False
    ds = sorted(math.dist(center(frag.persons[i]), center(other.persons[i])) for i in shared)
    return ds[len(ds) // 2] > DUPLICATE_DIST


def rescue_cost(chain: Track, frag: Track, patient: Track) -> float | None:
    """Whether a leftover fragment can extend a nurse chain.

    Interior holes (chain detections on both sides, each temporally and
    spatially close) are always eligible: the person demonstrably continues
    through the hole. Edge attachment is only eligible when the fragment is
    provably NOT the patient - it coexists with the patient track at a
    clearly different place - because at a chain's edge identity cannot be
    verified, and the one class error that must never happen is the seated
    patient being drawn as a nurse."""
    new_frames = [i for i in frag.persons if i not in chain.persons]
    if len(new_frames) < 5:
        return None
    shared = [i for i in frag.persons if i in chain.persons]
    if len(shared) > 8:
        # Long temporal coexistence with the target chain itself: a parallel
        # person, not a continuation.
        return None
    chain_app = track_mean_app(chain)
    frag_app = track_mean_app(frag)
    if chain_app and frag_app and app_similarity(chain_app, frag_app) < APP_VETO_SIM:
        return None
    chain_frames = sorted(chain.persons)
    lo, hi = min(new_frames), max(new_frames)
    before = [i for i in chain_frames if i <= lo]
    after = [i for i in chain_frames if i >= hi]
    sides = []
    if before:
        sides.append((before[-1], lo))
    if after:
        sides.append((after[0], hi))
    if not sides:
        return None
    if len(sides) < 2 and not coexists_apart(frag, patient):
        return None  # edge attach without proof the fragment is not the patient
    cost = 0.0
    for neighbor, endpoint in sides:
        gap = abs(endpoint - neighbor)
        if gap > CHAIN_MAX_GAP:
            return None
        d = math.dist(center(chain.persons[neighbor]), center(frag.persons[endpoint]))
        if d > CHAIN_DIST_GATE + CHAIN_DIST_GATE_PER_GAP * gap:
            return None
        cost = max(cost, d)
    # Interior fills are safer than edge attaches; let them win ties.
    return cost if len(sides) == 2 else cost + 0.05


def rescue_leftovers(role_tracks: list[Track], patient: Track, leftovers: list[Track]) -> None:
    """Fill coverage holes of the nurse chains with fragments and scraps
    that role assignment left unused - without this, a person the detector
    clearly saw loses their skeleton for seconds at a time. The patient
    chain is deliberately not a rescue target: its coverage was decided by
    the seated-regime logic and must not silently regrow."""
    pending = [t for t in leftovers if t.persons]
    while True:
        best = None
        for frag in pending:
            for chain in role_tracks:
                cost = rescue_cost(chain, frag, patient)
                if cost is not None and (best is None or cost < best[0]):
                    best = (cost, chain, frag)
        if best is None:
            break
        cost, chain, frag = best
        added = 0
        for i, p in frag.persons.items():
            if i not in chain.persons:
                chain.persons[i] = p
                added += 1
        chain.last_seen = max(chain.persons)
        chain.last_center = center(chain.persons[chain.last_seen])
        pending.remove(frag)
        print(
            f"  rescue: fragment [{frag.first_seen}-{frag.last_seen}] (+{added} frames) "
            f"-> chain [{chain.first_seen}-{chain.last_seen}] (dist {cost:.3f})"
        )


def seatedness(track: Track, opening_frames: int = 60) -> float | None:
    """Median frame seatedness over the track's own opening frames (roles
    are decided by how a person first appears)."""
    ratios = []
    for frame_i in sorted(track.persons)[:opening_frames]:
        ratio = frame_seatedness(track.persons[frame_i])
        if ratio is not None:
            ratios.append(ratio)
    if len(ratios) < 3:
        return None
    return median(ratios)


def trim_unseated_regime(patient: Track) -> Track | None:
    """Used only by the auto fallback: if the chosen patient chain has one
    clear change-point between a sustained unseated regime and a sustained
    seated one (a standing nurse held the track before the actual patient
    became visible, or after), keep the seated regime as the patient and
    return the removed piece so it can be chained as a nurse."""
    idxs = sorted(patient.persons)
    series = [(i, frame_seatedness(patient.persons[i])) for i in idxs]
    window = 15
    smoothed: list[tuple[int, float]] = []
    for k in range(len(series) - window + 1):
        vals = [v for _, v in series[k:k + window] if v is not None]
        if len(vals) >= window // 2:
            smoothed.append((series[k][0], median(vals)))
    if len(smoothed) < 2 * SEGMENT_MIN_FRAMES:
        return None
    best = None
    for k in range(SEGMENT_MIN_FRAMES, len(smoothed) - SEGMENT_MIN_FRAMES):
        left = median([v for _, v in smoothed[:k]])
        right = median([v for _, v in smoothed[k:]])
        gap = abs(left - right)
        if best is None or gap > best[0]:
            best = (gap, k, left, right)
    if best is None:
        return None
    _, k, left, right = best
    seated_side, unseated_side = (right, left) if left > right else (left, right)
    if unseated_side < 1.05 or seated_side > 0.85:
        return None  # no clear standing-vs-seated structure
    boundary = smoothed[k][0]
    keep_left = left <= right  # keep the seated side
    kept = {i: p for i, p in patient.persons.items() if (i < boundary) == keep_left}
    removed = {i: p for i, p in patient.persons.items() if (i < boundary) != keep_left}
    if len(kept) < SEGMENT_MIN_FRAMES or len(removed) < SEGMENT_MIN_FRAMES:
        return None
    print(
        f"  fallback patient trimmed to its seated regime: kept [{min(kept)}-{max(kept)}] "
        f"(seatedness {seated_side:.2f}), released [{min(removed)}-{max(removed)}] "
        f"(seatedness {unseated_side:.2f}) to the nurses"
    )
    patient.persons = kept
    patient.last_seen = max(kept)
    patient.last_center = center(kept[patient.last_seen])
    released = Track(tid=-1)
    for i, p in removed.items():
        released.persons[i] = p
    released.last_seen = max(removed)
    released.last_center = center(removed[released.last_seen])
    return released


def union_track(segments: list[Track]) -> Track:
    merged = Track(tid=segments[0].tid)
    for seg in segments:
        for i, person in seg.persons.items():
            existing = merged.persons.get(i)
            if existing is None or person.confidence > existing.confidence:
                merged.persons[i] = person
    merged.last_seen = max(merged.persons)
    merged.last_center = center(merged.persons[merged.last_seen])
    return merged


def assign_roles(
    segments: list[Track],
    n_frames: int,
    patient_mode: str,
    nurse_count: int,
    seated_threshold: float,
) -> tuple[Track, list[Track]]:
    """Patient-hood is decided per segment from posture (the patient is the
    seated person: in the wheelchair, carried, or on the bed), because during
    the lift everyone converges and spatial continuity alone cannot tell the
    carried patient from the nurse carrying them."""
    if len(segments) < 2:
        raise SystemExit(
            f"Only {len(segments)} stable person segment(s) found; need at least a patient and one nurse."
        )

    def window_x(track: Track) -> float:
        return median([center(track.persons[i])[0] for i in sorted(track.persons)[:60]])

    scored = [(seatedness(s), s) for s in segments]
    print(
        "Segment seatedness (leg/trunk vertical ratio; < "
        + f"{seated_threshold:.2f} = seated/patient): "
        + ", ".join(
            f"[{s.first_seen}-{s.last_seen}]={'?' if sc is None else format(sc, '.2f')}" for sc, s in scored
        )
    )

    patient: Track | None = None
    nurse_segments = [s for _, s in scored]
    min_presence = max(3, int(n_frames * 0.08))
    if patient_mode in ("auto", "seated"):
        seated = sorted(
            [(sc, s) for sc, s in scored if sc is not None and sc < seated_threshold],
            key=lambda item: item[0],
        )
        accepted: list[Track] = []
        for sc, seg in seated:
            def coexists_elsewhere(other: Track) -> bool:
                shared = [i for i in seg.persons if i in other.persons]
                if len(shared) <= DUPLICATE_OVERLAP_MIN:
                    return False
                ds = sorted(math.dist(center(seg.persons[i]), center(other.persons[i])) for i in shared)
                return ds[len(ds) // 2] > DUPLICATE_DIST
            if any(coexists_elsewhere(other) for other in accepted):
                print(f"  seated segment [{seg.first_seen}-{seg.last_seen}] coexists with a more-seated one; treating as nurse")
                continue
            accepted.append(seg)
        if accepted:
            patient = union_track(accepted)
            accepted_ids = {id(s) for s in accepted}
            nurse_segments = [s for s in nurse_segments if id(s) not in accepted_ids]
            print(
                "Patient = union of seated segments: "
                + ", ".join(f"[{s.first_seen}-{s.last_seen}]" for s in accepted)
            )
        elif patient_mode == "seated":
            raise SystemExit("No seated segment found; try --patient middle/left/right.")
    leftovers: list[Track] = []
    if patient is None:
        chains, unchained = build_chains(list(segments), nurse_count + 1)
        leftovers.extend(unchained)
        ordered = sorted(chains, key=window_x)
        if patient_mode == "left":
            patient = ordered[0]
        elif patient_mode == "right":
            patient = ordered[-1]
        elif patient_mode == "auto" and len(chains) >= 2:
            # No segment cleared the seated threshold - a high camera angle
            # inflates the leg/trunk ratio, so the absolute cutoff misses a
            # genuinely seated patient. Fall back to relative ranking with
            # camera-angle-independent signals of the cared-for person:
            # most seated posture, smallest median height (seated people are
            # short in the image), least-visible ankles (legs hidden by the
            # wheelchair, bed, or blanket), and highest presence (the care
            # recipient stays in the scene; nurses walk in and out).
            def signals(track: Track) -> tuple[float | None, float, float, float]:
                idxs = sorted(track.persons)
                heights = [person_height(track.persons[i]) for i in idxs]
                ankle_conf = [
                    max(
                        track.persons[i].joints.get("lAnkle", {}).get("c", 0.0),
                        track.persons[i].joints.get("rAnkle", {}).get("c", 0.0),
                    )
                    for i in idxs
                ]
                presence = len(idxs) / max(n_frames, 1)
                return seatedness(track), median(heights), median(ankle_conf), presence

            ranked = [(signals(c), c) for c in chains]
            rank_score = {id(c): 0.0 for c in chains}
            with_seat = [(sig, c) for sig, c in ranked if sig[0] is not None]
            for i, (_, c) in enumerate(sorted(with_seat, key=lambda r: r[0][0])):
                rank_score[id(c)] += i
            for sig, c in ranked:
                if sig[0] is None:
                    rank_score[id(c)] += (len(with_seat) - 1) / 2 if with_seat else 0
            for i, (_, c) in enumerate(sorted(ranked, key=lambda r: r[0][1])):
                rank_score[id(c)] += i
            for i, (_, c) in enumerate(sorted(ranked, key=lambda r: r[0][2])):
                rank_score[id(c)] += i
            for i, (_, c) in enumerate(sorted(ranked, key=lambda r: -r[0][3])):
                rank_score[id(c)] += i
            patient = min(chains, key=lambda c: rank_score[id(c)])
            sig = next(s for s, c in ranked if c is patient)
            print(
                "No seated segment below threshold; patient = best combined rank "
                + f"[{patient.first_seen}-{patient.last_seen}] (seatedness "
                + f"{'?' if sig[0] is None else format(sig[0], '.2f')}, median height {sig[1]:.2f}, "
                + f"ankle visibility {sig[2]:.2f}, presence {sig[3]:.2f})"
            )
            released = trim_unseated_regime(patient)
            if released is not None:
                chains.append(released)
        else:
            patient = ordered[len(ordered) // 2]
        nurse_segments = [c for c in chains if c is not patient]

    all_chains, unchained = build_chains(nurse_segments, nurse_count)
    leftovers.extend(unchained)
    nurses = [t for t in all_chains if len(t.persons) >= min_presence][:nurse_count]
    leftovers.extend(t for t in all_chains if t not in nurses)
    nurses.sort(key=window_x)
    print(
        f"Roles: patient ({len(patient.persons)} frames), "
        + ", ".join(f"nurse{i or ''} ({len(t.persons)} frames)" for i, t in enumerate(nurses, start=0))
    )
    return patient, nurses, leftovers


# ---------------------------------------------------------------------------
# Cleaning: hold roles through short occlusions, reject per-joint outliers,
# then EMA-smooth. All of it happens per role, after identities are fixed.
# ---------------------------------------------------------------------------


def role_sequence(track: Track, n_frames: int) -> list[Person | None]:
    seq: list[Person | None] = [None] * n_frames
    held: Person | None = None
    held_for = 0
    for i in range(n_frames):
        person = track.persons.get(i)
        if person is not None:
            seq[i] = person
            held = person
            held_for = 0
        elif held is not None and held_for < ROLE_HOLD_FRAMES:
            held_for += 1
            seq[i] = Person(
                joints={k: dict(v) for k, v in held.joints.items()},
                confidence=held.confidence * 0.9,
            )
            held = seq[i]
    return seq


def clean_sequence(seq: list[Person | None]) -> list[Person | None]:
    prev: Person | None = None
    for person in seq:
        if person is None:
            continue
        if prev is not None:
            jump_gate = 0.30 * max(person_height(prev), 0.15)
            for name in DEMO_JOINTS:
                now = person.joints.get(name, empty_point())
                old = prev.joints.get(name, empty_point())
                if old.get("c", 0.0) > 0.02:
                    if now.get("c", 0.0) < JOINT_HOLD_CONFIDENCE:
                        person.joints[name] = {**old, "c": old.get("c", 0.0) * 0.9}
                        continue
                    jumped = math.dist((now["x"], now["y"]), (old["x"], old["y"])) > jump_gate
                    # Re-acquisition after a hold (or a detector glitch) eases in
                    # instead of snapping; a persistent detection still wins
                    # within a few frames, so a stale hold can never lock.
                    alpha = 0.35 if jumped else SMOOTH_ALPHA
                    now["x"] = alpha * now["x"] + (1 - alpha) * old["x"]
                    now["y"] = alpha * now["y"] + (1 - alpha) * old["y"]
                person.joints[name] = now
        prev = person
    return seq


# H36M-17 lifter output -> the demo's 13 joints. The pelvis root becomes
# "hip" (legs connect from the center, same as the 2D skeleton); thorax
# stands in for "neck" (the 2D neck is also the shoulder midpoint).
H36M_TO_DEMO = {
    "head": 10, "neck": 8,
    "lShoulder": 11, "rShoulder": 14, "lElbow": 12, "rElbow": 15,
    "lWrist": 13, "rWrist": 16,
    "hip": 0, "lKnee": 5, "rKnee": 2, "lAnkle": 6, "rAnkle": 3,
}
LIFT_MAX_CHUNK = 243  # MotionBERT's training window
LIFT_MAX_GAP = 10  # split a role's sequence where detections have a hole
LIFT_MIN_RUN = 5


def lift_tracks_3d(
    role_tracks: list[tuple[str, Track]],
    lifter_config: Path,
    lifter_checkpoint: Path,
) -> dict[str, dict[int, dict[str, list[float]]]]:
    """Lift each role's raw 2D COCO keypoint sequences to root-relative 3D
    (meters, y down, pelvis at the origin) with MotionBERT. Sequences are
    fed whole (chunked at the model's 243-frame training window) so the
    lifter keeps its temporal context; only frames with a real detection
    are lifted - held/bridged frames carry no raw keypoints."""
    import inspect

    import numpy as np
    import torch
    import numpy.core.multiarray

    # The official checkpoint pickles a few numpy objects; allowlist exactly
    # those instead of disabling torch's weights_only protection.
    safe = [numpy.core.multiarray._reconstruct, numpy.core.multiarray.scalar,
            np.ndarray, np.dtype, bytes]
    safe += [obj for _, obj in inspect.getmembers(np.dtypes) if isinstance(obj, type)]
    torch.serialization.add_safe_globals(safe)

    from mmengine.dataset import Compose, pseudo_collate
    from mmpose.apis import convert_keypoint_definition, init_model

    lifter = init_model(str(lifter_config), str(lifter_checkpoint), device="cpu")
    pipeline = Compose(lifter.cfg.test_dataloader.dataset.pipeline)
    stats = lifter.dataset_meta["stats_info"]
    bbox_center, bbox_scale = stats["bbox_center"], stats["bbox_scale"]
    # Each person's 2D keypoints are re-normalized into the dataset's canonical
    # bbox (bbox_center/bbox_scale), so their coordinate space is H36M's native
    # ~1000x1000 image regardless of the real video size. The codec then does a
    # second normalization by camera w/h - which therefore must be that fixed
    # H36M frame size, NOT the video's. Passing the video size here double-
    # normalizes and collapses the lift (compressed trunk, asymmetric limbs).
    h36m_w, h36m_h = 1000.0, 1000.0

    lifted: dict[str, dict[int, dict[str, list[float]]]] = {}
    for role, track in role_tracks:
        available = [(i, track.persons[i]) for i in sorted(track.persons) if track.persons[i].coco]
        runs: list[list[tuple[int, Person]]] = []
        run: list[tuple[int, Person]] = []
        prev = None
        for i, person in available:
            if prev is not None and i - prev > LIFT_MAX_GAP:
                runs.append(run)
                run = []
            run.append((i, person))
            prev = i
        if run:
            runs.append(run)

        role_out: dict[int, dict[str, list[float]]] = {}
        chunks = 0
        for run in runs:
            if len(run) < LIFT_MIN_RUN:
                continue
            # Clean the whole run before chunking. RTMPose emits coordinates
            # for every joint regardless of confidence, and occluded joints
            # (a wheelchair patient's legs, hands behind a person) carry
            # garbage positions - feeding those as trusted input wrecked the
            # lift. Low-confidence coordinates are temporally interpolated
            # from confident sightings of the same joint, and the real
            # scores go to the model as visibility (its test codec has
            # concat_vis=True, so it consumes them at inference).
            arr = np.array([person.coco for _, person in run], dtype=np.float32)
            coords = arr[:, :, :2]
            scores = arr[:, :, 2]
            t_axis = np.arange(len(run), dtype=np.float32)
            ever_good = np.zeros(arr.shape[1], dtype=bool)
            for j in range(arr.shape[1]):
                good = scores[:, j] >= 0.25
                ever_good[j] = bool(good.any())
                if good.any() and not good.all():
                    for c in range(2):
                        coords[:, j, c] = np.interp(t_axis, t_axis[good], coords[good, j, c])
            h36m = convert_keypoint_definition(
                np.concatenate([coords, scores[..., None]], axis=2), "coco", "h36m")
            h36m_xy = h36m[:, :, :2]
            h36m_vis = np.clip(h36m[:, :, 2], 0.05, 1.0).astype(np.float32)
            box_joints = coords[:, ever_good, :] if ever_good.any() else coords

            run_poses: list[tuple[int, Any]] = []
            for start in range(0, len(run), LIFT_MAX_CHUNK):
                chunk = run[start:start + LIFT_MAX_CHUNK]
                seq = []
                for k in range(start, start + len(chunk)):
                    kpts = box_joints[k]
                    x0, y0 = kpts.min(0)
                    x1, y1 = kpts.max(0)
                    box_center = np.array([(x0 + x1) / 2, (y0 + y1) / 2])
                    box_scale = max(x1 - x0, y1 - y0, 1e-3)
                    seq.append((h36m_xy[k] - box_center) / box_scale * bbox_scale + bbox_center)
                kp2d = np.stack(seq).astype(np.float32)
                n, k = kp2d.shape[:2]
                data_info = dict(
                    keypoints=kp2d,
                    keypoints_visible=h36m_vis[start:start + n],
                    lifting_target=np.zeros((n, k, 3), dtype=np.float32),
                    lifting_target_visible=np.ones((n, k, 1), dtype=np.float32),
                    factor=np.zeros((n,), dtype=np.float32),
                    camera_param=dict(w=h36m_w, h=h36m_h),
                )
                data_info.update(lifter.dataset_meta)
                batch = pseudo_collate([pipeline(data_info)])
                with torch.no_grad():
                    results = lifter.test_step(batch)
                poses = np.asarray(results[0].pred_instances.keypoints)
                poses = poses[0] if poses.ndim == 4 else poses
                for (i, _), pose in zip(chunk, poses):
                    run_poses.append((i, pose))
                chunks += 1
            # Light EMA smoothing across the run: raw per-frame lifts jitter,
            # and unlike the 2D path there is no downstream cleaning here.
            smoothed = None
            for i, pose in run_poses:
                smoothed = pose if smoothed is None else 0.55 * smoothed + 0.45 * pose
                role_out[i] = {
                    name: [round(float(smoothed[j][0]), 3), round(float(smoothed[j][1]), 3), round(float(smoothed[j][2]), 3)]
                    for name, j in H36M_TO_DEMO.items()
                }
        lifted[role] = role_out
        print(f"  lifted {role}: {len(role_out)} frames in {chunks} chunk(s)", flush=True)
    return lifted


def compose_frames(
    raw_frames: list[dict[str, Any]],
    patient_track: Track,
    nurse_tracks: list[Track],
    duration: float,
    lifted: dict[str, dict[int, dict[str, list[float]]]] | None = None,
) -> list[dict[str, Any]]:
    n = len(raw_frames)
    patient_seq = clean_sequence(role_sequence(patient_track, n))
    nurse_seqs = [clean_sequence(role_sequence(t, n)) for t in nurse_tracks]
    role_names = ["nurse", "nurse2", "nurse3"]

    frames: list[dict[str, Any]] = []
    for i, raw in enumerate(raw_frames):
        patient = patient_seq[i]
        nurses = [seq[i] for seq in nurse_seqs]
        if patient is None and not any(nurses):
            continue
        t = raw["time"]
        frame: dict[str, Any] = {
            "frameIndex": raw["frameIndex"],
            "time": t,
            "phase": phase_at(t / duration if duration else 0.0),
            "patientFeedback": "unknown",
        }
        if patient is not None:
            frame["patient"] = patient.joints
        for name, person in zip(role_names, nurses):
            if person is not None:
                frame[name] = person.joints
        if lifted:
            pose3d = {}
            for role in ["patient"] + role_names:
                if role in frame and i in lifted.get(role, {}):
                    pose3d[role] = lifted[role][i]
            if pose3d:
                frame["pose3d"] = pose3d
        frames.append(frame)
    return frames


def dedup_people(people: list[Person]) -> list[Person]:
    """The detector often emits several boxes for one person; keep the most
    confident detection per spatial cluster."""
    people = sorted(people, key=lambda p: p.confidence, reverse=True)
    kept: list[Person] = []
    for person in people:
        c = center(person)
        if all(math.dist(c, center(k)) > DEDUP_RADIUS for k in kept):
            kept.append(person)
        if len(kept) >= MAX_PEOPLE_PER_FRAME:
            break
    return kept


def postprocess(
    raw_frames: list[dict[str, Any]],
    args: argparse.Namespace,
    width: int,
    height: int,
    duration: float,
    engine: str,
) -> dict[str, Any]:
    people_per_frame = [[parse_raw_person(entry) for entry in raw["people"]] for raw in raw_frames]
    people_per_frame = [
        dedup_people([
            p for p in people
            if p.confidence >= MIN_PERSON_CONFIDENCE and person_height(p) >= MIN_PERSON_HEIGHT
        ])
        for people in people_per_frame
    ]
    raw_segments, scraps = split_segments(build_tracks(people_per_frame))
    segments = merge_duplicate_segments(split_appearance_switches(raw_segments))
    print(f"Found {len(segments)} clean person segment(s) over {len(raw_frames)} processed frames")
    patient_track, nurse_tracks, leftovers = assign_roles(
        segments, len(raw_frames), args.patient, args.nurses, args.seated_threshold
    )
    rescue_leftovers(nurse_tracks, patient_track, leftovers + scraps)
    lifted = None
    lifter_model = None
    if getattr(args, "lift3d", False):
        config = Path(args.lifter_config)
        checkpoint = Path(args.lifter_checkpoint)
        if config.exists() and checkpoint.exists():
            role_tracks = [("patient", patient_track)] + [
                (name, track) for name, track in zip(["nurse", "nurse2", "nurse3"], nurse_tracks)
            ]
            print("Lifting 2D sequences to 3D (MotionBERT)...", flush=True)
            lifted = lift_tracks_3d(role_tracks, config, checkpoint)
            lifter_model = config.stem
        else:
            print(f"3D lifting skipped: model files not found ({config}, {checkpoint}). "
                  "Download them with: python -m mim download mmpose "
                  "--config motionbert_dstformer-ft-243frm_8xb32-120e_h36m --dest .venv-pose/models")
    frames = compose_frames(raw_frames, patient_track, nurse_tracks, duration, lifted)
    return {
        "source": str(args.video),
        "engine": engine,
        "pose2d": getattr(args, "pose2d", None),
        "pose3d": lifter_model,
        "pose3dUnits": "meters, root-relative, y down" if lifter_model else None,
        "width": width,
        "height": height,
        "duration": duration,
        "roles": {"patient": args.patient, "nurses": len(nurse_tracks)},
        "joints": DEMO_JOINTS,
        "frames": frames,
    }


# ---------------------------------------------------------------------------
# Inference front-ends
# ---------------------------------------------------------------------------


def normalize_predictions(predictions: Any) -> list[dict[str, Any]]:
    if isinstance(predictions, list) and len(predictions) == 1 and isinstance(predictions[0], list):
        predictions = predictions[0]
    if isinstance(predictions, dict):
        predictions = [predictions]
    return [p for p in predictions or [] if isinstance(p, dict)]


def open_video_upright(cv2: Any, video: Path) -> tuple[Any, Any]:
    """Open a capture whose frames match what a browser displays: phone
    footage often carries a 90/180/270-degree rotation tag that browsers
    honor but OpenCV ignores by default, which would make every person lie
    sideways for the pose model and misplace every keypoint in the overlay.
    Returns (capture, manual_rotate) - manual_rotate is a cv2.ROTATE_* code
    to apply per frame when the backend cannot auto-rotate itself."""
    cap = cv2.VideoCapture(str(video))
    if not cap.isOpened():
        raise SystemExit(f"Could not open video: {video}")
    try:
        rotation = int(cap.get(cv2.CAP_PROP_ORIENTATION_META) or 0) % 360
    except Exception:
        rotation = 0
    manual_rotate = None
    if rotation:
        auto_applied = False
        try:
            cap.set(cv2.CAP_PROP_ORIENTATION_AUTO, 1)
            auto_applied = cap.get(cv2.CAP_PROP_ORIENTATION_AUTO) == 1
        except Exception:
            auto_applied = False
        if not auto_applied:
            # Same angle convention as OpenCV's own auto-rotation.
            manual_rotate = {
                90: cv2.ROTATE_90_CLOCKWISE,
                180: cv2.ROTATE_180,
                270: cv2.ROTATE_90_COUNTERCLOCKWISE,
            }.get(rotation)
        print(
            f"Rotation metadata: {rotation} deg - frames are rotated upright "
            + ("by OpenCV" if auto_applied else "manually" if manual_rotate else "(unsupported angle, left as-is)")
        )
    return cap, manual_rotate


def run_rtmpose_inference(args: argparse.Namespace) -> tuple[list[dict[str, Any]], int, int]:
    try:
        from mmpose.apis import MMPoseInferencer
    except Exception as exc:
        raise SystemExit(
            f"Failed to import MMPose ({type(exc).__name__}: {exc}). "
            "Ensure MMPose/RTMPose and a full 'mmcv' (with compiled ops, not 'mmcv-lite') "
            "are installed. See README_pose.md."
        ) from exc
    import cv2

    inferencer = MMPoseInferencer(pose2d=args.pose2d, device=args.device)
    cap, manual_rotate = open_video_upright(cv2, args.video)
    fps = cap.get(cv2.CAP_PROP_FPS) or args.video_fps

    raw_frames: list[dict[str, Any]] = []
    width = height = 0
    frame_idx = 0
    while True:
        if not cap.grab():
            break
        if frame_idx % args.stride == 0:
            ok, image = cap.retrieve()
            if not ok:
                break
            if manual_rotate is not None:
                image = cv2.rotate(image, manual_rotate)
            # Normalize by the decoded frame itself, not by container
            # metadata: this is the pixel grid the model actually saw, so
            # the keypoints always line up with the displayed video.
            height, width = image.shape[:2]
            result = next(inferencer(image, show=False, return_vis=False))
            people = []
            for pred in normalize_predictions(result.get("predictions")):
                keypoints = pred.get("keypoints") or pred.get("transformed_keypoints")
                scores = pred.get("keypoint_scores") or pred.get("keypoints_visible") or []
                if keypoints:
                    people.append({
                        "joints": coco_to_demo(keypoints, scores, width, height).joints,
                        "app": torso_descriptor(cv2, image, keypoints, scores),
                        # Raw COCO-17 pixels kept for the optional 3D lifting
                        # stage, which needs separate hips and the face points
                        # that the 13-joint demo format merges away.
                        "coco": [
                            [round(float(kp[0]), 1), round(float(kp[1]), 1),
                             round(float(scores[k]), 3) if k < len(scores) else 1.0]
                            for k, kp in enumerate(keypoints[:17])
                        ],
                    })
            raw_frames.append({"frameIndex": frame_idx, "time": frame_idx / fps, "people": people})
            if len(raw_frames) % 25 == 0:
                print(f"  inferred {len(raw_frames)} frames (video frame {frame_idx})", flush=True)
            if args.max_frames and len(raw_frames) >= args.max_frames:
                break
        frame_idx += 1
    cap.release()
    return raw_frames, width, height


# Bumped when the raw-detection format changes (2: rotation-aware frames
# normalized by decoded frame size; 3: adds per-person appearance
# descriptors; 4: adds raw COCO-17 pixel keypoints for 3D lifting).
# Older caches are re-inferred, not reused.
RAW_CACHE_FORMAT = 4


def extract_rtmpose(args: argparse.Namespace) -> dict[str, Any]:
    meta_width, meta_height, duration, _ = video_info(args.video)
    cache = Path(args.raw_cache) if args.raw_cache else None
    cached = None
    if cache and cache.exists():
        data = json.loads(cache.read_text())
        if data.get("format") == RAW_CACHE_FORMAT and data.get("width") and data.get("height"):
            print(f"Loading raw detections from cache: {cache}")
            cached = data
        else:
            print(f"Ignoring raw cache with outdated format: {cache}")
    if cached is not None:
        raw_frames = cached["frames"]
        width, height = int(cached["width"]), int(cached["height"])
    else:
        raw_frames, width, height = run_rtmpose_inference(args)
        if not raw_frames:
            raise SystemExit(f"No frames decoded from video: {args.video}")
        if cache:
            cache.parent.mkdir(parents=True, exist_ok=True)
            cache.write_text(json.dumps({
                "format": RAW_CACHE_FORMAT,
                "video": str(args.video),
                "width": width,
                "height": height,
                "frames": raw_frames,
            }))
            print(f"Raw detections cached to: {cache}")
    if (width, height) != (meta_width, meta_height):
        print(f"Container metadata says {meta_width}x{meta_height}; using decoded frame size {width}x{height} (rotation applied)")
    return postprocess(raw_frames, args, width, height, duration, "rtmpose/mmpose")


def extract_openpose(args: argparse.Namespace) -> dict[str, Any]:
    width, height, duration, fps = video_info(args.video)
    files = sorted(Path(args.json_dir).glob("*.json"))
    raw_frames: list[dict[str, Any]] = []
    for file_index, path in enumerate(files):
        if args.stride > 1 and file_index % args.stride != 0:
            continue
        if args.max_frames and len(raw_frames) >= args.max_frames:
            break
        data = json.loads(path.read_text())
        people = [
            openpose_to_demo(person.get("pose_keypoints_2d", []), width, height).joints
            for person in data.get("people", [])
            if person.get("pose_keypoints_2d")
        ]
        raw_frames.append({"frameIndex": file_index, "time": file_index / (fps or args.video_fps), "people": people})
    return postprocess(raw_frames, args, width, height, duration, "openpose-json")


def add_common_args(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("--video", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument(
        "--patient",
        choices=["auto", "seated", "left", "middle", "right"],
        default="auto",
        help="How to pick the patient among tracked people. auto/seated = the most-seated person (wheelchair).",
    )
    parser.add_argument("--nurses", type=int, default=2, help="How many nurses to keep (default 2).")
    parser.add_argument(
        "--seated-threshold",
        type=float,
        default=0.75,
        help="Leg/trunk vertical ratio below which a segment counts as the seated patient.",
    )
    parser.add_argument("--stride", type=int, default=6, help="Process every Nth video frame.")
    parser.add_argument(
        "--lift3d", action="store_true",
        help="Also lift each role's 2D sequence to root-relative 3D with MotionBERT "
             "(adds a per-frame 'pose3d' block to the output JSON).")
    default_models = Path(__file__).resolve().parent.parent / ".venv-pose" / "models"
    parser.add_argument(
        "--lifter-config", type=Path,
        default=default_models / "motionbert_dstformer-ft-243frm_8xb32-120e_h36m.py")
    parser.add_argument(
        "--lifter-checkpoint", type=Path,
        default=default_models / "motionbert_ft_h36m-d80af323_20230531.pth")
    parser.add_argument("--video-fps", type=float, default=30.0, help="Fallback FPS if the container reports none.")
    parser.add_argument("--max-frames", type=int, default=0)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Extract patient-transfer keypoints for the browser demo.")
    sub = parser.add_subparsers(dest="command", required=True)

    rtmpose = sub.add_parser("rtmpose", help="Run RTMPose through MMPoseInferencer.")
    add_common_args(rtmpose)
    rtmpose.add_argument(
        "--pose2d",
        default="rtmpose-m_8xb256-420e_coco-256x192",
        help="MMPose model alias or config name (bare 'rtmpose-m' is not a valid alias).",
    )
    rtmpose.add_argument("--device", default="cpu", help="cpu or cuda:0 (mps is unsupported: NMS has no Metal kernel).")
    rtmpose.add_argument(
        "--raw-cache",
        default=None,
        help="Optional JSON path to cache raw per-frame detections so role/cleaning tweaks skip inference.",
    )

    openpose = sub.add_parser("openpose", help="Convert OpenPose --write_json output.")
    add_common_args(openpose)
    openpose.add_argument("--json-dir", type=Path, required=True)

    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    if args.command == "rtmpose":
        output = extract_rtmpose(args)
    elif args.command == "openpose":
        output = extract_openpose(args)
    else:
        raise SystemExit(f"Unknown command: {args.command}")

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(output, indent=2))
    n_two_nurse = sum(1 for f in output["frames"] if "nurse2" in f)
    print(f"Wrote {len(output['frames'])} frames to {args.output} ({n_two_nurse} frames with both nurses)")


if __name__ == "__main__":
    main()

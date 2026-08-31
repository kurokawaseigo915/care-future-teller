# Pose Extraction For The Patient Transfer Demo

The extractor supports patient-transfer footage with **three people**: two
nurses and one patient. It tracks every detected person across the whole video,
merges tracks broken by short occlusions, and only then assigns roles so
nurse/patient identities do not swap between frames. Source footage is not
included in the public repository.

The browser demo expects keypoints in:

```text
assets/sample-keypoints.json
```

Pressing `Load anonymized demo` loads:

```text
assets/sample-keypoints.json
```

## Option A: RTMPose with MMPose

RTMPose is recommended for this demo because it is real-time and multi-person. MMPose provides `MMPoseInferencer`, a unified inference interface for images and videos.

Create a separate environment on your Mac or GPU machine:

```sh
python3 -m venv .venv-pose
source .venv-pose/bin/activate
pip install -U pip
pip install openmim
mim install mmengine
mim install "mmcv>=2.0.0,<2.2.0"
pip install "mmpose>=1.3.0" "mmdet>=3.0.0" opencv-python certifi
```

**Apple Silicon note:** OpenMMLab publishes no prebuilt full-`mmcv` wheel for macOS arm64, so `mim install mmcv` may install `mmcv-lite`, which has **no compiled ops** (`mmcv._ext`). MMPose fails to import without them. Build the full package from source instead (needs Xcode command line tools: `xcode-select --install`):

```sh
pip uninstall -y mmcv-lite
MMCV_WITH_OPS=1 pip install --no-build-isolation --no-binary mmcv "mmcv==2.1.0"
```

If the python.org build of Python raises `CERTIFICATE_VERIFY_FAILED` while downloading model weights, either run `/Applications/Python\ 3.x/Install\ Certificates.command` once, or point OpenSSL at certifi for the run:

```sh
export SSL_CERT_FILE="$(python3 -c 'import certifi; print(certifi.where())')"
```

Then run:

```sh
python3 scripts/extract_keypoints.py rtmpose \\
  --video path/to/transfer-video.mp4 \\
  --output assets/sample-keypoints.json \\
  --pose2d rtmpose-m_8xb256-420e_coco-256x192 \\
  --device cpu \\
  --patient auto \\
  --nurses 2 \\
  --stride 6 \\
  --raw-cache /tmp/raw-detections.json
```

`--raw-cache` stores the raw per-frame detections; re-running with the same
cache path skips inference entirely, so tracking/role parameters can be tuned
in seconds instead of re-running the model.

Use `--device cuda:0` on an NVIDIA GPU. `--device mps` does **not** work for this top-down pipeline: the person detector's NMS op has no Metal kernel (`nms_impl: implementation for device mps:0 not found`), so use `cpu` on Apple Silicon. The model alias `rtmpose-m` is not registered in MMPose 1.3.x; pass the full config name `rtmpose-m_8xb256-420e_coco-256x192` (COCO 17-keypoint, which matches this script's joint mapping).

## Automatic extraction from the browser ("Load my video")

With the environment above in place, `npm run dev` also exposes the extractor
as a local service, used by the `Load my video` button:

- `POST /api/extract` - raw video bytes in the body. The file is stored
  content-addressed (sha256) under `assets/uploads/`, so the same video is
  never extracted twice; the response is the job state as JSON.
- `GET /api/extract/<id>` - job status: `queued`, `running` (with `progress`
  0..1 and a message like `inferred 120 of ~345 frames`), `done` (with the
  `keypoints` URL), or `error`.

Jobs run one at a time (RTMPose on CPU saturates the machine) with the same
parameters as the manual command above, including a per-video `--raw-cache`.
Environment knobs for `npm run dev`:

- `EXTRACT_STRIDE` (default: fps-adaptive) - process every Nth frame. When
  unset, the stride is chosen per video as ~5 processed frames per second
  (30 fps -> 6, 8 fps -> 2), so low-fps phone footage still gets tracking
  dense enough for role assignment.
- `EXTRACT_DEVICE` (default `cpu`) - e.g. `cuda:0` on an NVIDIA machine.
- `EXTRACT_PATIENT` (default `auto`) - `left`/`middle`/`right` force which
  person is the patient when the automatic assignment gets a video wrong.
- `EXTRACT_MAX_FRAMES` (default 0 = all) - cap processed frames, for quick tests.
- `EXTRACT_TIMEOUT_MS` (default 45 min) - kill a stuck extraction.

Phone footage with 90/180/270-degree rotation metadata (typical portrait
recordings) is handled: frames are rotated upright before inference, and
keypoints are normalized against the decoded frame size, so the overlay
matches what the browser displays. Output and cache file names carry the
pipeline version and parameters, so results from older pipeline versions or
truncated test runs are never reused.

## 3D lifting (MotionBERT)

With `--lift3d` (the dev server passes it by default; disable with
`EXTRACT_3D=0`), each role's raw 2D keypoint sequence is lifted to 3D with
MotionBERT after role assignment. Download the model once:

```sh
python -m mim download mmpose \
  --config motionbert_dstformer-ft-243frm_8xb32-120e_h36m \
  --dest .venv-pose/models
```

Sequences are fed whole (chunked at the model's 243-frame training window)
so the lifter keeps its temporal context. Before lifting, each role's raw
COCO keypoints are cleaned: joints below 0.25 confidence (an occluded
patient's legs, hands behind a body) are temporally interpolated from
confident sightings rather than fed as trusted garbage, the real scores go
to the model as visibility, and the lifted output is lightly EMA-smoothed.
Only frames with a real detection are lifted.

Each person's 2D keypoints are re-normalized into the lifter's canonical
bbox (H36M's ~1000x1000 space) so the lift is invariant to how large the
person appears in frame; the codec's own normalization must then use that
fixed H36M frame size, **not** the video's - passing the video size double-
normalizes and collapses the skeleton (compressed trunk, asymmetric limbs).

The output JSON gains a per-frame `pose3d` block per role with the same 13
joint names, in meters, root-relative (pelvis at the origin, y down). The
per-person proportions are anatomically correct (trunk ~0.6-0.7 m, symmetric
limbs); the one caveat inherent to single-camera 3D is that depth *between*
people is not measurable, so the browser lays figures out by their 2D
positions on a shared ground plane. The browser uses `pose3d` only for the
rotatable replay view; risk scoring stays on the 2D geometry.

## Option B: OpenPose JSON Conversion

If you already have OpenPose installed, first generate per-frame JSON:

```sh
openpose.bin \\
  --video path/to/transfer-video.mp4 \\
  --write_json openpose_output \\
  --display 0 \\
  --render_pose 0 \\
  --model_pose BODY_25
```

Then convert it:

```sh
python scripts/extract_keypoints.py openpose \\
  --json-dir openpose_output \\
  --video path/to/transfer-video.mp4 \\
  --output assets/sample-keypoints.json \\
  --patient auto \\
  --stride 6
```

## Role Assignment

The pipeline is: filter -> track -> segment -> classify -> chain.

1. Detections are filtered (min confidence, min skeleton height to reject the
   tiny false skeletons the detector finds in wall photos) and deduplicated
   (the detector often emits several boxes for one person). Each detection
   also carries an appearance descriptor - an HSV color histogram of the
   torso crop (the clothing).
2. A nearest-center tracker with a short expiry produces pure single-person
   segments; overlapping duplicates are folded together. The frame-to-frame
   matching itself is purely spatial (every appearance-based variant tried
   here handed a track to the wrong person during heavy occlusion, when the
   torso crop fills with bedding or another body), but segments whose
   clothing colors flip mid-way and stay flipped - a tracker swap that
   slipped through - are split at the flip.
3. Each segment is classified by posture: the leg/trunk vertical ratio is
   ~1.6-2.2 for a standing person and ~0.0-1.1 for someone seated in a
   wheelchair, carried, or lying on a bed. With `--patient auto` (default),
   every segment below `--seated-threshold` (0.75) is the patient - this is
   what survives the lift, when all three people converge and spatial
   continuity alone cannot tell the carried patient from the carrying nurse.
   When no segment clears the threshold (a high camera angle inflates the
   ratio, and a patient behind a wheelchair back may have no visible legs at
   all), the patient is instead the person with the best combined rank of:
   most-seated posture, smallest median height, least-visible ankles (legs
   hidden by the chair, bed, or blanket), and highest presence across the
   video (the care recipient stays in the scene; caregivers walk in and out).
   The chain this fallback picks is then trimmed to its seated regime: if
   its windowed seatedness has one clear change-point between a sustained
   standing stretch and a sustained seated one, only the seated side stays
   the patient - a standing caregiver may have held the same track before
   the actual patient became visible - and the standing side is released to
   the nurse chains.
4. The remaining segments are chained into `--nurses` (default 2) nurse
   identities by closest-endpoint linking, with temporal overlap forbidden
   (two segments that coexist must be different people) and appearance
   checked - a fragment can only continue a chain whose clothing it matches.
5. Fragments and scraps that role assignment left unused are rescued into
   the nurse chains so a person the detector clearly saw does not lose
   their skeleton: interior coverage holes (chain detections close by on
   both sides) are always fillable, while edge attachments additionally
   require proof that the fragment is not the patient (it must coexist
   with the patient track at a clearly different place). The patient chain
   is never a rescue target.
6. Per role, short occlusions are bridged by holding the last pose, per-joint
   outliers are rejected, low-confidence joints keep their previous position,
   and re-acquired joints ease in instead of snapping.

`--patient left|middle|right` is available as a fallback when the seated
heuristic does not apply to your footage.

## Output Joint Set

Frames carry `nurse`, `nurse2` (when both nurses are visible), and `patient`.
The output JSON contains normalized coordinates for:

`head`, `neck`, `lShoulder`, `rShoulder`, `lElbow`, `rElbow`, `lWrist`, `rWrist`, `hip`, `lKnee`, `rKnee`, `lAnkle`, `rAnkle`.

The demo computes, per frame, from the keypoints:

- nurse trunk flexion (trunk angle from vertical, aspect-corrected)
- nurse knee bend (hip-knee-ankle angle)
- nurse/patient hip distance, normalized by nurse trunk length
- patient tilt (patient trunk angle from vertical)
- twist proxy (shoulder span vs knee span, self-calibrated on the opening frames)
- overall transfer risk (weighted combination; knee/distance terms are phase-gated)

Transfer phases are detected in the browser from the patient's hip motion (rise = sit-to-stand/lifting, sideways travel while raised = pivot, descent = seating), so the `phase` value written by this script is only a fallback. Frames dropped here (when only one person is detected) are handled by the browser's timestamp-based sync, so gaps do not desync the overlay.

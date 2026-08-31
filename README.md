# MIRAI - Care Future Teller (Patient Transfer Demo)

MIRAI ("future" in Japanese) is a browser demo for a nurse-patient transfer assessment concept: see the near future of care - and choose a safer one.


## The scenario

Two nurses transfer a patient (for example bed to wheelchair) while a camera watches. Done with a bent back, a far-away patient, or a twisted pivot, this everyday maneuver is how nurses accumulate chronic lumbar injury - and how patients get bruises or falls. MIRAI plays the role of a "care future teller":

1. **Sense** - it tracks both nurses and the patient as skeletons and scores injury risk live, frame by frame, from the geometry alone.
2. **Predict** - at a risky moment it pauses the video and opens a magic ball that projects three futures ~8 seconds ahead: *continue as is* (the patient slips, near-fall), *ready + patient assists* (bring the patient to the seat edge, count together, and guide as they push up through their own legs), *pause and reassess* (the patient is unsteady, so ease them back into the seat and re-check before any lift). Each future is a computed motion continuation of the current skeleton, re-scored per projected frame - not a scripted video.
3. **Intervene** - the nurse talks with MIRAI (full-duplex voice), watches each future play as an animated humanoid figure with live risk readout, and chooses one by voice or click. The chosen future replays, the video resumes, and the loop re-arms for the next risky moment.

It demonstrates:

1. realistic video upload,
2. skeleton/keypoint overlay for two nurses and the patient, timestamp-synced and letterbox-corrected to the video,
3. transfer phases detected from the patient's hip motion, plus safety feature scoring computed from the keypoints (trunk angle, knee bend, distance normalized by trunk length, twist proxy),
4. a full-duplex speech-to-speech consultation mock (English), presented as a talking magic ball instead of a chat log: every AI reply is spoken aloud (speechSynthesis) while its words appear as a live caption under the ball, the nurse talks back via the Speak button (SpeechRecognition, Chrome) with what was heard shown briefly before fading, and tapping Speak while the AI talks interrupts it,
5. a what-if counterfactual: the skeleton is edited (upright trunk, deeper knee bend, patient closer), re-scored, and drawn as a green ghost,
6. the magic ball: when a high-risk posture is detected (or on request), three futures are projected ~8 s ahead as motion continuations of the current skeleton - continue as is (risk climbs), ready + patient assists (risk falls: the patient stands through their own legs), pause and reassess (risk falls furthest: the lift is aborted and the seated patient is stabilized) - each re-scored per projected frame, rendered as 3D mesh figures (lifted to 3D with MotionBERT), and playable in the orbitable replay,
7. VR-style skeleton replay that steps into the chosen future, with a true-3D live view: each role's 2D keypoint sequence is lifted to root-relative 3D with MotionBERT during extraction, and the "Future motion preview" panel renders it as a rotatable scene (drag to orbit).

Synthetic keypoints are used as a fallback when no extracted JSON is available.

## Interview demo flow

1. `npm run dev`, open the page in Chrome, press "Load anonymized demo", then Play.
2. When the lift gets risky, the video pauses automatically and the AI Dialog appears with the magic ball, which opens on a short **list of three options** up front - *continue as is*, *ready + patient assists*, *pause and reassess* - each with a one-line summary and its projected risk (e.g. 64 -> 79 / 64 -> 32 / 64 -> 13). The AI speaks the warning while the list is shown.
3. Each option has a **motion preview** you open in any order: pressing "Preview motion" shows the magic ball with that future's spoken explanation (closeable), and "Play the motion" then plays it in a large VR viewport as animated humanoid figures with the skeleton overlaid and a live projected-risk readout. When the narration ends it returns to the list, marking that future previewed.
4. **Choosing unlocks as soon as any one future has been previewed** - you can watch just one and pick, or preview more first (the list shows "X / 3 previewed"). Then choose by voice - say "one", "two", or "three" - or press "Choose this" on a card. The chosen future plays in the 3D preview panel while the AI narrates the cause-and-effect, then the video resumes automatically.
5. At the next risky moment the ball opens again (risk must first fall below 50, then cross 60 - hysteresis, so the same moment cannot re-trigger right after resuming) and the sense-predict-intervene loop repeats. All risk numbers are recomputed from the projected skeletons, not scripted. The "Magic ball" chip reopens the sequence at any time.

Rehearsal shortcuts: `/?stage=vision` opens the option list on the risky sample's worst moment, `/?stage=orb` jumps into the first future's ball explanation, `/?stage=preview` into a motion preview, and `/?stage=choose` into the unlocked choice.

Speech recognition needs Chrome and network access; without it, use the buttons and quick chips instead - the AI still answers aloud. Voice can be muted with "AI voice: off".

## How it works (program core)

The entire app is one file, `worker/index.js`: a Cloudflare-Worker-style `fetch` handler that serves a single self-contained HTML page (inline CSS + JS, no framework, no runtime dependencies). `scripts/serve.mjs` wraps it in a local dev server; `scripts/build.sh` copies it to `dist/` for deployment. Everything between the `// === logic-start ===` and `// === logic-end ===` markers is DOM-free logic (geometry, scoring, projection), which is what the smoke test exercises.

**Sense - from keypoints to risk.** Each frame carries up to three people (`nurse`, `nurse2`, `patient`) with 13 joints in normalized image coordinates, either extracted with RTMPose (`scripts/extract_keypoints.py` -> `assets/sample-keypoints.json`) or synthesized as a fallback. `features()` computes per frame: trunk flexion angle, knee bend, support distance (nurse-to-patient hip distance normalized by the nurse's trunk length), patient tilt, and a twist proxy (the shoulder line narrowing relative to the knees, self-calibrated against the opening frames). A phase-aware weighted sum gives risk 0..1. Transfer phases (preparation, sit-to-stand, lifting, pivot, seating) are detected from the patient's hip motion. A warning fires with hysteresis: risk must fall below 50 to re-arm, then cross 60 - so one risky moment cannot re-trigger itself right after resuming.

**Predict - the three futures.** `projectContinue` carries the current joint velocities forward with damping and deepens the risky pattern in proportion to the current risk (the patient drifts out of grip and sinks). `projectAssist` brings the patient to the seat edge within reach, sits them up, holds for a shared count, then has the patient rise through their own legs (knees extending, trunk upright) while the nurses stay upright and only guide. `projectPause` eases the unsteady patient back into a stable, upright seated position and straightens the nurses out of the lift; because the dangerous maneuver has stopped, the projected frames revert to the preparation phase, which `features()` weights far lower for knee bend and support distance - so the risk it computes reflects that the lift was actually aborted, not a scripted number. Every projected frame is re-scored with the same `features()` used on live frames, so every risk number on screen is computed cause-and-effect (measured on the sample: continue ~56->77, ready+assist ~56->44, pause ~56->14). The same counterfactual edit also powers the green "what-if ghost" overlay.

**Intervene - full-duplex AI dialog.** The AI is a talking magic ball, not a chat: `speechSynthesis` speaks every reply while the words type out as a live caption under the ball, `SpeechRecognition` (Chrome) listens for the nurse, what was heard shows briefly and fades, and tapping Speak while the AI talks interrupts it (barge-in). A status pill shows the duplex state (speaking / listening / standing by). In the vision sequence, each future plays in a VR-style viewport as a humanoid figure - torso, head, and capsule limbs fleshed out from the same 13 keypoints, with the skeleton still overlaid - alongside a live projected-risk readout; the choice is made by voice ("one", "two", "three") or click.

The public repository contains anonymized keypoints but intentionally excludes
the source patient-transfer footage. Use the built-in anonymized demo or select
your own local video.

## Run

```sh
npm run dev
```

Open:

```text
http://127.0.0.1:8790
```

Then press:

```text
Load anonymized demo
```

Or press `Load my video` to pick any transfer video from your computer. The video plays immediately and locally via an object URL, while the dev server extracts real keypoints with RTMPose in the background. A status line shows progress, and the overlay hot-swaps to the real keypoints when extraction finishes. This needs the `.venv-pose` Python environment from `README_pose.md`; without it, the video still plays with the synthetic skeleton. Uploads stay local under `assets/uploads/` and are excluded from Git.

To generate real keypoints for your own video, or set up the Python environment used by `Load my video`, see:

```text
README_pose.md
```

## MoshiRAG integration

After the RunPod MoshiRAG setup is running and the main server prints a public Gradio URL, start this app with that URL:

```sh
MOSHIRAG_URL="https://xxxxx.gradio.live" npm run dev
```

Open `http://127.0.0.1:8790`. The AI Dialog panel shows a MoshiRAG status row. When the server's health check passes, press **`Use MoshiRAG voice`** to embed MoshiRAG's native full-duplex voice client **right inside the AI Dialog panel** and hand the live conversation to it. This is a hybrid, not a replacement:

- **MoshiRAG owns the free conversation** when active; MIRAI's own text-to-speech is muted automatically (the `AI voice` toggle flips to off) so the two voices never overlap. Press `Back to built-in voice` to switch off, or `Open in new tab` if your server blocks iframe embedding.
- **The built-in mock stays the default and the offline fallback** - if `MOSHIRAG_URL` is unset or the server is asleep, MIRAI's own `speak()`/`SpeechRecognition` dialog (grounded in `advice()`) keeps working.
- **The scripted magic-ball narration stays on TTS**, synced to the motion previews and risk readouts.
- **Grounding**: MoshiRAG's generic client is a black box - MIRAI cannot inject text into it, read what it says, or detect what you say to it (the WebSocket at `/api/chat` needs the deployment's own session/worker handshake and Moshi is speech-to-speech, so a text bridge is not reliable). Instead the panel shows a live **risk-context strip** (current risk, phase, nurse trunk/knee, patient distance, top sign, and the three projected futures) that updates every frame, plus a **`Copy context`** button that copies a one-paragraph grounded summary to speak or paste to MoshiRAG. **When you choose a future in MIRAI, the context leads with that choice** (e.g. "The nurse has chosen 'Ready + patient assists' ... risk 64 → 32"), so what you hand to MoshiRAG matches the option you picked.

Why in-panel embed rather than a from-scratch stream: MoshiRAG's live endpoint is a **WebSocket audio stream at `/api/chat`** using an Opus codec, not a text REST API. Reimplementing that codec/WebSocket loop inline in the single-file `worker/index.js` is impractical, so MIRAI embeds MoshiRAG's own working client (which already handles the audio pipeline) and grounds it with the context strip instead.

To verify the connection from this app:

```sh
curl http://127.0.0.1:8790/api/moshirag/config
curl http://127.0.0.1:8790/api/moshirag/health
```

### Automatic grounding (optional - needs one small server change)

Full auto-grounding cannot be done from MIRAI's side: the embedded Kyutai client reads no `instructions`/`prompt` URL parameter, its handshake carries only version/model, its control messages carry only fixed actions, and it never sends text - so there is no client-side hook to inject context. The model's persona/system prompt lives entirely on **your** MoshiRAG server. To make Moshi automatically aware of the live risk, add a small endpoint there.

MIRAI already does its half: it `POST`s the live context to `/api/moshirag/context`, which the dev server forwards to `${MOSHIRAG_URL}${MOSHIRAG_CONTEXT_PATH}` (default `/api/context`) whenever a high-risk moment opens the ball, a future is chosen, or you turn MoshiRAG voice on. The body is:

```json
{ "event": "risk|choice|start|update", "risk": 64, "level": "High", "high": true, "phase": "lifting", "chosen": "Ready + patient assists", "context": "Live patient-transfer context ... risk 64 ... " }
```

On the MoshiRAG server, add a route that (1) returns `{ "ok": true }` for `POST /api/context`, (2) stores the latest `context`, and (3) **prepends it to the LLM system prompt** when a conversation starts (e.g. "Current situation: <context>"), and/or adds it as a RAG document. Until that route exists, MIRAI detects the 404 and falls back to the manual `Copy context` button (no errors).

One caveat: Moshi is **reactive** - it speaks in response to audio, so even when grounded it will not *proactively* announce a new high-risk moment unless your server injects a synthetic turn on `high: true`. That is why MIRAI keeps making the proactive announcement itself (risk warning + three futures + choice) in its own voice; the recommended split is **MIRAI announces the risk, MoshiRAG answers grounded follow-up questions**.

## Optional keypoint JSON format

```json
{
  "width": 1280,
  "height": 720,
  "duration": 69.0,
  "frames": [
    {
      "time": 1.2,
      "nurse": {
        "head": {"x": 0.3, "y": 0.2, "c": 0.9},
        "neck": {"x": 0.3, "y": 0.3, "c": 0.9}
      },
      "patient": {
        "head": {"x": 0.55, "y": 0.25, "c": 0.9},
        "neck": {"x": 0.55, "y": 0.35, "c": 0.9}
      },
      "patientFeedback": "ready"
    }
  ]
}
```

All coordinates should be normalized to `0..1` image coordinates. `time` (seconds), `c` (confidence), `width`, `height`, and `duration` are optional but recommended: `time` drives exact video sync (frames without it are spread uniformly), `width`/`height` fix the aspect ratio used for angle math, and low-`c` joints are skipped. A second nurse can be provided per frame as `nurse2`; the risk features then use the worst-posture nurse and the closest support distance. Phases are re-detected from motion on load, so a `phase` field is not required. The expected joints are:

`head`, `neck`, `lShoulder`, `rShoulder`, `lElbow`, `rElbow`, `lWrist`, `rWrist`, `hip`, `lKnee`, `rKnee`, `lAnkle`, `rAnkle`.

## Validate

```sh
npm run build
npm run validate
npm run smoke
```

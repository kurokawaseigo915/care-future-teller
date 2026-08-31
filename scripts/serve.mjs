import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { createWriteStream } from "node:fs";
import { mkdir, readdir, readFile, rename, rm, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";
import worker from "../worker/index.js";

const port = Number(process.env.PORT || 8790);
const explicitPort = process.env.PORT != null && process.env.PORT !== "";
const root = normalize(fileURLToPath(new URL("..", import.meta.url)));
const uploadsDir = join(root, "assets", "uploads");
const pythonBin = join(root, ".venv-pose", "bin", "python3");
const extractorScript = join(root, "scripts", "extract_keypoints.py");

// Extraction knobs (see README_pose.md). EXTRACT_MAX_FRAMES exists for quick tests.
// EXTRACT_STRIDE unset (0) means fps-adaptive: sample ~5 frames per second of
// video, so low-fps phone footage still gets dense enough tracking for the
// role assignment (which needs person segments of 15+ processed frames).
const extractStrideOverride = Math.max(0, Number(process.env.EXTRACT_STRIDE || 0));
const extractMaxFrames = Math.max(0, Number(process.env.EXTRACT_MAX_FRAMES || 0));
const extractDevice = process.env.EXTRACT_DEVICE || "cpu";
const extractPatient = process.env.EXTRACT_PATIENT || "auto"; // auto|seated|left|middle|right
const extract3d = process.env.EXTRACT_3D !== "0"; // lift 2D sequences to 3D (MotionBERT)
const extractTimeoutMs = Number(process.env.EXTRACT_TIMEOUT_MS || 45 * 60 * 1000);
const maxUploadBytes = Number(process.env.MAX_UPLOAD_BYTES || 2 * 1024 * 1024 * 1024);

const mime = {
  ".mp4": "video/mp4",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

// ---- Keypoint extraction jobs -------------------------------------------
// Uploads are content-addressed (sha256 -> id), so re-uploading the same
// video reuses its finished keypoints or joins the job already running.
// Jobs run one at a time: RTMPose on CPU saturates the machine, and two
// concurrent extractions would only slow each other down.

const jobs = new Map();
let jobQueue = Promise.resolve();

// Keypoints and the raw-detection cache are only valid for the pipeline
// version and the stride/max-frames they were made with, so all of that is
// part of the file names - a truncated test run or an output from an older
// (pre-rotation-fix) pipeline can never shadow a current full one.
const PIPELINE_VERSION = "v4";
const maxFramesSuffix = extractMaxFrames ? `-m${extractMaxFrames}` : "";
const extractParams = (stride) => `${PIPELINE_VERSION}-s${stride}${maxFramesSuffix}`;
const keypointsNameFor = (id, stride) => `${id}.keypoints-${extractParams(stride)}.json`;
const keypointsPathFor = (id, stride) => join(uploadsDir, keypointsNameFor(id, stride));
const videoPathFor = (id) => join(uploadsDir, `${id}.mp4`);
const rawCachePathFor = (id, stride) => join(uploadsDir, `${id}.raw-${extractParams(stride)}.json`);

// The stride is chosen per video (fps-adaptive), so an "is this already
// extracted?" check that runs before the probe scans by name prefix instead.
// The same video always maps to the same stride, so a match is always valid.
async function findKeypointsName(id) {
  let names;
  try {
    names = await readdir(uploadsDir);
  } catch {
    return null;
  }
  const pattern = new RegExp(`^${id}\\.keypoints-${PIPELINE_VERSION}-s\\d+${maxFramesSuffix}\\.json$`);
  return names.find((name) => pattern.test(name)) || null;
}

function adaptiveStride(fps) {
  if (extractStrideOverride) return extractStrideOverride;
  if (!(fps > 0)) return 6;
  return Math.min(12, Math.max(1, Math.round(fps / 5)));
}

const publicJob = (job) => ({
  id: job.id,
  status: job.status,
  progress: job.progress,
  message: job.message,
  keypoints: job.keypoints || null,
});

async function fileExists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

function sendJson(res, status, data) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  res.end(JSON.stringify(data));
}

async function receiveUpload(req) {
  await mkdir(uploadsDir, { recursive: true });
  const tempPath = join(uploadsDir, `incoming-${randomUUID()}.tmp`);
  const hash = createHash("sha256");
  let bytes = 0;
  try {
    await pipeline(
      req,
      async function* (source) {
        for await (const chunk of source) {
          bytes += chunk.length;
          if (bytes > maxUploadBytes) {
            throw Object.assign(new Error(`Upload exceeds ${maxUploadBytes} bytes`), { statusCode: 413 });
          }
          hash.update(chunk);
          yield chunk;
        }
      },
      createWriteStream(tempPath, { flags: "wx" }),
    );
  } catch (error) {
    await rm(tempPath, { force: true });
    throw error;
  }
  if (!bytes) {
    await rm(tempPath, { force: true });
    throw Object.assign(new Error("Empty upload body"), { statusCode: 400 });
  }
  const id = hash.digest("hex").slice(0, 16);
  if (await fileExists(videoPathFor(id))) await rm(tempPath, { force: true });
  else await rename(tempPath, videoPathFor(id));
  return id;
}

function runPython(args) {
  return new Promise((resolvePromise) => {
    const child = spawn(pythonBin, args, { cwd: root });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (data) => { stdout += data; });
    child.stderr.on("data", (data) => { stderr += data; });
    child.on("error", (error) => resolvePromise({ code: -1, stdout, stderr: String(error) }));
    child.on("close", (code) => resolvePromise({ code, stdout, stderr }));
  });
}

// One quick venv call before the heavy run: certifi's CA bundle (model
// downloads fail on python.org builds without it) and the frame count,
// which turns the extractor's "inferred N frames" lines into a percentage.
async function probeVideo(videoPath) {
  const script = [
    "import json, sys",
    "out = {}",
    "try:",
    "    import certifi; out['certifi'] = certifi.where()",
    "except Exception:",
    "    pass",
    "try:",
    "    import cv2",
    "    cap = cv2.VideoCapture(sys.argv[1])",
    "    out['frames'] = cap.get(cv2.CAP_PROP_FRAME_COUNT)",
    "    out['fps'] = cap.get(cv2.CAP_PROP_FPS)",
    "    cap.release()",
    "except Exception as exc:",
    "    out['error'] = str(exc)",
    "print(json.dumps(out))",
  ].join("\n");
  const result = await runPython(["-c", script, videoPath]);
  try {
    return JSON.parse(result.stdout.trim().split("\n").pop());
  } catch {
    return {};
  }
}

function startExtraction(id) {
  const existing = jobs.get(id);
  if (existing && existing.status !== "error") return existing;
  const job = { id, status: "queued", progress: 0, message: "waiting for the extraction worker", keypoints: null };
  jobs.set(id, job);
  jobQueue = jobQueue.then(() => runExtraction(job)).catch(() => {});
  return job;
}

async function runExtraction(job) {
  job.status = "running";
  job.message = "starting up";
  try {
    if (!(await fileExists(pythonBin))) {
      throw new Error("Python environment not found at .venv-pose/bin/python3 - create it as described in README_pose.md.");
    }
    const videoPath = videoPathFor(job.id);
    if (!(await fileExists(videoPath))) throw new Error("Uploaded video is missing on disk.");

    job.message = "probing video";
    const probe = await probeVideo(videoPath);
    const stride = adaptiveStride(probe.fps);
    const outputPath = keypointsPathFor(job.id, stride);

    if (await fileExists(outputPath)) {
      job.progress = 1;
      job.status = "done";
      job.keypoints = `/assets/uploads/${keypointsNameFor(job.id, stride)}`;
      job.message = "already extracted";
      return;
    }

    let totalToProcess = probe.frames > 0 ? Math.ceil(probe.frames / stride) : 0;
    if (extractMaxFrames) totalToProcess = totalToProcess ? Math.min(totalToProcess, extractMaxFrames) : extractMaxFrames;

    const args = [
      extractorScript, "rtmpose",
      "--video", videoPath,
      "--output", outputPath,
      "--pose2d", "rtmpose-m_8xb256-420e_coco-256x192",
      "--device", extractDevice,
      "--patient", extractPatient,
      "--nurses", "2",
      "--stride", String(stride),
      "--raw-cache", rawCachePathFor(job.id, stride),
    ];
    if (extractMaxFrames) args.push("--max-frames", String(extractMaxFrames));
    if (extract3d) args.push("--lift3d");

    const env = { ...process.env };
    if (probe.certifi && !env.SSL_CERT_FILE) env.SSL_CERT_FILE = probe.certifi;

    job.message = "loading the RTMPose model";
    console.log(`[extract] ${job.id}: ${pythonBin} ${args.join(" ")}`);
    await new Promise((resolvePromise, rejectPromise) => {
      const child = spawn(pythonBin, args, { cwd: root, env });
      const tail = [];
      let settled = false;
      const settle = (fn, value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        fn(value);
      };
      const timer = setTimeout(() => {
        child.kill("SIGKILL");
        settle(rejectPromise, new Error(`Extraction timed out after ${Math.round(extractTimeoutMs / 60000)} minutes.`));
      }, extractTimeoutMs);
      const onLine = (line) => {
        const text = line.trim();
        if (!text) return;
        tail.push(text);
        if (tail.length > 40) tail.shift();
        const inferred = /inferred (\d+) frames/.exec(text);
        if (inferred) {
          const count = Number(inferred[1]);
          job.progress = totalToProcess ? Math.min(0.97, count / totalToProcess) : null;
          job.message = `inferred ${count}${totalToProcess ? ` of ~${totalToProcess}` : ""} frames`;
          return;
        }
        if (text.startsWith("Loading raw detections from cache")) {
          job.progress = 0.9;
          job.message = "reusing cached detections";
          return;
        }
        if (text.startsWith("Found ")) {
          if (totalToProcess) job.progress = 0.96;
          job.message = "tracking people and assigning roles";
          return;
        }
        if (text.startsWith("Lifting 2D") || text.startsWith("  lifted ")) {
          if (totalToProcess) job.progress = 0.98;
          job.message = "lifting 3D poses (MotionBERT)";
        }
      };
      let stdoutBuffer = "";
      let stderrBuffer = "";
      child.stdout.on("data", (data) => {
        stdoutBuffer += data;
        const lines = stdoutBuffer.split("\n");
        stdoutBuffer = lines.pop();
        lines.forEach(onLine);
      });
      child.stderr.on("data", (data) => {
        stderrBuffer += data;
        const lines = stderrBuffer.split("\n");
        stderrBuffer = lines.pop();
        lines.forEach(onLine);
      });
      child.on("error", (error) => settle(rejectPromise, error));
      child.on("close", (code) => {
        onLine(stdoutBuffer);
        onLine(stderrBuffer);
        if (code === 0) settle(resolvePromise);
        else settle(rejectPromise, new Error(`Extractor exited with code ${code}. Last output: ${tail.slice(-6).join(" | ")}`));
      });
    });

    if (!(await fileExists(outputPath))) {
      throw new Error("Extractor finished but wrote no output JSON.");
    }
    job.progress = 1;
    job.status = "done";
    job.keypoints = `/assets/uploads/${keypointsNameFor(job.id, stride)}`;
    job.message = "done";
    console.log(`[extract] ${job.id} done -> ${outputPath}`);
  } catch (error) {
    job.status = "error";
    job.progress = null;
    job.message = error && error.message ? error.message : String(error);
    console.error(`[extract] ${job.id} failed: ${job.message}`);
  }
}

// ---- HTTP server ---------------------------------------------------------

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://127.0.0.1:${port}`);

  if (url.pathname === "/api/extract" && req.method === "POST") {
    try {
      const id = await receiveUpload(req);
      const existing = jobs.get(id);
      const busy = existing && (existing.status === "queued" || existing.status === "running");
      const doneName = busy ? null : await findKeypointsName(id);
      if (doneName) {
        const job = { id, status: "done", progress: 1, message: "already extracted", keypoints: `/assets/uploads/${doneName}` };
        jobs.set(id, job);
        sendJson(res, 200, publicJob(job));
        return;
      }
      sendJson(res, 202, publicJob(startExtraction(id)));
    } catch (error) {
      sendJson(res, error.statusCode || 500, { error: error.message || "Upload failed" });
    }
    return;
  }

  const statusMatch = /^\/api\/extract\/([0-9a-f]{16})$/.exec(url.pathname);
  if (statusMatch && req.method === "GET") {
    const id = statusMatch[1];
    const job = jobs.get(id);
    if (job) {
      sendJson(res, 200, publicJob(job));
      return;
    }
    const doneName = await findKeypointsName(id);
    if (doneName) {
      sendJson(res, 200, { id, status: "done", progress: 1, message: "already extracted", keypoints: `/assets/uploads/${doneName}` });
    } else {
      sendJson(res, 404, { error: "Unknown extraction job" });
    }
    return;
  }

  if (url.pathname.startsWith("/assets/") || url.pathname.startsWith("/previews/")) {
    try {
      const safePath = normalize(join(root, url.pathname));
      if (!safePath.startsWith(root)) throw new Error("Invalid path");
      const body = await readFile(safePath);
      res.writeHead(200, {
        "content-type": mime[extname(safePath)] || "application/octet-stream",
        "cache-control": "no-store",
      });
      res.end(body);
      return;
    } catch {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const request = new Request(url, {
    method: req.method,
    headers: req.headers,
    body: chunks.length ? Buffer.concat(chunks) : undefined,
  });
  const response = await worker.fetch(request, process.env, {});
  res.writeHead(response.status, Object.fromEntries(response.headers));
  res.end(await response.text());
});

// Robust startup: if the port is already taken (a previous `npm run dev` that
// never exited is the usual cause), auto-fall-forward to the next free port
// when the port was the default, or exit with an actionable message when the
// user pinned PORT explicitly - instead of crashing with an unhandled error.
const MAX_PORT_TRIES = 10;
let listenPort = port;
let portTries = 0;

server.on("listening", () => {
  console.log(`Patient Transfer demo: http://127.0.0.1:${listenPort}`);
  if (listenPort !== port) {
    console.log(`(port ${port} was busy, so this instance moved to ${listenPort})`);
  }
});

server.on("error", (err) => {
  if (err.code !== "EADDRINUSE") throw err;
  const busy = listenPort;
  if (!explicitPort && portTries < MAX_PORT_TRIES) {
    portTries += 1;
    listenPort += 1;
    console.warn(`Port ${busy} is in use, trying ${listenPort}...`);
    server.listen(listenPort, "0.0.0.0");
    return;
  }
  console.error(`\nCannot start: port ${busy} is already in use.`);
  console.error(`A previous "npm run dev" is probably still running. Free the port with:`);
  console.error(`  lsof -ti tcp:${busy} | xargs kill`);
  console.error(`or start on a different port:  PORT=${busy + 1} npm run dev\n`);
  process.exit(1);
});

server.listen(listenPort, "0.0.0.0");

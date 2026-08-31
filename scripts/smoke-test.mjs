import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import worker from "../worker/index.js";

const response = await worker.fetch(new Request("http://localhost/"), {}, {});
const html = await response.text();

assert.equal(response.status, 200);
assert.match(html, /MIRAI/);
assert.match(html, /Care Future Teller/);
assert.match(html, /Safety features/);
assert.match(html, /Load anonymized demo/);
assert.doesNotMatch(html, /sample-transfer\.mp4/);
assert.match(html, /sample-keypoints\.json/);
assert.match(html, /generateFrames/);

const browserScripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)]
  .map((match) => match[1]);
assert.ok(browserScripts.length > 0);
const browserScript = browserScripts.join("\n");
await writeFile("/tmp/patient-transfer-browser-script.js", browserScript);
new Function(browserScript);

const health = await worker.fetch(new Request("http://localhost/api/health"), {}, {});
assert.equal(health.status, 200);

console.log("Smoke test passed");

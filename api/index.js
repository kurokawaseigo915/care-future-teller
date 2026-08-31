import worker from "../worker/index.js";

export default {
  async fetch(request) {
    const url = new URL(request.url);

    url.pathname = "/";

    const forwardedRequest = new Request(url.toString(), request);

    const env = {
      ...process.env,
      MOSHIRAG_URL: process.env.MOSHIRAG_URL || "",
    };

    return worker.fetch(forwardedRequest, env, {});
  },
};
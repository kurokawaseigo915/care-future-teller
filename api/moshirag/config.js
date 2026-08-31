export default function handler(request, response) {
  const rawUrl = process.env.MOSHIRAG_URL?.trim();

  if (!rawUrl) {
    return response.status(500).json({
      configured: false,
      url: "",
      chatUrl: "",
      error: "MOSHIRAG_URL is not configured in Vercel",
    });
  }

  try {
    const url = new URL(rawUrl);
    const origin = url.origin;

    return response.status(200).json({
      configured: true,
      url: origin,
      chatUrl: origin,
    });
  } catch {
    return response.status(500).json({
      configured: false,
      url: "",
      chatUrl: "",
      error: "MOSHIRAG_URL is not a valid URL",
    });
  }
}
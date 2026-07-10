// Vercel serverless function — Cloudflare Turnstile verification.
// Deployed automatically at /api/verify-turnstile (the local equivalent lives
// in server.js, which Vercel's static deploy does not run).
export default async function handler(req, res) {
  const send = (status, obj) => {
    res.statusCode = status;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(obj));
  };

  if (req.method !== "POST") {
    return send(405, { success: false, error: "method not allowed" });
  }

  // Vercel parses JSON bodies into req.body for application/json requests; fall
  // back to reading the raw stream for other cases.
  let token;
  if (req.body && typeof req.body === "object") {
    token = req.body.token;
  } else {
    const raw =
      typeof req.body === "string" ? req.body : await readBody(req);
    try {
      token = JSON.parse(raw || "{}").token;
    } catch {
      token = undefined;
    }
  }

  if (!token) {
    return send(400, { success: false, error: "missing token" });
  }

  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    return send(200, { success: false, error: "TURNSTILE_SECRET_KEY not configured" });
  }

  try {
    const resp = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(token)}`
    });
    const data = await resp.json();
    return send(200, data);
  } catch (err) {
    return send(200, { success: false, error: "verification request failed" });
  }
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", () => resolve(""));
  });
}

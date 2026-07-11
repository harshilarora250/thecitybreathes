import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const root = process.cwd();
const port = Number(process.env.PORT || 5173);
const host = process.env.HOST || "127.0.0.1";

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8"
};

const jsonHeaders = { "Content-Type": "application/json; charset=utf-8" };

// Verify a Cloudflare Turnstile token against the siteverify API.
async function verifyTurnstile(token) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    return { success: false, error: "TURNSTILE_SECRET_KEY not configured" };
  }
  const resp = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(token)}`
  });
  return resp.json();
}

// Fetch live traffic congestion (0..1) for a coordinate from TomTom.
// congestion = 1 - currentSpeed / freeFlowSpeed, clamped. Requires
// TOMTOM_TRAFFIC_KEY; returns { ok:false } when unset or on error so the
// client falls back to its time-of-day estimate.
async function fetchTrafficCongestion(lat, lon) {
  const key = process.env.TOMTOM_TRAFFIC_KEY;
  if (!key) return { ok: false, error: "TOMTOM_TRAFFIC_KEY not configured" };
  const url =
    "https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json" +
    `?point=${encodeURIComponent(`${lat},${lon}`)}&unit=KMPH&key=${encodeURIComponent(key)}`;
  try {
    const resp = await fetch(url);
    if (!resp.ok) return { ok: false, error: `tomtom ${resp.status}` };
    const data = await resp.json();
    const seg = data.flowSegmentData;
    if (!seg || !seg.freeFlowSpeed) return { ok: false, error: "no segment" };
    const congestion = Math.max(0, Math.min(1, 1 - seg.currentSpeed / seg.freeFlowSpeed));
    return { ok: true, traffic: congestion };
  } catch (err) {
    return { ok: false, error: "request failed" };
  }
}

// Read and parse a JSON request body, capped at `limit` bytes.
function readJsonBody(req, limit = 1 << 16) {
  return new Promise((resolve) => {
    let size = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > limit) {
        req.destroy();
        resolve(null);
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        resolve(null);
      }
    });
    req.on("error", () => resolve(null));
  });
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host}`);

    if (req.method === "POST" && url.pathname === "/api/verify-turnstile") {
      const payload = await readJsonBody(req);
      if (!payload || !payload.token) {
        res.writeHead(400, jsonHeaders);
        res.end(JSON.stringify({ success: false, error: "missing token" }));
        return;
      }
      const result = await verifyTurnstile(payload.token);
      res.writeHead(200, jsonHeaders);
      res.end(JSON.stringify(result));
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/traffic") {
      const lat = Number(url.searchParams.get("lat"));
      const lon = Number(url.searchParams.get("lon"));
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        res.writeHead(400, jsonHeaders);
        res.end(JSON.stringify({ ok: false, error: "invalid coordinates" }));
        return;
      }
      const result = await fetchTrafficCongestion(lat, lon);
      res.writeHead(200, jsonHeaders);
      res.end(JSON.stringify(result));
      return;
    }

    const requested = url.pathname === "/" ? "/index.html" : url.pathname;
    const filePath = normalize(join(root, requested));

    if (!filePath.startsWith(root)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    const body = await readFile(filePath);
    res.writeHead(200, {
      "Content-Type": types[extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    res.end(body);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
});

server.listen(port, host, () => {
  console.log(`The City Breathes is running at http://${host}:${port}`);
});

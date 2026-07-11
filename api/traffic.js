// Vercel serverless function — live traffic congestion via TomTom.
// Deployed at /api/traffic (the local equivalent lives in server.js).
// Keeps TOMTOM_TRAFFIC_KEY server-side; the browser never sees the key.
export default async function handler(req, res) {
  const send = (status, obj) => {
    res.statusCode = status;
    res.setHeader("Content-Type", "application/json");
    // Cache at the edge for 2 min to stay well under the free daily quota.
    res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=300");
    res.end(JSON.stringify(obj));
  };

  if (req.method !== "GET") {
    return send(405, { ok: false, error: "method not allowed" });
  }

  const { lat, lon } = req.query || {};
  const latNum = Number(lat);
  const lonNum = Number(lon);
  if (!Number.isFinite(latNum) || !Number.isFinite(lonNum)) {
    return send(400, { ok: false, error: "invalid coordinates" });
  }

  const key = process.env.TOMTOM_TRAFFIC_KEY;
  if (!key) {
    return send(200, { ok: false, error: "TOMTOM_TRAFFIC_KEY not configured" });
  }

  const url =
    "https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json" +
    `?point=${encodeURIComponent(`${latNum},${lonNum}`)}&unit=KMPH&key=${encodeURIComponent(key)}`;

  try {
    const resp = await fetch(url);
    if (!resp.ok) return send(200, { ok: false, error: `tomtom ${resp.status}` });
    const data = await resp.json();
    const seg = data.flowSegmentData;
    if (!seg || !seg.freeFlowSpeed) return send(200, { ok: false, error: "no segment" });
    const congestion = Math.max(0, Math.min(1, 1 - seg.currentSpeed / seg.freeFlowSpeed));
    return send(200, { ok: true, traffic: congestion });
  } catch (err) {
    return send(200, { ok: false, error: "request failed" });
  }
}

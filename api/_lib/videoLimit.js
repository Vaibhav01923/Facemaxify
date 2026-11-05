// Best-effort per-visitor limit for the public video maker's two endpoints. Serverless instances do not share memory,
// so this only slows down casual repeated use; the real cost ceiling is the short text each request is allowed.
const HOUR = 3_600_000;
const hits = new Map();

export function limited(req, bucket, max) {
  const ip = String(req.headers["x-forwarded-for"] ?? req.socket?.remoteAddress ?? "unknown").split(",")[0].trim();
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < HOUR);
  const blocked = recent.length >= max;
  if (!blocked) recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear();
  return blocked;
}

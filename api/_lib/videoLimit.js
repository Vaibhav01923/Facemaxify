// Abuse protection for the public video maker's endpoints (no login, so it has to be strict).
//
// Layers, applied by guard():
//   1. Origin check     - browsers calling from another website are refused.
//   2. Per-IP limits    - a short burst limit plus hourly and daily caps.
//   3. Global daily cap - a ceiling on total requests per day, so a botnet cannot run up the Claude / hosting bill.
//
// Counters live in Supabase (rate_limit_hit(), see supabase_rate_limits.sql) so every serverless instance shares them.
// If that function is not installed or Supabase is down, the same limits are enforced in instance memory instead
// (weaker, because instances do not share memory, but never open).
import { createClient } from "@supabase/supabase-js";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } }) : null;

const ALLOWED_HOSTS = new Set(["facemaxify.com", "www.facemaxify.com", "localhost", "127.0.0.1"]);
const MIN = 60;
const HOUR = 3600;
const DAY = 86400;

/** The visitor's address as Vercel saw it (its own headers cannot be forged by the client, unlike a raw X-Forwarded-For). */
export function clientIp(req) {
  const h = req.headers ?? {};
  const raw = h["x-vercel-forwarded-for"] ?? h["x-real-ip"] ?? h["x-forwarded-for"] ?? req.socket?.remoteAddress ?? "unknown";
  return String(raw).split(",")[0].trim().slice(0, 64) || "unknown";
}

/** True when the request comes from our own pages (or from a non-browser client that sends no Origin, handled by the caps). */
function originAllowed(req) {
  const source = req.headers?.origin || req.headers?.referer;
  if (!source) return true;
  try {
    return ALLOWED_HOSTS.has(new URL(source).hostname);
  } catch {
    return false;
  }
}

// ---- in-memory fallback ----
const memory = new Map();
function memoryHit(key, windowSec, max) {
  const now = Date.now();
  const recent = (memory.get(key) ?? []).filter((t) => now - t < windowSec * 1000);
  const ok = recent.length < max;
  if (ok) recent.push(now);
  memory.set(key, recent);
  if (memory.size > 5000) memory.clear();
  return ok;
}

/** One counter. true = allowed. */
async function hit(key, windowSec, max) {
  if (supabase && !hit.dbDown) {
    try {
      const { data, error } = await supabase.rpc("rate_limit_hit", { p_key: key, p_window: windowSec, p_max: max });
      if (!error && typeof data === "boolean") return data;
      if (error) {
        console.warn("[video-limit] database limiter unavailable, using memory:", error.message);
        hit.dbDown = Date.now();
        setTimeout(() => (hit.dbDown = 0), 60_000).unref?.();
      }
    } catch (err) {
      console.warn("[video-limit] database limiter failed, using memory:", err.message);
    }
  }
  return memoryHit(key, windowSec, max);
}

/**
 * Sends the error response and returns true when the request must be stopped.
 *   perIp:  [{ window (seconds), max }]  checked per visitor
 *   global: { window, max }              checked across all visitors
 */
export async function guard(req, res, { bucket, perIp, global, message }) {
  if (!originAllowed(req)) {
    res.status(403).json({ error: "Not allowed from this site." });
    return true;
  }
  const ip = clientIp(req);
  for (const rule of perIp) {
    if (!(await hit(`${bucket}:ip:${ip}:${rule.window}`, rule.window, rule.max))) {
      res.setHeader("Retry-After", String(Math.min(rule.window, HOUR)));
      res.status(429).json({ error: message ?? "Too many requests. Please try again later." });
      return true;
    }
  }
  if (global && !(await hit(`${bucket}:all:${global.window}`, global.window, global.max))) {
    res.setHeader("Retry-After", "3600");
    res.status(503).json({ error: "The video maker is very busy right now. Please try again later today." });
    return true;
  }
  return false;
}

export const WINDOWS = { MIN, HOUR, DAY };

// ---- voice tokens ----
// The voice route only speaks for a video that passed the (strict) script check. The script route hands out a signed,
// short-lived token worth a fixed number of voice lines; the voice route refuses anything without a valid one.
const TOKEN_LINES = 24;
const TOKEN_TTL_MS = 30 * 60_000;
const secret = () => process.env.VIDEO_TOKEN_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "local-dev-only";
const sign = (body) => createHmac("sha256", secret()).update(body).digest("base64url");

export function issueVoiceToken() {
  const body = Buffer.from(JSON.stringify({ id: randomBytes(9).toString("base64url"), exp: Date.now() + TOKEN_TTL_MS })).toString("base64url");
  return `${body}.${sign(body)}`;
}

/** Returns the token id when valid and not expired, otherwise null. */
function readVoiceToken(token) {
  const [body, sig] = String(token ?? "").split(".");
  if (!body || !sig) return null;
  const want = Buffer.from(sign(body));
  const got = Buffer.from(sig);
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null;
  try {
    const { id, exp } = JSON.parse(Buffer.from(body, "base64url").toString());
    return typeof id === "string" && exp > Date.now() ? id : null;
  } catch {
    return null;
  }
}

/** Spends one line of the token. false = invalid, expired or used up. */
export async function spendVoiceToken(token) {
  const id = readVoiceToken(token);
  if (!id) return false;
  return hit(`voicetoken:${id}`, TOKEN_TTL_MS / 1000, TOKEN_LINES);
}

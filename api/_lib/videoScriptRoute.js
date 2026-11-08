import { writeVideoScript } from "./videoScript.js";
import { limited } from "./videoLimit.js";

const PRONOUNS = ["he", "she", "they"];
const clean = (s) => String(s ?? "").replace(/[^\p{L}\p{N} '.\-]/gu, "").replace(/\s+/g, " ").trim().slice(0, 40);
const text = (s, n) => String(s ?? "").slice(0, n);

/** Voice-over script for the public video maker. The measurements come from the visitor's browser. */
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (limited(req, "script", 6)) return res.status(429).json({ error: "You have made a few videos already. Please try again in an hour." });

  const b = req.body ?? {};
  const name = clean(b.name);
  const metrics = (Array.isArray(b.metrics) ? b.metrics : []).slice(0, 22).map((m) => ({
    key: text(m.key, 40),
    short: text(m.short, 40),
    name: text(m.name, 80),
    what: text(m.what, 240),
    displayValue: text(m.displayValue, 20),
    unit: text(m.unit, 12),
    idealMin: Number(m.idealMin),
    idealMax: Number(m.idealMax),
    score: Number(m.score),
    label: text(m.label, 20),
    reason: text(m.reason, 12),
    perfect: Boolean(m.perfect),
  }));
  const overall100 = Number(b.overall100);
  if (!name || metrics.length < 3 || metrics.some((m) => !m.key || !Number.isFinite(m.score)) || !Number.isFinite(overall100)) {
    return res.status(400).json({ error: "Missing name or analysis" });
  }
  try {
    const script = await writeVideoScript({
      name,
      pronouns: PRONOUNS.includes(b.pronouns) ? b.pronouns : "they",
      metrics,
      overall100,
      percentileText: text(b.percentileText, 80),
    });
    res.status(200).json({ name, script });
  } catch (err) {
    console.error("[video-script]", err);
    res.status(500).json({ error: "Could not write the voice-over. Please try again." });
  }
}

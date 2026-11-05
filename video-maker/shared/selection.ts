/**
 * Smart ratio selection.
 *
 * A short has to stay under 60 seconds, so only ~12 of the ~22 ratios can appear. Instead of "the first N" this picks
 * the ones that make the best video, in this priority order:
 *
 *   1. CORE   - the ratios the channel always shows (jaw slope, jaw frontal angle, midface ratio, cheekbone height,
 *               total face width-to-height). Edit SHORT_CORE to change them.
 *   2. WEAK   - the worst-scoring features overall (1-2): honest analysis, and a good retention hook.
 *   3. MID    - 2-4 "average" features (score 6 - 9.9), preferring face regions not shown yet, so the video isn't
 *               all-star-or-disaster and covers eyes, brows, jaw, lips, ...
 *   4. PERFECT- every remaining 10/10 that still fits, most important first.
 *   5. FILLER - anything left over, most important first, if there is still room.
 *
 * Core items that are also 10s / weak / mid count towards those quotas, so slots are not wasted.
 * The result is returned in the video's natural order (eyes -> brows -> midface -> jaw -> chin & lips -> nose).
 */
import type { MetricData, PickReason, VideoFormat } from "./types";
import { METRIC_PLAN, toMetricData, type RawMetric } from "./metricPlan";

/** Always shown in a short. NOTE: "total fWHR" is mapped to Facemaxify's "Total Facial Width to Height Ratio". */
export const SHORT_CORE = ["jawSlope", "jawFrontalAngle", "midfaceRatio", "cheekboneHeight", "totalFacialWidthHeight"];

/** How much a ratio matters to the audience (1-10) and which part of the face it belongs to (for variety). */
const META: Record<string, { importance: number; region: string }> = {
  canthalTilt: { importance: 9, region: "eyes" },
  eyebrowTilt: { importance: 7, region: "brows" },
  eyeAspectRatio: { importance: 5, region: "eyes" },
  oneEyeApart: { importance: 6, region: "eyes" },
  eyeSeparation: { importance: 5, region: "eyes" },
  browLengthRatio: { importance: 3, region: "brows" },
  midfaceRatio: { importance: 9, region: "midface" },
  faceWidthHeight: { importance: 9, region: "width" },
  totalFacialWidthHeight: { importance: 8, region: "width" },
  middleThird: { importance: 6, region: "thirds" },
  lowerThird: { importance: 6, region: "thirds" },
  cheekboneHeight: { importance: 8, region: "cheeks" },
  jawFrontalAngle: { importance: 9, region: "jaw" },
  jawSlope: { importance: 8, region: "jaw" },
  bigonialWidth: { importance: 5, region: "jaw" },
  chinPhiltrum: { importance: 4, region: "chin" },
  lipRatio: { importance: 5, region: "lips" },
  mouthToNoseWidth: { importance: 3, region: "lips" },
  interpupillaryMouth: { importance: 3, region: "lips" },
  ipsilateralAlarAngle: { importance: 3, region: "nose" },
  intercanthalNasal: { importance: 3, region: "nose" },
  upperThird: { importance: 3, region: "thirds" },
};

// --- time model (seconds), measured on real renders -------------------------------------------------------------
export const SHORT_LIMIT_SECONDS = 59;
const SHORT_FIXED = 16; // intro + scan (with the spoken promo) + result
const SHORT_PER_RATIO = 4.4;
const LONG_FIXED = 24;
const LONG_PER_RATIO = 11;

export const estimateSeconds = (format: VideoFormat, ratios: number): number =>
  format === "short" ? SHORT_FIXED + SHORT_PER_RATIO * ratios : LONG_FIXED + LONG_PER_RATIO * ratios;

/** How many ratios fit in a short under the 60 second limit (~12). */
export const autoShortCount = (): number => Math.floor((SHORT_LIMIT_SECONDS - 1 - SHORT_FIXED) / SHORT_PER_RATIO);

const TEN = 9.95;
const MID_LOW = 6;

interface Item {
  key: string;
  raw: RawMetric;
  imp: number;
  region: string;
  core: boolean;
  score: number;
}

export function smartSelect(all: RawMetric[], count: number, coreKeys: string[] = SHORT_CORE): MetricData[] {
  const items: Item[] = [];
  for (const p of METRIC_PLAN) {
    const raw = all.find((m) => m.key === p.key);
    if (!raw) continue;
    items.push({
      key: p.key,
      raw,
      imp: META[p.key]?.importance ?? 3,
      region: META[p.key]?.region ?? p.key,
      core: coreKeys.includes(p.key),
      score: raw.score,
    });
  }
  const n = Math.max(1, Math.min(items.length, Math.round(count)));
  const chosen = new Map<string, PickReason>();
  const room = () => n - chosen.size;
  const add = (it: Item, reason: PickReason) => {
    if (room() > 0 && !chosen.has(it.key)) chosen.set(it.key, reason);
  };
  const byKey = (k: string) => items.find((i) => i.key === k)!;
  const pool = () => items.filter((i) => !chosen.has(i.key));
  const regionsShown = () => new Set([...chosen.keys()].map((k) => byKey(k).region));

  // 1. core
  items
    .filter((i) => i.core)
    .sort((a, b) => b.imp - a.imp)
    .forEach((i) => add(i, "core"));

  // 2. weak: the worst-scoring features overall (they count even if already chosen as core)
  const weakTarget = n >= 10 ? 2 : 1;
  const worst = [...items].sort((a, b) => a.score - b.score).slice(0, weakTarget);
  worst.forEach((i) => add(i, "weak"));

  // 3. mid: top up to the target number of mid-scoring features, favouring regions not shown yet
  const midTarget = n >= 13 ? 4 : n >= 10 ? 3 : n >= 7 ? 2 : 1;
  const isMid = (i: Item) => i.score >= MID_LOW && i.score < TEN;
  const midHave = () => [...chosen.keys()].filter((k) => isMid(byKey(k))).length;
  while (midHave() < midTarget && room() > 0) {
    const shown = regionsShown();
    const next = pool()
      .filter(isMid)
      .sort((a, b) => b.imp + (shown.has(b.region) ? 0 : 2) - (a.imp + (shown.has(a.region) ? 0 : 2)))[0];
    if (!next) break;
    add(next, "mid");
  }

  // 4. perfect 10s, most important first
  pool()
    .filter((i) => i.score >= TEN)
    .sort((a, b) => b.imp - a.imp)
    .forEach((i) => add(i, "perfect"));

  // 5. filler, most important first, favouring new regions
  while (room() > 0) {
    const shown = regionsShown();
    const next = pool().sort((a, b) => b.imp + (shown.has(b.region) ? 0 : 2) - (a.imp + (shown.has(a.region) ? 0 : 2)))[0];
    if (!next) break;
    add(next, "filler");
  }

  // output in video order, with keep-priority for trimming
  return items
    .filter((i) => chosen.has(i.key))
    .map((i) => {
      const picked = chosen.get(i.key)!;
      const base = picked === "core" ? 100 : picked === "weak" ? 80 : picked === "perfect" ? 50 : picked === "mid" ? 40 : 0;
      // fillers are labelled by what they actually are, so badges and narration hints make sense
      const reason: PickReason =
        picked !== "filler" ? picked : i.score >= TEN ? "perfect" : i.score >= MID_LOW ? "mid" : "weak";
      return { ...toMetricData(i.raw), reason, perfect: i.score >= TEN, keep: base + i.imp };
    });
}

/** Number of ratios for a format given the user's choice (auto = whatever fits under 60 s for shorts). */
export function resolveCount(format: VideoFormat, mode: "auto" | "manual", manual: number, available: number): number {
  if (format === "short" && mode === "auto") return Math.min(available, autoShortCount());
  return Math.max(1, Math.min(available, Math.round(manual)));
}

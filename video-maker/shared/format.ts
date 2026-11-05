/** Score wording and colours (mirrors the thresholds used by Facemaxify's RatioRow). */
export const scoreLabel = (s: number): string =>
  s >= 9 ? "Excellent" : s >= 7 ? "Good" : s >= 5 ? "Average" : s >= 3 ? "Below average" : "Poor";

export const scoreColor = (s: number): string =>
  s >= 9 ? "#34d399" : s >= 7 ? "#a3e635" : s >= 5 ? "#fbbf24" : s >= 3 ? "#fb923c" : "#f87171";

export function formatValue(value: number, unit: string): string {
  switch (unit) {
    case "x":
      return `${value.toFixed(2)}x`;
    case "%":
      return `${value.toFixed(1)}%`;
    case "°":
      return `${value.toFixed(1)}°`;
    case "mm":
      return `${value.toFixed(1)} mm`;
    default:
      return value.toFixed(2);
  }
}

export function formatRange(min: number, max: number, unit: string): string {
  const f = (n: number) => (unit === "x" ? n.toFixed(2) : n.toFixed(1));
  const u = unit === "x" || unit === "%" || unit === "°" ? unit : ` ${unit}`;
  return `${f(min)}${u} – ${f(max)}${u}`;
}

export const pronounSet = (p: "he" | "she" | "they") =>
  p === "he"
    ? { subj: "he", obj: "him", poss: "his" }
    : p === "she"
      ? { subj: "she", obj: "her", poss: "her" }
      : { subj: "they", obj: "them", poss: "their" };

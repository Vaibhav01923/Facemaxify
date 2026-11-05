import type { Role } from "../shared/visuals";
import { scoreColor } from "../shared/format";

export const FONT = "Inter, system-ui, -apple-system, 'Segoe UI', sans-serif";
export const MONO = "'JetBrains Mono', 'Cascadia Mono', Consolas, ui-monospace, monospace";

export const COLORS = {
  bg: "#050510",
  panel: "#0c0d1d",
  cyan: "#22d3ee",
  indigo: "#6366f1",
  neon: "#2ef2d6",
  white: "#ffffff",
  muted: "#9aa0c3",
  magenta: "#d946ef",
};

export const roleColor = (role: Role, score: number): string => {
  switch (role) {
    case "main":
      return scoreColor(score);
    case "base":
      return "#ffffff";
    case "ref":
      return "rgba(255,255,255,0.75)";
    default:
      return COLORS.magenta;
  }
};

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
export const easeInOutCubic = (t: number) => {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
export const easeOutBack = (t: number) => {
  const x = clamp01(t);
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};
/** progress of a frame window, 0..1 */
export const prog = (frame: number, start: number, dur: number) => clamp01((frame - start) / dur);

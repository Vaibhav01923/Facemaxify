import { FACE_OVAL, pairRatio, type Geometry, type Pt } from "./geometry";
import type { Painter } from "./painter";

// A layer is one measurement drawn on the photo: the lines for it, and (when it is the selected
// one) a label with the number. Every result row of a tool maps to a layer, so tapping a row shows
// where on the face that number comes from. The numbers in the labels are recomputed here from the
// same landmarks as the score, so they match the result rows.

export type Emphasis = "base" | "active" | "dim";

export interface LayerEnv {
  g: Geometry;
  p: Painter;
  e: Emphasis;
  fmt: (value: number, digits?: number) => string;
}

export interface Layer {
  id: string;
  color: string;
  // Helper lines (the facial midline) with no result row of their own; always drawn.
  decor?: boolean;
  draw: (env: LayerEnv) => void;
}

export const alphaFor = (e: Emphasis) => (e === "active" ? 1 : e === "dim" ? 0.2 : 0.66);

// Same colour bands as the symmetry bars in the results.
export const ratioColor = (ratio: number) =>
  ratio >= 0.95 ? "#34d399" : ratio >= 0.85 ? "#818cf8" : ratio >= 0.75 ? "#fbbf24" : "#f87171";

const MIDLINE = "#e2e8f0";
const SOFT = 0.62; // alpha for the secondary line of a two-line measurement

const mid = (a: Pt, b: Pt): Pt => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const rightmost = (a: Pt, b: Pt) => (a.x >= b.x ? a : b);

// A measured distance: the line, a cap at each end and a dot on each landmark.
function span(p: Painter, a: Pt, b: Pt, color: string, alpha: number, width = 1.7) {
  p.line(a, b, { color, alpha, width: width * p.u });
  p.cap(a, b, color, alpha);
  p.cap(b, a, color, alpha);
  p.dot(a, color, alpha, 2.2);
  p.dot(b, color, alpha, 2.2);
}

// Where labels sit: just outside the face on either side.
const sides = ({ g, p }: LayerEnv) => ({ left: g.left - 7 * p.u, right: g.right + 7 * p.u });

function callout(env: LayerEnv, anchor: Pt, text: string, color: string, dy = 0) {
  if (env.e === "active") env.p.callout(anchor, text, color, sides(env), { dy });
}

function midlineEnds(g: Geometry) {
  const faceH = g.p(152).y - g.p(10).y;
  return {
    top: { x: g.midX, y: Math.max(0, g.p(10).y - 0.1 * faceH) },
    bottom: { x: g.midX, y: Math.min(g.h, g.p(152).y + 0.06 * faceH) },
  };
}

function drawMidline({ g, p }: LayerEnv, alpha: number) {
  const { top, bottom } = midlineEnds(g);
  p.line(top, bottom, { color: MIDLINE, alpha, width: 1.2 * p.u, dash: [5 * p.u, 4 * p.u] });
  return top;
}

// How far each landmark of a pair sits from the midline: two horizontal ticks, one per side.
function drawPair(env: LayerEnv, left: number, right: number, color: string, alpha: number, width: number, dot: number) {
  const { g, p } = env;
  for (const index of [left, right]) {
    const pt = g.p(index);
    p.line(pt, { x: g.midX, y: pt.y }, { color, alpha: alpha * 0.85, width });
    p.dot(pt, color, alpha, dot);
  }
}

// ─── symmetry ─────────────────────────────────────────────────────────────────────────────

// The facial midline plus every left/right pair, each coloured by how evenly it sits around it.
export function symmetryLayer(o: { id: string; pairs: [number, number][]; label: string; color?: string }): Layer {
  const color = o.color ?? "#34d399";
  return {
    id: o.id,
    color,
    draw: (env) => {
      const a = alphaFor(env.e);
      const top = drawMidline(env, a * 0.9);
      for (const [left, right] of o.pairs) {
        drawPair(env, left, right, ratioColor(pairRatio(env.g, left, right)), a, 1.2 * env.p.u, 2.2);
      }
      if (env.e === "active") env.p.label(top, o.label, color, { align: "center", dy: -12 });
    },
  };
}

// Just the midline, for tools that give each pair its own layer.
export function midlineLayer(): Layer {
  return {
    id: "midline",
    color: MIDLINE,
    decor: true,
    draw: (env) => {
      drawMidline(env, env.e === "dim" ? 0.4 : 0.85);
    },
  };
}

// One left/right pair on its own (the zone rows of the symmetry test).
export function pairLayer(o: { id: string; left: number; right: number; ratio: number; label: string }): Layer {
  const color = ratioColor(o.ratio);
  return {
    id: o.id,
    color,
    draw: (env) => {
      const { g } = env;
      const active = env.e === "active";
      drawPair(env, o.left, o.right, color, alphaFor(env.e), (active ? 2.4 : 1.5) * env.p.u, active ? 3.6 : 2.6);
      callout(env, rightmost(g.p(o.left), g.p(o.right)), o.label, color);
    },
  };
}

// ─── face proportions ─────────────────────────────────────────────────────────────────────

// Jaw width against cheekbone width.
export function jawLayer(o: { id: string; cheek: string; jaw: (percent: string) => string; color?: string }): Layer {
  const color = o.color ?? "#fbbf24";
  return {
    id: o.id,
    color,
    draw: (env) => {
      const { g, p, fmt } = env;
      const a = alphaFor(env.e);
      const [c1, c2, j1, j2] = [234, 454, 172, 397].map((i) => g.p(i));
      span(p, c1, c2, "#fde68a", a * 0.85);
      span(p, j1, j2, color, a);
      callout(env, c2, o.cheek, "#fde68a");
      callout(env, j2, o.jaw(fmt((g.dist(172, 397) / g.dist(234, 454)) * 100, 0)), color);
    },
  };
}

// The face split into upper, middle and lower thirds.
export function thirdsLayer(o: { id: string; name: (index: 0 | 1 | 2, percent: string) => string; color?: string }): Layer {
  const color = o.color ?? "#38bdf8";
  return {
    id: o.id,
    color,
    draw: (env) => {
      const { g, p, fmt } = env;
      const a = alphaFor(env.e);
      const ys = [g.p(10).y, (g.p(105).y + g.p(334).y) / 2, g.p(94).y, g.p(152).y];
      const width = g.p(454).x - g.p(234).x;
      const x1 = Math.max(0, g.p(234).x - 0.14 * width);
      const x2 = Math.min(g.w, g.p(454).x + 0.14 * width);
      for (const y of ys) {
        p.line({ x: x1, y }, { x: x2, y }, { color, alpha: a * 0.95, width: 1.4 * p.u, dash: [6 * p.u, 4 * p.u] });
      }
      if (env.e === "active") {
        const total = ys[3] - ys[0] || 1;
        const bounds = { left: x1 - 4 * p.u, right: x2 + 4 * p.u };
        for (const i of [0, 1, 2] as const) {
          const share = ((ys[i + 1] - ys[i]) / total) * 100;
          p.callout({ x: x2, y: (ys[i] + ys[i + 1]) / 2 }, o.name(i, fmt(share, 0)), color, bounds, { keepLevel: true });
        }
      }
    },
  };
}

// Nose width against face width.
export function noseLayer(o: { id: string; label: (percent: string) => string; color?: string }): Layer {
  const color = o.color ?? "#f472b6";
  return {
    id: o.id,
    color,
    draw: (env) => {
      const { g, p, fmt } = env;
      const a = alphaFor(env.e);
      const n1 = g.p(98);
      const n2 = g.p(327);
      span(p, n1, n2, color, a, 2.2);
      callout(env, rightmost(n1, n2), o.label(fmt((g.dist(98, 327) / g.dist(234, 454)) * 100, 1)), color);
    },
  };
}

// Face length against face width, drawn as the box the golden ratio is compared with.
export function faceRectLayer(o: { id: string; label: (ratio: string) => string; color?: string }): Layer {
  const color = o.color ?? "#facc15";
  return {
    id: o.id,
    color,
    draw: (env) => {
      const { g, p, fmt } = env;
      const a = alphaFor(env.e);
      const left = g.p(234).x;
      const right = g.p(454).x;
      const top = g.p(10).y;
      const bottom = g.p(152).y;
      const corners: Pt[] = [
        { x: left, y: top },
        { x: right, y: top },
        { x: right, y: bottom },
        { x: left, y: bottom },
      ];
      p.poly(corners, { color, alpha: a, width: 1.6 * p.u, dash: [7 * p.u, 4 * p.u] }, true);
      corners.forEach((c) => p.dot(c, color, a, 2.4));
      if (env.e === "active") {
        const ratio = Math.abs(bottom - top) / g.dist(234, 454);
        p.label({ x: (left + right) / 2, y: bottom }, o.label(fmt(ratio, 2)), color, { align: "center", dy: 19 });
      }
    },
  };
}

// Philtrum length against the whole lower third of the face.
export function philtrumLayer(o: { id: string; label: (percent: string) => string; color?: string }): Layer {
  const color = o.color ?? "#fb923c";
  return {
    id: o.id,
    color,
    draw: (env) => {
      const { g, p, fmt } = env;
      const a = alphaFor(env.e);
      const noseBase = g.p(94);
      const lip = g.p(0);
      const chin = g.p(152);
      p.line(noseBase, chin, { color, alpha: a * SOFT, width: 1.3 * p.u, dash: [5 * p.u, 4 * p.u] });
      p.cap(chin, noseBase, color, a);
      span(p, noseBase, lip, color, a, 2.8);
      const share = (Math.abs(lip.y - noseBase.y) / (Math.abs(chin.y - noseBase.y) || 1)) * 100;
      callout(env, mid(noseBase, lip), o.label(fmt(share, 0)), color);
    },
  };
}

// The gap between the eyes against the width of an eye.
export function eyeSpacingLayer(o: { id: string; label: (ratio: string) => string; color?: string }): Layer {
  const color = o.color ?? "#a78bfa";
  return {
    id: o.id,
    color,
    draw: (env) => {
      const { g, p, fmt } = env;
      const a = alphaFor(env.e);
      const [outerL, innerL, innerR, outerR] = [33, 133, 362, 263].map((i) => g.p(i));
      span(p, outerL, innerL, color, a * 0.85, 1.6);
      span(p, innerR, outerR, color, a * 0.85, 1.6);
      span(p, innerL, innerR, "#f5f3ff", a, 2.4);
      if (env.e === "active") {
        const ratio = g.dist(133, 362) / ((g.dist(33, 133) + g.dist(263, 362)) / 2);
        p.label(browLabelAnchor(g), o.label(fmt(ratio, 2)), color, { align: "center", dy: -17 });
      }
    },
  };
}

// ─── eyes ─────────────────────────────────────────────────────────────────────────────────

// Eye labels sit on the forehead, above the brows, so they don't cover the eyes.
const browLabelAnchor = (g: Geometry): Pt => ({ x: g.midX, y: Math.min(g.p(105).y, g.p(334).y) });

// The tilt of each eye: a line from the inner to the outer corner against the horizontal.
export function canthalLayer(o: { id: string; label: string; color?: string }): Layer {
  const color = o.color ?? "#2dd4bf";
  return {
    id: o.id,
    color,
    draw: (env) => {
      const { g, p } = env;
      const a = alphaFor(env.e);
      for (const [outer, inner] of [
        [33, 133],
        [263, 362],
      ]) {
        const out = g.p(outer);
        const inn = g.p(inner);
        const ext = { x: out.x + (out.x - inn.x) * 0.3, y: out.y + (out.y - inn.y) * 0.3 };
        p.line(inn, { x: ext.x, y: inn.y }, { color: MIDLINE, alpha: a * 0.75, width: 1.1 * p.u, dash: [4 * p.u, 3 * p.u] });
        p.line(inn, ext, { color, alpha: a, width: 1.9 * p.u });
        p.dot(inn, color, a, 2.4);
        p.dot(out, color, a, 2.4);
      }
      if (env.e === "active") p.label(browLabelAnchor(g), o.label, color, { align: "center", dy: -17 });
    },
  };
}

// How open the eyes are: the height of the eye against its width.
export function opennessLayer(o: { id: string; label: (percent: string) => string; color?: string }): Layer {
  const color = o.color ?? "#c084fc";
  return {
    id: o.id,
    color,
    draw: (env) => {
      const { g, p, fmt } = env;
      const a = alphaFor(env.e);
      for (const [top, bottom, outer, inner] of [
        [159, 145, 33, 133],
        [386, 374, 263, 362],
      ]) {
        span(p, g.p(outer), g.p(inner), color, a * 0.85, 1.4);
        span(p, g.p(top), g.p(bottom), "#f5f3ff", a, 2.2);
      }
      if (env.e === "active") {
        const openness = (g.dist(159, 145) / g.dist(33, 133) + g.dist(386, 374) / g.dist(263, 362)) / 2;
        p.label(browLabelAnchor(g), o.label(fmt(openness * 100, 1)), color, { align: "center", dy: -17 });
      }
    },
  };
}

// ─── face shape ───────────────────────────────────────────────────────────────────────────

// The outline of the face (the shape itself).
export function contourLayer(o: { id: string; label: string; color?: string }): Layer {
  const color = o.color ?? "#818cf8";
  return {
    id: o.id,
    color,
    draw: (env) => {
      const { g, p } = env;
      const a = alphaFor(env.e);
      p.smoothClosed(FACE_OVAL.map(g.p), { color, alpha: a, width: (env.e === "active" ? 2.8 : 1.8) * p.u });
      if (env.e === "active") p.label(g.p(152), o.label, color, { align: "center", dy: 24 });
    },
  };
}

// Face length (top of forehead to chin) against cheekbone width.
export function lengthWidthLayer(o: { id: string; label: (ratio: string) => string; color?: string }): Layer {
  const color = o.color ?? "#38bdf8";
  return {
    id: o.id,
    color,
    draw: (env) => {
      const { g, p, fmt } = env;
      const a = alphaFor(env.e);
      const [top, chin, c1, c2] = [10, 152, 234, 454].map((i) => g.p(i));
      span(p, top, chin, color, a);
      span(p, c1, c2, "#fbbf24", a);
      callout(env, c2, o.label(fmt(g.dist(10, 152) / g.dist(234, 454), 2)), color);
    },
  };
}

// Forehead width (temple to temple) against jaw width.
export function foreheadJawLayer(o: { id: string; label: (ratio: string) => string; color?: string }): Layer {
  const color = o.color ?? "#34d399";
  return {
    id: o.id,
    color,
    draw: (env) => {
      const { g, p, fmt } = env;
      const a = alphaFor(env.e);
      const [t1, t2, j1, j2] = [21, 251, 172, 397].map((i) => g.p(i));
      span(p, t1, t2, color, a);
      span(p, j1, j2, "#f472b6", a);
      callout(env, rightmost(t1, t2), o.label(fmt(g.dist(21, 251) / g.dist(172, 397), 2)), color);
    },
  };
}

// The angle at the chin between the two jaw lines.
export function chinAngleLayer(o: { id: string; label: (degrees: string) => string; color?: string }): Layer {
  const color = o.color ?? "#a78bfa";
  return {
    id: o.id,
    color,
    draw: (env) => {
      const { g, p, fmt } = env;
      const a = alphaFor(env.e);
      const chin = g.p(152);
      const [j1, j2] = [172, 397].map((i) => g.p(i));
      p.line(j1, chin, { color, alpha: a, width: 2 * p.u });
      p.line(j2, chin, { color, alpha: a, width: 2 * p.u });
      p.dot(j1, color, a, 2.4);
      p.dot(j2, color, a, 2.4);
      p.dot(chin, color, a, 3);
      const a1 = Math.atan2(j1.y - chin.y, j1.x - chin.x);
      const a2 = Math.atan2(j2.y - chin.y, j2.x - chin.x);
      p.arc(chin, 28, Math.min(a1, a2), Math.max(a1, a2), { color, alpha: a, width: 1.7 * p.u });
      if (env.e === "active") {
        const angle = (Math.abs(a1 - a2) * 180) / Math.PI;
        p.label(chin, o.label(fmt(angle > 180 ? 360 - angle : angle, 0)), color, { align: "center", dy: 24 });
      }
    },
  };
}

// ─── golden ratio ─────────────────────────────────────────────────────────────────────────

// Mouth width against nose width.
export function mouthNoseLayer(o: { id: string; label: (ratio: string) => string; color?: string }): Layer {
  const color = o.color ?? "#facc15";
  return {
    id: o.id,
    color,
    draw: (env) => {
      const { g, p, fmt } = env;
      const a = alphaFor(env.e);
      const [m1, m2, n1, n2] = [61, 291, 102, 331].map((i) => g.p(i));
      span(p, m1, m2, color, a);
      span(p, n1, n2, "#fde68a", a);
      callout(env, rightmost(m1, m2), o.label(fmt(g.dist(61, 291) / g.dist(102, 331), 2)), color);
    },
  };
}

// Nose-to-chin against lower-lip-to-chin.
export function chinProportionLayer(o: { id: string; label: (ratio: string) => string; color?: string }): Layer {
  const color = o.color ?? "#fb923c";
  return {
    id: o.id,
    color,
    draw: (env) => {
      const { g, p, fmt } = env;
      const a = alphaFor(env.e);
      const chin = g.p(152);
      const noseBottom = g.p(2);
      const lip = g.p(17);
      const dx = 0.11 * (g.p(454).x - g.p(234).x);
      for (const y of [noseBottom.y, lip.y, chin.y]) {
        p.line(
          { x: g.midX - dx * 1.8, y },
          { x: g.midX + dx * 1.8, y },
          { color, alpha: a * SOFT, width: 1 * p.u, dash: [4 * p.u, 3 * p.u] },
        );
      }
      span(p, { x: g.midX - dx, y: noseBottom.y }, { x: g.midX - dx, y: chin.y }, color, a);
      span(p, { x: g.midX + dx, y: lip.y }, { x: g.midX + dx, y: chin.y }, "#fed7aa", a);
      if (env.e === "active") {
        const ratio = g.dist(2, 152) / g.dist(17, 152);
        p.label(chin, o.label(fmt(ratio, 2)), color, { align: "center", dy: 24 });
      }
    },
  };
}

// Width across the outer eye corners against mouth width.
export function eyesMouthLayer(o: { id: string; label: (ratio: string) => string; color?: string }): Layer {
  const color = o.color ?? "#c084fc";
  return {
    id: o.id,
    color,
    draw: (env) => {
      const { g, p, fmt } = env;
      const a = alphaFor(env.e);
      const [e1, e2, m1, m2] = [33, 263, 61, 291].map((i) => g.p(i));
      span(p, e1, e2, color, a);
      span(p, m1, m2, "#e9d5ff", a);
      callout(env, rightmost(m1, m2), o.label(fmt(g.dist(33, 263) / g.dist(61, 291), 2)), color);
    },
  };
}

/**
 * Geometry of the measurement lines drawn for every ratio.
 *
 * Mirrors the drawings in Facemaxify's components/FaceOverlay.tsx (cheek-width reference lines, angle arcs at the
 * jaw/nose, thirds guides, lip segments, ...) and extends them to the ratios that overlay only drew as a plain line.
 * All points are in Facemaxify landmark space (0-1000 on the square, standardised photo).
 */
import type { Pt } from "./types";

export type Role = "main" | "base" | "ref" | "alt";

export type Prim =
  | { t: "line"; a: Pt; b: Pt; role: Role; order: number; caps?: boolean; dashed?: boolean }
  | { t: "dot"; p: Pt; role: Role; order: number }
  | { t: "arc"; c: Pt; a: Pt; b: Pt; r: number; role: Role; order: number }
  | { t: "label"; p: Pt; text: string; role: Role; order: number };

export interface Visual {
  prims: Prim[];
  /** Points the camera should frame. */
  focus: Pt[];
}

export interface VisualInput {
  L: Record<string, Pt>;
  value: number;
  unit: string;
  score: number;
}

// draw order groups
const REF = 0;
const DOTS = 1;
const LINES = 2;
const ARCS = 3;
const LABELS = 4;

const mid = (a: Pt, b: Pt): Pt => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);
const off = (p: Pt, dx: number, dy: number): Pt => ({ x: p.x + dx, y: p.y + dy });

const line = (a: Pt, b: Pt, role: Role, order = LINES, o: { caps?: boolean; dashed?: boolean } = {}): Prim => ({
  t: "line",
  a,
  b,
  role,
  order,
  ...o,
});
const dot = (p: Pt, role: Role = "main"): Prim => ({ t: "dot", p, role, order: DOTS });
const label = (p: Pt, text: string, role: Role = "main"): Prim => ({ t: "label", p, text, role, order: LABELS });
const arc = (c: Pt, a: Pt, b: Pt, r: number, role: Role = "base"): Prim => ({ t: "arc", c, a, b, r, role, order: ARCS });

/** Same sign convention as Facemaxify's calculateTilt(): outer point higher than inner point = positive. */
const tiltDeg = (inner: Pt, outer: Pt) => (Math.atan2(inner.y - outer.y, Math.abs(outer.x - inner.x)) * 180) / Math.PI;

/** Line intersection, identical to ratioCalculator's math.intersect. */
function intersect(p1: Pt, p2: Pt, p3: Pt, p4: Pt): Pt | null {
  const det = (p2.x - p1.x) * (p4.y - p3.y) - (p4.x - p3.x) * (p2.y - p1.y);
  if (det === 0) return null;
  const lambda = ((p4.y - p3.y) * (p4.x - p1.x) + (p3.x - p4.x) * (p4.y - p1.y)) / det;
  return { x: p1.x + lambda * (p2.x - p1.x), y: p1.y + lambda * (p2.y - p1.y) };
}

type Builder = (i: VisualInput) => Visual;

/** inner->outer tilt lines for both sides (canthal tilt and eyebrow tilt share this). */
function tiltVisual(i: VisualInput, pairs: [string, string][], arcScale: number): Visual {
  const prims: Prim[] = [];
  const focus: Pt[] = [];
  for (const [ik, ok] of pairs) {
    const inner = i.L[ik];
    const outer = i.L[ok];
    const dir = Math.sign(outer.x - inner.x) || 1;
    const w = Math.abs(outer.x - inner.x);
    const refEnd = { x: outer.x + dir * w * 0.3, y: inner.y };
    prims.push(line(inner, refEnd, "ref", REF, { dashed: true }));
    prims.push(dot(inner), dot(outer));
    prims.push(line(inner, outer, "main"));
    prims.push(arc(inner, refEnd, outer, Math.max(24, w * arcScale)));
    const m = mid(inner, outer);
    prims.push(label(off(m, 0, -Math.max(34, w * 0.5)), `${tiltDeg(inner, outer).toFixed(1)}°`));
    focus.push(inner, outer, refEnd);
  }
  return { prims, focus };
}

/** horizontal bracket with end caps */
const bracket = (a: Pt, b: Pt, role: Role): Prim => line(a, b, role, LINES, { caps: true });

const BUILDERS: Record<string, Builder> = {
  canthalTilt: (i) =>
    tiltVisual(
      i,
      [
        ["leftEyeMedialCanthus", "leftEyeLateralCanthus"],
        ["rightEyeMedialCanthus", "rightEyeLateralCanthus"],
      ],
      0.6
    ),

  eyebrowTilt: (i) =>
    tiltVisual(
      i,
      [
        ["leftBrowInnerCorner", "leftBrowArch"],
        ["rightBrowInnerCorner", "rightBrowArch"],
      ],
      0.55
    ),

  eyeAspectRatio: ({ L, value }) => {
    const prims: Prim[] = [];
    const focus: Pt[] = [];
    for (const s of ["left", "right"]) {
      const m = L[`${s}EyeMedialCanthus`];
      const o = L[`${s}EyeLateralCanthus`];
      const up = L[`${s}EyeUpperEyelid`];
      const lo = L[`${s}EyeLowerEyelid`];
      const cx = (up.x + lo.x) / 2;
      prims.push(dot(m, "base"), dot(o, "base"));
      prims.push(bracket(m, o, "base"));
      prims.push(bracket({ x: cx, y: up.y }, { x: cx, y: lo.y }, "main"));
      focus.push(m, o, up, lo);
    }
    const c = mid(mid(L.leftEyeMedialCanthus, L.leftEyeLateralCanthus), mid(L.rightEyeMedialCanthus, L.rightEyeLateralCanthus));
    prims.push(label(off(c, 0, -70), `${value.toFixed(2)}x`));
    return { prims, focus };
  },

  oneEyeApart: ({ L, value }) => {
    const lIn = L.leftEyeMedialCanthus;
    const lOut = L.leftEyeLateralCanthus;
    const rIn = L.rightEyeMedialCanthus;
    const rOut = L.rightEyeLateralCanthus;
    const midY = (lIn.y + lOut.y + rIn.y + rOut.y) / 4;
    const prims: Prim[] = [
      dot(lIn, "base"),
      dot(lOut, "base"),
      dot(rIn, "base"),
      dot(rOut, "base"),
      bracket(lOut, lIn, "base"),
      bracket(rIn, rOut, "base"),
      bracket({ x: lIn.x, y: midY }, { x: rIn.x, y: midY }, "main"),
      label({ x: (lIn.x + rIn.x) / 2, y: midY + 55 }, `${value.toFixed(2)}x`),
    ];
    return { prims, focus: [lIn, lOut, rIn, rOut] };
  },

  eyeSeparation: ({ L, value }) => {
    const lp = L.leftEyePupil;
    const rp = L.rightEyePupil;
    const lc = L.leftCheek;
    const rc = L.rightCheek;
    const prims: Prim[] = [
      line(lc, rc, "ref", REF, { dashed: true }),
      dot(lc, "base"),
      dot(rc, "base"),
      dot(lp),
      dot(rp),
      line(lp, rp, "main"),
      label(off(mid(lp, rp), 0, -60), `${value.toFixed(1)}%`),
    ];
    return { prims, focus: [lc, rc, lp, rp] };
  },

  browLengthRatio: ({ L, value }) => {
    const lh = L.leftBrowHead;
    const lt = L.leftBrowTail;
    const rh = L.rightBrowHead;
    const rt = L.rightBrowTail;
    const lc = L.leftCheek;
    const rc = L.rightCheek;
    const prims: Prim[] = [
      line(lc, rc, "ref", REF, { dashed: true }),
      dot(lh),
      dot(lt),
      dot(rh),
      dot(rt),
      bracket(lh, lt, "main"),
      bracket(rh, rt, "main"),
      label(off(mid(lh, rh), 0, -60), `${value.toFixed(2)}x`),
    ];
    return { prims, focus: [lt, rt, lc, rc, lh, rh] };
  },

  midfaceRatio: ({ L, value }) => {
    const lp = L.leftEyePupil;
    const rp = L.rightEyePupil;
    const lip = L.innerCupidsBow;
    const m = mid(lp, rp);
    const prims: Prim[] = [
      dot(lp, "base"),
      dot(rp, "base"),
      line(lp, rp, "base"),
      dot({ x: m.x, y: m.y }, "base"),
      dot({ x: m.x, y: lip.y }),
      line(m, { x: m.x, y: lip.y }, "main"),
      label({ x: m.x + 130, y: (m.y + lip.y) / 2 }, `${value.toFixed(2)}x`),
    ];
    return { prims, focus: [lp, rp, lip] };
  },

  faceWidthHeight: ({ L, value }) => {
    const lc = L.leftCheek;
    const rc = L.rightCheek;
    const lb = L.leftBrowHead;
    const rb = L.rightBrowHead;
    const mouth = L.mouthMiddle;
    const midX = (lc.x + rc.x) / 2;
    const browY = (lb.y + rb.y) / 2;
    const prims: Prim[] = [
      dot(lc, "base"),
      dot(rc, "base"),
      line(lc, rc, "base"),
      dot({ x: midX, y: browY }),
      dot({ x: midX, y: mouth.y }),
      line({ x: midX, y: browY }, { x: midX, y: mouth.y }, "main"),
      label({ x: midX + 150, y: (browY + mouth.y) / 2 }, `${value.toFixed(2)}x`),
    ];
    return { prims, focus: [lc, rc, { x: midX, y: browY }, { x: midX, y: mouth.y }] };
  },

  totalFacialWidthHeight: ({ L, value }) => {
    const lc = L.leftCheek;
    const rc = L.rightCheek;
    const h = L.hairline;
    const c = L.chinBottom;
    const midX = (lc.x + rc.x) / 2;
    const prims: Prim[] = [
      dot(lc, "base"),
      dot(rc, "base"),
      line(lc, rc, "base"),
      dot({ x: midX, y: h.y }),
      dot({ x: midX, y: c.y }),
      line({ x: midX, y: h.y }, { x: midX, y: c.y }, "main"),
      label({ x: midX + 160, y: (h.y + c.y) / 2 }, `${value.toFixed(2)}x`),
    ];
    return { prims, focus: [lc, rc, { x: midX, y: h.y }, { x: midX, y: c.y }] };
  },

  cheekboneHeight: ({ L }) => {
    const lp = L.leftEyePupil;
    const rp = L.rightEyePupil;
    const lc = L.leftCheek;
    const rc = L.rightCheek;
    const mouth = L.mouthMiddle;
    const cx = mouth.x;
    const eyeY = (lp.y + rp.y) / 2;
    const cheekY = (lc.y + rc.y) / 2;
    const totalH = Math.abs(mouth.y - eyeY) || 1;
    const topPct = (Math.abs(cheekY - eyeY) / totalH) * 100;
    const botPct = (Math.abs(mouth.y - cheekY) / totalH) * 100;
    const prims: Prim[] = [
      line({ x: lp.x - 70, y: eyeY }, { x: rp.x + 70, y: eyeY }, "ref", REF, { dashed: true }),
      line({ x: lc.x, y: cheekY }, { x: rc.x, y: cheekY }, "ref", REF, { dashed: true }),
      dot(lc, "base"),
      dot(rc, "base"),
      dot({ x: cx, y: eyeY }, "base"),
      dot({ x: cx, y: cheekY }),
      dot({ x: cx, y: mouth.y }),
      line({ x: cx, y: eyeY }, { x: cx, y: cheekY }, "base", LINES, { dashed: true }),
      line({ x: cx, y: cheekY }, { x: cx, y: mouth.y }, "main"),
      label({ x: cx + 120, y: (eyeY + cheekY) / 2 }, `${topPct.toFixed(0)}%`, "base"),
      label({ x: cx + 120, y: (cheekY + mouth.y) / 2 }, `${botPct.toFixed(0)}%`),
    ];
    return { prims, focus: [lc, rc, { x: cx, y: eyeY }, { x: cx, y: mouth.y }] };
  },

  jawFrontalAngle: ({ L, value }) => {
    const lBot = L.leftBottomGonion;
    const rBot = L.rightBottomGonion;
    const lChin = L.chinLeft;
    const rChin = L.chinRight;
    const v = intersect(lBot, lChin, rBot, rChin) ?? L.chinBottom;
    const prims: Prim[] = [
      dot(lBot),
      dot(rBot),
      dot(lChin, "base"),
      dot(rChin, "base"),
      line(lBot, v, "main"),
      line(rBot, v, "main"),
      arc(v, lBot, rBot, Math.min(120, dist(v, lBot) * 0.4), "base"),
      label({ x: v.x, y: v.y - Math.min(170, dist(v, lBot) * 0.6) }, `${value.toFixed(1)}°`),
    ];
    // never let a far-away intersection zoom the camera out
    const clamp = (p: Pt): Pt => ({ x: Math.max(0, Math.min(1000, p.x)), y: Math.max(0, Math.min(1000, p.y)) });
    return { prims, focus: [lBot, rBot, lChin, rChin, clamp(v), L.chinBottom] };
  },

  jawSlope: ({ L, value }) => {
    const prims: Prim[] = [];
    const focus: Pt[] = [];
    for (const s of ["left", "right"]) {
      const cheek = L[`${s}Cheek`];
      const top = L[`${s}TopGonion`];
      const chin = s === "left" ? L.chinLeft : L.chinRight;
      prims.push(dot(cheek, "base"), dot(top), dot(chin, "base"));
      prims.push(line(cheek, top, "main"), line(top, chin, "main"));
      prims.push(arc(top, cheek, chin, 55, "base"));
      focus.push(cheek, top, chin);
    }
    const t = mid(L.leftTopGonion, L.rightTopGonion);
    prims.push(label({ x: t.x, y: L.chinBottom.y + 50 }, `${value.toFixed(1)}° avg`));
    return { prims, focus };
  },

  bigonialWidth: ({ L, value }) => {
    const lc = L.leftCheek;
    const rc = L.rightCheek;
    const lg = L.leftBottomGonion;
    const rg = L.rightBottomGonion;
    const prims: Prim[] = [
      line(lc, rc, "ref", REF, { dashed: true }),
      dot(lc, "base"),
      dot(rc, "base"),
      dot(lg),
      dot(rg),
      bracket(lg, rg, "main"),
      label(off(mid(lg, rg), 0, 60), `${value.toFixed(1)}%`),
    ];
    return { prims, focus: [lc, rc, lg, rg, L.chinBottom] };
  },

  chinPhiltrum: ({ L, value }) => {
    const chin = L.chinBottom;
    const lip = L.lowerLip;
    const cup = L.innerCupidsBow;
    const nose = L.noseBottom;
    const x = chin.x;
    const prims: Prim[] = [
      dot({ x, y: chin.y }),
      dot({ x, y: lip.y }),
      bracket({ x, y: lip.y }, { x, y: chin.y }, "main"),
      dot({ x: x + 70, y: cup.y }, "base"),
      dot({ x: x + 70, y: nose.y }, "base"),
      bracket({ x: x + 70, y: nose.y }, { x: x + 70, y: cup.y }, "base"),
      label({ x: x + 175, y: (lip.y + chin.y) / 2 }, `${value.toFixed(2)}x`),
    ];
    return { prims, focus: [chin, nose, { x: x - 90, y: lip.y }, { x: x + 150, y: cup.y }] };
  },

  lipRatio: ({ L, value }) => {
    const upper = L.cupidsBow;
    const middle = L.mouthMiddle;
    const lower = L.lowerLip;
    const ox = 70;
    const prims: Prim[] = [
      dot({ x: middle.x + ox, y: upper.y }, "base"),
      dot({ x: middle.x + ox, y: middle.y }, "base"),
      bracket({ x: middle.x + ox, y: upper.y }, { x: middle.x + ox, y: middle.y }, "base"),
      dot({ x: middle.x, y: middle.y }),
      dot({ x: middle.x, y: lower.y }),
      bracket({ x: middle.x, y: middle.y }, { x: middle.x, y: lower.y }, "main"),
      label({ x: middle.x - 120, y: (middle.y + lower.y) / 2 }, `${value.toFixed(2)}x`),
    ];
    return { prims, focus: [off(upper, -110, -30), off(lower, 140, 40), L.mouthLeft, L.mouthRight] };
  },

  mouthToNoseWidth: ({ L, value }) => {
    const nl = L.noseLeft;
    const nr = L.noseRight;
    const ml = L.mouthLeft;
    const mr = L.mouthRight;
    const prims: Prim[] = [
      line(nl, { x: nl.x, y: ml.y }, "ref", REF, { dashed: true }),
      line(nr, { x: nr.x, y: mr.y }, "ref", REF, { dashed: true }),
      dot(nl, "base"),
      dot(nr, "base"),
      bracket(nl, nr, "base"),
      dot(ml),
      dot(mr),
      bracket(ml, mr, "main"),
      label(off(mid(ml, mr), 0, 70), `${value.toFixed(2)}x`),
    ];
    return { prims, focus: [nl, nr, ml, mr, L.chinBottom] };
  },

  interpupillaryMouth: ({ L, value }) => {
    const lp = L.leftEyePupil;
    const rp = L.rightEyePupil;
    const ml = L.mouthLeft;
    const mr = L.mouthRight;
    const prims: Prim[] = [
      line(lp, { x: lp.x, y: ml.y }, "ref", REF, { dashed: true }),
      line(rp, { x: rp.x, y: mr.y }, "ref", REF, { dashed: true }),
      dot(lp, "base"),
      dot(rp, "base"),
      bracket(lp, rp, "base"),
      dot(ml),
      dot(mr),
      bracket(ml, mr, "main"),
      label(off(mid(ml, mr), 0, 70), `${value.toFixed(2)}x`),
    ];
    return { prims, focus: [lp, rp, ml, mr, L.chinBottom] };
  },

  ipsilateralAlarAngle: ({ L, value }) => {
    const lc = L.leftEyeLateralCanthus;
    const rc = L.rightEyeLateralCanthus;
    const n = L.noseBottom;
    const prims: Prim[] = [
      dot(lc),
      dot(rc),
      dot(n),
      line(lc, n, "main"),
      line(rc, n, "main"),
      arc(n, lc, rc, 110, "base"),
      label(off(n, 0, 70), `${value.toFixed(1)}°`),
    ];
    return { prims, focus: [lc, rc, n, off(n, 0, 90)] };
  },

  intercanthalNasal: ({ L, value }) => {
    const lIn = L.leftEyeMedialCanthus;
    const rIn = L.rightEyeMedialCanthus;
    const nl = L.noseLeft;
    const nr = L.noseRight;
    const prims: Prim[] = [
      line(lIn, { x: lIn.x, y: nl.y }, "ref", REF, { dashed: true }),
      line(rIn, { x: rIn.x, y: nr.y }, "ref", REF, { dashed: true }),
      dot(lIn, "base"),
      dot(rIn, "base"),
      bracket(lIn, rIn, "base"),
      dot(nl),
      dot(nr),
      bracket(nl, nr, "main"),
      label(off(mid(nl, nr), 0, 65), `${value.toFixed(2)}x`),
    ];
    return { prims, focus: [lIn, rIn, nl, nr] };
  },
};

/** thirds: guide lines at hairline / brow / nose base / chin, with the measured third highlighted. */
function thirdsVisual(i: VisualInput, from: "hairline" | "brow" | "nose", to: "brow" | "nose" | "chin"): Visual {
  const { L, value } = i;
  const ys = {
    hairline: L.hairline.y,
    brow: (L.leftBrowInnerCorner.y + L.rightBrowInnerCorner.y) / 2,
    nose: L.noseBottom.y,
    chin: L.chinBottom.y,
  };
  const x0 = L.leftCheek.x - 60;
  const x1 = L.rightCheek.x + 60;
  const cx = L.noseBottom.x;
  const prims: Prim[] = [];
  (Object.keys(ys) as (keyof typeof ys)[]).forEach((k) => {
    prims.push(line({ x: x0, y: ys[k] }, { x: x1, y: ys[k] }, "ref", REF, { dashed: true }));
  });
  prims.push(dot({ x: cx, y: ys[from] }), dot({ x: cx, y: ys[to] }));
  prims.push(line({ x: cx, y: ys[from] }, { x: cx, y: ys[to] }, "main"));
  prims.push(label({ x: cx + 150, y: (ys[from] + ys[to]) / 2 }, `${value.toFixed(1)}%`));
  return { prims, focus: [L.hairline, L.chinBottom, L.leftCheek, L.rightCheek] };
}

BUILDERS.upperThird = (i) => thirdsVisual(i, "hairline", "brow");
BUILDERS.middleThird = (i) => thirdsVisual(i, "brow", "nose");
BUILDERS.lowerThird = (i) => thirdsVisual(i, "nose", "chin");

/** Fallback for any ratio without a bespoke drawing: just highlight its related landmarks. */
function genericVisual(L: Record<string, Pt>, related: string[]): Visual {
  const pts = related.map((k) => L[k]).filter(Boolean);
  const prims: Prim[] = pts.map((p) => dot(p));
  if (pts.length === 2) prims.push(line(pts[0], pts[1], "main"));
  return { prims, focus: pts.length ? pts : [{ x: 500, y: 500 }] };
}

export function buildVisual(key: string, input: VisualInput, related: string[] = []): Visual {
  const builder = BUILDERS[key];
  if (builder) {
    try {
      return builder(input);
    } catch {
      /* landmark missing - fall through to the generic drawing */
    }
  }
  return genericVisual(input.L, related);
}

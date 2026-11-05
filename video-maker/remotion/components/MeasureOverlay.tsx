import React from "react";
import type { Pt } from "../../shared/types";
import type { Prim } from "../../shared/visuals";
import { FONT, easeOutBack, easeOutCubic, prog, roleColor } from "../theme";

interface Props {
  prims: Prim[];
  map: (p: Pt) => Pt;
  zoom: number;
  /** card size in px (1000 for the short, 880 for the long-form) */
  size: number;
  frame: number;
  /** frame at which the first primitive starts drawing */
  start: number;
  score: number;
}

type Timed<T extends Prim> = { p: T; delay: number };

const cap = (a: Pt, b: Pt, at: Pt, len: number) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const l = Math.hypot(dx, dy) || 1;
  const nx = (-dy / l) * len;
  const ny = (dx / l) * len;
  return { x1: at.x - nx, y1: at.y - ny, x2: at.x + nx, y2: at.y + ny };
};

const Line: React.FC<{ t: Timed<Extract<Prim, { t: "line" }>>; map: Props["map"]; frame: number; score: number }> = ({
  t: { p, delay },
  map,
  frame,
  score,
}) => {
  const k = easeOutCubic(prog(frame, delay, 17));
  if (k <= 0) return null;
  const A = map(p.a);
  const B = map(p.b);
  const E = { x: A.x + (B.x - A.x) * k, y: A.y + (B.y - A.y) * k };
  const color = roleColor(p.role, score);

  if (p.role === "ref" || p.dashed) {
    return (
      <line
        x1={A.x}
        y1={A.y}
        x2={E.x}
        y2={E.y}
        stroke={color}
        strokeWidth={p.role === "ref" ? 3.5 : 4.5}
        strokeDasharray="16 12"
        strokeLinecap="round"
        opacity={0.85}
      />
    );
  }

  const white = p.role === "base";
  const layers = white
    ? [
        { w: 22, o: 0.1 },
        { w: 11, o: 0.2 },
        { w: 6, o: 1 },
      ]
    : [
        { w: 30, o: 0.1 },
        { w: 16, o: 0.22 },
        { w: 8, o: 1 },
      ];
  const capLen = 20;
  return (
    <g strokeLinecap="round">
      {layers.map((l, i) => (
        <line key={i} x1={A.x} y1={A.y} x2={E.x} y2={E.y} stroke={color} strokeWidth={l.w} opacity={l.o} />
      ))}
      {!white && <line x1={A.x} y1={A.y} x2={E.x} y2={E.y} stroke="#fff" strokeWidth={2.5} opacity={0.85} />}
      {p.caps && (
        <>
          <line {...cap(A, B, A, capLen)} stroke={color} strokeWidth={6} />
          {k > 0.97 && <line {...cap(A, B, B, capLen)} stroke={color} strokeWidth={6} />}
        </>
      )}
    </g>
  );
};

const Dot: React.FC<{ t: Timed<Extract<Prim, { t: "dot" }>>; map: Props["map"]; frame: number; score: number }> = ({
  t: { p, delay },
  map,
  frame,
  score,
}) => {
  const k = prog(frame, delay, 12);
  if (k <= 0) return null;
  const s = easeOutBack(k);
  const ring = prog(frame, delay, 26);
  const pos = map(p.p);
  const color = roleColor(p.role, score);
  return (
    <g transform={`translate(${pos.x},${pos.y})`}>
      <circle r={12 + 34 * ring} fill="none" stroke={color} strokeWidth={3} opacity={0.75 * (1 - ring)} />
      <circle r={15 * s} fill={color} opacity={0.3} />
      <circle r={9 * s} fill={color} />
      <circle r={3.6 * s} fill="#fff" />
    </g>
  );
};

const ArcView: React.FC<{
  t: Timed<Extract<Prim, { t: "arc" }>>;
  map: Props["map"];
  zoom: number;
  frame: number;
  score: number;
}> = ({ t: { p, delay }, map, zoom, frame, score }) => {
  const k = easeOutCubic(prog(frame, delay, 20));
  if (k <= 0) return null;
  const C = map(p.c);
  const r = p.r * zoom;
  const a0 = Math.atan2(p.a.y - p.c.y, p.a.x - p.c.x);
  const a1 = Math.atan2(p.b.y - p.c.y, p.b.x - p.c.x);
  let d = a1 - a0;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  const N = 32;
  const pts: string[] = [];
  for (let i = 0; i <= N; i++) {
    const th = a0 + d * k * (i / N);
    pts.push(`${(C.x + r * Math.cos(th)).toFixed(1)},${(C.y + r * Math.sin(th)).toFixed(1)}`);
  }
  const color = roleColor(p.role, score);
  return (
    <g>
      <polygon points={`${C.x},${C.y} ${pts.join(" ")}`} fill={color} opacity={0.14} />
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth={14} opacity={0.2} strokeLinecap="round" />
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth={5.5} strokeLinecap="round" />
    </g>
  );
};

const Label: React.FC<{
  t: Timed<Extract<Prim, { t: "label" }>>;
  map: Props["map"];
  size: number;
  frame: number;
  score: number;
}> = ({ t: { p, delay }, map, size, frame, score }) => {
  const k = easeOutCubic(prog(frame, delay, 14));
  if (k <= 0) return null;
  const raw = map(p.p);
  const margin = 110;
  const x = Math.max(margin, Math.min(size - margin, raw.x));
  const y = Math.max(70, Math.min(size - 130, raw.y));
  const color = roleColor(p.role, score);
  const w = p.text.length * 25 + 48;
  return (
    <g transform={`translate(${x},${y + (1 - k) * 16}) scale(${0.88 + 0.12 * k})`} opacity={k}>
      <rect x={-w / 2} y={-36} width={w} height={72} rx={18} fill="rgba(5,5,16,0.84)" stroke={color} strokeWidth={2.5} />
      <text
        textAnchor="middle"
        y={14}
        fontSize={42}
        fontWeight={800}
        fill={color}
        fontFamily={FONT}
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {p.text}
      </text>
    </g>
  );
};

/** Draws the measurement primitives progressively: guides and points first, then lines, arcs and labels. */
export const MeasureOverlay: React.FC<Props> = ({ prims, map, zoom, size, frame, start, score }) => {
  const counters: Record<number, number> = {};
  const timed = prims.map((p) => {
    const n = counters[p.order] ?? 0;
    counters[p.order] = n + 1;
    return { p, delay: start + p.order * 9 + n * 3 };
  });
  const of = <K extends Prim["t"]>(kind: K) =>
    timed.filter((x) => x.p.t === kind) as unknown as Timed<Extract<Prim, { t: K }>>[];

  const lines = of("line");
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: "absolute", left: 0, top: 0 }}>
      {of("arc").map((t, i) => (
        <ArcView key={`a${i}`} t={t} map={map} zoom={zoom} frame={frame} score={score} />
      ))}
      {lines
        .filter((t) => t.p.role === "ref" || t.p.dashed)
        .map((t, i) => (
          <Line key={`r${i}`} t={t} map={map} frame={frame} score={score} />
        ))}
      {lines
        .filter((t) => !(t.p.role === "ref" || t.p.dashed))
        .map((t, i) => (
          <Line key={`l${i}`} t={t} map={map} frame={frame} score={score} />
        ))}
      {of("dot").map((t, i) => (
        <Dot key={`d${i}`} t={t} map={map} frame={frame} score={score} />
      ))}
      {of("label").map((t, i) => (
        <Label key={`t${i}`} t={t} map={map} size={size} frame={frame} score={score} />
      ))}
    </svg>
  );
};

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { Point } from "../../types";
import { CONSTELLATION } from "./sections";
import type { SectionKey } from "./scanData";

const EASE = [0.23, 1, 0.32, 1] as const;

/* -------------------------------------------------------------------------------------------------
 * CaliperRule - the signature element. A tick scale from 0 to 100 with a marker for where a value sits.
 * Used for the percentile on the hero, and (with `steps`) as a "n of m done" gauge.
 * ---------------------------------------------------------------------------------------------- */
export const CaliperRule: React.FC<{
  value: number;
  /** Optional second marker, e.g. the previous scan. */
  ghost?: number | null;
  /** The value the scale is "average" at; draws a labelled notch. */
  average?: number;
  label?: string;
  masked?: boolean;
}> = ({ value, ghost, average = 50, label, masked }) => {
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const reduce = useReducedMotion();

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    setWidth(el.clientWidth);
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pos = (v: number) => (Math.max(0, Math.min(100, v)) / 100) * width;
  const ticks = useMemo(() => Array.from({ length: 51 }, (_, i) => i * 2), []);

  return (
    <div ref={box} className="relative h-14 select-none" aria-label={label}>
      {/* ticks */}
      <div className="absolute inset-x-0 top-6 flex justify-between">
        {ticks.map((t) => {
          const major = t % 10 === 0;
          const passed = !masked && t <= value;
          return (
            <span
              key={t}
              className="block w-px"
              style={{
                height: major ? 14 : t % 5 === 0 ? 10 : 6,
                background: passed ? "var(--d-accent)" : "var(--d-line3)",
                opacity: passed ? (major ? 1 : 0.7) : 1,
                transition: "background-color 400ms var(--d-ease)",
              }}
            />
          );
        })}
      </div>
      {/* scale labels */}
      <div className="d-mono absolute inset-x-0 bottom-0 flex justify-between text-[11px] text-[var(--d-t4)]">
        <span>0</span>
        <span style={{ marginLeft: average < 50 ? 0 : undefined }}>{average}</span>
        <span>100</span>
      </div>
      {/* previous scan */}
      {ghost != null && !masked && width > 0 && (
        <div className="absolute top-3 h-6 w-px border-l border-dashed border-[var(--d-t3)]" style={{ transform: `translateX(${pos(ghost)}px)` }}>
          <span className="d-mono absolute -top-3 -translate-x-1/2 text-[10px] uppercase tracking-wider text-[var(--d-t3)]">prev</span>
        </div>
      )}
      {/* current value marker */}
      {width > 0 && (
        <motion.div
          className="absolute left-0 top-0"
          initial={{ x: reduce ? pos(value) : 0, opacity: reduce ? 1 : 0 }}
          animate={{ x: masked ? pos(average) : pos(value), opacity: 1 }}
          transition={{ duration: reduce ? 0 : 1.1, ease: EASE, delay: reduce ? 0 : 0.25 }}
        >
          <div className="relative -translate-x-1/2">
            <div
              className="d-mono d-num -translate-y-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-semibold"
              style={{ background: masked ? "var(--d-s3)" : "var(--d-accent)", color: masked ? "var(--d-t3)" : "#07080d" }}
            >
              {masked ? "??" : Math.round(value)}
            </div>
            <div className="mx-auto h-[22px] w-px" style={{ background: masked ? "var(--d-t4)" : "var(--d-accent)" }} />
          </div>
        </motion.div>
      )}
    </div>
  );
};

/** A row of ticks that fills up: "3 of 4 reports ready". */
export const StepTicks: React.FC<{ done: number; total: number }> = ({ done, total }) => (
  <div className="flex items-end gap-1.5" role="img" aria-label={`${done} of ${total} complete`}>
    {Array.from({ length: total }, (_, i) => (
      <span
        key={i}
        className="block w-full rounded-[2px]"
        style={{
          height: 18,
          background: i < done ? "var(--d-accent)" : "transparent",
          border: `1px solid ${i < done ? "var(--d-accent)" : "var(--d-line3)"}`,
          transition: "background-color 500ms var(--d-ease)",
        }}
      />
    ))}
  </div>
);

/* -------------------------------------------------------------------------------------------------
 * ScanPortrait - the user's own photo with the landmark constellation drawn over it.
 * Landmarks are 0-1000 on the (square) standardised photo, the same space the scan was measured in.
 * ---------------------------------------------------------------------------------------------- */
export const ScanPortrait: React.FC<{
  src: string;
  landmarks?: Record<string, Point> | null;
  className?: string;
  /** Hide the constellation (e.g. a locked preview). */
  plain?: boolean;
  alt?: string;
  /** Tailwind aspect classes for the frame. The photo and the overlay crop identically, so any ratio stays aligned. */
  aspect?: string;
}> = ({ src, landmarks, className = "", plain, alt = "Your latest scan", aspect = "aspect-square" }) => {
  const lines = useMemo(() => {
    if (!landmarks) return [];
    return CONSTELLATION.map((chain) => chain.map((k) => landmarks[k]).filter(Boolean) as Point[]).filter((c) => c.length > 1);
  }, [landmarks]);
  const dots = useMemo(() => (landmarks ? (Object.values(landmarks) as Point[]).filter((p) => p && Number.isFinite(p.x)) : []), [landmarks]);

  return (
    <div className={`relative overflow-hidden bg-[var(--d-s2)] ${aspect} ${className}`}>
      <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover" loading="eager" />
      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(7,8,13,0.55), transparent 45%)" }} />
      {!plain && dots.length > 0 && (
        <>
          <svg viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden="true">
            {lines.map((pts, i) => (
              <motion.polyline
                key={i}
                points={pts.map((p) => `${p.x},${p.y}`).join(" ")}
                fill="none"
                stroke="var(--d-accent)"
                strokeWidth={2.2}
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.85 }}
                transition={{ duration: 1.1, delay: 0.4 + i * 0.07, ease: EASE }}
              />
            ))}
            {dots.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={3.4} fill="#fff" fillOpacity={0.9} />
            ))}
          </svg>
          <div className="d-scanline" />
        </>
      )}
      {/* caliper corners */}
      {[
        "left-3 top-3 border-l border-t",
        "right-3 top-3 border-r border-t",
        "bottom-3 left-3 border-b border-l",
        "bottom-3 right-3 border-b border-r",
      ].map((c) => (
        <span key={c} className={`pointer-events-none absolute h-4 w-4 border-[var(--d-t2)] opacity-70 ${c}`} />
      ))}
    </div>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Sparkline of score over time.
 * ---------------------------------------------------------------------------------------------- */
export const ScoreTrend: React.FC<{ points: { score: number; label: string }[]; masked?: boolean }> = ({ points, masked }) => {
  const w = 560;
  const h = 150;
  const pad = { l: 6, r: 6, t: 14, b: 22 };
  const scores = points.map((p) => p.score);
  const lo = Math.max(0, Math.min(...scores, 50) - 6);
  const hi = Math.min(100, Math.max(...scores, 50) + 6);
  const x = (i: number) => pad.l + (points.length === 1 ? (w - pad.l - pad.r) / 2 : (i / (points.length - 1)) * (w - pad.l - pad.r));
  const y = (v: number) => pad.t + (1 - (v - lo) / (hi - lo || 1)) * (h - pad.t - pad.b);
  const line = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(p.score).toFixed(1)}`).join("");
  const area = `${line}L${x(points.length - 1).toFixed(1)} ${h - pad.b}L${x(0).toFixed(1)} ${h - pad.b}Z`;
  const avgY = y(50);
  const reduce = useReducedMotion();

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-auto w-full overflow-visible" role="img" aria-label="Score over time" style={masked ? { filter: "blur(6px)", opacity: 0.55 } : undefined}>
      <defs>
        <linearGradient id="d-trend" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="var(--d-accent)" stopOpacity="0.22" />
          <stop offset="1" stopColor="var(--d-accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {avgY > pad.t && avgY < h - pad.b && (
        <>
          <line x1={pad.l} x2={w - pad.r} y1={avgY} y2={avgY} stroke="var(--d-line3)" strokeDasharray="3 5" />
          <text x={w - pad.r} y={avgY - 6} textAnchor="end" fontSize="10" fill="var(--d-t3)" fontFamily="var(--d-mono)">
            AVERAGE FACE · 50
          </text>
        </>
      )}
      <path d={area} fill="url(#d-trend)" />
      <motion.path
        d={line}
        fill="none"
        stroke="var(--d-accent)"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        initial={{ pathLength: reduce ? 1 : 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.1, ease: EASE, delay: 0.2 }}
      />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(p.score)} r={4} fill="var(--d-bg)" stroke="var(--d-accent)" strokeWidth={2} />
          {(i === 0 || i === points.length - 1 || points.length <= 6) && (
            <text x={x(i)} y={h - 4} textAnchor={i === 0 && points.length > 1 ? "start" : i === points.length - 1 && points.length > 1 ? "end" : "middle"} fontSize="10" fill="var(--d-t3)" fontFamily="var(--d-mono)">
              {p.label}
            </text>
          )}
          {i === points.length - 1 && (
            <text x={x(i)} y={y(p.score) - 11} textAnchor={points.length > 1 ? "end" : "middle"} fontSize="12" fontWeight="600" fill="var(--d-t1)" fontFamily="var(--d-mono)">
              {p.score}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Line illustrations, one per report. Strokes use the muted text tone; the accent marks the one idea.
 * ---------------------------------------------------------------------------------------------- */
const T = "var(--d-t3)";
const A = "var(--d-accent)";

const FacialArt = () => (
  <g fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2">
    {/* golden rectangle, faint */}
    <g stroke={T} opacity="0.35">
      <rect x="14" y="30" width="86" height="86" />
      <path d="M52 30v86M14 78h38M52 78v38" opacity="0.7" />
    </g>
    {/* face */}
    <path d="M120 24c-24 0-38 20-38 48 0 30 14 54 38 54s38-24 38-54c0-28-14-48-38-48Z" stroke={T} />
    <path d="M98 66c4-3 10-3 14 0M128 66c4-3 10-3 14 0M120 72v14M112 90c5 3 11 3 16 0M110 106c6 4 14 4 20 0" stroke={T} />
    {/* caliper across the eyes */}
    <g stroke={A}>
      <path d="M100 50h40M100 46v8M140 46v8" />
      <path d="M170 24v102M164 24h12M164 58h12M164 92h12M164 126h12" />
      <path d="M142 58h22M140 92h24" strokeDasharray="2 3" opacity="0.7" />
    </g>
    {[[105, 66], [135, 66], [120, 86], [120, 106], [89, 82], [151, 82], [120, 126]].map(([cx, cy], i) => (
      <circle key={i} cx={cx} cy={cy} r="2" fill={A} stroke="none" />
    ))}
  </g>
);

const SkincareArt = () => (
  <g fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2">
    <ellipse cx="120" cy="112" rx="36" ry="7" stroke={T} opacity="0.7" />
    <ellipse cx="120" cy="112" rx="62" ry="12" stroke={T} opacity="0.4" />
    <ellipse cx="120" cy="112" rx="92" ry="17" stroke={T} opacity="0.2" />
    <path d="M120 30c0 0-24 32-24 52a24 24 0 0 0 48 0c0-20-24-52-24-52Z" stroke={A} />
    <path d="M108 84c0 8 5 14 12 15" stroke={A} opacity="0.6" />
    {/* sun */}
    <g stroke={T}>
      <circle cx="38" cy="42" r="8" />
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i * Math.PI) / 4;
        return <path key={i} d={`M${38 + Math.cos(a) * 13} ${42 + Math.sin(a) * 13}L${38 + Math.cos(a) * 17} ${42 + Math.sin(a) * 17}`} />;
      })}
      <path d="M46 48c20 6 36 18 50 30" strokeDasharray="2 4" opacity="0.7" />
    </g>
    {/* moon */}
    <g stroke={T}>
      <path d="M204 34a12 12 0 1 0 8 20 10 10 0 0 1-8-20Z" />
      <path d="M194 52c-18 4-34 16-48 28" strokeDasharray="2 4" opacity="0.7" />
    </g>
  </g>
);

const ColorArt = () => {
  const swatches = [
    { c: "#d8b998", x: 56, y: 96 },
    { c: "#c98363", x: 88, y: 66 },
    { c: "#93a272", x: 124, y: 52 },
    { c: "#7f95b8", x: 160, y: 66 },
    { c: "#a2788f", x: 192, y: 96 },
  ];
  return (
    <g fill="none" strokeLinecap="round" strokeWidth="1.2">
      {swatches.map((s) => (
        <circle key={s.c} cx={s.x} cy={s.y} r="25" fill={s.c} fillOpacity="0.28" stroke={s.c} strokeOpacity="0.85" />
      ))}
      <g stroke={T}>
        <path d="M30 132h180" opacity="0.6" />
        {Array.from({ length: 19 }, (_, i) => (
          <path key={i} d={`M${30 + i * 10} 132v${i % 3 === 0 ? 6 : 3}`} opacity="0.6" />
        ))}
      </g>
      <path d="M56 124v8M124 124v8M192 124v8" stroke={A} />
    </g>
  );
};

const HairArt = () => (
  <g fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2">
    {/* long, dashed */}
    <path d="M84 92C66 70 72 30 120 26c48-4 58 44 36 66 6 22 10 36 4 50" stroke={T} strokeDasharray="3 4" opacity="0.6" />
    <path d="M84 92C80 112 78 126 84 140" stroke={T} strokeDasharray="3 4" opacity="0.6" />
    {/* volume, dashed */}
    <path d="M80 86C70 44 98 18 130 22c30 4 44 32 32 64" stroke={T} strokeDasharray="3 4" opacity="0.45" />
    {/* face */}
    <path d="M120 44c-20 0-34 18-34 44s14 46 34 46 34-20 34-46-14-44-34-44Z" stroke={T} />
    <path d="M100 82c3-2 8-2 11 0M129 82c3-2 8-2 11 0M120 88v12M113 112c4 2 10 2 14 0" stroke={T} />
    {/* chosen cut */}
    <path d="M86 78C82 44 104 32 122 32c24 0 36 18 32 46-6-18-18-28-34-28-14 2-26 12-34 28Z" stroke={A} fill="rgba(154,168,255,0.14)" />
    <path d="M168 36l5 6 11-13" stroke={A} strokeWidth="1.6" />
  </g>
);

const ART: Record<SectionKey, React.FC> = { facial: FacialArt, skincare: SkincareArt, color: ColorArt, hairstyle: HairArt };

export const SectionArt: React.FC<{ kind: SectionKey; className?: string }> = ({ kind, className = "" }) => {
  const Art = ART[kind];
  return (
    <svg viewBox="0 0 240 150" className={className} role="img" aria-hidden="true">
      <Art />
    </svg>
  );
};

/** Wrapper that fades children up as they enter the viewport. Transform + opacity only. */
export const Reveal: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({ children, delay = 0, className }) => {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.7, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
};

/** Counts a number up once on mount. */
export const CountUp: React.FC<{ value: number; className?: string }> = ({ value, className }) => {
  const reduce = useReducedMotion();
  const [n, setN] = useState(reduce ? value : 0);
  useEffect(() => {
    if (reduce) return setN(value);
    let raf = 0;
    const start = performance.now();
    const dur = 1100;
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / dur);
      setN(Math.round(value * (1 - Math.pow(1 - k, 4))));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, reduce]);
  return <span className={className}>{n}</span>;
};

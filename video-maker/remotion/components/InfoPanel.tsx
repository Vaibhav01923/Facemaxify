import React from "react";
import { useCurrentFrame } from "remotion";
import type { MetricScene } from "../../shared/types";
import { formatRange, scoreColor, scoreLabel } from "../../shared/format";
import { useLayout } from "../layout";
import { COLORS, FONT, MONO, clamp01, easeOutBack, easeOutCubic, prog } from "../theme";

interface Props {
  scene: MetricScene;
  index: number;
  total: number;
  /** frame at which the score is revealed */
  reveal: number;
}

const label: React.CSSProperties = {
  fontFamily: FONT,
  fontSize: 22,
  fontWeight: 700,
  letterSpacing: "0.2em",
  color: COLORS.muted,
  textTransform: "uppercase",
};

/** Element positions for each layout (px). */
const TALL = {
  kicker: { left: 60, top: 1232 },
  name: { left: 60, top: 1274, width: 540, size: 62 },
  measured: { left: 60, top: 1448 },
  score: { side: "right" as const, edge: 60, top: 1196, width: 440, size: 196 },
  chip: { right: 60, top: 1432 },
  bar: { left: 60, top: 1640, width: 960 },
};
const WIDE = {
  kicker: { left: 1010, top: 150 },
  name: { left: 1010, top: 188, width: 850, size: 76 },
  measured: { left: 1010, top: 548 },
  score: { side: "left" as const, edge: 1010, top: 286, width: 600, size: 200 },
  chip: { right: 60, top: 418 },
  bar: { left: 1010, top: 730, width: 850 },
};

/** Metric name, measured value, count-up score, rating chip and the ideal-range bar (as on the Facemaxify site). */
export const InfoPanel: React.FC<Props> = ({ scene, index, total, reveal }) => {
  const frame = useCurrentFrame();
  const { wide } = useLayout();
  const P = wide ? WIDE : TALL;

  const fadeUp = (start: number, dur = 14) => {
    const k = easeOutCubic(prog(frame, start, dur));
    return { opacity: k, transform: `translateY(${(1 - k) * 22}px)` } as React.CSSProperties;
  };

  const scoreK = easeOutCubic(prog(frame, reveal, 26));
  const shown = scene.score * scoreK;
  const color = scoreColor(scoreK > 0 ? shown : scene.score);
  const finalColor = scoreColor(scene.score);
  const pop = easeOutBack(prog(frame, reveal, 14));
  const chipK = easeOutBack(prog(frame, reveal + 24, 14));

  // ideal-range bar, same scale as RatioRow
  const barMin = scene.idealMin * 0.5;
  const barMax = scene.idealMax * 1.5;
  const total_ = barMax - barMin || 1;
  const pct = (v: number) => Math.max(0, Math.min(100, ((v - barMin) / total_) * 100));
  const youPct = pct(scene.value);
  const idealStart = pct(scene.idealMin);
  const idealWidth = pct(scene.idealMax) - idealStart;
  const knobK = easeOutCubic(prog(frame, reveal - 6, 34));
  const knobPct = youPct * knobK;

  const scoreText = shown >= 9.95 ? "10" : shown.toFixed(1);
  const nameSize = wide && scene.short.length > 17 ? 64 : P.name.size;
  const leftScore = P.score.side === "left";
  const scorePos: React.CSSProperties = leftScore ? { left: P.score.edge } : { right: P.score.edge };

  return (
    <>
      {/* kicker + name */}
      <div style={{ position: "absolute", left: P.kicker.left, top: P.kicker.top, ...fadeUp(6) }}>
        <div style={label}>
          Ratio {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: P.name.left,
          top: P.name.top,
          width: P.name.width,
          fontFamily: FONT,
          fontSize: nameSize,
          fontWeight: 800,
          lineHeight: 1.04,
          letterSpacing: "-0.01em",
          color: "#fff",
          ...fadeUp(9),
        }}
      >
        {scene.short}
      </div>

      {/* measured + ideal */}
      <div style={{ position: "absolute", left: P.measured.left, top: P.measured.top, display: "flex", gap: 56, ...fadeUp(34) }}>
        <div>
          <div style={label}>Measured</div>
          <div style={{ fontFamily: FONT, fontSize: 58, fontWeight: 800, color: "#fff", fontVariantNumeric: "tabular-nums" }}>
            {scene.displayValue}
          </div>
        </div>
        <div>
          <div style={label}>Ideal range</div>
          <div
            style={{
              fontFamily: FONT,
              fontSize: 34,
              fontWeight: 700,
              color: "#cfd3ee",
              marginTop: 12,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {formatRange(scene.idealMin, scene.idealMax, scene.unit)}
          </div>
        </div>
      </div>

      {/* score */}
      <div
        style={{
          position: "absolute",
          ...scorePos,
          top: P.score.top,
          width: P.score.width,
          textAlign: leftScore ? "left" : "right",
          opacity: scoreK > 0 ? 1 : 0,
          transform: `scale(${0.82 + 0.18 * pop})`,
          transformOrigin: leftScore ? "0% 50%" : "100% 50%",
        }}
      >
        <div
          style={{
            position: "absolute",
            ...(leftScore ? { left: -40 } : { right: -40 }),
            top: -10,
            width: 560,
            height: 330,
            background: `radial-gradient(closest-side, ${finalColor}33, transparent)`,
            opacity: clamp01(scoreK),
          }}
        />
        <div
          style={{
            position: "relative",
            display: "flex",
            justifyContent: leftScore ? "flex-start" : "flex-end",
            alignItems: "baseline",
          }}
        >
          <span
            style={{
              fontFamily: FONT,
              fontSize: P.score.size,
              fontWeight: 800,
              lineHeight: 1,
              color,
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "-0.03em",
              textShadow: `0 0 50px ${color}66`,
            }}
          >
            {scoreText}
          </span>
          <span style={{ fontFamily: FONT, fontSize: 46, fontWeight: 700, color: COLORS.muted, marginLeft: 6 }}>/10</span>
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          right: P.chip.right,
          top: P.chip.top,
          opacity: clamp01(chipK),
          transform: `scale(${0.7 + 0.3 * chipK})`,
          transformOrigin: "100% 50%",
          fontFamily: FONT,
          fontSize: 32,
          fontWeight: 800,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: finalColor,
          padding: "10px 24px",
          borderRadius: 999,
          background: `${finalColor}22`,
          border: `2px solid ${finalColor}`,
        }}
      >
        {scoreLabel(scene.score)}
      </div>

      {/* ratio bar */}
      <div style={{ position: "absolute", left: P.bar.left, top: P.bar.top, width: P.bar.width, height: 24, ...fadeUp(40) }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: 99, background: "rgba(255,255,255,0.1)" }} />
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: `${idealStart}%`,
            width: `${idealWidth}%`,
            borderRadius: 6,
            background: "linear-gradient(90deg, transparent, rgba(16,185,129,0.55), transparent)",
            borderBottom: "4px solid rgba(16,185,129,0.85)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 12,
            left: `calc(${knobPct}% - 23px)`,
            width: 46,
            height: 46,
            marginTop: -23,
            borderRadius: "50%",
            background: "#fff",
            border: "3px solid #e2e8f0",
            boxShadow: "0 6px 24px rgba(0,0,0,0.55)",
            display: "grid",
            placeItems: "center",
          }}
        >
          <div style={{ width: 16, height: 16, borderRadius: "50%", background: COLORS.indigo }} />
        </div>
        <div
          style={{
            position: "absolute",
            left: `${knobPct}%`,
            top: -64,
            transform: "translateX(-50%)",
            opacity: clamp01(knobK * 1.4),
            fontFamily: MONO,
            fontSize: 28,
            fontWeight: 800,
            color: "#fff",
            padding: "6px 14px",
            borderRadius: 10,
            background: "rgba(5,5,16,0.85)",
            border: "1.5px solid rgba(255,255,255,0.25)",
            whiteSpace: "nowrap",
          }}
        >
          {scene.displayValue}
        </div>
      </div>
    </>
  );
};

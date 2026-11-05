import React, { useMemo } from "react";
import { AbsoluteFill, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "../Audio";
import type { Pt, VideoProps } from "../../shared/types";
import { NARRATION_LEAD } from "../../shared/timing";
import { Brand } from "../components/Brand";
import { Caption } from "../components/Caption";
import { FaceCard } from "../components/FaceCard";
import { cameraAt } from "../components/camera";
import { useLayout } from "../layout";
import { COLORS, FONT, MONO, clamp01, easeInOutCubic, easeOutBack, easeOutCubic, lerp, prog } from "../theme";

const SCAN_START = 10;

const Chip: React.FC<{ value: string; label: string; start: number }> = ({ value, label, start }) => {
  const frame = useCurrentFrame();
  const k = easeOutCubic(prog(frame, start, 14));
  return (
    <div
      style={{
        flex: 1,
        opacity: k,
        transform: `translateY(${(1 - k) * 24}px)`,
        padding: "20px 22px",
        borderRadius: 20,
        background: "rgba(255,255,255,0.06)",
        border: "1.5px solid rgba(255,255,255,0.14)",
      }}
    >
      <div style={{ fontFamily: FONT, fontSize: 56, fontWeight: 800, color: "#fff", fontVariantNumeric: "tabular-nums" }}>
        {value}
      </div>
      <div style={{ fontFamily: FONT, fontSize: 22, fontWeight: 700, letterSpacing: "0.18em", color: COLORS.muted }}>
        {label}
      </div>
    </div>
  );
};

export const ScanScene: React.FC<{ video: VideoProps }> = ({ video }) => {
  const frame = useCurrentFrame();
  const { wide, card } = useLayout();
  const { scan } = video;
  const scanFrames = video.format === "short" ? 54 : 72;
  const camera = cameraAt({ cx: 500, cy: 500, zoom: 1 }, frame, scan.durationInFrames, card.size);

  const scanK = easeInOutCubic(prog(frame, SCAN_START, scanFrames));
  const scanY = lerp(30, card.size - 30, scanK);
  const scanning = frame >= SCAN_START && scanK < 1;
  const done = scanK >= 1;

  const meshPts: Pt[] = useMemo(() => {
    if (video.mesh.length > 0) return video.mesh.map(([x, y]) => ({ x: x * 1000, y: y * 1000 }));
    return Object.values(video.landmarks);
  }, [video.mesh, video.landmarks]);
  const named = useMemo(() => Object.values(video.landmarks), [video.landmarks]);

  const countK = easeOutCubic(prog(frame, SCAN_START, scanFrames));
  const landmarkCount = Math.round(scan.landmarkCount * countK);

  const panel = wide ? { left: 1010, top: 215, width: 850 } : { left: 60, top: 1236, width: 960 };
  const statusSize = wide ? 74 : 84;

  return (
    <AbsoluteFill>
      <Brand right="FACE SCAN" />
      <FaceCard image={video.imageSrc} camera={camera} showZoom={false}>
        <svg width={card.size} height={card.size} style={{ position: "absolute", left: 0, top: 0 }}>
          {meshPts.map((p, i) => {
            const c = camera.map(p);
            const o = clamp01((scanY - c.y) / 110) * 0.85;
            return o > 0.01 ? <circle key={i} cx={c.x} cy={c.y} r={3.4} fill="#7df9ff" opacity={o} /> : null;
          })}
          {named.map((p, i) => {
            const c = camera.map(p);
            const k = easeOutBack(clamp01((scanY - c.y) / 70));
            return k > 0.01 ? (
              <g key={`n${i}`} transform={`translate(${c.x},${c.y})`}>
                <circle r={16 * k} fill={COLORS.cyan} opacity={0.28} />
                <circle r={7.5 * k} fill="#fff" />
              </g>
            ) : null;
          })}
        </svg>
        {scanning && (
          <>
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: scanY - 190,
                height: 190,
                background: "linear-gradient(to bottom, transparent, rgba(34,211,238,0.26))",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: scanY - 3,
                height: 6,
                background: `linear-gradient(90deg, transparent, ${COLORS.cyan}, transparent)`,
                boxShadow: `0 0 46px ${COLORS.cyan}, 0 0 16px #fff`,
              }}
            />
          </>
        )}
      </FaceCard>

      <div style={{ position: "absolute", left: panel.left, top: panel.top, width: panel.width }}>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: "0.2em",
            color: COLORS.muted,
            opacity: easeOutCubic(prog(frame, 6, 12)),
          }}
        >
          FACEMAXIFY AI
        </div>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: 10 }}>
          <div
            style={{
              fontFamily: FONT,
              fontSize: statusSize,
              fontWeight: 800,
              letterSpacing: "-0.01em",
              color: done ? "#34d399" : "#fff",
              opacity: easeOutCubic(prog(frame, 8, 14)),
            }}
          >
            {done ? "SCAN COMPLETE" : "ANALYSING…"}
          </div>
          <div style={{ fontFamily: MONO, fontSize: 56, fontWeight: 800, color: COLORS.cyan }}>
            {Math.round(scanK * 100)}%
          </div>
        </div>
        <div style={{ height: 14, borderRadius: 99, background: "rgba(255,255,255,0.1)", marginTop: 26, overflow: "hidden" }}>
          <div
            style={{
              width: `${scanK * 100}%`,
              height: "100%",
              background: `linear-gradient(90deg, ${COLORS.indigo}, ${COLORS.cyan})`,
              boxShadow: `0 0 24px ${COLORS.cyan}`,
            }}
          />
        </div>
        <div style={{ display: "flex", gap: 20, marginTop: 40 }}>
          <Chip value={String(landmarkCount)} label="LANDMARKS" start={SCAN_START + 8} />
          <Chip value={String(scan.ratioCount)} label="RATIOS" start={SCAN_START + 16} />
          <Chip value="AI" label="SCORING" start={SCAN_START + 24} />
        </div>
      </div>
      {wide && scan.narration && (
        <Caption
          text={scan.narration}
          start={NARRATION_LEAD}
          frames={scan.audioFrames}
          left={1010}
          top={640}
          width={850}
          size={34}
        />
      )}

      {scan.audioSrc && (
        <Sequence from={NARRATION_LEAD} layout="none">
          <Audio src={scan.audioSrc} />
        </Sequence>
      )}
      {video.sfx && (
        <>
          <Sequence from={SCAN_START - 4} layout="none">
            <Audio src={staticFile("sfx/riser.wav")} volume={0.4} />
          </Sequence>
          <Sequence from={SCAN_START + scanFrames} layout="none">
            <Audio src={staticFile("sfx/ding_hi.wav")} volume={0.5} />
          </Sequence>
        </>
      )}
    </AbsoluteFill>
  );
};

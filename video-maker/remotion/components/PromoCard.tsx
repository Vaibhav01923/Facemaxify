import React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS, FONT, easeOutBack, easeOutCubic, prog } from "../theme";

/** "Get your free analysis" card shown at the start of the video, pointing viewers to the channel's About link. */
export const PromoCard: React.FC<{ width: number; left?: number | string; top: number; start?: number; scale?: number; duration?: number }> = ({
  width,
  left = "50%",
  top,
  start = 22,
  scale = 1,
  duration = 0,
}) => {
  const frame = useCurrentFrame();
  const k = easeOutBack(prog(frame, start, 14));
  const fadeOut = duration ? 1 - easeOutCubic(prog(frame, duration - 14, 14)) : 1;
  const o = easeOutCubic(prog(frame, start, 9)) * fadeOut;
  const centered = left === "50%";
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width,
        opacity: o,
        transform: `${centered ? "translateX(-50%) " : ""}translateY(${(1 - k) * 40}px) scale(${(0.88 + 0.12 * k) * scale})`,
        transformOrigin: centered ? "50% 0" : "0 0",
        display: "flex",
        alignItems: "center",
        gap: 28,
        padding: "26px 34px",
        borderRadius: 28,
        background: "rgba(12,13,29,0.88)",
        border: `2px solid ${COLORS.neon}88`,
        boxShadow: `0 0 40px ${COLORS.neon}33`,
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          flex: "0 0 auto",
          width: 84,
          height: 84,
          borderRadius: 22,
          display: "grid",
          placeItems: "center",
          background: `linear-gradient(135deg, ${COLORS.neon}, ${COLORS.indigo})`,
          color: "#04050f",
          fontSize: 50,
          fontWeight: 800,
        }}
      >
        ↓
      </div>
      <div style={{ color: COLORS.white }}>
        <div style={{ fontSize: 44, fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.01em" }}>Get your face's free analysis</div>
        <div style={{ marginTop: 8, fontSize: 31, fontWeight: 500, lineHeight: 1.25, color: COLORS.muted }}>
          Link in the <span style={{ color: COLORS.neon, fontWeight: 700 }}>About</span> section of the channel
        </div>
      </div>
    </div>
  );
};

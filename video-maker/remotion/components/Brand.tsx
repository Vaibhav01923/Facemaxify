import React from "react";
import { useCurrentFrame } from "remotion";
import { useLayout } from "../layout";
import { COLORS, FONT, MONO, easeOutCubic, prog } from "../theme";

/** Top bar: Facemaxify wordmark on the left, optional counter/label on the right. */
export const Brand: React.FC<{ right?: string }> = ({ right }) => {
  const frame = useCurrentFrame();
  const { wide } = useLayout();
  const k = easeOutCubic(prog(frame, 2, 14));
  return (
    <div
      style={{
        position: "absolute",
        left: 60,
        right: 60,
        top: wide ? 34 : 70,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        opacity: k,
        transform: `translateY(${(1 - k) * -16}px)`,
        fontFamily: FONT,
      }}
    >
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 17,
            background: "linear-gradient(135deg,#6366f1,#22d3ee)",
            display: "grid",
            placeItems: "center",
            fontWeight: 900,
            fontSize: 32,
            color: "#04050f",
          }}
        >
          F
        </div>
        <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: "0.16em", color: "#fff" }}>FACEMAXIFY</div>
      </div>
      {right && (
        <div
          style={{
            fontFamily: MONO,
            fontSize: 30,
            fontWeight: 700,
            letterSpacing: "0.06em",
            color: "#c7cbe8",
            textShadow: "0 2px 14px rgba(0,0,0,0.9)",
          }}
        >
          {right}
        </div>
      )}
    </div>
  );
};

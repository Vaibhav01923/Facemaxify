import React from "react";
import { AbsoluteFill, Img, useCurrentFrame } from "remotion";
import type { Camera } from "./camera";
import { useLayout } from "../layout";
import { COLORS, FONT, MONO, easeOutCubic, lerp, prog } from "../theme";

const Brackets: React.FC<{ color: string; size: number }> = ({ color, size: s }) => {
  const m = 26;
  const l = 70;
  const d = [
    `M ${m} ${m + l} V ${m} H ${m + l}`,
    `M ${s - m - l} ${m} H ${s - m} V ${m + l}`,
    `M ${s - m} ${s - m - l} V ${s - m} H ${s - m - l}`,
    `M ${m + l} ${s - m} H ${m} V ${s - m - l}`,
  ];
  return (
    <svg width={s} height={s} style={{ position: "absolute", left: 0, top: 0 }}>
      {d.map((p, i) => (
        <path key={i} d={p} fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" opacity={0.85} />
      ))}
    </svg>
  );
};

/** The rounded square "viewport" that shows the (camera-framed) face, with HUD corners and a brand badge. */
export const FaceCard: React.FC<{ image: string; camera: Camera; children?: React.ReactNode; showZoom?: boolean }> = ({
  image,
  camera,
  children,
  showZoom = true,
}) => {
  const frame = useCurrentFrame();
  const { card } = useLayout();
  const k = easeOutCubic(prog(frame, 0, 14));
  return (
    <div
      style={{
        position: "absolute",
        left: card.x,
        top: card.y,
        width: card.size,
        height: card.size,
        borderRadius: card.radius,
        overflow: "hidden",
        opacity: k,
        transform: `scale(${lerp(0.94, 1, k)})`,
        boxShadow: "0 40px 100px rgba(0,0,0,0.65), 0 0 0 2px rgba(255,255,255,0.12)",
        background: "#0a0b1a",
      }}
    >
      <Img
        src={image}
        style={{
          position: "absolute",
          left: camera.left,
          top: camera.top,
          width: camera.imgPx,
          height: camera.imgPx,
          maxWidth: "none",
        }}
      />
      <AbsoluteFill style={{ background: "rgba(5,5,16,0.16)" }} />
      <AbsoluteFill
        style={{ background: "radial-gradient(circle at 50% 50%, transparent 58%, rgba(5,5,16,0.55) 100%)" }}
      />
      {children}
      <Brackets color={COLORS.cyan} size={card.size} />
      {showZoom && (
        <div
          style={{
            position: "absolute",
            left: 44,
            top: 40,
            fontFamily: MONO,
            fontSize: 30,
            fontWeight: 700,
            color: "rgba(255,255,255,0.55)",
          }}
        >
          {camera.zoom.toFixed(2)}
        </div>
      )}
      <div
        style={{
          position: "absolute",
          left: 44,
          bottom: 42,
          fontFamily: FONT,
          fontSize: 24,
          fontWeight: 800,
          letterSpacing: "0.14em",
          color: "#fff",
          padding: "10px 18px",
          borderRadius: 10,
          background: "rgba(5,5,16,0.72)",
          border: "1.5px solid rgba(255,255,255,0.22)",
        }}
      >
        FACEMAXIFY.COM
      </div>
    </div>
  );
};

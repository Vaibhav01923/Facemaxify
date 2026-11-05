import React from "react";
import { AbsoluteFill, Img, useCurrentFrame } from "remotion";
import { useLayout } from "../layout";
import { COLORS } from "../theme";

const DOT_COLORS = ["#22d3ee", "#6366f1", "#fbbf24", "#d946ef"];

const DotGrid: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useLayout();
  const gap = 60;
  const cols = Math.ceil(width / gap) + 1;
  const rows = Math.ceil(height / gap) + 2;
  const drift = (frame * 0.22) % gap;
  const dots: React.ReactNode[] = [];
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const wave = 0.5 + 0.5 * Math.sin(frame / 15 + i * 0.7 + j * 0.42);
      dots.push(
        <circle
          key={`${i}-${j}`}
          cx={i * gap + 20}
          cy={j * gap - drift}
          r={2.4}
          fill={DOT_COLORS[(i + j) % DOT_COLORS.length]}
          opacity={0.05 + 0.15 * wave}
        />
      );
    }
  }
  return (
    <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
      {dots}
    </svg>
  );
};

/** Persistent background: blurred, darkened photo + faint animated dot grid + vignette. */
export const Background: React.FC<{ backdrop?: string; image: string }> = ({ backdrop, image }) => {
  const { wide } = useLayout();
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      {backdrop ? (
        <Img src={backdrop} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <Img
          src={image}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: "scale(1.6)",
            filter: "blur(60px) brightness(0.4)",
          }}
        />
      )}
      <DotGrid />
      <AbsoluteFill
        style={{
          background: wide
            ? "radial-gradient(1500px 900px at 30% 50%, transparent 0%, rgba(5,5,16,0.78) 100%)"
            : "radial-gradient(1000px 1100px at 50% 38%, transparent 0%, rgba(5,5,16,0.72) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

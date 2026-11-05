import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";

const PALETTES: [string, string, string][] = [
  ["#ff7a18", "#ffb347", "#ff3d00"], // warm orange
  ["#ff2d95", "#ff8a3d", "#ffd166"], // magenta -> amber
  ["#22d3ee", "#6366f1", "#e0f7ff"], // Facemaxify cyan / indigo
  ["#ffcc33", "#ff5e3a", "#ff9966"], // gold / red
];

/**
 * Procedural light leak: soft coloured glows sweep across the frame and peak in a bright flash exactly in the middle
 * of the overlay, which is where the cut between two scenes happens. `offset` skips ahead (0.5 = start at the peak,
 * used for the opening reveal).
 */
export const LightLeak: React.FC<{ variant: number; offset?: number }> = ({ variant, offset = 0 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();
  const wide = width > height;
  const p = offset + (1 - offset) * (frame / Math.max(1, durationInFrames - 1));
  const intensity = Math.pow(Math.max(0, Math.sin(Math.PI * p)), 1.2);
  const [c1, c2, c3] = PALETTES[((variant % 4) + 4) % 4];
  const dir = variant % 2 === 0 ? 1 : -1;
  const x1 = 50 + dir * (p * 90 - 45);
  const x2 = 50 - dir * (p * 70 - 35);
  const flash = Math.pow(intensity, 4) * 0.8;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill
        style={{
          mixBlendMode: "screen",
          opacity: intensity,
          background: (wide
            ? [
                `radial-gradient(1250px 900px at ${x1}% 30%, ${c1} 0%, transparent 64%)`,
                `radial-gradient(1100px 820px at ${x2}% 78%, ${c2} 0%, transparent 62%)`,
                `radial-gradient(900px 640px at 50% 50%, ${c3} 0%, transparent 66%)`,
              ]
            : [
                `radial-gradient(900px 1250px at ${x1}% 28%, ${c1} 0%, transparent 64%)`,
                `radial-gradient(820px 1000px at ${x2}% 78%, ${c2} 0%, transparent 62%)`,
                `radial-gradient(640px 800px at 50% 50%, ${c3} 0%, transparent 66%)`,
              ]
          ).join(","),
        }}
      />
      <AbsoluteFill style={{ background: "#fff3df", opacity: flash, mixBlendMode: "screen" }} />
    </AbsoluteFill>
  );
};

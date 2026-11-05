import React from "react";
import { useCurrentFrame } from "remotion";
import { FONT, clamp01, easeOutCubic } from "../theme";

/**
 * Narration subtitles: the sentence is laid out once, and words light up in step with the voice.
 * Word timing is spread evenly over the audio length (the TTS engine's own word timings are not used).
 */
export const Caption: React.FC<{
  text: string;
  /** frame at which the narration starts */
  start: number;
  /** length of the narration in frames */
  frames: number;
  left: number;
  top: number;
  width: number;
  size?: number;
}> = ({ text, start, frames, left, top, width, size = 30 }) => {
  const frame = useCurrentFrame();
  const words = text.split(/\s+/).filter(Boolean);
  const p = clamp01((frame - start) / Math.max(1, frames * 0.93));
  const lit = Math.floor(p * words.length + 0.6);
  const fade = easeOutCubic(clamp01((frame - start + 8) / 12));
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width,
        fontFamily: FONT,
        fontSize: size,
        fontWeight: 600,
        lineHeight: 1.36,
        opacity: fade,
      }}
    >
      {words.map((w, i) => (
        <React.Fragment key={i}>
          {i > 0 && " "}
          <span style={{ color: i < lit ? "#ffffff" : "rgba(255,255,255,0.28)" }}>{w}</span>
        </React.Fragment>
      ))}
    </div>
  );
};

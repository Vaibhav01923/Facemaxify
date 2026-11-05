import React from "react";
import { AbsoluteFill, Img, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "../Audio";
import type { VideoProps } from "../../shared/types";
import { NARRATION_LEAD } from "../../shared/timing";
import { Brand } from "../components/Brand";
import { useLayout } from "../layout";
import { COLORS, FONT, easeOutBack, easeOutCubic, lerp, prog } from "../theme";

const WORD_START = 12;
const WORD_STEP = 6;

const neon = (blur: number) =>
  `0 0 ${blur * 0.5}px ${COLORS.neon}, 0 0 ${blur}px ${COLORS.neon}99, 0 0 ${blur * 2.4}px ${COLORS.neon}55`;

const Word: React.FC<{ text: string; start: number; size: number }> = ({ text, start, size }) => {
  const frame = useCurrentFrame();
  const k = easeOutBack(prog(frame, start, 12));
  const o = easeOutCubic(prog(frame, start, 8));
  return (
    <span
      style={{
        display: "inline-block",
        marginRight: size * 0.28,
        opacity: o,
        transform: `translateY(${(1 - k) * 36}px) scale(${0.7 + 0.3 * k})`,
        color: COLORS.neon,
        textShadow: neon(size * 0.28),
      }}
    >
      {text}
    </span>
  );
};

const IntroAudio: React.FC<{ video: VideoProps; words: number }> = ({ video, words }) => (
  <>
    {video.intro.audioSrc && (
      <Sequence from={NARRATION_LEAD} layout="none">
        <Audio src={video.intro.audioSrc} />
      </Sequence>
    )}
    {video.sfx && (
      <>
        <Sequence from={0} layout="none">
          <Audio src={staticFile("sfx/whoosh_b.wav")} volume={0.45} />
        </Sequence>
        <Sequence from={WORD_START} layout="none">
          <Audio src={staticFile("sfx/impact.wav")} volume={0.5} />
        </Sequence>
        {Array.from({ length: words }, (_, i) => (
          <Sequence key={i} from={WORD_START + i * WORD_STEP + 2} layout="none">
            <Audio src={staticFile("sfx/pop.wav")} volume={0.3} />
          </Sequence>
        ))}
      </>
    )}
  </>
);

const IMG = 1560; // photo size in px; the face sits in the upper two thirds of the frame

const IntroTall: React.FC<{ video: VideoProps }> = ({ video }) => {
  const frame = useCurrentFrame();
  const { intro } = video;
  const zoom = lerp(1, 1.08, prog(frame, 0, intro.durationInFrames));

  const topWords = intro.titleTop.split(" ");
  const nameWords = intro.titleName.split(" ");
  const nameChars = intro.titleName.length;
  const nameSize = Math.max(58, Math.min(128, 980 / (nameChars * 0.66)));
  const topSize = 70;

  const imgLeft = (1080 - IMG) / 2;
  const imgTop = 700 - 0.45 * IMG; // eye line (45% of the standardised photo) at y = 700

  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${zoom})`, transformOrigin: "50% 38%" }}>
        <Img
          src={video.imageSrc}
          style={{
            position: "absolute",
            left: imgLeft,
            top: imgTop,
            width: IMG,
            height: IMG,
            maxWidth: "none",
            WebkitMaskImage: "linear-gradient(to bottom, #000 0%, #000 68%, transparent 96%)",
            maskImage: "linear-gradient(to bottom, #000 0%, #000 68%, transparent 96%)",
          }}
        />
      </div>
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(to bottom, rgba(5,5,16,0.86) 0%, rgba(5,5,16,0.55) 9%, rgba(5,5,16,0) 24%, rgba(5,5,16,0) 56%, rgba(5,5,16,0.88) 80%, rgba(5,5,16,0.97) 100%)",
        }}
      />
      <Brand right="AI FACE ANALYSIS" />

      <div
        style={{
          position: "absolute",
          left: 50,
          right: 50,
          top: 1290,
          textAlign: "center",
          fontFamily: FONT,
          fontWeight: 800,
          textTransform: "uppercase",
        }}
      >
        <div style={{ fontSize: topSize, lineHeight: 1.1, letterSpacing: "0.02em" }}>
          {topWords.map((w, i) => (
            <Word key={`t${i}`} text={w} start={WORD_START + i * WORD_STEP} size={topSize} />
          ))}
        </div>
        <div style={{ fontSize: nameSize, lineHeight: 1.1, marginTop: 14, letterSpacing: "0.01em", whiteSpace: "nowrap" }}>
          {nameWords.map((w, i) => (
            <Word key={`n${i}`} text={w} start={WORD_START + (topWords.length + i) * WORD_STEP} size={nameSize} />
          ))}
        </div>
      </div>

      <IntroAudio video={video} words={topWords.length + nameWords.length} />
    </AbsoluteFill>
  );
};

const IMG_WIDE = 1300;

const IntroWide: React.FC<{ video: VideoProps }> = ({ video }) => {
  const frame = useCurrentFrame();
  const { intro } = video;
  const zoom = lerp(1, 1.06, prog(frame, 0, intro.durationInFrames));

  const topWords = intro.titleTop.split(" ");
  const nameWords = intro.titleName.split(" ");
  const nameSize = Math.max(56, Math.min(150, 880 / (intro.titleName.length * 0.66)));
  const topSize = 84;

  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${zoom})`, transformOrigin: "72% 40%" }}>
        <Img
          src={video.imageSrc}
          style={{
            position: "absolute",
            left: 1450 - IMG_WIDE / 2,
            top: 430 - 0.45 * IMG_WIDE, // eye line at y = 430
            width: IMG_WIDE,
            height: IMG_WIDE,
            maxWidth: "none",
            WebkitMaskImage: "linear-gradient(to right, transparent 0%, #000 26%, #000 100%)",
            maskImage: "linear-gradient(to right, transparent 0%, #000 26%, #000 100%)",
          }}
        />
      </div>
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(to right, rgba(5,5,16,0.98) 0%, rgba(5,5,16,0.94) 40%, rgba(5,5,16,0.5) 56%, rgba(5,5,16,0) 72%), linear-gradient(to bottom, rgba(5,5,16,0.7) 0%, rgba(5,5,16,0) 18%)",
        }}
      />
      <Brand right="AI FACE ANALYSIS" />

      <div
        style={{
          position: "absolute",
          left: 90,
          top: 330,
          width: 980,
          fontFamily: FONT,
          fontWeight: 800,
          textTransform: "uppercase",
        }}
      >
        <div style={{ fontSize: topSize, lineHeight: 1.1, letterSpacing: "0.02em" }}>
          {topWords.map((w, i) => (
            <Word key={`t${i}`} text={w} start={WORD_START + i * WORD_STEP} size={topSize} />
          ))}
        </div>
        <div style={{ fontSize: nameSize, lineHeight: 1.1, marginTop: 18, letterSpacing: "0.01em", whiteSpace: "nowrap" }}>
          {nameWords.map((w, i) => (
            <Word key={`n${i}`} text={w} start={WORD_START + (topWords.length + i) * WORD_STEP} size={nameSize} />
          ))}
        </div>
      </div>

      <IntroAudio video={video} words={topWords.length + nameWords.length} />
    </AbsoluteFill>
  );
};

export const IntroScene: React.FC<{ video: VideoProps }> = ({ video }) => {
  const { wide } = useLayout();
  return wide ? <IntroWide video={video} /> : <IntroTall video={video} />;
};

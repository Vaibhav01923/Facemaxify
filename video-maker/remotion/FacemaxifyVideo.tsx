import React, { useEffect, useState } from "react";
import {
  AbsoluteFill,
  Sequence,
  continueRender,
  delayRender,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { VideoProps } from "../shared/types";
import { layoutScenes } from "../shared/timeline";
import { TRANSITION_FRAMES, TRANSITION_HALF } from "../shared/timing";
import { Background } from "./components/Background";
import { Audio } from "./Audio";
import { PromoScene } from "./scenes/PromoScene";
import { PromoCard } from "./components/PromoCard";
import { LightLeak } from "./components/LightLeak";
import { IntroScene } from "./scenes/IntroScene";
import { ScanScene } from "./scenes/ScanScene";
import { MetricSceneView } from "./scenes/MetricScene";
import { OutroScene } from "./scenes/OutroScene";
import { COLORS, FONT, clamp01, easeInOutCubic, easeOutCubic, prog } from "./theme";

export type Fx = "zoom" | "whipL" | "whipR" | "zoomOut";
export const FX: Fx[] = ["zoom", "whipL", "zoomOut", "whipR"];
export const WHOOSH = ["whoosh_a", "whoosh_b", "whoosh_c", "whoosh_b"];
const IN_FRAMES = 11;
const OUT_FRAMES = 9;

/** Loads the brand font (Inter) before any frame is rendered. */
export const FontLoader: React.FC = () => {
  const [handle] = useState(() => delayRender("Loading Inter"));
  useEffect(() => {
    const face = new FontFace("Inter", `url(${staticFile("fonts/inter-latin.woff2")}) format("woff2")`, {
      weight: "100 900",
    });
    face
      .load()
      .then(() => document.fonts.add(face))
      .catch(() => undefined)
      .finally(() => continueRender(handle));
  }, [handle]);
  return null;
};

/** Adds the motion that sells each cut: scale punch / whip pan, with a little blur, on the way out and the way in. */
export const SceneShell: React.FC<{ inFx?: Fx; outFx?: Fx; children: React.ReactNode }> = ({ inFx, outFx, children }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  let tx = 0;
  let sc = 1;
  let blur = 0;

  const apply = (fx: Fx, k: number, outgoing: boolean) => {
    if (k <= 0) return;
    blur += 13 * k;
    switch (fx) {
      case "zoom":
        sc *= 1 + 0.07 * k;
        break;
      case "zoomOut":
        sc *= outgoing ? 1 - 0.06 * k : 1 + 0.1 * k;
        break;
      case "whipL":
        tx += (outgoing ? -1 : 1) * 190 * k;
        break;
      case "whipR":
        tx += (outgoing ? 1 : -1) * 190 * k;
        break;
    }
  };
  if (inFx) apply(inFx, 1 - easeOutCubic(prog(frame, 0, IN_FRAMES)), false);
  if (outFx) apply(outFx, easeInOutCubic(prog(frame, durationInFrames - OUT_FRAMES, OUT_FRAMES)), true);

  return (
    <AbsoluteFill
      style={{
        transform: `translateX(${tx}px) scale(${sc})`,
        filter: blur > 0.4 ? `blur(${blur.toFixed(1)}px)` : undefined,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

export const FacemaxifyVideo: React.FC<VideoProps> = (video) => {
  const { durationInFrames, fps, width, height } = useVideoConfig();
  const slots = layoutScenes(video);
  const last = slots.length - 1;
  // silent "get your free analysis" banner over the middle of the video, while the normal narration keeps going
  const metricSlots = slots.filter((x) => x.kind === "metric");
  const bannerSlot = metricSlots[Math.floor(metricSlots.length / 2)];
  const outroStart = slots[last].start;
  const bannerFrom = bannerSlot ? bannerSlot.start + 24 : 0;
  const bannerFrames = Math.min(Math.round(5 * fps), outroStart - 24 - bannerFrom);
  const wideFrame = width > height;
  const fxAt = (i: number): Fx => FX[(i - 1) % FX.length]; // transition leading into scene i

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, fontFamily: FONT }}>
      <FontLoader />
      <Background backdrop={video.backdropSrc} image={video.imageSrc} />

      {slots.map((slot, i) => (
        <Sequence key={i} from={slot.start} durationInFrames={slot.duration}>
          <SceneShell inFx={i === 0 ? undefined : fxAt(i)} outFx={i === last ? undefined : fxAt(i + 1)}>
            {slot.kind === "intro" && <IntroScene video={video} />}
            {slot.kind === "scan" && <ScanScene video={video} />}
            {slot.kind === "metric" && slot.metricIndex !== undefined && (
              <MetricSceneView
                scene={video.metrics[slot.metricIndex]}
                index={slot.metricIndex}
                total={video.metrics.length}
                video={video}
              />
            )}
            {slot.kind === "promo" && video.promo && <PromoScene video={video} />}
            {slot.kind === "outro" && <OutroScene video={video} />}
          </SceneShell>
        </Sequence>
      ))}

      {/* opening light leak: starts at its peak and fades out to reveal the intro */}
      <Sequence from={0} durationInFrames={TRANSITION_HALF + 6} layout="none">
        <AbsoluteFill>
          <LightLeak variant={0} offset={0.5} />
        </AbsoluteFill>
      </Sequence>

      {/* a light leak on every cut, peaking exactly where the scenes switch */}
      {slots.slice(1).map((slot, n) => {
        const i = n + 1;
        return (
          <React.Fragment key={`t${i}`}>
            <Sequence from={slot.start - TRANSITION_HALF} durationInFrames={TRANSITION_FRAMES} layout="none">
              <AbsoluteFill>
                <LightLeak variant={i - 1} />
              </AbsoluteFill>
            </Sequence>
            {video.sfx && (
              <Sequence from={Math.max(0, slot.start - 14)} layout="none">
                <Audio src={staticFile(`sfx/${WHOOSH[(i - 1) % WHOOSH.length]}.wav`)} volume={0.5} />
              </Sequence>
            )}
          </React.Fragment>
        );
      })}

      {!video.publicMode && bannerSlot && bannerFrames >= fps * 2 && (
        <Sequence from={bannerFrom} durationInFrames={bannerFrames} layout="none">
          <AbsoluteFill>
            {wideFrame ? (
              <PromoCard width={980} top={height - 250} start={0} scale={0.85} duration={bannerFrames} />
            ) : (
              <PromoCard width={940} top={height - 235} start={0} scale={0.95} duration={bannerFrames} />
            )}
          </AbsoluteFill>
        </Sequence>
      )}

      {video.musicSrc && (
        <Audio
          src={video.musicSrc}
          // play only the chosen segment of the track (the whole track when none was chosen); `loop` repeats that segment
          trimBefore={video.musicStartSeconds != null ? Math.round(video.musicStartSeconds * fps) : undefined}
          trimAfter={video.musicEndSeconds != null ? Math.round(video.musicEndSeconds * fps) : undefined}
          loop
          // keep the frame counter running across loops so the fade-in/out happen once, at the start and end of the video
          loopVolumeCurveBehavior="extend"
          volume={(f) =>
            video.musicVolume *
            clamp01(f / 20) *
            clamp01((durationInFrames - f) / 45)
          }
        />
      )}
    </AbsoluteFill>
  );
};

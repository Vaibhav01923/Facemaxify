import type { MetricData, MetricScene, VideoFormat, VideoProps, Pt } from "./shared/types";
import { MIN_FRAMES, PROMO_MIN_FRAMES, sceneFrames } from "./shared/timing";

export interface AudioClip {
  url: string;
  frames: number;
}

export interface BuildArgs {
  format: VideoFormat;
  name: string;
  imageUrl: string;
  backdropUrl?: string;
  landmarks: Record<string, Pt>;
  mesh: [number, number][];
  metrics: MetricData[];
  overall100: number;
  percentileText: string;
  narration: { promo?: string; scan: string; scenes: Record<string, string>; outro: string };
  audio: { promo?: AudioClip; intro?: AudioClip; scan?: AudioClip; outro?: AudioClip; metrics: Record<string, AudioClip | undefined> };
  musicUrl?: string;
  musicStartSeconds?: number;
  musicEndSeconds?: number;
  musicVolume: number;
  sfx: boolean;
}

export function buildVideoProps(a: BuildArgs): VideoProps {
  const min = MIN_FRAMES[a.format];
  const introText = `How attractive is ${a.name}?`;

  const metrics: MetricScene[] = a.metrics.map((m) => {
    const clip = a.audio.metrics[m.key];
    const audioFrames = clip?.frames ?? 0;
    return {
      ...m,
      narration: a.narration.scenes[m.key] ?? "",
      audioSrc: clip?.url,
      audioFrames,
      durationInFrames: sceneFrames(audioFrames, min.metric),
    };
  });

  const strengthCount = 3;
  const weakCount = a.format === "short" ? 2 : 3;
  const ranked = [...a.metrics].sort((x, y) => y.score - x.score);
  const strengths = ranked.slice(0, strengthCount).map((m) => ({ short: m.short, score: m.score }));
  const weaknesses = ranked
    .slice(-weakCount)
    .reverse()
    .filter((m) => m.score < 7)
    .map((m) => ({ short: m.short, score: m.score }));

  return {
    format: a.format,
    name: a.name,
    imageSrc: a.imageUrl,
    backdropSrc: a.backdropUrl,
    landmarks: a.landmarks,
    mesh: a.mesh,
    intro: {
      titleTop: "HOW ATTRACTIVE IS",
      titleName: `${a.name.toUpperCase()}?`,
      narration: introText,
      audioSrc: a.audio.intro?.url,
      audioFrames: a.audio.intro?.frames ?? 0,
      durationInFrames: sceneFrames(a.audio.intro?.frames ?? 0, min.intro),
    },
    scan: {
      narration: a.narration.scan,
      audioSrc: a.audio.scan?.url,
      audioFrames: a.audio.scan?.frames ?? 0,
      durationInFrames: sceneFrames(a.audio.scan?.frames ?? 0, min.scan),
      landmarkCount: a.mesh.length || Object.keys(a.landmarks).length,
      ratioCount: a.metrics.length,
    },
    metrics,
    promo:
      a.audio.promo && metrics.length >= 2
        ? {
            narration: a.narration.promo ?? "",
            audioSrc: a.audio.promo.url,
            audioFrames: a.audio.promo.frames,
            durationInFrames: sceneFrames(a.audio.promo.frames, PROMO_MIN_FRAMES[a.format]),
            afterMetric: Math.max(0, Math.floor(metrics.length / 2) - 1),
          }
        : undefined,
    outro: {
      narration: a.narration.outro,
      audioSrc: a.audio.outro?.url,
      audioFrames: a.audio.outro?.frames ?? 0,
      durationInFrames: sceneFrames(a.audio.outro?.frames ?? 0, min.outro),
      overall100: a.overall100,
      percentileText: a.percentileText,
      strengths,
      weaknesses,
    },
    musicSrc: a.musicUrl,
    musicStartSeconds: a.musicStartSeconds,
    musicEndSeconds: a.musicEndSeconds,
    musicVolume: a.musicVolume,
    sfx: a.sfx,
  };
}

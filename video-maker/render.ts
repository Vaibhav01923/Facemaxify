import React from "react";
import { canRenderMediaOnWeb, renderMediaOnWeb } from "@remotion/web-renderer";
import { FacemaxifyVideo } from "./remotion/FacemaxifyVideo";
import { buildVideoProps, type AudioClip } from "./buildProps";
import { planByKey } from "./shared/metricPlan";
import { SHORT_LIMIT_SECONDS } from "./shared/selection";
import { totalFrames } from "./shared/timeline";
import { FPS, SIZE } from "./shared/timing";
import type { AnalysisPayload, MetricData, Pronouns, VideoProps } from "./shared/types";

/** Everything between the analysis and the finished MP4 that runs in the browser (the server only talks and writes). */

export interface Script {
  scan: string;
  scenes: Record<string, string>;
  outro: string;
}
export interface Clip {
  /** blob: URL of the recorded line */
  url: string;
  frames: number;
}
export type Quality = "low" | "medium" | "high";

export async function browserCanRender(): Promise<boolean> {
  try {
    const r = await canRenderMediaOnWeb({ width: SIZE.short.width, height: SIZE.short.height, container: "mp4" } as any);
    return r.canRender;
  } catch {
    return false;
  }
}

async function post(url: string, body: unknown): Promise<Response> {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error || "Something went wrong. Please try again.");
  }
  return res;
}

export async function writeScript(args: { name: string; pronouns: Pronouns; metrics: MetricData[]; overall100: number; percentileText: string }) {
  const withWhat = args.metrics.map((m) => ({ ...m, what: planByKey(m.key)?.what ?? "" }));
  const res = await post("/api/video-script", { ...args, metrics: withWhat });
  return (await res.json()) as { name: string; script: Script };
}

/** Records one line and measures it. */
export async function recordLine(text: string, voice: string, pace: string): Promise<Clip> {
  const res = await post("/api/video-voice", { text, voice, pace });
  const bytes = await res.arrayBuffer();
  const ctx = new AudioContext();
  try {
    const decoded = await ctx.decodeAudioData(bytes.slice(0));
    return { url: URL.createObjectURL(new Blob([bytes], { type: "audio/mpeg" })), frames: Math.max(1, Math.ceil(decoded.duration * FPS)) };
  } finally {
    void ctx.close();
  }
}

/** Runs `fn` over the items a few at a time. */
export async function pool<T, R>(items: T[], size: number, fn: (item: T) => Promise<R>, onDone?: (done: number) => void): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  let done = 0;
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i]);
        onDone?.(++done);
      }
    }),
  );
  return out;
}

export const scanLine = (count: number) => `${count} facial ratios. Let's break it down.`;

export interface Voice {
  script: Script;
  clips: Record<string, Clip>;
}

export interface Assembly {
  analysis: AnalysisPayload;
  name: string;
  picks: MetricData[];
  voice: Voice;
  musicUrl?: string;
  musicVolume: number;
  sfx: boolean;
}

export function assemble(a: Assembly): VideoProps {
  const c = a.voice.clips;
  const clip = (x?: Clip): AudioClip | undefined => (x ? { url: x.url, frames: x.frames } : undefined);
  return {
    ...buildVideoProps({
      format: "short",
      name: a.name,
      imageUrl: a.analysis.displayImage,
      backdropUrl: a.analysis.backdropImage,
      landmarks: a.analysis.landmarks,
      mesh: a.analysis.mesh,
      metrics: a.picks,
      overall100: a.analysis.overall100,
      percentileText: a.analysis.percentileText,
      narration: a.voice.script,
      audio: {
        intro: clip(c.intro),
        scan: clip(c.scan),
        outro: clip(c.outro),
        metrics: Object.fromEntries(a.picks.map((m) => [m.key, clip(c[`m_${m.key}`])])),
      },
      musicUrl: a.musicUrl,
      musicVolume: a.musicVolume,
      sfx: a.sfx,
    }),
    publicMode: true,
  };
}

/** True when the assembled video is over the limit for Shorts / Reels / TikTok. */
export const overLimit = (props: VideoProps) => totalFrames(props) > SHORT_LIMIT_SECONDS * FPS;

export async function renderVideo(props: VideoProps, quality: Quality, onProgress: (p: number) => void, signal: AbortSignal): Promise<Blob> {
  const res = await renderMediaOnWeb({
    composition: {
      id: "FacemaxifyShort",
      component: FacemaxifyVideo as unknown as React.FC<Record<string, unknown>>,
      width: SIZE.short.width,
      height: SIZE.short.height,
      fps: FPS,
      durationInFrames: totalFrames(props),
      defaultProps: props as unknown as Record<string, unknown>,
    },
    inputProps: props as unknown as Record<string, unknown>,
    container: "mp4",
    videoBitrate: quality,
    signal,
    onProgress: (p: { progress: number }) => onProgress(p.progress),
  } as any);
  return res.getBlob();
}

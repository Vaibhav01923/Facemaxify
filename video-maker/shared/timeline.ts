import type { VideoProps } from "./types";

export type SceneKind = "intro" | "scan" | "metric" | "promo" | "outro";

export interface SceneSlot {
  kind: SceneKind;
  /** index into props.metrics for metric scenes */
  metricIndex?: number;
  start: number;
  duration: number;
}

/** Back-to-back scene layout: intro, scan, one scene per ratio (with the short promo halfway), outro. */
export function layoutScenes(p: VideoProps): SceneSlot[] {
  const slots: SceneSlot[] = [];
  let t = 0;
  const push = (kind: SceneKind, duration: number, metricIndex?: number) => {
    slots.push({ kind, duration, start: t, metricIndex });
    t += duration;
  };
  push("intro", p.intro.durationInFrames);
  push("scan", p.scan.durationInFrames);
  p.metrics.forEach((m, i) => {
    push("metric", m.durationInFrames, i);
    if (p.promo && p.promo.afterMetric === i) push("promo", p.promo.durationInFrames);
  });
  push("outro", p.outro.durationInFrames);
  return slots;
}

export function totalFrames(p: VideoProps): number {
  const slots = layoutScenes(p);
  const last = slots[slots.length - 1];
  return last.start + last.duration;
}

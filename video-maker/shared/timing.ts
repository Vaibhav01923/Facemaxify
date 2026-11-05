import type { VideoFormat } from "./types";

export const FPS = 30;

export const SIZE: Record<VideoFormat, { width: number; height: number }> = {
  short: { width: 1080, height: 1920 },
  long: { width: 1920, height: 1080 },
};

/** Length of the light-leak overlay that hides each cut (peaks exactly on the cut). */
export const TRANSITION_FRAMES = 20;
export const TRANSITION_HALF = TRANSITION_FRAMES / 2;

/** Narration starts this many frames after a scene starts. */
export const NARRATION_LEAD = 12;
/** Silence kept after the narration ends before the next transition. */
export const SCENE_TAIL = 10;

/** Scenes never get shorter than this, so the line animations always finish. */
export const MIN_FRAMES: Record<VideoFormat, { metric: number; scan: number; intro: number; outro: number }> = {
  short: {
    metric: Math.round(3.5 * FPS),
    scan: Math.round(2.6 * FPS),
    intro: Math.round(2.6 * FPS),
    outro: Math.round(5.2 * FPS),
  },
  long: {
    metric: Math.round(5.0 * FPS),
    scan: Math.round(3.6 * FPS),
    intro: Math.round(3.2 * FPS),
    outro: Math.round(6.5 * FPS),
  },
};

/** The mid-video promo never gets shorter than this, so the card can be read. */
export const PROMO_MIN_FRAMES: Record<VideoFormat, number> = { short: Math.round(4 * FPS), long: Math.round(4.5 * FPS) };

export function sceneFrames(audioFrames: number, min: number): number {
  return Math.max(min, NARRATION_LEAD + audioFrames + SCENE_TAIL);
}

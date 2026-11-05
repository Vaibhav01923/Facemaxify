import type { Pt } from "../../shared/types";
import { clamp01, easeOutCubic, lerp } from "../theme";

export interface CameraTarget {
  cx: number;
  cy: number;
  zoom: number;
}

export interface Camera {
  zoom: number;
  imgPx: number;
  left: number;
  top: number;
  /** landmark space (0-1000) -> card pixels */
  map: (p: Pt) => Pt;
}

/** Frames the focus points: centre of their bounding box, zoomed so they fill ~65% of the card. */
export function targetFor(focus: Pt[]): CameraTarget {
  const xs = focus.map((p) => p.x);
  const ys = focus.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const span = Math.max(maxX - minX, maxY - minY, 140) * 1.5;
  return {
    cx: (minX + maxX) / 2,
    cy: (minY + maxY) / 2,
    zoom: Math.max(1, Math.min(3.4, 1000 / span)),
  };
}

/** Camera at a given frame: eases in from a wider shot, then drifts slowly. */
export function cameraAt(target: CameraTarget, frame: number, duration: number, size = 1000): Camera {
  const t = easeOutCubic(clamp01(frame / 34));
  const startZoom = Math.max(1, target.zoom * 0.72);
  const drift = 1 + 0.045 * clamp01(frame / Math.max(1, duration));
  const zoom = lerp(startZoom, target.zoom, t) * drift;
  const cx = lerp(500, target.cx, t);
  const cy = lerp(470, target.cy, t);
  const imgPx = size * zoom;
  let left = size / 2 - (cx / 1000) * imgPx;
  let top = size / 2 - (cy / 1000) * imgPx;
  left = Math.max(size - imgPx, Math.min(0, left));
  top = Math.max(size - imgPx, Math.min(0, top));
  return {
    zoom,
    imgPx,
    left,
    top,
    map: (p) => ({ x: left + (p.x / 1000) * imgPx, y: top + (p.y / 1000) * imgPx }),
  };
}

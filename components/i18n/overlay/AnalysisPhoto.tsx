import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FACE_OVAL,
  LEFT_BROW,
  LEFT_EYE,
  LIPS,
  NOSE_BASE,
  NOSE_BRIDGE,
  RIGHT_BROW,
  RIGHT_EYE,
  makeGeometry,
  type Geometry,
} from "./geometry";
import type { Emphasis, Layer } from "./layers";
import { Painter } from "./painter";

type Landmark = { x: number; y: number };

const TARGET_SIDE = 900; // longest side of the drawing, in canvas pixels
const MAX_UPSCALE = 2.5; // a small photo is enlarged at most this much, so lines and text stay crisp

interface View {
  // the part of the photo that is shown, in photo pixels
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  // the canvas it is drawn on
  cw: number;
  ch: number;
  g: Geometry;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

// Crops the photo to the face with some room around it (hair, ears, neck), so the outlines are
// big enough to read whatever the photo looked like (a selfie, a half-length shot, a wide frame).
function frameFor(landmarks: Landmark[], iw: number, ih: number): View {
  const oval = FACE_OVAL.map((i) => ({ x: landmarks[i].x * iw, y: landmarks[i].y * ih }));
  const minX = Math.min(...oval.map((pt) => pt.x));
  const maxX = Math.max(...oval.map((pt) => pt.x));
  const minY = Math.min(...oval.map((pt) => pt.y));
  const maxY = Math.max(...oval.map((pt) => pt.y));
  const bw = maxX - minX;
  const bh = maxY - minY;

  const sw = Math.min(iw, bw * 1.8);
  // not much taller than wide, but always room for the whole face
  const sh = Math.min(ih, bh * 1.5, Math.max(sw * 1.3, bh * 1.15));
  const sx = clamp((minX + maxX) / 2 - sw / 2, 0, iw - sw);
  const sy = clamp((minY + maxY) / 2 - sh / 2, 0, ih - sh);

  const k = Math.min(TARGET_SIDE / Math.max(sw, sh), MAX_UPSCALE);
  const cw = Math.max(1, Math.round(sw * k));
  const ch = Math.max(1, Math.round(sh * k));
  const local = landmarks.map((lm) => ({ x: (lm.x * iw - sx) / sw, y: (lm.y * ih - sy) / sh }));
  return { sx, sy, sw, sh, cw, ch, g: makeGeometry(local, cw, ch) };
}

// The face drawn as thin outlines (face, eyes, brows, lips, nose), like a scan, under the measurements.
function drawOutlines(p: Painter, g: Geometry) {
  const trace = (indices: number[], close: boolean, alpha: number, width: number) =>
    p.poly(indices.map(g.p), { color: "#e0e7ff", alpha, width: width * p.u, halo: false }, close);
  p.smoothClosed(FACE_OVAL.map(g.p), { color: "#e0e7ff", alpha: 0.5, width: 1.3 * p.u, halo: false });
  trace(LEFT_EYE, true, 0.55, 1.1);
  trace(RIGHT_EYE, true, 0.55, 1.1);
  trace(LEFT_BROW, true, 0.45, 1.1);
  trace(RIGHT_BROW, true, 0.45, 1.1);
  trace(LIPS, true, 0.5, 1.1);
  trace(NOSE_BRIDGE, false, 0.35, 1.1);
  trace(NOSE_BASE, false, 0.45, 1.1);
}

interface Props {
  image: string;
  landmarks: Landmark[];
  layers: Layer[];
  // The measurement to highlight; null shows all of them evenly.
  activeId: string | null;
  alt: string;
  fmt: (value: number, digits?: number) => string;
}

// The analysed photo with the face outlined and the measurements drawn on it.
export const AnalysisPhoto: React.FC<Props> = ({ image, landmarks, layers, activeId, alt, fmt }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!image) return;
    const el = new Image();
    el.onload = () => setImg(el);
    el.src = image;
    return () => {
      el.onload = null;
    };
  }, [image]);

  const view = useMemo(
    () => (img && landmarks.length > 0 ? frameFor(landmarks, img.naturalWidth || img.width, img.naturalHeight || img.height) : null),
    [img, landmarks],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !img || !view) return;
    const { sx, sy, sw, sh, cw, ch, g } = view;
    if (canvas.width !== cw) canvas.width = cw;
    if (canvas.height !== ch) canvas.height = ch;

    ctx.globalAlpha = 1;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);
    // A light veil so the lines stand out on bright photos.
    ctx.fillStyle = "rgba(2,6,23,0.16)";
    ctx.fillRect(0, 0, cw, ch);

    const p = new Painter(ctx, cw, ch);
    drawOutlines(p, g);

    const known = layers.some((layer) => layer.id === activeId);
    const emphasis = (layer: Layer): Emphasis =>
      layer.decor || !known ? "base" : layer.id === activeId ? "active" : "dim";
    // Helper lines first, the selected measurement last so its label ends up on top.
    const ordered = [
      ...layers.filter((layer) => layer.decor),
      ...layers.filter((layer) => !layer.decor && layer.id !== activeId),
      ...layers.filter((layer) => !layer.decor && layer.id === activeId),
    ];
    for (const layer of ordered) layer.draw({ g, p, e: emphasis(layer), fmt });
    ctx.globalAlpha = 1;
  }, [img, view, layers, activeId, fmt]);

  if (!image) return null;
  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={alt}
      width={view?.cw ?? 400}
      height={view?.ch ?? 460}
      className="block w-full h-auto rounded-2xl bg-slate-950"
    />
  );
};

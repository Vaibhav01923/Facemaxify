import React, { useEffect, useRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

type LM = { x: number; y: number };

// MediaPipe FaceMesh contour paths as landmark indices. Inlined rather than imported from
// @mediapipe/face_mesh so drawing doesn't depend on that UMD bundle's FACEMESH_* exports.
const FACE_OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109, 10];
const EYE_A = [173, 157, 158, 159, 160, 161, 246, 33, 7, 163, 144, 145, 153, 154, 155, 133, 173];
const EYE_B = [398, 384, 385, 386, 387, 388, 466, 263, 249, 390, 373, 374, 380, 381, 382, 362, 398];
const BROWS = [[46, 53, 52, 65, 55], [70, 63, 105, 66, 107], [276, 283, 282, 295, 285], [300, 293, 334, 296, 336]];
const IRIS_CENTERS = [468, 473];

/** Landmarks that split the face into the five segments of the 5-eye rule, left to right in the image. */
export const FIVE_EYE_POINTS = [234, 33, 133, 362, 263, 454];

const MAX_WIDTH = 900;

/** Segments 2 and 4 are the eyes (the reference unit); the rest are green when within 15% of one eye width. */
export const segmentColor = (index: number, ratio: number) => {
  if (index === 1 || index === 3) return "#818cf8";
  return Math.abs(ratio - 1) <= 0.15 ? "#34d399" : "#fbbf24";
};

const draw = (canvas: HTMLCanvasElement, img: HTMLImageElement, lm: LM[], segments: number[], showGuides: boolean) => {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const scale = Math.min(1, MAX_WIDTH / img.naturalWidth);
  const w = Math.round(img.naturalWidth * scale);
  const h = Math.round(img.naturalHeight * scale);
  canvas.width = w;
  canvas.height = h;
  ctx.drawImage(img, 0, 0, w, h);
  if (!showGuides || lm.length === 0) return;

  const k = w / MAX_WIDTH; // keeps line weights and labels proportional on small images
  const P = (i: number) => ({ x: lm[i].x * w, y: lm[i].y * h });
  const trace = (pts: { x: number; y: number }[]) => {
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  };
  // Each stroke gets a dark halo underneath so it stays readable on light and dark skin/backgrounds.
  const stroke = (pts: { x: number; y: number }[], color: string, width: number, dash: number[] = []) => {
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.setLineDash(dash);
    trace(pts);
    ctx.strokeStyle = "rgba(0,0,0,0.45)";
    ctx.lineWidth = width + 2 * k;
    ctx.stroke();
    trace(pts);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
    ctx.setLineDash([]);
  };

  // Face contours detected by MediaPipe
  stroke(FACE_OVAL.map(P), "rgba(255,255,255,0.7)", 2.5 * k);
  BROWS.forEach((b) => stroke(b.map(P), "rgba(255,255,255,0.7)", 2.5 * k));
  [EYE_A, EYE_B].forEach((e) => stroke(e.map(P), "rgba(165,180,252,0.95)", 2.5 * k));

  // Five-segment bracket above the brows, with a dashed guide dropping from each boundary
  const pts = FIVE_EYE_POINTS.map(P);
  const browTop = Math.min(P(105).y, P(334).y, P(52).y, P(282).y);
  const eyeBottom = Math.max(P(145).y, P(374).y);
  const barY = Math.max(browTop - 0.05 * h, 20 * k);
  const guideBottom = Math.min(eyeBottom + 0.05 * h, h - 4 * k);
  pts.forEach((p) => stroke([{ x: p.x, y: barY }, { x: p.x, y: guideBottom }], "rgba(255,255,255,0.8)", 2 * k, [7 * k, 6 * k]));

  ctx.font = `bold ${22 * k}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  segments.forEach((ratio, i) => {
    const color = segmentColor(i, ratio);
    const a = pts[i];
    const b = pts[i + 1];
    stroke([{ x: a.x, y: barY }, { x: b.x, y: barY }], color, 6 * k);
    const cx = (a.x + b.x) / 2;
    ctx.beginPath();
    ctx.arc(cx, barY, 16 * k, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = 2 * k;
    ctx.strokeStyle = "rgba(0,0,0,0.6)";
    ctx.stroke();
    ctx.fillStyle = "#0f172a";
    ctx.fillText(String(i + 1), cx, barY + k);
  });

  // Landmark dots: the six segment boundaries, plus the iris centres for reference
  pts.forEach((p) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 6 * k, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.lineWidth = 1.5 * k;
    ctx.strokeStyle = "rgba(0,0,0,0.7)";
    ctx.stroke();
  });
  IRIS_CENTERS.forEach((i) => {
    if (!lm[i]) return; // iris landmarks only exist when refineLandmarks is on
    const p = P(i);
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3.5 * k, 0, Math.PI * 2);
    ctx.fillStyle = "#22d3ee";
    ctx.fill();
  });
};

interface Props {
  image: string;
  landmarks: LM[];
  /** Five segment widths in units of average eye width, left to right. */
  segments: number[];
}

export const EyeSpacingOverlay: React.FC<Props> = ({ image, landmarks, segments }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showGuides, setShowGuides] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    let cancelled = false;
    const img = new Image();
    img.onload = () => { if (!cancelled) draw(canvas, img, landmarks, segments, showGuides); };
    img.src = image;
    return () => { cancelled = true; };
  }, [image, landmarks, segments, showGuides]);

  return (
    <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-4">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-white font-bold text-sm">Your face, measured</h3>
        <button
          type="button"
          onClick={() => setShowGuides((v) => !v)}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          aria-pressed={showGuides}
        >
          {showGuides ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {showGuides ? "Hide guides" : "Show guides"}
        </button>
      </div>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Your photo with the face outline and the five eye-width segments marked"
        className="w-full h-auto block rounded-2xl bg-black/40"
      />
    </div>
  );
};

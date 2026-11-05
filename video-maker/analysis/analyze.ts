/**
 * Browser-side analysis. This is the same pipeline the Facemaxify website runs:
 *   detect landmarks -> standardise (level the eyes, scale the face, square 1024 canvas) -> detect again -> score ratios.
 * The scoring comes straight from the vendored Facemaxify code in ./facemaxify, so videos match the website.
 */
import { detectLandmarksInstant } from "../../services/mediaPipeService";
import { standardizeImage } from "../../utils/imageProcessing";
import {
  calculateFrontRatios,
  calculateWeightedTotalScore,
  type MetricResult,
} from "../../services/ratioCalculator";
import { calculatePercentile, getPercentileText } from "../../utils/percentile";
import type { AnalysisPayload, Pt } from "../shared/types";
import { detectMesh } from "./mesh";

export interface AnalysisResult extends AnalysisPayload {
  metricResults: MetricResult[];
}

const DISPLAY_SIZE = 2048;

const readAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read the file"));
    reader.readAsDataURL(file);
  });

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = src;
  });

/** Everything that depends only on the landmark positions: ratios, overall score and percentile. */
export type Scored = Pick<AnalysisResult, "metrics" | "metricResults" | "overall" | "overall100" | "percentileText">;

/** Score a set of landmarks with the same Facemaxify code the website uses (also used after manual point edits). */
export function scoreLandmarks(landmarks: Record<string, Pt>): Scored {
  const metricResults = calculateFrontRatios(landmarks as any);
  const overall = calculateWeightedTotalScore(metricResults);
  const overall100 = Math.round(overall * 10);
  return {
    metricResults,
    metrics: metricResults.map((m) => ({
      key: m.key,
      name: m.name,
      value: m.value,
      unit: m.unit,
      idealMin: m.idealMin,
      idealMax: m.idealMax,
      score: m.score,
    })),
    overall,
    overall100,
    percentileText: getPercentileText(calculatePercentile(overall100)),
  };
}

/** detectLandmarksInstant silently falls back to default positions when no face is found; detect that. */
function noFaceDetected(res: { landmarks: Record<string, Pt>; box: { xmin: number; xmax: number; ymin: number; ymax: number } }) {
  if (Object.keys(res.landmarks).length === 0) return true;
  const b = res.box;
  return b.xmin === 200 && b.xmax === 800 && b.ymin === 200 && b.ymax === 800;
}

/**
 * Same geometry as standardizeImage() (eyes level, face height = 65% of the canvas, eye centre at 50%/45%) but rendered
 * larger and with a blurred copy of the photo behind it instead of white, so zoomed video shots never show white bars.
 * Because the transform is identical, landmark coordinates from the white-background image line up exactly.
 */
async function renderDisplayImage(srcDataUrl: string, landmarks: Record<string, Pt>, size: number): Promise<string> {
  const img = await loadImage(srcDataUrl);
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // blurred backdrop
  const cover = Math.max(size / w, size / h) * 1.25;
  ctx.save();
  ctx.filter = `blur(${Math.round(size * 0.03)}px) brightness(0.8)`;
  ctx.drawImage(img, (size - w * cover) / 2, (size - h * cover) / 2, w * cover, h * cover);
  ctx.restore();

  const leftEye = landmarks["leftEyeLateralCanthus"] || landmarks["leftEyePupil"];
  const rightEye = landmarks["rightEyeLateralCanthus"] || landmarks["rightEyePupil"];
  const hairline = landmarks["hairline"];
  const chin = landmarks["chinBottom"];

  const lx = (leftEye.x / 1000) * w;
  const ly = (leftEye.y / 1000) * h;
  const rx = (rightEye.x / 1000) * w;
  const ry = (rightEye.y / 1000) * h;
  const angle = Math.atan2(ry - ly, rx - lx);
  const cx = (lx + rx) / 2;
  const cy = (ly + ry) / 2;

  let faceHeightPx: number;
  if (hairline && chin) {
    faceHeightPx = Math.hypot(((chin.x - hairline.x) / 1000) * w, ((chin.y - hairline.y) / 1000) * h);
  } else if (chin) {
    faceHeightPx = Math.hypot((chin.x / 1000) * w - cx, (chin.y / 1000) * h - cy) * 1.8;
  } else {
    faceHeightPx = h * 0.5;
  }
  const scale = (size * 0.65) / faceHeightPx;

  ctx.save();
  ctx.translate(size * 0.5, size * 0.45);
  ctx.rotate(-angle);
  ctx.scale(scale, scale);
  ctx.translate(-cx, -cy);
  ctx.drawImage(img, 0, 0);
  ctx.restore();

  return canvas.toDataURL("image/jpeg", 0.92);
}

/** Small blurred, darkened 9:16 backdrop made from the display image (pre-blurred so rendering stays fast). */
async function renderBackdrop(displayDataUrl: string): Promise<string> {
  const img = await loadImage(displayDataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = 540;
  canvas.height = 960;
  const ctx = canvas.getContext("2d")!;
  const cover = Math.max(540 / img.naturalWidth, 960 / img.naturalHeight) * 1.15;
  ctx.filter = "blur(22px) brightness(0.42) saturate(1.25)";
  ctx.drawImage(
    img,
    (540 - img.naturalWidth * cover) / 2,
    (960 - img.naturalHeight * cover) / 2 - 40,
    img.naturalWidth * cover,
    img.naturalHeight * cover
  );
  return canvas.toDataURL("image/jpeg", 0.85);
}

export async function analyzePhoto(file: File, onStage?: (message: string) => void): Promise<AnalysisResult> {
  const stage = (m: string) => onStage?.(m);

  stage("Reading photo...");
  const original = await readAsDataUrl(file);

  stage("Loading face model (first run downloads ~4 MB)...");
  const initial = await detectLandmarksInstant(original, "front");
  if (noFaceDetected(initial)) {
    throw new Error("No face found in this photo. Use a clear, front-facing photo of one person.");
  }

  stage("Standardising the photo...");
  const standardized = await standardizeImage(original, initial.landmarks);

  stage("Measuring landmarks...");
  const final = await detectLandmarksInstant(standardized, "front");
  if (noFaceDetected(final)) {
    throw new Error("The face could not be re-detected after straightening. Try a more frontal photo.");
  }

  stage("Scoring facial ratios...");
  const scored = scoreLandmarks(final.landmarks);
  if (scored.metricResults.length === 0) throw new Error("No ratios could be calculated from this photo.");

  stage("Preparing video artwork...");
  const [displayImage, mesh] = await Promise.all([
    renderDisplayImage(original, initial.landmarks, DISPLAY_SIZE),
    detectMesh(standardized).catch(() => [] as [number, number][]),
  ]);
  const backdropImage = await renderBackdrop(displayImage);

  return {
    displayImage,
    backdropImage,
    landmarks: final.landmarks,
    ...scored,
    mesh,
  };
}

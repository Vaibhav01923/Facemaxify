// Geometry shared by the analysis overlays (the photo with lines on top of the results of the
// translated tools) and by the aspect-ratio fix every tool applies before measuring.

export type Pt = { x: number; y: number };
export interface Size {
  width: number;
  height: number;
}

// The photo's own size in pixels (not the size it is shown at).
export const imageSize = (img: HTMLImageElement): Size => ({
  width: img.naturalWidth || img.width,
  height: img.naturalHeight || img.height,
});

// MediaPipe returns each landmark's x and y as a fraction of the image's width and height
// *separately*. On a portrait photo that stretches the horizontal axis against the vertical one
// (a 3:4 photo makes a face look a third wider than it is), which skews every measurement that
// mixes the two: face length against width, eye height against width, the chin angle. Scaling x by
// width/height puts both axes in the same units (the image's height), so ratios and angles come
// out true, while measurements that only use y (facial thirds) are unchanged.
//
// PhotoAnalyzerShell applies this to the landmarks it hands to a tool's calculation; the standalone
// analyzers, which run MediaPipe themselves, call it directly. Apply it once, to the raw landmarks,
// and keep the raw ones for drawing on the photo, which needs fractions of the photo's own size.
export function toSquareSpace<T extends { x: number }>(landmarks: T[], size?: Size): T[] {
  if (!size || !size.width || !size.height) return landmarks;
  const scale = size.width / size.height;
  if (Math.abs(scale - 1) < 1e-6) return landmarks;
  return landmarks.map((point) => ({ ...point, x: point.x * scale }));
}

// The left/right pairs the symmetry scores measure (the same lists as the English calculators).
// The looksmax score uses the first six.
export const SYMMETRY_PAIRS: [number, number][] = [
  [33, 263],
  [133, 362],
  [105, 334],
  [61, 291],
  [234, 454],
  [172, 397],
  [98, 327],
  [159, 386],
];
export const SYMMETRY_PAIRS_SIX = SYMMETRY_PAIRS.slice(0, 6);

// MediaPipe Face Mesh landmark indices for the outlines drawn on the photo.
export const FACE_OVAL = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
  172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109,
];
export const LEFT_EYE = [263, 249, 390, 373, 374, 380, 381, 382, 362, 398, 384, 385, 386, 387, 388, 466];
export const RIGHT_EYE = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246];
export const LEFT_BROW = [276, 283, 282, 295, 285, 336, 296, 334, 293, 300];
export const RIGHT_BROW = [46, 53, 52, 65, 55, 107, 66, 105, 63, 70];
export const LIPS = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185];
export const NOSE_BRIDGE = [168, 6, 197, 195, 5, 4];
export const NOSE_BASE = [98, 97, 2, 326, 327];

// The landmarks of an analysed photo in canvas pixels, plus a few helpers the layers share.
export interface Geometry {
  w: number;
  h: number;
  // landmark index -> pixel position
  p: (index: number) => Pt;
  // pixel distance between two landmarks
  dist: (a: number, b: number) => number;
  // x of the vertical midline the symmetry score is measured from (nose bridge, nose tip, chin)
  midX: number;
  // bounding box of the face outline, where labels go just outside it
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export function makeGeometry(landmarks: { x: number; y: number }[], w: number, h: number): Geometry {
  const p = (index: number): Pt => ({ x: landmarks[index].x * w, y: landmarks[index].y * h });
  const oval = FACE_OVAL.map(p);
  return {
    w,
    h,
    p,
    dist: (a, b) => {
      const pa = p(a);
      const pb = p(b);
      return Math.hypot(pa.x - pb.x, pa.y - pb.y);
    },
    midX: ((landmarks[1].x + landmarks[6].x + landmarks[152].x) / 3) * w,
    left: Math.min(...oval.map((pt) => pt.x)),
    right: Math.max(...oval.map((pt) => pt.x)),
    top: Math.min(...oval.map((pt) => pt.y)),
    bottom: Math.max(...oval.map((pt) => pt.y)),
  };
}

// How evenly a left/right pair sits around the midline: 1 = mirror image (the same ratio the
// symmetry scores use).
export function pairRatio(g: Geometry, left: number, right: number): number {
  const ld = Math.abs(g.p(left).x - g.midX);
  const rd = Math.abs(g.p(right).x - g.midX);
  return ld > 0 && rd > 0 ? Math.min(ld, rd) / Math.max(ld, rd) : 1;
}

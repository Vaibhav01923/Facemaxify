import { Point } from "../types";

export const distance = (p1: Point, p2: Point): number => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

export const slope = (p1: Point, p2: Point): number => {
  return (p2.y - p1.y) / (p2.x - p1.x);
};

// Returns angle in degrees relative to horizontal.
// Handles Y-axis inversion (HTML canvas/images have 0 at top).
export const angleDegrees = (p1: Point, p2: Point): number => {
  // We invert Y because in image coordinates, Y increases downwards
  const dy = -(p2.y - p1.y);
  const dx = p2.x - p1.x;
  return Math.atan2(dy, dx) * (180 / Math.PI);
};

export const midpoint = (p1: Point, p2: Point): Point => {
  return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
};

// --- Vector Math Helpers for Auto-Placement ---

export const subtract = (p1: Point, p2: Point): Point => ({
  x: p1.x - p2.x,
  y: p1.y - p2.y,
});
export const magnitude = (p: Point): number => Math.sqrt(p.x * p.x + p.y * p.y);
export const normalize = (p: Point): Point => {
  const m = magnitude(p);
  return m === 0 ? { x: 0, y: 0 } : { x: p.x / m, y: p.y / m };
};
export const rotate90 = (p: Point): Point => ({ x: -p.y, y: p.x }); // 90 deg counter-clockwise (assuming y down?)
// In image coords (y down):
// (1, 0) -> (0, 1) [Down] is 90 deg clockwise visually?
// Let's stick to standard math: (-y, x).

export const add = (p1: Point, p2: Point): Point => ({
  x: p1.x + p2.x,
  y: p1.y + p2.y,
});
export const multiply = (p: Point, s: number): Point => ({
  x: p.x * s,
  y: p.y * s,
});

export const movePoint = (
  start: Point,
  options: {
    along?: { from: Point; to: Point };
    perpendicular?: { from: Point; to: Point };
    by: number;
  }
): Point => {
  let dir = { x: 0, y: 0 };

  if (options.along) {
    dir = normalize(subtract(options.along.to, options.along.from));
  } else if (options.perpendicular) {
    // Calculate vector
    const vec = subtract(options.perpendicular.to, options.perpendicular.from);
    // Rotate 90 degrees.
    // In the snippet 's' function logic:
    // if perpendicular: dx = -dy_old/len, dy = dx_old/len.
    // This corresponds to (-y, x).
    dir = normalize({ x: -vec.y, y: vec.x });
  }

  return add(start, multiply(dir, options.by));
};

import type { Pt } from "./geometry";

export interface Stroke {
  color: string;
  alpha?: number;
  width?: number; // in canvas px, already scaled by painter.u
  dash?: number[];
  // A thin dark edge under the line so it reads on light and dark skin and backgrounds alike.
  halo?: boolean;
}

const FONT = `"Hiragino Sans","Hiragino Kaku Gothic ProN","Yu Gothic UI","Yu Gothic",Meiryo,Inter,system-ui,sans-serif`;

// Small drawing helper for the analysis overlay. Everything is sized from `u`, the canvas width
// relative to a ~380px-wide display, so lines and labels look the same on any photo size.
export class Painter {
  readonly u: number;

  constructor(
    readonly ctx: CanvasRenderingContext2D,
    readonly w: number,
    readonly h: number,
  ) {
    this.u = w / 380;
  }

  private strokePath(build: () => void, s: Stroke) {
    const { ctx, u } = this;
    const width = s.width ?? 1.4 * u;
    const alpha = s.alpha ?? 1;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.setLineDash(s.dash ?? []);
    if (s.halo !== false) {
      ctx.globalAlpha = alpha * 0.55;
      ctx.strokeStyle = "#020617";
      ctx.lineWidth = width + 1.8 * u;
      ctx.beginPath();
      build();
      ctx.stroke();
    }
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = s.color;
    ctx.lineWidth = width;
    ctx.beginPath();
    build();
    ctx.stroke();
  }

  line(a: Pt, b: Pt, s: Stroke) {
    this.strokePath(() => {
      this.ctx.moveTo(a.x, a.y);
      this.ctx.lineTo(b.x, b.y);
    }, s);
  }

  poly(points: Pt[], s: Stroke, close = false) {
    if (points.length < 2) return;
    this.strokePath(() => {
      points.forEach((pt, i) => (i === 0 ? this.ctx.moveTo(pt.x, pt.y) : this.ctx.lineTo(pt.x, pt.y)));
      if (close) this.ctx.closePath();
    }, s);
  }

  // A smooth closed curve through the points (each point steers the curve between the midpoints
  // of its two neighbouring segments), for outlines that should not look faceted.
  smoothClosed(points: Pt[], s: Stroke) {
    if (points.length < 3) return this.poly(points, s, true);
    this.strokePath(() => {
      const { ctx } = this;
      const n = points.length;
      const halfway = (a: Pt, b: Pt) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
      const start = halfway(points[n - 1], points[0]);
      ctx.moveTo(start.x, start.y);
      for (let i = 0; i < n; i++) {
        const end = halfway(points[i], points[(i + 1) % n]);
        ctx.quadraticCurveTo(points[i].x, points[i].y, end.x, end.y);
      }
      ctx.closePath();
    }, s);
  }

  // A filled point with a thin dark ring.
  dot(p: Pt, color: string, alpha = 1, radius = 2.8) {
    const { ctx, u } = this;
    ctx.setLineDash([]);
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius * u, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = 0.9 * u;
    ctx.strokeStyle = "rgba(2,6,23,0.85)";
    ctx.stroke();
  }

  // Short perpendicular cap at the end of a measured segment.
  cap(p: Pt, toward: Pt, color: string, alpha = 1, length = 5) {
    const dx = toward.x - p.x;
    const dy = toward.y - p.y;
    const n = Math.hypot(dx, dy) || 1;
    const nx = (-dy / n) * length * this.u;
    const ny = (dx / n) * length * this.u;
    this.line({ x: p.x - nx, y: p.y - ny }, { x: p.x + nx, y: p.y + ny }, { color, alpha, width: 1.5 * this.u });
  }

  arc(center: Pt, radius: number, from: number, to: number, s: Stroke) {
    this.strokePath(() => this.ctx.arc(center.x, center.y, radius * this.u, from, to), s);
  }

  // The pill's size for a piece of text (sets the font as a side effect).
  private measure(text: string) {
    const { ctx, u } = this;
    const fontSize = 12.5 * u;
    ctx.font = `600 ${fontSize}px ${FONT}`;
    ctx.textBaseline = "middle";
    const padX = 7 * u;
    return { fontSize, padX, boxW: ctx.measureText(text).width + padX * 2, boxH: fontSize + 8 * u };
  }

  private pill(x: number, y: number, text: string, color: string, alpha: number, m: ReturnType<Painter["measure"]>) {
    const { ctx, u } = this;
    ctx.setLineDash([]);
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    // roundRect is missing from browsers older than 2022; a plain box is fine there.
    if (typeof ctx.roundRect === "function") ctx.roundRect(x, y, m.boxW, m.boxH, m.boxH / 2);
    else ctx.rect(x, y, m.boxW, m.boxH);
    ctx.fillStyle = "rgba(5,5,16,0.86)";
    ctx.fill();
    ctx.lineWidth = 1.2 * u;
    ctx.strokeStyle = color;
    ctx.stroke();
    ctx.fillStyle = "#f8fafc";
    ctx.fillText(text, x + m.padX, y + m.boxH / 2 + 0.5 * u);
  }

  // A text pill (dark rounded box, coloured edge) placed at a point. Kept inside the canvas.
  label(
    p: Pt,
    text: string,
    color: string,
    options: { align?: "left" | "center" | "right"; dy?: number; alpha?: number } = {},
  ) {
    const { u } = this;
    const m = this.measure(text);
    let x = options.align === "center" ? p.x - m.boxW / 2 : options.align === "right" ? p.x - m.boxW : p.x;
    let y = p.y + (options.dy ?? 0) * u - m.boxH / 2;
    const margin = 4 * u;
    x = Math.max(margin, Math.min(x, this.w - m.boxW - margin));
    y = Math.max(margin, Math.min(y, this.h - m.boxH - margin));
    this.pill(x, y, text, color, options.alpha ?? 1, m);
  }

  // A pill off to the side of the face, joined to the measured spot by a thin leader line, so the
  // text never covers the features it describes. `bounds` are the x positions just outside the
  // face on each side; the right side is used unless the pill doesn't fit there.
  callout(
    anchor: Pt,
    text: string,
    color: string,
    bounds: { left: number; right: number },
    options: { dy?: number; alpha?: number; keepLevel?: boolean } = {},
  ) {
    const { u } = this;
    const m = this.measure(text);
    const margin = 4 * u;
    const fitsRight = bounds.right + m.boxW <= this.w - margin;
    const fitsLeft = bounds.left - m.boxW >= margin;
    const useRight = fitsRight || (!fitsLeft && this.w - bounds.right >= bounds.left);
    const edge = useRight ? bounds.right : bounds.left;
    let x = useRight ? edge : edge - m.boxW;
    let y = anchor.y + (options.dy ?? 0) * u - m.boxH / 2;
    x = Math.max(margin, Math.min(x, this.w - m.boxW - margin));
    y = Math.max(margin, Math.min(y, this.h - m.boxH - margin));
    const alpha = options.alpha ?? 1;
    // A pill too wide for the room beside the face ends up over the face. Lift it clear of the
    // line it describes (above it, or below if there is no room above) and join it from below.
    const overFace = useRight ? x < edge - u : x + m.boxW > edge + u;
    if (overFace && !options.keepLevel) {
      const lift = m.boxH * 0.95;
      y = anchor.y - lift - m.boxH / 2 >= margin ? anchor.y - lift - m.boxH / 2 : anchor.y + lift - m.boxH / 2;
      y = Math.max(margin, Math.min(y, this.h - m.boxH - margin));
      const above = y + m.boxH / 2 < anchor.y;
      const joinX = Math.max(x + m.boxH / 2, Math.min(anchor.x, x + m.boxW - m.boxH / 2));
      this.line(anchor, { x: joinX, y: above ? y + m.boxH : y }, { color, alpha: alpha * 0.8, width: 1 * u });
    } else {
      const joinX = useRight ? x : x + m.boxW;
      this.line(anchor, { x: joinX, y: y + m.boxH / 2 }, { color, alpha: alpha * 0.8, width: 1 * u });
    }
    this.pill(x, y, text, color, alpha, m);
  }
}

import { useVideoConfig } from "remotion";

export interface Layout {
  /** 16:9 long-form (true) or 9:16 short (false) */
  wide: boolean;
  width: number;
  height: number;
  /** the square viewport that shows the face */
  card: { x: number; y: number; size: number; radius: number };
}

export const layoutFor = (width: number, height: number): Layout =>
  width > height
    ? { wide: true, width, height, card: { x: 60, y: 150, size: 880, radius: 40 } }
    : { wide: false, width, height, card: { x: 40, y: 190, size: 1000, radius: 44 } };

export const useLayout = (): Layout => {
  const { width, height } = useVideoConfig();
  return layoutFor(width, height);
};

import React from "react";
import { Droplet, LayoutGrid, Palette, Scissors, ScanFace } from "lucide-react";
import { reportsReady, type Scan, type SectionKey } from "./scanData";

export interface SectionMeta {
  key: SectionKey;
  index: string;
  title: string;
  short: string;
  route: string;
  /** What the report is, in a sentence. */
  blurb: string;
  /** Free accounts can open the report but not read all of it. */
  access: "partial" | "pro";
  /** Bullets for "what's inside" on the section page. */
  inside: string[];
  /** What the photo should look like for the best result. */
  photoTips: string[];
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}

export const SECTIONS: SectionMeta[] = [
  {
    key: "facial",
    index: "01",
    title: "Facial analysis",
    short: "Facial",
    route: "/dashboard/facial",
    blurb: "Your face measured against 25+ ratios, from canthal tilt to jaw angle, so you can see which features lead and which lag.",
    access: "partial",
    inside: [
      "Overall harmony score and where it sits among other faces",
      "Each ratio against its ideal range, drawn on your photo",
      "Strongest features and the ones holding the score back",
      "Drag any landmark to correct it and the score updates",
    ],
    photoTips: ["Face the camera straight on", "Neutral expression, mouth closed", "Hair off the forehead and ears", "Even light, no heavy filters"],
    icon: ScanFace,
  },
  {
    key: "skincare",
    index: "02",
    title: "Skincare analysis",
    short: "Skincare",
    route: "/dashboard/skincare",
    blurb: "Your skin type and main concerns from a photo, with a morning and night routine built around them.",
    access: "pro",
    inside: [
      "Skin type and a severity score",
      "The concerns that matter most, in order",
      "Morning and night routine, step by step",
      "Saved to your scan, so you only wait once",
    ],
    photoTips: ["Bare skin, no makeup", "Soft daylight from the front", "No beauty filter or smoothing", "The same lighting each time you scan"],
    icon: Droplet,
  },
  {
    key: "color",
    index: "03",
    title: "Color analysis",
    short: "Color",
    route: "/dashboard/color",
    blurb: "Your undertone and seasonal palette, the colors that work on you, the neutrals, and what to avoid wearing.",
    access: "pro",
    inside: [
      "Skin undertone and seasonal palette",
      "Best colors and best neutrals as swatches",
      "The same outfit in four colors: great, okay, avoid",
      "A short quick guide you can screenshot",
    ],
    photoTips: ["Natural daylight, near a window", "No colored lighting or filters", "Plain top, ideally white or grey", "Hair and brows their natural color"],
    icon: Palette,
  },
  {
    key: "hairstyle",
    index: "04",
    title: "Hairstyle analysis",
    short: "Hairstyle",
    route: "/dashboard/hairstyle",
    blurb: "Cuts and lengths compared on your own face: what suits you, what is fine, and what is less flattering.",
    access: "pro",
    inside: [
      "Four or five recommended styles on your portrait",
      "Styles that work but don't flatter",
      "Styles to skip, and why",
      "Short styling tips: volume, layers, face framing",
    ],
    photoTips: ["Hair visible and dry", "Face centered, shoulders in frame", "Neutral background", "No hat or headband"],
    icon: Scissors,
  },
];

export const OVERVIEW_ICON = LayoutGrid;

export const sectionByKey = (key: SectionKey) => SECTIONS.find((s) => s.key === key)!;

/** Fixed point of a scan's landmark constellation, drawn as polylines by ScanPortrait. */
export const CONSTELLATION: string[][] = [
  ["leftTopGonion", "leftBottomGonion", "chinLeft", "chinBottom", "chinRight", "rightBottomGonion", "rightTopGonion"],
  ["leftEyeMedialCanthus", "leftEyeUpperEyelid", "leftEyeLateralCanthus", "leftEyeLowerEyelid", "leftEyeMedialCanthus"],
  ["rightEyeMedialCanthus", "rightEyeUpperEyelid", "rightEyeLateralCanthus", "rightEyeLowerEyelid", "rightEyeMedialCanthus"],
  ["leftBrowHead", "leftBrowArch", "leftBrowTail"],
  ["rightBrowHead", "rightBrowArch", "rightBrowTail"],
  ["mouthLeft", "cupidsBow", "mouthRight", "lowerLip", "mouthLeft"],
  ["noseLeft", "noseBottom", "noseRight"],
  ["hairline", "nasion", "noseBottom", "chinBottom"],
];

/** Where the "new scan" flow starts. `new=1` skips auto-loading the latest scan in the results screen. */
export const NEW_SCAN = "/dashboard/facial-analysis?new=1";

export type SectionStatus = { tone: "ready" | "pending" | "lock"; label: string; locked: boolean; ready: boolean };

/** State of one report for one scan, as shown on chips and used to pick the call to action. */
export function statusOf(s: SectionMeta, scan: Scan | null, isPaid: boolean): SectionStatus {
  if (!scan) return { tone: "pending", label: "Needs a scan", locked: false, ready: false };
  const ready = reportsReady(scan)[s.key];
  if (!isPaid && s.access === "pro") return { tone: "lock", label: ready ? "Ready · Pro" : "Pro", locked: true, ready };
  return ready ? { tone: "ready", label: "Ready", locked: false, ready } : { tone: "pending", label: "Not run yet", locked: false, ready };
}

import type { MetricData } from "./types";
import { formatValue, scoreLabel } from "./format";

export interface PlanEntry {
  key: string; // key in Facemaxify's RATIO_CONFIGS
  short: string; // on-screen title
  what: string; // plain-English definition, given to the script writer so narration stays factual
}

/**
 * Display order of the video (eyes -> brows -> midface -> jaw -> chin & lips -> nose).
 * Which ratios survive when fewer than all are requested is decided by shared/selection.ts.
 */
export const METRIC_PLAN: PlanEntry[] = [
  {
    key: "canthalTilt",
    short: "Canthal Tilt",
    what: "Angle of the line from the inner to the outer corner of each eye, relative to horizontal. Positive means the outer corner sits higher than the inner corner (the upward, 'hunter' tilt that reads as attractive); negative means downturned. Ideal is roughly +6 to +10 degrees.",
  },
  {
    key: "eyebrowTilt",
    short: "Eyebrow Tilt",
    what: "Angle from the inner brow to the brow arch relative to horizontal. A slight upward tilt reads as alert and defined; flat or drooping brows read softer or tired.",
  },
  {
    key: "eyeAspectRatio",
    short: "Eye Aspect Ratio",
    what: "Eye width divided by eye height. Higher means a more almond, narrower opening; lower means rounder, bigger-looking eyes. Ideal is about 3.0.",
  },
  {
    key: "oneEyeApart",
    short: "One Eye Apart Test",
    what: "The gap between the inner eye corners compared with the width of a single eye. The classic 'one eye apart' balance is about 1.0.",
  },
  {
    key: "eyeSeparation",
    short: "Eye Separation",
    what: "Distance between the pupils as a percentage of face width at the cheekbones. Ideal is about 47%.",
  },
  {
    key: "browLengthRatio",
    short: "Brow Length",
    what: "Combined length of both eyebrows compared with face width. Ideal is about 0.82.",
  },
  {
    key: "midfaceRatio",
    short: "Midface Ratio",
    what: "Distance between the pupils divided by the vertical distance from the pupils to the lips. Ideal is about 1.0 - a compact, youthful midface.",
  },
  {
    key: "faceWidthHeight",
    short: "Face Width-to-Height",
    what: "Facial width-to-height ratio (fWHR): cheekbone width divided by the height from brow level to the upper lip. Ideal is about 2.0 and is associated with a strong, wide, dominant-looking face.",
  },
  {
    key: "totalFacialWidthHeight",
    short: "Total Face Ratio",
    what: "Full face height (hairline to chin) divided by cheekbone width. Ideal is about 1.35.",
  },
  {
    key: "middleThird",
    short: "Middle Third",
    what: "The brow-to-nose-base share of total face height. Ideal is 33.3%, i.e. perfectly equal facial thirds.",
  },
  {
    key: "lowerThird",
    short: "Lower Third",
    what: "The nose-base-to-chin share of total face height. Ideal is 33.3%.",
  },
  {
    key: "cheekboneHeight",
    short: "Cheekbone Height",
    what: "How high the cheekbones sit between the eye line and the mouth. Around 75% means high, sculpted cheekbones.",
  },
  {
    key: "jawFrontalAngle",
    short: "Jaw Frontal Angle",
    what: "The angle formed where the two jaw lines meet at the chin, seen from the front. Ideal is about 89.5 degrees - a defined, angular jaw.",
  },
  {
    key: "jawSlope",
    short: "Jaw Slope",
    what: "Angle between the cheekbone, the upper jaw corner and the side of the chin, averaged over both sides. Ideal is about 141 degrees - a clean, sharp jaw taper.",
  },
  {
    key: "bigonialWidth",
    short: "Bigonial Width",
    what: "Jaw width (corner to corner) as a percentage of cheekbone width. Ideal is about 89%.",
  },
  {
    key: "chinPhiltrum",
    short: "Chin to Philtrum",
    what: "Chin height (lower lip to chin) divided by philtrum height (nose base to upper lip). Ideal is about 2.0.",
  },
  {
    key: "lipRatio",
    short: "Lip Ratio",
    what: "Lower lip height divided by upper lip height. Ideal is about 1.57, close to the golden ratio.",
  },
  {
    key: "mouthToNoseWidth",
    short: "Mouth-to-Nose Width",
    what: "Mouth width divided by nose width. Ideal is about 1.55.",
  },
  {
    key: "interpupillaryMouth",
    short: "Pupil-to-Mouth Width",
    what: "Mouth width compared with the distance between the pupils. Ideal is about 0.85.",
  },
  {
    key: "ipsilateralAlarAngle",
    short: "Alar Angle",
    what: "Angle at the base of the nose between lines to the two outer eye corners. Ideal is about 88.5 degrees and reflects how the face tapers.",
  },
  {
    key: "intercanthalNasal",
    short: "Eye-to-Nose Width",
    what: "Nose width divided by the distance between the inner eye corners. Ideal is about 1.0.",
  },
  {
    key: "upperThird",
    short: "Upper Third",
    what: "The hairline-to-brow share of total face height. Ideal is 33.3%.",
  },
];

export const MIN_METRICS = 5;
export const MAX_METRICS = METRIC_PLAN.length;

export type RawMetric = {
  key: string;
  name: string;
  value: number;
  unit: string;
  idealMin: number;
  idealMax: number;
  score: number;
};

/** Raw Facemaxify metric -> the display-ready record used by the video. */
export function toMetricData(m: RawMetric): MetricData {
  const p = planByKey(m.key);
  return {
    key: m.key,
    name: m.name,
    short: p?.short ?? m.name,
    value: m.value,
    unit: m.unit,
    score: m.score,
    idealMin: m.idealMin,
    idealMax: m.idealMax,
    label: scoreLabel(m.score),
    displayValue: formatValue(m.value, m.unit),
  };
}

export const planByKey = (key: string): PlanEntry | undefined => METRIC_PLAN.find((p) => p.key === key);

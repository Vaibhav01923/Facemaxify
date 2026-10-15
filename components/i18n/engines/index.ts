import type { EngineId } from "../../../i18n/types";
import { attractivenessEngine } from "./attractiveness";
import { faceRatingEngine } from "./faceRating";
import { faceShapeEngine } from "./faceShape";
import { faceSymmetryEngine } from "./faceSymmetry";
import { goldenRatioEngine } from "./goldenRatio";
import { hunterEyesEngine } from "./hunterEyes";
import { looksmaxEngine } from "./looksmax";
import type { Engine } from "./common";

// Measuring engines behind the translated tool pages. Each reuses the calculation of an
// English tool, so a photo scores the same in every language.
export const ENGINES: Record<EngineId, Engine> = {
  "hunter-eyes": hunterEyesEngine,
  attractiveness: attractivenessEngine,
  "face-rating": faceRatingEngine,
  looksmax: looksmaxEngine,
  "face-shape": faceShapeEngine,
  "face-symmetry": faceSymmetryEngine,
  "golden-ratio": goldenRatioEngine,
};

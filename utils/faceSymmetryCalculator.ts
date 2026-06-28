export interface SymmetryPair {
  name: string;
  leftDist: number;
  rightDist: number;
  ratio: number; // closer to 1.0 = more symmetric
  deviation: number; // % deviation from perfect symmetry
}

export interface FaceSymmetryResult {
  score: number; // 0–100
  classification: "Highly Symmetric" | "Mostly Symmetric" | "Moderate Asymmetry" | "Notable Asymmetry";
  pairs: SymmetryPair[];
  review: string;
  strongestFeature: string;
  weakestFeature: string;
}

export function calculateFaceSymmetry(landmarks: any[]): FaceSymmetryResult {
  // Face midline: average X of nose bridge points
  const noseTip = landmarks[1];
  const noseRoot = landmarks[6];
  const chin = landmarks[152];

  // Midline X: use nose bridge as the reference vertical axis
  const midlineX = (noseTip.x + noseRoot.x + chin.x) / 3;

  // Face height for normalisation
  const faceHeight = Math.abs(landmarks[10].y - landmarks[152].y) || 1;

  // Paired landmarks: [leftIdx, rightIdx, label]
  const pairDefs: [number, number, string][] = [
    [33, 263, "Outer Eye Corners"],
    [133, 362, "Inner Eye Corners"],
    [159, 386, "Eye Height"],
    [105, 334, "Eyebrow Arch"],
    [61, 291, "Mouth Corners"],
    [234, 454, "Cheekbones"],
    [172, 397, "Jaw Angles"],
    [98, 327, "Nostrils"],
  ];

  const pairs: SymmetryPair[] = pairDefs.map(([lIdx, rIdx, name]) => {
    const leftDist = Math.abs(landmarks[lIdx].x - midlineX) / faceHeight;
    const rightDist = Math.abs(landmarks[rIdx].x - midlineX) / faceHeight;
    const ratio = leftDist > 0 && rightDist > 0
      ? Math.min(leftDist, rightDist) / Math.max(leftDist, rightDist)
      : 1;
    const deviation = Math.abs(1 - ratio) * 100;
    return { name, leftDist, rightDist, ratio, deviation };
  });

  // Score: average ratio across all pairs mapped to 0–100
  const avgRatio = pairs.reduce((sum, p) => sum + p.ratio, 0) / pairs.length;
  // A ratio of 1.0 → 100, 0.85 → ~75, 0.70 → ~50
  const rawScore = Math.round(50 + avgRatio * 50);
  const score = Math.min(100, Math.max(0, rawScore));

  let classification: FaceSymmetryResult["classification"];
  let review: string;

  if (score >= 90) {
    classification = "Highly Symmetric";
    review = "Your face shows exceptional left-right symmetry across all measured zones. High facial symmetry is strongly associated with perceived attractiveness and is a key component of aesthetic harmony.";
  } else if (score >= 78) {
    classification = "Mostly Symmetric";
    review = "Your face is well-balanced with good left-right symmetry. Minor asymmetries are present but fall well within the normal range — most people have subtle variations that are invisible to the naked eye.";
  } else if (score >= 65) {
    classification = "Moderate Asymmetry";
    review = "Your face has some measurable asymmetry in a few zones. This is entirely normal — no human face is perfectly symmetric. These variations add character and are often unnoticeable in everyday interaction.";
  } else {
    classification = "Notable Asymmetry";
    review = "Your facial measurements show more pronounced left-right differences in certain zones. This may be influenced by photo angle, lighting, or natural facial structure. A straight-on photo in even lighting gives the most accurate symmetry reading.";
  }

  const sortedByDeviation = [...pairs].sort((a, b) => a.deviation - b.deviation);
  const strongestFeature = sortedByDeviation[0].name;
  const weakestFeature = sortedByDeviation[sortedByDeviation.length - 1].name;

  return { score, classification, pairs, review, strongestFeature, weakestFeature };
}

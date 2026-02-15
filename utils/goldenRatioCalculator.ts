// Mathematical constant for the Golden Ratio
const PHI = 1.61803398875;

export interface GoldenRatioResult {
  score: number; // 0-100 score
  ratios: {
    name: string;
    value: number;
    ideal: number;
    score: number; // 0-100 for this specific ratio
    description: string;
  }[];
  review: string;
}

// Helper to calculate distance between two points
function calculateDistance(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

export function calculateGoldenRatio(landmarks: any[]): GoldenRatioResult {
  // Key Landmarks (based on MediaPipe Face Mesh)
  // These indices are standard for MediaPipe Face Mesh

  // Face Dimensions
  const topOfHead = landmarks[10];
  const chin = landmarks[152];
  const leftCheek = landmarks[234];
  const rightCheek = landmarks[454];

  // Eyes
  const leftEyeOuter = landmarks[33];
  const leftEyeInner = landmarks[133];
  const rightEyeInner = landmarks[362];
  const rightEyeOuter = landmarks[263];

  // Nose
  const noseTop = landmarks[168]; // Glabella/top of nose
  const noseBottom = landmarks[2];
  const noseLeft = landmarks[235]; // Alar base (approx)
  const noseRight = landmarks[455]; // Alar base (approx)

  // Mouth
  const mouthLeft = landmarks[61];
  const mouthRight = landmarks[291];
  const lipsTop = landmarks[0];
  const lipsBottom = landmarks[17];

  // 1. Face Length / Width Ratio (Ideal: 1.618)
  const faceLength = calculateDistance(topOfHead, chin);
  const faceWidth = calculateDistance(leftCheek, rightCheek);
  const faceRatio = faceLength / faceWidth;

  // 2. Inter-eye Distance / Eye Width (Ideal: 1.618 for space between? No, usually Eye Width = Space Between for Rule of Thirds.
  // For Golden Ratio, typically Mouth Width / Nose Width = Phi)

  // 3. Mouth Width / Nose Width (Ideal: 1.618)
  const mouthWidth = calculateDistance(mouthLeft, mouthRight);
  const noseWidth = calculateDistance(noseLeft, noseRight); // Using cheekbones/alar base approximation might be too wide, let's use actual nose alar points if reliable.
  // MediaPipe nose alar points are roughly 102 (L) and 331 (R) or similar. Let's use simpler approx for now:
  // Actually, MediaPipe 102/331 are better for nostrils.
  // Let's stick to standard vertical ratios which are more robust in 2D.

  // Let's use the layout from standard "Marquardt Mask" principles simplified:
  // A. Top of head to chin / Width of head (Phi)
  // B. Top of head to pupil / Pupil to chin (Phi) -> Actually Top-Nose / Nose-Chin?
  // Let's use well-known verifiable ratios.

  // Ratio 1: Face L/W (The big one)
  const r1 = faceLength / faceWidth;

  // Ratio 2: Lips-Chin / Nose-Lips (Phi?)
  // Commonly: Distance(Nose, Chin) / Distance(Lips, Chin) = 1.618
  const noseToChin = calculateDistance(noseBottom, chin);
  const lipsToChin = calculateDistance(lipsBottom, chin);
  const r2 = noseToChin / lipsToChin;

  // Ratio 3: Nose Width / Nose-Mouth Distance?
  // Let's use: Width of Mouth / Width of Nose = 1.618
  // Nose width using 102 and 331 (nostril outsides)
  const noseWidthPrecise = calculateDistance(landmarks[102], landmarks[331]);
  const r3 = mouthWidth / noseWidthPrecise;

  // Ratio 4: Eye Outer Dist / Mouth Width (Width of eyes at outer corners / Width of mouth = 1.618)
  const outerEyeDistance = calculateDistance(leftEyeOuter, rightEyeOuter);
  const r4 = outerEyeDistance / mouthWidth;

  // Calculate Scores (0-100 based on deviation)
  // Formula: 100 * (1 - abs(ratio - PHI) / PHI)
  // We'll damp the penalty slightly so small deviations aren't brutal.

  const calculateSubScore = (val: number, target: number) => {
    const deviation = Math.abs(val - target) / target;
    // Score drops linearly. 10% deviation = 90% score?
    // Let's be generous: 100 * (1 - deviation * 2)? No, let's do standard percentage.
    // 0% deviation = 100. 20% deviation = 80.
    const score = Math.max(0, 100 - deviation * 100 * 1.5); // 1.5 multiplier makes it a bit stricter
    return Math.round(score);
  };

  const s1 = calculateSubScore(r1, 1.35); // 1.618 is typical for "long" faces, but 1.35-1.5 is more common for "aesthetic" oval/square.
  // Actually, strict Golden Ratio mask says 1.618. Let's stick to PHI but acknowledge variation.
  // Wait, Face L/W average is often 1.3-1.4. 1.618 is VERY long.
  // Correct Golden Ratio application:
  // Width of face / Width of geometric center (eyes) = 1.618?
  // Let's stick to the Classic "Golden Ratio Beauty" (Marquardt) ratios which are mostly vertical.

  // Let's use these 3 robust ones:
  // 1. Mouth Width / Nose Width = 1.618
  // 2. Outer Eye Dist / Mouth Width = 1.618 (Wait, actually usually Mouth * 1.618 = Outer Eye Dist is close)
  // 3. Nose-Chin / Lips-Chin = 1.618

  const score1 = calculateSubScore(r3, PHI); // Mouth/Nose
  const score2 = calculateSubScore(r2, PHI); // Nose-Chin/Lips-Chin
  const score3 = calculateSubScore(r4, PHI); // Eye-Outer/Mouth

  // Weighted Average
  const totalScore = Math.round((score1 + score2 + score3) / 3);

  let review = "";
  if (totalScore > 90)
    review =
      "Your facial proportions align almost perfectly with the Golden Ratio.";
  else if (totalScore > 80)
    review = "You have excellent facial balance and harmony.";
  else if (totalScore > 70)
    review = "Your face has good proportions with some unique variations.";
  else
    review =
      "Your facial structure has strong unique character deviating from the 'Golden' standard.";

  return {
    score: totalScore,
    ratios: [
      {
        name: "Mouth vs Nose Width",
        value: Number(r3.toFixed(2)),
        ideal: 1.62,
        score: score1,
        description: "Your mouth width relative to your nose width.",
      },
      {
        name: "Chin Proportions",
        value: Number(r2.toFixed(2)),
        ideal: 1.62,
        score: score2,
        description: "The balance between your nose, lips, and chin.",
      },
      {
        name: "Eye vs Mouth Width",
        value: Number(r4.toFixed(2)),
        ideal: 1.62,
        score: score3,
        description: "The width of your eyes relative to your mouth.",
      },
    ],
    review,
  };
}

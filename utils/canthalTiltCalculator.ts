export interface CanthalTiltResult {
  angle: number; // The calculated tilt angle in degrees
  classification: "Positive" | "Neutral" | "Negative"; // The tilt classification
  score: number; // A harmony score from 0-100 based on standard aesthetics
  review: string; // A descriptive review to display to the user
}

export function calculateCanthalTilt(landmarks: any[]): CanthalTiltResult {
  // MediaPipe Face Mesh landmark indices
  // User's Left eye (right side of image usually)
  const leftEyeInner = landmarks[133];
  const leftEyeOuter = landmarks[33];

  // User's Right eye (left side of image usually)
  const rightEyeInner = landmarks[362];
  const rightEyeOuter = landmarks[263];

  // In image coordinates, Y=0 is the top, so lower Y means higher on the face.
  // A positive canthal tilt means the outer corner is HIGHER than the inner corner.
  // Therefore, inner.y should be > outer.y
  // dy = inner.y - outer.y (Positive if outer is higher)

  const calculateEyeTilt = (inner: any, outer: any) => {
    const dy = inner.y - outer.y;
    const dx = Math.abs(outer.x - inner.x); // Horizontal distance
    // Calculate angle in degrees
    const angleRadians = Math.atan2(dy, dx);
    return angleRadians * (180 / Math.PI);
  };

  const leftAngle = calculateEyeTilt(leftEyeInner, leftEyeOuter);
  const rightAngle = calculateEyeTilt(rightEyeInner, rightEyeOuter);

  // Average the tilt of both eyes
  const avgAngle = (leftAngle + rightAngle) / 2;

  // Classify the tilt
  // Generally, ~5-8 degrees is considered an ideal positive tilt in male/female models.
  // 0-3 degrees is neutral.
  // Negative degrees mean the outer corner is lower.
  let classification: "Positive" | "Neutral" | "Negative" = "Neutral";
  let review = "";
  let score = 0;

  if (avgAngle >= 3.5) {
    classification = "Positive";
    // Ideal range is usually 5-8 degrees.
    // If it's incredibly steep (>12), the score might taper.
    if (avgAngle <= 9) {
      score = 90 + Math.min(10, avgAngle); // 93-100
      review =
        "You have a clearly positive canthal tilt. This is highly sought after in modern aesthetics, giving the eyes a sharp, 'hunter' or feline appearance.";
    } else {
      score = Math.max(70, 100 - (avgAngle - 9) * 5);
      review =
        "You have a very steep positive canthal tilt. While striking, extreme tilts can sometimes appear unnatural.";
    }
  } else if (avgAngle > -2 && avgAngle < 3.5) {
    classification = "Neutral";
    score = 75 + ((avgAngle + 2) / 5.5) * 15; // Maps -2...3.5 to 75...90
    review =
      "You have a neutral canthal tilt. Your eyes sit horizontally, which provides a balanced, friendly, and naturally approachable appearance without extreme sharpness.";
  } else {
    classification = "Negative";
    // Negative tilt score drops smoothly
    score = Math.max(40, 75 - Math.abs(avgAngle + 2) * 5);
    review =
      "You have a negative canthal tilt. This gives a puppy-dog or doe-eyed appearance, which can be perceived as gentle, innocent, and highly expressive.";
  }

  return {
    angle: Number(avgAngle.toFixed(1)),
    classification,
    score: Math.round(score),
    review,
  };
}

// Face Shape Classification Utilities
// Pure mathematical approach - no AI needed, runs entirely in browser

export type FaceShape =
  | "oval"
  | "round"
  | "square"
  | "heart"
  | "diamond"
  | "oblong"
  | "triangle";

export interface FacialMeasurements {
  faceLength: number;
  faceWidth: number;
  foreheadWidth: number;
  cheekboneWidth: number;
  jawlineWidth: number;
  chinAngle: number;
  lengthToWidthRatio: number;
  foreheadToJawRatio: number;
}

export interface FaceShapeResult {
  shape: FaceShape;
  confidence: number;
  reasoning: string;
  measurements: FacialMeasurements;
  recommendations: {
    hairstyles: string[];
    glasses: string[];
    makeup: string[];
    celebrities: string[];
  };
}

// Calculate distance between two points
function calculateDistance(
  point1: { x: number; y: number },
  point2: { x: number; y: number },
): number {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Calculate angle between three points
function calculateAngle(
  point1: { x: number; y: number },
  vertex: { x: number; y: number },
  point2: { x: number; y: number },
): number {
  const angle1 = Math.atan2(point1.y - vertex.y, point1.x - vertex.x);
  const angle2 = Math.atan2(point2.y - vertex.y, point2.x - vertex.x);
  let angle = Math.abs(angle1 - angle2) * (180 / Math.PI);
  if (angle > 180) angle = 360 - angle;
  return angle;
}

// Extract facial measurements from MediaPipe landmarks
export function extractMeasurements(landmarks: any[]): FacialMeasurements {
  // Key landmark indices (MediaPipe Face Mesh)
  const foreheadTop = landmarks[10];
  const chinBottom = landmarks[152];
  const leftCheekbone = landmarks[234];
  const rightCheekbone = landmarks[454];
  const leftTemple = landmarks[21];
  const rightTemple = landmarks[251];
  const leftJaw = landmarks[172];
  const rightJaw = landmarks[397];
  const chinPoint = landmarks[152];

  // Calculate measurements
  const faceLength = calculateDistance(foreheadTop, chinBottom);
  const faceWidth = calculateDistance(leftCheekbone, rightCheekbone);
  const foreheadWidth = calculateDistance(leftTemple, rightTemple);
  const cheekboneWidth = faceWidth;
  const jawlineWidth = calculateDistance(leftJaw, rightJaw);
  const chinAngle = calculateAngle(leftJaw, chinPoint, rightJaw);

  const lengthToWidthRatio = faceLength / faceWidth;
  const foreheadToJawRatio = foreheadWidth / jawlineWidth;

  return {
    faceLength,
    faceWidth,
    foreheadWidth,
    cheekboneWidth,
    jawlineWidth,
    chinAngle,
    lengthToWidthRatio,
    foreheadToJawRatio,
  };
}

// Classify face shape based on measurements
export function classifyFaceShape(
  measurements: FacialMeasurements,
): FaceShapeResult {
  const { lengthToWidthRatio, foreheadToJawRatio, chinAngle } = measurements;

  let shape: FaceShape;
  let confidence: number;
  let reasoning: string;

  // Oval: Balanced proportions, length > width
  if (
    lengthToWidthRatio >= 1.4 &&
    lengthToWidthRatio <= 1.6 &&
    Math.abs(foreheadToJawRatio - 1) < 0.12 &&
    chinAngle > 120
  ) {
    shape = "oval";
    confidence = 92;
    reasoning =
      "Your face has balanced proportions with gentle curves. The length is about 1.5x the width, and your forehead and jawline are similar in width.";
  }
  // Round: Length ≈ Width, soft features
  else if (
    lengthToWidthRatio >= 0.9 &&
    lengthToWidthRatio <= 1.25 &&
    chinAngle > 130
  ) {
    shape = "round";
    confidence = 88;
    reasoning =
      "Your face has equal length and width with soft, rounded features. The jawline is gently curved without sharp angles.";
  }
  // Square: Length ≈ Width, angular jaw
  else if (
    lengthToWidthRatio >= 0.9 &&
    lengthToWidthRatio <= 1.25 &&
    chinAngle < 115 &&
    Math.abs(foreheadToJawRatio - 1) < 0.18
  ) {
    shape = "square";
    confidence = 90;
    reasoning =
      "Your face has a strong, angular jawline with balanced width. The forehead and jaw are similar in width, creating a square appearance.";
  }
  // Heart: Wide forehead, narrow chin
  else if (foreheadToJawRatio > 1.18 && chinAngle > 115) {
    shape = "heart";
    confidence = 87;
    reasoning =
      "Your face is widest at the forehead and tapers to a narrow, pointed chin. This creates a heart-shaped appearance.";
  }
  // Diamond: Widest at cheekbones
  else if (foreheadToJawRatio < 0.92 && chinAngle < 120) {
    shape = "diamond";
    confidence = 85;
    reasoning =
      "Your face is widest at the cheekbones with a narrow forehead and chin. The angular features create a diamond shape.";
  }
  // Oblong: Very long face
  else if (lengthToWidthRatio > 1.7) {
    shape = "oblong";
    confidence = 89;
    reasoning =
      "Your face is elongated with similar width throughout. The length is significantly greater than the width.";
  }
  // Triangle: Wide jaw, narrow forehead
  else if (foreheadToJawRatio < 0.82) {
    shape = "triangle";
    confidence = 83;
    reasoning =
      "Your face is widest at the jawline and narrows toward the forehead, creating a triangular or pear shape.";
  }
  // Default to oval if uncertain
  else {
    shape = "oval";
    confidence = 70;
    reasoning =
      "Your face has balanced features with slight variations. The proportions are closest to an oval shape.";
  }

  const recommendations = getRecommendations(shape);

  return {
    shape,
    confidence,
    reasoning,
    measurements,
    recommendations,
  };
}

// Get recommendations for each face shape
function getRecommendations(shape: FaceShape) {
  const recommendations = {
    oval: {
      hairstyles: [
        "Almost any hairstyle works with your balanced proportions!",
        "Side-swept bangs add elegance",
        "Long layers create movement",
        "Bob cuts frame your face beautifully",
        "Pixie cuts highlight your features",
      ],
      glasses: [
        "Oversized frames complement your proportions",
        "Cat-eye frames add sophistication",
        "Aviators create a classic look",
        "Square frames provide contrast",
      ],
      makeup: [
        "Highlight your cheekbones for definition",
        "Use soft contouring to enhance natural shape",
        "Apply blush on the apples of your cheeks",
        "Keep eyebrows well-groomed and arched",
      ],
      celebrities: ["Beyoncé", "Jessica Alba", "Rihanna", "Blake Lively"],
    },
    round: {
      hairstyles: [
        "Long, layered cuts elongate your face",
        "Side parts create asymmetry and length",
        "Angular bobs add definition",
        "Avoid blunt bangs that widen the face",
        "Waves starting below the chin work well",
      ],
      glasses: [
        "Rectangular frames add length",
        "Angular cat-eye frames create definition",
        "Geometric shapes provide contrast",
        "Avoid round frames that emphasize roundness",
      ],
      makeup: [
        "Contour temples and jawline to add definition",
        "Highlight the center of your face vertically",
        "Apply blush diagonally toward temples",
        "Use darker shades on sides of face",
      ],
      celebrities: [
        "Selena Gomez",
        "Kirsten Dunst",
        "Ginnifer Goodwin",
        "Chrissy Teigen",
      ],
    },
    square: {
      hairstyles: [
        "Soft waves soften angular features",
        "Layered cuts add movement and softness",
        "Side-swept styles balance strong jawline",
        "Avoid blunt cuts that emphasize angles",
        "Long hair with layers works beautifully",
      ],
      glasses: [
        "Round frames soften angular features",
        "Oval frames create balance",
        "Cat-eye frames with curves add femininity",
        "Avoid square frames that emphasize angles",
      ],
      makeup: [
        "Soften jawline with gentle contour",
        "Use round blush placement",
        "Highlight cheekbones and center of face",
        "Avoid harsh contouring on jaw",
      ],
      celebrities: [
        "Angelina Jolie",
        "Olivia Wilde",
        "Demi Moore",
        "Keira Knightley",
      ],
    },
    heart: {
      hairstyles: [
        "Chin-length bobs balance proportions",
        "Side-swept bangs soften wide forehead",
        "Waves at chin level add width",
        "Avoid volume at the crown",
        "Textured ends create balance",
      ],
      glasses: [
        "Bottom-heavy frames balance wide forehead",
        "Aviators work well with this shape",
        "Cat-eye frames complement features",
        "Rimless or light-colored frames on top",
      ],
      makeup: [
        "Contour temples to reduce width",
        "Highlight chin to add width",
        "Apply blush on apples of cheeks",
        "Balance proportions with strategic highlighting",
      ],
      celebrities: [
        "Reese Witherspoon",
        "Scarlett Johansson",
        "Jennifer Love Hewitt",
        "Kourtney Kardashian",
      ],
    },
    diamond: {
      hairstyles: [
        "Side parts create asymmetry",
        "Textured styles add softness",
        "Chin-length cuts balance proportions",
        "Soft bangs reduce cheekbone width",
        "Waves and curls add softness",
      ],
      glasses: [
        "Oval frames complement angular features",
        "Rimless frames don't compete with cheekbones",
        "Cat-eye frames work well",
        "Avoid frames wider than cheekbones",
      ],
      makeup: [
        "Soften prominent cheekbones with blending",
        "Highlight forehead and chin",
        "Use soft contouring techniques",
        "Balance proportions with strategic placement",
      ],
      celebrities: [
        "Halle Berry",
        "Jennifer Lopez",
        "Tyra Banks",
        "Vanessa Hudgens",
      ],
    },
    oblong: {
      hairstyles: [
        "Shoulder-length cuts add width",
        "Blunt bangs shorten face visually",
        "Waves and curls add volume and width",
        "Avoid long, straight hair that elongates",
        "Layers at cheekbone level work well",
      ],
      glasses: [
        "Oversized frames add width",
        "Deep frames shorten face appearance",
        "Decorative temples draw eye horizontally",
        "Avoid narrow frames that elongate",
      ],
      makeup: [
        "Contour hairline and chin to shorten",
        "Apply blush horizontally across cheeks",
        "Widen appearance with strategic highlighting",
        "Avoid vertical contouring",
      ],
      celebrities: [
        "Sarah Jessica Parker",
        "Liv Tyler",
        "Gisele Bündchen",
        "Hilary Swank",
      ],
    },
    triangle: {
      hairstyles: [
        "Add volume at crown to balance",
        "Side-swept bangs add width at top",
        "Short, layered cuts work well",
        "Avoid chin-length bobs",
        "Textured styles on top add balance",
      ],
      glasses: [
        "Top-heavy frames balance wide jaw",
        "Cat-eye frames add width at top",
        "Browline frames create balance",
        "Avoid bottom-heavy frames",
      ],
      makeup: [
        "Contour jawline to reduce width",
        "Highlight forehead to add width",
        "Apply blush on upper cheeks",
        "Balance proportions with highlighting",
      ],
      celebrities: ["Minnie Driver", "Kelly Osbourne", "Jennifer Aniston"],
    },
  };

  return recommendations[shape];
}

// Format face shape name for display
export function formatFaceShape(shape: FaceShape): string {
  return shape.charAt(0).toUpperCase() + shape.slice(1);
}

// Get color for confidence level
export function getConfidenceColor(confidence: number): string {
  if (confidence >= 90) return "text-green-400";
  if (confidence >= 80) return "text-blue-400";
  if (confidence >= 70) return "text-yellow-400";
  return "text-orange-400";
}

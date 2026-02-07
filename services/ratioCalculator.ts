
import { FrontLandmarks, Point } from "../types";
import { distance } from "../utils/geometry";

export interface MetricResult {
  name: string;
  value: number;
  unit: string;
  idealMin: number;
  idealMax: number;
  score: number; // 0-10
  relatedLandmarks: string[]; 
}

// User Provided Configuration
export const RATIO_CONFIGS = {
    // ===============================================
    // GROUP 1: CALCULATED
    // ===============================================
    canthalTilt: { name: "Lateral Canthal Tilt", ideal: 5.0, range: 2.0, decay: 0.35, unit: "°" },
    eyeAspectRatio: { name: "Eye Aspect Ratio", ideal: 3.0, range: 0.5, decay: 1.23, unit: "x" },

    interpupillaryMouth: { name: "Interpupillary-Mouth Width Ratio", ideal: 0.90, range: 0.05, decay: 3.25, unit: "x" },
    mouthToNoseWidth: { name: "Mouth width to nose width ratio", ideal: 1.55, range: 0.1, decay: 4.90, unit: "x" },
    lipRatio: { name: "Lower Lip to Upper Lip Ratio", ideal: 1.57, range: 0.1, decay: 1.08, unit: "x" },
    mouthCorner: { name: "Mouth Corner Position", ideal: 0.91, range: 0.03, decay: 0.36, unit: "mm" },
    cupidsBowDepth: { name: "Cupid's Bow Depth", ideal: 3.0, range: 1.0, decay: 0.25, unit: "mm" },
    noseTipPos: { name: "Nose Tip Position", ideal: 0.0, range: 1.0, decay: 0.53, unit: "mm" },
    intercanthalNasal: { name: "Intercanthal-Nasal Width Ratio", ideal: 1.0, range: 0.05, decay: 0.46, unit: "x" },
    middleThird: { name: "Middle Third", ideal: 33.3, range: 1.0, decay: 0.08, unit: "%" },
    lowerThird: { name: "Lower Third", ideal: 33.3, range: 1.0, decay: 0.07, unit: "%" },
    lowerThirdProp: { name: "Lower Third Proportion", ideal: 32.7, range: 1.0, decay: 0.44, unit: "%" },
    faceWidthHeight: { name: "Face Width to Height Ratio", ideal: 2.0, range: 0.1, decay: 2.60, unit: "x" },
    totalFacialWidthHeight: { name: "Total Facial Width to Height Ratio", ideal: 1.35, range: 0.03, decay: 0.70, unit: "x" },
    midfaceRatio: { name: "Midface Ratio", ideal: 1.0, range: 0.05, decay: 11.0, unit: "x" },
    cheekboneHeight: { name: "Cheekbone Height", ideal: 75.0, range: 5.0, decay: 0.23, unit: "%" },
    bigonialWidth: { name: "Bigonial Width", ideal: 89.0, range: 5.0, decay: 0.03, unit: "%" },
    jawFrontalAngle: { name: "Jaw Frontal Angle", ideal: 90.0, range: 5.0, decay: 0.03, unit: "°" },
    jawSlope: { name: "Jaw Slope", ideal: 141.25, range: 1.25, decay: 0.05, unit: "°" },
    chinPhiltrum: { name: "Chin to Philtrum Ratio", ideal: 2.0, range: 0.1, decay: 1.70, unit: "x" },
    deviationIAA_JFA: { name: "Deviation of IAA & JFA", ideal: 0, range: 2.0, decay: 0.17, unit: "°" },

    // ===============================================
    // GROUP 2: ESTIMATED
    // ===============================================
    eyebrowTilt: { name: "Eyebrow Tilt", ideal: 8.0, range: 3.0, decay: 0.2, unit: "°" },
    browLengthRatio: { name: "Brow Length to Face Width", ideal: 0.82, range: 0.05, decay: 4.0, unit: "x" },
    eyeSeparation: { name: "Eye Separation Ratio", ideal: 47.0, range: 1.0, decay: 0.2, unit: "%" },
    oneEyeApart: { name: "One Eye Apart Test", ideal: 1.31, range: 0.02, decay: 11.89, unit: "x" },
    noseBridgeWidth: { name: "Nose Bridge to Nose Width", ideal: 3.0, range: 0.5, decay: 0.2, unit: "x" },
    nasalWH: { name: "Nasal W to H Ratio", ideal: 0.6, range: 0.05, decay: 0.2, unit: "x" },
    noseTipRotation: { name: "Nose Tip Rotation Angle", ideal: 95.0, range: 5.0, decay: 0.2, unit: "°" },
    upperThird: { name: "Upper Third", ideal: 33.3, range: 1.0, decay: 0.1, unit: "%" },
    earProtrusion: { name: "Ear Protrusion Ratio", ideal: 3.5, range: 1.5, decay: 0.2, unit: "x" },
    orbitalVector: { name: "Orbital Vector", ideal: 3.0, range: 1.0, decay: 0.2, unit: "mm" },
    zAngle: { name: "Z Angle", ideal: 75.0, range: 5.0, decay: 0.2, unit: "°" },
    nasofacialAngle: { name: "Nasofacial Angle", ideal: 35.0, range: 5.0, decay: 0.2, unit: "°" },
    nasomentalAngle: { name: "Nasomental Angle", ideal: 125.0, range: 5.0, decay: 0.2, unit: "°" },
    mentolabialAngle: { name: "Mentolabial Angle", ideal: 125.0, range: 5.0, decay: 0.2, unit: "°" },
    nasofrontalAngle: { name: "Nasofrontal Angle", ideal: 120.0, range: 5.0, decay: 0.2, unit: "°" },
    upperForeheadSlope: { name: "Upper Forehead Slope", ideal: 5.0, range: 5.0, decay: 0.2, unit: "°" },
    recessionFrankfort: { name: "Recession relative to frankfort plane", ideal: 0.0, range: 2.0, decay: 0.2, unit: "mm" },
};

// Core Math Helpers
const math = {
    distance: (p1: Point, p2: Point) => Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)),
    ratio: (n: number, d: number) => (Math.abs(d) < 0.00001 ? 0 : n / d),
    
    // Angle at p2 (p1-p2-p3)
    angle: (p1: Point, p2: Point, p3: Point) => {
        const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
        const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };
        const dot = v1.x * v2.x + v1.y * v2.y;
        const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
        const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
        const cosine = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
        return Math.acos(cosine) * (180 / Math.PI);
    },

    // Angle of a single line segment relative to horizontal
    lineAngle: (p1: Point, p2: Point) => {
        const dy = p2.y - p1.y;
        const dx = p2.x - p1.x;
        let theta = Math.atan2(dy, dx) * (180 / Math.PI);
        // Normalize 0-360 or 0-180 absolute
        return Math.abs(theta);
    },

    // Calculate angle between two independent lines (l1_start->l1_end) and (l2_start->l2_end)
    angleBetweenLines: (p1: Point, p2: Point, p3: Point, p4: Point) => {
        const v1 = { x: p2.x - p1.x, y: p2.y - p1.y };
        const v2 = { x: p4.x - p3.x, y: p4.y - p3.y };
        const dot = v1.x * v2.x + v1.y * v2.y;
        const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
        const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
        const cosine = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
        return Math.acos(cosine) * (180 / Math.PI);
    },

    // Distance from point P to Line defined by A-B
    distPointToLine: (p: Point, a: Point, b: Point): number => {
        const num = Math.abs((b.y - a.y) * p.x - (b.x - a.x) * p.y + b.x * a.y - b.y * a.x);
        const den = Math.sqrt(Math.pow(b.y - a.y, 2) + Math.pow(b.x - a.x, 2));
        return math.ratio(num, den);
    },
    // Intersection of two lines defined by (p1, p2) and (p3, p4)
    intersect: (p1: Point, p2: Point, p3: Point, p4: Point): Point | null => {
        const det = (p2.x - p1.x) * (p4.y - p3.y) - (p4.x - p3.x) * (p2.y - p1.y);
        if (det === 0) return null; // Parallel lines
        const lambda = ((p4.y - p3.y) * (p4.x - p1.x) + (p3.x - p4.x) * (p4.y - p1.y)) / det;
        const gamma = ((p1.y - p2.y) * (p4.x - p1.x) + (p2.x - p1.x) * (p4.y - p1.y)) / det;
        return {
            x: p1.x + lambda * (p2.x - p1.x),
            y: p1.y + lambda * (p2.y - p1.y)
        };
    }
};

// Helper: Calculate absolute tilt angle relative to horizontal (0-90 degrees)
const calculateTilt = (p1: Point, p2: Point) => {
    // Sort by x to ensure vector points right
    const [left, right] = p1.x < p2.x ? [p1, p2] : [p2, p1];
    const dy = right.y - left.y;
    const dx = right.x - left.x;
    const theta = Math.atan2(dy, dx) * (180 / Math.PI);
    return Math.abs(theta); 
};

// Scoring Function with Decay
const calculateScore = (key: keyof typeof RATIO_CONFIGS, value: number): number => {
    const config = RATIO_CONFIGS[key];
    if (!config) return 10;
    
    const { ideal, range, decay } = config;
    const idealMin = ideal - range;
    const idealMax = ideal + range;
    
    if (value >= idealMin && value <= idealMax) return 10.0;
    
    const distance = value < idealMin ? idealMin - value : value - idealMax;
    // Score = 10 * e^(-decay * delta)
    const rawScore = 10 * Math.exp(-decay * distance);
    return Math.max(0, Math.min(10, rawScore));
};

export const calculateFrontRatios = (l: FrontLandmarks): MetricResult[] => {
  const results: MetricResult[] = [];
  // Approx mm scale based on average face height (190mm)
  const faceHeightPx = math.distance(l.hairline, l.chinBottom);
  const mmScale = 190 / (faceHeightPx || 1); 

  const add = (key: keyof typeof RATIO_CONFIGS, value: number, landmarks: string[]) => {
      const config = RATIO_CONFIGS[key];
      if (!config) return;
      results.push({
          name: config.name,
          value: parseFloat(value.toFixed(2)),
          unit: config.unit,
          idealMin: parseFloat((config.ideal - config.range).toFixed(2)),
          idealMax: parseFloat((config.ideal + config.range).toFixed(2)),
          score: parseFloat(calculateScore(key, value).toFixed(2)),
          relatedLandmarks: landmarks
      });
  };

  // --- Calculations ---
  
  // Canthal Tilt
  const leftTilt = calculateTilt(l.leftEyeMedialCanthus, l.leftEyeLateralCanthus);
  const rightTilt = calculateTilt(l.rightEyeMedialCanthus, l.rightEyeLateralCanthus);
  add('canthalTilt', (leftTilt + rightTilt) / 2, ["leftEyeLateralCanthus", "leftEyeMedialCanthus", "rightEyeLateralCanthus", "rightEyeMedialCanthus"]);

  // Eye Aspect Ratio
  const leftEyeW = Math.abs(l.leftEyeLateralCanthus.x - l.leftEyeMedialCanthus.x);
  const rightEyeW = Math.abs(l.rightEyeLateralCanthus.x - l.rightEyeMedialCanthus.x);
  const leftEyeH = Math.abs(l.leftEyeLowerEyelid.y - l.leftEyeUpperEyelid.y);
  const rightEyeH = Math.abs(l.rightEyeLowerEyelid.y - l.rightEyeUpperEyelid.y);
  const avgEyeW = (leftEyeW + rightEyeW) / 2;
  const avgEyeH = (leftEyeH + rightEyeH) / 2;
  add('eyeAspectRatio', math.ratio(avgEyeW, avgEyeH), ["leftEyeLateralCanthus", "leftEyeMedialCanthus", "leftEyeUpperEyelid", "leftEyeLowerEyelid"]);



  // Interpupillary-Mouth Width Ratio
  const ipd = Math.abs(l.rightEyePupil.x - l.leftEyePupil.x);
  const mouthW = Math.abs(l.mouthRight.x - l.mouthLeft.x);
  add('interpupillaryMouth', math.ratio(mouthW, ipd), ["mouthRight", "mouthLeft", "leftEyePupil", "rightEyePupil"]);

  // Mouth to Nose Width
  const noseW = Math.abs(l.noseRight.x - l.noseLeft.x);
  add('mouthToNoseWidth', math.ratio(mouthW, noseW), ["mouthRight", "mouthLeft", "noseRight", "noseLeft"]);

  // Lip Ratio
  const lowerLipH = Math.abs(l.lowerLip.y - l.mouthMiddle.y);
  const upperLipH = Math.abs(l.mouthMiddle.y - l.cupidsBow.y);
  add('lipRatio', math.ratio(lowerLipH, upperLipH), ["lowerLip", "mouthMiddle", "cupidsBow"]);

  // Mouth Corner Position
  const mouthCenterY = l.mouthMiddle.y;
  const mouthCornersY = (l.mouthLeft.y + l.mouthRight.y) / 2;
  add('mouthCorner', (mouthCenterY - mouthCornersY) * mmScale, ["mouthMiddle", "mouthLeft", "mouthRight"]);

  // Cupid's Bow Depth
  const cupidsBowDepth = Math.abs(l.cupidsBow.y - l.innerCupidsBow.y) * mmScale;
  add('cupidsBowDepth', cupidsBowDepth, ["cupidsBow", "innerCupidsBow"]);
  
  // Intercanthal-Nasal Width Ratio
  const innerEyeDist = Math.abs(l.rightEyeMedialCanthus.x - l.leftEyeMedialCanthus.x);
  add('intercanthalNasal', math.ratio(noseW, innerEyeDist), ["noseRight", "noseLeft", "rightEyeMedialCanthus", "leftEyeMedialCanthus"]);

  // Thirds
  const totalHeight = Math.abs(l.chinBottom.y - l.hairline.y);
  const browMidY = (l.leftBrowInnerCorner.y + l.rightBrowInnerCorner.y) / 2;
  add('upperThird', (Math.abs(browMidY - l.hairline.y) / totalHeight) * 100, ["hairline", "leftBrowInnerCorner", "rightBrowInnerCorner"]);
  add('middleThird', (Math.abs(l.noseBottom.y - browMidY) / totalHeight) * 100, ["noseBottom", "leftBrowInnerCorner", "rightBrowInnerCorner"]);
  add('lowerThird', (Math.abs(l.chinBottom.y - l.noseBottom.y) / totalHeight) * 100, ["chinBottom", "noseBottom"]);
  add('lowerThirdProp', (Math.abs(l.chinBottom.y - l.noseBottom.y) / totalHeight) * 100, ["chinBottom", "noseBottom"]);

  // Width/Height Ratios
  // Total Facial Height to Width (ideal 1.35) -> H/W
  const cheekWidth = Math.abs(l.rightCheek.x - l.leftCheek.x);
  add('totalFacialWidthHeight', math.ratio(totalHeight, cheekWidth), ["hairline", "chinBottom", "leftCheek", "rightCheek"]);

  // Face Width to Height (ideal 2.0) -> fWHR -> Width / MidfaceHeight (Brow to Mouth/Lip)
  const midfaceH_fwhr = Math.abs(l.mouthMiddle.y - browMidY);
  add('faceWidthHeight', math.ratio(cheekWidth, midfaceH_fwhr), ["leftCheek", "rightCheek", "leftBrowInnerCorner", "mouthMiddle"]);

  // Midface Ratio (Ideal 1.0) -> IPD / Midface Height (Pupil to Mouth?)
  const pupilY = (l.leftEyePupil.y + l.rightEyePupil.y) / 2;
  const midfaceH = Math.abs(l.cupidsBow.y - pupilY);
  add('midfaceRatio', math.ratio(ipd, midfaceH), ["leftEyePupil", "rightEyePupil", "cupidsBow"]);

  // Cheekbone Height (Vertical Position Ratio)
  // High cheekbones = closer to eyes = larger distance from mouth.
  // Ratio = (MouthY - CheekY) / (MouthY - EyeY)
  // Ideal 70% => Cheekbone is at 30% of the way down from eyes.
  const eyeY = (l.leftEyePupil.y + l.rightEyePupil.y) / 2;
  const cheekY = (l.leftCheek.y + l.rightCheek.y) / 2;
  const mouthY = l.mouthMiddle.y;
  
  // Vertical distance from mouth up to cheek vs total vertical eye-mouth span
  const cheekHeightVal = math.ratio((mouthY - cheekY), (mouthY - eyeY)) * 100;
  
  add('cheekboneHeight', cheekHeightVal, ["mouthMiddle", "leftCheek", "rightCheek", "leftEyePupil", "rightEyePupil"]);

  // Bigonial Width (vs Cheek)
  const jawWidth = Math.abs(l.rightBottomGonion.x - l.leftBottomGonion.x);
  add('bigonialWidth', math.ratio(jawWidth, cheekWidth) * 100, ["leftBottomGonion", "rightBottomGonion", "leftCheek", "rightCheek"]);

  // Jaw Frontal Angle (Intersection of jaw tangents)
  // Line 1: Left Bottom Gonion -> Chin Left
  // Line 2: Right Bottom Gonion -> Chin Right
  // Vertex = Intersection
  const intersection = math.intersect(l.leftBottomGonion, l.chinLeft, l.rightBottomGonion, l.chinRight);
  // If no intersection or bizarre, fallback to chinBottom
  const vertex = intersection || l.chinBottom;
  add('jawFrontalAngle', math.angle(l.leftBottomGonion, vertex, l.rightBottomGonion), ["leftBottomGonion", "chinLeft", "chinRight", "rightBottomGonion"]);

  // Jaw Slope (Updated Definition: Angle between Cheek -> Top Gonion -> Side Chin)
  // Vertex is Top Gonion
  const leftSlope = math.angle(l.leftCheek, l.leftTopGonion, l.chinLeft);
  const rightSlope = math.angle(l.rightCheek, l.rightTopGonion, l.chinRight);
  add('jawSlope', (leftSlope + rightSlope) / 2, ["leftCheek", "leftTopGonion", "chinLeft", "rightCheek", "rightTopGonion", "chinRight"]);

  // Chin to Philtrum
  const chinH = Math.abs(l.chinBottom.y - l.lowerLip.y);
  const philtrumH = Math.abs(l.cupidsBow.y - l.nasalBase.y);
  add('chinPhiltrum', math.ratio(chinH, philtrumH), ["chinBottom", "lowerLip", "cupidsBow", "nasalBase"]);

  // Eyebrow Tilt
  const leftBrowTilt = calculateTilt(l.leftBrowInnerCorner, l.leftBrowArch);
  const rightBrowTilt = calculateTilt(l.rightBrowInnerCorner, l.rightBrowArch);
  add('eyebrowTilt', (leftBrowTilt + rightBrowTilt) / 2, ["leftBrowInnerCorner", "leftBrowArch", "rightBrowInnerCorner", "rightBrowArch"]);

  // Brow Length
  const totalBrowL = math.distance(l.leftBrowHead, l.leftBrowTail) + math.distance(l.rightBrowHead, l.rightBrowTail);
  add('browLengthRatio', math.ratio(totalBrowL, cheekWidth), ["leftBrowHead", "leftBrowTail", "rightBrowHead", "rightBrowTail"]);

  // Eye Separation
  add('eyeSeparation', math.ratio(ipd, cheekWidth) * 100, ["leftEyePupil", "rightEyePupil", "leftCheek", "rightCheek"]);

  // One Eye Apart
  add('oneEyeApart', math.ratio(innerEyeDist, avgEyeW), ["leftEyeMedialCanthus", "rightEyeMedialCanthus", "leftEyeLateralCanthus"]);

  // Nose Bridge
  const bridgeW = Math.abs(l.rightNoseBridge.x - l.leftNoseBridge.x);
  add('noseBridgeWidth', math.ratio(noseW, bridgeW), ["noseLeft", "noseRight", "leftNoseBridge", "rightNoseBridge"]);

  return results;
};


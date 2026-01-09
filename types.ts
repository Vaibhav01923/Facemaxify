
export type Point = { x: number; y: number };

export interface LandmarkDefinition {
  description: string;
  name: string;
  scientificName: string;
  path: string;
  howToFind: string;
}

export type FrontLandmarks = {
  hairline: Point;
  leftEyePupil: Point;
  rightEyePupil: Point;
  noseLeft: Point;
  noseRight: Point;
  lowerLip: Point;
  chinBottom: Point;
  leftEyeMedialCanthus: Point;
  leftEyeLateralCanthus: Point;
  leftEyeUpperEyelid: Point;
  leftEyeLowerEyelid: Point;
  leftEyelidHoodEnd: Point;
  leftBrowHead: Point;
  leftBrowInnerCorner: Point;
  leftBrowArch: Point;
  leftBrowPeak: Point;
  leftBrowTail: Point;
  leftUpperEyelidCrease: Point;
  rightEyeMedialCanthus: Point;
  rightEyeLateralCanthus: Point;
  rightEyeUpperEyelid: Point;
  rightEyeLowerEyelid: Point;
  rightEyelidHoodEnd: Point;
  rightBrowHead: Point;
  rightBrowInnerCorner: Point;
  rightBrowArch: Point;
  rightBrowPeak: Point;
  rightBrowTail: Point;
  rightUpperEyelidCrease: Point;
  nasalBase: Point;
  noseBottom: Point;
  leftNoseBridge: Point;
  rightNoseBridge: Point;
  cupidsBow: Point;
  innerCupidsBow: Point;
  mouthMiddle: Point;
  mouthLeft: Point;
  mouthRight: Point;
  chinLeft: Point;
  chinRight: Point;
  leftCheek: Point;
  rightCheek: Point;
  leftTemple: Point;
  rightTemple: Point;
  leftOuterEar: Point;
  rightOuterEar: Point;
  leftTopGonion: Point;
  leftBottomGonion: Point;
  rightTopGonion: Point;
  rightBottomGonion: Point;
  neckLeft: Point;
  neckRight: Point;
  nasion: Point;
};

export type SideLandmarks = {
  vertex: Point;
  occiput: Point;
  pronasale: Point;
  neckPoint: Point;
  porion: Point;
  orbitale: Point;
  tragus: Point;
  intertragicNotch: Point;
  cornealApex: Point;
  cheekbone: Point;
  eyelidEnd: Point;
  lowerEyelid: Point;
  trichion: Point;
  glabella: Point;
  forehead: Point;
  nasion: Point;
  rhinion: Point;
  supratip: Point;
  infratip: Point;
  columella: Point;
  subnasale: Point;
  subalare: Point;
  labraleSuperius: Point;
  cheilion: Point;
  labraleInferius: Point;
  sublabiale: Point;
  pogonion: Point;
  menton: Point;
  cervicalPoint: Point;
  gonionTop: Point;
  gonionBottom: Point;
};

export interface AppState {
  step: number;
  gender: string | null;
  race: string[];
  frontPhotoUrl: string | null;
  sidePhotoUrl: string | null;
  frontLandmarks: FrontLandmarks | null;
  sideLandmarks: SideLandmarks | null;
}

export type FinalResult = {
  frontLandmarks: FrontLandmarks;
  frontPhotoUrl: string;
  gender: string;
  race: string;
  sideLandmarks?: SideLandmarks | null;
  sidePhotoUrl?: string | null;
};

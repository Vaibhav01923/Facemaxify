import { FrontLandmarks, SideLandmarks, LandmarkDefinition, Point } from "./types";

export const FRONT_LANDMARK_DEFINITIONS: Record<keyof FrontLandmarks, LandmarkDefinition> = {
    hairline: {
        description: "The hairline represents the junction between the scalp and forehead skin.",
        name: "Hairline",
        scientificName: "Trichion",
        path: "landmarksFront/hairline",
        howToFind: "Highest point of the forehead where hair growth begins."
    },
    leftEyePupil: {
        description: "Center of the left pupil.",
        name: "Left Pupil",
        scientificName: "Left Pupilla",
        path: "landmarksFront/leftEyePupil",
        howToFind: "Center of the left eye's black circle."
    },
    rightEyePupil: {
        description: "Center of the right pupil.",
        name: "Right Pupil",
        scientificName: "Right Pupilla",
        path: "landmarksFront/rightEyePupil",
        howToFind: "Center of the right eye's black circle."
    },
    noseLeft: {
        description: "Leftmost point of the nose wing.",
        name: "Left Alar",
        scientificName: "Left Alare",
        path: "landmarksFront/noseLeft",
        howToFind: "Outer edge of the left nostril."
    },
    noseRight: {
        description: "Rightmost point of the nose wing.",
        name: "Right Alar",
        scientificName: "Right Alare",
        path: "landmarksFront/noseRight",
        howToFind: "Outer edge of the right nostril."
    },
    lowerLip: {
        description: "Bottom edge of the lower lip.",
        name: "Lower Lip Bottom",
        scientificName: "Labrale Inferius",
        path: "landmarksFront/lowerLip",
        howToFind: "Lowest point of the lower lip's red part."
    },
    chinBottom: {
        description: "Lowest point of the chin.",
        name: "Chin Bottom",
        scientificName: "Menton",
        path: "landmarksFront/chinBottom",
        howToFind: "Bottom-most point of the chin."
    },
    leftEyeMedialCanthus: {
        description: "Inner corner of the left eye.",
        name: "Left Inner Eye",
        scientificName: "Left Endocanthion",
        path: "landmarksFront/leftEyeMedialCanthus",
        howToFind: "Inner tear duct area of the left eye."
    },
    leftEyeLateralCanthus: {
        description: "Outer corner of the left eye.",
        name: "Left Outer Eye",
        scientificName: "Left Exocanthion",
        path: "landmarksFront/leftEyeLateralCanthus",
        howToFind: "Outer corner where eyelids meet."
    },
    leftEyeUpperEyelid: {
        description: "Highest point of left upper eyelid.",
        name: "Left Upper Lid",
        scientificName: "Left Palpebra Sup",
        path: "landmarksFront/leftEyeUpperEyelid",
        howToFind: "Top edge of the left eyelid."
    },
    leftEyeLowerEyelid: {
        description: "Lowest point of left lower eyelid.",
        name: "Left Lower Lid",
        scientificName: "Left Palpebra Inf",
        path: "landmarksFront/leftEyeLowerEyelid",
        howToFind: "Bottom edge of the left eyelid."
    },
    leftEyelidHoodEnd: {
        description: "End of the fold above left eye.",
        name: "Left Hood End",
        scientificName: "Left Sulcus Lateralis",
        path: "landmarksFront/leftEyelidHoodEnd",
        howToFind: "Outer end of the upper eyelid crease."
    },
    leftBrowHead: {
        description: "Start of left eyebrow.",
        name: "Left Brow Head",
        scientificName: "Left Supercilium Med",
        path: "landmarksFront/leftBrowHead",
        howToFind: "Inner start of the left eyebrow."
    },
    leftBrowInnerCorner: {
        description: "Inner corner under the brow.",
        name: "Left Brow Inner",
        scientificName: "Left Supercilium Inf Med",
        path: "landmarksFront/leftBrowInnerCorner",
        howToFind: "Lowest inner point of the brow hair."
    },
    leftBrowArch: {
        description: "Highest arch point of left brow.",
        name: "Left Brow Arch",
        scientificName: "Left Supercilium Sup",
        path: "landmarksFront/leftBrowArch",
        howToFind: "Highest point of the eyebrow arch."
    },
    leftBrowPeak: {
        description: "Peak of the brow bone/hair.",
        name: "Left Brow Peak",
        scientificName: "Left Supercilium Apex",
        path: "landmarksFront/leftBrowPeak",
        howToFind: "Topmost peak of the eyebrow."
    },
    leftBrowTail: {
        description: "End of left eyebrow.",
        name: "Left Brow Tail",
        scientificName: "Left Supercilium Lat",
        path: "landmarksFront/leftBrowTail",
        howToFind: "Outer tip of the left eyebrow."
    },
    leftUpperEyelidCrease: {
        description: "Crease line above left eye.",
        name: "Left Lid Crease",
        scientificName: "Left Tarsal Crease",
        path: "landmarksFront/leftUpperEyelidCrease",
        howToFind: "The fold line on the upper eyelid."
    },
    rightEyeMedialCanthus: {
        description: "Inner corner of the right eye.",
        name: "Right Inner Eye",
        scientificName: "Right Endocanthion",
        path: "landmarksFront/rightEyeMedialCanthus",
        howToFind: "Inner tear duct area of the right eye."
    },
    rightEyeLateralCanthus: {
        description: "Outer corner of the right eye.",
        name: "Right Outer Eye",
        scientificName: "Right Exocanthion",
        path: "landmarksFront/rightEyeLateralCanthus",
        howToFind: "Outer corner where eyelids meet."
    },
    rightEyeUpperEyelid: {
        description: "Highest point of right upper eyelid.",
        name: "Right Upper Lid",
        scientificName: "Right Palpebra Sup",
        path: "landmarksFront/rightEyeUpperEyelid",
        howToFind: "Top edge of the right eyelid."
    },
    rightEyeLowerEyelid: {
        description: "Lowest point of right lower eyelid.",
        name: "Right Lower Lid",
        scientificName: "Right Palpebra Inf",
        path: "landmarksFront/rightEyeLowerEyelid",
        howToFind: "Bottom edge of the right eyelid."
    },
    rightEyelidHoodEnd: {
        description: "End of the fold above right eye.",
        name: "Right Hood End",
        scientificName: "Right Sulcus Lateralis",
        path: "landmarksFront/rightEyelidHoodEnd",
        howToFind: "Outer end of the upper eyelid crease."
    },
    rightBrowHead: {
        description: "Start of right eyebrow.",
        name: "Right Brow Head",
        scientificName: "Right Supercilium Med",
        path: "landmarksFront/rightBrowHead",
        howToFind: "Inner start of the right eyebrow."
    },
    rightBrowInnerCorner: {
        description: "Inner corner under the brow.",
        name: "Right Brow Inner",
        scientificName: "Right Supercilium Inf Med",
        path: "landmarksFront/rightBrowInnerCorner",
        howToFind: "Lowest inner point of the brow hair."
    },
    rightBrowArch: {
        description: "Highest arch point of right brow.",
        name: "Right Brow Arch",
        scientificName: "Right Supercilium Sup",
        path: "landmarksFront/rightBrowArch",
        howToFind: "Highest point of the eyebrow arch."
    },
    rightBrowPeak: {
        description: "Peak of the brow bone/hair.",
        name: "Right Brow Peak",
        scientificName: "Right Supercilium Apex",
        path: "landmarksFront/rightBrowPeak",
        howToFind: "Topmost peak of the eyebrow."
    },
    rightBrowTail: {
        description: "End of right eyebrow.",
        name: "Right Brow Tail",
        scientificName: "Right Supercilium Lat",
        path: "landmarksFront/rightBrowTail",
        howToFind: "Outer tip of the right eyebrow."
    },
    rightUpperEyelidCrease: {
        description: "Crease line above right eye.",
        name: "Right Lid Crease",
        scientificName: "Right Tarsal Crease",
        path: "landmarksFront/rightUpperEyelidCrease",
        howToFind: "The fold line on the upper eyelid."
    },
    nasalBase: {
        description: "Base of the columella.",
        name: "Nasal Base",
        scientificName: "Subnasale",
        path: "landmarksFront/nasalBase",
        howToFind: "Where the nose septum meets the upper lip."
    },
    noseBottom: {
        description: "Lowest point of the nose tip.",
        name: "Nose Tip Bottom",
        scientificName: "Pronasale Inf",
        path: "landmarksFront/noseBottom",
        howToFind: "Lowest point of the nose bulb."
    },
    leftNoseBridge: {
        description: "Left side of nose bridge.",
        name: "Left Nose Bridge",
        scientificName: "Left Nasal Bone",
        path: "landmarksFront/leftNoseBridge",
        howToFind: "Left side of the bony bridge."
    },
    rightNoseBridge: {
        description: "Right side of nose bridge.",
        name: "Right Nose Bridge",
        scientificName: "Right Nasal Bone",
        path: "landmarksFront/rightNoseBridge",
        howToFind: "Right side of the bony bridge."
    },
    cupidsBow: {
        description: "Peaks of the upper lip.",
        name: "Cupid's Bow Peaks",
        scientificName: "Labrale Superius",
        path: "landmarksFront/cupidsBow",
        howToFind: "The highest points of the upper lip."
    },
    innerCupidsBow: {
        description: "Dip of the cupid's bow.",
        name: "Cupid's Bow Dip",
        scientificName: "Labrale Superius Med",
        path: "landmarksFront/innerCupidsBow",
        howToFind: "The center dip of the upper lip."
    },
    mouthMiddle: {
        description: "Center where lips meet.",
        name: "Mouth Center",
        scientificName: "Stomion",
        path: "landmarksFront/mouthMiddle",
        howToFind: "Center point between closed lips."
    },
    mouthLeft: {
        description: "Left corner of mouth.",
        name: "Left Mouth Corner",
        scientificName: "Left Cheilion",
        path: "landmarksFront/mouthLeft",
        howToFind: "Left corner where lips join."
    },
    mouthRight: {
        description: "Right corner of mouth.",
        name: "Right Mouth Corner",
        scientificName: "Right Cheilion",
        path: "landmarksFront/mouthRight",
        howToFind: "Right corner where lips join."
    },
    chinLeft: {
        description: "Left side of chin curve.",
        name: "Left Chin",
        scientificName: "Left Mentum",
        path: "landmarksFront/chinLeft",
        howToFind: "Side of chin."
    },
    chinRight: {
        description: "Right side of chin curve.",
        name: "Right Chin",
        scientificName: "Right Mentum",
        path: "landmarksFront/chinRight",
        howToFind: "Side of chin."
    },
    leftCheek: {
        description: "Left cheekbone prominence.",
        name: "Left Cheekbone",
        scientificName: "Left Zygion",
        path: "landmarksFront/leftCheek",
        howToFind: "Most prominent/widest part of left cheek."
    },
    rightCheek: {
        description: "Right cheekbone prominence.",
        name: "Right Cheekbone",
        scientificName: "Right Zygion",
        path: "landmarksFront/rightCheek",
        howToFind: "Most prominent/widest part of right cheek."
    },
    leftTemple: {
        description: "Left temple hairline.",
        name: "Left Temple",
        scientificName: "Left Pterion",
        path: "landmarksFront/leftTemple",
        howToFind: "Narrowest point of temple or hairline."
    },
    rightTemple: {
        description: "Right temple hairline.",
        name: "Right Temple",
        scientificName: "Right Pterion",
        path: "landmarksFront/rightTemple",
        howToFind: "Narrowest point of temple or hairline."
    },
    leftOuterEar: {
        description: "Left ear edge.",
        name: "Left Ear",
        scientificName: "Left Otobasion",
        path: "landmarksFront/leftOuterEar",
        howToFind: "Outer edge of left ear."
    },
    rightOuterEar: {
        description: "Right ear edge.",
        name: "Right Ear",
        scientificName: "Right Otobasion",
        path: "landmarksFront/rightOuterEar",
        howToFind: "Outer edge of right ear."
    },
    leftTopGonion: {
        description: "Upper point of the jaw angle on left.",
        name: "Left Upper Gonion",
        scientificName: "Left Gonion Superius",
        path: "landmarksFront/leftTopGonion",
        howToFind: "Upper part of the jaw corner."
    },
    leftBottomGonion: {
        description: "Lower point of the jaw angle on left.",
        name: "Left Lower Gonion",
        scientificName: "Left Gonion Inferius",
        path: "landmarksFront/leftBottomGonion",
        howToFind: "Lower part of the jaw corner."
    },
    rightTopGonion: {
        description: "Upper point of the jaw angle on right.",
        name: "Right Upper Gonion",
        scientificName: "Right Gonion Superius",
        path: "landmarksFront/rightTopGonion",
        howToFind: "Upper part of the jaw corner."
    },
    rightBottomGonion: {
        description: "Lower point of the jaw angle on right.",
        name: "Right Lower Gonion",
        scientificName: "Right Gonion Inferius",
        path: "landmarksFront/rightBottomGonion",
        howToFind: "Lower part of the jaw corner."
    },
    neckLeft: {
        description: "Left side of the neck visible width.",
        name: "Left Neck",
        scientificName: "Left Neck",
        path: "landmarksFront/neckLeft",
        howToFind: "Widest point of the neck on left."
    },
    neckRight: {
        description: "Right side of the neck visible width.",
        name: "Right Neck",
        scientificName: "Right Neck",
        path: "landmarksFront/neckRight",
        howToFind: "Widest point of the neck on right."
    },
    nasion: {
        description: "Deepest depression at the root of the nose.",
        name: "Nasion",
        scientificName: "Nasion",
        path: "landmarksFront/nasion",
        howToFind: "Center point between eyes at nose bridge top."
    }
};

export const SIDE_LANDMARK_DEFINITIONS: Record<keyof SideLandmarks, LandmarkDefinition> = {
    vertex: {
        description: "Highest point of the head.",
        name: "Vertex",
        scientificName: "Vertex",
        path: "landmarksSide/vertex",
        howToFind: "Top of the head."
    },
    occiput: {
        description: "Back of the head.",
        name: "Occiput",
        scientificName: "Occiput",
        path: "landmarksSide/occiput",
        howToFind: "Most posterior point of the head."
    },
    pronasale: {
        description: "Tip of the nose.",
        name: "Nose Tip",
        scientificName: "Pronasale",
        path: "landmarksSide/pronasale",
        howToFind: "Most protruding point of the nose tip."
    },
    neckPoint: {
        description: "Point on the neck profile.",
        name: "Neck Point",
        scientificName: "Cervicale",
        path: "landmarksSide/neckPoint",
        howToFind: "Deepest point of the neck curve."
    },
    porion: {
        description: "Top of the ear canal opening.",
        name: "Porion",
        scientificName: "Porion",
        path: "landmarksSide/porion",
        howToFind: "Top edge of the ear canal."
    },
    orbitale: {
        description: "Lowest point of the eye socket.",
        name: "Orbitale",
        scientificName: "Orbitale",
        path: "landmarksSide/orbitale",
        howToFind: "Lowest bony point of the eye socket."
    },
    tragus: {
        description: "Small pointed eminence of the external ear.",
        name: "Tragus",
        scientificName: "Tragus",
        path: "landmarksSide/tragus",
        howToFind: "Cartilage flap covering the ear canal."
    },
    intertragicNotch: {
        description: "Notch below the tragus.",
        name: "Intertragic Notch",
        scientificName: "Intertragic Notch",
        path: "landmarksSide/intertragicNotch",
        howToFind: "Bottom of the notch below the tragus."
    },
    cornealApex: {
        description: "Most anterior point of the cornea.",
        name: "Corneal Apex",
        scientificName: "Corneal Apex",
        path: "landmarksSide/cornealApex",
        howToFind: "Front surface of the eye."
    },
    cheekbone: {
        description: "Prominence of the cheek.",
        name: "Cheekbone",
        scientificName: "Zygion",
        path: "landmarksSide/cheekbone",
        howToFind: "Most prominent point of the cheekbone."
    },
    eyelidEnd: {
        description: "Outer corner of the eye.",
        name: "Eyelid End",
        scientificName: "Exocanthion",
        path: "landmarksSide/eyelidEnd",
        howToFind: "Outer corner of the eye."
    },
    lowerEyelid: {
        description: "Lower eyelid margin.",
        name: "Lower Eyelid",
        scientificName: "Palpebra Inferius",
        path: "landmarksSide/lowerEyelid",
        howToFind: "Bottom edge of the lower eyelid."
    },
    trichion: {
        description: "Hairline point.",
        name: "Hairline",
        scientificName: "Trichion",
        path: "landmarksSide/trichion",
        howToFind: "Start of hairline on forehead."
    },
    glabella: {
        description: "Most prominent point between eyebrows.",
        name: "Glabella",
        scientificName: "Glabella",
        path: "landmarksSide/glabella",
        howToFind: "Smooth prominence between eyebrows."
    },
    forehead: {
        description: "Center of forehead.",
        name: "Forehead",
        scientificName: "Metopion",
        path: "landmarksSide/forehead",
        howToFind: "Middle of the forehead."
    },
    nasion: {
        description: "Nasal root depression.",
        name: "Nasion",
        scientificName: "Nasion",
        path: "landmarksSide/nasion",
        howToFind: "Deepest depression at the root of the nose."
    },
    rhinion: {
        description: "Bone/cartilage junction on nose bridge.",
        name: "Rhinion",
        scientificName: "Rhinion",
        path: "landmarksSide/rhinion",
        howToFind: "Junction of nasal bone and cartilage."
    },
    supratip: {
        description: "Point just above the nose tip.",
        name: "Supratip",
        scientificName: "Supratip",
        path: "landmarksSide/supratip",
        howToFind: "Area just above the nasal tip."
    },
    infratip: {
        description: "Point just below the nose tip.",
        name: "Infratip",
        scientificName: "Infratip",
        path: "landmarksSide/infratip",
        howToFind: "Under surface of the nose tip."
    },
    columella: {
        description: "Skin bridge between nostrils.",
        name: "Columella",
        scientificName: "Columella",
        path: "landmarksSide/columella",
        howToFind: "Middle point of the columella."
    },
    subnasale: {
        description: "Junction of columella and upper lip.",
        name: "Subnasale",
        scientificName: "Subnasale",
        path: "landmarksSide/subnasale",
        howToFind: "Base of the nose where it meets the lip."
    },
    subalare: {
        description: "Point below the nose wing.",
        name: "Subalare",
        scientificName: "Subalare",
        path: "landmarksSide/subalare",
        howToFind: "Base of the nostril wing."
    },
    labraleSuperius: {
        description: "Top edge of vermilion border of upper lip.",
        name: "Upper Lip Top",
        scientificName: "Labrale Superius",
        path: "landmarksSide/labraleSuperius",
        howToFind: "Highest point of the upper lip border."
    },
    cheilion: {
        description: "Corner of the mouth.",
        name: "Mouth Corner",
        scientificName: "Cheilion",
        path: "landmarksSide/cheilion",
        howToFind: "Corner where lips meet."
    },
    labraleInferius: {
        description: "Bottom edge of vermilion border of lower lip.",
        name: "Lower Lip Bottom",
        scientificName: "Labrale Inferius",
        path: "landmarksSide/labraleInferius",
        howToFind: "Lowest point of the lower lip border."
    },
    sublabiale: {
        description: "Chin-lip fold.",
        name: "Chin Fold",
        scientificName: "Sublabiale",
        path: "landmarksSide/sublabiale",
        howToFind: "Deepest point of the chin-lip crease."
    },
    pogonion: {
        description: "Most anterior point of the chin.",
        name: "Chin Tip",
        scientificName: "Pogonion",
        path: "landmarksSide/pogonion",
        howToFind: "Most forward point of the chin."
    },
    menton: {
        description: "Lowest point of the chin.",
        name: "Chin Bottom",
        scientificName: "Menton",
        path: "landmarksSide/menton",
        howToFind: "Lowest point of the chin."
    },
    cervicalPoint: {
        description: "Junction of jaw and neck.",
        name: "Cervical Point",
        scientificName: "Cervical Point",
        path: "landmarksSide/cervicalPoint",
        howToFind: "Inner angle between jaw and neck."
    },
    gonionTop: {
        description: "Upper point of the jaw angle.",
        name: "Upper Gonion",
        scientificName: "Gonion Superius",
        path: "landmarksSide/gonionTop",
        howToFind: "Upper part of the jaw angle."
    },
    gonionBottom: {
        description: "Lower point of the jaw angle.",
        name: "Lower Gonion",
        scientificName: "Gonion Inferius",
        path: "landmarksSide/gonionBottom",
        howToFind: "Lower part of the jaw angle."
    }
};

export const DEFAULT_FRONT_RELATIVE_POSITIONS: Record<keyof FrontLandmarks, Point> = {
    hairline: { x: 0.5, y: 0.05 },
    leftEyePupil: { x: 0.35, y: 0.4 },
    rightEyePupil: { x: 0.65, y: 0.4 },
    noseLeft: { x: 0.42, y: 0.55 },
    noseRight: { x: 0.58, y: 0.55 },
    lowerLip: { x: 0.5, y: 0.72 },
    chinBottom: { x: 0.5, y: 0.9 },
    leftEyeMedialCanthus: { x: 0.42, y: 0.4 },
    leftEyeLateralCanthus: { x: 0.28, y: 0.4 },
    leftEyeUpperEyelid: { x: 0.35, y: 0.38 },
    leftEyeLowerEyelid: { x: 0.35, y: 0.42 },
    leftEyelidHoodEnd: { x: 0.25, y: 0.35 },
    leftBrowHead: { x: 0.42, y: 0.32 },
    leftBrowInnerCorner: { x: 0.42, y: 0.34 },
    leftBrowArch: { x: 0.35, y: 0.3 },
    leftBrowPeak: { x: 0.3, y: 0.28 },
    leftBrowTail: { x: 0.2, y: 0.32 },
    leftUpperEyelidCrease: { x: 0.35, y: 0.36 },
    rightEyeMedialCanthus: { x: 0.58, y: 0.4 },
    rightEyeLateralCanthus: { x: 0.72, y: 0.4 },
    rightEyeUpperEyelid: { x: 0.65, y: 0.38 },
    rightEyeLowerEyelid: { x: 0.65, y: 0.42 },
    rightEyelidHoodEnd: { x: 0.75, y: 0.35 },
    rightBrowHead: { x: 0.58, y: 0.32 },
    rightBrowInnerCorner: { x: 0.58, y: 0.34 },
    rightBrowArch: { x: 0.65, y: 0.3 },
    rightBrowPeak: { x: 0.7, y: 0.28 },
    rightBrowTail: { x: 0.8, y: 0.32 },
    rightUpperEyelidCrease: { x: 0.65, y: 0.36 },
    nasalBase: { x: 0.5, y: 0.58 },
    noseBottom: { x: 0.5, y: 0.6 },
    leftNoseBridge: { x: 0.45, y: 0.45 },
    rightNoseBridge: { x: 0.55, y: 0.45 },
    cupidsBow: { x: 0.5, y: 0.65 },
    innerCupidsBow: { x: 0.5, y: 0.66 },
    mouthMiddle: { x: 0.5, y: 0.68 },
    mouthLeft: { x: 0.38, y: 0.68 },
    mouthRight: { x: 0.62, y: 0.68 },
    chinLeft: { x: 0.35, y: 0.85 },
    chinRight: { x: 0.65, y: 0.85 },
    leftCheek: { x: 0.2, y: 0.55 },
    rightCheek: { x: 0.8, y: 0.55 },
    leftTemple: { x: 0.15, y: 0.3 },
    rightTemple: { x: 0.85, y: 0.3 },
    leftOuterEar: { x: 0.1, y: 0.45 },
    rightOuterEar: { x: 0.9, y: 0.45 },
    leftTopGonion: { x: 0.2, y: 0.65 },
    leftBottomGonion: { x: 0.25, y: 0.75 },
    rightTopGonion: { x: 0.8, y: 0.65 },
    rightBottomGonion: { x: 0.75, y: 0.75 },
    neckLeft: { x: 0.3, y: 0.95 },
    neckRight: { x: 0.7, y: 0.95 },
    nasion: { x: 0.5, y: 0.4 }
};

export const DEFAULT_SIDE_RELATIVE_POSITIONS: Record<keyof SideLandmarks, Point> = {
    vertex: { x: 0.5, y: 0.05 },
    occiput: { x: 0.1, y: 0.4 },
    pronasale: { x: 0.9, y: 0.5 },
    neckPoint: { x: 0.2, y: 0.85 },
    porion: { x: 0.4, y: 0.45 },
    orbitale: { x: 0.7, y: 0.45 },
    tragus: { x: 0.38, y: 0.48 },
    intertragicNotch: { x: 0.38, y: 0.5 },
    cornealApex: { x: 0.75, y: 0.4 },
    cheekbone: { x: 0.6, y: 0.5 },
    eyelidEnd: { x: 0.65, y: 0.4 },
    lowerEyelid: { x: 0.7, y: 0.42 },
    trichion: { x: 0.6, y: 0.15 },
    glabella: { x: 0.8, y: 0.35 },
    forehead: { x: 0.7, y: 0.25 },
    nasion: { x: 0.82, y: 0.4 },
    rhinion: { x: 0.86, y: 0.45 },
    supratip: { x: 0.88, y: 0.48 },
    infratip: { x: 0.88, y: 0.52 },
    columella: { x: 0.85, y: 0.54 },
    subnasale: { x: 0.82, y: 0.56 },
    subalare: { x: 0.78, y: 0.54 },
    labraleSuperius: { x: 0.84, y: 0.6 },
    cheilion: { x: 0.7, y: 0.62 },
    labraleInferius: { x: 0.82, y: 0.65 },
    sublabiale: { x: 0.8, y: 0.7 },
    pogonion: { x: 0.8, y: 0.78 },
    menton: { x: 0.75, y: 0.85 },
    cervicalPoint: { x: 0.4, y: 0.8 },
    gonionTop: { x: 0.3, y: 0.65 },
    gonionBottom: { x: 0.35, y: 0.75 }
};

import { FilesetResolver, FaceLandmarker, NormalizedLandmark } from "@mediapipe/tasks-vision";
import { Point } from "../types";
import { DEFAULT_FRONT_RELATIVE_POSITIONS, DEFAULT_SIDE_RELATIVE_POSITIONS } from "../constants";
import { distance, movePoint, midpoint } from "../utils/geometry";

let faceLandmarker: FaceLandmarker | null = null;

// Exact mapping from the reference module 320910
const MP_INDICES_FRONT: Record<string, number> = {
    hairline: 10,
    leftEyePupil: 468,
    rightEyePupil: 473,
    noseLeft: 48,
    noseRight: 278,
    lowerLip: 17,
    chinBottom: 152,
    leftEyeMedialCanthus: 133,
    leftEyeLateralCanthus: 33,
    leftEyeUpperEyelid: 470,
    leftEyeLowerEyelid: 472,
    leftEyelidHoodEnd: 247,
    leftBrowHead: 107,
    leftBrowInnerCorner: 55,
    leftBrowArch: 52,
    leftBrowPeak: 105,
    leftBrowTail: 70,
    leftUpperEyelidCrease: 470,
    rightEyeMedialCanthus: 362,
    rightEyeLateralCanthus: 263,
    rightEyeUpperEyelid: 475,
    rightEyeLowerEyelid: 374,
    rightEyelidHoodEnd: 467,
    rightBrowHead: 336,
    rightBrowInnerCorner: 285,
    rightBrowArch: 282,
    rightBrowPeak: 334,
    rightBrowTail: 276,
    rightUpperEyelidCrease: 475,
    nasalBase: 290,
    noseBottom: 2,
    leftNoseBridge: 174,
    rightNoseBridge: 399,
    cupidsBow: 267,
    innerCupidsBow: 0,
    mouthMiddle: 14,
    mouthLeft: 61,
    mouthRight: 306,
    chinLeft: 176,
    chinRight: 400,
    leftCheek: 234,
    rightCheek: 454,
    leftTemple: 54,
    rightTemple: 284,
    leftOuterEar: 127,
    rightOuterEar: 356,
    leftTopGonion: 58,
    leftBottomGonion: 172,
    rightTopGonion: 288,
    rightBottomGonion: 397,
    neckLeft: 172,
    neckRight: 397,
    nasion: 168
};

const MP_OFFSETS: Record<string, { x?: number, y?: number }> = {
    hairline: { y: -0.06 },
    leftEyePupil: { x: 0.0015, y: -0.005 },
    rightEyePupil: { x: -0.0015, y: -0.005 },
    noseLeft: { x: 0.0025 },
    noseRight: { x: -0.0025 },
    leftTemple: { y: -0.01 },
    rightTemple: { y: -0.01 },
    leftOuterEar: { x: -0.04 },
    rightOuterEar: { x: 0.04 },
    // Adjust neck points to be slightly narrower (inward) and lower than gonions
    // x: 0.01 is conservative inward shift to represent neck width vs jaw width
    neckLeft: { x: 0.01, y: 0.08 }, 
    neckRight: { x: -0.01, y: 0.08 },
    leftUpperEyelidCrease: { y: -0.015 },
    rightUpperEyelidCrease: { y: -0.015 }
};

// Base indices for Side Profile (before geometric derivation)
const MP_INDICES_SIDE_BASE: Record<string, number> = {
    pronasale: 1,
    trichion: 10,
    glabella: 9,
    rhinion: 6,
    supratip: 197,
    infratip: 2,
    columella: 2,
    subnasale: 2,
    subalare: 218,
    labraleSuperius: 0,
    cheilion: 61,
    labraleInferius: 17,
    sublabiale: 18,
    pogonion: 152,
    menton: 152,
    cheekbone: 123,
    eyelidEnd: 33,
    lowerEyelid: 145,
    tragus: 127,
    cornealApex: 468,
    forehead: 10,
    nasion: 168,
    gonionBottom: 172
};

export const initializeMediaPipe = async () => {
    if (faceLandmarker) return;

    try {
        const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
        );

        faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
                delegate: "CPU" // Use CPU to match XNNPACK log and ensure stability
            },
            outputFaceBlendshapes: true,
            outputFacialTransformationMatrixes: true,
            runningMode: "IMAGE",
            numFaces: 1
        });
    } catch (error) {
        console.error("Failed to initialize MediaPipe:", error);
        throw error;
    }
};

// Helper to extract a specific raw point from mesh
const getRaw = (mesh: NormalizedLandmark[], idx: number, w: number, h: number): Point => {
    if (!mesh[idx]) return { x: 0, y: 0 };
    return { x: mesh[idx].x * w, y: mesh[idx].y * h };
};

// Apply Geometric Derivations (Logic from Snippet)
const deriveSideLandmarks = (mesh: NormalizedLandmark[], w: number, h: number, existing: Record<string, Point>): Record<string, Point> => {
    const derived = { ...existing };
    const a = (idx: number) => getRaw(mesh, idx, w, h);

    // 1. Vertex: Start at 10. Perpendicular to 1->12 (Nose-Mouth axis). Dist: 10->8.
    try {
        const p10 = a(10);
        const p8 = a(8);
        const p1 = a(1);
        const p12 = a(12);
        const dist10_8 = distance(p10, p8);
        derived.vertex = movePoint(p10, {
            along: { from: p1, to: p12 }, // direction 1->12
            by: -dist10_8 // move UP (opposite to 1->12)
        });
    } catch(e) {};

    // 2. Occiput: Start 9. Along 83->9. Dist: 9->83.
    try {
        const p9 = a(9);
        const p83 = a(83);
        const dist = distance(p9, p83);
        derived.occiput = movePoint(p9, {
            along: { from: p83, to: p9 },
            by: dist
        });
    } catch(e) {};

    // 3. Porion
    try {
        const tragus = a(127);
        derived.porion = { x: tragus.x - 0.01 * w, y: tragus.y - 0.015 * h };
    } catch(e) {};

    // 4. Gonion Top
    try {
        const goBottom = a(172);
        const tragus = a(127);
        derived.gonionTop = {
             x: goBottom.x + (tragus.x - goBottom.x) * 0.6,
             y: goBottom.y + (tragus.y - goBottom.y) * 0.6
        };
    } catch(e) {};

    // 5. Neck Point
    try {
        const p4 = a(4);
        const p0 = a(0);
        const p67 = a(67);
        const d0_67 = distance(p0, p67);
        derived.neckPoint = movePoint(p4, {
            along: { from: p67, to: p0 },
            by: d0_67
        });
    } catch(e) {};

    // 6. Cervical Point
    try {
        if (derived.neckPoint) {
            const p4 = a(4);
            derived.cervicalPoint = movePoint(p4, {
                along: { from: p4, to: derived.neckPoint },
                by: 0.04 * h
            });
        }
    } catch(e) {};

    // 7. Rhinion
    try {
        const pro = a(1); // Pronasale
        const nas = a(168); // Nasion
        derived.rhinion = midpoint(pro, nas);
    } catch(e) {};

    return derived;
};

export const detectLandmarksInstant = async (
    base64Image: string,
    type: 'front' | 'side'
): Promise<{ landmarks: Record<string, Point>, box: { ymin: number, xmin: number, ymax: number, xmax: number } }> => {
    
    if (!faceLandmarker) {
        await initializeMediaPipe();
    }

    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = base64Image;
        img.onload = () => {
            // Safety check
            if (!faceLandmarker) {
                console.error("FaceLandmarker not initialized");
                resolve({ landmarks: {}, box: { xmin: 0, xmax: 1000, ymin: 0, ymax: 1000 } });
                return;
            }

            try {
                const results = faceLandmarker.detect(img);
                
                const w = img.naturalWidth;
                const h = img.naturalHeight;

                // Default Box
                let box = {
                    xmin: w * 0.2,
                    xmax: w * 0.8,
                    ymin: h * 0.2,
                    ymax: h * 0.8
                };

                const landmarks: Record<string, Point> = {};
                const defaults = type === 'front' ? DEFAULT_FRONT_RELATIVE_POSITIONS : DEFAULT_SIDE_RELATIVE_POSITIONS;
                const keys = Object.keys(defaults);
                const indices = type === 'front' ? MP_INDICES_FRONT : MP_INDICES_SIDE_BASE;

                if (results.faceLandmarks && results.faceLandmarks.length > 0) {
                    const mesh = results.faceLandmarks[0];

                    // Bounding Box Logic
                    let minX = 1, minY = 1, maxX = 0, maxY = 0;
                    mesh.forEach(pt => {
                        if (pt.x < minX) minX = pt.x;
                        if (pt.y < minY) minY = pt.y;
                        if (pt.x > maxX) maxX = pt.x;
                        if (pt.y > maxY) maxY = pt.y;
                    });
                    const padX = (maxX - minX) * 0.1;
                    const padY = (maxY - minY) * 0.1;
                    
                    box = {
                        xmin: Math.max(0, (minX - padX) * w),
                        xmax: Math.min(w, (maxX + padX) * w),
                        ymin: Math.max(0, (minY - padY) * h),
                        ymax: Math.min(h, (maxY + padY) * h)
                    };

                    // 1. Direct Mapping
                    keys.forEach(key => {
                        const idx = indices[key];
                        if (idx !== undefined && mesh[idx]) {
                            let lx = mesh[idx].x;
                            let ly = mesh[idx].y;

                            // Apply Offsets
                            if (type === 'front' && MP_OFFSETS[key]) {
                                const offset = MP_OFFSETS[key];
                                if (offset.x) lx += offset.x;
                                if (offset.y) ly += offset.y;
                            }

                            landmarks[key] = {
                                x: lx * 1000,
                                y: ly * 1000
                            };
                        }
                    });

                    // 2. Geometric Derivation (Side Profile Enhancements)
                    if (type === 'side') {
                        const pixelLandmarks: Record<string, Point> = {};
                        Object.entries(landmarks).forEach(([k, v]) => {
                             pixelLandmarks[k] = { x: (v.x / 1000) * w, y: (v.y / 1000) * h };
                        });
                        const refined = deriveSideLandmarks(mesh, w, h, pixelLandmarks);
                        Object.entries(refined).forEach(([k, v]) => {
                            landmarks[k] = {
                                x: (v.x / w) * 1000,
                                y: (v.y / h) * 1000
                            };
                        });
                    }

                    // 3. Fallback
                    keys.forEach(key => {
                        if (!landmarks[key]) {
                            const def = defaults[key];
                            const boxW_norm = (box.xmax - box.xmin) / w;
                            const boxH_norm = (box.ymax - box.ymin) / h;
                            const boxX_norm = box.xmin / w;
                            const boxY_norm = box.ymin / h;

                            landmarks[key] = {
                                x: (boxX_norm + (def.x * boxW_norm)) * 1000,
                                y: (boxY_norm + (def.y * boxH_norm)) * 1000
                            };
                        }
                    });
                    
                } else {
                    console.warn("No face detected by MediaPipe. Using defaults.");
                    const boxW = w * 0.6;
                    const boxH = h * 0.6;
                    const startX = w * 0.2;
                    const startY = h * 0.2;
                    box = { xmin: startX, xmax: startX + boxW, ymin: startY, ymax: startY + boxH };

                    keys.forEach(key => {
                        const def = defaults[key];
                        landmarks[key] = {
                            x: ((startX + (def.x * boxW)) / w) * 1000,
                            y: ((startY + (def.y * boxH)) / h) * 1000
                        };
                    });
                }

                const normalizedBox = {
                    xmin: (box.xmin / w) * 1000,
                    xmax: (box.xmax / w) * 1000,
                    ymin: (box.ymin / h) * 1000,
                    ymax: (box.ymax / h) * 1000
                };

                resolve({ landmarks, box: normalizedBox });
            } catch (e) {
                console.error("Detection error:", e);
                // Resolve with safe defaults so app doesn't hang
                resolve({ landmarks: {}, box: { xmin: 0, xmax: 1000, ymin: 0, ymax: 1000 } });
            }
        };
        img.onerror = () => {
            resolve({ landmarks: {}, box: { xmin: 0, xmax: 1000, ymin: 0, ymax: 1000 } });
        };
    });
};

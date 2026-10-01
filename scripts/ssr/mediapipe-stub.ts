// Stands in for the @mediapipe/* packages during the prerender (see scripts/prerender.mjs).
// They're browser-only bundles that can't be imported in Node, and the analyzers only use
// them once a photo is picked, never while rendering.
export class FaceMesh {}
export class Camera {}
export class FaceLandmarker {}
export const FilesetResolver = {};

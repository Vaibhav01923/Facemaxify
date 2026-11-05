import { FilesetResolver, FaceLandmarker } from "@mediapipe/tasks-vision";

let landmarker: FaceLandmarker | null = null;

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = src;
  });

/**
 * Returns the full 478-point MediaPipe face mesh (normalised 0-1) for the scan animation.
 * Uses its own landmarker instance with the same model as Facemaxify's mediaPipeService.
 */
export async function detectMesh(dataUrl: string): Promise<[number, number][]> {
  if (!landmarker) {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
    );
    landmarker = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
        delegate: "CPU",
      },
      runningMode: "IMAGE",
      numFaces: 1,
    });
  }
  const img = await loadImage(dataUrl);
  const result = landmarker.detect(img);
  const mesh = result.faceLandmarks?.[0];
  if (!mesh) return [];
  return mesh.map((p) => [Math.round(p.x * 10000) / 10000, Math.round(p.y * 10000) / 10000] as [number, number]);
}

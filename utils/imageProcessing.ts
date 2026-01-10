import { Point } from "../types";

/**
 * Standardizes a face image by rotating it to align eyes horizontally
 * and cropping/scaling it to a standard ratio.
 */
export const standardizeImage = (
  base64Image: string,
  landmarks: Record<string, Point>
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = base64Image;

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        // Target dimensions (High Res)
        const targetSize = 1024;
        canvas.width = targetSize;
        canvas.height = targetSize;

        // Fill white background
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, targetSize, targetSize);

        const w = img.naturalWidth;
        const h = img.naturalHeight;

        // Key Landmarks for Alignment
        // Using Lateral Canthus (Outer corners) for rotation stability
        const leftEye =
          landmarks["leftEyeLateralCanthus"] || landmarks["leftEyePupil"];
        const rightEye =
          landmarks["rightEyeLateralCanthus"] || landmarks["rightEyePupil"];
        const hairline = landmarks["hairline"];
        const chin = landmarks["chinBottom"];

        if (!leftEye || !rightEye) {
          // Fallback if eyes not detected: just fit image
          console.warn("Eyes not detected for standardization. Using raw fit.");
          const scale = Math.min(targetSize / w, targetSize / h);
          const tx = (targetSize - w * scale) / 2;
          const ty = (targetSize - h * scale) / 2;
          ctx.drawImage(img, tx, ty, w * scale, h * scale);
          resolve(canvas.toDataURL("image/jpeg", 0.95));
          return;
        }

        // 1. Calculate Rotation Angle (Theta)
        // Coordinates are 0-1000 relative to original image?
        // Based on mediaPipeService, they are passed as 0-1000 relative to image dimensions.
        const lx = (leftEye.x / 1000) * w;
        const ly = (leftEye.y / 1000) * h;
        const rx = (rightEye.x / 1000) * w;
        const ry = (rightEye.y / 1000) * h;

        const dX = rx - lx;
        const dY = ry - ly;
        const angle = Math.atan2(dY, dX); // Radians to rotate BACK to horizontal

        // 2. Calculate Face Height for Scaling
        // We need the height from Hairline to Chin.
        // If hairline is missing (e.g. cropped out), estimate based on eyes-to-chin.
        let faceHeightPixels = 0;

        // Midpoint of eyes
        const cx = (lx + rx) / 2;
        const cy = (ly + ry) / 2;

        if (hairline && chin) {
          const hx = (hairline.x / 1000) * w;
          const hy = (hairline.y / 1000) * h;
          const chx = (chin.x / 1000) * w;
          const chy = (chin.y / 1000) * h;
          faceHeightPixels = Math.sqrt(
            Math.pow(chx - hx, 2) + Math.pow(chy - hy, 2)
          );
        } else if (chin) {
          // Estimate: Eye to Chin is roughly 60% of face height?
          // Let's rely on eye-to-chin distance * 1.6
          const chx = (chin.x / 1000) * w;
          const chy = (chin.y / 1000) * h;
          const eyeToChin = Math.sqrt(
            Math.pow(chx - cx, 2) + Math.pow(chy - cy, 2)
          );
          faceHeightPixels = eyeToChin * 1.8;
        } else {
          // Fallback
          faceHeightPixels = h * 0.5;
        }

        // 3. Determine Scale
        // We want the face height to fill about 65% of the 1024px canvas
        // This leaves room for the head top and neck.
        const desiredFaceHeight = targetSize * 0.65;
        const scale = desiredFaceHeight / faceHeightPixels;

        // 4. Draw with Transforms
        // We want the Center of Eyes to be at (50%, 45%) of the new canvas
        const targetCx = targetSize * 0.5;
        const targetCy = targetSize * 0.45;

        ctx.save();
        // Move to target center
        ctx.translate(targetCx, targetCy);
        // Rotate flat
        ctx.rotate(-angle);
        // Scale
        ctx.scale(scale, scale);
        // Move back from source center (midpoint of eyes)
        ctx.translate(-cx, -cy);

        ctx.drawImage(img, 0, 0);
        ctx.restore();

        resolve(canvas.toDataURL("image/jpeg", 0.95));
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () =>
      reject(new Error("Failed to load image for standardization"));
  });
};

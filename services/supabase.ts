import { createClient } from "@supabase/supabase-js";
import { FinalResult } from "../types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase credentials missing. Data will not be saved.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export const uploadImage = async (
  base64Image: string,
  path: string
): Promise<string | null> => {
  try {
    const base64Data = base64Image.split(",")[1];
    const buffer = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

    const { error } = await supabase.storage
      .from("scans")
      .upload(path, buffer, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (error) {
      console.error("Upload Error:", error);
      return null;
    }

    const { data } = supabase.storage.from("scans").getPublicUrl(path);

    return data.publicUrl;
  } catch (err) {
    console.error("Upload Exception:", err);
    return null;
  }
};

export const saveScanResult = async (
  data: FinalResult,
  overallScore: number
) => {
  try {
    // 1. Upload Front Photo
    const frontPath = `front_${Date.now()}.jpg`;
    const frontUrl = await uploadImage(data.frontPhotoUrl, frontPath);

    if (!frontUrl) throw new Error("Failed to upload front photo");

    // 2. Upload Side Photo (if exists)
    let sideUrl = null;
    if (data.sidePhotoUrl) {
      const sidePath = `side_${Date.now()}.jpg`;
      sideUrl = await uploadImage(data.sidePhotoUrl, sidePath);
    }

    // 3. Save to DB
    const { error } = await supabase.from("scans").insert({
      gender: data.gender,
      race: data.race,
      front_photo_path: frontPath, // Storing path for reference, or could store full URL
      side_photo_path: sideUrl ? `side_${Date.now()}.jpg` : null, // Fix: Use path, not URL to match schema expectation if we want consistency, but plan said path. Let's store URL for easier access or path. Plan said "path in storage".
      // Actually, let's store the full public URL so we don't have to construct it later?
      // Plan said: "front_photo_path (Text, path in storage)"
      // Let's stick to storing the path as designed in the plan.
      front_landmarks: data.frontLandmarks,
      side_landmarks: data.sideLandmarks,
      overall_score: overallScore,
    });

    if (error) throw error;

    return true;
  } catch (error) {
    console.error("Save Error:", error);
    return false;
  }
};

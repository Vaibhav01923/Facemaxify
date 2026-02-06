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
  overallScore: number,
  userId: string
) => {
  try {
    // 1. Upload Front Photo
    const frontPath = `front_${userId}_${Date.now()}.jpg`;
    const frontUrl = await uploadImage(data.frontPhotoUrl, frontPath);

    if (!frontUrl) throw new Error("Failed to upload front photo");

    // 2. Upload Side Photo (if exists)
    let sidePath = null;
    if (data.sidePhotoUrl) {
      sidePath = `side_${userId}_${Date.now()}.jpg`;
      const sideUrl = await uploadImage(data.sidePhotoUrl, sidePath);
      if (!sideUrl) console.warn("Failed to upload side photo");
    }

    // 3. Save to DB
    const { error } = await supabase.from("scans").insert({
      user_id: userId,
      gender: data.gender,
      race: data.race,
      front_photo_path: frontPath,
      side_photo_path: sidePath,
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

export const getScanHistory = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from("scans")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    
    // Convert relative paths to public URLs
    const scansWithUrls = data.map((scan) => {
      const frontUrl = supabase.storage.from("scans").getPublicUrl(scan.front_photo_path).data.publicUrl;
      const sideUrl = scan.side_photo_path 
        ? supabase.storage.from("scans").getPublicUrl(scan.side_photo_path).data.publicUrl
        : null;
      
      return {
        ...scan,
        front_photo_url: frontUrl,
        side_photo_url: sideUrl,
      };
    });

    return scansWithUrls;
  } catch (error) {
    console.error("Fetch History Error:", error);
    return [];
  }
};


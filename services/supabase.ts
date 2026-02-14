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

    // 2. Upload Side Photo (Removed)

    // 3. Save to DB
    const { error } = await supabase.from("scans").insert({
      user_id: userId,
      gender: data.gender,
      race: data.race,
      front_photo_path: frontPath,
      front_landmarks: data.frontLandmarks,
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
      return {
        ...scan,
        front_photo_url: frontUrl,
      };
    });

    return scansWithUrls;
  } catch (error) {
    console.error("Fetch History Error:", error);
    return [];
  }
};

export const deleteScan = async (scanId: string, userId: string): Promise<boolean> => {
  try {
    // 1. Get the scan to find the image path first
    const { data: scan, error: fetchError } = await supabase
      .from("scans")
      .select("front_photo_path")
      .eq("id", scanId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !scan) {
      console.error("Scan not found for deletion");
      return false;
    }

    // 2. Delete the image from storage
    if (scan.front_photo_path) {
      const { error: storageError } = await supabase.storage
        .from("scans")
        .remove([scan.front_photo_path]);
      
      if (storageError) console.warn("Failed to delete associated image:", storageError);
    }

    // 3. Delete the record from DB
    const { error: deleteError } = await supabase
      .from("scans")
      .delete()
      .eq("id", scanId)
      .eq("user_id", userId);

    if (deleteError) throw deleteError;

    return true;
  } catch (error) {
    console.error("Delete Scan Error:", error);
    return false;
  }
};

export const updateScanLandmarks = async (
  scanId: string,
  userId: string,
  frontLandmarks: any,
  newScore: number
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("scans")
      .update({
        front_landmarks: frontLandmarks,
        overall_score: newScore,
      })
      .eq("id", scanId)
      .eq("user_id", userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Update Landmarks Error:", error);
    return false;
  }
};



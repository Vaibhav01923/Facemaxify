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
  path: string,
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
  userId: string,
) => {
  try {
    // 1. Upload Front Photo
    const frontPath = `front_${userId}_${Date.now()}.jpg`;
    const frontUrl = await uploadImage(data.frontPhotoUrl, frontPath);

    if (!frontUrl) throw new Error("Failed to upload front photo");

    // 2. Upload Side Photo (Removed)

    // 3. Save to DB
    const { data: insertedScan, error } = await supabase
      .from("scans")
      .insert({
        user_id: userId,
        gender: data.gender,
        race: data.race,
        front_photo_path: frontPath,
        front_landmarks: data.frontLandmarks,
        overall_score: overallScore,
      })
      .select()
      .single();

    if (error) throw error;

    return insertedScan;
  } catch (error) {
    console.error("Save Error:", error);
    return null;
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
      const frontUrl = supabase.storage
        .from("scans")
        .getPublicUrl(scan.front_photo_path).data.publicUrl;
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

export const deleteScan = async (
  scanId: string,
  userId: string,
): Promise<boolean> => {
  try {
    // 1. Get the scan details
    const { data: scan, error: fetchError } = await supabase
      .from("scans")
      .select("*") // Select all fields to copy
      .eq("id", scanId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !scan) {
      console.error("Scan not found for deletion");
      return false;
    }

    // 2. Archive to deleted_scans table
    const { error: archiveError } = await supabase
      .from("deleted_scans")
      .insert({
        ...scan,
        deleted_at: new Date().toISOString(),
      });

    if (archiveError) {
      console.error("Failed to archive scan:", archiveError);
      // Decide if we should abort or continue. Safest is to abort to prevent data loss.
      return false;
    }

    // 3. Delete the record from active DB (But Keep Image in Storage)
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

export const updateScanAnalysis = async (
  scanId: string,
  userId: string,
  analysis: any,
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("scans")
      .update({
        analysis: analysis,
      })
      .eq("id", scanId)
      .eq("user_id", userId);

    if (error) {
      console.error("Supabase Update Error:", error);
      throw error;
    }
    return true;
  } catch (error) {
    console.error("Update Analysis Exception:", error);
    return false;
  }
};

export const updateScanLandmarks = async (
  scanId: string,
  userId: string,
  landmarks: any,
  overallScore: number,
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("scans")
      .update({
        front_landmarks: landmarks,
        overall_score: overallScore,
      })
      .eq("id", scanId)
      .eq("user_id", userId);

    if (error) {
      console.error("Update Landmarks Error:", error);
      throw error;
    }
    console.log("Landmarks updated successfully for scan:", scanId);
    return true;
  } catch (error) {
    console.error("Update Landmarks Exception:", error);
    return false;
  }
};

/**
 * Calculate website percentile - user's rank compared to all users
 * Returns percentile (0-100) where higher is better
 */
export const calculateWebsitePercentile = async (
  userScore: number,
): Promise<number | null> => {
  try {
    // Get all scores from the database
    const { data, error } = await supabase
      .from("scans")
      .select("overall_score")
      .not("overall_score", "is", null);

    if (error) {
      console.error("Error fetching scores:", error);
      return null;
    }

    if (!data || data.length === 0) {
      return null; // Not enough data
    }

    // Convert scores to numbers and filter out invalid values
    const scores = data
      .map((scan) => parseFloat(scan.overall_score))
      .filter((score) => !isNaN(score));

    if (scores.length === 0) {
      return null;
    }

    // Count how many scores are below the user's score
    const scoresBelow = scores.filter((score) => score < userScore).length;

    // Calculate percentile
    const percentile = (scoresBelow / scores.length) * 100;

    return Math.round(percentile * 10) / 10; // Round to 1 decimal place
  } catch (error) {
    console.error("Calculate Website Percentile Exception:", error);
    return null;
  }
};

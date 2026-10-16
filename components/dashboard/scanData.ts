import { useCallback, useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { getScanHistory, supabase } from "../../services/supabase";
import {
  calculateFrontRatios,
  calculateWeightedTotalScore,
  type MetricResult,
} from "../../services/ratioCalculator";
import { calculatePercentile, getPercentileText } from "../../utils/percentile";
import type { FrontLandmarks, Point } from "../../types";

/** A row from the `scans` table, plus the public photo URL added by getScanHistory(). */
export interface Scan {
  id: string;
  created_at: string;
  front_photo_url: string;
  front_landmarks: Record<string, Point> | null;
  overall_score: number | string | null;
  skincare_analysis?: any;
  analysis?: any;
  color_analysis_path?: string | null;
  hairstyle_analysis_path?: string | null;
}

export type SectionKey = "facial" | "skincare" | "color" | "hairstyle";

/** The three ratios free accounts are allowed to see (mirrors ALLOWED_FREE_METRICS in Dashboard.tsx). */
export const FREE_METRIC_NAMES = [
  "Jaw Frontal Angle",
  "Middle Third",
  "Mouth width to nose width ratio",
];

const publicUrl = (path?: string | null) =>
  path ? supabase.storage.from("scans").getPublicUrl(path).data.publicUrl : null;

export const colorImageUrl = (s: Scan) => publicUrl(s.color_analysis_path);
export const hairstyleImageUrl = (s: Scan) => publicUrl(s.hairstyle_analysis_path);

export const skincareOf = (s: Scan) => s.skincare_analysis || s.analysis?.skincare || null;

/** Which reports already exist for a scan. Facial is ready as soon as the scan exists. */
export const reportsReady = (s: Scan): Record<SectionKey, boolean> => ({
  facial: true,
  skincare: Boolean(skincareOf(s)),
  color: Boolean(s.color_analysis_path),
  hairstyle: Boolean(s.hairstyle_analysis_path),
});

/** Overall harmony on the 0-100 scale the rest of the app shows. */
export const score100 = (s: Scan): number | null => {
  const stored = typeof s.overall_score === "string" ? parseFloat(s.overall_score) : s.overall_score;
  if (stored != null && Number.isFinite(stored)) return Math.round(stored * 10);
  const metrics = metricsOf(s);
  return metrics.length ? Math.round(calculateWeightedTotalScore(metrics) * 10) : null;
};

export const percentileLabel = (score: number) => getPercentileText(calculatePercentile(score));

/** Ratios for a scan, re-derived from its saved landmarks. Empty when the landmarks are unusable. */
export const metricsOf = (s: Scan): MetricResult[] => {
  if (!s.front_landmarks) return [];
  try {
    return calculateFrontRatios(s.front_landmarks as unknown as FrontLandmarks).filter((m) => m.name);
  } catch {
    return [];
  }
};

export function useScans() {
  const { user, isLoaded } = useUser();
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user?.id) return;
    const data = await getScanHistory(user.id);
    setScans((data ?? []) as Scan[]);
  }, [user?.id]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user?.id) {
      setLoading(false);
      return;
    }
    let alive = true;
    getScanHistory(user.id)
      .then((data) => alive && setScans((data ?? []) as Scan[]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [isLoaded, user?.id]);

  const latest = scans[0] ?? null;
  const previous = scans[1] ?? null;
  return useMemo(() => ({ scans, latest, previous, loading, refresh }), [scans, latest, previous, loading, refresh]);
}

export const greeting = (now = new Date()) => {
  const h = now.getHours();
  return h < 5 ? "Still up" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
};

export const timeAgo = (iso: string, now = Date.now()) => {
  const mins = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

export const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });

/** Colour ramp for a 0-10 ratio score (same breakpoints as the results screens). */
export const ratioTone = (score: number) =>
  score >= 9 ? "#6ee7b7" : score >= 7 ? "#bef264" : score >= 5 ? "#fcd34d" : score >= 3 ? "#fdba74" : "#fca5a5";

import React, { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { FinalResult } from "../types";
import {
  calculateFrontRatios,
  calculateWeightedTotalScore,
  MetricResult,
} from "../services/ratioCalculator";
import { Button } from "./Button";
import { RatioRow } from "./RatioRow";
import { FaceOverlay } from "./FaceOverlay";
import { LandmarkEditor } from "./LandmarkEditor";
import { useRegionalDiscount } from "../hooks/useRegionalDiscount";
import {
  Ticket,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Lock,
} from "lucide-react";
import {
  updateScanLandmarks,
  updateScanAnalysis,
  calculateWebsitePercentile,
  getScanHistory,
} from "../services/supabase";
import {
  getAiRecommendations,
  generateSkincareRoutine,
} from "../services/aiService";
import { calculatePercentile, getPercentileText } from "../utils/percentile";

interface DashboardProps {
  data?: FinalResult;
  isPaid?: boolean;
  scanId?: string;
  onNewScan?: () => void;
  scans?: any[]; // Full history for timeline
  onUploadSkincare?: (file: File) => void;
}

import { SkincareTimeline } from "./SkincareTimeline";

export const Dashboard: React.FC<DashboardProps> = ({
  data,
  isPaid = false,
  scanId,
  onNewScan,
  scans = [],
  onUploadSkincare,
}) => {
  const { user } = useUser();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab =
    (searchParams.get("tab") as "overview" | "front" | "side" | "skincare") ||
    "front";
  const [activeTab, setActiveTabState] = useState<
    "overview" | "front" | "side" | "skincare"
  >(initialTab);

  const setActiveTab = (tab: "overview" | "front" | "side" | "skincare") => {
    setActiveTabState(tab);
    setSearchParams(
      (prev) => {
        prev.set("tab", tab);
        return prev;
      },
      { replace: true },
    );
  };

  // Sync activeTab with URL params
  useEffect(() => {
    const tab = searchParams.get("tab") as
      | "overview"
      | "front"
      | "side"
      | "skincare";
    if (tab && tab !== activeTab) {
      setActiveTabState(tab);
    }
  }, [searchParams, activeTab]);
  // Removed duplicate analysis/loading state here; it's defined later with proper logic
  const [hoveredMetric, setHoveredMetric] = useState<MetricResult | null>(null);
  const [pinnedMetric, setPinnedMetric] = useState<MetricResult | null>(null);
  const [localLandmarks, setLocalLandmarks] = useState<any>(null);
  const [editorState, setEditorState] = useState<{
    isOpen: boolean;
    landmarkKey: string | null;
  }>({ isOpen: false, landmarkKey: null });
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [websitePercentile, setWebsitePercentile] = useState<number | null>(
    null,
  );

  // Fetch website percentile
  useEffect(() => {
    const fetchPercentile = async () => {
      if (localLandmarks) {
        const metrics = calculateFrontRatios(localLandmarks);
        const score =
          metrics.length > 0 ? calculateWeightedTotalScore(metrics) : 0;

        const percentile = await calculateWebsitePercentile(score);
        setWebsitePercentile(percentile);
      }
    };
    fetchPercentile();
  }, [localLandmarks]);

  const discount = useRegionalDiscount();

  useEffect(() => {
    if (data?.frontLandmarks) {
      setLocalLandmarks(data.frontLandmarks);
    }
  }, [data?.frontLandmarks]);

  const handleLandmarkUpdate = (
    key: string,
    newPoint: { x: number; y: number },
  ) => {
    setLocalLandmarks((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        [key]: newPoint,
      };
    });
  };

  const handleMetricClick = (metric: MetricResult) => {
    // Toggle: if clicking the same metric, unpin it. Otherwise, pin the new one.
    setPinnedMetric((prev) => (prev?.name === metric.name ? null : metric));
  };

  const handlePointClick = (landmarkKey: string) => {
    setEditorState({ isOpen: true, landmarkKey });
  };

  const handleEditorComplete = async (updatedLandmarks: any) => {
    if (!editorState.landmarkKey) return;

    // Merge the updated landmark back into the full landmark set
    const newLandmarks = {
      ...localLandmarks,
      [editorState.landmarkKey!]: updatedLandmarks[editorState.landmarkKey!],
    };

    setLocalLandmarks(newLandmarks);
    setEditorState({ isOpen: false, landmarkKey: null });

    // Persist to database if viewing saved scan
    if (scanId && user?.id) {
      const metrics = calculateFrontRatios(newLandmarks);
      const score =
        metrics.length > 0 ? calculateWeightedTotalScore(metrics) : 0;

      await updateScanLandmarks(scanId, user.id, newLandmarks, score);
    }
  };

  // Early return if no data provided
  if (!data) {
    return (
      <div className="min-h-screen bg-[#050510] text-white flex flex-col items-center justify-center p-8">
        <div className="max-w-md text-center space-y-6">
          <div className="w-20 h-20 bg-slate-900 border border-white/5 rounded-full flex items-center justify-center text-4xl mx-auto">
            📊
          </div>
          <h2 className="text-2xl font-bold">No Analysis Data</h2>
          <p className="text-slate-400">
            Upload and analyze a photo to view your facial analysis dashboard.
          </p>
          <button className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium transition-colors">
            Start New Analysis
          </button>
        </div>
      </div>
    );
  }

  const frontMetrics = useMemo(() => {
    if (!localLandmarks) return [];
    const metrics = calculateFrontRatios(localLandmarks);
    return metrics.sort((a, b) => a.score - b.score);
  }, [localLandmarks]);

  // ---------------------------------------------------------------------------
  // AI ANALYSIS LOGIC (JSON + Persistence)
  // ---------------------------------------------------------------------------
  const [analysis, setAnalysis] = useState<any>(null); // Now expecting JSON object
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  // Reset analysis state when switching to a different scan
  useEffect(() => {
    // Always reset local state when scanId changes or data changes
    if (data?.analysis) {
      console.log("Using cached analysis from DB");
      setAnalysis(data.analysis);
      setSkincareAnalysis(data.analysis.skincare || null);
      setLoadingAnalysis(false);
    } else {
      // Clear previous analysis when switching to a scan without one
      setAnalysis(null);
      setSkincareAnalysis(null);
    }
    // Also reset any other scan-specific state if needed
    setPinnedMetric(null);
  }, [data, scanId]); // Re-run when data or scanId changes

  useEffect(() => {
    const loadAnalysis = async () => {
      // Skip if we already have analysis set (from the effect above)
      if (analysis) return;

      // Skip if data already has analysis (handled by effect above)
      if (data?.analysis) return;

      // 2. If not, and we have metrics, generate it
      // Only run if we haven't analyzing, don't have analysis, and not loading
      if (
        data &&
        !data.analysis &&
        !analysis &&
        !loadingAnalysis &&
        frontMetrics.length > 0
      ) {
        setLoadingAnalysis(true);
        console.log("Generating new AI Analysis...");

        try {
          // Fetch from API
          const result = await getAiRecommendations(
            frontMetrics,
            data.frontPhotoUrl,
          );

          if (result) {
            setAnalysis(result);
            // 3. Save to DB immediately if we have scanId
            if (scanId && user?.id) {
              await updateScanAnalysis(scanId, user.id, result);
              console.log("Analysis saved to DB for scan:", scanId);
            } else {
              console.warn("Cannot save analysis: Missing scanId or userId", {
                scanId,
                userId: user?.id,
              });
            }
          }
        } catch (error) {
          console.error("Failed to generate AI analysis:", error);
        } finally {
          setLoadingAnalysis(false);
        }
      }
    };

    loadAnalysis();
  }, [data, frontMetrics, analysis, loadingAnalysis, scanId, user?.id]);

  // ---------------------------------------------------------------------------
  // SKINCARE ANALYSIS LOGIC
  // ---------------------------------------------------------------------------
  const [skincareAnalysis, setSkincareAnalysis] = useState<any>(null);
  const [loadingSkincare, setLoadingSkincare] = useState(false);

  useEffect(() => {
    const loadSkincare = async () => {
      // Check if skincare analysis already exists in the main analysis object or data prop
      const currentAnalysis = analysis || data?.analysis;

      if (currentAnalysis?.skincare) {
        console.log("Using cached skincare analysis");
        setSkincareAnalysis(currentAnalysis.skincare);
        // Ensure local state is synced if it wasn't already
        if (!analysis && data?.analysis) {
          setAnalysis(data.analysis);
        }
        return;
      }

      // Only run if tab is active and not loaded
      if (
        activeTab !== "skincare" ||
        skincareAnalysis ||
        loadingSkincare ||
        !data ||
        !user
      )
        return;

      setLoadingSkincare(true);
      console.log("Generating Skincare Analysis...");

      try {
        // 1. Get History for comparison (Use full history if available, else fetch)
        let history = scans;
        if (!history || history.length === 0) {
          history = await getScanHistory(user.id);
        }

        // Find previous scan (excluding current)
        const currentScanIndex = history.findIndex(
          (scan: any) => scan.id === scanId,
        );

        // SMART COMPARISON LOGIC:
        // If the immediate previous scan is very recent (< 3 days), try to find one from ~1 week ago
        // to show more meaningful progress.
        let comparisonScan = null;
        let daysSinceLastScan = null;

        if (currentScanIndex !== -1 && currentScanIndex < history.length - 1) {
          const immediatePrev = history[currentScanIndex + 1];
          const currentTime = new Date().getTime();
          const prevTime = new Date(immediatePrev.created_at).getTime();
          const daysDiff = Math.floor(
            (currentTime - prevTime) / (1000 * 60 * 60 * 24),
          );

          if (daysDiff < 4 && history.length > 2) {
            // Too soon/frequent! Look for a scan closer to 7 days ago
            const oneWeekAgo = currentTime - 7 * 24 * 60 * 60 * 1000;
            // Find scan with creation time closest to oneWeekAgo
            comparisonScan = history
              .slice(currentScanIndex + 1)
              .reduce((prev: any, curr: any) => {
                const prevDiff = Math.abs(
                  new Date(prev.created_at).getTime() - oneWeekAgo,
                );
                const currDiff = Math.abs(
                  new Date(curr.created_at).getTime() - oneWeekAgo,
                );
                return currDiff < prevDiff ? curr : prev;
              });
          } else {
            comparisonScan = immediatePrev;
          }

          if (comparisonScan) {
            daysSinceLastScan = Math.floor(
              (currentTime - new Date(comparisonScan.created_at).getTime()) /
                (1000 * 60 * 60 * 24),
            );
          }
        }

        // 2. Generate Routine
        const result = await generateSkincareRoutine(
          data.frontPhotoUrl,
          comparisonScan?.front_photo_url || null,
          daysSinceLastScan,
        );

        if (result) {
          setSkincareAnalysis(result);

          // Save to DB by merging with existing analysis (prefer data.analysis if local state is null)
          if (scanId && user?.id) {
            const baseAnalysis = analysis || data?.analysis || {};
            const updatedAnalysis = { ...baseAnalysis, skincare: result };
            setAnalysis(updatedAnalysis); // Update local state immediately
            await updateScanAnalysis(scanId, user.id, updatedAnalysis);
            console.log("Skincare analysis saved to DB");
          }
        }
      } catch (error) {
        console.error("Failed to load skincare:", error);
      } finally {
        setLoadingSkincare(false);
      }
    };

    loadSkincare();
  }, [activeTab, skincareAnalysis, loadingSkincare, data, user, scanId]);

  const overallScore = useMemo(() => {
    if (frontMetrics.length === 0) return 0;
    return calculateWeightedTotalScore(frontMetrics);
  }, [frontMetrics]);

  const ALLOWED_FREE_METRICS = [
    "Jaw Frontal Angle",
    "Middle Third",
    "Mouth width to nose width ratio",
  ];

  return (
    <div className="min-h-screen bg-[#050510] text-slate-100 font-sans selection:bg-indigo-500/30">
      {/* Premium Unlock Banner for Free Users */}
      {!isPaid && (
        <div className="bg-indigo-600 px-4 py-2 text-center relative z-50 overflow-hidden shadow-lg shadow-indigo-500/20">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-700 animate-gradient-x opacity-50"></div>
          <p className="relative z-10 text-[11px] sm:text-xs font-black text-white uppercase tracking-widest flex items-center justify-center gap-3">
            <span className="opacity-70">
              ✨ Unlock 25+ Premium Facial Ratios & Guides
            </span>
            <button
              onClick={() =>
                (window.location.href = `/api/checkout?customerEmail=${user?.primaryEmailAddress?.emailAddress}&discountCode=EARLY40`)
              }
              className="bg-white text-indigo-600 px-3 py-1 rounded-full hover:scale-105 transition-transform"
            >
              Purchase Now
            </button>
          </p>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#050510]/80 border-b border-white/5 shadow-2xl shadow-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/favicon.png"
              alt="Facemaxify Logo"
              className="w-8 h-8 rounded-lg shadow-lg shadow-blue-500/20"
            />
            <h1 className="text-lg font-bold tracking-tight text-white">
              Facemaxify
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div
              className={`text-right transition-opacity duration-300 ${isPaid ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            >
              <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                Facial Harmony
              </div>
              <div className="text-xl font-bold text-white leading-none">
                {Math.round(
                  typeof overallScore === "string"
                    ? parseFloat(overallScore)
                    : overallScore * 10,
                )}{" "}
                <span className="text-sm text-slate-500">/ 100</span>
              </div>
              <div className="text-[10px] text-indigo-400 font-semibold mt-0.5">
                {getPercentileText(
                  calculatePercentile(
                    typeof overallScore === "string"
                      ? parseFloat(overallScore)
                      : overallScore * 10,
                  ),
                )}
                {websitePercentile !== null && (
                  <span className="text-slate-500 ml-1">
                    • {websitePercentile.toFixed(1)}% on site
                  </span>
                )}
              </div>
            </div>
            {onNewScan && (
              <button
                onClick={onNewScan}
                className="ml-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors shadow-lg shadow-indigo-500/20 flex items-center gap-2"
              >
                <span>➕</span>{" "}
                <span className="hidden sm:inline">New Scan</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8 border-b border-transparent">
            {["overview", "front", "side", "skincare"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`pb-3 text-sm font-medium transition-all relative ${
                  activeTab === tab
                    ? "text-indigo-400"
                    : "text-slate-500 hover:text-slate-200"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)} Analysis
                {activeTab === tab && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Regional Discount Banner */}
        {discount.isEligible && !isPaid && (
          <div className="mb-8 rounded-2xl bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30 p-6 flex items-center justify-between gap-4 animate-fadeIn">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center text-orange-400">
                <Ticket className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">
                  🇮🇳 India Exclusive Offer
                </h3>
                <p className="text-orange-200 text-sm">
                  We've detected you are from India. A{" "}
                  <span className="font-bold text-white">50% PPP Discount</span>{" "}
                  has been auto-applied!
                </p>
              </div>
            </div>
            <div className="hidden sm:block text-right">
              <span className="block text-xs text-orange-300 uppercase font-bold tracking-wider mb-1">
                Your Code
              </span>
              <code className="bg-black/30 px-3 py-1.5 rounded-lg text-orange-400 font-mono font-bold border border-orange-500/30">
                {discount.code}
              </code>
            </div>
          </div>
        )}

        {/* OVERVIEW TAB (AI ANALYSIS) */}
        {activeTab === "overview" && (
          <div className="space-y-8 animate-fadeIn">
            {/* HEADER */}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <span className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-500/20">
                  <Sparkles className="w-5 h-5" />
                </span>
                AI Harmony Analysis
              </h2>
              {!isPaid && (
                <span className="bg-slate-800 text-slate-400 text-xs px-3 py-1 rounded-full font-medium border border-slate-700">
                  Preview Mode
                </span>
              )}
            </div>

            <div className="relative min-h-[400px]">
              {/* LOCK OVERLAY FOR FREE USERS */}
              {/* LOCK OVERLAY FOR FREE USERS */}
              {!isPaid && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-xl p-6 text-center rounded-3xl border border-white/10 overflow-hidden">
                  {/* Animated Background Glow */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-indigo-500/20 blur-[100px] rounded-full pointer-events-none animate-pulse-slow"></div>

                  <div className="relative z-10 flex flex-col items-center">
                    <div className="bg-gradient-to-b from-indigo-500/20 to-purple-500/20 p-5 rounded-full mb-6 ring-1 ring-white/20 shadow-[0_0_30px_-5px_rgba(99,102,241,0.3)] backdrop-blur-md">
                      <Lock className="w-10 h-10 text-indigo-300 drop-shadow-[0_0_10px_rgba(165,180,252,0.5)]" />
                    </div>

                    <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-white mb-3 tracking-tight drop-shadow-sm">
                      Unlock Your AI Coach
                    </h3>

                    <p className="text-indigo-200/80 max-w-sm mb-8 leading-relaxed font-medium text-lg">
                      Get your personalized{" "}
                      <span className="text-white font-bold">
                        Softmax & Hardmax
                      </span>{" "}
                      protocols tailored to your exact facial ratios.
                    </p>

                    <Button
                      onClick={() =>
                        (window.location.href = `${discount.link}&customerEmail=${user?.primaryEmailAddress?.emailAddress}`)
                      }
                      variant="primary"
                      className="shadow-[0_0_40px_-10px_rgba(99,102,241,0.5)] w-full max-w-xs py-6 text-xl font-bold rounded-2xl border-t border-white/20 hover:scale-105 transition-transform duration-300 ring-4 ring-indigo-500/10"
                    >
                      Unlock Now{" "}
                      <span className="ml-2 opacity-80 font-normal text-lg">
                        {discount.price}
                      </span>
                    </Button>

                    <p
                      className="text-xs text-slate-500 mt-8 font-medium hover:text-indigo-400 transition-colors cursor-pointer"
                      onClick={() => window.location.reload()}
                    >
                      Already purchased? Refresh to sync
                    </p>
                  </div>
                </div>
              )}

              {/* CONTENT AREA */}
              <div
                className={`space-y-6 ${!isPaid ? "filter blur-md opacity-40 pointer-events-none select-none" : ""}`}
              >
                {loadingAnalysis ? (
                  <div className="space-y-6">
                    <div className="h-32 bg-slate-800/50 rounded-2xl animate-pulse border border-white/5"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="h-48 bg-emerald-900/10 rounded-2xl animate-pulse border border-white/5"></div>
                      <div className="h-48 bg-rose-900/10 rounded-2xl animate-pulse border border-white/5"></div>
                    </div>
                    <div className="flex justify-center gap-3 text-indigo-400 text-sm font-mono animate-pulse mt-8">
                      <Sparkles className="w-4 h-4" />
                      Analyzing Your Facial Ratios and Metrics...
                    </div>
                  </div>
                ) : (
                  <>
                    {/* PARSE & RENDER: JSON STRUCTURE */}
                    {analysis ? (
                      <div className="space-y-6">
                        {/* 1. EXECUTIVE SUMMARY */}
                        <div className="bg-gradient-to-br from-slate-900 to-indigo-950/30 p-6 rounded-2xl border border-indigo-500/20 shadow-xl relative overflow-hidden group">
                          <div className="absolute top-0 right-0 p-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                          <h3 className="text-lg font-bold text-indigo-300 mb-3 flex items-center gap-2">
                            ⚡ Executive Summary
                          </h3>
                          <p className="text-indigo-100/80 leading-relaxed text-sm">
                            {typeof analysis === "string"
                              ? "Legacy analysis format. Please create a new scan for updated format."
                              : analysis.executive_summary ||
                                "Summary not available."}
                          </p>
                        </div>

                        {/* JSON RENDERING */}
                        {typeof analysis !== "string" && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* 2. SOFTMAX */}
                            <div className="bg-emerald-950/10 p-6 rounded-2xl border border-emerald-500/10 hover:border-emerald-500/20 transition-colors">
                              <h3 className="text-lg font-bold text-emerald-400 mb-4 flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5" />
                                Softmax Protocol
                              </h3>

                              <div className="space-y-4">
                                <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                                  <div className="text-xs text-emerald-300 font-bold uppercase mb-1">
                                    Body Fat & Leanness
                                  </div>
                                  <div className="text-sm text-slate-300 mb-1">
                                    {analysis.softmax?.body_fat?.assessment ||
                                      "Analysis unavailable"}
                                  </div>
                                  <div className="text-xs text-slate-400 italic">
                                    💡{" "}
                                    {analysis.softmax?.body_fat?.advice ||
                                      "No advice available"}
                                  </div>
                                </div>

                                <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                                  <div className="text-xs text-emerald-300 font-bold uppercase mb-1">
                                    Skin & Grooming
                                  </div>
                                  <div className="text-sm text-slate-300 mb-1">
                                    {analysis.softmax?.skin_grooming
                                      ?.assessment || "Analysis unavailable"}
                                  </div>
                                  <div className="text-xs text-slate-400 italic">
                                    💡{" "}
                                    {analysis.softmax?.skin_grooming?.advice ||
                                      "No advice available"}
                                  </div>
                                </div>

                                <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                                  <div className="text-xs text-emerald-300 font-bold uppercase mb-1">
                                    Styling
                                  </div>
                                  <div className="text-sm text-slate-300 mb-1">
                                    {analysis.softmax?.style?.assessment ||
                                      "Analysis unavailable"}
                                  </div>
                                  <div className="text-xs text-slate-400 italic">
                                    💡{" "}
                                    {analysis.softmax?.style?.advice ||
                                      "No advice available"}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* 3. HARDMAX */}
                            <div className="bg-rose-950/10 p-6 rounded-2xl border border-rose-500/10 hover:border-rose-500/20 transition-colors">
                              <h3 className="text-lg font-bold text-rose-400 mb-4 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5" />
                                Hardmax Protocol
                              </h3>

                              <div className="space-y-4">
                                <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                                  <div className="text-xs text-rose-300 font-bold uppercase mb-1">
                                    Bone Structure
                                  </div>
                                  <p className="text-sm text-slate-300">
                                    {analysis.hardmax?.bone_structure ||
                                      "Analysis unavailable"}
                                  </p>
                                </div>

                                <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                                  <div className="text-xs text-rose-300 font-bold uppercase mb-1">
                                    Harmony & Balance
                                  </div>
                                  <p className="text-sm text-slate-300">
                                    {analysis.hardmax?.balance ||
                                      "Analysis unavailable"}
                                  </p>
                                </div>

                                <div className="bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">
                                  <div className="text-xs text-rose-300 font-bold uppercase mb-1">
                                    Medical Recommendation
                                  </div>
                                  <p className="text-sm text-slate-200 font-medium">
                                    {analysis.hardmax?.recommendation ||
                                      "Consult a professional."}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      // Empty / Error State
                      <div className="text-slate-500 text-center py-10">
                        Unable to load analysis.
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* FRONT ANALYSIS TAB */}
        {activeTab === "front" && (
          <div className="space-y-6">
            {/* Leanness Bonus Message */}
            {(() => {
              const score = Math.round(
                typeof overallScore === "string"
                  ? parseFloat(overallScore)
                  : overallScore * 10,
              );
              const percentile = calculatePercentile(score);

              // Show bonus for users in 50-80 percentile range (Top 50% to Top 20%)
              if (percentile >= 50 && percentile <= 80) {
                const adjustedPercentileMin = Math.max(10, percentile - 20);
                const adjustedPercentileMax = Math.max(30, percentile - 10);

                return (
                  <div className="bg-gradient-to-r from-emerald-900/30 to-teal-900/30 border border-emerald-500/20 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">💪</div>
                      <div className="flex-1">
                        <h3 className="text-sm font-bold text-emerald-400 mb-1">
                          Leanness Bonus
                        </h3>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          If you're lean (
                          <span className="font-semibold text-emerald-300">
                            below 15% body fat
                          </span>
                          ), your actual attractiveness percentile could be{" "}
                          <span className="font-bold text-emerald-400">
                            Top {adjustedPercentileMax}% to Top{" "}
                            {adjustedPercentileMin}%
                          </span>{" "}
                          since facial definition significantly enhances
                          perceived attractiveness.
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
              <div className="lg:col-span-5 space-y-4">
                <div className="sticky top-24 bg-slate-900/50 rounded-2xl border border-white/5 p-2 shadow-2xl">
                  <div className="aspect-[3/4] relative rounded-xl overflow-hidden bg-black">
                    <FaceOverlay
                      photoUrl={data.frontPhotoUrl}
                      landmarks={localLandmarks || data.frontLandmarks}
                      highlightedLandmarks={
                        (pinnedMetric || hoveredMetric)?.relatedLandmarks
                      }
                      metricName={(pinnedMetric || hoveredMetric)?.name}
                      onPointClick={handlePointClick}
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-12 text-center">
                      <h3 className="text-white font-bold tracking-wider text-sm uppercase">
                        Analysis View
                      </h3>
                    </div>
                  </div>
                  <div className="mt-3 px-2 pb-2">
                    {pinnedMetric || hoveredMetric ? (
                      <div className="text-center animate-fadeIn">
                        <p className="text-indigo-400 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2">
                          {(pinnedMetric || hoveredMetric)!.name}
                          {pinnedMetric && (
                            <span className="text-[8px] bg-indigo-500/20 px-1.5 py-0.5 rounded-full">
                              PINNED
                            </span>
                          )}
                        </p>
                        {(pinnedMetric || hoveredMetric)!.name !==
                          "Jaw Frontal Angle" && (
                          <p className="text-slate-500 text-xs">
                            Score: {(pinnedMetric || hoveredMetric)!.score}/10
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-center text-slate-600 text-xs">
                        Click a trait to pin visualization
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 space-y-6">
                <div>
                  <h2 className="text-3xl font-black text-white mb-2 tracking-tight">
                    Facial Ratios
                  </h2>
                  <p className="text-slate-500 font-medium">
                    Detailed breakdown of {frontMetrics.length} metrics based on
                    your anatomy.
                  </p>
                </div>

                <div className="bg-slate-900/30 rounded-2xl border border-white/5 overflow-hidden shadow-xl">
                  <div className="divide-y divide-white/5">
                    {frontMetrics.map((metric, idx) => (
                      <RatioRow
                        key={idx}
                        metric={metric}
                        onHover={setHoveredMetric}
                        onClick={handleMetricClick}
                        isLocked={
                          !isPaid && !ALLOWED_FREE_METRICS.includes(metric.name)
                        }
                        discountCode={
                          discount.isEligible ? discount.code : undefined
                        }
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* SIDE PROFILE TAB (COMING SOON) */}
        {activeTab === "side" && (
          <div className="min-h-[400px] flex flex-col items-center justify-center text-center animate-fadeIn p-8 bg-slate-900/30 rounded-2xl border border-white/5 border-dashed">
            <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6">
              <span className="text-4xl">👤</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Side Profile Analysis
            </h2>
            <p className="text-slate-400 max-w-md mb-6">
              Advanced side profile metrics including gonial angle, nose
              projection, and chin recession analysis.
            </p>
            <div className="bg-indigo-500/10 text-indigo-300 px-4 py-2 rounded-full text-sm font-medium border border-indigo-500/20">
              🚀 Coming Soon (Next Week)
            </div>
          </div>
        )}
        {/* SKINCARE TAB (AI ANALYSIS + ROUTINE) */}
        {activeTab === "skincare" && (
          <div className="space-y-8 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <span className="bg-gradient-to-br from-cyan-500 to-blue-600 p-2 rounded-xl text-white shadow-lg shadow-cyan-500/20">
                  <Sparkles className="w-5 h-5" />
                </span>
                Softmaxxing Protocol
              </h2>
              {loadingSkincare && (
                <span className="text-sm text-cyan-400 animate-pulse flex items-center gap-2">
                  Generating dedicated routine...
                </span>
              )}
            </div>

            {/* Loading State or Timeline */}
            {loadingSkincare ? (
              <div className="space-y-6">
                <div className="h-40 bg-slate-900/50 rounded-2xl animate-pulse border border-white/5"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="h-64 bg-slate-900/50 rounded-2xl animate-pulse delay-100 border border-white/5"></div>
                  <div className="h-64 bg-slate-900/50 rounded-2xl animate-pulse delay-200 border border-white/5"></div>
                </div>
              </div>
            ) : (
              <SkincareTimeline
                scans={scans}
                currentScanId={scanId}
                onUploadCheckIn={onUploadSkincare || (() => {})}
                loading={loadingSkincare}
              />
            )}
          </div>
        )}
      </div>

      {/* Landmark Editor Overlay - Single Point Mode */}
      {editorState.isOpen && editorState.landmarkKey && localLandmarks && (
        <div className="fixed inset-0 z-50 bg-slate-950">
          <LandmarkEditor
            photoUrl={data.frontPhotoUrl}
            initialLandmarks={{
              [editorState.landmarkKey]:
                localLandmarks[editorState.landmarkKey],
            }}
            faceBox={data.faceBox}
            title="Adjust Landmark"
            landmarkType="front"
            onComplete={handleEditorComplete}
          />
        </div>
      )}
    </div>
  );
};

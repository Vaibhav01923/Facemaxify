import React, { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { FinalResult } from "../types";
import {
  calculateFrontRatios,
  MetricResult,
} from "../services/ratioCalculator";
import { Button } from "./Button";
import { RatioRow } from "./RatioRow";
import { FaceOverlay } from "./FaceOverlay";
import { LandmarkEditor } from "./LandmarkEditor";
import { useRegionalDiscount } from "../hooks/useRegionalDiscount";
import { Ticket, CheckCircle2, AlertTriangle, Sparkles, Lock } from "lucide-react";
import { updateScanLandmarks } from "../services/supabase";
import { calculateWeightedTotalScore } from "../services/ratioCalculator";
import { getAiRecommendations } from "../services/aiService";
import Markdown from "markdown-to-jsx";

interface DashboardProps {
  data?: FinalResult;
  isPaid?: boolean;
  scanId?: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ data, isPaid = false, scanId }) => {
  const { user } = useUser();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get("tab") as "overview" | "front" | "side") || "front";
  const [activeTab, setActiveTabState] = useState<"overview" | "front" | "side">(initialTab);

  const setActiveTab = (tab: "overview" | "front" | "side") => {
    setActiveTabState(tab);
    setSearchParams((prev) => {
      prev.set("tab", tab);
      return prev;
    }, { replace: true });
  };
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredMetric, setHoveredMetric] = useState<MetricResult | null>(null);
  const [pinnedMetric, setPinnedMetric] = useState<MetricResult | null>(null);
  const [localLandmarks, setLocalLandmarks] = useState<any>(null);
  const [editorState, setEditorState] = useState<{
    isOpen: boolean;
    landmarkKey: string | null;
  }>({ isOpen: false, landmarkKey: null });

  const discount = useRegionalDiscount();

  useEffect(() => {
    if (data?.frontLandmarks) {
        setLocalLandmarks(data.frontLandmarks);
    }
  }, [data?.frontLandmarks]);



  const handleLandmarkUpdate = (key: string, newPoint: {x: number, y: number}) => {
      setLocalLandmarks((prev: any) => {
          if (!prev) return prev;
          return {
              ...prev,
              [key]: newPoint
          };
      });
  };

  const handleMetricClick = (metric: MetricResult) => {
      // Toggle: if clicking the same metric, unpin it. Otherwise, pin the new one.
      setPinnedMetric(prev => prev?.name === metric.name ? null : metric);
  };

  const handlePointClick = (landmarkKey: string) => {
      setEditorState({ isOpen: true, landmarkKey });
  };

  const handleEditorComplete = async (updatedLandmarks: any) => {
      if (!editorState.landmarkKey) return;
      
      // Merge the updated landmark back into the full landmark set
      const newLandmarks = {
          ...localLandmarks,
          [editorState.landmarkKey!]: updatedLandmarks[editorState.landmarkKey!]
      };
      
      setLocalLandmarks(newLandmarks);
      setEditorState({ isOpen: false, landmarkKey: null });

      // Persist to database if viewing saved scan
      if (scanId && user?.id) {
          const metrics = calculateFrontRatios(newLandmarks);
          const score = metrics.length > 0 
              ? calculateWeightedTotalScore(metrics)
              : 0;
          
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

  useEffect(() => {
    async function fetchAiAnalysis() {
        if (data && frontMetrics.length > 0) {
            setLoading(true);
            try {
                // Determine photo to send (snapshot or standardized)
                const photoToSend = data.frontPhotoUrl;
                
                // IMPORTANT: In a real app, you might want to debounce this or cache it 
                // to avoid calling the API on every render/tab switch if not needed.
                // For now, we call it once when data is ready.
                const result = await getAiRecommendations(frontMetrics, photoToSend);
                setAnalysis(result);
            } catch (e) {
                console.error("AI Fetch Error", e);
                setAnalysis("Failed to load AI analysis.");
            } finally {
                setLoading(false);
            }
        }
    }

    if (data && !analysis) {
        fetchAiAnalysis();
    }
  }, [data, frontMetrics, analysis]);

  const overallScore = useMemo(() => {
    if (frontMetrics.length === 0) return 0;
    return calculateWeightedTotalScore(frontMetrics);
  }, [frontMetrics]);

  const ALLOWED_FREE_METRICS = [
    "Jaw Frontal Angle",
    "Middle Third",
    "Mouth width to nose width ratio"
  ];

  return (
    <div className="min-h-screen bg-[#050510] text-slate-100 font-sans selection:bg-indigo-500/30">
      {/* Premium Unlock Banner for Free Users */}
      {!isPaid && (
        <div className="bg-indigo-600 px-4 py-2 text-center relative z-50 overflow-hidden shadow-lg shadow-indigo-500/20">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-700 animate-gradient-x opacity-50"></div>
          <p className="relative z-10 text-[11px] sm:text-xs font-black text-white uppercase tracking-widest flex items-center justify-center gap-3">
            <span className="opacity-70">✨ Unlock 25+ Premium Facial Ratios & Guides</span>
            <button 
              onClick={() => window.location.href = `/api/checkout?customerEmail=${user?.primaryEmailAddress?.emailAddress}`}
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
            <div className={`text-right transition-opacity duration-300 ${isPaid ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
              <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                Facial Harmony
              </div>
              <div className="text-xl font-bold text-white leading-none">
                {Math.round(typeof overallScore === 'string' ? parseFloat(overallScore) : overallScore * 10)}{" "}
                <span className="text-sm text-slate-500">/ 100</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8 border-b border-transparent">
            {["overview", "front", "side"].map((tab) => (
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Regional Discount Banner */}
        {discount.isEligible && !isPaid && (
          <div className="mb-8 rounded-2xl bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30 p-6 flex items-center justify-between gap-4 animate-fadeIn">
             <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center text-orange-400">
                 <Ticket className="w-6 h-6" />
               </div>
               <div>
                 <h3 className="text-white font-bold text-lg">🇮🇳 India Exclusive Offer</h3>
                 <p className="text-orange-200 text-sm">
                   We've detected you are from India. A <span className="font-bold text-white">50% PPP Discount</span> has been auto-applied!
                 </p>
               </div>
             </div>
             <div className="hidden sm:block text-right">
                <span className="block text-xs text-orange-300 uppercase font-bold tracking-wider mb-1">Your Code</span>
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
               {!isPaid && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-md p-6 text-center rounded-3xl border border-white/10">
                      <div className="bg-gradient-to-b from-indigo-500/20 to-purple-500/20 p-4 rounded-full mb-6 ring-1 ring-indigo-500/50 shadow-2xl shadow-indigo-500/10">
                          <Lock className="w-8 h-8 text-indigo-400" />
                      </div>
                      <h3 className="text-2xl font-black text-white mb-3 tracking-tight">Unlock Your AI Coach</h3>
                      <p className="text-slate-400 max-w-sm mb-8 leading-relaxed">
                          Get a personalized maxxing protocol tailored to your specific facial ratios.
                          <br/><span className="text-indigo-400 text-sm mt-2 block font-semibold">Includes Softmax & Hardmax plans.</span>
                      </p>
                      <Button onClick={() => window.location.href = discount.link} variant="primary" className="shadow-xl shadow-indigo-500/20 w-full max-w-xs py-4 text-lg">
                          Unlock Full Analysis {discount.price}
                      </Button>
                      <p className="text-xs text-slate-500 mt-6">
                        Already purchased? <span className="text-indigo-400 cursor-pointer hover:underline" onClick={() => window.location.reload()}>Refresh</span>
                      </p>
                  </div>
              )}

              {/* CONTENT AREA */}
              <div className={`space-y-6 ${!isPaid ? "filter blur-md opacity-40 pointer-events-none select-none" : ""}`}>
                {loading ? (
                   <div className="space-y-6">
                      <div className="h-32 bg-slate-800/50 rounded-2xl animate-pulse border border-white/5"></div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="h-48 bg-emerald-900/10 rounded-2xl animate-pulse border border-white/5"></div>
                        <div className="h-48 bg-rose-900/10 rounded-2xl animate-pulse border border-white/5"></div>
                      </div>
                      <div className="flex justify-center gap-3 text-indigo-400 text-sm font-mono animate-pulse mt-8">
                         <Sparkles className="w-4 h-4" />
                         Analyzing {data?.gender || 'facial'} geometries...
                      </div>
                   </div>
                ) : (
                  <>
                    {/* PARSE & RENDER: We assume the AI returns Markdown with specific headers. 
                        We can use simple string splitting or render the whole markdown. 
                        For "cards", let's split manually if possible, or fallback to Markdown if not.
                    */}
                    {analysis && analysis.includes("# ⚡ Executive Summary") ? (
                      <>
                        {/* 1. EXECUTIVE SUMMARY */}
                        <div className="bg-gradient-to-br from-slate-900 to-indigo-950/30 p-6 rounded-2xl border border-indigo-500/20 shadow-xl relative overflow-hidden group">
                           <div className="absolute top-0 right-0 p-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                           <h3 className="text-lg font-bold text-indigo-300 mb-3 flex items-center gap-2">
                             ⚡ Executive Summary
                           </h3>
                           <div className="prose prose-invert prose-p:text-indigo-100/80 prose-p:leading-relaxed">
                              <Markdown>{analysis.split("# ⚡ Executive Summary")[1].split("# 🟢 Softmax Protocol")[0]}</Markdown>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* 2. SOFTMAX */}
                            <div className="bg-emerald-950/10 p-6 rounded-2xl border border-emerald-500/10 hover:border-emerald-500/20 transition-colors">
                                <h3 className="text-lg font-bold text-emerald-400 mb-4 flex items-center gap-2">
                                  <CheckCircle2 className="w-5 h-5" />
                                  Softmax Protocol
                                </h3>
                                <div className="prose prose-invert prose-p:text-slate-300 prose-li:text-slate-300 prose-ul:marker:text-emerald-500/50 text-sm">
                                  <Markdown>{analysis.split("# 🟢 Softmax Protocol")[1].split("# 🔴 Hardmax Protocol")[0]}</Markdown>
                                </div>
                            </div>

                            {/* 3. HARDMAX */}
                            <div className="bg-rose-950/10 p-6 rounded-2xl border border-rose-500/10 hover:border-rose-500/20 transition-colors">
                                <h3 className="text-lg font-bold text-rose-400 mb-4 flex items-center gap-2">
                                  <AlertTriangle className="w-5 h-5" />
                                  Hardmax Protocol
                                </h3>
                                <div className="prose prose-invert prose-p:text-slate-300 prose-li:text-slate-300 prose-ul:marker:text-rose-500/50 text-sm">
                                   <Markdown>{analysis.split("# 🔴 Hardmax Protocol")[1]}</Markdown>
                                </div>
                            </div>
                        </div>
                      </>
                    ) : (
                      // Fallback if AI didn't follow format exactly
                      <div className="bg-slate-900/40 p-8 rounded-2xl border border-white/5">
                        <div className="prose prose-invert max-w-none prose-headings:text-indigo-200">
                          <Markdown>{analysis}</Markdown>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* FRONT RATIOS TAB */}
        {activeTab === "front" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
            <div className="lg:col-span-5 space-y-4">
              <div className="sticky top-24 bg-slate-900/50 rounded-2xl border border-white/5 p-2 shadow-2xl">
                <div className="aspect-[3/4] relative rounded-xl overflow-hidden bg-black">
                  <FaceOverlay
                    photoUrl={data.frontPhotoUrl}
                    landmarks={localLandmarks || data.frontLandmarks}
                    highlightedLandmarks={(pinnedMetric || hoveredMetric)?.relatedLandmarks}
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
                  {(pinnedMetric || hoveredMetric) ? (
                    <div className="text-center animate-fadeIn">
                      <p className="text-indigo-400 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2">
                        {(pinnedMetric || hoveredMetric)!.name}
                        {pinnedMetric && <span className="text-[8px] bg-indigo-500/20 px-1.5 py-0.5 rounded-full">PINNED</span>}
                      </p>
                      {(pinnedMetric || hoveredMetric)!.name !== "Jaw Frontal Angle" && (
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
                  Detailed breakdown of {frontMetrics.length} metrics based on your anatomy.
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
                      isLocked={!isPaid && !ALLOWED_FREE_METRICS.includes(metric.name)}
                      discountCode={discount.isEligible ? discount.code : undefined}
                    />
                  ))}
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
              Advanced side profile metrics including gonial angle, nose projection, and chin recession analysis.
            </p>
            <div className="bg-indigo-500/10 text-indigo-300 px-4 py-2 rounded-full text-sm font-medium border border-indigo-500/20">
              🚀 Coming Soon (Next Week)
            </div>
          </div>
        )}
      </main>

      {/* Landmark Editor Overlay - Single Point Mode */}
      {editorState.isOpen && editorState.landmarkKey && localLandmarks && (
        <div className="fixed inset-0 z-50 bg-slate-950">
          <LandmarkEditor
            photoUrl={data.frontPhotoUrl}
            initialLandmarks={{ [editorState.landmarkKey]: localLandmarks[editorState.landmarkKey] }}
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

import React, { useEffect, useState, useMemo } from "react";
import { useUser } from "@clerk/clerk-react";
import { FinalResult } from "../types";
import {
  calculateFrontRatios,
  MetricResult,
} from "../services/ratioCalculator";
import { Button } from "./Button";
import { RatioRow } from "./RatioRow";
import { FaceOverlay } from "./FaceOverlay";

interface DashboardProps {
  data?: FinalResult;
  isPaid?: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ data, isPaid = false }) => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<"overview" | "front">(
    "front"
  );
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredMetric, setHoveredMetric] = useState<MetricResult | null>(null);

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
    const metrics = calculateFrontRatios(data.frontLandmarks);
    return metrics.sort((a, b) => a.score - b.score);
  }, [data.frontLandmarks]);

  const overallScore = useMemo(() => {
    if (frontMetrics.length === 0) return 0;
    const total = frontMetrics.reduce((acc, curr) => acc + curr.score, 0);
    return (total / frontMetrics.length).toFixed(1);
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
            <span className="opacity-70">✨ Unlock 10+ Premium Facial Ratios & Guides</span>
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
             <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-lg shadow-lg shadow-indigo-500/20">
              ✨
            </div>
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
                {Math.round(parseFloat(overallScore) * 10)}{" "}
                <span className="text-sm text-slate-500">/ 100</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8 border-b border-transparent">
            {["overview", "front"].map((tab) => (
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
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-slate-900/40 p-8 rounded-2xl border border-white/5 shadow-2xl relative overflow-hidden">
               <div className="relative z-10">
                <h2 className="text-2xl font-bold text-white mb-6">
                  Harmony Insights
                </h2>
                {loading ? (
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-slate-800 rounded w-full"></div>
                    <div className="h-4 bg-slate-800 rounded w-5/6"></div>
                  </div>
                ) : (
                  <div className="prose prose-invert max-w-none">
                    <p className="text-slate-300 text-lg leading-relaxed font-light">
                      {analysis?.harmonyAnalysis ||
                        "Generating comprehensive facial analysis..."}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 relative z-10">
                <div className="bg-slate-950/50 rounded-xl p-5 border border-white/5">
                  <h3 className="text-emerald-400 font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>{" "}
                    Top Traits
                  </h3>
                  <ul className="space-y-3">
                    {analysis?.strengths?.map((s: string, i: number) => (
                      <li
                        key={i}
                        className="text-slate-300 text-sm flex items-start gap-2"
                      >
                        <span className="text-emerald-500/50 mt-1">✓</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-slate-950/50 rounded-xl p-5 border border-white/5">
                  <h3 className="text-indigo-400 font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>{" "}
                    Enhancements
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {analysis?.improvement}
                  </p>
                </div>
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
                    landmarks={data.frontLandmarks}
                    highlightedLandmarks={hoveredMetric?.relatedLandmarks}
                    metricName={hoveredMetric?.name}
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-12 text-center">
                    <h3 className="text-white font-bold tracking-wider text-sm uppercase">
                      Analysis View
                    </h3>
                  </div>
                </div>
                <div className="mt-3 px-2 pb-2">
                  {hoveredMetric ? (
                    <div className="text-center animate-fadeIn">
                      <p className="text-indigo-400 text-xs font-bold uppercase tracking-wider">
                        {hoveredMetric.name}
                      </p>
                      <p className="text-slate-500 text-xs">
                        Score: {hoveredMetric.score}/10
                      </p>
                    </div>
                  ) : (
                    <p className="text-center text-slate-600 text-xs">
                      Hover over a trait to visualize
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
                      isLocked={!isPaid && !ALLOWED_FREE_METRICS.includes(metric.name)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

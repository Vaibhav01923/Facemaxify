import React, { useState, useMemo } from "react";
import { FinalResult } from "../types";
import {
  calculateFrontRatios,
  calculateSideRatios,
  MetricResult,
} from "../services/ratioCalculator";
import { RatioRow } from "./RatioRow";
import { FaceOverlay } from "./FaceOverlay";

interface DashboardProps {
  data: FinalResult;
}

export const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  const [activeTab, setActiveTab] = useState<"front" | "side">("front");
  const [hoveredMetric, setHoveredMetric] = useState<MetricResult | null>(null);

  const frontMetrics = useMemo(() => {
    const metrics = calculateFrontRatios(data.frontLandmarks);
    return metrics.sort((a, b) => a.score - b.score);
  }, [data.frontLandmarks]);

  const sideMetrics = useMemo(() => {
    if (!data.sideLandmarks) return [];
    const metrics = calculateSideRatios(data.sideLandmarks);
    return metrics.sort((a, b) => a.score - b.score);
  }, [data.sideLandmarks]);

  const overallScore = useMemo(() => {
    const allMetrics = [...frontMetrics, ...sideMetrics];
    if (allMetrics.length === 0) return 0;
    const total = allMetrics.reduce((acc, curr) => acc + curr.score, 0);
    return (total / allMetrics.length).toFixed(1);
  }, [frontMetrics, sideMetrics]);

  const hasSideProfile = !!data.sideLandmarks;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800 shadow-2xl shadow-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-lg shadow-lg shadow-blue-500/20">
              ✨
            </div>
            <h1 className="text-lg font-bold tracking-tight text-white">
              Aesthetix<span className="text-slate-500 font-normal">AI</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                Overall Score
              </div>
              <div className="text-xl font-bold text-white leading-none">
                {overallScore}{" "}
                <span className="text-sm text-slate-500">/ 10</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8 border-b border-transparent">
            {["front", "side"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`pb-3 text-sm font-medium transition-all relative ${
                  activeTab === tab
                    ? "text-blue-400"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)} Ratios
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* FRONT RATIOS TAB */}
        {activeTab === "front" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
            <div className="lg:col-span-5 space-y-4">
              <div className="sticky top-24 bg-slate-900 rounded-2xl border border-slate-800 p-2 shadow-2xl">
                <div className="aspect-[3/4] relative rounded-xl overflow-hidden bg-black">
                  <FaceOverlay
                    photoUrl={data.frontPhotoUrl}
                    landmarks={data.frontLandmarks}
                    highlightedLandmarks={hoveredMetric?.relatedLandmarks}
                    metricName={hoveredMetric?.name}
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-12 text-center">
                    <h3 className="text-white font-bold tracking-wider text-sm uppercase">
                      Front View
                    </h3>
                  </div>
                </div>
                <div className="mt-3 px-2 pb-2">
                  {hoveredMetric ? (
                    <div className="text-center animate-fadeIn">
                      <p className="text-blue-400 text-xs font-bold uppercase tracking-wider">
                        {hoveredMetric.name}
                      </p>
                      <p className="text-slate-400 text-xs">
                        Score: {hoveredMetric.score}/10
                      </p>
                    </div>
                  ) : (
                    <p className="text-center text-slate-500 text-xs">
                      Hover over a ratio to visualize
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  Front View Ratios
                </h2>
                <p className="text-slate-400">
                  Detailed breakdown of {frontMetrics.length} facial ratios,
                  sorted by impact.
                </p>
              </div>

              <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="divide-y divide-slate-800/50">
                  {frontMetrics.map((metric, idx) => (
                    <RatioRow
                      key={idx}
                      metric={metric}
                      onHover={setHoveredMetric}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SIDE RATIOS TAB */}
        {activeTab === "side" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
            {hasSideProfile ? (
              <>
                <div className="lg:col-span-5 space-y-4">
                  <div className="sticky top-24 bg-slate-900 rounded-2xl border border-slate-800 p-2 shadow-2xl">
                    <div className="aspect-[3/4] relative rounded-xl overflow-hidden bg-black">
                      <FaceOverlay
                        photoUrl={data.sidePhotoUrl!}
                        landmarks={data.sideLandmarks!}
                        highlightedLandmarks={hoveredMetric?.relatedLandmarks}
                        metricName={hoveredMetric?.name}
                      />
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-12 text-center">
                        <h3 className="text-white font-bold tracking-wider text-sm uppercase">
                          Side Profile
                        </h3>
                      </div>
                    </div>
                    <div className="mt-3 px-2 pb-2">
                      {hoveredMetric ? (
                        <div className="text-center animate-fadeIn">
                          <p className="text-blue-400 text-xs font-bold uppercase tracking-wider">
                            {hoveredMetric.name}
                          </p>
                          <p className="text-slate-400 text-xs">
                            Score: {hoveredMetric.score}/10
                          </p>
                        </div>
                      ) : (
                        <p className="text-center text-slate-500 text-xs">
                          Hover over a ratio to visualize
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-7 space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">
                      Side Profile Ratios
                    </h2>
                    <p className="text-slate-400">
                      Detailed breakdown of {sideMetrics.length} profile metrics
                      and angular measurements.
                    </p>
                  </div>

                  <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                    <div className="divide-y divide-slate-800/50">
                      {sideMetrics.map((metric, idx) => (
                        <RatioRow
                          key={idx}
                          metric={metric}
                          onHover={setHoveredMetric}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="col-span-12 flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-3xl mb-4">
                  🚫
                </div>
                <h2 className="text-xl font-bold text-white mb-2">
                  Side Profile Skipped
                </h2>
                <p className="text-slate-400 max-w-md">
                  You chose to skip the side profile analysis. Restart the
                  process if you wish to include it.
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

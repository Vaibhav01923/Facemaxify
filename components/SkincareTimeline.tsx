import React from "react";
import { useUser } from "@clerk/clerk-react";
import { Lock, Sparkles, TrendingUp } from "lucide-react";

interface SkincareTimelineProps {
  scans: any[];
  currentScanId?: string;
  analysis?: any;
  onUploadCheckIn: (file: File) => void;
  loading: boolean;
  isPaid?: boolean;
}

export const SkincareTimeline: React.FC<SkincareTimelineProps> = ({
  scans,
  currentScanId,
  analysis: propAnalysis,
  onUploadCheckIn,
  loading,
  isPaid = false,
}) => {
  const { user } = useUser();
  const checkoutUrl = `/api/checkout?products=98df164f-7f50-4df1-bba7-0a24d340f60c&customerEmail=${user?.primaryEmailAddress?.emailAddress}`;

  const analysis =
    propAnalysis ||
    scans.find((s) => s.id === currentScanId)?.analysis?.skincare;

  if (!analysis) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-white/5 rounded-3xl bg-slate-900/30">
        <div className="p-4 bg-white/5 rounded-full mb-4">
          <Sparkles className="w-8 h-8 text-slate-500" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">
          Generating Protocol...
        </h3>
        <p className="text-slate-400 max-w-sm">
          Your personalised softmaxxing routine is being prepared. This may take a moment.
        </p>
      </div>
    );
  }

  if (!isPaid) {
    return (
      <div className="relative rounded-2xl overflow-hidden border border-white/10" style={{ minHeight: 420 }}>
        {/* Blurred content underneath */}
        <div className="pointer-events-none select-none" style={{ filter: "blur(8px)", opacity: 0.4 }}>
          <SkincareResults analysis={analysis} />
        </div>
        {/* Lock overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/30 flex items-center justify-center">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 max-w-sm text-center shadow-2xl mx-4">
            <div className="w-14 h-14 bg-cyan-500/20 border border-cyan-500/40 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-7 h-7 text-cyan-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Your Protocol is Ready</h3>
            <p className="text-slate-400 text-sm mb-2">Your personalised softmaxxing routine is generated. Upgrade to unlock your full skincare protocol, morning + night routines, and product recommendations.</p>
            <p className="text-cyan-400 text-xs font-medium mb-5">Pro exclusive feature</p>
            <a
              href={checkoutUrl}
              className="block w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-semibold rounded-xl transition-all"
            >
              Upgrade to Pro
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="w-5 h-5 text-indigo-400" />
        <h2 className="text-xl font-bold text-white">Skincare Analysis</h2>
      </div>
      <SkincareResults analysis={analysis} />
    </div>
  );
};

// Internal component to display the detailed analysis (refactored from Dashboard structure)
const SkincareResults: React.FC<{ analysis: any }> = ({ analysis }) => {
  return (
    <div className="space-y-8">
      {/* 1. Summary Card */}
      <div className="p-6 rounded-2xl border bg-slate-900/50 border-white/10">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-2">Skin Assessment</h3>
            <p className="text-slate-300 leading-relaxed">
              {analysis.analysis?.summary || "Analysis complete."}
            </p>
          </div>
        </div>
      </div>

      {/* 1b. Improvement Areas */}
      {analysis.improvements?.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Key Improvements
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {analysis.improvements.map((item: any, i: number) => (
              <div key={i} className="p-4 rounded-xl bg-slate-900/50 border border-white/5">
                <p className="text-white font-semibold text-sm mb-1">{item.area}</p>
                <p className="text-slate-400 text-xs">{item.advice}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Skin Analysis Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5">
          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
            Skin Type
          </h4>
          <p className="text-xl font-bold text-white mb-1">
            {analysis.analysis?.skin_type || "Unknown"}
          </p>
          <p className="text-xs text-slate-500">Based on visual analysis</p>
        </div>
        <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5">
          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
            Main Concerns
          </h4>
          <div className="flex flex-wrap gap-2">
            {analysis.analysis?.concerns?.map((c: string) => (
              <span
                key={c}
                className="px-3 py-1 bg-red-500/10 text-red-400 text-xs font-bold rounded-lg border border-red-500/20"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
        <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5">
          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
            Severity Score
          </h4>
          <div className="flex items-end gap-2">
            <span
              className={`text-4xl font-black ${
                (analysis.analysis?.severity_score || 0) > 6
                  ? "text-red-500"
                  : "text-emerald-500"
              }`}
            >
              {analysis.analysis?.severity_score || 0}
            </span>
            <span className="text-sm text-slate-500 mb-1">/ 10</span>
          </div>
        </div>
      </div>

      {/* 3. Routine */}
      {analysis.routine && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Morning */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">
              <span>☀️</span> Morning Routine
            </h3>
            <div className="bg-slate-900/50 rounded-2xl border border-white/5 p-6 space-y-4">
              {analysis.routine.morning?.map((step: any, i: number) => (
                <div key={i} className="flex gap-4">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold border border-amber-500/20">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-white font-bold text-sm">
                      {step.step}:{" "}
                      <span className="text-amber-300">
                        {step.product_type}
                      </span>
                    </p>
                    <p className="text-slate-400 text-xs mt-1">{step.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Evening */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-indigo-400 flex items-center gap-2">
              <span>🌙</span> Evening Routine
            </h3>
            <div className="bg-slate-900/50 rounded-2xl border border-white/5 p-6 space-y-4">
              {analysis.routine.evening?.map((step: any, i: number) => (
                <div key={i} className="flex gap-4">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold border border-indigo-500/20">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-white font-bold text-sm">
                      {step.step}:{" "}
                      <span className="text-indigo-300">
                        {step.product_type}
                      </span>
                    </p>
                    <p className="text-slate-400 text-xs mt-1">{step.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

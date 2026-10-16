import React, { useMemo } from "react";
import { CheckCircle2, Lock, ShieldCheck } from "lucide-react";
import { Point } from "../types";
import { calculateFrontRatios } from "../services/ratioCalculator";

interface GuestResultsGateProps {
  photo: string;
  landmarks: Record<string, Point>;
  onSignIn: () => void;
  onStartOver: () => void;
}

// What someone who isn't signed in sees after mapping every landmark: their analysis is ready, but the results are
// behind a (free) sign-in, shown with the same blur treatment as the paid report. The numbers behind the blur are
// placeholders on purpose: the real results screen (which also triggers the AI report and saves the scan) only
// renders once they are signed in.
const DECOY_SCORES = [8.4, 6.1, 9.2, 7.7, 5.3, 8.8, 6.9];

export const GuestResultsGate: React.FC<GuestResultsGateProps> = ({ photo, landmarks, onSignIn, onStartOver }) => {
  const rows = useMemo(() => {
    const names = calculateFrontRatios(landmarks as any).map((m) => m.name);
    return { names: names.slice(0, DECOY_SCORES.length), total: names.length };
  }, [landmarks]);
  const landmarkCount = Object.keys(landmarks).length;

  return (
    <div className="min-h-full bg-[#050510] text-white px-4 py-10 flex flex-col items-center" data-testid="guest-results-gate">
      <div className="w-full max-w-2xl">
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-emerald-300 mb-6">
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> {landmarkCount} landmarks mapped
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> {rows.total} facial ratios scored
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> Facial harmony score ready
          </span>
        </div>

        <div className="flex flex-col items-center text-center mb-8">
          <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-indigo-500/10 bg-slate-900">
            <img src={photo} alt="Your photo with the mapped landmarks" className="absolute inset-0 w-full h-full object-cover" />
            <svg viewBox="0 0 1000 1000" className="absolute inset-0 w-full h-full" aria-hidden="true">
              {(Object.values(landmarks) as Point[]).map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={6} fill="#22d3ee" opacity={0.9} />
              ))}
            </svg>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mt-8">Your analysis is ready</h1>
          <p className="text-slate-400 mt-3 max-w-md font-medium">
            Sign in, it's free, to see your facial harmony score, every ratio broken down, and your strongest and weakest features.
          </p>
        </div>

        <div className="relative rounded-3xl border border-white/10 bg-slate-900/50 overflow-hidden">
          <div aria-hidden="true" className="filter blur-md opacity-40 pointer-events-none select-none p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-5 w-40 rounded bg-slate-600" />
              <div className="text-4xl font-black text-indigo-300">78/100</div>
            </div>
            {rows.names.map((name, i) => (
              <div key={name} className="flex items-center gap-4">
                <div className="flex-1 text-sm font-medium uppercase tracking-tight text-slate-200 truncate">{name}</div>
                <div className="flex-[2] h-2.5 rounded-full bg-slate-700 relative">
                  <div className="absolute inset-y-0 left-0 rounded-full bg-emerald-500/60" style={{ width: `${DECOY_SCORES[i] * 10}%` }} />
                </div>
                <div className="w-12 text-right font-bold text-green-400">{DECOY_SCORES[i]}</div>
              </div>
            ))}
          </div>

          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#050510]/30 via-[#050510]/60 to-[#050510]/80 px-6 text-center">
            <div className="w-12 h-12 rounded-full bg-indigo-500/15 border border-indigo-400/30 flex items-center justify-center mb-4">
              <Lock className="w-5 h-5 text-indigo-300" />
            </div>
            <button
              type="button"
              onClick={onSignIn}
              className="px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-base shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all"
            >
              Sign in to view results
            </button>
            <p className="text-xs text-slate-400 mt-3 inline-flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Free · takes about 10 seconds · your photo stays on your device until you sign in
            </p>
          </div>
        </div>

        <div className="text-center mt-6">
          <button type="button" onClick={onStartOver} className="text-sm text-slate-500 hover:text-slate-300 underline underline-offset-4">
            Start over with a different photo
          </button>
        </div>
      </div>
    </div>
  );
};

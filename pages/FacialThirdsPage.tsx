import React from "react";
import { SEO } from "../components/SEO";
import { Navbar } from "../components/Navbar";
import { ToolArticle } from "../components/tools/ToolArticle";
import { PhotoAnalyzerShell } from "../components/tools/PhotoAnalyzerShell";

function dist(a: any, b: any) { return Math.sqrt((a.x-b.x)**2 + (a.y-b.y)**2); }

function calculate(lm: any[]) {
  const forehead = lm[10].y;
  const brow = (lm[105].y + lm[334].y) / 2;
  const noseBase = lm[94].y;
  const chin = lm[152].y;
  const total = chin - forehead;
  const upper = brow - forehead;
  const middle = noseBase - brow;
  const lower = chin - noseBase;
  const upperPct = (upper / total) * 100;
  const middlePct = (middle / total) * 100;
  const lowerPct = (lower / total) * 100;
  const deviations = [Math.abs(upperPct - 33.3), Math.abs(middlePct - 33.3), Math.abs(lowerPct - 33.3)];
  const avgDev = deviations.reduce((s, d) => s + d, 0) / 3;
  const score = Math.max(0, Math.round(100 - avgDev * 5));
  const classification = score >= 88 ? "Ideal Thirds" : score >= 74 ? "Well-Proportioned" : score >= 58 ? "Moderate Imbalance" : "Notable Imbalance";
  return { score, classification, upperPct, middlePct, lowerPct };
}

const Results = ({ result: r, reset }: any) => {
  const c = r.score >= 88 ? "text-emerald-400" : r.score >= 74 ? "text-indigo-400" : r.score >= 58 ? "text-amber-400" : "text-red-400";
  const ring = r.score >= 88 ? "border-emerald-500" : r.score >= 74 ? "border-indigo-500" : r.score >= 58 ? "border-amber-500" : "border-red-500";
  const thirds = [
    { label: "Upper Third (Forehead)", pct: r.upperPct, ideal: "33.3%" },
    { label: "Middle Third (Nose)", pct: r.middlePct, ideal: "33.3%" },
    { label: "Lower Third (Chin & Lips)", pct: r.lowerPct, ideal: "33.3%" },
  ];
  return (
    <div className="space-y-5">
      <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-8 flex flex-col sm:flex-row items-center gap-8">
        <div className={`w-32 h-32 rounded-full border-4 ${ring} flex flex-col items-center justify-center shrink-0`}>
          <span className={`text-4xl font-black ${c}`}>{r.score}</span>
          <span className="text-xs text-slate-400">/100</span>
        </div>
        <div>
          <p className={`text-sm font-bold uppercase tracking-wider mb-2 ${c}`}>{r.classification}</p>
          <p className="text-slate-300 text-sm leading-relaxed">The classic standard of beauty divides the face into three equal horizontal thirds. Your score reflects how closely your proportions match this ideal — a lower deviation means greater facial balance.</p>
        </div>
      </div>
      <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6">
        <h3 className="text-white font-bold mb-4">Thirds Breakdown</h3>
        {thirds.map(({ label, pct, ideal }) => {
          const dev = Math.abs(pct - 33.3);
          const barColor = dev < 3 ? "bg-emerald-500" : dev < 7 ? "bg-indigo-500" : dev < 12 ? "bg-amber-500" : "bg-red-500";
          return (
            <div key={label} className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-300">{label}</span>
                <span className="text-slate-400">{pct.toFixed(1)}% <span className="text-slate-600">(ideal {ideal})</span></span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full ${barColor} rounded-full`} style={{ width: `${Math.min(100, pct * 3)}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const FacialThirdsPage: React.FC = () => {
  return (
    <>
      <SEO title="Facial Thirds Calculator — Free AI Face Proportion Analyzer | Facemaxify" description="Calculate your facial thirds ratio free with AI. Upload a photo to measure your upper, middle, and lower facial thirds and see how you compare to the classical ideal proportion." keywords="facial thirds calculator, facial thirds ratio, face thirds analysis, facial thirds test, facial proportion calculator, face proportion analyzer" canonicalUrl="https://facemaxify.com/tools/facial-thirds" schema={[{ "@context": "https://schema.org", "@type": "WebApplication", name: "Facial Thirds Calculator", url: "https://facemaxify.com/tools/facial-thirds", isAccessibleForFree: true, offers: { "@type": "Offer", price: "0" } }] as any} />
      <div className="min-h-screen bg-[#050510] text-white">
        <Navbar />
        <section className="max-w-4xl mx-auto px-4 pt-14 pb-4 text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-5">Free · No Signup</span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-4">Facial Thirds Calculator</h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">Upload your photo to measure how evenly your face divides into upper, middle, and lower thirds — the foundational principle of classical facial beauty.</p>
        </section>
        <PhotoAnalyzerShell onAnalyze={calculate} renderResults={(r, reset) => <Results result={r} reset={reset} />} analyzeLabel="Calculate My Facial Thirds" />
        <ToolArticle slug="facial-thirds" />
      </div>
    </>
  );
};

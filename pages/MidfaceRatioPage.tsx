import React from "react";
import { SEO } from "../components/SEO";
import { Navbar } from "../components/Navbar";
import { ToolArticle } from "../components/tools/ToolArticle";
import { PhotoAnalyzerShell } from "../components/tools/PhotoAnalyzerShell";

function calculate(lm: any[]) {
  const browY = (lm[105].y + lm[334].y) / 2;
  const noseBaseY = lm[94].y;
  const chinY = lm[152].y;
  const midfaceH = Math.abs(noseBaseY - browY);
  const lowerFaceH = Math.abs(chinY - noseBaseY);
  const ratio = midfaceH / (lowerFaceH || 1);
  // Ideal midface ratio: ~0.95–1.05 (near equal, slightly shorter midface preferred)
  const score = Math.max(0, Math.round(100 - Math.abs(ratio - 1.0) * 120));
  const classification = score >= 85 ? "Ideal Midface Length" : score >= 68 ? "Well-Balanced" : score >= 52 ? "Slight Elongation" : ratio > 1 ? "Long Midface" : "Short Midface";
  const verdict = ratio > 1.12 ? "Your midface is relatively long compared to your lower face." : ratio < 0.88 ? "Your midface is shorter than your lower face." : "Your midface and lower face are in close proportion.";
  return { score, classification, ratio, verdict };
}

const Results = ({ result: r, reset }: any) => {
  const c = r.score >= 85 ? "text-emerald-400" : r.score >= 68 ? "text-indigo-400" : r.score >= 52 ? "text-amber-400" : "text-red-400";
  const ring = r.score >= 85 ? "border-emerald-500" : r.score >= 68 ? "border-indigo-500" : r.score >= 52 ? "border-amber-500" : "border-red-500";
  return (
    <div className="space-y-5">
      <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-8 flex flex-col sm:flex-row items-center gap-8">
        <div className={`w-32 h-32 rounded-full border-4 ${ring} flex flex-col items-center justify-center shrink-0`}>
          <span className={`text-4xl font-black ${c}`}>{r.score}</span>
          <span className="text-xs text-slate-400">/100</span>
        </div>
        <div>
          <p className={`text-sm font-bold uppercase tracking-wider mb-2 ${c}`}>{r.classification}</p>
          <p className="text-slate-300 text-sm">Midface-to-lower-face ratio: <strong>{r.ratio.toFixed(2)}</strong> (ideal ~1.00). {r.verdict}</p>
        </div>
      </div>
      <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 text-sm text-slate-400">
        <div className="flex justify-between py-3 border-b border-white/5">
          <span>Midface / Lower Face Ratio</span>
          <span className={`font-bold ${r.score >= 85 ? "text-emerald-400" : "text-amber-400"}`}>{r.ratio.toFixed(2)} <span className="text-slate-600 text-xs">(ideal ~1.00)</span></span>
        </div>
      </div>
    </div>
  );
};

export const MidfaceRatioPage: React.FC = () => {
  return (
    <>
      <SEO title="Midface Ratio Calculator — Free AI Midface Length Analyzer | Facemaxify" description="Calculate your midface ratio free with AI. Measure your midface-to-lower-face proportion to see if you have a long or short midface and how it compares to the aesthetic ideal." keywords="midface ratio calculator, midface length analyzer, midface ratio analysis, long midface test, short midface, midface proportion calculator" canonicalUrl="https://facemaxify.com/tools/midface-ratio" schema={[{ "@context": "https://schema.org", "@type": "WebApplication", name: "Midface Ratio Calculator", url: "https://facemaxify.com/tools/midface-ratio", isAccessibleForFree: true, offers: { "@type": "Offer", price: "0" } }] as any} />
      <div className="min-h-screen bg-[#050510] text-white">
        <Navbar />
        <section className="max-w-4xl mx-auto px-4 pt-14 pb-4 text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-5">Free · No Signup</span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-4">Midface Ratio Calculator</h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">Upload your photo to measure your midface ratio — the proportion between your brow-to-nose zone and your nose-to-chin zone. Discover if you have a long or short midface.</p>
        </section>
        <PhotoAnalyzerShell onAnalyze={calculate} renderResults={(r, reset) => <Results result={r} reset={reset} />} analyzeLabel="Calculate My Midface Ratio" />
        <ToolArticle slug="midface-ratio" />
      </div>
    </>
  );
};

import React from "react";
import { SEO } from "../components/SEO";
import { Navbar } from "../components/Navbar";
import { ToolArticle } from "../components/tools/ToolArticle";
import { PhotoAnalyzerShell } from "../components/tools/PhotoAnalyzerShell";

function dist(a: any, b: any) { return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2); }

function calculate(lm: any[]) {
  const leftBrowY = lm[105].y;
  const rightBrowY = lm[334].y;
  const leftEyeTopY = lm[159].y;
  const rightEyeTopY = lm[386].y;
  const leftEyeW = dist(lm[33], lm[133]);
  const rightEyeW = dist(lm[263], lm[362]);
  const leftBrowGap = Math.abs(leftEyeTopY - leftBrowY) / (leftEyeW || 1);
  const rightBrowGap = Math.abs(rightEyeTopY - rightBrowY) / (rightEyeW || 1);
  const avgGap = (leftBrowGap + rightBrowGap) / 2;
  // Ideal: brow-to-eye gap ≈ 0.5 eye-widths (clear space but not too high)
  const score = Math.max(0, Math.round(100 - Math.abs(avgGap - 0.50) * 180));
  const classification = avgGap < 0.30 ? "Low Brow" : avgGap < 0.45 ? "Low-Normal Brow" : avgGap < 0.60 ? "Ideal Brow Position" : avgGap < 0.75 ? "High-Normal Brow" : "High Brow";
  const verdict = avgGap < 0.30 ? "Brows sit very close to the eyes — creates a heavy, hooded appearance." : avgGap < 0.45 ? "Brows are slightly low — gives a stronger, more intense expression." : avgGap < 0.60 ? "Brow position is well-placed — open, balanced eye zone." : avgGap < 0.75 ? "Brows sit slightly high — creates an open, surprised quality." : "Very high brow position — wide-open, highly expressive appearance.";
  return { score, classification, avgGap, verdict };
}

const Results = ({ result: r, reset }: any) => {
  const c = r.score >= 82 ? "text-emerald-400" : r.score >= 65 ? "text-indigo-400" : "text-amber-400";
  const ring = r.score >= 82 ? "border-emerald-500" : r.score >= 65 ? "border-indigo-500" : "border-amber-500";
  return (
    <div className="space-y-5">
      <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-8 flex flex-col sm:flex-row items-center gap-8">
        <div className={`w-32 h-32 rounded-full border-4 ${ring} flex flex-col items-center justify-center shrink-0`}>
          <span className={`text-4xl font-black ${c}`}>{r.score}</span>
          <span className="text-xs text-slate-400">/100</span>
        </div>
        <div>
          <p className={`text-sm font-bold uppercase tracking-wider mb-2 ${c}`}>{r.classification}</p>
          <p className="text-slate-300 text-sm">{r.verdict}</p>
        </div>
      </div>
      <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 text-sm text-slate-400">
        <div className="flex justify-between py-3">
          <span>Brow-to-Eye Gap (in eye-widths)</span>
          <span className={`font-bold ${r.score >= 82 ? "text-emerald-400" : "text-amber-400"}`}>{r.avgGap.toFixed(2)} <span className="text-slate-600 font-normal">ideal: ~0.50</span></span>
        </div>
      </div>
    </div>
  );
};

export const BrowPositionPage: React.FC = () => {
  return (
    <>
      <SEO title="Brow Position Analyzer — Free AI Eyebrow Height Calculator | Facemaxify" description="Analyze your brow position free with AI. Measure your brow-to-eye gap ratio to find out if you have a low brow, ideal brow, or high brow position and what it means aesthetically." keywords="brow position analyzer, eyebrow height calculator, brow position test, low brow test, high brow test, eyebrow position ratio, brow height analyzer" canonicalUrl="https://facemaxify.com/tools/brow-position" schema={[{ "@context": "https://schema.org", "@type": "WebApplication", name: "Brow Position Analyzer", url: "https://facemaxify.com/tools/brow-position", isAccessibleForFree: true, offers: { "@type": "Offer", price: "0" } }] as any} />
      <div className="min-h-screen bg-[#050510] text-white">
        <Navbar />
        <section className="max-w-4xl mx-auto px-4 pt-14 pb-4 text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-5">Free · No Signup</span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-4">Brow Position Analyzer</h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">Upload your photo to measure your brow-to-eye gap ratio. Find out if you have a low brow, high brow, or ideal brow position — and what each means for your facial aesthetics.</p>
        </section>
        <PhotoAnalyzerShell onAnalyze={calculate} renderResults={(r, reset) => <Results result={r} reset={reset} />} analyzeLabel="Analyze My Brow Position" />
        <ToolArticle slug="brow-position" />
      </div>
    </>
  );
};

import React from "react";
import { SEO } from "../components/SEO";
import { Navbar } from "../components/Navbar";
import { ToolArticle } from "../components/tools/ToolArticle";
import { PhotoAnalyzerShell } from "../components/tools/PhotoAnalyzerShell";

function dist(a: any, b: any) { return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2); }

function calculate(lm: any[]) {
  const noseW = dist(lm[98], lm[327]);
  const faceW = dist(lm[234], lm[454]);
  const interEye = dist(lm[133], lm[362]);
  const noseToFace = noseW / faceW;
  const noseToEye = noseW / interEye; // ideal ≈ 1 (nose width = inter-eye distance)
  const faceScore = Math.max(0, 100 - Math.abs(noseToFace - 0.275) * 400);
  const eyeScore = Math.max(0, 100 - Math.abs(noseToEye - 1.0) * 100);
  const score = Math.round((faceScore * 0.5) + (eyeScore * 0.5));
  const type = noseToFace < 0.22 ? "Narrow" : noseToFace < 0.26 ? "Slim" : noseToFace < 0.30 ? "Balanced" : noseToFace < 0.34 ? "Broad" : "Wide";
  const classification = score >= 86 ? "Ideal Nose Width" : score >= 70 ? "Well-Proportioned" : score >= 54 ? "Slightly Off" : "Wide or Narrow";
  return { score, classification, noseToFace, noseToEye, type };
}

const Results = ({ result: r, reset }: any) => {
  const c = r.score >= 86 ? "text-emerald-400" : r.score >= 70 ? "text-indigo-400" : r.score >= 54 ? "text-amber-400" : "text-red-400";
  const ring = r.score >= 86 ? "border-emerald-500" : r.score >= 70 ? "border-indigo-500" : r.score >= 54 ? "border-amber-500" : "border-red-500";
  return (
    <div className="space-y-5">
      <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-8 flex flex-col sm:flex-row items-center gap-8">
        <div className={`w-32 h-32 rounded-full border-4 ${ring} flex flex-col items-center justify-center shrink-0`}>
          <span className={`text-4xl font-black ${c}`}>{r.score}</span>
          <span className="text-xs text-slate-400">/100</span>
        </div>
        <div>
          <p className={`text-sm font-bold uppercase tracking-wider mb-2 ${c}`}>{r.classification}</p>
          <p className="text-slate-300 text-sm">Your nose width is classified as <strong>{r.type}</strong>. The two main standards are: nose width should be ~27.5% of face width, and nose width should roughly equal the inter-eye distance.</p>
        </div>
      </div>
      <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6">
        <h3 className="text-white font-bold mb-4">Nose Ratios</h3>
        {[
          { label: "Nose Width / Face Width", value: `${(r.noseToFace * 100).toFixed(1)}%`, ideal: "25–30%", good: r.noseToFace >= 0.24 && r.noseToFace <= 0.31 },
          { label: "Nose Width / Inter-Eye Distance", value: r.noseToEye.toFixed(2), ideal: "~1.00", good: Math.abs(r.noseToEye - 1) < 0.12 },
        ].map(m => (
          <div key={m.label} className="flex justify-between py-3 border-b border-white/5 last:border-0">
            <span className="text-slate-400 text-sm">{m.label}</span>
            <div className="text-right">
              <span className={`font-bold text-sm ${m.good ? "text-emerald-400" : "text-amber-400"}`}>{m.value}</span>
              <span className="text-slate-600 text-xs ml-2">ideal: {m.ideal}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const NoseRatioPage: React.FC = () => {
  return (
    <>
      <SEO title="Nose Width Ratio Calculator — Free AI Nose Proportion Analyzer | Facemaxify" description="Calculate your nose width ratio free with AI. Measure your nose-to-face width ratio and nose-to-eye distance ratio to see if your nose is proportional. Instant result." keywords="nose width ratio, nose ratio calculator, nose proportion analyzer, nose to face ratio, nose width calculator, nose width face width ratio" canonicalUrl="https://facemaxify.com/tools/nose-ratio" schema={[{ "@context": "https://schema.org", "@type": "WebApplication", name: "Nose Width Ratio Calculator", url: "https://facemaxify.com/tools/nose-ratio", isAccessibleForFree: true, offers: { "@type": "Offer", price: "0" } }] as any} />
      <div className="min-h-screen bg-[#050510] text-white">
        <Navbar />
        <section className="max-w-4xl mx-auto px-4 pt-14 pb-4 text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-5">Free · No Signup</span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-4">Nose Width Ratio Calculator</h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">Upload your photo to measure your nose-to-face width ratio and nose-to-eye distance proportion. See where your nose sits in the classical aesthetic spectrum.</p>
        </section>
        <PhotoAnalyzerShell onAnalyze={calculate} renderResults={(r, reset) => <Results result={r} reset={reset} />} analyzeLabel="Calculate My Nose Ratio" />
        <ToolArticle slug="nose-ratio" />
      </div>
    </>
  );
};

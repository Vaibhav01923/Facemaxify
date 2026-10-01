import React from "react";
import { SEO } from "../components/SEO";
import { Navbar } from "../components/Navbar";
import { ToolArticle } from "../components/tools/ToolArticle";
import { PhotoAnalyzerShell } from "../components/tools/PhotoAnalyzerShell";

function dist(a: any, b: any) { return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2); }

function calculate(lm: any[]) {
  const upperLipH = Math.abs(lm[0].y - lm[13].y);
  const lowerLipH = Math.abs(lm[14].y - lm[17].y);
  const mouthW = dist(lm[61], lm[291]);
  const interEye = dist(lm[133], lm[362]);
  const lipRatio = lowerLipH > 0 ? upperLipH / lowerLipH : 1;
  const mouthToEye = mouthW / interEye; // ideal ~1.5
  const lipScore = Math.max(0, 100 - Math.abs(lipRatio - 0.65) * 200);
  const mouthScore = Math.max(0, 100 - Math.abs(mouthToEye - 1.5) * 80);
  const score = Math.round((lipScore * 0.55) + (mouthScore * 0.45));
  const classification = score >= 85 ? "Ideal Lip Harmony" : score >= 68 ? "Well-Proportioned" : score >= 52 ? "Slight Imbalance" : "Notable Imbalance";
  const lipType = lipRatio < 0.5 ? "Very full lower lip" : lipRatio < 0.7 ? "Fuller lower lip (ideal)" : lipRatio < 0.9 ? "Near-equal lips" : "Equal or fuller upper lip";
  return { score, classification, lipRatio, mouthToEye, lipType };
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
          <p className="text-slate-300 text-sm"><strong>{r.lipType}</strong>. The ideal lip ratio has the lower lip approximately 1.5× the height of the upper lip. Mouth width should be roughly 1.5× the inter-eye distance.</p>
        </div>
      </div>
      <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6">
        <h3 className="text-white font-bold mb-4">Lip Measurements</h3>
        {[
          { label: "Upper-to-Lower Lip Ratio", value: r.lipRatio.toFixed(2), ideal: "~0.65 (upper:lower)", good: r.lipRatio >= 0.55 && r.lipRatio <= 0.80 },
          { label: "Mouth Width / Inter-Eye Ratio", value: r.mouthToEye.toFixed(2), ideal: "~1.50", good: Math.abs(r.mouthToEye - 1.5) < 0.2 },
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

export const LipRatioPage: React.FC = () => {
  return (
    <>
      <SEO title="Lip Ratio Analyzer — Free AI Lip Proportion Calculator | Facemaxify" description="Analyze your lip ratio free with AI. Measure your upper-to-lower lip ratio and mouth width proportion. Find out if your lips match the golden ratio aesthetic standard." keywords="lip ratio analyzer, lip ratio calculator, lip proportion analyzer, lip harmony, upper lower lip ratio, mouth width ratio, ideal lip ratio" canonicalUrl="https://facemaxify.com/tools/lip-ratio" schema={[{ "@context": "https://schema.org", "@type": "WebApplication", name: "Lip Ratio Analyzer", url: "https://facemaxify.com/tools/lip-ratio", isAccessibleForFree: true, offers: { "@type": "Offer", price: "0" } }] as any} />
      <div className="min-h-screen bg-[#050510] text-white">
        <Navbar />
        <section className="max-w-4xl mx-auto px-4 pt-14 pb-4 text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-5">Free · No Signup</span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-4">Lip Ratio Analyzer</h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">Upload your photo to measure your upper-to-lower lip ratio and mouth width proportion — and see how they compare to the golden ratio lip standard.</p>
        </section>
        <PhotoAnalyzerShell onAnalyze={calculate} renderResults={(r, reset) => <Results result={r} reset={reset} />} analyzeLabel="Analyze My Lip Ratio" />
        <ToolArticle slug="lip-ratio" />
      </div>
    </>
  );
};

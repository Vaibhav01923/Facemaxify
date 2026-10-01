import React from "react";
import { SEO } from "../components/SEO";
import { Navbar } from "../components/Navbar";
import { ToolArticle } from "../components/tools/ToolArticle";
import { PhotoAnalyzerShell } from "../components/tools/PhotoAnalyzerShell";

function dist(a: any, b: any) { return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2); }

function calculate(lm: any[]) {
  const cheekW = dist(lm[234], lm[454]);
  const jawW = dist(lm[172], lm[397]);
  const faceH = dist(lm[10], lm[152]);
  const cheekToJaw = cheekW / (jawW || 1); // ideal > 1.1 (cheekbones wider than jaw)
  const cheekToHeight = cheekW / (faceH || 1); // ideal ~0.7-0.8
  const tapScore = Math.max(0, 100 - Math.abs(cheekToJaw - 1.2) * 120);
  const widthScore = Math.max(0, 100 - Math.abs(cheekToHeight - 0.75) * 150);
  const score = Math.round(tapScore * 0.6 + widthScore * 0.4);
  const classification = score >= 85 ? "High Cheekbones" : score >= 68 ? "Well-Defined" : score >= 50 ? "Average Cheekbones" : "Low Definition";
  return { score, classification, cheekToJaw, cheekToHeight };
}

const Results = ({ result: r, reset }: any) => {
  const c = r.score >= 85 ? "text-emerald-400" : r.score >= 68 ? "text-indigo-400" : r.score >= 50 ? "text-amber-400" : "text-red-400";
  const ring = r.score >= 85 ? "border-emerald-500" : r.score >= 68 ? "border-indigo-500" : r.score >= 50 ? "border-amber-500" : "border-red-500";
  return (
    <div className="space-y-5">
      <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-8 flex flex-col sm:flex-row items-center gap-8">
        <div className={`w-32 h-32 rounded-full border-4 ${ring} flex flex-col items-center justify-center shrink-0`}>
          <span className={`text-4xl font-black ${c}`}>{r.score}</span>
          <span className="text-xs text-slate-400">/100</span>
        </div>
        <div>
          <p className={`text-sm font-bold uppercase tracking-wider mb-2 ${c}`}>{r.classification}</p>
          <p className="text-slate-300 text-sm">Cheekbone score is based on your cheekbone-to-jaw ratio ({r.cheekToJaw.toFixed(2)}, ideal &gt;1.2) and cheekbone-to-face-height ratio ({r.cheekToHeight.toFixed(2)}, ideal ~0.75). Prominent cheekbones wider than the jaw create the desirable V-tapered face shape.</p>
        </div>
      </div>
      <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6">
        <h3 className="text-white font-bold mb-4">Cheekbone Measurements</h3>
        {[
          { label: "Cheekbone / Jaw Width Ratio", value: r.cheekToJaw.toFixed(2), ideal: "> 1.20", good: r.cheekToJaw > 1.15 },
          { label: "Cheekbone / Face Height Ratio", value: r.cheekToHeight.toFixed(2), ideal: "0.70–0.80", good: r.cheekToHeight >= 0.68 && r.cheekToHeight <= 0.82 },
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

export const CheekboneWidthPage: React.FC = () => {
  return (
    <>
      <SEO title="Cheekbone Width Analyzer — Free AI Cheekbone Prominence Calculator | Facemaxify" description="Analyze your cheekbone prominence free with AI. Measure your cheekbone-to-jaw ratio and cheekbone width to see how your cheekbones compare to aesthetic standards." keywords="cheekbone analyzer, cheekbone width ratio, cheekbone prominence calculator, high cheekbones test, cheekbone to jaw ratio, cheekbone analysis" canonicalUrl="https://facemaxify.com/tools/cheekbone-width" schema={[{ "@context": "https://schema.org", "@type": "WebApplication", name: "Cheekbone Width Analyzer", url: "https://facemaxify.com/tools/cheekbone-width", isAccessibleForFree: true, offers: { "@type": "Offer", price: "0" } }] as any} />
      <div className="min-h-screen bg-[#050510] text-white">
        <Navbar />
        <section className="max-w-4xl mx-auto px-4 pt-14 pb-4 text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-5">Free · No Signup</span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-4">Cheekbone Width Analyzer</h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">Upload your photo to measure your cheekbone-to-jaw ratio and cheekbone prominence. Find out if you have the V-taper facial structure associated with high cheekbones.</p>
        </section>
        <PhotoAnalyzerShell onAnalyze={calculate} renderResults={(r, reset) => <Results result={r} reset={reset} />} analyzeLabel="Analyze My Cheekbones" />
        <ToolArticle slug="cheekbone-width" />
      </div>
    </>
  );
};

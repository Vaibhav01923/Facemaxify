import React from "react";
import { SEO } from "../components/SEO";
import { Navbar } from "../components/Navbar";
import { ToolArticle } from "../components/tools/ToolArticle";
import { PhotoAnalyzerShell } from "../components/tools/PhotoAnalyzerShell";

function dist(a: any, b: any) { return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2); }

function calculate(lm: any[]) {
  const foreheadTopY = lm[10].y;
  const browY = (lm[105].y + lm[334].y) / 2;
  const chinY = lm[152].y;
  const faceH = Math.abs(chinY - foreheadTopY) || 1;
  const foreheadH = Math.abs(browY - foreheadTopY);
  const foreheadRatio = foreheadH / faceH;
  const faceW = dist(lm[234], lm[454]);
  // Approx forehead width using temporal landmarks (21 = left temporal, 251 = right temporal)
  const foreheadW = dist(lm[21], lm[251]);
  const foreheadWidthRatio = foreheadW / faceW;
  const heightScore = Math.max(0, 100 - Math.abs(foreheadRatio - 0.33) * 300);
  const widthScore = Math.max(0, 100 - Math.abs(foreheadWidthRatio - 0.85) * 200);
  const score = Math.round(heightScore * 0.5 + widthScore * 0.5);
  const classification = foreheadRatio > 0.40 ? "High Forehead" : foreheadRatio > 0.28 ? "Balanced Forehead" : "Low Forehead";
  return { score, classification, foreheadRatio, foreheadWidthRatio };
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
          <p className="text-slate-300 text-sm">Your forehead is <strong>{(r.foreheadRatio * 100).toFixed(1)}%</strong> of your visible face height (ideal ~33%) and <strong>{(r.foreheadWidthRatio * 100).toFixed(1)}%</strong> of your full face width (ideal ~85%).</p>
        </div>
      </div>
      <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6">
        {[
          { label: "Forehead Height / Face Height", value: `${(r.foreheadRatio * 100).toFixed(1)}%`, ideal: "~33%", good: r.foreheadRatio >= 0.27 && r.foreheadRatio <= 0.38 },
          { label: "Forehead Width / Face Width", value: `${(r.foreheadWidthRatio * 100).toFixed(1)}%`, ideal: "~85%", good: r.foreheadWidthRatio >= 0.78 && r.foreheadWidthRatio <= 0.92 },
        ].map(m => (
          <div key={m.label} className="flex justify-between py-3 border-b border-white/5 last:border-0 text-sm">
            <span className="text-slate-400">{m.label}</span>
            <span className={`font-bold ${m.good ? "text-emerald-400" : "text-amber-400"}`}>{m.value} <span className="text-slate-600 text-xs font-normal">ideal: {m.ideal}</span></span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ForeheadRatioPage: React.FC = () => {
  return (
    <>
      <SEO title="Forehead Ratio Calculator — Free AI Forehead Size Analyzer | Facemaxify" description="Calculate your forehead ratio free with AI. Measure your forehead height and width proportions to see if you have a high, low, or balanced forehead relative to your face." keywords="forehead ratio calculator, forehead width ratio, forehead size calculator, high forehead test, forehead proportion analyzer, forehead height calculator" canonicalUrl="https://facemaxify.com/tools/forehead-ratio" schema={[{ "@context": "https://schema.org", "@type": "WebApplication", name: "Forehead Ratio Calculator", url: "https://facemaxify.com/tools/forehead-ratio", isAccessibleForFree: true, offers: { "@type": "Offer", price: "0" } }] as any} />
      <div className="min-h-screen bg-[#050510] text-white">
        <Navbar />
        <section className="max-w-4xl mx-auto px-4 pt-14 pb-4 text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-5">Free · No Signup</span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-4">Forehead Ratio Calculator</h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">Upload your photo to measure your forehead height and width proportions. Find out if you have a high forehead, low forehead, or the balanced ideal — and what it means aesthetically.</p>
        </section>
        <PhotoAnalyzerShell onAnalyze={calculate} renderResults={(r, reset) => <Results result={r} reset={reset} />} analyzeLabel="Analyze My Forehead" />
        <ToolArticle slug="forehead-ratio" />
      </div>
    </>
  );
};

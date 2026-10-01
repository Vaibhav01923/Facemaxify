import React from "react";
import { SEO } from "../components/SEO";
import { Navbar } from "../components/Navbar";
import { ToolArticle } from "../components/tools/ToolArticle";
import { PhotoAnalyzerShell } from "../components/tools/PhotoAnalyzerShell";

function calculate(lm: any[]) {
  const noseBaseY = lm[94].y;
  const cupidsBowY = lm[0].y; // top of upper lip
  const chinY = lm[152].y;
  const philtrumH = Math.abs(cupidsBowY - noseBaseY);
  const lowerThirdH = Math.abs(chinY - noseBaseY) || 1;
  const ratio = philtrumH / lowerThirdH;
  // Ideal philtrum: ~0.20–0.25 of lower third (short philtrum is aesthetically preferred)
  const score = Math.max(0, Math.round(100 - Math.abs(ratio - 0.22) * 350));
  const classification = ratio < 0.18 ? "Very Short Philtrum" : ratio < 0.25 ? "Ideal Short Philtrum" : ratio < 0.32 ? "Average Philtrum" : "Long Philtrum";
  const verdict = ratio > 0.30 ? "A shorter philtrum is generally preferred aesthetically — it makes the upper lip appear fuller and the lips closer to the nose." : ratio < 0.18 ? "Your philtrum is very short — the lips appear very close to the nose." : "Your philtrum length is in the attractive range.";
  return { score, classification, ratio, verdict };
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
          <p className="text-slate-300 text-sm">Philtrum is <strong>{(r.ratio * 100).toFixed(1)}%</strong> of lower third height (ideal 20–25%). {r.verdict}</p>
        </div>
      </div>
      <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 text-sm">
        <div className="flex justify-between py-3 text-slate-400">
          <span>Philtrum / Lower Third Ratio</span>
          <span className={`font-bold ${r.score >= 82 ? "text-emerald-400" : "text-amber-400"}`}>{(r.ratio * 100).toFixed(1)}% <span className="text-slate-600 font-normal">ideal: 20–25%</span></span>
        </div>
      </div>
    </div>
  );
};

export const PhiltrumRatioPage: React.FC = () => {
  return (
    <>
      <SEO title="Philtrum Length Ratio — Free AI Philtrum Analyzer | Facemaxify" description="Measure your philtrum length ratio free with AI. Find out if your philtrum is short, ideal, or long relative to your lower face — and what it means for your lip appearance." keywords="philtrum length ratio, philtrum calculator, philtrum analyzer, philtrum ratio, short philtrum test, long philtrum, philtrum to lower third ratio" canonicalUrl="https://facemaxify.com/tools/philtrum-ratio" schema={[{ "@context": "https://schema.org", "@type": "WebApplication", name: "Philtrum Ratio Analyzer", url: "https://facemaxify.com/tools/philtrum-ratio", isAccessibleForFree: true, offers: { "@type": "Offer", price: "0" } }] as any} />
      <div className="min-h-screen bg-[#050510] text-white">
        <Navbar />
        <section className="max-w-4xl mx-auto px-4 pt-14 pb-4 text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-5">Free · No Signup</span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-4">Philtrum Length Analyzer</h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">Upload your photo to measure your philtrum-to-lower-face ratio. Find out if you have a short, ideal, or long philtrum — and how it affects the appearance of your lips.</p>
        </section>
        <PhotoAnalyzerShell onAnalyze={calculate} renderResults={(r, reset) => <Results result={r} reset={reset} />} analyzeLabel="Measure My Philtrum" />
        <ToolArticle slug="philtrum-ratio" />
      </div>
    </>
  );
};

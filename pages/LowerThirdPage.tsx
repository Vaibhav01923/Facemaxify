import React from "react";
import { SEO } from "../components/SEO";
import { Navbar } from "../components/Navbar";
import { ToolArticle } from "../components/tools/ToolArticle";
import { PhotoAnalyzerShell } from "../components/tools/PhotoAnalyzerShell";

function calculate(lm: any[]) {
  const noseBaseY = lm[94].y;
  const cupidsBowY = lm[0].y;
  const lowerLipY = lm[17].y;
  const chinY = lm[152].y;
  const lowerThirdH = Math.abs(chinY - noseBaseY) || 1;
  const philtrumH = Math.abs(cupidsBowY - noseBaseY);
  const lipsH = Math.abs(lowerLipY - cupidsBowY);
  const chinH = Math.abs(chinY - lowerLipY);
  const philtrumPct = (philtrumH / lowerThirdH) * 100;
  const lipsPct = (lipsH / lowerThirdH) * 100;
  const chinPct = (chinH / lowerThirdH) * 100;
  // Ideal: philtrum ~22%, lips ~44%, chin ~34%
  const score = Math.max(0, Math.round(100 - (Math.abs(philtrumPct - 22) + Math.abs(lipsPct - 44) + Math.abs(chinPct - 34)) * 1.5));
  const classification = score >= 80 ? "Ideal Lower Third" : score >= 62 ? "Well-Balanced" : score >= 45 ? "Slight Imbalance" : "Notable Imbalance";
  return { score, classification, philtrumPct, lipsPct, chinPct };
}

const Results = ({ result: r, reset }: any) => {
  const c = r.score >= 80 ? "text-emerald-400" : r.score >= 62 ? "text-indigo-400" : r.score >= 45 ? "text-amber-400" : "text-red-400";
  const ring = r.score >= 80 ? "border-emerald-500" : r.score >= 62 ? "border-indigo-500" : r.score >= 45 ? "border-amber-500" : "border-red-500";
  const zones = [
    { label: "Philtrum", pct: r.philtrumPct, ideal: 22 },
    { label: "Lips (cupid's bow to lower lip)", pct: r.lipsPct, ideal: 44 },
    { label: "Chin (lower lip to chin tip)", pct: r.chinPct, ideal: 34 },
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
          <p className="text-slate-300 text-sm">The lower third ideally divides into: philtrum (~22%), lips (~44%), and chin (~34%). Your breakdown shows how each zone compares to the classical ideal.</p>
        </div>
      </div>
      <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6">
        <h3 className="text-white font-bold mb-4">Lower Third Breakdown</h3>
        {zones.map(z => {
          const dev = Math.abs(z.pct - z.ideal);
          const col = dev < 5 ? "bg-emerald-500" : dev < 10 ? "bg-indigo-500" : dev < 18 ? "bg-amber-500" : "bg-red-500";
          return (
            <div key={z.label} className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-300">{z.label}</span>
                <span className="text-slate-400">{z.pct.toFixed(1)}% <span className="text-slate-600">(ideal ~{z.ideal}%)</span></span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full ${col} rounded-full`} style={{ width: `${Math.min(100, z.pct * 2)}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const LowerThirdPage: React.FC = () => {
  return (
    <>
      <SEO title="Lower Third Face Analysis — Free AI Lower Face Proportion Calculator | Facemaxify" description="Analyze your lower third face proportions free with AI. Measure your philtrum, lips, and chin zones to see how your lower face compares to the aesthetic ideal proportion." keywords="lower third face analysis, lower third ratio, lower third calculator, lower face proportion, philtrum lip chin ratio, lower third face proportion" canonicalUrl="https://facemaxify.com/tools/lower-third" schema={[{ "@context": "https://schema.org", "@type": "WebApplication", name: "Lower Third Face Analyzer", url: "https://facemaxify.com/tools/lower-third", isAccessibleForFree: true, offers: { "@type": "Offer", price: "0" } }] as any} />
      <div className="min-h-screen bg-[#050510] text-white">
        <Navbar />
        <section className="max-w-4xl mx-auto px-4 pt-14 pb-4 text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-5">Free · No Signup</span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-4">Lower Third Face Analysis</h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">Upload your photo to measure how your philtrum, lips, and chin divide your lower third — and compare it to the classical ideal proportions used in facial aesthetics.</p>
        </section>
        <PhotoAnalyzerShell onAnalyze={calculate} renderResults={(r, reset) => <Results result={r} reset={reset} />} analyzeLabel="Analyze My Lower Third" />
        <ToolArticle slug="lower-third" />
      </div>
    </>
  );
};

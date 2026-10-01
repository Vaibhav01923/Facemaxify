import React from "react";
import { SEO } from "../components/SEO";
import { Navbar } from "../components/Navbar";
import { ToolArticle } from "../components/tools/ToolArticle";
import { PhotoAnalyzerShell } from "../components/tools/PhotoAnalyzerShell";

function dist(a: any, b: any) { return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2); }

function calculate(lm: any[]) {
  const bizygomatic = dist(lm[234], lm[454]);
  const browToLip = Math.abs(lm[0].y - (lm[105].y + lm[334].y) / 2);
  const faceH = dist(lm[10], lm[152]);
  const fWHR = bizygomatic / (browToLip || 1);
  const fullRatio = bizygomatic / (faceH || 1);
  // fWHR research: 1.8–2.2 is average, >2.2 associated with dominance
  const fwhrScore = fWHR >= 1.6 && fWHR <= 2.4 ? Math.round(100 - Math.abs(fWHR - 2.0) * 40) : Math.max(0, Math.round(80 - Math.abs(fWHR - 2.0) * 30));
  const score = Math.min(100, Math.max(0, fwhrScore));
  const classification = fWHR > 2.2 ? "Wide, Dominant Face" : fWHR > 1.8 ? "Balanced Proportions" : fWHR > 1.4 ? "Narrow, Elongated Face" : "Very Narrow Face";
  return { score, classification, fWHR, fullRatio };
}

const Results = ({ result: r, reset }: any) => {
  const c = r.score >= 85 ? "text-emerald-400" : r.score >= 68 ? "text-indigo-400" : "text-amber-400";
  const ring = r.score >= 85 ? "border-emerald-500" : r.score >= 68 ? "border-indigo-500" : "border-amber-500";
  return (
    <div className="space-y-5">
      <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-8 flex flex-col sm:flex-row items-center gap-8">
        <div className={`w-32 h-32 rounded-full border-4 ${ring} flex flex-col items-center justify-center shrink-0`}>
          <span className={`text-4xl font-black ${c}`}>{r.score}</span>
          <span className="text-xs text-slate-400">/100</span>
        </div>
        <div>
          <p className={`text-sm font-bold uppercase tracking-wider mb-2 ${c}`}>{r.classification}</p>
          <p className="text-slate-300 text-sm">Your facial width-to-height ratio (fWHR) is <strong>{r.fWHR.toFixed(2)}</strong>. Research links higher fWHR to perceived dominance and leadership qualities. The average range is 1.8–2.2.</p>
        </div>
      </div>
      <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6">
        <h3 className="text-white font-bold mb-4">Measurements</h3>
        {[
          { label: "Facial Width-to-Height Ratio (fWHR)", value: r.fWHR.toFixed(2), ideal: "1.8–2.2", good: r.fWHR >= 1.8 && r.fWHR <= 2.2 },
          { label: "Full Face Width/Height Ratio", value: r.fullRatio.toFixed(2), ideal: "~0.75", good: r.fullRatio >= 0.65 && r.fullRatio <= 0.85 },
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

export const FacialWidthHeightPage: React.FC = () => {
  return (
    <>
      <SEO title="Facial Width-Height Ratio Calculator (fWHR) — Free AI Face Shape Analyzer | Facemaxify" description="Calculate your facial width-to-height ratio (fWHR) free with AI. Measure your bizygomatic width versus face height and see what your face shape says about you." keywords="facial width height ratio, fwhr calculator, face width height ratio, fwhr face, face width ratio calculator, bizygomatic width calculator" canonicalUrl="https://facemaxify.com/tools/facial-width-height" schema={[{ "@context": "https://schema.org", "@type": "WebApplication", name: "Facial Width-Height Ratio Calculator", url: "https://facemaxify.com/tools/facial-width-height", isAccessibleForFree: true, offers: { "@type": "Offer", price: "0" } }] as any} />
      <div className="min-h-screen bg-[#050510] text-white">
        <Navbar />
        <section className="max-w-4xl mx-auto px-4 pt-14 pb-4 text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-5">Free · No Signup</span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-4">Facial Width-Height Ratio</h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">Calculate your fWHR — the biometric ratio linked to perceived dominance, leadership, and facial attractiveness. Upload your photo for an instant measurement.</p>
        </section>
        <PhotoAnalyzerShell onAnalyze={calculate} renderResults={(r, reset) => <Results result={r} reset={reset} />} analyzeLabel="Calculate My fWHR" />
        <ToolArticle slug="facial-width-height" />
      </div>
    </>
  );
};

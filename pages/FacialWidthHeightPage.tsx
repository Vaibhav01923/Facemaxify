import React from "react";
import { SEO } from "../components/SEO";
import { Navbar } from "../components/Navbar";
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
  const faq = {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: [
      { "@type": "Question", name: "What is facial width-to-height ratio (fWHR)?", acceptedAnswer: { "@type": "Answer", text: "Facial width-to-height ratio (fWHR) is a biometric measure calculated by dividing the maximum facial width (bizygomatic width, cheekbone to cheekbone) by the upper face height (from the brow line to the top of the upper lip). fWHR has been widely studied in evolutionary psychology as a predictor of perceived dominance, aggression, and leadership ability." } },
      { "@type": "Question", name: "What fWHR ratio is considered attractive?", acceptedAnswer: { "@type": "Answer", text: "Research suggests an fWHR of approximately 1.8–2.2 is average and balanced. Higher ratios (above 2.2) are associated with a wider, more dominant facial appearance. For men, slightly higher ratios are often associated with perceived strength. For women, slightly lower ratios (more delicate facial features) tend to score higher in attractiveness studies." } },
      { "@type": "Question", name: "Does face shape affect fWHR?", acceptedAnswer: { "@type": "Answer", text: "Yes. Round and square faces tend to have higher fWHR values (wider relative to height). Oval and oblong faces have lower fWHR values (narrower relative to height). Diamond and heart-shaped faces have moderate fWHR with prominent cheekbones." } },
      { "@type": "Question", name: "Is fWHR the same as face width ratio?", acceptedAnswer: { "@type": "Answer", text: "Not exactly. The true fWHR uses bizygomatic width divided by upper face height (brow to upper lip). 'Face width ratio' more loosely refers to total face width divided by total face height. This tool measures both." } },
    ]
  };
  return (
    <>
      <SEO title="Facial Width-Height Ratio Calculator (fWHR) — Free AI Face Shape Analyzer | Facemaxify" description="Calculate your facial width-to-height ratio (fWHR) free with AI. Measure your bizygomatic width versus face height and see what your face shape says about you." keywords="facial width height ratio, fwhr calculator, face width height ratio, fwhr face, face width ratio calculator, bizygomatic width calculator" canonicalUrl="https://facemaxify.com/tools/facial-width-height" schema={[faq, { "@context": "https://schema.org", "@type": "WebApplication", name: "Facial Width-Height Ratio Calculator", url: "https://facemaxify.com/tools/facial-width-height", isAccessibleForFree: true, offers: { "@type": "Offer", price: "0" } }] as any} />
      <div className="min-h-screen bg-[#050510] text-white">
        <Navbar />
        <section className="max-w-4xl mx-auto px-4 pt-14 pb-4 text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-5">Free · No Signup</span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-4">Facial Width-Height Ratio</h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">Calculate your fWHR — the biometric ratio linked to perceived dominance, leadership, and facial attractiveness. Upload your photo for an instant measurement.</p>
        </section>
        <PhotoAnalyzerShell onAnalyze={calculate} renderResults={(r, reset) => <Results result={r} reset={reset} />} analyzeLabel="Calculate My fWHR" />
        <section className="bg-slate-950/60 border-t border-white/5 py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-5">What Is the Facial Width-to-Height Ratio?</h2>
            <p className="text-slate-400 mb-5 leading-relaxed">The <strong className="text-white">facial width-to-height ratio (fWHR)</strong> is one of the most researched biometric facial measurements in evolutionary psychology. It is calculated by dividing the maximum facial width (bizygomatic width — cheekbone to cheekbone) by the upper facial height (from the brow line to the upper lip). Unlike subjective beauty assessments, fWHR is a hard geometric measurement with documented correlations to social perception.</p>
            <h3 className="text-xl font-bold text-white mb-3 mt-8">fWHR and Perceived Dominance</h3>
            <p className="text-slate-400 mb-5 leading-relaxed">Multiple peer-reviewed studies (Stirrat & Perrett 2010; Carré & McCormick 2008) have demonstrated that men with higher fWHR are perceived as more dominant, aggressive, and leadership-oriented — even in brief (under 1 second) exposures. CEOs of Fortune 500 companies show higher average fWHR than the general population. This metric is also associated with testosterone exposure during prenatal development.</p>
            <h3 className="text-xl font-bold text-white mb-3 mt-8">fWHR and Facial Attractiveness</h3>
            <p className="text-slate-400 mb-5 leading-relaxed">For men, moderate-to-high fWHR (1.9–2.3) tends to score well in attractiveness ratings as it suggests facial masculinity and structure. For women, slightly lower fWHR is often preferred in attractiveness studies, as it is associated with facial delicacy. The complete Facemaxify facial analysis incorporates fWHR alongside 14 other measurements for a holistic score.</p>
            <h2 className="text-2xl font-bold text-white mt-10 mb-5">FAQ</h2>
            {[
              { q: "What is a high fWHR?", a: "fWHR above 2.2 is considered high — a wide, broader face relative to its height. Associated with dominant, powerful facial appearance." },
              { q: "Is higher fWHR better?", a: "For perceived dominance in men: yes. For perceived attractiveness in women: generally no — lower fWHR is associated with more delicate, feminine features. The 'better' value is context-dependent." },
              { q: "What face shapes have high fWHR?", a: "Round, square, and wide-set faces have higher fWHR. Oval and oblong (long) faces have lower fWHR. Diamond faces have high cheekbone width but narrower overall, creating moderate fWHR." },
              { q: "Is the fWHR calculator free?", a: "Yes — completely free, no account needed." },
            ].map(({ q, a }) => <div key={q} className="mb-4 p-5 bg-slate-900/40 rounded-2xl border border-white/5"><h4 className="text-white font-bold mb-2">{q}</h4><p className="text-slate-400 text-sm">{a}</p></div>)}
          </div>
        </section>
      </div>
    </>
  );
};

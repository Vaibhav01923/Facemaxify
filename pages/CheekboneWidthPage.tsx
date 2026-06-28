import React from "react";
import { SEO } from "../components/SEO";
import { Navbar } from "../components/Navbar";
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
  const faq = {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: [
      { "@type": "Question", name: "What makes high cheekbones attractive?", acceptedAnswer: { "@type": "Answer", text: "High, prominent cheekbones create the widest horizontal point of the face in the midface zone, causing the face to taper toward the jaw. This V-shaped or heart-shaped facial structure (wide at cheekbones, narrow at jaw) is consistently rated as attractive across cultures. It also creates natural shadow under the cheekbone, giving the face a sculpted, defined appearance." } },
      { "@type": "Question", name: "How is cheekbone prominence measured?", acceptedAnswer: { "@type": "Answer", text: "We measure cheekbone width using the bizygomatic landmarks (outermost facial points at cheekbone level) and compare it to jaw width (distance between jaw angles) and face height. A cheekbone-to-jaw ratio above 1.20 indicates prominent cheekbones that are significantly wider than the jaw." } },
      { "@type": "Question", name: "Can I enhance my cheekbones?", acceptedAnswer: { "@type": "Answer", text: "Yes. Cheek filler injections can add volume and projection to the cheekbone area. Reducing body fat percentage often reveals existing cheekbone structure. Contouring makeup (darkening below the cheekbone) creates the visual impression of higher, more prominent cheekbones. Surgical options include cheekbone implants." } },
      { "@type": "Question", name: "Is the cheekbone analyzer free?", acceptedAnswer: { "@type": "Answer", text: "Yes — free and instant. Upload a front-facing photo and get your cheekbone score with no account required." } },
    ]
  };
  return (
    <>
      <SEO title="Cheekbone Width Analyzer — Free AI Cheekbone Prominence Calculator | Facemaxify" description="Analyze your cheekbone prominence free with AI. Measure your cheekbone-to-jaw ratio and cheekbone width to see how your cheekbones compare to aesthetic standards." keywords="cheekbone analyzer, cheekbone width ratio, cheekbone prominence calculator, high cheekbones test, cheekbone to jaw ratio, cheekbone analysis" canonicalUrl="https://facemaxify.com/tools/cheekbone-width" schema={[faq, { "@context": "https://schema.org", "@type": "WebApplication", name: "Cheekbone Width Analyzer", url: "https://facemaxify.com/tools/cheekbone-width", isAccessibleForFree: true, offers: { "@type": "Offer", price: "0" } }] as any} />
      <div className="min-h-screen bg-[#050510] text-white">
        <Navbar />
        <section className="max-w-4xl mx-auto px-4 pt-14 pb-4 text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-5">Free · No Signup</span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-4">Cheekbone Width Analyzer</h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">Upload your photo to measure your cheekbone-to-jaw ratio and cheekbone prominence. Find out if you have the V-taper facial structure associated with high cheekbones.</p>
        </section>
        <PhotoAnalyzerShell onAnalyze={calculate} renderResults={(r, reset) => <Results result={r} reset={reset} />} analyzeLabel="Analyze My Cheekbones" />
        <section className="bg-slate-950/60 border-t border-white/5 py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-5">Why Cheekbone Width Matters</h2>
            <p className="text-slate-400 mb-5 leading-relaxed">Cheekbone prominence is one of the most universal beauty markers across cultures. <strong className="text-white">High cheekbones</strong> — cheekbones that are the widest point of the face and sit higher in the midface — create a natural shadow effect that makes the face appear sculpted and defined. When the cheekbones are significantly wider than the jaw, the face develops the coveted V-tapered structure associated with both masculine and feminine beauty ideals.</p>
            <h3 className="text-xl font-bold text-white mb-3 mt-8">The Cheekbone-to-Jaw Ratio</h3>
            <p className="text-slate-400 mb-5 leading-relaxed">The key metric is the ratio of cheekbone width to jaw width. A ratio above 1.20 means the cheekbones are at least 20% wider than the jaw — creating a strong taper. Ratios below 1.0 mean the jaw is equal to or wider than the cheekbones, creating a square or bottom-heavy facial structure. Models and highly attractive individuals typically show ratios between 1.15 and 1.35.</p>
            <h3 className="text-xl font-bold text-white mb-3 mt-8">Cheekbone Width in the Full Facial Analysis</h3>
            <p className="text-slate-400 mb-5 leading-relaxed">The cheekbone measurement feeds into multiple other metrics in the full Facemaxify analysis — including the facial width-to-height ratio (fWHR), jawline score, and overall facial structure rating. The complete report gives you all these measurements together with a personalized improvement protocol.</p>
            <h2 className="text-2xl font-bold text-white mt-10 mb-5">FAQ</h2>
            {[
              { q: "What is a good cheekbone-to-jaw ratio?", a: "Above 1.20 is excellent — cheekbones are at least 20% wider than the jaw. 1.10–1.20 is well-defined. Below 1.05 indicates minimal tapering." },
              { q: "Do cheekbones matter more for men or women?", a: "Prominent cheekbones are desirable in both sexes, though the ideal structure differs slightly. Men benefit from wider, more angular cheekbones. Women benefit from higher, more rounded cheekbone placement." },
              { q: "What improves cheekbone appearance?", a: "Reducing body fat, cheek filler, contouring makeup, and cheek implants are the main options from lifestyle to clinical. Bone structure itself is genetic and fixed after ~25 years of age." },
              { q: "Is the cheekbone analyzer free?", a: "Yes — upload a photo, get an instant result. No signup required." },
            ].map(({ q, a }) => <div key={q} className="mb-4 p-5 bg-slate-900/40 rounded-2xl border border-white/5"><h4 className="text-white font-bold mb-2">{q}</h4><p className="text-slate-400 text-sm">{a}</p></div>)}
          </div>
        </section>
      </div>
    </>
  );
};

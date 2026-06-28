import React from "react";
import { SEO } from "../components/SEO";
import { Navbar } from "../components/Navbar";
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
  const faq = {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: [
      { "@type": "Question", name: "What is the ideal lip ratio?", acceptedAnswer: { "@type": "Answer", text: "The ideal lip ratio is approximately 1:1.6 (upper lip to lower lip height), meaning the lower lip should be about 1.5 to 1.6 times the height of the upper lip. This is related to the golden ratio and creates the 'full yet balanced' look considered most attractive across multiple cultures. Mouths that are too even (1:1) can look flat, while too uneven (1:3+) can look imbalanced." } },
      { "@type": "Question", name: "What is ideal mouth width?", acceptedAnswer: { "@type": "Answer", text: "Classically, the ideal mouth width is approximately 1.5 times the inter-eye distance — the gap between the inner eye corners. This creates balance between the eye zone and lip zone. A mouth that is too narrow relative to the eyes can appear pinched; too wide can appear disproportionate." } },
      { "@type": "Question", name: "How can I improve my lip ratio?", acceptedAnswer: { "@type": "Answer", text: "Lip filler injections can increase upper or lower lip volume to achieve a better ratio. Lip blushing (permanent makeup) can enhance the appearance of the upper lip. Contouring techniques using lip liner above the natural lip line can visually enhance upper lip fullness without procedures." } },
      { "@type": "Question", name: "Is the lip ratio analyzer free?", acceptedAnswer: { "@type": "Answer", text: "Yes — completely free, no account needed. Upload a photo and get your lip ratio score instantly." } },
    ]
  };
  return (
    <>
      <SEO title="Lip Ratio Analyzer — Free AI Lip Proportion Calculator | Facemaxify" description="Analyze your lip ratio free with AI. Measure your upper-to-lower lip ratio and mouth width proportion. Find out if your lips match the golden ratio aesthetic standard." keywords="lip ratio analyzer, lip ratio calculator, lip proportion analyzer, lip harmony, upper lower lip ratio, mouth width ratio, ideal lip ratio" canonicalUrl="https://facemaxify.com/tools/lip-ratio" schema={[faq, { "@context": "https://schema.org", "@type": "WebApplication", name: "Lip Ratio Analyzer", url: "https://facemaxify.com/tools/lip-ratio", isAccessibleForFree: true, offers: { "@type": "Offer", price: "0" } }] as any} />
      <div className="min-h-screen bg-[#050510] text-white">
        <Navbar />
        <section className="max-w-4xl mx-auto px-4 pt-14 pb-4 text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-5">Free · No Signup</span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-4">Lip Ratio Analyzer</h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">Upload your photo to measure your upper-to-lower lip ratio and mouth width proportion — and see how they compare to the golden ratio lip standard.</p>
        </section>
        <PhotoAnalyzerShell onAnalyze={calculate} renderResults={(r, reset) => <Results result={r} reset={reset} />} analyzeLabel="Analyze My Lip Ratio" />
        <section className="bg-slate-950/60 border-t border-white/5 py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-5">What Is the Lip Ratio?</h2>
            <p className="text-slate-400 mb-5 leading-relaxed">The <strong className="text-white">lip ratio</strong> measures the proportional relationship between the height of the upper lip and the height of the lower lip. The aesthetic standard — supported by both classical proportion theory and modern cosmetic surgery research — is that the lower lip should be approximately 1.5 to 1.6 times the height of the upper lip. This proportion appears repeatedly across faces rated as highly attractive, creating that balance of "full yet defined."</p>
            <h3 className="text-xl font-bold text-white mb-3 mt-8">Upper Lip, Lower Lip, and the Golden Ratio</h3>
            <p className="text-slate-400 mb-5 leading-relaxed">The 1:1.618 ratio (phi, the golden ratio) appears in lip proportions just as it does elsewhere on the face. A lower lip that is 1.6× the height of the upper lip matches this ratio precisely. Lips that trend 1:1 (even) can appear flat; ratios beyond 1:2.5 (very dominant lower lip) can look unbalanced. Most highly desired lip shapes fall in the 1:1.4 to 1:1.8 range.</p>
            <h3 className="text-xl font-bold text-white mb-3 mt-8">Mouth Width Proportion</h3>
            <p className="text-slate-400 mb-5 leading-relaxed">Beyond the lip ratio itself, mouth width is crucial. The ideal mouth is approximately 1.5× the inter-eye distance. This creates horizontal balance between the eye zone and lip zone, anchoring the lower face. A narrow mouth relative to wide-set eyes can look pinched; an overly wide mouth relative to close-set eyes can look disproportionate.</p>
            <h2 className="text-2xl font-bold text-white mt-10 mb-5">FAQ</h2>
            {[
              { q: "What is an ideal upper-to-lower lip ratio?", a: "The most attractive ratio is upper:lower of approximately 0.65 (or 1:1.5). The lower lip should be meaningfully fuller. Ratios from 0.55 to 0.80 are generally considered well-proportioned." },
              { q: "Do lip proportions affect attractiveness?", a: "Significantly — studies show fuller lips are consistently rated as more attractive, but balance matters too. A very full upper lip with a thin lower lip, or vice versa, scores lower than balanced fullness." },
              { q: "How does this connect to the full analysis?", a: "Lip ratio is one of 15+ measurements in the full Facemaxify report. The complete analysis includes golden ratio, symmetry, canthal tilt, jawline, and a full improvement plan." },
              { q: "Is the lip analyzer free?", a: "Yes — free, instant, no signup required." },
            ].map(({ q, a }) => <div key={q} className="mb-4 p-5 bg-slate-900/40 rounded-2xl border border-white/5"><h4 className="text-white font-bold mb-2">{q}</h4><p className="text-slate-400 text-sm">{a}</p></div>)}
          </div>
        </section>
      </div>
    </>
  );
};

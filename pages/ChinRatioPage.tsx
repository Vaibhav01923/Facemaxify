import React from "react";
import { SEO } from "../components/SEO";
import { Navbar } from "../components/Navbar";
import { PhotoAnalyzerShell } from "../components/tools/PhotoAnalyzerShell";

function dist(a: any, b: any) { return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2); }

function calculate(lm: any[]) {
  const noseBaseY = lm[94].y;
  const lowerLipY = lm[17].y;
  const chinY = lm[152].y;
  const lowerThirdH = Math.abs(chinY - noseBaseY) || 1;
  const chinH = Math.abs(chinY - lowerLipY);
  const chinRatio = chinH / lowerThirdH; // ideal ~0.40–0.50
  const chinW = dist(lm[149], lm[378]); // approx chin width
  const jawW = dist(lm[172], lm[397]);
  const chinToJaw = chinW / (jawW || 1); // ideal ~0.45–0.55
  const ratioScore = Math.max(0, 100 - Math.abs(chinRatio - 0.45) * 300);
  const widthScore = Math.max(0, 100 - Math.abs(chinToJaw - 0.50) * 200);
  const score = Math.round(ratioScore * 0.55 + widthScore * 0.45);
  const classification = score >= 85 ? "Well-Defined Chin" : score >= 68 ? "Good Chin Proportion" : score >= 52 ? "Average Chin" : chinRatio > 0.5 ? "Long Chin" : "Short/Recessed Chin";
  return { score, classification, chinRatio, chinToJaw };
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
          <p className="text-slate-300 text-sm">Chin height is <strong>{(r.chinRatio * 100).toFixed(1)}%</strong> of lower third (ideal 40–50%). Chin width is <strong>{(r.chinToJaw * 100).toFixed(1)}%</strong> of jaw width (ideal ~50%).</p>
        </div>
      </div>
      <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6">
        {[
          { label: "Chin Height / Lower Third", value: `${(r.chinRatio * 100).toFixed(1)}%`, ideal: "40–50%", good: r.chinRatio >= 0.38 && r.chinRatio <= 0.52 },
          { label: "Chin Width / Jaw Width", value: `${(r.chinToJaw * 100).toFixed(1)}%`, ideal: "~50%", good: r.chinToJaw >= 0.43 && r.chinToJaw <= 0.58 },
        ].map(m => (
          <div key={m.label} className="flex justify-between py-3 border-b border-white/5 last:border-0 text-sm">
            <span className="text-slate-400">{m.label}</span>
            <span className={`font-bold ${m.good ? "text-emerald-400" : "text-amber-400"}`}>{m.value} <span className="text-slate-600 font-normal">ideal: {m.ideal}</span></span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ChinRatioPage: React.FC = () => {
  const faq = {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: [
      { "@type": "Question", name: "What is an ideal chin proportion?", acceptedAnswer: { "@type": "Answer", text: "The ideal chin height (from the bottom of the lower lip to the chin tip) is approximately 40–50% of the total lower third height (nose base to chin). In terms of width, an ideally proportioned chin is roughly 50% of jaw width — narrow enough to create a tapering effect, wide enough to avoid appearing pointed." } },
      { "@type": "Question", name: "What is a weak or recessed chin?", acceptedAnswer: { "@type": "Answer", text: "A weak or recessed chin (microgenia) is one where the chin tip does not project forward enough relative to the lips. In profile, the ideal chin tip should align roughly with the lower lip. A chin that sits behind this plane is considered recessed. From the front, a recessed chin often appears short in height and may contribute to a 'double chin' appearance even in thin individuals due to soft tissue draping." } },
      { "@type": "Question", name: "How can I improve chin projection?", acceptedAnswer: { "@type": "Answer", text: "Chin filler injections can add projection and height non-surgically. Chin implants are a surgical option for longer-lasting enhancement. Genioplasty (surgical jaw repositioning) is the most comprehensive option as it moves the actual bone. Some looksmaxxers recommend mewing and proper tongue posture to encourage forward maxillary and mandibular development over time." } },
      { "@type": "Question", name: "Is the chin ratio analyzer free?", acceptedAnswer: { "@type": "Answer", text: "Yes — free and instant, no account required." } },
    ]
  };
  return (
    <>
      <SEO title="Chin Ratio Analyzer — Free AI Chin Projection Calculator | Facemaxify" description="Analyze your chin ratio free with AI. Measure chin height, chin width, and chin-to-jaw proportion. Find out if you have an ideal chin or a weak/strong chin projection." keywords="chin ratio analyzer, chin projection calculator, chin ratio calculator, weak chin test, chin proportion analyzer, chin height ratio, chin analysis" canonicalUrl="https://facemaxify.com/tools/chin-ratio" schema={[faq, { "@context": "https://schema.org", "@type": "WebApplication", name: "Chin Ratio Analyzer", url: "https://facemaxify.com/tools/chin-ratio", isAccessibleForFree: true, offers: { "@type": "Offer", price: "0" } }] as any} />
      <div className="min-h-screen bg-[#050510] text-white">
        <Navbar />
        <section className="max-w-4xl mx-auto px-4 pt-14 pb-4 text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-5">Free · No Signup</span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-4">Chin Ratio Analyzer</h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">Upload your photo to measure your chin height and width proportions. Find out if you have an ideal, weak, or strong chin from the front view.</p>
        </section>
        <PhotoAnalyzerShell onAnalyze={calculate} renderResults={(r, reset) => <Results result={r} reset={reset} />} analyzeLabel="Analyze My Chin" />
        <section className="bg-slate-950/60 border-t border-white/5 py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-5">Chin Ratio and Lower Face Aesthetics</h2>
            <p className="text-slate-400 mb-5 leading-relaxed">The <strong className="text-white">chin ratio</strong> measures two things: how much of the lower third your chin occupies vertically, and how the chin width compares to the overall jaw width. Together these determine whether the chin creates a well-defined, tapered endpoint for the lower face — or whether it looks recessed, protruding, or disproportionate.</p>
            <h3 className="text-xl font-bold text-white mb-3 mt-8">The Chin in Looksmaxxing</h3>
            <p className="text-slate-400 mb-5 leading-relaxed">In looksmaxxing culture, chin development is considered one of the highest-leverage improvements. A well-projected chin with a defined mentolabial fold (the crease between lower lip and chin) dramatically sharpens the entire lower face profile. This is why chin augmentation is consistently one of the most requested procedures in facial aesthetic surgery — small improvements in chin projection have an outsized effect on overall facial appearance, especially in profile.</p>
            <h3 className="text-xl font-bold text-white mb-3 mt-8">Front View vs Profile</h3>
            <p className="text-slate-400 mb-5 leading-relaxed">This tool measures chin from the front view, focusing on height and width proportions. The chin's projection (forward extension) is best assessed in profile view. Both dimensions matter — a chin can look balanced from the front but recessed in profile, or vice versa. The full Facemaxify analysis covers multiple angles and dimensions.</p>
            <h2 className="text-2xl font-bold text-white mt-10 mb-5">FAQ</h2>
            {[
              { q: "What's the difference between chin height and projection?", a: "Chin height is how tall the chin is (vertical measurement from lower lip to chin tip). Chin projection is how far forward the chin extends (measured in profile). This tool measures height and width from a front-facing photo." },
              { q: "Does chin size affect jaw appearance?", a: "Yes — a well-sized chin enhances the appearance of the entire jawline. A chin that is too small makes even a wide jaw look soft; a well-proportioned chin makes a defined jaw look much sharper." },
              { q: "Is a strong chin attractive?", a: "A chin that is proportional to the jaw is most attractive. A very prominent chin can look aggressive; a recessed chin softens the lower face too much. The ideal is chin that subtly defines the lower face without being overpowering." },
              { q: "Is the chin analyzer free?", a: "Yes — no signup, no cost. Upload and get your result instantly." },
            ].map(({ q, a }) => <div key={q} className="mb-4 p-5 bg-slate-900/40 rounded-2xl border border-white/5"><h4 className="text-white font-bold mb-2">{q}</h4><p className="text-slate-400 text-sm">{a}</p></div>)}
          </div>
        </section>
      </div>
    </>
  );
};

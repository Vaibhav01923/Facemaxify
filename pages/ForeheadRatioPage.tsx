import React from "react";
import { SEO } from "../components/SEO";
import { Navbar } from "../components/Navbar";
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
  const faq = {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: [
      { "@type": "Question", name: "What is a normal forehead size?", acceptedAnswer: { "@type": "Answer", text: "A balanced forehead should be approximately one-third of total face height — the same proportion as the middle third (brow to nose) and lower third (nose to chin). In terms of face width, the forehead typically narrows slightly from cheekbone width, with an ideal forehead width of approximately 80–90% of cheekbone width." } },
      { "@type": "Question", name: "What is a high forehead?", acceptedAnswer: { "@type": "Answer", text: "A high forehead has a forehead height greater than 40% of total face height — significantly larger than the ideal one-third. This typically results from a high hairline or receding hairline. It can make the face appear longer and more top-heavy." } },
      { "@type": "Question", name: "Can I change my forehead ratio?", acceptedAnswer: { "@type": "Answer", text: "Hairline-lowering surgery (anterior hairline advancement) can reduce forehead height. Hairstyling — particularly bangs, fringe, or styles that cover part of the forehead — creates the visual impression of a lower hairline. Contouring can shade the upper forehead to reduce its visual dominance." } },
      { "@type": "Question", name: "Is the forehead ratio calculator free?", acceptedAnswer: { "@type": "Answer", text: "Yes — completely free, no account required." } },
    ]
  };
  return (
    <>
      <SEO title="Forehead Ratio Calculator — Free AI Forehead Size Analyzer | Facemaxify" description="Calculate your forehead ratio free with AI. Measure your forehead height and width proportions to see if you have a high, low, or balanced forehead relative to your face." keywords="forehead ratio calculator, forehead width ratio, forehead size calculator, high forehead test, forehead proportion analyzer, forehead height calculator" canonicalUrl="https://facemaxify.com/tools/forehead-ratio" schema={[faq, { "@context": "https://schema.org", "@type": "WebApplication", name: "Forehead Ratio Calculator", url: "https://facemaxify.com/tools/forehead-ratio", isAccessibleForFree: true, offers: { "@type": "Offer", price: "0" } }] as any} />
      <div className="min-h-screen bg-[#050510] text-white">
        <Navbar />
        <section className="max-w-4xl mx-auto px-4 pt-14 pb-4 text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-5">Free · No Signup</span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-4">Forehead Ratio Calculator</h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">Upload your photo to measure your forehead height and width proportions. Find out if you have a high forehead, low forehead, or the balanced ideal — and what it means aesthetically.</p>
        </section>
        <PhotoAnalyzerShell onAnalyze={calculate} renderResults={(r, reset) => <Results result={r} reset={reset} />} analyzeLabel="Analyze My Forehead" />
        <section className="bg-slate-950/60 border-t border-white/5 py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-5">Forehead Ratio and Facial Balance</h2>
            <p className="text-slate-400 mb-5 leading-relaxed">The <strong className="text-white">forehead ratio</strong> is measured in two dimensions: height and width. Forehead height is the vertical distance from the hairline to the eyebrows, expressed as a percentage of total face height. Forehead width is the horizontal span of the forehead, compared to the maximum face width at the cheekbones. Together, these proportions determine whether the upper third of your face is in harmony with the middle and lower thirds.</p>
            <h3 className="text-xl font-bold text-white mb-3 mt-8">High Forehead vs Low Forehead</h3>
            <p className="text-slate-400 mb-5 leading-relaxed">A <strong className="text-white">high forehead</strong> (above 40% of face height) makes the face appear elongated and top-heavy. It is most commonly caused by a naturally high hairline or hairline recession. Hairline-lowering surgery, hair transplants, or styling with bangs can visually correct this. A <strong className="text-white">low forehead</strong> (below 27%) makes the face appear compressed in the upper zone and can make the eyebrows appear to be very close to the hairline.</p>
            <h3 className="text-xl font-bold text-white mb-3 mt-8">Forehead Width and Face Shape</h3>
            <p className="text-slate-400 mb-5 leading-relaxed">A forehead that is approximately 80–90% of cheekbone width creates a natural widening effect from forehead to cheeks, then tapering to the jaw — the heart or oval face shape considered most attractive in many aesthetic frameworks. A very wide forehead (over 95% of cheekbone width) creates a square or rectangular shape.</p>
            <h2 className="text-2xl font-bold text-white mt-10 mb-5">FAQ</h2>
            {[
              { q: "Is a large forehead unattractive?", a: "Not necessarily — high foreheads are associated with intelligence and are considered attractive in many contexts. The issue is proportional balance. A forehead significantly larger than the middle or lower third creates visual imbalance." },
              { q: "What hairstyles help a high forehead?", a: "Side-swept bangs, curtain bangs, or any style that brings hair partially over the forehead reduces the apparent height. Avoiding styles that pull all hair back exposes the full forehead." },
              { q: "Does the forehead ratio affect the face rating?", a: "Yes — the forehead contributes to facial thirds balance, which is one metric in the full Facemaxify analysis. The complete report includes all facial thirds, ratios, and a personalized improvement plan." },
              { q: "Is the forehead analyzer free?", a: "Yes — completely free, no signup needed." },
            ].map(({ q, a }) => <div key={q} className="mb-4 p-5 bg-slate-900/40 rounded-2xl border border-white/5"><h4 className="text-white font-bold mb-2">{q}</h4><p className="text-slate-400 text-sm">{a}</p></div>)}
          </div>
        </section>
      </div>
    </>
  );
};

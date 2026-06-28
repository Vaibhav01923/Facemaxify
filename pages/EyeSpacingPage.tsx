import React from "react";
import { SEO } from "../components/SEO";
import { Navbar } from "../components/Navbar";
import { PhotoAnalyzerShell } from "../components/tools/PhotoAnalyzerShell";

function dist(a: any, b: any) { return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2); }

function calculate(lm: any[]) {
  const leftEyeW = dist(lm[33], lm[133]);
  const rightEyeW = dist(lm[263], lm[362]);
  const avgEyeW = (leftEyeW + rightEyeW) / 2;
  const interEye = dist(lm[133], lm[362]);
  const faceW = dist(lm[234], lm[454]);
  const fiveEyeRule = faceW / avgEyeW; // ideal ≈ 5
  const interEyeRatio = interEye / avgEyeW; // ideal ≈ 1
  const fiveScore = Math.max(0, 100 - Math.abs(fiveEyeRule - 5) * 20);
  const interScore = Math.max(0, 100 - Math.abs(interEyeRatio - 1) * 80);
  const score = Math.round((fiveScore + interScore) / 2);
  const classification = score >= 88 ? "Ideal Spacing" : score >= 72 ? "Well-Spaced" : score >= 55 ? "Slightly Off-Center" : "Wide or Close Set";
  const verdict = interEyeRatio > 1.2 ? "wide-set eyes" : interEyeRatio < 0.8 ? "close-set eyes" : "ideally spaced eyes";
  return { score, classification, fiveEyeRule, interEyeRatio, verdict, leftEyeW, rightEyeW, interEye, faceW };
}

const Results = ({ result: r, reset }: any) => {
  const c = r.score >= 88 ? "text-emerald-400" : r.score >= 72 ? "text-indigo-400" : r.score >= 55 ? "text-amber-400" : "text-red-400";
  const ring = r.score >= 88 ? "border-emerald-500" : r.score >= 72 ? "border-indigo-500" : r.score >= 55 ? "border-amber-500" : "border-red-500";
  const metrics = [
    { label: "5-Eye Rule Ratio", value: r.fiveEyeRule.toFixed(2), ideal: "5.00", good: Math.abs(r.fiveEyeRule - 5) < 0.3 },
    { label: "Inter-Eye / Eye Width", value: r.interEyeRatio.toFixed(2), ideal: "1.00", good: Math.abs(r.interEyeRatio - 1) < 0.1 },
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
          <p className="text-slate-300 text-sm">You have <strong>{r.verdict}</strong>. The classical 5-eye rule states the face should be exactly 5 eye-widths across, with the inter-eye gap equalling one eye width.</p>
        </div>
      </div>
      <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6">
        <h3 className="text-white font-bold mb-4">Measurements</h3>
        {metrics.map(m => (
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

export const EyeSpacingPage: React.FC = () => {
  const faq = {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: [
      { "@type": "Question", name: "What is the 5-eye rule for eye spacing?", acceptedAnswer: { "@type": "Answer", text: "The 5-eye rule is a classical aesthetic principle that states the width of the face should equal exactly five eye-widths. It also implies that the gap between the eyes should equal one eye-width, and the distance from each outer eye corner to the edge of the face should also equal one eye-width. This creates equal proportioning across the face." } },
      { "@type": "Question", name: "What are wide-set eyes vs close-set eyes?", acceptedAnswer: { "@type": "Answer", text: "Wide-set eyes have an inter-eye gap larger than one eye-width. Close-set eyes have a gap smaller than one eye-width. Both are common and attractive in many contexts — wide-set eyes are associated with a childlike, innocent appearance while close-set eyes can appear more intense and focused." } },
      { "@type": "Question", name: "How is eye spacing calculated?", acceptedAnswer: { "@type": "Answer", text: "We use MediaPipe FaceMesh to detect the inner and outer corners of each eye. Eye width is the distance from the inner to outer corner. Inter-eye distance is from the inner corner of one eye to the inner corner of the other. The 5-eye ratio is face width divided by average eye width." } },
      { "@type": "Question", name: "Is the eye spacing test free?", acceptedAnswer: { "@type": "Answer", text: "Yes — completely free with no account required. Upload your photo and get your result in seconds." } },
    ]
  };
  return (
    <>
      <SEO title="Eye Spacing Ratio Calculator — Free AI Eye Distance Analyzer | Facemaxify" description="Test your eye spacing ratio free with AI. Measure the 5-eye rule, inter-eye distance, and see if you have wide-set or close-set eyes according to classical proportion standards." keywords="eye spacing calculator, eye spacing ratio, 5 eye rule calculator, inter eye distance, eye distance analyzer, close set eyes test, wide set eyes test" canonicalUrl="https://facemaxify.com/tools/eye-spacing" schema={[faq, { "@context": "https://schema.org", "@type": "WebApplication", name: "Eye Spacing Calculator", url: "https://facemaxify.com/tools/eye-spacing", isAccessibleForFree: true, offers: { "@type": "Offer", price: "0" } }] as any} />
      <div className="min-h-screen bg-[#050510] text-white">
        <Navbar />
        <section className="max-w-4xl mx-auto px-4 pt-14 pb-4 text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-5">Free · No Signup</span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-4">Eye Spacing Calculator</h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">Upload your photo to measure your eye spacing ratio. Find out if you have wide-set or close-set eyes and how you score on the classical 5-eye rule.</p>
        </section>
        <PhotoAnalyzerShell onAnalyze={calculate} renderResults={(r, reset) => <Results result={r} reset={reset} />} analyzeLabel="Calculate My Eye Spacing" />
        <section className="bg-slate-950/60 border-t border-white/5 py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-5">What Is the Eye Spacing Ratio?</h2>
            <p className="text-slate-400 mb-5 leading-relaxed">The <strong className="text-white">eye spacing ratio</strong> is a classical aesthetic measurement that determines how well your eyes are positioned relative to your face width. The most recognized standard is the <strong className="text-white">5-eye rule</strong> — the idea that the horizontal width of the face should equal exactly five eye-widths, with the space between the inner eye corners equalling one full eye-width.</p>
            <h3 className="text-xl font-bold text-white mb-3 mt-8">Wide-Set vs Close-Set Eyes</h3>
            <p className="text-slate-400 mb-5 leading-relaxed">When the inter-eye gap is larger than one eye-width, eyes are considered <strong className="text-white">wide-set</strong>. When smaller, they are <strong className="text-white">close-set</strong>. Neither is objectively better — wide-set eyes appear softer and more approachable, while close-set eyes can project intensity and sharpness. Many of the world's most recognized faces fall outside the "perfect" 5-eye ratio.</p>
            <h3 className="text-xl font-bold text-white mb-3 mt-8">Eye Spacing and Facial Attractiveness</h3>
            <p className="text-slate-400 mb-5 leading-relaxed">Eye spacing contributes to overall facial balance. Combined with metrics like canthal tilt, eye openness, and symmetry, it forms a key part of the eye area's aesthetic profile. The Facemaxify full analysis covers all eye-related metrics in one comprehensive report.</p>
            <h2 className="text-2xl font-bold text-white mt-10 mb-5">FAQ</h2>
            {[
              { q: "What is the ideal eye spacing ratio?", a: "Ideally, the inter-eye gap equals one eye-width and the face is 5 eye-widths wide. Scores above 88 indicate very close to this ideal. Most attractive faces fall within 10% of this standard." },
              { q: "Do wide-set eyes look better or worse?", a: "Neither is objectively better. Wide-set eyes are common in highly attractive people — they create a softer, more open appearance. Close-set eyes project intensity. Beauty exists across the full spectrum of eye spacing." },
              { q: "How does this relate to the full facial analysis?", a: "Eye spacing is one of 15+ metrics in the full Facemaxify facial analysis. The complete report covers symmetry, golden ratio, canthal tilt, jawline, and much more with a personalized improvement plan." },
              { q: "Is the eye spacing calculator free?", a: "Yes — free, instant, no signup needed." },
            ].map(({ q, a }) => <div key={q} className="mb-4 p-5 bg-slate-900/40 rounded-2xl border border-white/5"><h4 className="text-white font-bold mb-2">{q}</h4><p className="text-slate-400 text-sm">{a}</p></div>)}
          </div>
        </section>
      </div>
    </>
  );
};

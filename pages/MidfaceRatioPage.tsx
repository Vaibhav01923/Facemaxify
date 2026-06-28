import React from "react";
import { SEO } from "../components/SEO";
import { Navbar } from "../components/Navbar";
import { PhotoAnalyzerShell } from "../components/tools/PhotoAnalyzerShell";

function calculate(lm: any[]) {
  const browY = (lm[105].y + lm[334].y) / 2;
  const noseBaseY = lm[94].y;
  const chinY = lm[152].y;
  const midfaceH = Math.abs(noseBaseY - browY);
  const lowerFaceH = Math.abs(chinY - noseBaseY);
  const ratio = midfaceH / (lowerFaceH || 1);
  // Ideal midface ratio: ~0.95–1.05 (near equal, slightly shorter midface preferred)
  const score = Math.max(0, Math.round(100 - Math.abs(ratio - 1.0) * 120));
  const classification = score >= 85 ? "Ideal Midface Length" : score >= 68 ? "Well-Balanced" : score >= 52 ? "Slight Elongation" : ratio > 1 ? "Long Midface" : "Short Midface";
  const verdict = ratio > 1.12 ? "Your midface is relatively long compared to your lower face." : ratio < 0.88 ? "Your midface is shorter than your lower face." : "Your midface and lower face are in close proportion.";
  return { score, classification, ratio, verdict };
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
          <p className="text-slate-300 text-sm">Midface-to-lower-face ratio: <strong>{r.ratio.toFixed(2)}</strong> (ideal ~1.00). {r.verdict}</p>
        </div>
      </div>
      <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 text-sm text-slate-400">
        <div className="flex justify-between py-3 border-b border-white/5">
          <span>Midface / Lower Face Ratio</span>
          <span className={`font-bold ${r.score >= 85 ? "text-emerald-400" : "text-amber-400"}`}>{r.ratio.toFixed(2)} <span className="text-slate-600 text-xs">(ideal ~1.00)</span></span>
        </div>
      </div>
    </div>
  );
};

export const MidfaceRatioPage: React.FC = () => {
  const faq = {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: [
      { "@type": "Question", name: "What is midface ratio?", acceptedAnswer: { "@type": "Answer", text: "Midface ratio compares the height of the midface (from the brow line to the base of the nose) to the height of the lower face (from the nose base to the chin). An ideal ratio is approximately 1:1, with the two zones being roughly equal in height. A high midface ratio means a long midface — common in conditions like vertical maxillary excess." } },
      { "@type": "Question", name: "What is a short midface vs long midface?", acceptedAnswer: { "@type": "Answer", text: "A short midface (ratio below 0.88) means the zone from brow to nose base is noticeably shorter than the lower face. A long midface (ratio above 1.12) means the brow-to-nose zone is longer. Short midfaces are often associated with a more youthful, attractive appearance. Long midfaces can give the face an elongated look." } },
      { "@type": "Question", name: "How is midface ratio calculated?", acceptedAnswer: { "@type": "Answer", text: "We measure the vertical distance from the average eyebrow position (midpoint of the brow landmarks) to the nose base, then divide it by the vertical distance from the nose base to the chin. Both distances are calculated using MediaPipe FaceMesh AI landmark detection." } },
      { "@type": "Question", name: "Is the midface ratio calculator free?", acceptedAnswer: { "@type": "Answer", text: "Yes — completely free with no account required. Upload your photo for an instant midface ratio result." } },
    ]
  };
  return (
    <>
      <SEO title="Midface Ratio Calculator — Free AI Midface Length Analyzer | Facemaxify" description="Calculate your midface ratio free with AI. Measure your midface-to-lower-face proportion to see if you have a long or short midface and how it compares to the aesthetic ideal." keywords="midface ratio calculator, midface length analyzer, midface ratio analysis, long midface test, short midface, midface proportion calculator" canonicalUrl="https://facemaxify.com/tools/midface-ratio" schema={[faq, { "@context": "https://schema.org", "@type": "WebApplication", name: "Midface Ratio Calculator", url: "https://facemaxify.com/tools/midface-ratio", isAccessibleForFree: true, offers: { "@type": "Offer", price: "0" } }] as any} />
      <div className="min-h-screen bg-[#050510] text-white">
        <Navbar />
        <section className="max-w-4xl mx-auto px-4 pt-14 pb-4 text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-5">Free · No Signup</span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-4">Midface Ratio Calculator</h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">Upload your photo to measure your midface ratio — the proportion between your brow-to-nose zone and your nose-to-chin zone. Discover if you have a long or short midface.</p>
        </section>
        <PhotoAnalyzerShell onAnalyze={calculate} renderResults={(r, reset) => <Results result={r} reset={reset} />} analyzeLabel="Calculate My Midface Ratio" />
        <section className="bg-slate-950/60 border-t border-white/5 py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-5">Midface Ratio Explained</h2>
            <p className="text-slate-400 mb-5 leading-relaxed">The <strong className="text-white">midface ratio</strong> is a vertical proportion measurement that compares the height of your midface (eyebrows to nose base) against your lower face (nose base to chin). Orthognathic surgeons and facial aesthetic physicians use this metric extensively in planning — it determines whether a patient may benefit from maxillary impaction (shortening a long midface) or Le Fort surgery.</p>
            <h3 className="text-xl font-bold text-white mb-3 mt-8">Short vs Long Midface</h3>
            <p className="text-slate-400 mb-5 leading-relaxed">A <strong className="text-white">short midface</strong> (ratio below 0.88) gives the face a compact, youthful quality — the nose and midface features appear closer together. A <strong className="text-white">long midface</strong> (ratio above 1.12) is associated with vertical excess, where the area from the eyes to the nose appears stretched. Short midfaces tend to score better in aesthetic assessments because they project youthfulness.</p>
            <h3 className="text-xl font-bold text-white mb-3 mt-8">Midface and Mewing</h3>
            <p className="text-slate-400 mb-5 leading-relaxed">Proponents of mewing (maintaining correct tongue posture against the palate) claim that over years of consistent practice, it can encourage upward palate development, which effectively shortens the visible midface by rotating the maxilla slightly upward. While scientific evidence is limited in adults, correct tongue posture certainly affects bite and potentially facial structure in growing individuals.</p>
            <h2 className="text-2xl font-bold text-white mt-10 mb-5">FAQ</h2>
            {[
              { q: "Is a shorter midface more attractive?", a: "Generally yes — a slightly shorter midface (ratio 0.88–1.00) is associated with a more youthful, balanced facial appearance. Very short midfaces can look compressed; very long midfaces can look elongated." },
              { q: "What causes a long midface?", a: "Long midfaces are typically skeletal in nature — vertical maxillary excess (VME) means the upper jaw has developed too vertically. This can sometimes be addressed surgically (Le Fort I impaction) or partially masked through hairstyling and contouring." },
              { q: "Can midface ratio change over time?", a: "Not meaningfully after skeletal maturity (~22–25 years). However, soft tissue changes due to aging, weight change, or fat distribution can alter the perceived midface proportions." },
              { q: "Is this midface test free?", a: "Yes — upload a photo, get your result instantly. No account needed." },
            ].map(({ q, a }) => <div key={q} className="mb-4 p-5 bg-slate-900/40 rounded-2xl border border-white/5"><h4 className="text-white font-bold mb-2">{q}</h4><p className="text-slate-400 text-sm">{a}</p></div>)}
          </div>
        </section>
      </div>
    </>
  );
};

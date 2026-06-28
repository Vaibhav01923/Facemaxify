import React from "react";
import { SEO } from "../components/SEO";
import { Navbar } from "../components/Navbar";
import { PhotoAnalyzerShell } from "../components/tools/PhotoAnalyzerShell";

function dist(a: any, b: any) { return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2); }

function calculate(lm: any[]) {
  const leftBrowY = lm[105].y;
  const rightBrowY = lm[334].y;
  const leftEyeTopY = lm[159].y;
  const rightEyeTopY = lm[386].y;
  const leftEyeW = dist(lm[33], lm[133]);
  const rightEyeW = dist(lm[263], lm[362]);
  const leftBrowGap = Math.abs(leftEyeTopY - leftBrowY) / (leftEyeW || 1);
  const rightBrowGap = Math.abs(rightEyeTopY - rightBrowY) / (rightEyeW || 1);
  const avgGap = (leftBrowGap + rightBrowGap) / 2;
  // Ideal: brow-to-eye gap ≈ 0.5 eye-widths (clear space but not too high)
  const score = Math.max(0, Math.round(100 - Math.abs(avgGap - 0.50) * 180));
  const classification = avgGap < 0.30 ? "Low Brow" : avgGap < 0.45 ? "Low-Normal Brow" : avgGap < 0.60 ? "Ideal Brow Position" : avgGap < 0.75 ? "High-Normal Brow" : "High Brow";
  const verdict = avgGap < 0.30 ? "Brows sit very close to the eyes — creates a heavy, hooded appearance." : avgGap < 0.45 ? "Brows are slightly low — gives a stronger, more intense expression." : avgGap < 0.60 ? "Brow position is well-placed — open, balanced eye zone." : avgGap < 0.75 ? "Brows sit slightly high — creates an open, surprised quality." : "Very high brow position — wide-open, highly expressive appearance.";
  return { score, classification, avgGap, verdict };
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
          <p className="text-slate-300 text-sm">{r.verdict}</p>
        </div>
      </div>
      <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 text-sm text-slate-400">
        <div className="flex justify-between py-3">
          <span>Brow-to-Eye Gap (in eye-widths)</span>
          <span className={`font-bold ${r.score >= 82 ? "text-emerald-400" : "text-amber-400"}`}>{r.avgGap.toFixed(2)} <span className="text-slate-600 font-normal">ideal: ~0.50</span></span>
        </div>
      </div>
    </div>
  );
};

export const BrowPositionPage: React.FC = () => {
  const faq = {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: [
      { "@type": "Question", name: "What is ideal brow position?", acceptedAnswer: { "@type": "Answer", text: "The ideal brow sits approximately one eye-width's worth of gap above the upper eyelid, or roughly 1–1.2cm above the orbital rim. In aesthetic medicine, the brow tail (outer end) should be at or above the level of the brow head (inner end) for women. For men, a flatter, lower brow is generally preferred for a masculine appearance." } },
      { "@type": "Question", name: "What is a low brow vs high brow?", acceptedAnswer: { "@type": "Answer", text: "A low brow sits close to or overhangs the upper eyelid, creating a heavy, hooded appearance. This is common with ptosis (drooping brow) and can make the eye area appear smaller. A high brow creates a wide, open eye zone — often associated with youth. The ideal is a balanced middle ground where the brow is clearly above the lid but not excessively high." } },
      { "@type": "Question", name: "Can brow position be changed?", acceptedAnswer: { "@type": "Answer", text: "Yes. Brow lift surgery (direct, coronal, or endoscopic) raises brow position. Botox can be used to raise brows (by relaxing the depressor muscles) or lower them (by weakening the frontalis). Makeup and brow grooming can also visually alter perceived brow position — filling below the natural brow lowers it visually; filling above raises it." } },
      { "@type": "Question", name: "Is the brow position analyzer free?", acceptedAnswer: { "@type": "Answer", text: "Yes — free and instant, no account required." } },
    ]
  };
  return (
    <>
      <SEO title="Brow Position Analyzer — Free AI Eyebrow Height Calculator | Facemaxify" description="Analyze your brow position free with AI. Measure your brow-to-eye gap ratio to find out if you have a low brow, ideal brow, or high brow position and what it means aesthetically." keywords="brow position analyzer, eyebrow height calculator, brow position test, low brow test, high brow test, eyebrow position ratio, brow height analyzer" canonicalUrl="https://facemaxify.com/tools/brow-position" schema={[faq, { "@context": "https://schema.org", "@type": "WebApplication", name: "Brow Position Analyzer", url: "https://facemaxify.com/tools/brow-position", isAccessibleForFree: true, offers: { "@type": "Offer", price: "0" } }] as any} />
      <div className="min-h-screen bg-[#050510] text-white">
        <Navbar />
        <section className="max-w-4xl mx-auto px-4 pt-14 pb-4 text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-5">Free · No Signup</span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-4">Brow Position Analyzer</h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">Upload your photo to measure your brow-to-eye gap ratio. Find out if you have a low brow, high brow, or ideal brow position — and what each means for your facial aesthetics.</p>
        </section>
        <PhotoAnalyzerShell onAnalyze={calculate} renderResults={(r, reset) => <Results result={r} reset={reset} />} analyzeLabel="Analyze My Brow Position" />
        <section className="bg-slate-950/60 border-t border-white/5 py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-5">Eyebrow Position and Facial Aesthetics</h2>
            <p className="text-slate-400 mb-5 leading-relaxed">The vertical position of the eyebrows relative to the upper eyelid has a profound effect on the entire face's perceived expression, age, and attractiveness. <strong className="text-white">Brow position</strong> is measured as the gap between the upper eyelid and the eyebrow, normalized by eye width. The ideal position balances between too low (heavy, sleepy, or angry appearance) and too high (perpetually surprised look).</p>
            <h3 className="text-xl font-bold text-white mb-3 mt-8">Low Brow: The Hunter Brow Effect</h3>
            <p className="text-slate-400 mb-5 leading-relaxed">In male aesthetics, a slightly low brow position (close to the orbital rim) is often desired — it projects dominance and intensity without looking tired. This connects to the hunter eyes concept, where hooded lids and close brows create a focused, powerful eye appearance. For women, a slightly higher brow with a gentle arch is generally preferred.</p>
            <h3 className="text-xl font-bold text-white mb-3 mt-8">Brow Position and Aging</h3>
            <p className="text-slate-400 mb-5 leading-relaxed">Brow descent is one of the first signs of facial aging. As the frontalis muscle weakens and forehead skin loses elasticity, the brows drop — often below the orbital rim in older individuals. Brow lift procedures are among the most effective anti-aging interventions because restoring brow position opens the entire eye zone and refreshes the face's expression.</p>
            <h2 className="text-2xl font-bold text-white mt-10 mb-5">FAQ</h2>
            {[
              { q: "Does brow position affect attractiveness?", a: "Significantly. Brow position shapes the perceived emotion of the face at rest — the 'resting expression.' A well-positioned brow creates a neutral, approachable resting face. Too low creates a stern/angry appearance; too high creates a perpetually surprised one." },
              { q: "What is the ideal brow arch for women?", a: "For women, a brow that peaks approximately two-thirds along its length (above the outer edge of the iris) with a slight upward arch is considered ideal. The tail should end at the same height as or slightly above the inner brow head." },
              { q: "How does brow position relate to hunter eyes?", a: "Hunter eyes (compact, hooded) are enhanced by a slightly lower brow position. High, arched brows create the opposite — a more open, expressive 'prey eyes' effect. Brow position and canthal tilt work together to define eye shape." },
              { q: "Is the brow analyzer free?", a: "Yes — upload a photo, get your brow position score instantly. No account needed." },
            ].map(({ q, a }) => <div key={q} className="mb-4 p-5 bg-slate-900/40 rounded-2xl border border-white/5"><h4 className="text-white font-bold mb-2">{q}</h4><p className="text-slate-400 text-sm">{a}</p></div>)}
          </div>
        </section>
      </div>
    </>
  );
};

import React from "react";
import { SEO } from "../components/SEO";
import { Navbar } from "../components/Navbar";
import { PhotoAnalyzerShell } from "../components/tools/PhotoAnalyzerShell";

function calculate(lm: any[]) {
  const noseBaseY = lm[94].y;
  const cupidsBowY = lm[0].y; // top of upper lip
  const chinY = lm[152].y;
  const philtrumH = Math.abs(cupidsBowY - noseBaseY);
  const lowerThirdH = Math.abs(chinY - noseBaseY) || 1;
  const ratio = philtrumH / lowerThirdH;
  // Ideal philtrum: ~0.20–0.25 of lower third (short philtrum is aesthetically preferred)
  const score = Math.max(0, Math.round(100 - Math.abs(ratio - 0.22) * 350));
  const classification = ratio < 0.18 ? "Very Short Philtrum" : ratio < 0.25 ? "Ideal Short Philtrum" : ratio < 0.32 ? "Average Philtrum" : "Long Philtrum";
  const verdict = ratio > 0.30 ? "A shorter philtrum is generally preferred aesthetically — it makes the upper lip appear fuller and the lips closer to the nose." : ratio < 0.18 ? "Your philtrum is very short — the lips appear very close to the nose." : "Your philtrum length is in the attractive range.";
  return { score, classification, ratio, verdict };
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
          <p className="text-slate-300 text-sm">Philtrum is <strong>{(r.ratio * 100).toFixed(1)}%</strong> of lower third height (ideal 20–25%). {r.verdict}</p>
        </div>
      </div>
      <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 text-sm">
        <div className="flex justify-between py-3 text-slate-400">
          <span>Philtrum / Lower Third Ratio</span>
          <span className={`font-bold ${r.score >= 82 ? "text-emerald-400" : "text-amber-400"}`}>{(r.ratio * 100).toFixed(1)}% <span className="text-slate-600 font-normal">ideal: 20–25%</span></span>
        </div>
      </div>
    </div>
  );
};

export const PhiltrumRatioPage: React.FC = () => {
  const faq = {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: [
      { "@type": "Question", name: "What is the philtrum?", acceptedAnswer: { "@type": "Answer", text: "The philtrum is the vertical groove between the base of the nose and the cupid's bow of the upper lip. It is one of the most aesthetically significant features of the lower face, as its length directly affects how lips appear — a shorter philtrum makes the upper lip look fuller and more prominent, while a longer philtrum can make the face appear more elongated in the lower zone." } },
      { "@type": "Question", name: "What is an ideal philtrum length?", acceptedAnswer: { "@type": "Answer", text: "An ideal philtrum length is approximately 20–25% of the total lower third height (from nose base to chin). In absolute terms, for women this is typically 11–13mm, for men 13–15mm. A shorter philtrum is generally considered more attractive as it creates the appearance of a fuller, more prominent upper lip." } },
      { "@type": "Question", name: "Can philtrum length be reduced?", acceptedAnswer: { "@type": "Answer", text: "Lip flip procedures (small doses of Botox to the orbicularis oris muscle above the lip) can roll the upper lip slightly upward, visually shortening the apparent philtrum. Upper lip lift surgery (bullhorn lift) surgically removes a strip of skin under the nose to physically shorten the philtrum — a popular procedure for aging faces where the philtrum elongates over time." } },
      { "@type": "Question", name: "Is the philtrum ratio test free?", acceptedAnswer: { "@type": "Answer", text: "Yes — completely free, no signup required. Upload a front-facing photo and get your philtrum ratio instantly." } },
    ]
  };
  return (
    <>
      <SEO title="Philtrum Length Ratio — Free AI Philtrum Analyzer | Facemaxify" description="Measure your philtrum length ratio free with AI. Find out if your philtrum is short, ideal, or long relative to your lower face — and what it means for your lip appearance." keywords="philtrum length ratio, philtrum calculator, philtrum analyzer, philtrum ratio, short philtrum test, long philtrum, philtrum to lower third ratio" canonicalUrl="https://facemaxify.com/tools/philtrum-ratio" schema={[faq, { "@context": "https://schema.org", "@type": "WebApplication", name: "Philtrum Ratio Analyzer", url: "https://facemaxify.com/tools/philtrum-ratio", isAccessibleForFree: true, offers: { "@type": "Offer", price: "0" } }] as any} />
      <div className="min-h-screen bg-[#050510] text-white">
        <Navbar />
        <section className="max-w-4xl mx-auto px-4 pt-14 pb-4 text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-5">Free · No Signup</span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-4">Philtrum Length Analyzer</h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">Upload your photo to measure your philtrum-to-lower-face ratio. Find out if you have a short, ideal, or long philtrum — and how it affects the appearance of your lips.</p>
        </section>
        <PhotoAnalyzerShell onAnalyze={calculate} renderResults={(r, reset) => <Results result={r} reset={reset} />} analyzeLabel="Measure My Philtrum" />
        <section className="bg-slate-950/60 border-t border-white/5 py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-5">Philtrum Length and Lip Appearance</h2>
            <p className="text-slate-400 mb-5 leading-relaxed">The <strong className="text-white">philtrum</strong> — the vertical groove between your nose base and upper lip — is a surprisingly influential feature in facial aesthetics. Its length directly determines how your lips appear relative to your nose. A short philtrum positions the lips closer to the nose, making the upper lip appear fuller and more prominent. This is why short philtrum length is consistently preferred in aesthetic medicine research.</p>
            <h3 className="text-xl font-bold text-white mb-3 mt-8">Why Short Philtrums Are Preferred</h3>
            <p className="text-slate-400 mb-5 leading-relaxed">A philtrum at 20–25% of lower third height means the lips take up proportionally more of the lower face, creating a lip-forward appearance that many find attractive. The upper lip lift (bullhorn procedure) is one of the most requested aesthetic surgeries precisely because shortening the philtrum dramatically enhances lip appearance without any actual lip augmentation — a natural-looking result.</p>
            <h3 className="text-xl font-bold text-white mb-3 mt-8">The Philtrum and Aging</h3>
            <p className="text-slate-400 mb-5 leading-relaxed">One of the hallmarks of facial aging is philtrum elongation. As the maxilla retrudes and soft tissue descends with age, the apparent philtrum lengthens. This contributes significantly to the "older" facial appearance. Treatments that reverse philtrum elongation — whether through surgery or Botox lip flip — create a strong rejuvenating effect.</p>
            <h2 className="text-2xl font-bold text-white mt-10 mb-5">FAQ</h2>
            {[
              { q: "What makes a good philtrum?", a: "Short, well-defined, with visible columns (ridges on either side). The ideal is 20–25% of the lower third height with clear definition." },
              { q: "Is a long philtrum unattractive?", a: "A very long philtrum (above 35% of lower third) can make the lower face look elongated and the upper lip appear thinner. It is one of the few facial features where shorter is consistently preferred." },
              { q: "How does this relate to the full analysis?", a: "Philtrum ratio is part of the lower third breakdown in the full Facemaxify analysis. The complete report covers facial thirds, golden ratio, symmetry, and all facial zones together." },
              { q: "Is the philtrum analyzer free?", a: "Yes — free, instant, no signup needed." },
            ].map(({ q, a }) => <div key={q} className="mb-4 p-5 bg-slate-900/40 rounded-2xl border border-white/5"><h4 className="text-white font-bold mb-2">{q}</h4><p className="text-slate-400 text-sm">{a}</p></div>)}
          </div>
        </section>
      </div>
    </>
  );
};

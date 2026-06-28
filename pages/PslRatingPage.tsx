import React from "react";
import { SEO } from "../components/SEO";
import { Navbar } from "../components/Navbar";
import { PhotoAnalyzerShell } from "../components/tools/PhotoAnalyzerShell";

function dist(a: any, b: any) { return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2); }
function clamp(v: number) { return Math.min(10, Math.max(1, v)); }

function calculate(lm: any[]) {
  const midlineX = (lm[1].x + lm[6].x + lm[152].x) / 3;
  const faceH = Math.abs(lm[10].y - lm[152].y) || 1;
  const pairs = [[33,263],[133,362],[105,334],[61,291],[234,454],[172,397],[98,327]];
  const avgSym = pairs.reduce((s,[l,r]) => {
    const ld = Math.abs(lm[l].x - midlineX)/faceH;
    const rd = Math.abs(lm[r].x - midlineX)/faceH;
    return s + (ld>0&&rd>0?Math.min(ld,rd)/Math.max(ld,rd):1);
  },0)/pairs.length;
  const symScore = 1 + avgSym * 9;

  const jawW = dist(lm[172], lm[397]);
  const cheekW = dist(lm[234], lm[454]);
  const jawRatio = jawW/(cheekW||1);
  const jawScore = clamp(10 - Math.abs(jawRatio - 0.78) * 20);

  const leftTilt = (lm[133].y - lm[33].y);
  const rightTilt = (lm[362].y - lm[263].y);
  const avgTilt = (leftTilt + rightTilt)/2;
  const canthalScore = clamp(5 + avgTilt * 8000);

  const eyeOpen = (dist(lm[159],lm[145]) + dist(lm[386],lm[374]))/(dist(lm[33],lm[133])+dist(lm[263],lm[362])+0.001);
  const eyeScore = clamp(eyeOpen < 0.30 ? 9 : 9 - (eyeOpen - 0.30)*15);

  const browY = (lm[105].y + lm[334].y)/2;
  const noseBaseY = lm[94].y;
  const chinY = lm[152].y;
  const total = chinY - lm[10].y || 1;
  const thirdsErr = Math.abs((browY-lm[10].y)/total-0.333)+Math.abs((noseBaseY-browY)/total-0.333)+Math.abs((chinY-noseBaseY)/total-0.333);
  const propScore = clamp(10 - thirdsErr * 15);

  const pslScore = Number(((symScore*0.25 + jawScore*0.25 + canthalScore*0.20 + eyeScore*0.15 + propScore*0.15)).toFixed(1));
  const outOf10 = Math.min(10, Math.max(1, pslScore));
  const classification = outOf10 >= 8.5 ? "Top Tier" : outOf10 >= 7.0 ? "High Tier" : outOf10 >= 5.5 ? "Mid Tier" : outOf10 >= 4.0 ? "Low-Mid Tier" : "Below Average";
  const scores = { symmetry: +symScore.toFixed(1), jaw: +jawScore.toFixed(1), canthal: +canthalScore.toFixed(1), eye: +eyeScore.toFixed(1), proportions: +propScore.toFixed(1) };
  return { pslScore: outOf10, classification, scores };
}

const Results = ({ result: r, reset }: any) => {
  const c = r.pslScore >= 8.5 ? "text-yellow-400" : r.pslScore >= 7.0 ? "text-emerald-400" : r.pslScore >= 5.5 ? "text-indigo-400" : "text-amber-400";
  const ring = r.pslScore >= 8.5 ? "border-yellow-400" : r.pslScore >= 7.0 ? "border-emerald-500" : r.pslScore >= 5.5 ? "border-indigo-500" : "border-amber-500";
  const cats = [["Symmetry", r.scores.symmetry], ["Jawline", r.scores.jaw], ["Canthal Tilt", r.scores.canthal], ["Eye Shape", r.scores.eye], ["Proportions", r.scores.proportions]];
  return (
    <div className="space-y-5">
      <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-8 flex flex-col sm:flex-row items-center gap-8">
        <div className={`w-36 h-36 rounded-full border-4 ${ring} flex flex-col items-center justify-center shrink-0`}>
          <span className={`text-5xl font-black ${c}`}>{r.pslScore.toFixed(1)}</span>
          <span className="text-xs text-slate-400">/10</span>
        </div>
        <div>
          <p className={`text-sm font-bold uppercase tracking-wider mb-2 ${c}`}>{r.classification}</p>
          <p className="text-slate-300 text-sm">PSL rating based on 5 facial metrics scored on the classic 1–10 scale used in looksmaxxing communities. Higher weight goes to symmetry and jawline — the highest-leverage features for overall facial rating.</p>
        </div>
      </div>
      <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6">
        <h3 className="text-white font-bold mb-4">PSL Breakdown (out of 10)</h3>
        {cats.map(([label, score]) => (
          <div key={label as string} className="mb-3">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-300">{label as string}</span>
              <span className={(score as number) >= 7 ? "text-emerald-400" : (score as number) >= 5.5 ? "text-indigo-400" : "text-amber-400"}>{(score as number).toFixed(1)}/10</span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${(score as number) >= 7 ? "bg-emerald-500" : (score as number) >= 5.5 ? "bg-indigo-500" : "bg-amber-500"}`} style={{ width: `${(score as number) * 10}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const PslRatingPage: React.FC = () => {
  const faq = {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: [
      { "@type": "Question", name: "What does PSL stand for in face rating?", acceptedAnswer: { "@type": "Answer", text: "PSL stands for Prettyscale, Sluthate, and Lookism — three online forums where facial attractiveness ratings on a 1–10 scale were popularized. Today 'PSL rating' broadly refers to any systematic 1–10 facial attractiveness rating based on measurable geometric metrics used in the looksmaxxing community, particularly focusing on features like canthal tilt, jawline, symmetry, facial proportions, and eye shape." } },
      { "@type": "Question", name: "What is a good PSL rating?", acceptedAnswer: { "@type": "Answer", text: "PSL ratings follow a bell curve: 7+ is considered high tier and highly attractive. 8+ is very high tier, rare. 9+ approaches the theoretical maximum. Most people score 5–6.5. A PSL rating below 5 is considered below average. A rating of 7+ significantly improves social outcomes and perceived attractiveness in most contexts." } },
      { "@type": "Question", name: "What metrics are used in PSL rating?", acceptedAnswer: { "@type": "Answer", text: "This PSL calculator measures five factors: facial symmetry (25%), jawline definition (25%), canthal tilt (20%), eye compactness (15%), and facial thirds proportion (15%). These correspond to the metrics most consistently discussed in PSL rating communities as the most impactful on overall facial score." } },
      { "@type": "Question", name: "Can you increase your PSL rating?", acceptedAnswer: { "@type": "Answer", text: "Yes. The most impactful improvements for PSL rating are: body fat reduction (reveals bone structure and jawline), mewing and tongue posture, skincare (texture, clarity), hairstyle optimization, and for larger gains — aesthetic procedures targeting the jawline, eyes, or nose. The Facemaxify full analysis identifies your specific improvement priorities." } },
    ]
  };
  return (
    <>
      <SEO title="PSL Face Rating Calculator — Free AI PSL Score Tool | Facemaxify" description="Get your PSL face rating free with AI. Calculate your PSL score on the classic 1–10 scale based on facial symmetry, canthal tilt, jawline, eye shape, and facial proportions." keywords="psl rating, psl face rating, psl score calculator, psl rating calculator, psl face score, looksmaxxing psl, psl 1-10 rating" canonicalUrl="https://facemaxify.com/tools/psl-rating" schema={[faq, { "@context": "https://schema.org", "@type": "WebApplication", name: "PSL Face Rating Calculator", url: "https://facemaxify.com/tools/psl-rating", isAccessibleForFree: true, offers: { "@type": "Offer", price: "0" } }] as any} />
      <div className="min-h-screen bg-[#050510] text-white">
        <Navbar />
        <section className="max-w-4xl mx-auto px-4 pt-14 pb-4 text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-5">Free · Instant · No Signup</span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-4">PSL Face Rating</h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">Upload your photo to get your PSL rating — a 1–10 face score calculated from symmetry, canthal tilt, jawline definition, eye shape, and facial proportions.</p>
        </section>
        <PhotoAnalyzerShell onAnalyze={calculate} renderResults={(r, reset) => <Results result={r} reset={reset} />} analyzeLabel="Get My PSL Rating" />
        <section className="bg-slate-950/60 border-t border-white/5 py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-5">What Is a PSL Rating?</h2>
            <p className="text-slate-400 mb-5 leading-relaxed">The <strong className="text-white">PSL rating</strong> is a 1–10 facial attractiveness score used in looksmaxxing communities. The scale originated from online forums where users rated face photos based on measurable aesthetic criteria rather than subjective opinion. Today, a PSL score has become a shorthand for any structured facial attractiveness assessment based on geometric metrics.</p>
            <h3 className="text-xl font-bold text-white mb-3 mt-8">The PSL 1–10 Scale</h3>
            <p className="text-slate-400 mb-5 leading-relaxed">The scale follows a bell curve: 5–6 is average, 7+ is high tier, 8+ is very attractive, 9–10 is exceptional. PSL forums typically award higher scores for strong canthal tilt (hunter eyes), defined jawline, facial symmetry, and short/compact midface. The model-level appearance typically scores 8–9.</p>
            <h3 className="text-xl font-bold text-white mb-3 mt-8">Why Geometric Metrics Matter</h3>
            <p className="text-slate-400 mb-5 leading-relaxed">Subjective ratings vary widely between raters — but geometric measurements don't. By grounding the PSL rating in actual landmark distances and ratios, this calculator removes rater bias and gives you a consistent, reproducible score. This makes it possible to track improvement over time as you pursue looksmaxxing goals.</p>
            <h2 className="text-2xl font-bold text-white mt-10 mb-5">FAQ</h2>
            {[
              { q: "Is a 7 PSL rating attractive?", a: "Yes — a PSL rating of 7 is considered high tier and significantly above average. Most highly attractive people in everyday life score 7–8. Professional models typically score 7.5–9." },
              { q: "What are the most important PSL metrics?", a: "Jawline definition and facial symmetry carry the highest weight (25% each). Canthal tilt (positive tilt = hunter eyes) is third. Eye compactness and facial proportions round out the score." },
              { q: "How do I improve my PSL rating?", a: "The highest-leverage improvements: body fat reduction (jawline), mewing, sleep quality (eye appearance), skincare. For larger jumps: chin/jaw fillers, rhinoplasty, or jawline augmentation. The full Facemaxify analysis identifies your specific opportunities." },
              { q: "Is the PSL calculator free?", a: "Yes — completely free with no account needed." },
            ].map(({ q, a }) => <div key={q} className="mb-4 p-5 bg-slate-900/40 rounded-2xl border border-white/5"><h4 className="text-white font-bold mb-2">{q}</h4><p className="text-slate-400 text-sm">{a}</p></div>)}
          </div>
        </section>
      </div>
    </>
  );
};

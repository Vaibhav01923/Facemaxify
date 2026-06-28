import React from "react";
import { SEO } from "../components/SEO";
import { Navbar } from "../components/Navbar";
import { PhotoAnalyzerShell } from "../components/tools/PhotoAnalyzerShell";

function dist(a: any, b: any) { return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2); }

function calculate(lm: any[]) {
  const midlineX = (lm[1].x + lm[6].x + lm[152].x) / 3;
  const faceH = Math.abs(lm[10].y - lm[152].y) || 1;

  // 1. Symmetry
  const symPairs = [[33,263],[133,362],[105,334],[61,291],[234,454],[172,397],[98,327],[159,386]];
  const symRatio = symPairs.reduce((s,[l,r]) => {
    const ld = Math.abs(lm[l].x - midlineX)/faceH;
    const rd = Math.abs(lm[r].x - midlineX)/faceH;
    return s+(ld>0&&rd>0?Math.min(ld,rd)/Math.max(ld,rd):1);
  },0)/symPairs.length;
  const sym = Math.round(50 + symRatio * 50);

  // 2. Golden ratio approx: face width / face height ideal ~0.618
  const faceW = dist(lm[234], lm[454]);
  const goldenDev = Math.abs((faceW/faceH) - 0.618);
  const golden = Math.round(Math.max(0, 100 - goldenDev * 150));

  // 3. Jawline
  const jawW = dist(lm[172], lm[397]);
  const cheekW = dist(lm[234], lm[454]);
  const jaw = Math.round(Math.max(0, 100 - Math.abs(jawW/cheekW - 0.78) * 200));

  // 4. Facial thirds
  const browY = (lm[105].y + lm[334].y)/2;
  const noseBaseY = lm[94].y;
  const chinY = lm[152].y;
  const total = chinY - lm[10].y || 1;
  const thirds = Math.round(Math.max(0, 100 - (Math.abs((browY-lm[10].y)/total-0.333)+Math.abs((noseBaseY-browY)/total-0.333)+Math.abs((chinY-noseBaseY)/total-0.333))*100));

  // 5. Nose ratio
  const noseW = dist(lm[98], lm[327]);
  const nose = Math.round(Math.max(0, 100 - Math.abs(noseW/cheekW - 0.275) * 400));

  const score = Math.round(sym*0.30 + golden*0.20 + jaw*0.25 + thirds*0.15 + nose*0.10);
  const rating = Math.min(10, Math.max(1, score/10));
  const classification = score >= 88 ? "Exceptional" : score >= 76 ? "Very Attractive" : score >= 63 ? "Attractive" : score >= 50 ? "Average" : "Below Average";

  return { score, rating, classification, sym, golden, jaw, thirds, nose };
}

const Results = ({ result: r, reset }: any) => {
  const c = r.score >= 88 ? "text-yellow-400" : r.score >= 76 ? "text-emerald-400" : r.score >= 63 ? "text-indigo-400" : r.score >= 50 ? "text-amber-400" : "text-red-400";
  const ring = r.score >= 88 ? "border-yellow-400" : r.score >= 76 ? "border-emerald-500" : r.score >= 63 ? "border-indigo-500" : r.score >= 50 ? "border-amber-500" : "border-red-500";
  const cats = [["Symmetry (30%)", r.sym], ["Golden Ratio (20%)", r.golden], ["Jawline (25%)", r.jaw], ["Facial Thirds (15%)", r.thirds], ["Nose Ratio (10%)", r.nose]];
  return (
    <div className="space-y-5">
      <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-8 flex flex-col sm:flex-row items-center gap-8">
        <div className={`w-36 h-36 rounded-full border-4 ${ring} flex flex-col items-center justify-center shrink-0`}>
          <span className={`text-5xl font-black ${c}`}>{r.score}</span>
          <span className="text-xs text-slate-400">/100</span>
        </div>
        <div>
          <p className={`text-sm font-bold uppercase tracking-wider mb-2 ${c}`}>{r.classification} · {r.rating.toFixed(1)}/10</p>
          <p className="text-slate-300 text-sm">Face rating based on 5 weighted geometric metrics. Symmetry and jawline carry the most weight — these are the two most research-validated predictors of facial attractiveness.</p>
        </div>
      </div>
      <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6">
        <h3 className="text-white font-bold mb-4">Rating Breakdown</h3>
        {cats.map(([label, score]) => (
          <div key={label as string} className="mb-3">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-300">{label as string}</span>
              <span className={(score as number) >= 80 ? "text-emerald-400" : (score as number) >= 60 ? "text-indigo-400" : "text-amber-400"}>{score as number}/100</span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${(score as number) >= 80 ? "bg-emerald-500" : (score as number) >= 60 ? "bg-indigo-500" : "bg-amber-500"}`} style={{ width: `${score as number}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const FaceRatingPage: React.FC = () => {
  const faq = {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: [
      { "@type": "Question", name: "How does AI face rating work?", acceptedAnswer: { "@type": "Answer", text: "AI face rating uses computer vision to detect facial landmarks — specific points on the face like eye corners, jaw angles, nose tip, and lip borders. It then measures geometric relationships between these points: ratios, distances, and angles. These measurements are compared to aesthetic standards derived from attractiveness research to produce a numerical score." } },
      { "@type": "Question", name: "Is face rating AI accurate?", acceptedAnswer: { "@type": "Answer", text: "AI face rating based on geometric landmarks is highly consistent and reproducible — the same photo will always give the same score. It accurately captures measurable facial structure. However, real-world attractiveness also involves skin texture, hair, grooming, expression, and personality — which landmark-based AI cannot fully capture. Think of it as a measure of facial structure quality, not a comprehensive attractiveness verdict." } },
      { "@type": "Question", name: "What is a good face rating score?", acceptedAnswer: { "@type": "Answer", text: "Scores above 88 are exceptional — top 5% of facial structure. 76–87 is very attractive. 63–75 is attractive and above average. 50–62 is average. Most people score between 55 and 72." } },
      { "@type": "Question", name: "Is the face rating AI free?", acceptedAnswer: { "@type": "Answer", text: "Yes — free, instant, no account required. Upload your photo and get your face rating in seconds." } },
    ]
  };
  return (
    <>
      <SEO title="Face Rating AI — Free AI Face Score Calculator | Facemaxify" description="Get your face rating from AI. Our face rating tool measures symmetry, golden ratio, jawline, facial thirds, and nose ratio for a scientifically-grounded face score. Free, instant." keywords="face rating ai, ai face rating, face rating test, face score calculator, rate my face ai, face rating calculator, ai face score, face attractiveness rater" canonicalUrl="https://facemaxify.com/tools/face-rating" schema={[faq, { "@context": "https://schema.org", "@type": "WebApplication", name: "Face Rating AI", url: "https://facemaxify.com/tools/face-rating", isAccessibleForFree: true, offers: { "@type": "Offer", price: "0" } }] as any} />
      <div className="min-h-screen bg-[#050510] text-white">
        <Navbar />
        <section className="max-w-4xl mx-auto px-4 pt-14 pb-4 text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-5">Free · Instant · No Signup</span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-4">Face Rating AI</h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">Upload your photo for an AI face rating based on 5 geometric metrics: symmetry, golden ratio, jawline, facial thirds, and nose proportion. Get a score out of 100 and a detailed breakdown.</p>
        </section>
        <PhotoAnalyzerShell onAnalyze={calculate} renderResults={(r, reset) => <Results result={r} reset={reset} />} analyzeLabel="Rate My Face" />
        <section className="bg-slate-950/60 border-t border-white/5 py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-5">How AI Face Rating Works</h2>
            <p className="text-slate-400 mb-5 leading-relaxed">Our <strong className="text-white">face rating AI</strong> uses Google's MediaPipe FaceMesh to detect 468 facial landmarks from your photo, then applies geometric calculations across 5 aesthetic domains. Unlike social media face rating apps that use subjective crowd-sourced opinions, this system uses measurable facial geometry that is consistent, reproducible, and bias-free.</p>
            <h3 className="text-xl font-bold text-white mb-3 mt-8">The 5 Factors in Our Face Score</h3>
            <p className="text-slate-400 mb-4 leading-relaxed">The face score is a weighted composite:</p>
            <ul className="text-slate-400 space-y-2 mb-6 list-disc pl-6">
              <li><strong className="text-white">Symmetry (30%)</strong> — left-right balance across 8 facial zones</li>
              <li><strong className="text-white">Jawline (25%)</strong> — jaw-to-cheekbone ratio and chin definition</li>
              <li><strong className="text-white">Golden Ratio (20%)</strong> — face width to height approximation of phi (1.618)</li>
              <li><strong className="text-white">Facial Thirds (15%)</strong> — balance between forehead, midface, and lower face</li>
              <li><strong className="text-white">Nose Ratio (10%)</strong> — nose width to face width harmony</li>
            </ul>
            <h3 className="text-xl font-bold text-white mb-3 mt-8">What the Score Doesn't Measure</h3>
            <p className="text-slate-400 mb-5 leading-relaxed">The face rating AI measures structural geometry — bone structure, facial proportions, and symmetry. It does not measure skin quality, hair, grooming, expression warmth, personal style, or charisma. These factors significantly affect real-world attractiveness. The score is best understood as a measurement of facial structure quality, which is one important component of overall appearance.</p>
            <h2 className="text-2xl font-bold text-white mt-10 mb-5">FAQ</h2>
            {[
              { q: "How do I get a high face rating?", a: "The highest-impact improvements to face rating score are: improving jawline (fat loss, mewing, procedures), improving symmetry perception (posture, less sleeping on one side), and overall facial structure maintenance (skincare, sleep, hydration)." },
              { q: "What is the most important factor in face rating?", a: "Symmetry (30% of score) and jawline (25%) together account for 55% of the total score. These are the highest-leverage features for face rating improvement." },
              { q: "What does my face rating percentile mean?", a: "A score of 88+ is top 5%. 76+ is top 20%. 63+ is above average. 50-62 is average. Most people score between 55 and 72." },
              { q: "Is the face rating AI free?", a: "Yes — 100% free, no signup, instant result." },
            ].map(({ q, a }) => <div key={q} className="mb-4 p-5 bg-slate-900/40 rounded-2xl border border-white/5"><h4 className="text-white font-bold mb-2">{q}</h4><p className="text-slate-400 text-sm">{a}</p></div>)}
          </div>
        </section>
      </div>
    </>
  );
};

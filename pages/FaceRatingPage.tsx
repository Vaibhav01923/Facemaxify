import React from "react";
import { SEO } from "../components/SEO";
import { Navbar } from "../components/Navbar";
import { ToolArticle } from "../components/tools/ToolArticle";
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
  return (
    <>
      <SEO title="Face Rating AI — Free AI Face Score Calculator | Facemaxify" description="Get your face rating from AI. Our face rating tool measures symmetry, golden ratio, jawline, facial thirds, and nose ratio for a scientifically-grounded face score. Free, instant." keywords="face rating ai, ai face rating, face rating test, face score calculator, rate my face ai, face rating calculator, ai face score, face attractiveness rater" canonicalUrl="https://facemaxify.com/tools/face-rating" schema={[{ "@context": "https://schema.org", "@type": "WebApplication", name: "Face Rating AI", url: "https://facemaxify.com/tools/face-rating", isAccessibleForFree: true, offers: { "@type": "Offer", price: "0" } }] as any} />
      <div className="min-h-screen bg-[#050510] text-white">
        <Navbar />
        <section className="max-w-4xl mx-auto px-4 pt-14 pb-4 text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-5">Free · Instant · No Signup</span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-4">Face Rating AI</h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">Upload your photo for an AI face rating based on 5 geometric metrics: symmetry, golden ratio, jawline, facial thirds, and nose proportion. Get a score out of 100 and a detailed breakdown.</p>
        </section>
        <PhotoAnalyzerShell onAnalyze={calculate} renderResults={(r, reset) => <Results result={r} reset={reset} />} analyzeLabel="Rate My Face" />
        <ToolArticle slug="face-rating" />
      </div>
    </>
  );
};

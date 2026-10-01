import React from "react";
import { SEO } from "../components/SEO";
import { Navbar } from "../components/Navbar";
import { ToolArticle } from "../components/tools/ToolArticle";
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
  return (
    <>
      <SEO title="PSL Face Rating Calculator — Free AI PSL Score Tool | Facemaxify" description="Get your PSL face rating free with AI. Calculate your PSL score on the classic 1–10 scale based on facial symmetry, canthal tilt, jawline, eye shape, and facial proportions." keywords="psl rating, psl face rating, psl score calculator, psl rating calculator, psl face score, looksmaxxing psl, psl 1-10 rating" canonicalUrl="https://facemaxify.com/tools/psl-rating" schema={[{ "@context": "https://schema.org", "@type": "WebApplication", name: "PSL Face Rating Calculator", url: "https://facemaxify.com/tools/psl-rating", isAccessibleForFree: true, offers: { "@type": "Offer", price: "0" } }] as any} />
      <div className="min-h-screen bg-[#050510] text-white">
        <Navbar />
        <section className="max-w-4xl mx-auto px-4 pt-14 pb-4 text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-5">Free · Instant · No Signup</span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-4">PSL Face Rating</h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">Upload your photo to get your PSL rating — a 1–10 face score calculated from symmetry, canthal tilt, jawline definition, eye shape, and facial proportions.</p>
        </section>
        <PhotoAnalyzerShell onAnalyze={calculate} renderResults={(r, reset) => <Results result={r} reset={reset} />} analyzeLabel="Get My PSL Rating" />
        <ToolArticle slug="psl-rating" />
      </div>
    </>
  );
};

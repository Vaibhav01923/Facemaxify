import React from "react";
import { SEO } from "../components/SEO";
import { Navbar } from "../components/Navbar";
import { ToolArticle } from "../components/tools/ToolArticle";
import { PhotoAnalyzerShell } from "../components/tools/PhotoAnalyzerShell";

function dist(a: any, b: any) { return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2); }

function calculate(lm: any[]) {
  const midlineX = (lm[1].x + lm[6].x + lm[152].x) / 3;
  const faceH = Math.abs(lm[10].y - lm[152].y) || 1;

  // Symmetry (most researched attractiveness predictor)
  const p = [[33,263],[133,362],[105,334],[61,291],[234,454],[172,397],[98,327],[159,386]];
  const sym = p.reduce((s,[l,r]) => {
    const ld = Math.abs(lm[l].x-midlineX)/faceH, rd = Math.abs(lm[r].x-midlineX)/faceH;
    return s+(ld>0&&rd>0?Math.min(ld,rd)/Math.max(ld,rd):1);
  },0)/p.length;
  const symScore = Math.round(50+sym*50);

  // Averageness proxy: how close key ratios are to population average (which IS attractive per Langlois)
  const noseW = dist(lm[98],lm[327]);
  const faceW = dist(lm[234],lm[454]);
  const noseScore = Math.round(Math.max(0,100-Math.abs(noseW/faceW-0.275)*400));
  const eyeSpaceScore = Math.round(Math.max(0,100-Math.abs(dist(lm[133],lm[362])/((dist(lm[33],lm[133])+dist(lm[263],lm[362]))/2)-1)*80));

  // Sexual dimorphism: jawline (masculine = high, feminine = moderate)
  const jawW = dist(lm[172],lm[397]);
  const cheekW = dist(lm[234],lm[454]);
  const jawScore = Math.round(Math.max(0,100-Math.abs(jawW/cheekW-0.78)*200));

  // Youthfulness markers: short philtrum, compact midface
  const philtrumH = Math.abs(lm[0].y - lm[94].y);
  const lowerThirdH = Math.abs(lm[152].y - lm[94].y) || 1;
  const youthScore = Math.round(Math.max(0,100-Math.abs(philtrumH/lowerThirdH-0.22)*350));

  const score = Math.round(symScore*0.35+noseScore*0.10+eyeSpaceScore*0.10+jawScore*0.25+youthScore*0.20);
  const classification = score >= 88 ? "Highly Attractive" : score >= 75 ? "Above Average" : score >= 60 ? "Average Attractiveness" : "Below Average";
  return { score, classification, symScore, noseScore, eyeSpaceScore, jawScore, youthScore };
}

const Results = ({ result: r, reset }: any) => {
  const c = r.score >= 88 ? "text-yellow-400" : r.score >= 75 ? "text-emerald-400" : r.score >= 60 ? "text-indigo-400" : "text-amber-400";
  const ring = r.score >= 88 ? "border-yellow-400" : r.score >= 75 ? "border-emerald-500" : r.score >= 60 ? "border-indigo-500" : "border-amber-500";
  const cats = [["Facial Symmetry (35%)", r.symScore], ["Jawline Definition (25%)", r.jawScore], ["Youthfulness Markers (20%)", r.youthScore], ["Nose Proportion (10%)", r.noseScore], ["Eye Spacing (10%)", r.eyeSpaceScore]];
  return (
    <div className="space-y-5">
      <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-8 flex flex-col sm:flex-row items-center gap-8">
        <div className={`w-36 h-36 rounded-full border-4 ${ring} flex flex-col items-center justify-center shrink-0`}>
          <span className={`text-5xl font-black ${c}`}>{r.score}</span>
          <span className="text-xs text-slate-400">/100</span>
        </div>
        <div>
          <p className={`text-sm font-bold uppercase tracking-wider mb-2 ${c}`}>{r.classification}</p>
          <p className="text-slate-300 text-sm">Attractiveness score derived from research-validated facial markers: symmetry, jawline, youthfulness markers, nose proportion, and eye spacing. Based on established findings in evolutionary and aesthetic psychology.</p>
        </div>
      </div>
      <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6">
        <h3 className="text-white font-bold mb-4">Attractiveness Components</h3>
        {cats.map(([label, score]) => (
          <div key={label as string} className="mb-3">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-300">{label as string}</span>
              <span className={(score as number) >= 80?"text-emerald-400":(score as number)>=60?"text-indigo-400":"text-amber-400"}>{score as number}/100</span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${(score as number)>=80?"bg-emerald-500":(score as number)>=60?"bg-indigo-500":"bg-amber-500"}`} style={{width:`${score as number}%`}} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const AttractivenessScorePage: React.FC = () => {
  return (
    <>
      <SEO title="Facial Attractiveness Score — Free AI Attractiveness Test | Facemaxify" description="Get your facial attractiveness score free with AI. Our attractiveness test measures symmetry, jawline, youthfulness, and facial proportions based on research in evolutionary and aesthetic psychology." keywords="facial attractiveness score, attractiveness test, face attractiveness calculator, attractiveness score calculator, facial attractiveness analyzer, face attractiveness test, beauty score calculator" canonicalUrl="https://facemaxify.com/tools/attractiveness-score" schema={[{ "@context": "https://schema.org", "@type": "WebApplication", name: "Facial Attractiveness Score", url: "https://facemaxify.com/tools/attractiveness-score", isAccessibleForFree: true, offers: { "@type": "Offer", price: "0" } }] as any} />
      <div className="min-h-screen bg-[#050510] text-white">
        <Navbar />
        <section className="max-w-4xl mx-auto px-4 pt-14 pb-4 text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-5">Free · Science-Based · No Signup</span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-4">Facial Attractiveness Score</h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">Upload your photo for a science-grounded attractiveness score. We measure the five facial attributes most consistently linked to attractiveness in research: symmetry, jawline, youthfulness, nose proportion, and eye spacing.</p>
        </section>
        <PhotoAnalyzerShell onAnalyze={calculate} renderResults={(r, reset) => <Results result={r} reset={reset} />} analyzeLabel="Get My Attractiveness Score" />
        <ToolArticle slug="attractiveness-score" />
      </div>
    </>
  );
};

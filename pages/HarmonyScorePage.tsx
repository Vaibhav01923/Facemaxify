import React from "react";
import { SEO } from "../components/SEO";
import { Navbar } from "../components/Navbar";
import { ToolArticle } from "../components/tools/ToolArticle";
import { PhotoAnalyzerShell } from "../components/tools/PhotoAnalyzerShell";

function dist(a: any, b: any) { return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2); }

function calculate(lm: any[]) {
  const midlineX = (lm[1].x + lm[6].x + lm[152].x) / 3;
  const faceH = Math.abs(lm[10].y - lm[152].y) || 1;
  const faceW = dist(lm[234], lm[454]);

  // Symmetry
  const sps = [[33,263],[133,362],[105,334],[61,291],[234,454],[172,397],[98,327],[159,386]];
  const sym = Math.round(50+(sps.reduce((s,[l,r])=>{const ld=Math.abs(lm[l].x-midlineX)/faceH,rd=Math.abs(lm[r].x-midlineX)/faceH;return s+(ld>0&&rd>0?Math.min(ld,rd)/Math.max(ld,rd):1)},0)/sps.length)*50);

  // Golden ratio: various sub-ratios
  const noseBaseY = lm[94].y;
  const browY = (lm[105].y + lm[334].y) / 2;
  const chinY = lm[152].y;
  const midfaceH = Math.abs(noseBaseY - browY);
  const lowerH = Math.abs(chinY - noseBaseY);
  const goldenMid = Math.round(Math.max(0, 100 - Math.abs(midfaceH/lowerH - 1.0) * 120));

  // Facial thirds
  const total = chinY - lm[10].y || 1;
  const thirds = Math.round(Math.max(0,100-(Math.abs((browY-lm[10].y)/total-0.333)+Math.abs((noseBaseY-browY)/total-0.333)+Math.abs((chinY-noseBaseY)/total-0.333))*100));

  // Jawline V-taper
  const jawW = dist(lm[172], lm[397]);
  const cheekW = faceW;
  const jaw = Math.round(Math.max(0, 100 - Math.abs(jawW/cheekW - 0.78) * 200));

  // Nose harmony
  const noseW = dist(lm[98], lm[327]);
  const nose = Math.round(Math.max(0, 100 - Math.abs(noseW/cheekW - 0.275) * 400));

  // Lip harmony
  const lipRat = Math.abs(lm[0].y - lm[13].y) / (Math.abs(lm[14].y - lm[17].y) || 0.01);
  const lip = Math.round(Math.max(0, 100 - Math.abs(lipRat - 0.65) * 200));

  // Eye spacing
  const eyeW = (dist(lm[33],lm[133]) + dist(lm[263],lm[362])) / 2;
  const interEye = dist(lm[133], lm[362]);
  const eye = Math.round(Math.max(0, 100 - Math.abs(interEye/eyeW - 1.0) * 80));

  const score = Math.round(sym*0.25 + goldenMid*0.15 + thirds*0.15 + jaw*0.20 + nose*0.10 + lip*0.075 + eye*0.075);
  const classification = score >= 90 ? "Exceptional Harmony" : score >= 78 ? "High Harmony" : score >= 64 ? "Good Harmony" : score >= 50 ? "Moderate Harmony" : "Developing Harmony";
  return { score, classification, sym, goldenMid, thirds, jaw, nose, lip, eye };
}

const Results = ({ result: r, reset }: any) => {
  const c = r.score >= 90?"text-yellow-400":r.score>=78?"text-emerald-400":r.score>=64?"text-indigo-400":"text-amber-400";
  const ring = r.score>=90?"border-yellow-400":r.score>=78?"border-emerald-500":r.score>=64?"border-indigo-500":"border-amber-500";
  const cats = [["Symmetry","25%",r.sym],["Midface Proportion","15%",r.goldenMid],["Facial Thirds","15%",r.thirds],["Jawline V-taper","20%",r.jaw],["Nose Harmony","10%",r.nose],["Lip Ratio","7.5%",r.lip],["Eye Spacing","7.5%",r.eye]];
  return (
    <div className="space-y-5">
      <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-8 flex flex-col sm:flex-row items-center gap-8">
        <div className={`w-36 h-36 rounded-full border-4 ${ring} flex flex-col items-center justify-center shrink-0`}>
          <span className={`text-5xl font-black ${c}`}>{r.score}</span>
          <span className="text-xs text-slate-400">/100</span>
        </div>
        <div>
          <p className={`text-sm font-bold uppercase tracking-wider mb-2 ${c}`}>{r.classification}</p>
          <p className="text-slate-300 text-sm">Facial harmony score combines 7 proportional metrics — this is the most comprehensive free facial analysis available without signing in. Each feature is scored for how harmoniously it relates to the whole face.</p>
        </div>
      </div>
      <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6">
        <h3 className="text-white font-bold mb-4">7-Metric Harmony Breakdown</h3>
        {cats.map(([label,weight,score]) => (
          <div key={label as string} className="mb-3">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-300">{label as string} <span className="text-slate-600">({weight as string})</span></span>
              <span className={(score as number)>=80?"text-emerald-400":(score as number)>=60?"text-indigo-400":"text-amber-400"}>{score as number}/100</span>
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

export const HarmonyScorePage: React.FC = () => {
  return (
    <>
      <SEO title="Facial Harmony Score — Free AI Face Harmony Calculator | Facemaxify" description="Get your facial harmony score free with AI. Our face harmony calculator measures 7 proportion metrics — symmetry, jawline, facial thirds, midface, nose, lips, and eye spacing — for a holistic face score." keywords="facial harmony score, face harmony calculator, facial harmony test, face harmony score, facial harmony analyzer, facial balance score, face proportion harmony" canonicalUrl="https://facemaxify.com/tools/harmony-score" schema={[{ "@context": "https://schema.org", "@type": "WebApplication", name: "Facial Harmony Score Calculator", url: "https://facemaxify.com/tools/harmony-score", isAccessibleForFree: true, offers: { "@type": "Offer", price: "0" } }] as any} />
      <div className="min-h-screen bg-[#050510] text-white">
        <Navbar />
        <section className="max-w-4xl mx-auto px-4 pt-14 pb-4 text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-5">Free · 7-Metric · No Signup</span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-4">Facial Harmony Score</h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">Upload your photo for the most comprehensive free facial score — 7 harmony metrics including symmetry, jawline, facial thirds, midface, nose, lips, and eye spacing.</p>
        </section>
        <PhotoAnalyzerShell onAnalyze={calculate} renderResults={(r, reset) => <Results result={r} reset={reset} />} analyzeLabel="Calculate My Harmony Score" />
        <ToolArticle slug="harmony-score" />
      </div>
    </>
  );
};

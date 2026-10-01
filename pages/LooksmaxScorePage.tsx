import React from "react";
import { SEO } from "../components/SEO";
import { Navbar } from "../components/Navbar";
import { ToolArticle } from "../components/tools/ToolArticle";
import { PhotoAnalyzerShell } from "../components/tools/PhotoAnalyzerShell";

function dist(a: any, b: any) { return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2); }

function clamp(v: number, lo = 0, hi = 100) { return Math.min(hi, Math.max(lo, v)); }

function calculate(lm: any[]) {
  // 1. Symmetry score
  const midlineX = (lm[1].x + lm[6].x + lm[152].x) / 3;
  const faceH = Math.abs(lm[10].y - lm[152].y) || 1;
  const pairs = [[33,263],[133,362],[105,334],[61,291],[234,454],[172,397]];
  const avgSymRatio = pairs.reduce((s,[l,r]) => {
    const ld = Math.abs(lm[l].x - midlineX) / faceH;
    const rd = Math.abs(lm[r].x - midlineX) / faceH;
    return s + (ld > 0 && rd > 0 ? Math.min(ld,rd)/Math.max(ld,rd) : 1);
  }, 0) / pairs.length;
  const symmetryScore = clamp(Math.round(50 + avgSymRatio * 50));

  // 2. Canthal tilt
  const leftTilt = (lm[133].y - lm[33].y);
  const rightTilt = (lm[362].y - lm[263].y);
  const avgTiltSign = (leftTilt + rightTilt) / 2;
  const canthalScore = clamp(avgTiltSign > 0 ? Math.round(65 + avgTiltSign * 1500) : Math.round(65 + avgTiltSign * 1000));

  // 3. Jawline: cheek-to-jaw ratio
  const cheekW = dist(lm[234], lm[454]);
  const jawW = dist(lm[172], lm[397]);
  const jawRatio = jawW / (cheekW || 1);
  const jawScore = clamp(Math.round(100 - Math.abs(jawRatio - 0.78) * 200));

  // 4. Facial thirds balance
  const browY = (lm[105].y + lm[334].y) / 2;
  const noseBaseY = lm[94].y;
  const chinY = lm[152].y;
  const total = chinY - lm[10].y;
  const thirdsScore = clamp(Math.round(100 - (Math.abs((browY - lm[10].y)/total - 0.333) + Math.abs((noseBaseY - browY)/total - 0.333) + Math.abs((chinY - noseBaseY)/total - 0.333)) * 100));

  // 5. Hunter eyes: compactness
  const eyeOpenness = (dist(lm[159], lm[145]) + dist(lm[386], lm[374])) / (dist(lm[33], lm[133]) + dist(lm[263], lm[362]) + 0.001);
  const eyeScore = clamp(eyeOpenness < 0.28 ? 90 : eyeOpenness < 0.38 ? Math.round(90 - (eyeOpenness - 0.28) * 400) : Math.max(20, Math.round(50 - (eyeOpenness - 0.38) * 200)));

  const weights = [0.25, 0.20, 0.25, 0.15, 0.15];
  const score = clamp(Math.round(
    symmetryScore * weights[0] + canthalScore * weights[1] + jawScore * weights[2] + thirdsScore * weights[3] + eyeScore * weights[4]
  ));

  const classification = score >= 90 ? "Top Tier (Looksmaxxed)" : score >= 78 ? "High Tier" : score >= 65 ? "Mid Tier" : score >= 50 ? "Average" : "Below Average";

  return { score, classification, symmetryScore, canthalScore, jawScore, thirdsScore, eyeScore };
}

const Results = ({ result: r, reset }: any) => {
  const c = r.score >= 90 ? "text-yellow-400" : r.score >= 78 ? "text-emerald-400" : r.score >= 65 ? "text-indigo-400" : r.score >= 50 ? "text-amber-400" : "text-red-400";
  const ring = r.score >= 90 ? "border-yellow-400" : r.score >= 78 ? "border-emerald-500" : r.score >= 65 ? "border-indigo-500" : r.score >= 50 ? "border-amber-500" : "border-red-500";
  const breakdown = [
    { label: "Facial Symmetry", score: r.symmetryScore },
    { label: "Canthal Tilt (Hunter Eyes)", score: r.canthalScore },
    { label: "Jawline Definition", score: r.jawScore },
    { label: "Facial Thirds Balance", score: r.thirdsScore },
    { label: "Eye Compactness", score: r.eyeScore },
  ];
  return (
    <div className="space-y-5">
      <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-8 flex flex-col sm:flex-row items-center gap-8">
        <div className={`w-36 h-36 rounded-full border-4 ${ring} flex flex-col items-center justify-center shrink-0`}>
          <span className={`text-5xl font-black ${c}`}>{r.score}</span>
          <span className="text-xs text-slate-400">/100</span>
        </div>
        <div>
          <p className={`text-sm font-bold uppercase tracking-wider mb-2 ${c}`}>{r.classification}</p>
          <p className="text-slate-300 text-sm">Your looksmax score combines 5 key aesthetic metrics: facial symmetry, canthal tilt, jawline definition, facial thirds balance, and eye compactness. This is a snapshot — see the full 15+ metric report below.</p>
        </div>
      </div>
      <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6">
        <h3 className="text-white font-bold mb-4">Component Scores</h3>
        {breakdown.map(({ label, score }) => {
          const col = score >= 80 ? "bg-emerald-500" : score >= 65 ? "bg-indigo-500" : score >= 50 ? "bg-amber-500" : "bg-red-500";
          return (
            <div key={label} className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-300">{label}</span>
                <span className={score >= 80 ? "text-emerald-400" : score >= 65 ? "text-indigo-400" : "text-amber-400"}>{score}/100</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full ${col} rounded-full`} style={{ width: `${score}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const LooksmaxScorePage: React.FC = () => {
  return (
    <>
      <SEO title="Looksmax Score Calculator — Free AI Looksmaxxing Rating | Facemaxify" description="Get your looksmax score free with AI. Our looksmaxxing calculator measures symmetry, canthal tilt, jawline, facial thirds, and eye shape for a comprehensive face rating." keywords="looksmax score, looksmax calculator, looksmaxxing score, looksmaxxing calculator, looksmax rating, looksmax face rating, looksmaxxing test, looksmaxxing score calculator" canonicalUrl="https://facemaxify.com/tools/looksmax-score" schema={[{ "@context": "https://schema.org", "@type": "WebApplication", name: "Looksmax Score Calculator", url: "https://facemaxify.com/tools/looksmax-score", isAccessibleForFree: true, offers: { "@type": "Offer", price: "0" } }] as any} />
      <div className="min-h-screen bg-[#050510] text-white">
        <Navbar />
        <section className="max-w-4xl mx-auto px-4 pt-14 pb-4 text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-bold uppercase tracking-widest mb-5">Free · Instant · No Signup</span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-4">Looksmax Score</h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">Upload your photo to get your looksmaxxing score — a composite rating based on the 5 highest-leverage facial metrics: symmetry, canthal tilt, jawline, facial thirds, and eye shape.</p>
        </section>
        <PhotoAnalyzerShell onAnalyze={calculate} renderResults={(r, reset) => <Results result={r} reset={reset} />} analyzeLabel="Get My Looksmax Score" />
        <ToolArticle slug="looksmax-score" />
      </div>
    </>
  );
};

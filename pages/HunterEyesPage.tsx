import React from "react";
import { SEO } from "../components/SEO";
import { Navbar } from "../components/Navbar";
import { ToolArticle } from "../components/tools/ToolArticle";
import { PhotoAnalyzerShell } from "../components/tools/PhotoAnalyzerShell";

function dist(a: any, b: any) { return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2); }

function calculate(lm: any[]) {
  // Eye openness (vertical / horizontal)
  const leftOpenness = dist(lm[159], lm[145]) / dist(lm[33], lm[133]);
  const rightOpenness = dist(lm[386], lm[374]) / dist(lm[263], lm[362]);
  const avgOpenness = (leftOpenness + rightOpenness) / 2;
  // Canthal tilt (positive = hunter, inner higher than outer in y)
  const leftTilt = (lm[133].y - lm[33].y) / dist(lm[33], lm[133]);
  const rightTilt = (lm[362].y - lm[263].y) / dist(lm[263], lm[362]);
  const avgTilt = ((leftTilt + rightTilt) / 2) * 180;
  // Hunter eyes = compact (low openness) + positive tilt
  const opennessScore = avgOpenness < 0.22 ? 100 : avgOpenness < 0.30 ? Math.round(100 - (avgOpenness - 0.22) * 800) :
    avgOpenness < 0.40 ? Math.round(40 - (avgOpenness - 0.30) * 200) : Math.max(0, Math.round(20 - (avgOpenness - 0.40) * 100));
  const tiltScore = avgTilt > 4 ? Math.min(100, 70 + avgTilt * 3) : avgTilt > 0 ? 40 + avgTilt * 7 : Math.max(0, 40 + avgTilt * 10);
  const score = Math.round(opennessScore * 0.55 + tiltScore * 0.45);
  const eyeType = score >= 80 ? "Hunter Eyes" : score >= 60 ? "Semi-Hunter Eyes" : score >= 40 ? "Neutral Eyes" : "Prey Eyes";
  const classification = eyeType;
  return { score, classification, eyeType, avgOpenness: avgOpenness * 100, avgTilt };
}

const Results = ({ result: r, reset }: any) => {
  const c = r.score >= 80 ? "text-emerald-400" : r.score >= 60 ? "text-indigo-400" : r.score >= 40 ? "text-amber-400" : "text-orange-400";
  const ring = r.score >= 80 ? "border-emerald-500" : r.score >= 60 ? "border-indigo-500" : r.score >= 40 ? "border-amber-500" : "border-orange-500";
  const desc = r.score >= 80 ? "Compact, hooded eyes with a positive canthal tilt. This is the most aesthetically desirable eye type in modern facial aesthetics — associated with intensity, dominance, and sharpness." :
    r.score >= 60 ? "Good combination of moderate compactness and slight positive tilt. Semi-hunter eyes project a balanced, sharp appearance without extreme hoodieness." :
    r.score >= 40 ? "Neutral eyes with average openness and minimal tilt. Friendly and approachable — neither hunter nor prey." :
    "Larger, more open eyes with neutral or negative canthal tilt. Often associated with an expressive, puppy-eyed appearance.";
  return (
    <div className="space-y-5">
      <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-8 flex flex-col sm:flex-row items-center gap-8">
        <div className={`w-32 h-32 rounded-full border-4 ${ring} flex flex-col items-center justify-center shrink-0`}>
          <span className={`text-4xl font-black ${c}`}>{r.score}</span>
          <span className="text-xs text-slate-400">/100</span>
        </div>
        <div>
          <p className={`text-sm font-bold uppercase tracking-wider mb-2 ${c}`}>{r.classification}</p>
          <p className="text-slate-300 text-sm">{desc}</p>
        </div>
      </div>
      <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6">
        <h3 className="text-white font-bold mb-4">Eye Measurements</h3>
        {[
          { label: "Eye Openness Ratio", value: `${r.avgOpenness.toFixed(1)}%`, ideal: "< 28%", good: r.avgOpenness < 30 },
          { label: "Canthal Tilt", value: `${r.avgTilt.toFixed(1)}°`, ideal: "> 3°", good: r.avgTilt > 2 },
        ].map(m => (
          <div key={m.label} className="flex justify-between py-3 border-b border-white/5 last:border-0">
            <span className="text-slate-400 text-sm">{m.label}</span>
            <div className="text-right">
              <span className={`font-bold text-sm ${m.good ? "text-emerald-400" : "text-amber-400"}`}>{m.value}</span>
              <span className="text-slate-600 text-xs ml-2">ideal: {m.ideal}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const HunterEyesPage: React.FC = () => {
  return (
    <>
      <SEO title="Hunter Eyes Test — Free AI Eye Shape Analyzer | Facemaxify" description="Take the hunter eyes test free with AI. Find out if you have hunter eyes, semi-hunter eyes, or prey eyes. We measure eye openness ratio and canthal tilt for an instant score." keywords="hunter eyes test, hunter eyes score, hunter eyes calculator, prey eyes test, eye shape analyzer, eye openness ratio, canthal tilt test" canonicalUrl="https://facemaxify.com/tools/hunter-eyes" schema={[{ "@context": "https://schema.org", "@type": "WebApplication", name: "Hunter Eyes Test", url: "https://facemaxify.com/tools/hunter-eyes", isAccessibleForFree: true, offers: { "@type": "Offer", price: "0" } }] as any} />
      <div className="min-h-screen bg-[#050510] text-white">
        <Navbar />
        <section className="max-w-4xl mx-auto px-4 pt-14 pb-4 text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-5">Free · No Signup</span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-4">Hunter Eyes Test</h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">Upload your photo to find out if you have hunter eyes or prey eyes. We measure eye openness ratio and canthal tilt — the two defining factors — for an instant eye shape score.</p>
        </section>
        <PhotoAnalyzerShell onAnalyze={calculate} renderResults={(r, reset) => <Results result={r} reset={reset} />} analyzeLabel="Test My Eye Shape" />
        <ToolArticle slug="hunter-eyes" />
      </div>
    </>
  );
};

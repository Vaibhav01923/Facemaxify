import React from "react";
import { SEO } from "../components/SEO";
import { Navbar } from "../components/Navbar";
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
  const faq = {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: [
      { "@type": "Question", name: "What are hunter eyes?", acceptedAnswer: { "@type": "Answer", text: "Hunter eyes are a type of eye shape characterized by a compact, hooded appearance with a positive canthal tilt (outer corner higher than inner corner). The term comes from evolutionary aesthetics — hunters needed narrowed, focused vision while prey animals have wider, more peripheral vision. In modern facial aesthetics and looksmaxxing, hunter eyes are considered the most attractive eye shape for men." } },
      { "@type": "Question", name: "What is the difference between hunter eyes and prey eyes?", acceptedAnswer: { "@type": "Answer", text: "Hunter eyes are compact with low vertical-to-horizontal ratio (low aspect ratio) and a positive canthal tilt. Prey eyes are larger, more open (high aspect ratio) with a neutral or negative canthal tilt. Both exist on a spectrum — many attractive faces fall in the 'semi-hunter' or 'neutral' range." } },
      { "@type": "Question", name: "Can you get hunter eyes naturally?", acceptedAnswer: { "@type": "Answer", text: "Some natural changes: maintaining low body fat reduces periorbital fat (puffiness around eyes that creates a prey-eye appearance), reducing screen time and getting proper sleep prevents eye swelling, and mewing (proper tongue posture) may over time influence orbital bone position. Clinically, ptosis surgery, brow positioning, or upper eyelid surgery can create a more hooded appearance." } },
      { "@type": "Question", name: "What eye openness ratio means hunter eyes?", acceptedAnswer: { "@type": "Answer", text: "An eye openness ratio below 28% (vertical eye opening is less than 28% of horizontal eye width) combined with a positive canthal tilt above 3 degrees is considered the hunter eyes profile. Both factors contribute — it's possible to have compact eyes with a negative tilt, which scores lower." } },
    ]
  };
  return (
    <>
      <SEO title="Hunter Eyes Test — Free AI Eye Shape Analyzer | Facemaxify" description="Take the hunter eyes test free with AI. Find out if you have hunter eyes, semi-hunter eyes, or prey eyes. We measure eye openness ratio and canthal tilt for an instant score." keywords="hunter eyes test, hunter eyes score, hunter eyes calculator, prey eyes test, eye shape analyzer, eye openness ratio, canthal tilt test" canonicalUrl="https://facemaxify.com/tools/hunter-eyes" schema={[faq, { "@context": "https://schema.org", "@type": "WebApplication", name: "Hunter Eyes Test", url: "https://facemaxify.com/tools/hunter-eyes", isAccessibleForFree: true, offers: { "@type": "Offer", price: "0" } }] as any} />
      <div className="min-h-screen bg-[#050510] text-white">
        <Navbar />
        <section className="max-w-4xl mx-auto px-4 pt-14 pb-4 text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-5">Free · No Signup</span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-4">Hunter Eyes Test</h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">Upload your photo to find out if you have hunter eyes or prey eyes. We measure eye openness ratio and canthal tilt — the two defining factors — for an instant eye shape score.</p>
        </section>
        <PhotoAnalyzerShell onAnalyze={calculate} renderResults={(r, reset) => <Results result={r} reset={reset} />} analyzeLabel="Test My Eye Shape" />
        <section className="bg-slate-950/60 border-t border-white/5 py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-5">What Are Hunter Eyes?</h2>
            <p className="text-slate-400 mb-5 leading-relaxed">The term <strong className="text-white">hunter eyes</strong> describes a specific eye shape characterized by two measurements: low eye openness (compact, slightly hooded lids) and a positive canthal tilt (outer corner of the eye sits higher than the inner corner). These two traits together create the intense, focused, "sharp" eye appearance that is consistently associated with dominance and male facial attractiveness in looksmaxxing communities and aesthetic research.</p>
            <h3 className="text-xl font-bold text-white mb-3 mt-8">Eye Openness Ratio Explained</h3>
            <p className="text-slate-400 mb-5 leading-relaxed">Eye openness is calculated as the vertical eye opening (from upper to lower lid at the center) divided by the horizontal eye width (from inner to outer corner). Hunter eyes have an openness below 28%. Eyes above 40% are considered "prey eyes." The sweet spot for the most aesthetically desirable eye appearance sits between 22–30%.</p>
            <h3 className="text-xl font-bold text-white mb-3 mt-8">Canthal Tilt and Hunter Eyes</h3>
            <p className="text-slate-400 mb-5 leading-relaxed">A positive canthal tilt means the outer eye corner is higher than the inner corner. Positive tilts above 3–5 degrees are considered the standard for hunter eyes. Combined with low eye openness, positive canthal tilt creates the "almond-shaped," sharp eye appearance. The canthal tilt tool on Facemaxify measures this in full detail.</p>
            <h2 className="text-2xl font-bold text-white mt-10 mb-5">FAQ</h2>
            {[
              { q: "What score means I have hunter eyes?", a: "A score of 80+ indicates hunter eyes. 60–79 is semi-hunter (still very favorable). 40–59 is neutral. Below 40 indicates prey eyes — not unattractive, just a different eye shape." },
              { q: "Are hunter eyes only for men?", a: "While the hunter eyes concept originates from male aesthetic discussions, compact eyes with positive canthal tilt are considered attractive in women too — creating an almond-eyed, feline appearance. The measurement and score apply equally to both." },
              { q: "Does eye shape affect attractiveness?", a: "Significantly. Eye shape is one of the first things people notice about a face. Hunter eyes in men are consistently associated with dominance and sexual attractiveness. In women, they project intensity and mystery." },
              { q: "Is the hunter eyes test free?", a: "Yes — 100% free, no account needed. Upload your photo and get your score in seconds." },
            ].map(({ q, a }) => <div key={q} className="mb-4 p-5 bg-slate-900/40 rounded-2xl border border-white/5"><h4 className="text-white font-bold mb-2">{q}</h4><p className="text-slate-400 text-sm">{a}</p></div>)}
          </div>
        </section>
      </div>
    </>
  );
};

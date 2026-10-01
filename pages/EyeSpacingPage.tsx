import React from "react";
import { SEO } from "../components/SEO";
import { Navbar } from "../components/Navbar";
import { ToolArticle } from "../components/tools/ToolArticle";
import { PhotoAnalyzerShell, PhotoContext } from "../components/tools/PhotoAnalyzerShell";
import { EyeSpacingOverlay, segmentColor } from "../components/tools/EyeSpacingOverlay";

function dist(a: any, b: any) { return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2); }

function calculate(lm: any[]) {
  const leftEyeW = dist(lm[33], lm[133]);
  const rightEyeW = dist(lm[263], lm[362]);
  const avgEyeW = (leftEyeW + rightEyeW) / 2;
  const interEye = dist(lm[133], lm[362]);
  const faceW = dist(lm[234], lm[454]);
  const fiveEyeRule = faceW / avgEyeW; // ideal ≈ 5
  const interEyeRatio = interEye / avgEyeW; // ideal ≈ 1
  const fiveScore = Math.max(0, 100 - Math.abs(fiveEyeRule - 5) * 20);
  const interScore = Math.max(0, 100 - Math.abs(interEyeRatio - 1) * 80);
  const score = Math.round((fiveScore + interScore) / 2);
  const classification = score >= 88 ? "Ideal Spacing" : score >= 72 ? "Well-Spaced" : score >= 55 ? "Slightly Off-Center" : "Wide or Close Set";
  // Five segments across the face, left to right, in units of average eye width (ideal: 1.00 each)
  const segments = [dist(lm[234], lm[33]), leftEyeW, interEye, rightEyeW, dist(lm[263], lm[454])].map(v => v / avgEyeW);
  const verdict = interEyeRatio > 1.2 ? "wide-set eyes" : interEyeRatio < 0.8 ? "close-set eyes" : "ideally spaced eyes";
  return { score, classification, fiveEyeRule, interEyeRatio, verdict, leftEyeW, rightEyeW, interEye, faceW, segments };
}

const SEGMENT_LABELS = ["Face edge → eye", "Eye", "Between the eyes", "Eye", "Eye → face edge"];

const Results = ({ result: r, photo }: { result: any; reset: () => void; photo: PhotoContext }) => {
  const c = r.score >= 88 ? "text-emerald-400" : r.score >= 72 ? "text-indigo-400" : r.score >= 55 ? "text-amber-400" : "text-red-400";
  const ring = r.score >= 88 ? "border-emerald-500" : r.score >= 72 ? "border-indigo-500" : r.score >= 55 ? "border-amber-500" : "border-red-500";
  const metrics = [
    { label: "5-Eye Rule Ratio", value: r.fiveEyeRule.toFixed(2), ideal: "5.00", good: Math.abs(r.fiveEyeRule - 5) < 0.3 },
    { label: "Inter-Eye / Eye Width", value: r.interEyeRatio.toFixed(2), ideal: "1.00", good: Math.abs(r.interEyeRatio - 1) < 0.1 },
  ];
  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-2 gap-5 items-start">
        <EyeSpacingOverlay image={photo.image} landmarks={photo.landmarks} segments={r.segments} />
        <div className="space-y-5">
          <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-8 flex flex-col items-center text-center gap-5">
            <div className={`w-32 h-32 rounded-full border-4 ${ring} flex flex-col items-center justify-center shrink-0`}>
              <span className={`text-4xl font-black ${c}`}>{r.score}</span>
              <span className="text-xs text-slate-400">/100</span>
            </div>
            <div>
              <p className={`text-sm font-bold uppercase tracking-wider mb-2 ${c}`}>{r.classification}</p>
              <p className="text-slate-300 text-sm">You have <strong>{r.verdict}</strong>. The classical 5-eye rule states the face should be exactly 5 eye-widths across, with the inter-eye gap equalling one eye width.</p>
            </div>
          </div>
          <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6">
            <h3 className="text-white font-bold mb-4">Measurements</h3>
            {metrics.map(m => (
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
      </div>
      <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6">
        <h3 className="text-white font-bold mb-1">The 5 segments on your photo</h3>
        <p className="text-slate-500 text-xs mb-4">Each segment measured in eye-widths. The numbered bars above your brows match this list; the ideal for every segment is 1.00.</p>
        {r.segments.map((v: number, i: number) => (
          <div key={i} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
            <span className="flex items-center gap-3 text-slate-400 text-sm">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-slate-900" style={{ background: segmentColor(i, v) }}>{i + 1}</span>
              {SEGMENT_LABELS[i]}
            </span>
            <div className="text-right">
              <span className="font-bold text-sm text-white">{v.toFixed(2)}×</span>
              <span className="text-slate-600 text-xs ml-2">ideal: 1.00×</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const EyeSpacingPage: React.FC = () => {
  return (
    <>
      <SEO title="Eye Spacing Ratio Calculator — Free AI Eye Distance Analyzer | Facemaxify" description="Test your eye spacing ratio free with AI. Measure the 5-eye rule, inter-eye distance, and see if you have wide-set or close-set eyes according to classical proportion standards." keywords="eye spacing calculator, eye spacing ratio, 5 eye rule calculator, inter eye distance, eye distance analyzer, close set eyes test, wide set eyes test" canonicalUrl="https://facemaxify.com/tools/eye-spacing" schema={[{ "@context": "https://schema.org", "@type": "WebApplication", name: "Eye Spacing Calculator", url: "https://facemaxify.com/tools/eye-spacing", isAccessibleForFree: true, offers: { "@type": "Offer", price: "0" } }] as any} />
      <div className="min-h-screen bg-[#050510] text-white">
        <Navbar />
        <section className="max-w-4xl mx-auto px-4 pt-14 pb-4 text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-5">Free · No Signup</span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-4">Eye Spacing Calculator</h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">Upload your photo to measure your eye spacing ratio. Find out if you have wide-set or close-set eyes and how you score on the classical 5-eye rule.</p>
        </section>
        <PhotoAnalyzerShell onAnalyze={calculate} renderResults={(r, reset, photo) => <Results result={r} reset={reset} photo={photo} />} analyzeLabel="Calculate My Eye Spacing" />
        <ToolArticle slug="eye-spacing" />
      </div>
    </>
  );
};

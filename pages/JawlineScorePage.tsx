import React from "react";
import { SEO } from "../components/SEO";
import { Navbar } from "../components/Navbar";
import { PhotoAnalyzerShell } from "../components/tools/PhotoAnalyzerShell";

function dist(a: any, b: any) { return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2); }
function angle(a: any, vertex: any, b: any) {
  const v1 = { x: a.x - vertex.x, y: a.y - vertex.y };
  const v2 = { x: b.x - vertex.x, y: b.y - vertex.y };
  const dot = v1.x * v2.x + v1.y * v2.y;
  const mag = Math.sqrt(v1.x ** 2 + v1.y ** 2) * Math.sqrt(v2.x ** 2 + v2.y ** 2);
  return (Math.acos(Math.min(1, Math.max(-1, dot / mag))) * 180) / Math.PI;
}

function calculate(lm: any[]) {
  const jawW = dist(lm[172], lm[397]);
  const cheekW = dist(lm[234], lm[454]);
  const faceH = dist(lm[10], lm[152]);
  const jawToCheek = jawW / cheekW; // ideal male 0.75-0.85, female 0.65-0.75 → let's target 0.75
  const chinAngle = angle(lm[172], lm[152], lm[397]); // angle at chin - sharper = lower degrees
  // jawline definition: ratio + chin sharpness
  const ratioScore = Math.max(0, 100 - Math.abs(jawToCheek - 0.78) * 200);
  // chin angle: ideal ~60-90 degrees for a defined jawline
  const angleScore = chinAngle < 60 ? Math.max(0, 100 - (60 - chinAngle) * 3) :
    chinAngle < 100 ? 100 - (chinAngle - 60) * 1.5 : Math.max(0, 100 - (chinAngle - 100) * 2);
  const score = Math.round((ratioScore * 0.6) + (angleScore * 0.4));
  const classification = score >= 85 ? "Defined Jawline" : score >= 68 ? "Good Definition" : score >= 50 ? "Average Definition" : "Soft Jawline";
  return { score, classification, jawToCheek, chinAngle, jawW, cheekW };
}

const Results = ({ result: r, reset }: any) => {
  const c = r.score >= 85 ? "text-emerald-400" : r.score >= 68 ? "text-indigo-400" : r.score >= 50 ? "text-amber-400" : "text-red-400";
  const ring = r.score >= 85 ? "border-emerald-500" : r.score >= 68 ? "border-indigo-500" : r.score >= 50 ? "border-amber-500" : "border-red-500";
  return (
    <div className="space-y-5">
      <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-8 flex flex-col sm:flex-row items-center gap-8">
        <div className={`w-32 h-32 rounded-full border-4 ${ring} flex flex-col items-center justify-center shrink-0`}>
          <span className={`text-4xl font-black ${c}`}>{r.score}</span>
          <span className="text-xs text-slate-400">/100</span>
        </div>
        <div>
          <p className={`text-sm font-bold uppercase tracking-wider mb-2 ${c}`}>{r.classification}</p>
          <p className="text-slate-300 text-sm">Jawline score is based on the jaw-to-cheekbone width ratio and the sharpness angle at the chin. A defined jaw tapers from prominent cheekbones to a sharp chin point — the hallmark of facial structure in aesthetics.</p>
        </div>
      </div>
      <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6">
        <h3 className="text-white font-bold mb-4">Jaw Measurements</h3>
        {[
          { label: "Jaw-to-Cheekbone Ratio", value: r.jawToCheek.toFixed(2), ideal: "~0.78", good: Math.abs(r.jawToCheek - 0.78) < 0.08 },
          { label: "Chin Angle", value: `${r.chinAngle.toFixed(1)}°`, ideal: "65–90°", good: r.chinAngle >= 60 && r.chinAngle <= 95 },
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

export const JawlineScorePage: React.FC = () => {
  const faq = {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: [
      { "@type": "Question", name: "What makes a good jawline?", acceptedAnswer: { "@type": "Answer", text: "A well-defined jawline typically has a jaw width that is 75-85% of the cheekbone width (creating a tapered, V-shaped lower face), a sharp chin angle (under 90 degrees measured from the jaw angles through the chin), and clear definition between the neck and jaw. Strong cheekbones combined with a defined jaw is one of the most sought-after facial structures." } },
      { "@type": "Question", name: "How is the jawline score calculated?", acceptedAnswer: { "@type": "Answer", text: "The score combines two measurements: the jaw-to-cheekbone width ratio (jaw width divided by cheekbone width, ideal around 0.75-0.85) and the chin sharpness angle (the geometric angle formed at the chin point between the two jaw angle landmarks). A sharper, more acute angle contributes to a higher definition score." } },
      { "@type": "Question", name: "Can I improve my jawline score?", acceptedAnswer: { "@type": "Answer", text: "Jawline definition can be improved through reducing body fat (revealing existing bone structure), mewing (correct tongue posture can reshape the jaw over time), chewing hard foods, and targeted exercises. Clinical options include Botox masseter reduction, chin augmentation, or genioplasty for bone reshaping." } },
      { "@type": "Question", name: "Is the jawline analyzer free?", acceptedAnswer: { "@type": "Answer", text: "Yes — completely free, no account or credit card required. Upload a photo and get your jawline score instantly." } },
    ]
  };
  return (
    <>
      <SEO title="Jawline Score Analyzer — Free AI Jawline Rating Tool | Facemaxify" description="Get your jawline score free with AI. Our analyzer measures jaw-to-cheekbone ratio and chin sharpness to rate your jawline definition. Instant result, no signup needed." keywords="jawline score, jawline analyzer, jawline rating, jawline test, jawline calculator, jawline definition score, ai jawline analyzer" canonicalUrl="https://facemaxify.com/tools/jawline-score" schema={[faq, { "@context": "https://schema.org", "@type": "WebApplication", name: "Jawline Score Analyzer", url: "https://facemaxify.com/tools/jawline-score", isAccessibleForFree: true, offers: { "@type": "Offer", price: "0" } }] as any} />
      <div className="min-h-screen bg-[#050510] text-white">
        <Navbar />
        <section className="max-w-4xl mx-auto px-4 pt-14 pb-4 text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-5">Free · No Signup</span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-4">Jawline Score Analyzer</h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">Upload your photo to get an instant jawline score. We measure your jaw-to-cheekbone ratio and chin angle to rate your jawline definition from 0 to 100.</p>
        </section>
        <PhotoAnalyzerShell onAnalyze={calculate} renderResults={(r, reset) => <Results result={r} reset={reset} />} analyzeLabel="Analyze My Jawline" />
        <section className="bg-slate-950/60 border-t border-white/5 py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-5">What Is the Jawline Score?</h2>
            <p className="text-slate-400 mb-5 leading-relaxed">The <strong className="text-white">jawline score</strong> quantifies how defined and aesthetically balanced your jawline is based on two landmark measurements: your jaw-to-cheekbone width ratio and your chin angle sharpness. A strong jawline — one of the most sought-after facial features in both male and female aesthetics — combines prominent cheekbones with a tapered jaw and a well-defined chin point.</p>
            <h3 className="text-xl font-bold text-white mb-3 mt-8">The Jaw-to-Cheekbone Ratio</h3>
            <p className="text-slate-400 mb-5 leading-relaxed">Ideal facial structure has cheekbones that are wider than the jaw. The optimal ratio is approximately 0.75–0.85 (jaw is 75–85% of cheekbone width). This creates the classic tapered, V-shaped lower face that is strongly associated with attractiveness in both genders. Ratios above 0.90 indicate a wide, square jaw; ratios below 0.65 indicate a very narrow jaw.</p>
            <h3 className="text-xl font-bold text-white mb-3 mt-8">Chin Angle and Jawline Definition</h3>
            <p className="text-slate-400 mb-5 leading-relaxed">The sharpness of the angle at the chin point — formed between the two jaw angles (gonion) and the chin (gnathion) — determines how "pointy" or defined the chin appears. A more acute angle (60–85 degrees) creates a sharper, more defined look. A very obtuse angle (over 110 degrees) creates a rounded, softer jawline profile.</p>
            <h2 className="text-2xl font-bold text-white mt-10 mb-5">FAQ</h2>
            {[
              { q: "What makes a strong jawline?", a: "A strong jawline has cheekbones wider than the jaw (ratio ~0.78), a sharp chin angle under 90°, and clear neck-to-jaw definition. These features project confidence and are consistently rated highly in attractiveness research." },
              { q: "How can I get a better jawline?", a: "Body fat reduction, mewing, chewing exercises, and proper posture can improve jawline definition over time. Medical options include jaw fillers, Botox masseter slimming, chin augmentation, and genioplasty." },
              { q: "Does jawline matter for attractiveness?", a: "Yes — especially for men. A defined jawline is one of the strongest predictors of male facial attractiveness in research studies. For women, a softer but still well-defined jaw is typically preferred." },
              { q: "Is the jawline analyzer free?", a: "Yes — upload a photo and get your result instantly, no account needed." },
            ].map(({ q, a }) => <div key={q} className="mb-4 p-5 bg-slate-900/40 rounded-2xl border border-white/5"><h4 className="text-white font-bold mb-2">{q}</h4><p className="text-slate-400 text-sm">{a}</p></div>)}
          </div>
        </section>
      </div>
    </>
  );
};

import React from "react";
import { SEO } from "../components/SEO";
import { Navbar } from "../components/Navbar";
import { PhotoAnalyzerShell } from "../components/tools/PhotoAnalyzerShell";

function calculate(lm: any[]) {
  const noseBaseY = lm[94].y;
  const cupidsBowY = lm[0].y;
  const lowerLipY = lm[17].y;
  const chinY = lm[152].y;
  const lowerThirdH = Math.abs(chinY - noseBaseY) || 1;
  const philtrumH = Math.abs(cupidsBowY - noseBaseY);
  const lipsH = Math.abs(lowerLipY - cupidsBowY);
  const chinH = Math.abs(chinY - lowerLipY);
  const philtrumPct = (philtrumH / lowerThirdH) * 100;
  const lipsPct = (lipsH / lowerThirdH) * 100;
  const chinPct = (chinH / lowerThirdH) * 100;
  // Ideal: philtrum ~22%, lips ~44%, chin ~34%
  const score = Math.max(0, Math.round(100 - (Math.abs(philtrumPct - 22) + Math.abs(lipsPct - 44) + Math.abs(chinPct - 34)) * 1.5));
  const classification = score >= 80 ? "Ideal Lower Third" : score >= 62 ? "Well-Balanced" : score >= 45 ? "Slight Imbalance" : "Notable Imbalance";
  return { score, classification, philtrumPct, lipsPct, chinPct };
}

const Results = ({ result: r, reset }: any) => {
  const c = r.score >= 80 ? "text-emerald-400" : r.score >= 62 ? "text-indigo-400" : r.score >= 45 ? "text-amber-400" : "text-red-400";
  const ring = r.score >= 80 ? "border-emerald-500" : r.score >= 62 ? "border-indigo-500" : r.score >= 45 ? "border-amber-500" : "border-red-500";
  const zones = [
    { label: "Philtrum", pct: r.philtrumPct, ideal: 22 },
    { label: "Lips (cupid's bow to lower lip)", pct: r.lipsPct, ideal: 44 },
    { label: "Chin (lower lip to chin tip)", pct: r.chinPct, ideal: 34 },
  ];
  return (
    <div className="space-y-5">
      <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-8 flex flex-col sm:flex-row items-center gap-8">
        <div className={`w-32 h-32 rounded-full border-4 ${ring} flex flex-col items-center justify-center shrink-0`}>
          <span className={`text-4xl font-black ${c}`}>{r.score}</span>
          <span className="text-xs text-slate-400">/100</span>
        </div>
        <div>
          <p className={`text-sm font-bold uppercase tracking-wider mb-2 ${c}`}>{r.classification}</p>
          <p className="text-slate-300 text-sm">The lower third ideally divides into: philtrum (~22%), lips (~44%), and chin (~34%). Your breakdown shows how each zone compares to the classical ideal.</p>
        </div>
      </div>
      <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6">
        <h3 className="text-white font-bold mb-4">Lower Third Breakdown</h3>
        {zones.map(z => {
          const dev = Math.abs(z.pct - z.ideal);
          const col = dev < 5 ? "bg-emerald-500" : dev < 10 ? "bg-indigo-500" : dev < 18 ? "bg-amber-500" : "bg-red-500";
          return (
            <div key={z.label} className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-300">{z.label}</span>
                <span className="text-slate-400">{z.pct.toFixed(1)}% <span className="text-slate-600">(ideal ~{z.ideal}%)</span></span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full ${col} rounded-full`} style={{ width: `${Math.min(100, z.pct * 2)}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const LowerThirdPage: React.FC = () => {
  const faq = {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: [
      { "@type": "Question", name: "What are the three zones of the lower third?", acceptedAnswer: { "@type": "Answer", text: "The lower third of the face (from nose base to chin) divides into three sub-zones: the philtrum (nose base to cupid's bow), the lips (cupid's bow to bottom of lower lip), and the chin (lower lip to chin tip). The ideal proportions are approximately 22% philtrum, 44% lips, and 34% chin. These proportions were established through analysis of faces consistently rated as highly attractive." } },
      { "@type": "Question", name: "Why does lower third proportion matter?", acceptedAnswer: { "@type": "Answer", text: "The lower third contains the most aesthetically variable features — lips, philtrum, and chin. Imbalances in this zone dramatically affect how attractive and youthful a face appears. A long philtrum makes lips look thin; an underdeveloped chin makes the lower face look weak; disproportionately small lips affect the balance between philtrum and mentum." } },
      { "@type": "Question", name: "How is lower third analysis different from facial thirds analysis?", acceptedAnswer: { "@type": "Answer", text: "Facial thirds analysis measures whether the three major horizontal zones of the face (upper, middle, lower) are roughly equal. Lower third analysis zooms into just the bottom third and measures how the philtrum, lips, and chin are proportioned within it. Both analyses are complementary." } },
      { "@type": "Question", name: "Is the lower third analyzer free?", acceptedAnswer: { "@type": "Answer", text: "Yes — free, instant, no signup required." } },
    ]
  };
  return (
    <>
      <SEO title="Lower Third Face Analysis — Free AI Lower Face Proportion Calculator | Facemaxify" description="Analyze your lower third face proportions free with AI. Measure your philtrum, lips, and chin zones to see how your lower face compares to the aesthetic ideal proportion." keywords="lower third face analysis, lower third ratio, lower third calculator, lower face proportion, philtrum lip chin ratio, lower third face proportion" canonicalUrl="https://facemaxify.com/tools/lower-third" schema={[faq, { "@context": "https://schema.org", "@type": "WebApplication", name: "Lower Third Face Analyzer", url: "https://facemaxify.com/tools/lower-third", isAccessibleForFree: true, offers: { "@type": "Offer", price: "0" } }] as any} />
      <div className="min-h-screen bg-[#050510] text-white">
        <Navbar />
        <section className="max-w-4xl mx-auto px-4 pt-14 pb-4 text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-5">Free · No Signup</span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-4">Lower Third Face Analysis</h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">Upload your photo to measure how your philtrum, lips, and chin divide your lower third — and compare it to the classical ideal proportions used in facial aesthetics.</p>
        </section>
        <PhotoAnalyzerShell onAnalyze={calculate} renderResults={(r, reset) => <Results result={r} reset={reset} />} analyzeLabel="Analyze My Lower Third" />
        <section className="bg-slate-950/60 border-t border-white/5 py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-5">Lower Third Facial Proportions Explained</h2>
            <p className="text-slate-400 mb-5 leading-relaxed">The <strong className="text-white">lower third</strong> of the face — from the nose base to the chin tip — is subdivided into three zones that each contribute to lower face aesthetics. The philtrum (25%), the lips (44%), and the chin (34%) together create the lower face harmony. When these proportions are balanced, the lower face has a natural, attractive quality; imbalances in any zone can affect the entire aesthetic of the face.</p>
            <h3 className="text-xl font-bold text-white mb-3 mt-8">The Importance of Lip Proportion</h3>
            <p className="text-slate-400 mb-5 leading-relaxed">Lips occupy approximately 44% of the lower third in an aesthetically ideal face — the largest single zone. This means the lips are the dominant feature of the lower face, not the chin or the philtrum. Excessive philtrum length (reducing the lip percentage) or a very tall chin (reducing the lip percentage from below) both diminish the lip zone's prominence.</p>
            <h3 className="text-xl font-bold text-white mb-3 mt-8">Cosmetic Surgery and Lower Third Harmony</h3>
            <p className="text-slate-400 mb-5 leading-relaxed">Lower third analysis is a foundational planning tool in cosmetic surgery. Lip augmentation, chin fillers, lip lifts, and genioplasty are all planned with reference to these proportions. Understanding where your lower third is out of balance tells you exactly which improvement will have the highest aesthetic return.</p>
            <h2 className="text-2xl font-bold text-white mt-10 mb-5">FAQ</h2>
            {[
              { q: "What is the ideal lower third proportion?", a: "Approximately philtrum 22%, lips 44%, chin 34%. The lips should be the dominant zone, with the philtrum short and the chin providing a defined endpoint." },
              { q: "Does lower third balance affect age perception?", a: "Yes — philtrum elongation and lip thinning are key aging signs. A compact philtrum with full lips reads as youthful; a long philtrum with thin lips reads as aged." },
              { q: "What improves lower third harmony?", a: "Lip filler, lip lift, chin filler, chin implant, or genioplasty depending on which zone is out of proportion. The full Facemaxify analysis identifies exactly which zones need attention." },
              { q: "Is this lower third test free?", a: "Yes — completely free, no account needed." },
            ].map(({ q, a }) => <div key={q} className="mb-4 p-5 bg-slate-900/40 rounded-2xl border border-white/5"><h4 className="text-white font-bold mb-2">{q}</h4><p className="text-slate-400 text-sm">{a}</p></div>)}
          </div>
        </section>
      </div>
    </>
  );
};

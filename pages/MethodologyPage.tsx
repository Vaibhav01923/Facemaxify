import React from "react";
import { SEO } from "../components/SEO";
import { Navbar } from "../components/Navbar";
import { ToolArticle } from "../components/tools/ToolArticle";

// Public reference for how every Facemaxify score is calculated. The body lives in
// content/pages/methodology.md; keep it in step with the scoring code in pages/*Page.tsx
// and utils/*Calculator.ts.
export const MethodologyPage: React.FC = () => {
  return (
    <>
      <SEO title="How Facemaxify Scores Faces: Methodology" description="How Facemaxify measures faces: 478 facial landmarks, published targets and weights for every score, what the scores don't measure, known limitations, and what happens to your photo." keywords="facemaxify methodology, how face rating works, facial analysis method, face score calculation, attractiveness score method" canonicalUrl="https://facemaxify.com/methodology" schema={{ "@context": "https://schema.org", "@type": "AboutPage", name: "How Facemaxify Scores Faces", url: "https://facemaxify.com/methodology", dateModified: "2026-10-03", publisher: { "@type": "Organization", name: "Facemaxify", url: "https://facemaxify.com" } }} />
      <div className="min-h-screen bg-[#050510] text-white">
        <Navbar />
        <section className="max-w-3xl mx-auto px-4 pt-14 pb-2 text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-5">
            Methodology
          </span>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">How Facemaxify scores faces</h1>
          <p className="text-lg text-slate-400">
            Every measurement, target and weight behind our scores — plus what they can't tell you and what happens to your photo.
          </p>
          <p className="text-sm text-slate-500 mt-4">Last updated: 3 October 2026</p>
        </section>
        <ToolArticle slug="methodology" />
      </div>
    </>
  );
};

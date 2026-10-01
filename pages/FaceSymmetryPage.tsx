import React from "react";
import { SEO } from "../components/SEO";
import { FaceSymmetryAnalyzer } from "../components/tools/FaceSymmetryAnalyzer";
import { Navbar } from "../components/Navbar";
import { ToolArticle } from "../components/tools/ToolArticle";

export const FaceSymmetryPage: React.FC = () => {
  const webAppSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Free Facial Symmetry Test — AI Face Symmetry Analyzer",
    url: "https://facemaxify.com/tools/face-symmetry",
    description: "Free AI tool that measures facial symmetry from a photo. Get a zone-by-zone symmetry breakdown across eyes, eyebrows, mouth, cheekbones, jaw and more.",
    applicationCategory: "UtilityApplication",
    operatingSystem: "Web Browser",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };

  return (
    <>
      <SEO
        title="Free Facial Symmetry Test — AI Face Symmetry Analyzer | Facemaxify"
        description="Test your facial symmetry for free with AI. Upload a photo to get an instant zone-by-zone symmetry score across eyes, cheekbones, jaw, mouth corners, and more. No signup needed."
        keywords="facial symmetry test, face symmetry analyzer, facial symmetry analysis, face symmetry test free, ai facial symmetry, symmetry face score, face symmetry checker"
        canonicalUrl="https://facemaxify.com/tools/face-symmetry"
        schema={webAppSchema}
      />

      <div className="min-h-screen bg-[#050510] text-white">
        <Navbar />

        {/* Hero */}
        <section className="max-w-4xl mx-auto px-4 pt-14 pb-4 text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-5">
            Free · Instant · No Signup
          </span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white mb-4">
            Facial Symmetry Test
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Upload a front-facing photo and our AI instantly measures left-right symmetry across 8 facial zones — eyes, eyebrows, mouth corners, cheekbones, nostrils, and jaw angles.
          </p>
        </section>

        {/* Tool */}
        <FaceSymmetryAnalyzer />

        <ToolArticle slug="face-symmetry" />
      </div>
    </>
  );
};

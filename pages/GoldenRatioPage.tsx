import React, { useEffect } from "react";
import { SEO } from "../components/SEO";
import { GoldenRatioAnalyzer } from "../components/tools/GoldenRatioAnalyzer";

export const GoldenRatioPage: React.FC = () => {
  // FAQ Schema JSON-LD
  const sidebarSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is the Golden Ratio face test?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "The Golden Ratio face test measures how closely your facial features align with the mathematical ratio of 1.618 (Phi). It analyzes proportions like face length to width, nose width to mouth width, and eye distance to determine a symmetry score.",
        },
      },
      {
        "@type": "Question",
        name: "Is the Golden Ratio face calculator accurate?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Our tool uses advanced AI to detect precise facial landmarks and calculate ratios mathematically. While highly accurate for geometric analysis, beauty is subjective and cultural.",
        },
      },
      {
        "@type": "Question",
        name: "What is a good Golden Ratio face score?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "A score above 1.6 or within the 1.6-1.7 range is traditionally considered ideal. In our 0-100 scoring system, a score above 70 indicates good harmony, while 90+ is exceptional.",
        },
      },
    ],
  };

  return (
    <>
      <SEO
        title="Golden Ratio Face Calculator: Test Your Facial Symmetry Score (Free)"
        description="Calculate your Golden Ratio face score instantly with AI. Measure your facial proportions against the perfect 1.618 Phi ratio. Free, fast, and private."
        keywords="golden ratio face calculator, face symmetry test, phi ratio face, beauty calculator, facial proportions test, golden ratio mask"
        canonicalUrl="https://facemaxify.com/tools/golden-ratio"
        schema={JSON.stringify(sidebarSchema)}
      />

      <GoldenRatioAnalyzer />

      {/* SEO Content Section */}
      <section className="bg-[#050510] py-16 px-4 border-t border-slate-800">
        <div className="max-w-4xl mx-auto prose prose-invert">
          <h2 className="text-3xl font-bold text-white mb-6">
            Understanding the Golden Ratio Face
          </h2>
          <p className="text-slate-400 mb-6">
            The Golden Ratio (represented by the Greek letter phi, φ) is a
            mathematical number approximately equal to 1.618. It appears
            frequently in geometry, art, architecture, and nature. In terms of
            facial aesthetics, scientists and artists have found that faces
            perceived as most beautiful often adhere closely to this ratio.
          </p>

          <h3 className="text-2xl font-bold text-white mb-4">How It Works</h3>
          <ul className="list-disc pl-6 text-slate-400 space-y-2 mb-8">
            <li>
              We analyze your <strong>Face Length vs Width</strong>.Ideally, the
              face should be 1.618 times longer than it is wide.
            </li>
            <li>
              We measure <strong>Nose to Lip</strong> distance relative to chin
              length.
            </li>
            <li>
              We check the <strong>Eye Spacing</strong> relative to eye width.
            </li>
          </ul>

          <h3 className="text-2xl font-bold text-white mb-4">
            Why Use This Tool?
          </h3>
          <p className="text-slate-400 mb-6">
            Unlike simple filters, this calculator uses computer vision to map
            468 data points on your face. It provides a quantifiable "beauty
            score" based purely on geometric harmony, helping you identify your
            strongest features and areas where styling (hair, glasses, makeup)
            can enhance your natural balance.
          </p>
        </div>
      </section>
    </>
  );
};

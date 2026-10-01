import React, { useEffect } from "react";
import { SEO } from "../components/SEO";
import { GoldenRatioAnalyzer } from "../components/tools/GoldenRatioAnalyzer";
import { ToolArticle } from "../components/tools/ToolArticle";

export const GoldenRatioPage: React.FC = () => {

  return (
    <>
      <SEO
        title="Golden Ratio Face Calculator: Test Your Facial Symmetry Score (Free)"
        description="Calculate your Golden Ratio face score instantly with AI. Measure your facial proportions against the perfect 1.618 Phi ratio. Free, fast, and private."
        keywords="golden ratio face calculator, face symmetry test, phi ratio face, beauty calculator, facial proportions test, golden ratio mask"
        canonicalUrl="https://facemaxify.com/tools/golden-ratio"
        schema={{ "@context": "https://schema.org", "@type": "WebApplication", name: "Golden Ratio Face Calculator", url: "https://facemaxify.com/tools/golden-ratio", applicationCategory: "UtilityApplication", isAccessibleForFree: true, offers: { "@type": "Offer", price: "0" } }}
      />

      <GoldenRatioAnalyzer />

      <ToolArticle slug="golden-ratio" />
    </>
  );
};

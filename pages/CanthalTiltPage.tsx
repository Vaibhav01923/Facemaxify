import React from "react";
import { SEO } from "../components/SEO";
import { CanthalTiltAnalyzer } from "../components/tools/CanthalTiltAnalyzer";
import { ToolArticle } from "../components/tools/ToolArticle";

export const CanthalTiltPage: React.FC = () => {

  return (
    <>
      <SEO
        title="Canthal Tilt Calculator & Angle Test | Check Your Eye Tilt"
        description="Calculate your precise canthal tilt angle instantly. Discover if you have a positive, neutral, or negative eye tilt with our free AI facial analysis tool."
        keywords="canthal tilt calculator, positive canthal tilt, negative canthal tilt, eye tilt test, hunter eyes test, facial analysis, eye shape detector"
        canonicalUrl="https://facemaxify.com/tools/canthal-tilt"
        schema={{ "@context": "https://schema.org", "@type": "WebApplication", name: "Canthal Tilt Calculator", url: "https://facemaxify.com/tools/canthal-tilt", applicationCategory: "UtilityApplication", isAccessibleForFree: true, offers: { "@type": "Offer", price: "0" } }}
      />

      <CanthalTiltAnalyzer />

      <ToolArticle slug="canthal-tilt" />
    </>
  );
};

import React from "react";
import { FacialShapeAnalyzer } from "../components/tools/FacialShapeAnalyzer";
import { ToolArticle } from "../components/tools/ToolArticle";
import { SEO } from "../components/SEO";

export const FacialShapePage: React.FC = () => {
  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "AI Face Shape Detector",
      description:
        "Free AI-powered face shape detector with instant analysis and personalized recommendations",
      url: "https://facemaxify.com/tools/facial-shape",
      applicationCategory: "UtilityApplication",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      featureList: [
        "AI-powered face shape detection",
        "7 face shape classifications",
        "Personalized hairstyle recommendations",
        "Glasses frame suggestions",
        "Makeup tips",
        "Celebrity face matches",
        "No signup required",
        "Privacy friendly",
      ],
    },
  ];

  return (
    <>
      <SEO
        title="Free AI Face Shape Detector: Find Your Face Shape Instantly | Facemaxify"
        description="Discover your face shape with our free AI-powered detector. Instant analysis with personalized hairstyle, glasses, and makeup recommendations. No signup required!"
        keywords="face shape detector, AI face shape analyzer, what is my face shape, face shape calculator, determine face shape, face shape test, oval face shape, round face shape, free face shape tool"
        canonicalUrl="https://facemaxify.com/tools/facial-shape"
        schema={schemas}
      />

      <FacialShapeAnalyzer />

      <ToolArticle slug="facial-shape" />
    </>
  );
};

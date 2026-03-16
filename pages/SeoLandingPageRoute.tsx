import React from "react";
import { Navigate, useParams } from "react-router-dom";
import { SeoLandingPage } from "../components/SeoLandingPage";
import { seoLandingPageMap } from "../data/seoLandingPages";

export const SeoLandingPageRoute: React.FC = () => {
  const { slug } = useParams();

  if (!slug || !seoLandingPageMap[slug]) {
    return <Navigate to="/" replace />;
  }

  return <SeoLandingPage page={seoLandingPageMap[slug]} />;
};

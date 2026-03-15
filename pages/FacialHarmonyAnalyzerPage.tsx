import React from "react";
import { SeoLandingPage } from "../components/SeoLandingPage";
import { seoLandingPageMap } from "../data/seoLandingPages";

export const FacialHarmonyAnalyzerPage: React.FC = () => (
  <SeoLandingPage page={seoLandingPageMap["facial-harmony-analyzer"]} />
);

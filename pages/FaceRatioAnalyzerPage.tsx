import React from "react";
import { SeoLandingPage } from "../components/SeoLandingPage";
import { seoLandingPageMap } from "../data/seoLandingPages";

export const FaceRatioAnalyzerPage: React.FC = () => (
  <SeoLandingPage page={seoLandingPageMap["face-ratio-analyzer"]} />
);

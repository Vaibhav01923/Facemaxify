import React from "react";
import { SeoLandingPage } from "../components/SeoLandingPage";
import { seoLandingPageMap } from "../data/seoLandingPages";

export const FacialHarmonyScorePage: React.FC = () => (
  <SeoLandingPage page={seoLandingPageMap["facial-harmony-score"]} />
);

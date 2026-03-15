import React from "react";
import { SeoLandingPage } from "../components/SeoLandingPage";
import { seoLandingPageMap } from "../data/seoLandingPages";

export const LooksmaxCalculatorPage: React.FC = () => (
  <SeoLandingPage page={seoLandingPageMap["looksmax-calculator"]} />
);

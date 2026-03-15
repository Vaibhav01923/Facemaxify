import React from "react";
import { SeoLandingPage } from "../components/SeoLandingPage";
import { seoLandingPageMap } from "../data/seoLandingPages";

export const FaceSymmetryTestPage: React.FC = () => (
  <SeoLandingPage page={seoLandingPageMap["face-symmetry-test"]} />
);

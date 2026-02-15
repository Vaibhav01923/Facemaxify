import React from "react";
import { useLocation } from "react-router-dom";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  type?: string;
  canonicalUrl?: string;
}

/**
 * SEO Component - Dynamically updates meta tags for better search engine optimization
 * Usage: <SEO title="Page Title" description="Page description" />
 */
export const SEO: React.FC<SEOProps> = ({
  title = "Free AI Face Analyzer: Facial Symmetry, Beauty Score & LooksMax Analysis",
  description = "Free AI-powered facial analysis tool. Instantly analyze facial symmetry, beauty score, proportions & golden ratio. Get personalized LooksMax recommendations with mathematical precision. No signup required.",
  keywords = "free face analyzer, AI face rating, facial symmetry analyzer, beauty score calculator, looksmax AI, face analysis free, golden ratio face",
  image = "https://facemaxify.com/og-image.png",
  type = "website",
  canonicalUrl,
}) => {
  const location = useLocation();
  const baseUrl = "https://facemaxify.com";
  const currentUrl = canonicalUrl || `${baseUrl}${location.pathname}`;

  React.useEffect(() => {
    // Update document title
    document.title = title;

    // Update or create meta tags
    const updateMetaTag = (
      name: string,
      content: string,
      isProperty = false,
    ) => {
      const attribute = isProperty ? "property" : "name";
      let element = document.querySelector(`meta[${attribute}="${name}"]`);

      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }

      element.setAttribute("content", content);
    };

    // Primary meta tags
    updateMetaTag("description", description);
    updateMetaTag("keywords", keywords);

    // Open Graph tags
    updateMetaTag("og:title", title, true);
    updateMetaTag("og:description", description, true);
    updateMetaTag("og:image", image, true);
    updateMetaTag("og:url", currentUrl, true);
    updateMetaTag("og:type", type, true);

    // Twitter Card tags
    updateMetaTag("twitter:title", title);
    updateMetaTag("twitter:description", description);
    updateMetaTag("twitter:image", image);
    updateMetaTag("twitter:card", "summary_large_image");

    // Update canonical link
    let canonicalLink = document.querySelector(
      'link[rel="canonical"]',
    ) as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.rel = "canonical";
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = currentUrl;
  }, [title, description, keywords, image, type, currentUrl]);

  return null; // This component doesn't render anything
};

// Pre-configured SEO for common pages
export const DashboardSEO: React.FC = () => (
  <SEO
    title="Dashboard - Facemaxify | Your Facial Analysis Hub"
    description="Access your facial analysis dashboard. View your analysis results, guides, and personalized recommendations."
    keywords="facial analysis dashboard, beauty metrics, face analysis results"
  />
);

export const FacialAnalysisSEO: React.FC = () => (
  <SEO
    title="Free Facial Analysis Tool - AI Face Analyzer | Instant Beauty Score & Symmetry"
    description="Upload your photo for free AI-powered facial analysis. Get instant beauty score, symmetry analysis, and LooksMax recommendations with mathematical precision. No signup required."
    keywords="free facial analysis, AI face scanner free, beauty score calculator, facial symmetry test, free face rating, AI facial analysis tool, looksmax analyzer"
  />
);

export const GuidesSEO: React.FC = () => (
  <SEO
    title="Beauty & Facial Improvement Guides - Facemaxify"
    description="Access comprehensive guides on facial improvement, beauty enhancement, and maximizing your appearance. Evidence-based, no-BS protocols."
    keywords="facial improvement guides, beauty enhancement, appearance improvement, facial aesthetics"
  />
);

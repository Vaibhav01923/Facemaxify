import type { ReactNode } from "react";

// Languages besides English (English pages live at their original, unprefixed URLs).
// To add a language: extend this union, then add its entries in registry.ts, strings.ts and
// the engine dictionaries under components/i18n/engines/ — see I18N_GUIDE.md.
export type Locale = "es" | "ja";

// The measuring logic behind a localized tool page. Each one reuses the calculation of an
// existing English tool, so scores stay identical across languages.
export type EngineId =
  | "hunter-eyes"
  | "attractiveness"
  | "face-rating"
  | "looksmax"
  | "face-shape"
  | "face-symmetry"
  | "golden-ratio";

export interface LocaleMeta {
  htmlLang: string; // <html lang>
  hreflang: string; // hreflang attribute and sitemap annotation
  ogLocale: string; // og:locale
  metaLanguage: string; // legacy <meta name="language">
  name: string; // the language's own name, shown in the language switcher
}

export interface PageSeo {
  title: string;
  description: string;
  keywords: string;
}

export interface LocalizedPage {
  locale: Locale;
  // Path segment after /<locale>/ — localized and keyword-led, e.g. "ojos-de-cazador".
  slug: string;
  // Pages in the same group are translations of each other (hreflang). Groups named after an
  // English tool also include that English page, see ENGLISH_GROUP_PATHS in registry.ts.
  group: string;
  engine: EngineId;
  // Last meaningful content edit, ISO date — used for the sitemap's <lastmod>.
  updated: string;
  seo: PageSeo;
  hero: { badge: string; h1: string; intro: string };
  analyzeLabel: string;
  // Name used in the WebApplication structured data.
  schemaName: string;
  // Short card text for the hub page and the "other tools" list.
  card: { title: string; blurb: string };
  // Slugs (same locale) of the tools to link at the bottom of the page, in order.
  related: string[];
}

export interface LocalizedHub {
  locale: Locale;
  updated: string;
  seo: PageSeo;
  hero: { badge: string; h1: string; intro: string };
  // Heading above the grid of tool cards.
  toolsHeading: string;
}

// Everything PhotoAnalyzerShell prints, so localized tool pages can swap the language.
export interface ShellStrings {
  uploadTitle: string;
  uploadHint: string;
  uploadedAlt: string;
  analyzing: string;
  notAnImage: string;
  tooLarge: string;
  noFace: string;
  failed: string;
  ctaTitle: string;
  ctaBody: ReactNode;
  ctaButton: string;
  another: string;
  // Small line under the upload box (privacy note). English pages show none.
  footnote?: string;
}

export interface UiStrings {
  navHub: string;
  navFullReport: string;
  logoLabel: string;
  relatedHeading: string;
  allToolsLink: string;
  disclaimerHeading: string;
  disclaimer: string;
  fullReportNote: string;
  languageNavLabel: string;
  shell: ShellStrings;
}

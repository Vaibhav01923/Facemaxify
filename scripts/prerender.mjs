// Post-build step: turns each public route into a static HTML file that already carries the
// page's content and its own <title>/<meta description>/<link canonical>/OG/Twitter tags,
// so crawlers get the real page on the very first HTML response, without waiting for
// client-side JS to run.
//
// Vercel serves a matching static file ahead of the `/(.*) -> /spa.html` rewrite in
// vercel.json, so writing dist/<route>/index.html is enough to override the SPA shell for
// that route. The shell itself is kept as dist/spa.html, since dist/index.html becomes the
// prerendered homepage.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import { build, loadEnv } from "vite";
import { renderHtmlWithMeta } from "../api/_lib/htmlMeta.js";
import { applyLocaleHead, buildSitemapXml, withAlternates, withJsonLd } from "./i18nHead.mjs";

const rootDir = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const distDir = path.join(rootDir, "dist");
const template = readFileSync(path.join(distDir, "index.html"), "utf8");

// --- 1. Tool pages: metadata lives inline in each page component's <SEO .../> tag ---
// /blog is deliberately not here: api/blog-index.js renders it per request so it can list
// posts published after the deploy, and a static dist/blog/index.html would shadow that.
const toolPages = [
  ["/methodology", "pages/MethodologyPage.tsx"],
  ["/tools", "pages/ToolsDirectoryPage.tsx"],
  ["/tools/facial-shape", "pages/FacialShapePage.tsx"],
  ["/tools/golden-ratio", "pages/GoldenRatioPage.tsx"],
  ["/tools/canthal-tilt", "pages/CanthalTiltPage.tsx"],
  ["/tools/face-symmetry", "pages/FaceSymmetryPage.tsx"],
  ["/tools/facial-thirds", "pages/FacialThirdsPage.tsx"],
  ["/tools/eye-spacing", "pages/EyeSpacingPage.tsx"],
  ["/tools/jawline-score", "pages/JawlineScorePage.tsx"],
  ["/tools/nose-ratio", "pages/NoseRatioPage.tsx"],
  ["/tools/lip-ratio", "pages/LipRatioPage.tsx"],
  ["/tools/hunter-eyes", "pages/HunterEyesPage.tsx"],
  ["/tools/facial-width-height", "pages/FacialWidthHeightPage.tsx"],
  ["/tools/cheekbone-width", "pages/CheekboneWidthPage.tsx"],
  ["/tools/midface-ratio", "pages/MidfaceRatioPage.tsx"],
  ["/tools/forehead-ratio", "pages/ForeheadRatioPage.tsx"],
  ["/tools/philtrum-ratio", "pages/PhiltrumRatioPage.tsx"],
  ["/tools/brow-position", "pages/BrowPositionPage.tsx"],
  ["/tools/chin-ratio", "pages/ChinRatioPage.tsx"],
  ["/tools/lower-third", "pages/LowerThirdPage.tsx"],
  ["/tools/looksmax-score", "pages/LooksmaxScorePage.tsx"],
  ["/tools/psl-rating", "pages/PslRatingPage.tsx"],
  ["/tools/face-rating", "pages/FaceRatingPage.tsx"],
  ["/tools/attractiveness-score", "pages/AttractivenessScorePage.tsx"],
  ["/tools/harmony-score", "pages/HarmonyScorePage.tsx"],
];

function extractSeoProps(source) {
  const match = source.match(/<SEO\b[\s\S]*?\/>/);
  if (!match) return null;
  const block = match[0];
  const get = (attr) => {
    const m = block.match(new RegExp(`${attr}="([^"]*)"`));
    return m ? m[1] : undefined;
  };
  return {
    title: get("title"),
    description: get("description"),
    keywords: get("keywords"),
    canonicalUrl: get("canonicalUrl"),
  };
}

const routes = [];

for (const [route, file] of toolPages) {
  const source = readFileSync(path.join(rootDir, file), "utf8");
  const meta = extractSeoProps(source);
  if (!meta?.title || !meta?.description || !meta?.canonicalUrl) {
    console.warn(`[prerender] skipping ${route} — could not extract SEO props from ${file}`);
    continue;
  }
  routes.push({ route, ...meta });
}

// --- 2. Build the app for Node, so pages can be rendered to HTML ---
// Clerk and MediaPipe only run in a browser, so this build swaps in stand-ins for them
// (scripts/ssr/). services/supabase.ts creates its client on import and throws without a
// URL; rendering never queries it, so a placeholder covers builds that lack the env vars.
const env = loadEnv("production", rootDir, "VITE_");
process.env.VITE_SUPABASE_URL = env.VITE_SUPABASE_URL || "https://prerender.invalid";
process.env.VITE_SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || "prerender";

const ssrOutDir = path.join(rootDir, "node_modules/.cache/prerender");
await build({
  root: rootDir,
  configFile: path.join(rootDir, "vite.config.ts"),
  logLevel: "warn",
  resolve: {
    alias: [
      { find: /^@clerk\/clerk-react$/, replacement: path.join(rootDir, "scripts/ssr/clerk-stub.tsx") },
      { find: /^@mediapipe\/.+$/, replacement: path.join(rootDir, "scripts/ssr/mediapipe-stub.ts") },
    ],
  },
  build: {
    ssr: path.join(rootDir, "scripts/ssr/entry-server.tsx"),
    outDir: ssrOutDir,
    emptyOutDir: true,
    copyPublicDir: false,
  },
});
const { render, seoLandingPages, articles, i18n, i18nUi } = await import(
  pathToFileURL(path.join(ssrOutDir, "entry-server.js")).href
);

// FAQPage structured data built from a tool article's "## Frequently asked questions"
// section (or its Spanish / Japanese equivalent), so it always matches the questions shown on
// the page.
function plainText(markdown) {
  return markdown
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*`>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function faqJsonLd(markdown) {
  const section = markdown
    .split(/^## /m)
    .find((s) => /^(frequently asked questions|preguntas frecuentes|よくある質問)/i.test(s));
  if (!section) return null;
  const mainEntity = section
    .split(/^### /m)
    .slice(1)
    .map((block) => {
      const [question, ...answer] = block.split("\n");
      return {
        "@type": "Question",
        name: question.trim(),
        acceptedAnswer: { "@type": "Answer", text: plainText(answer.join("\n")) },
      };
    });
  const json = JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity });
  return `<script type="application/ld+json" id="faq-json-ld">${json.replace(/</g, "\\u003c")}</script>`;
}

// Pages outside /tools/ that render an article from content/pages/, by route.
const pageArticles = { "/methodology": "methodology" };

function withFaqMarkdown(html, markdown) {
  const script = markdown && faqJsonLd(markdown);
  return script ? html.replace("</head>", () => `${script}\n  </head>`) : html;
}

function withFaq(html, route) {
  const slug = route.startsWith("/tools/") ? route.slice("/tools/".length) : pageArticles[route];
  return withFaqMarkdown(html, slug && articles[slug]);
}

// --- 3. Programmatic landing pages: metadata lives in data/seoLandingPages.ts ---
for (const page of seoLandingPages) {
  routes.push({
    route: `/${page.slug}`,
    title: page.title,
    description: page.description,
    keywords: page.keywords,
    canonicalUrl: `https://facemaxify.com/${page.slug}`,
  });
}

// --- 4. Write each route's HTML: its metadata in <head>, its rendered page in #root ---
const EMPTY_ROOT = '<div id="root"></div>';
let withContent = 0;

function renderInto(html, route) {
  if (!html.includes(EMPTY_ROOT)) throw new Error(`[prerender] template has no empty #root`);
  try {
    const page = render(route);
    withContent++;
    return html.replace(EMPTY_ROOT, () => `<div id="root">${page}</div>`);
  } catch (err) {
    // Still ship the metadata; the app renders the page in the browser as before.
    console.warn(`[prerender] could not render ${route}, writing metadata only:`, err);
    return html;
  }
}

// The untouched shell serves every route without a static file (dashboard, blog, ...).
writeFileSync(path.join(distDir, "spa.html"), template);
writeFileSync(path.join(distDir, "index.html"), renderInto(template, "/"));

for (const meta of routes) {
  const outDir = path.join(distDir, meta.route.replace(/^\//, ""));
  mkdirSync(outDir, { recursive: true });
  // English pages that have a translation also list its URL (hreflang), as the translation lists theirs.
  const head = withAlternates(withFaq(renderHtmlWithMeta(template, meta), meta.route), i18n.alternatesForPath(meta.route));
  writeFileSync(path.join(outDir, "index.html"), renderInto(head, meta.route));
}

// --- 5. Translated pages (Spanish, Japanese): /<locale> hubs and /<locale>/<slug> tool pages ---
// Copy comes from i18n/pages.ts, articles from content/i18n/<locale>/. Unlike the pages above, a
// problem here (missing article, missing translation, a render error) fails the build instead of
// quietly shipping a page without its content.
i18n.validateRegistry();

function writeTranslatedPage({ locale, route, seo, articleKey, jsonLd }) {
  const markdown = articles[articleKey];
  if (!markdown) throw new Error(`[prerender] ${route} has no article: expected content/i18n/${articleKey}.md`);
  const localeMeta = i18n.LOCALE_META[locale];
  const canonicalUrl = i18n.absoluteUrl(route);

  let html = renderHtmlWithMeta(template, { ...seo, canonicalUrl });
  html = applyLocaleHead(html, { ...localeMeta, title: seo.title });
  html = withAlternates(html, i18n.alternatesForPath(route));
  html = withJsonLd(html, jsonLd(canonicalUrl));
  html = withFaqMarkdown(html, markdown);

  const body = render(route);
  withContent++;
  html = html.replace(EMPTY_ROOT, () => `<div id="root">${body}</div>`);

  const outDir = path.join(distDir, route.replace(/^\//, ""));
  mkdirSync(outDir, { recursive: true });
  writeFileSync(path.join(outDir, "index.html"), html);
}

for (const hub of i18n.LOCALIZED_HUBS) {
  const { locale } = hub;
  writeTranslatedPage({
    locale,
    route: i18n.hubPath(locale),
    seo: hub.seo,
    articleKey: i18n.hubArticleKey(locale),
    jsonLd: (url) => [
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: hub.hero.h1,
        url,
        description: hub.seo.description,
        inLanguage: i18n.LOCALE_META[locale].htmlLang,
      },
    ],
  });
}

for (const page of i18n.LOCALIZED_PAGES) {
  const { locale } = page;
  const ui = i18nUi[locale];
  writeTranslatedPage({
    locale,
    route: i18n.pagePath(page),
    seo: page.seo,
    articleKey: i18n.articleKey(page),
    jsonLd: (url) => [
      {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: page.schemaName,
        url,
        description: page.seo.description,
        inLanguage: i18n.LOCALE_META[locale].htmlLang,
        applicationCategory: "UtilityApplication",
        operatingSystem: "Web Browser",
        isAccessibleForFree: true,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: ui.navHub, item: i18n.absoluteUrl(i18n.hubPath(locale)) },
          { "@type": "ListItem", position: 2, name: page.card.title, item: url },
        ],
      },
    ],
  });
}

writeFileSync(path.join(distDir, "sitemap-i18n.xml"), buildSitemapXml(i18n.sitemapEntries()));

console.log(
  `[prerender] wrote ${routes.length + 1} static page(s) with unique <head> metadata into dist/, ` +
    `${withContent} with the page content rendered in`,
);
console.log(
  `[prerender] wrote ${i18n.LOCALIZED_HUBS.length + i18n.LOCALIZED_PAGES.length} translated page(s) ` +
    `and dist/sitemap-i18n.xml`,
);

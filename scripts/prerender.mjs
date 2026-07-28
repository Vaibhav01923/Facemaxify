// Post-build step: bakes per-route <title>/<meta description>/<link canonical>/OG/Twitter
// tags into static HTML files so crawlers get correct signals on the very first HTML
// response, without waiting for client-side JS (see components/SEO.tsx) to run.
//
// Vercel serves a matching static file ahead of the `/(.*) -> /index.html` rewrite in
// vercel.json, so writing dist/<route>/index.html is enough to override the SPA shell
// for that route.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import * as esbuild from "esbuild";

const rootDir = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const distDir = path.join(rootDir, "dist");
const template = readFileSync(path.join(distDir, "index.html"), "utf8");

// --- 1. Tool pages: metadata lives inline in each page component's <SEO .../> tag ---
const toolPages = [
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

// --- 2. Programmatic landing pages: metadata lives in data/seoLandingPages.ts ---
// Bundled (not just transformed) because this file now pulls real metric benchmarks in
// from services/ratioCalculator.ts at runtime, not just types.
const bundle = await esbuild.build({
  entryPoints: [path.join(rootDir, "data/seoLandingPages.ts")],
  bundle: true,
  format: "esm",
  platform: "neutral",
  write: false,
});
const code = bundle.outputFiles[0].text;
const dataModule = await import(`data:text/javascript,${encodeURIComponent(code)}`);

for (const page of dataModule.seoLandingPages) {
  routes.push({
    route: `/${page.slug}`,
    title: page.title,
    description: page.description,
    keywords: page.keywords,
    canonicalUrl: `https://facemaxify.com/${page.slug}`,
  });
}

// --- 3. Inject per-route metadata into a copy of the built index.html ---
function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderHtml({ title, description, keywords, canonicalUrl }) {
  let html = template;
  const t = escapeHtml(title);
  const d = escapeHtml(description);

  html = html.replace(/<title>[^<]*<\/title>/, `<title>${t}</title>`);
  html = html.replace(/(<meta name="title" content=")[^"]*(")/, `$1${t}$2`);
  html = html.replace(/(<meta name="description" content=")[^"]*(")/, `$1${d}$2`);
  if (keywords) {
    const k = escapeHtml(keywords);
    html = html.replace(/(<meta name="keywords" content=")[^"]*(")/, `$1${k}$2`);
  }
  html = html.replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${canonicalUrl}$2`);
  html = html.replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${canonicalUrl}$2`);
  html = html.replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${t}$2`);
  html = html.replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${d}$2`);
  html = html.replace(/(<meta name="twitter:url" content=")[^"]*(")/, `$1${canonicalUrl}$2`);
  html = html.replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${t}$2`);
  html = html.replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${d}$2`);
  return html;
}

let written = 0;
for (const meta of routes) {
  const outDir = path.join(distDir, meta.route.replace(/^\//, ""));
  mkdirSync(outDir, { recursive: true });
  writeFileSync(path.join(outDir, "index.html"), renderHtml(meta));
  written++;
}

console.log(`[prerender] wrote ${written}/${routes.length} static route(s) with unique <head> metadata into dist/`);

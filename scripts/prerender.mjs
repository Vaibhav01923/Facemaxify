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

const rootDir = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const distDir = path.join(rootDir, "dist");
const template = readFileSync(path.join(distDir, "index.html"), "utf8");

// --- 1. Tool pages: metadata lives inline in each page component's <SEO .../> tag ---
// /blog is deliberately not here: api/blog-index.js renders it per request so it can list
// posts published after the deploy, and a static dist/blog/index.html would shadow that.
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
const { render, seoLandingPages, articles } = await import(
  pathToFileURL(path.join(ssrOutDir, "entry-server.js")).href
);

// FAQPage structured data built from a tool article's "## Frequently asked questions"
// section, so it always matches the questions shown on the page.
function plainText(markdown) {
  return markdown
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*`>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function faqJsonLd(markdown) {
  const section = markdown.split(/^## /m).find((s) => /^frequently asked questions/i.test(s));
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

function withFaq(html, route) {
  const markdown = articles[route.replace(/^\/tools\//, "")];
  const script = route.startsWith("/tools/") && markdown && faqJsonLd(markdown);
  return script ? html.replace("</head>", () => `${script}\n  </head>`) : html;
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
  const html = renderInto(withFaq(renderHtmlWithMeta(template, meta), meta.route), meta.route);
  writeFileSync(path.join(outDir, "index.html"), html);
}

console.log(
  `[prerender] wrote ${routes.length + 1} static page(s) with unique <head> metadata into dist/, ` +
    `${withContent} with the page content rendered in`,
);

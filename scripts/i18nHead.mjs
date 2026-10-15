// <head> helpers for the translated pages, used by scripts/prerender.mjs. They work on the HTML
// string produced by renderHtmlWithMeta (api/_lib/htmlMeta.js), the same way that function does.
import { escapeHtml } from "../api/_lib/htmlMeta.js";

// index.html ships site-wide structured data (a WebApplication and an English FAQ). Translated
// pages drop both and get their own, so a Spanish page doesn't claim to be an English FAQ.
const SITE_JSON_LD = /\n?[ \t]*<script type="application\/ld\+json">[\s\S]*?<\/script>/g;
const SITE_JSON_LD_COMMENT = /\n?[ \t]*<!-- (?:WebApplication|FAQ) Schema[^>]*-->/g;

export function applyLocaleHead(html, { htmlLang, ogLocale, metaLanguage, title }) {
  return html
    .replace('<html lang="en">', `<html lang="${htmlLang}">`)
    .replace(/(<meta name="language" content=")[^"]*(")/, (_, open, close) => open + metaLanguage + close)
    .replace(/(<meta property="og:locale" content=")[^"]*(")/, (_, open, close) => open + ogLocale + close)
    .replace(/(<meta property="og:image:alt" content=")[^"]*(")/, (_, open, close) => open + escapeHtml(title) + close)
    .replace(SITE_JSON_LD_COMMENT, "")
    .replace(SITE_JSON_LD, "");
}

// <link rel="alternate" hreflang> for every language version of a page (itself included).
export function withAlternates(html, alternates) {
  if (alternates.length === 0) return html;
  const links = alternates
    .map(({ hreflang, href }) => `    <link rel="alternate" hreflang="${hreflang}" href="${escapeHtml(href)}" />`)
    .join("\n");
  return html.replace("</head>", () => `${links}\n  </head>`);
}

export function withJsonLd(html, blocks) {
  const scripts = blocks
    .map((block) => `    <script type="application/ld+json">${JSON.stringify(block).replace(/</g, "\\u003c")}</script>`)
    .join("\n");
  return html.replace("</head>", () => `${scripts}\n  </head>`);
}

// sitemap-i18n.xml: every translated URL (and the English pages they pair with) with its
// hreflang annotations. Kept separate from sitemap.xml so Search Console reports how many of
// the translated pages are indexed.
export function buildSitemapXml(entries) {
  const urls = entries
    .map((entry) =>
      [
        "  <url>",
        `    <loc>${escapeHtml(entry.loc)}</loc>`,
        entry.lastmod ? `    <lastmod>${entry.lastmod}</lastmod>` : null,
        ...entry.alternates.map(
          (alt) => `    <xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${escapeHtml(alt.href)}" />`,
        ),
        "  </url>",
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`;
}

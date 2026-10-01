// Shared by scripts/prerender.mjs (build-time, static routes) and api/blog-post.js
// (request-time, dynamic blog routes): injects per-page <title>/meta/canonical/OG/Twitter
// tags into a copy of the built index.html so crawlers see correct signals without
// waiting on client-side JS.
export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function renderHtmlWithMeta(template, { title, description, keywords, canonicalUrl, image }) {
  // Function replacers throughout: a "$" in a title (e.g. "under $100") would otherwise be
  // read as a replacement pattern and corrupt the tag.
  let html = template;
  const t = escapeHtml(title);
  const d = escapeHtml(description);

  html = html.replace(/<title>[^<]*<\/title>/, () => `<title>${t}</title>`);
  html = html.replace(/(<meta name="title" content=")[^"]*(")/, (_, open, close) => open + t + close);
  html = html.replace(/(<meta name="description" content=")[^"]*(")/, (_, open, close) => open + d + close);
  if (keywords) {
    const k = escapeHtml(keywords);
    html = html.replace(/(<meta name="keywords" content=")[^"]*(")/, (_, open, close) => open + k + close);
  }
  html = html.replace(/(<link rel="canonical" href=")[^"]*(")/, (_, open, close) => open + canonicalUrl + close);
  html = html.replace(/(<meta property="og:url" content=")[^"]*(")/, (_, open, close) => open + canonicalUrl + close);
  html = html.replace(/(<meta property="og:title" content=")[^"]*(")/, (_, open, close) => open + t + close);
  html = html.replace(/(<meta property="og:description" content=")[^"]*(")/, (_, open, close) => open + d + close);
  html = html.replace(/(<meta name="twitter:url" content=")[^"]*(")/, (_, open, close) => open + canonicalUrl + close);
  html = html.replace(/(<meta name="twitter:title" content=")[^"]*(")/, (_, open, close) => open + t + close);
  html = html.replace(/(<meta name="twitter:description" content=")[^"]*(")/, (_, open, close) => open + d + close);
  if (image) {
    const img = escapeHtml(image);
    html = html.replace(/(<meta property="og:image" content=")[^"]*(")/, (_, open, close) => open + img + close);
    html = html.replace(/(<meta name="twitter:image" content=")[^"]*(")/, (_, open, close) => open + img + close);
  }
  return html;
}

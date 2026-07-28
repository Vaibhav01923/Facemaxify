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
  if (image) {
    const img = escapeHtml(image);
    html = html.replace(/(<meta property="og:image" content=")[^"]*(")/, `$1${img}$2`);
    html = html.replace(/(<meta name="twitter:image" content=")[^"]*(")/, `$1${img}$2`);
  }
  return html;
}

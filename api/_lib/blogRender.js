// Server-side rendering for the blog (api/blog-index.js, api/blog-post.js). The app is a
// client-side SPA, so without this the blog's article text and post links would only exist
// after JavaScript runs, and Google's first pass and AI crawlers (which mostly don't run
// JavaScript) would see an empty page. The markup mirrors pages/BlogPostPage.tsx and
// pages/BlogListingPage.tsx; React replaces it when the app mounts.
import { compiler } from "markdown-to-jsx";
import { renderToStaticMarkup } from "react-dom/server";
import { escapeHtml } from "./htmlMeta.js";
import { markdownOptions } from "./blogShared.js";

// The deployed spa.html is the empty page shell: it carries the built CSS/JS asset links.
// (index.html is the prerendered homepage — see scripts/prerender.mjs.)
export async function loadTemplate(req) {
  const proto = req.headers["x-forwarded-proto"] || "https";
  const res = await fetch(`${proto}://${req.headers.host}/spa.html`);
  if (!res.ok) throw new Error(`spa.html returned ${res.status}`);
  return res.text();
}

// Puts the rendered page inside #root and embeds the data it came from (see
// initialBlogData in blogShared.js). Function replacers, so a "$" in a post can't be read
// as a replacement pattern.
export function withRootContent(template, rootHtml, data) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return template
    .replace('<div id="root"></div>', () => `<div id="root">${rootHtml}</div>`)
    .replace("</head>", () => `<script>window.__BLOG_DATA__=${json}</script>\n  </head>`);
}

function pageShell(inner) {
  return (
    `<div class="min-h-screen bg-[#050510] text-white"><div class="relative z-10">` +
    `<main class="px-4 py-14 sm:px-6 lg:px-8">${inner}</main></div></div>`
  );
}

export function renderPostPage(post) {
  const tags = (post.tags || [])
    .map(
      (tag) =>
        `<span class="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-full px-3 py-1">${escapeHtml(tag)}</span>`,
    )
    .join("");
  const cover = post.image_url
    ? `<img src="${escapeHtml(post.image_url)}" alt="${escapeHtml(post.title)}" class="rounded-2xl border border-white/10 w-full mb-10" />`
    : "";
  const body = renderToStaticMarkup(compiler(post.content, markdownOptions));
  return pageShell(
    `<article class="mx-auto max-w-3xl">` +
      `<a href="/blog" class="text-sm text-slate-500 hover:text-slate-300 mb-6 inline-block">← Back to blog</a>` +
      (tags ? `<div class="flex flex-wrap gap-2 mb-4">${tags}</div>` : "") +
      `<h1 class="text-3xl font-black tracking-tight text-white sm:text-5xl mb-6">${escapeHtml(post.title)}</h1>` +
      cover +
      `<div class="prose-invert">${body}</div>` +
      `</article>`,
  );
}

export function renderIndexPage(posts) {
  const cards = posts
    .map((post) => {
      const image = post.image_url
        ? `<div class="aspect-video overflow-hidden bg-slate-900"><img src="${escapeHtml(post.image_url)}" alt="${escapeHtml(post.title)}" loading="lazy" class="h-full w-full object-cover" /></div>`
        : "";
      const tag = post.tags && post.tags.length > 0
        ? `<span class="text-xs font-bold uppercase tracking-wider text-amber-400">${escapeHtml(post.tags[0])}</span>`
        : "";
      const description = post.description
        ? `<p class="text-sm text-slate-400 line-clamp-3">${escapeHtml(post.description)}</p>`
        : "";
      return (
        `<a href="/blog/${encodeURIComponent(post.slug)}" class="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70 shadow-xl shadow-black/20">` +
        image +
        `<div class="flex flex-1 flex-col gap-3 p-6">${tag}<h2 class="text-lg font-bold text-white">${escapeHtml(post.title)}</h2>${description}</div>` +
        `</a>`
      );
    })
    .join("");
  const list = cards
    ? `<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">${cards}</div>`
    : `<div class="text-center text-slate-500 py-20">No articles published yet. Check back soon.</div>`;
  return pageShell(
    `<div class="mx-auto max-w-6xl">` +
      `<div class="mb-12 text-center"><h1 class="text-4xl font-black tracking-tight text-white sm:text-5xl">Facemaxify Blog</h1>` +
      `<p class="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">Facial analysis, golden ratio, symmetry, and looksmaxxing — explained with real measurements instead of vague advice.</p></div>` +
      list +
      `</div>`,
  );
}

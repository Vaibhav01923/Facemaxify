// Shared by the blog pages (pages/Blog*.tsx, in the browser) and the functions that
// server-render them (api/blog-index.js, api/blog-post.js), so the HTML crawlers receive
// and the page React renders are built from the same Markdown settings and metadata.
import { createElement } from "react";

// Comparison tables are wider than the article column on phones, so they scroll sideways
// inside a bordered box instead of squeezing every cell into a few characters.
function Table({ children, ...props }) {
  return createElement(
    "div",
    { className: "my-8 overflow-x-auto rounded-xl border border-white/10" },
    createElement("table", { ...props, className: "w-full min-w-[36rem] border-collapse text-left text-sm" }, children),
  );
}

// Raw HTML inside a post is shown as text instead of being parsed: the server writes this
// markup straight into the page, where a <script> would run. RankOnGeo sends plain Markdown.
export const markdownOptions = {
  disableParsingRawHTML: true,
  overrides: {
    h1: { props: { className: "text-3xl font-black text-white mt-10 mb-4" } },
    h2: { props: { className: "text-2xl font-bold text-white mt-10 mb-4" } },
    h3: { props: { className: "text-xl font-bold text-white mt-8 mb-3" } },
    p: { props: { className: "text-slate-300 leading-relaxed mb-5" } },
    a: { props: { className: "text-amber-400 hover:text-amber-300 underline underline-offset-2" } },
    ul: { props: { className: "list-disc pl-6 text-slate-300 mb-5 space-y-2" } },
    ol: { props: { className: "list-decimal pl-6 text-slate-300 mb-5 space-y-2" } },
    li: { props: { className: "leading-relaxed" } },
    blockquote: {
      props: {
        className: "border-l-4 border-amber-400/50 pl-4 italic text-slate-400 my-6",
      },
    },
    code: { props: { className: "bg-slate-900 px-1.5 py-0.5 rounded text-amber-300 text-sm" } },
    img: { props: { className: "rounded-2xl border border-white/10 my-6 w-full" } },
    strong: { props: { className: "text-white font-semibold" } },
    table: { component: Table },
    thead: { props: { className: "bg-white/5" } },
    tr: { props: { className: "border-b border-white/10 last:border-0" } },
    th: { props: { className: "px-4 py-3 font-semibold text-white align-bottom border-b border-white/10" } },
    td: { props: { className: "px-4 py-3 text-slate-300 align-top leading-relaxed" } },
  },
};

// Posts from RankOnGeo arrived with their "# Title" line at the top of the content, and
// the page already prints the title as its <h1>, so it showed twice. Drops that first line.
export function postBody(content) {
  return (content || "").replace(/^\s*#[ \t]+[^\n]*(?:\n+|$)/, "");
}

export const blogIndexMeta = {
  title: "Facemaxify Blog — Facial Analysis, Golden Ratio & Looksmaxxing Guides",
  description:
    "Read the latest articles on facial analysis, golden ratio scoring, facial symmetry, and looksmaxxing from the Facemaxify team.",
  keywords: "facial analysis blog, looksmaxxing guides, golden ratio articles, facial aesthetics blog",
  canonicalUrl: "https://facemaxify.com/blog",
};

export function blogPostUrl(slug) {
  return `https://facemaxify.com/blog/${slug}`;
}

// Search results cut titles off at ~60 characters, so the brand suffix is only added when
// it fits — otherwise it just pushes the post's own words out of view.
export function blogPostTitle(postTitle) {
  const branded = `${postTitle} | Facemaxify Blog`;
  return branded.length <= 60 ? branded : postTitle;
}

// The server-rendered blog pages embed the data they were built from as
// window.__BLOG_DATA__ ({ posts } on /blog, { post } on a post), so the app can show it on
// its first render instead of a loading state.
export function initialBlogData() {
  return typeof window === "undefined" ? undefined : window.__BLOG_DATA__;
}

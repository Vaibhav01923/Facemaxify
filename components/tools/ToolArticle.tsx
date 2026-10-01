/// <reference types="vite/client" />
// The long-form article under each tool page, written in Markdown in content/tools/<slug>.md.
// It's rendered into the page's HTML at build time (scripts/prerender.mjs), so crawlers get
// it without running JavaScript, and on load the browser reuses that HTML instead of every
// article shipping inside the app's JavaScript. Only when the page arrives without it (the
// dev server) is the Markdown fetched and rendered in the browser.
import React, { createContext, useContext, useEffect, useState } from "react";
import Markdown from "markdown-to-jsx";
import { articleMarkdownOptions } from "./toolArticleMarkdown";

const markdownFiles = import.meta.glob<string>("../../content/tools/*.md", {
  query: "?raw",
  import: "default",
});

// Build time: every article's Markdown, provided by scripts/ssr/entry-server.tsx.
export const ArticleMarkdown = createContext<Record<string, string>>({});

// Browser: the article HTML the page arrived with, captured before React replaces #root.
const arrivedHtml: Record<string, string> = {};

export function captureToolArticles() {
  document.querySelectorAll<HTMLElement>("[data-tool-article]").forEach((el) => {
    arrivedHtml[el.dataset.toolArticle!] = el.innerHTML;
  });
}

export const ToolArticle: React.FC<{ slug: string }> = ({ slug }) => {
  const prerendered = useContext(ArticleMarkdown)[slug];
  const html = arrivedHtml[slug];
  const [fetched, setFetched] = useState<string | null>(null);

  useEffect(() => {
    if (prerendered !== undefined || html !== undefined) return;
    markdownFiles[`../../content/tools/${slug}.md`]?.().then(setFetched);
  }, [slug, prerendered, html]);

  const markdown = prerendered ?? fetched;

  return (
    <section className="bg-slate-950/60 border-t border-white/5 py-16 px-4">
      {markdown === null && html !== undefined ? (
        <div data-tool-article={slug} className="max-w-3xl mx-auto" dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <div data-tool-article={slug} className="max-w-3xl mx-auto">
          {markdown !== null && <Markdown options={articleMarkdownOptions}>{markdown}</Markdown>}
        </div>
      )}
    </section>
  );
};

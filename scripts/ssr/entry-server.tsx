// Build-time entry for scripts/prerender.mjs: renders a route of the real app to HTML, so
// each static page ships its content instead of an empty #root. Crawlers that don't run
// JavaScript (Google's first pass, AI search bots, SEO auditors) read this markup;
// index.tsx then mounts the app over it in the browser.
import { renderToStaticMarkup } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import App from "../../App";
import { ArticleMarkdown } from "../../components/tools/ToolArticle";

export { seoLandingPages } from "../../data/seoLandingPages";

// Tool-page articles by slug (content/tools/<slug>.md).
export const articles: Record<string, string> = Object.fromEntries(
  Object.entries(
    import.meta.glob<string>("../../content/tools/*.md", { query: "?raw", import: "default", eager: true }),
  ).map(([file, markdown]) => [file.match(/([^/]+)\.md$/)![1], markdown]),
);

export function render(url: string): string {
  return renderToStaticMarkup(
    <ArticleMarkdown.Provider value={articles}>
      <StaticRouter location={url}>
        <App />
      </StaticRouter>
    </ArticleMarkdown.Provider>,
  );
}

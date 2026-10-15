import React from "react";
import { SEO } from "../SEO";
import { PhotoAnalyzerShell } from "../tools/PhotoAnalyzerShell";
import { ToolArticle } from "../tools/ToolArticle";
import { absoluteUrl, articleKey, hubPath, pageBySlug, pagePath } from "../../i18n/registry";
import { UI } from "../../i18n/strings";
import type { LocalizedPage } from "../../i18n/types";
import { ENGINES } from "./engines";
import { LocalizedFooter, RelatedTools } from "./LocalizedFooter";
import { LocalizedNavbar } from "./LocalizedNavbar";
import { useFullReport } from "./useFullReport";

// One translated tool page: hero, the tool itself (reusing the English tool's calculation),
// the long article, and links to the language's other tools. Copy comes from i18n/pages.ts and
// content/i18n/<locale>/<slug>.md.
export const LocalizedToolPage: React.FC<{ page: LocalizedPage }> = ({ page }) => {
  const { locale } = page;
  const ui = UI[locale];
  const engine = ENGINES[page.engine];
  const openFullReport = useFullReport();
  const related = page.related.map((slug) => pageBySlug(locale, slug)).filter((p): p is LocalizedPage => Boolean(p));
  // Japanese has no letter case, and wide letter-spacing hurts readability.
  const badgeCase = locale === "ja" ? "tracking-normal" : "uppercase tracking-widest";
  const headingTracking = locale === "ja" ? "tracking-normal" : "tracking-tight";

  return (
    <>
      <SEO
        title={page.seo.title}
        description={page.seo.description}
        keywords={page.seo.keywords}
        canonicalUrl={absoluteUrl(pagePath(page))}
      />
      <div className="min-h-screen bg-[#050510] text-white">
        <LocalizedNavbar locale={locale} />

        <nav aria-label="breadcrumb" className="mx-auto max-w-4xl px-4 pt-6 text-sm text-slate-400">
          <a href={hubPath(locale)} className="hover:text-slate-300">
            {ui.navHub}
          </a>
          <span aria-hidden="true"> › </span>
          <span className="text-slate-300">{page.card.title}</span>
        </nav>

        <section className="max-w-4xl mx-auto px-4 pt-8 pb-4 text-center">
          <span
            className={`inline-block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold mb-5 ${badgeCase}`}
          >
            {page.hero.badge}
          </span>
          <h1 className={`text-4xl sm:text-6xl font-black mb-4 ${headingTracking}`}>{page.hero.h1}</h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">{page.hero.intro}</p>
        </section>

        <PhotoAnalyzerShell
          onAnalyze={engine.calculate}
          renderResults={(result, reset, context) => (
            <engine.Results result={result} reset={reset} context={context} locale={locale} />
          )}
          analyzeLabel={page.analyzeLabel}
          strings={ui.shell}
          onFullReport={openFullReport}
        />

        <ToolArticle slug={articleKey(page)} />
        <RelatedTools locale={locale} pages={related} />
        <LocalizedFooter locale={locale} />
      </div>
    </>
  );
};

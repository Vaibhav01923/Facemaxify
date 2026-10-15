import React from "react";
import { SEO } from "../SEO";
import { ToolArticle } from "../tools/ToolArticle";
import { absoluteUrl, hubArticleKey, hubFor, hubPath, pagesFor } from "../../i18n/registry";
import type { Locale } from "../../i18n/types";
import { FullReportSection } from "./FullReportSection";
import { LocalizedFooter, ToolCards } from "./LocalizedFooter";
import { LocalizedNavbar } from "./LocalizedNavbar";

// The language's home for the free tools (/es, /ja): a grid of every translated tool plus an
// article on how the tools work, with the FAQ.
export const LocalizedHubPage: React.FC<{ locale: Locale }> = ({ locale }) => {
  const hub = hubFor(locale);
  const badgeCase = locale === "ja" ? "tracking-normal" : "uppercase tracking-widest";
  const headingTracking = locale === "ja" ? "tracking-normal" : "tracking-tight";

  return (
    <>
      <SEO
        title={hub.seo.title}
        description={hub.seo.description}
        keywords={hub.seo.keywords}
        canonicalUrl={absoluteUrl(hubPath(locale))}
      />
      <div className="min-h-screen bg-[#050510] text-white">
        <LocalizedNavbar locale={locale} />

        <section className="max-w-4xl mx-auto px-4 pt-14 pb-4 text-center">
          <span
            className={`inline-block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold mb-5 ${badgeCase}`}
          >
            {hub.hero.badge}
          </span>
          <h1 className={`text-4xl sm:text-6xl font-black mb-4 ${headingTracking}`}>{hub.hero.h1}</h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">{hub.hero.intro}</p>
        </section>

        <section className="mx-auto max-w-4xl px-4 py-10">
          <h2 className="mb-6 text-2xl font-bold tracking-normal text-white">{hub.toolsHeading}</h2>
          <ToolCards pages={pagesFor(locale)} />
        </section>

        <FullReportSection locale={locale} />

        <ToolArticle slug={hubArticleKey(locale)} />
        <LocalizedFooter locale={locale} />
      </div>
    </>
  );
};

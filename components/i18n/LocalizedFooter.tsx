import React from "react";
import { hubPath, pagePath } from "../../i18n/registry";
import { UI } from "../../i18n/strings";
import type { Locale, LocalizedPage } from "../../i18n/types";

// Cards linking to translated tool pages — the hub's grid and the "more tools" list under
// each tool page.
export const ToolCards: React.FC<{ pages: LocalizedPage[] }> = ({ pages }) => (
  <div className="grid gap-4 sm:grid-cols-2">
    {pages.map((page) => (
      <a
        key={page.slug}
        href={pagePath(page)}
        className="block rounded-2xl border border-white/10 bg-slate-900/60 p-5 transition-colors hover:border-indigo-500/50 hover:bg-slate-900"
      >
        <h3 className="text-lg font-bold text-white mb-1">{page.card.title}</h3>
        <p className="text-sm leading-relaxed text-slate-400">{page.card.blurb}</p>
      </a>
    ))}
  </div>
);

export const RelatedTools: React.FC<{ locale: Locale; pages: LocalizedPage[] }> = ({ locale, pages }) => {
  const ui = UI[locale];
  return (
    <section className="border-t border-white/5 px-4 py-14">
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-6 text-2xl font-bold tracking-normal text-white">{ui.relatedHeading}</h2>
        <ToolCards pages={pages} />
        <p className="mt-6">
          <a href={hubPath(locale)} className="text-indigo-400 underline underline-offset-2 hover:text-indigo-300">
            {ui.allToolsLink}
          </a>
        </p>
      </div>
    </section>
  );
};

export const LocalizedFooter: React.FC<{ locale: Locale }> = ({ locale }) => {
  const ui = UI[locale];
  return (
    <footer className="border-t border-white/5 px-4 py-10">
      <div className="mx-auto max-w-3xl space-y-3 text-sm leading-relaxed text-slate-400">
        <h2 className="font-semibold text-slate-300">{ui.disclaimerHeading}</h2>
        <p>{ui.disclaimer}</p>
        <p>{ui.fullReportNote}</p>
      </div>
    </footer>
  );
};

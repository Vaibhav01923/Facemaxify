import React from "react";
import { hubPath } from "../../i18n/registry";
import { UI } from "../../i18n/strings";
import type { Locale } from "../../i18n/types";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useFullReport } from "./useFullReport";

// Navbar for translated pages. The English Navbar is all English and tied to Clerk's sign-in
// modal; this one keeps people in their language and points at the full report.
export const LocalizedNavbar: React.FC<{ locale: Locale }> = ({ locale }) => {
  const ui = UI[locale];
  const openFullReport = useFullReport();

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800 shadow-2xl shadow-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <a href={hubPath(locale)} className="flex items-center gap-3">
            <img src="/favicon.png" alt={ui.logoLabel} className="w-8 h-8 rounded-lg shadow-lg shadow-blue-500/20" />
            <span className="text-lg font-bold tracking-tight text-white max-[359px]:hidden">Facemaxify</span>
          </a>

          <div className="flex items-center gap-1 sm:gap-6">
            <a
              href={hubPath(locale)}
              className="hidden sm:inline py-3 text-slate-300 hover:text-white font-medium text-sm transition-colors"
            >
              {ui.navHub}
            </a>
            <LanguageSwitcher label={ui.languageNavLabel} />
            {/* A real link for crawlers and no-JS visitors; with JS it opens the sign-in popup in the page's language. */}
            <a
              href="/dashboard/facial-analysis"
              onClick={(event) => {
                event.preventDefault();
                openFullReport();
              }}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors text-xs sm:px-4 sm:text-sm whitespace-nowrap"
            >
              {ui.navFullReport}
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
};

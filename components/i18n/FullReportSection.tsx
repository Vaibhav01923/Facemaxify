import React from "react";
import { ArrowRight, Check } from "lucide-react";
import { FIRST_PRICE, MONTHLY_PRICE } from "../../i18n/offer";
import { UI } from "../../i18n/strings";
import type { Locale } from "../../i18n/types";
import { useFullReport } from "./useFullReport";

// "What's in the full report" for the hub pages: what the paid product contains, the price, and an
// honest note about what is and isn't translated, with the button that starts the sign-in flow.
export const FullReportSection: React.FC<{ locale: Locale }> = ({ locale }) => {
  const text = UI[locale].fullReport;
  const openFullReport = useFullReport();

  return (
    <section aria-labelledby="full-report-heading" className="px-4 py-14">
      <div className="mx-auto max-w-5xl rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-600/15 to-purple-600/10 p-6 sm:p-10">
        <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h2 id="full-report-heading" className="text-3xl font-black tracking-normal text-white">
              {text.heading}
            </h2>
            <p className="mt-3 leading-relaxed text-slate-300">{text.intro}</p>
            <ul className="mt-6 space-y-3">
              {text.features.map((feature) => (
                <li key={feature} className="flex gap-3 text-sm leading-relaxed text-slate-200">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-5">
            <img
              src="/pagepromo.jpg"
              alt={text.imageAlt}
              width={1320}
              height={963}
              loading="lazy"
              className="w-full rounded-2xl border border-white/10"
            />
            <div>
              <p className="text-lg font-bold text-white">{text.priceLine(FIRST_PRICE, MONTHLY_PRICE)}</p>
              <button
                type="button"
                onClick={openFullReport}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3.5 font-bold text-white transition-colors hover:bg-indigo-500 sm:w-auto"
              >
                {text.button} <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        <ul className="mt-8 space-y-2 border-t border-white/10 pt-6 text-sm leading-relaxed text-slate-400">
          {text.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </div>
    </section>
  );
};

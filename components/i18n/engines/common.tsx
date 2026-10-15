import React from "react";
import type { PhotoContext } from "../../tools/PhotoAnalyzerShell";
import type { Locale } from "../../../i18n/types";

// What every translated tool page needs from a measuring engine: the calculation (reused from
// the English tool, so scores match across languages) and a results view in the page's language.
export interface ResultsProps {
  result: any;
  reset: () => void;
  context: PhotoContext;
  locale: Locale;
}

export interface Engine {
  calculate: (landmarks: any[]) => any;
  Results: React.FC<ResultsProps>;
}

export interface Tone {
  text: string;
  ring: string;
}

// Same palette as the English results (full class names so Tailwind picks them up).
export const TONES = {
  gold: { text: "text-yellow-400", ring: "border-yellow-400" },
  green: { text: "text-emerald-400", ring: "border-emerald-500" },
  indigo: { text: "text-indigo-400", ring: "border-indigo-500" },
  amber: { text: "text-amber-400", ring: "border-amber-500" },
  orange: { text: "text-orange-400", ring: "border-orange-500" },
  red: { text: "text-red-400", ring: "border-red-500" },
} satisfies Record<string, Tone>;

// Numbers the way the language writes them (Spanish uses a decimal comma).
export const formatNumber = (value: number, locale: Locale, digits = 1) =>
  value.toLocaleString(locale === "es" ? "es-ES" : "ja-JP", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

// Copy for an engine that isn't translated into every language yet. Throwing makes the
// prerender step (which renders every page) fail the build instead of shipping a blank page.
export function engineStrings<T>(table: Partial<Record<Locale, T>>, locale: Locale, engine: string): T {
  const strings = table[locale];
  if (!strings) throw new Error(`[i18n] the "${engine}" engine has no "${locale}" strings`);
  return strings;
}

// First tier whose minimum the score reaches; list tiers from highest to lowest.
export function pickTier<T>(score: number, tiers: [number, T][]): T {
  return (tiers.find(([min]) => score >= min) ?? tiers[tiers.length - 1])[1];
}

export const barColor = (score: number) =>
  score >= 80 ? "bg-emerald-500" : score >= 65 ? "bg-indigo-500" : score >= 50 ? "bg-amber-500" : "bg-red-500";

export const scoreColor = (score: number) =>
  score >= 80 ? "text-emerald-400" : score >= 65 ? "text-indigo-400" : "text-amber-400";

// Spanish headings are uppercase-tracked like the English ones; Japanese has no case and wide
// letter-spacing hurts readability, so it keeps normal spacing.
export const headingCase = (locale: Locale) => (locale === "ja" ? "" : "uppercase tracking-wider");

interface ScoreCardProps {
  locale: Locale;
  value: number | string;
  unit: string;
  tone: Tone;
  label: string;
  children: React.ReactNode;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({ locale, value, unit, tone, label, children }) => (
  <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-8 flex flex-col sm:flex-row items-center gap-8">
    <div className={`w-36 h-36 rounded-full border-4 ${tone.ring} flex flex-col items-center justify-center shrink-0`}>
      <span className={`text-5xl font-black ${tone.text}`}>{value}</span>
      <span className="text-xs text-slate-400">{unit}</span>
    </div>
    <div>
      <p className={`text-sm font-bold mb-2 ${headingCase(locale)} ${tone.text}`}>{label}</p>
      <div className="text-slate-300 text-sm leading-relaxed">{children}</div>
    </div>
  </div>
);

interface BreakdownProps {
  title: string;
  rows: { label: string; score: number }[];
  scoreSuffix?: string;
}

export const BreakdownCard: React.FC<BreakdownProps> = ({ title, rows, scoreSuffix = "/100" }) => (
  <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6">
    <h3 className="text-white font-bold mb-4">{title}</h3>
    {rows.map(({ label, score }) => (
      <div key={label} className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-slate-300">{label}</span>
          <span className={scoreColor(score)}>
            {score}
            {scoreSuffix}
          </span>
        </div>
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${barColor(score)}`} style={{ width: `${score}%` }} />
        </div>
      </div>
    ))}
  </div>
);

export const Note: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-xs text-slate-400 leading-relaxed px-2">{children}</p>
);

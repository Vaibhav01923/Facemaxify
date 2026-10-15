// First-party attribution for the paid product (see api/_lib/attribution.js for the format and
// api/checkout.js for where it ends up): which page a visitor started on, which page they clicked
// "full report" on, and the language they're reading the site in. One cookie, so the checkout
// request carries it and each payment shows where its buyer came from.
//
// Everything here is best-effort: it runs on every page, so it must never throw (a blocked cookie
// jar or a sandboxed iframe just means no attribution).
import { COOKIE_NAME, cleanPath, parseAttribution, serializeAttribution } from "../api/_lib/attribution.js";
import { localeOfPath } from "../i18n/registry";

export type SiteLang = "en" | "es" | "ja";

const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

interface Attribution {
  landing?: string;
  source?: string;
  lang?: SiteLang;
  at?: string;
}

function read(): Attribution {
  try {
    const entry = document.cookie.split("; ").find((part) => part.startsWith(`${COOKIE_NAME}=`));
    return entry ? parseAttribution(entry.slice(COOKIE_NAME.length + 1)) : {};
  } catch {
    return {};
  }
}

function write(attribution: Attribution): void {
  try {
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${COOKIE_NAME}=${serializeAttribution(attribution)}; Max-Age=${MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secure}`;
  } catch {
    // Cookies blocked: the site works the same without attribution.
  }
}

// The signed-in app is English-only and isn't somewhere visitors "land".
const isAppPath = (path: string) => /^\/(dashboard|stats|auth|api)(\/|$)/.test(path);

// Run on every page view. Remembers the first page a visitor landed on, and the language of the
// page they're reading — a translated page sets its language; any other site page sets English.
export function initAttribution(pathname: string): void {
  try {
    const path = cleanPath(pathname);
    if (!path || isAppPath(path)) return;

    const current = read();
    const next: Attribution = { ...current, lang: localeOfPath(path) ?? "en" };
    if (!next.landing) {
      next.landing = path;
      next.at = new Date().toISOString();
    }
    if (next.landing !== current.landing || next.lang !== current.lang) write(next);
  } catch {
    // never let attribution break a page
  }
}

// Run when a visitor clicks through to the full report (or to buy): records which page they did it on.
export function rememberFullReportClick(pathname: string = window.location.pathname): void {
  try {
    const path = cleanPath(pathname);
    if (!path) return;
    const current = read();
    write({ ...current, source: path });
    // Also a custom event in Vercel Analytics, on plans that include them.
    import("@vercel/analytics")
      .then(({ track }) => track("full_report_click", { page: path, language: current.lang ?? "en" }))
      .catch(() => {});
  } catch {
    // never let attribution break a click
  }
}

// The language the AI report and the checkout page should use: the language of the site pages the
// visitor was last reading.
export function getPreferredLanguage(): SiteLang {
  return read().lang ?? "en";
}

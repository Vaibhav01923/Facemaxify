import { LOCALIZED_HUBS, LOCALIZED_PAGES } from "./pages";
import type { Locale, LocaleMeta, LocalizedHub, LocalizedPage } from "./types";

// Single source of truth for localized URLs: the app's routes, the prerender step, the language
// switcher, hreflang tags and sitemap-i18n.xml are all derived from the data below.

export { LOCALIZED_HUBS, LOCALIZED_PAGES };

export const SITE_URL = "https://facemaxify.com";

export const LOCALES: Locale[] = ["es", "ja"];

export const LOCALE_META: Record<Locale, LocaleMeta> = {
  es: { htmlLang: "es", hreflang: "es", ogLocale: "es_ES", metaLanguage: "Spanish", name: "Español" },
  ja: { htmlLang: "ja", hreflang: "ja", ogLocale: "ja_JP", metaLanguage: "Japanese", name: "日本語" },
};

// English pages that localized pages are translations of, by group. "hub" is the tools directory.
export const ENGLISH_GROUP_PATHS: Record<string, string> = {
  attractiveness: "/tools/attractiveness-score",
  "hunter-eyes": "/tools/hunter-eyes",
  "face-shape": "/tools/facial-shape",
  "face-symmetry": "/tools/face-symmetry",
  "golden-ratio": "/tools/golden-ratio",
  "face-rating": "/tools/face-rating",
  hub: "/tools",
};

export const ENGLISH_HUB_PATH = "/tools";

export interface Alternate {
  hreflang: string;
  href: string;
}

export interface SwitchLink {
  code: "en" | Locale;
  label: string;
  href: string;
  hreflang: string;
  htmlLang: string;
  current: boolean;
}

export interface SitemapEntry {
  loc: string;
  lastmod?: string;
  alternates: Alternate[];
}

// ─── paths ───────────────────────────────────────────────────────────────────────────────

export function normalizePath(path: string): string {
  const clean = path.split(/[?#]/)[0].replace(/\/+$/, "");
  return clean === "" ? "/" : clean;
}

export const pagePath = (page: LocalizedPage) => `/${page.locale}/${page.slug}`;
export const hubPath = (locale: Locale) => `/${locale}`;
export const absoluteUrl = (path: string) => `${SITE_URL}${path}`;

// Keys of the articles (content/i18n/<locale>/<slug>.md) as ToolArticle looks them up.
export const articleKey = (page: LocalizedPage) => `${page.locale}/${page.slug}`;
export const hubArticleKey = (locale: Locale) => `${locale}/hub`;

export function localeOfPath(path: string): Locale | null {
  const first = normalizePath(path).split("/")[1];
  return (LOCALES as string[]).includes(first) ? (first as Locale) : null;
}

export const pagesFor = (locale: Locale) => LOCALIZED_PAGES.filter((page) => page.locale === locale);

export function pageAtPath(path: string): LocalizedPage | undefined {
  const normalized = normalizePath(path);
  return LOCALIZED_PAGES.find((page) => pagePath(page) === normalized);
}

export function pageBySlug(locale: Locale, slug: string): LocalizedPage | undefined {
  return LOCALIZED_PAGES.find((page) => page.locale === locale && page.slug === slug);
}

export function hubFor(locale: Locale): LocalizedHub {
  const hub = LOCALIZED_HUBS.find((h) => h.locale === locale);
  if (!hub) throw new Error(`[i18n] no hub defined for "${locale}"`);
  return hub;
}

// ─── translation groups (hreflang) ──────────────────────────────────────────────────────

interface GroupMember {
  hreflang: string;
  path: string;
}

function groupMembers(group: string): GroupMember[] {
  const members: GroupMember[] = [];
  const english = ENGLISH_GROUP_PATHS[group];
  if (english) members.push({ hreflang: "en", path: english });
  for (const page of LOCALIZED_PAGES) {
    if (page.group === group) members.push({ hreflang: LOCALE_META[page.locale].hreflang, path: pagePath(page) });
  }
  if (group === "hub") {
    for (const hub of LOCALIZED_HUBS) members.push({ hreflang: LOCALE_META[hub.locale].hreflang, path: hubPath(hub.locale) });
  }
  return members;
}

function groupOfPath(path: string): string | null {
  const normalized = normalizePath(path);
  const page = pageAtPath(normalized);
  if (page) return page.group;
  if (LOCALES.some((locale) => hubPath(locale) === normalized)) return "hub";
  for (const [group, englishPath] of Object.entries(ENGLISH_GROUP_PATHS)) {
    if (englishPath === normalized) return group;
  }
  return null;
}

// Every language version of a page (itself included, as hreflang requires), plus x-default
// pointing at the English version. Empty when a page has no translations.
export function alternatesForPath(path: string): Alternate[] {
  const group = groupOfPath(path);
  if (!group) return [];
  const members = groupMembers(group);
  if (members.length < 2) return [];
  const alternates: Alternate[] = members.map((m) => ({ hreflang: m.hreflang, href: absoluteUrl(m.path) }));
  const english = members.find((m) => m.hreflang === "en");
  if (english) alternates.push({ hreflang: "x-default", href: absoluteUrl(english.path) });
  return alternates;
}

// Links for the language switcher: the translated page when there is one, else that
// language's tools hub.
export function languageSwitchLinks(path: string): SwitchLink[] {
  const normalized = normalizePath(path);
  const current: "en" | Locale = localeOfPath(normalized) ?? "en";
  const group = groupOfPath(normalized);
  const members = group ? groupMembers(group) : [];
  const find = (hreflang: string) => members.find((m) => m.hreflang === hreflang)?.path;

  const links: Omit<SwitchLink, "current">[] = [
    {
      code: "en",
      label: "English",
      href: find("en") ?? (current === "en" ? normalized : ENGLISH_HUB_PATH),
      hreflang: "en",
      htmlLang: "en",
    },
    ...LOCALES.map((locale) => ({
      code: locale,
      label: LOCALE_META[locale].name,
      href: find(LOCALE_META[locale].hreflang) ?? hubPath(locale),
      hreflang: LOCALE_META[locale].hreflang,
      htmlLang: LOCALE_META[locale].htmlLang,
    })),
  ];
  return links.map((link) => ({ ...link, current: link.code === current }));
}

// ─── sitemap ─────────────────────────────────────────────────────────────────────────────

// One entry per URL that takes part in a translation group, English versions included, so the
// sitemap carries the same hreflang annotations as the pages themselves. Pages with no
// translation (e.g. ikemen-shindan) are listed on their own.
export function sitemapEntries(): SitemapEntry[] {
  const entries = new Map<string, SitemapEntry>();
  const add = (path: string, lastmod?: string) => {
    if (!entries.has(path)) entries.set(path, { loc: absoluteUrl(path), lastmod, alternates: alternatesForPath(path) });
  };
  for (const hub of LOCALIZED_HUBS) add(hubPath(hub.locale), hub.updated);
  for (const page of LOCALIZED_PAGES) add(pagePath(page), page.updated);
  for (const group of new Set(["hub", ...LOCALIZED_PAGES.map((page) => page.group)])) {
    const english = ENGLISH_GROUP_PATHS[group];
    if (english) add(english);
  }
  return [...entries.values()];
}

// ─── validation (run by the prerender step, so a typo fails the build instead of shipping) ───

export function validateRegistry(): void {
  const errors: string[] = [];
  const seenSlugs = new Set<string>();
  const seenGroupLocale = new Set<string>();
  for (const page of LOCALIZED_PAGES) {
    const path = pagePath(page);
    if (seenSlugs.has(path)) errors.push(`duplicate page path ${path}`);
    seenSlugs.add(path);
    const groupKey = `${page.group}:${page.locale}`;
    if (seenGroupLocale.has(groupKey)) errors.push(`group "${page.group}" has two pages in "${page.locale}"`);
    seenGroupLocale.add(groupKey);
    for (const slug of page.related) {
      if (!pageBySlug(page.locale, slug)) errors.push(`${path} relates to unknown page "${slug}"`);
      if (slug === page.slug) errors.push(`${path} relates to itself`);
    }
  }
  for (const locale of LOCALES) {
    if (!LOCALIZED_HUBS.some((hub) => hub.locale === locale)) errors.push(`no hub for "${locale}"`);
    if (pagesFor(locale).length === 0) errors.push(`no pages for "${locale}"`);
  }
  if (errors.length > 0) throw new Error(`[i18n] invalid registry:\n - ${errors.join("\n - ")}`);
}

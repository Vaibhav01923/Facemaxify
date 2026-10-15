// Where did a visitor come from? Pure logic (no browser globals, no Supabase) so it can be tested on its own.
//
// Order of precedence for a landing:
//   1. ?utm_source=... (or ?ref=...)  - the most reliable: you control the tag on your own links.
//   2. The page the visitor clicked from (document.referrer) - mapped to a friendly name (youtube, google, ...).
//   3. Ad click IDs (gclid / fbclid / ttclid) when there is no UTM tag.
//   4. Otherwise "direct" (typed address, bookmark, or an app that sends no referrer).
// Coming back from the sign-in page or the payment page is not a new visit: those are ignored, so signing up
// never overwrites the original source.

export interface Touch {
  source: string;
  medium: string;
  campaign: string;
  content: string;
  referrerHost: string;
  via: "utm" | "referrer" | "direct";
  /** the page the visitor landed on (before any redirect) */
  path: string;
  ts: number;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const TOUCH_KEY = "fmx_touch"; // localStorage: last non-direct touch, kept 30 days
const SESSION_KEY = "fmx_session_touch"; // sessionStorage: how this browsing session began
const SIGNIN_KEY = "fmx_signin_sent"; // sessionStorage: "signed in" already reported this session
export const TOUCH_TTL_MS = 30 * 24 * 3600 * 1000;

/** Lowercase, safe characters only, bounded length. Tags like "Pinned Comment" become "pinned_comment". */
export function clean(value: string | null | undefined, max = 40): string {
  return (value ?? "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9._:+-]/g, "")
    .slice(0, max);
}

const SOURCE_ALIASES: Record<string, string> = {
  yt: "youtube",
  youtu: "youtube",
  "youtube.com": "youtube",
  ytshorts: "youtube",
  ig: "instagram",
  insta: "instagram",
  tt: "tiktok",
  fb: "facebook",
  twitter: "x",
  "x.com": "x",
  "t.co": "x",
};

export function normalizeSource(value: string): string {
  const v = clean(value);
  return SOURCE_ALIASES[v] ?? v;
}

// [host pattern, source, medium]
const HOSTS: [RegExp, string, string][] = [
  [/(^|\.)(youtube\.com|youtu\.be|youtube-nocookie\.com)$/, "youtube", "social"],
  [/(^|\.)instagram\.com$/, "instagram", "social"],
  [/(^|\.)(facebook\.com|fb\.com|fb\.me|messenger\.com)$/, "facebook", "social"],
  [/(^|\.)(tiktok\.com)$/, "tiktok", "social"],
  [/(^|\.)(twitter\.com|x\.com|t\.co)$/, "x", "social"],
  [/(^|\.)(reddit\.com|redd\.it)$/, "reddit", "social"],
  [/(^|\.)pinterest\.[a-z.]+$/, "pinterest", "social"],
  [/(^|\.)(linkedin\.com|lnkd\.in)$/, "linkedin", "social"],
  [/(^|\.)(discord\.com|discord\.gg|discordapp\.com)$/, "discord", "social"],
  [/(^|\.)(t\.me|telegram\.org|telegram\.me)$/, "telegram", "social"],
  [/(^|\.)(whatsapp\.com|wa\.me)$/, "whatsapp", "social"],
  [/(^|\.)snapchat\.com$/, "snapchat", "social"],
  [/(^|\.)threads\.net$/, "threads", "social"],
  [/(^|\.)google\.[a-z.]+$/, "google", "organic"],
  [/(^|\.)bing\.com$/, "bing", "organic"],
  [/(^|\.)duckduckgo\.com$/, "duckduckgo", "organic"],
  [/(^|\.)(yahoo\.com|search\.yahoo\.com)$/, "yahoo", "organic"],
  [/(^|\.)brave\.com$/, "brave", "organic"],
  [/(^|\.)ecosia\.org$/, "ecosia", "organic"],
  [/(^|\.)yandex\.[a-z.]+$/, "yandex", "organic"],
  [/(^|\.)baidu\.com$/, "baidu", "organic"],
  [/(^|\.)(chatgpt\.com|openai\.com)$/, "chatgpt", "ai"],
  [/(^|\.)perplexity\.ai$/, "perplexity", "ai"],
  [/(^|\.)claude\.ai$/, "claude", "ai"],
];

// Android apps send "android-app://<package>" as the referrer.
const APPS: Record<string, [string, string]> = {
  "com.google.android.youtube": ["youtube", "social"],
  "com.instagram.android": ["instagram", "social"],
  "com.zhiliaoapp.musically": ["tiktok", "social"],
  "com.ss.android.ugc.trill": ["tiktok", "social"],
  "com.facebook.katana": ["facebook", "social"],
  "com.twitter.android": ["x", "social"],
  "com.reddit.frontpage": ["reddit", "social"],
  "com.google.android.googlequicksearchbox": ["google", "organic"],
};

// Not a new visit: auth and payment round trips, and the site itself.
const IGNORED: RegExp[] = [
  /^accounts\./,
  /(^|\.)clerk\.(com|dev)$/,
  /(^|\.)accounts\.dev$/,
  /^appleid\.apple\.com$/,
  /^login\.microsoftonline\.com$/,
  /(^|\.)dodopayments\.com$/,
  /(^|\.)whop\.com$/,
  /(^|\.)stripe\.com$/,
  /(^|\.)paypal\.com$/,
];

export type ReferrerKind = { kind: "ignore" } | { kind: "source"; source: string; medium: string; host: string };

export function classifyReferrer(referrer: string, ownHosts: string[]): ReferrerKind | null {
  if (!referrer) return null;
  if (referrer.startsWith("android-app://")) {
    const pkg = referrer.slice("android-app://".length).split("/")[0].toLowerCase();
    const known = APPS[pkg];
    return known ? { kind: "source", source: known[0], medium: known[1], host: pkg } : { kind: "source", source: `app:${clean(pkg)}`, medium: "referral", host: pkg };
  }
  let host: string;
  try {
    host = new URL(referrer).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
  if (!host) return null;
  if (ownHosts.some((h) => host === h || host.endsWith(`.${h}`)) || IGNORED.some((re) => re.test(host))) return { kind: "ignore" };
  for (const [re, source, medium] of HOSTS) if (re.test(host)) return { kind: "source", source, medium, host };
  return { kind: "source", source: clean(host, 60), medium: "referral", host };
}

function inferMedium(source: string): string {
  const hit = HOSTS.find(([, s]) => s === source);
  return hit ? hit[2] : "other";
}

export interface DetectInput {
  href: string;
  referrer: string;
  ownHosts: string[];
  now: number;
}

/**
 * The touch for a fresh page load, or null when it is just an internal / sign-in / payment navigation (keep the
 * attribution we already have).
 */
export function detectTouch({ href, referrer, ownHosts, now }: DetectInput): Touch | null {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  const path = url.pathname.replace(/\/+$/, "") || "/";
  const p = url.searchParams;
  const ref = classifyReferrer(referrer, ownHosts);
  const referrerHost = ref && ref.kind === "source" ? ref.host : "";

  const utmSource = p.get("utm_source") || p.get("ref");
  if (utmSource && normalizeSource(utmSource)) {
    const source = normalizeSource(utmSource);
    return {
      source,
      medium: clean(p.get("utm_medium")) || inferMedium(source),
      campaign: clean(p.get("utm_campaign")),
      content: clean(p.get("utm_content") || p.get("utm_term")),
      referrerHost,
      via: "utm",
      path,
      ts: now,
    };
  }
  if (ref?.kind === "ignore") return null;
  if (ref?.kind === "source") {
    return { source: ref.source, medium: ref.medium, campaign: "", content: "", referrerHost: ref.host, via: "referrer", path, ts: now };
  }
  if (p.get("gclid")) return { source: "google", medium: "paid", campaign: "", content: "", referrerHost: "", via: "referrer", path, ts: now };
  if (p.get("fbclid")) return { source: "facebook", medium: "social", campaign: "", content: "", referrerHost: "", via: "referrer", path, ts: now };
  if (p.get("ttclid")) return { source: "tiktok", medium: "social", campaign: "", content: "", referrerHost: "", via: "referrer", path, ts: now };
  return { source: "direct", medium: "direct", campaign: "", content: "", referrerHost: "", via: "direct", path, ts: now };
}

// --- tracker (stateful, but every browser dependency is injected) ---------------------------------------------

export interface SendResult {
  error?: { code?: string; message: string } | null;
}

export interface TrackerDeps {
  now: () => number;
  href: () => string;
  referrer: () => string;
  ownHosts: () => string[];
  local: StorageLike;
  session: StorageLike;
  visitorId: () => string;
  /** bots and the owner's own browsers */
  excluded: () => boolean;
  send: (fn: "track_traffic_visit" | "track_traffic_event", args: Record<string, unknown>) => Promise<SendResult>;
}

export type TrafficEvent = "signed_in" | "photo_submitted" | "analysis_succeeded";

function parse(raw: string | null): Touch | null {
  if (!raw) return null;
  try {
    const t = JSON.parse(raw) as Touch;
    return t && typeof t.source === "string" ? t : null;
  } catch {
    return null;
  }
}

export function createTracker(deps: TrackerDeps) {
  let disabled = false;

  const send = async (fn: "track_traffic_visit" | "track_traffic_event", args: Record<string, unknown>) => {
    if (disabled) return;
    try {
      const { error } = await deps.send(fn, args);
      if (error && (error.code === "PGRST202" || /could not find the function|does not exist/i.test(error.message))) {
        // The database migration (supabase_traffic_sources.sql) has not been run yet: stop trying quietly.
        disabled = true;
        console.warn("Traffic-source tracking is off: run supabase_traffic_sources.sql in Supabase.");
      }
    } catch {
      /* network problem: tracking must never break the site */
    }
  };

  /** Call once per page load, as early as possible (before routing / sign-in redirects). */
  function init(): void {
    if (deps.excluded()) return;
    const href = deps.href();
    let pathname = "/";
    try {
      pathname = new URL(href).pathname;
    } catch {
      return;
    }
    if (pathname === "/stats" || pathname.startsWith("/stats/")) return; // the owner's dashboard is never a visit
    if (deps.session.getItem(SESSION_KEY)) return; // this session already has its source

    const touch = detectTouch({ href, referrer: deps.referrer(), ownHosts: deps.ownHosts(), now: deps.now() });
    if (!touch) return; // sign-in / payment round trip: keep the existing attribution
    deps.session.setItem(SESSION_KEY, JSON.stringify(touch));
    if (touch.via !== "direct") deps.local.setItem(TOUCH_KEY, JSON.stringify(touch));
    void send("track_traffic_visit", {
      p_visitor: deps.visitorId(),
      p_path: touch.path,
      p_source: touch.source,
      p_medium: touch.medium,
      p_campaign: touch.campaign,
      p_content: touch.content,
      p_referrer_host: touch.referrerHost,
      p_via: touch.via,
    });
  }

  /** Session source if it is a real one, else the last non-direct source in the past 30 days, else direct. */
  function attribution(): Touch | null {
    const session = parse(deps.session.getItem(SESSION_KEY));
    if (session && session.via !== "direct") return session;
    const stored = parse(deps.local.getItem(TOUCH_KEY));
    if (stored && deps.now() - stored.ts < TOUCH_TTL_MS) return stored;
    return session;
  }

  function event(name: TrafficEvent, tool = ""): void {
    if (deps.excluded()) return;
    const a = attribution();
    void send("track_traffic_event", {
      p_visitor: deps.visitorId(),
      p_event: name,
      p_tool: tool.slice(0, 120),
      p_source: a?.source ?? "direct",
      p_medium: a?.medium ?? "direct",
      p_campaign: a?.campaign ?? "",
    });
  }

  /** Report "this visitor was signed in" at most once per browsing session. */
  function signedIn(): void {
    if (deps.excluded() || deps.session.getItem(SIGNIN_KEY)) return;
    deps.session.setItem(SIGNIN_KEY, "1");
    event("signed_in");
  }

  return { init, attribution, event, signedIn };
}

// Anonymous funnel tracking for /stats: page views, photo submissions and whether each analysis
// worked, per tool. Sends only the tool's path, a random per-browser ID and (for failures) the
// error message shown — never the photo or anything about the user. Events are written by the
// track_funnel_event database function (see the funnel_stats migrations); the table itself
// isn't readable from the browser.
import { supabase } from "./supabase";
import { seoLandingPageMap } from "../data/seoLandingPages";

export type FunnelEvent = "view" | "photo_submitted" | "analysis_succeeded" | "analysis_failed";

export const MAIN_TOOL_PATH = "/dashboard/facial-analysis";
export const MAIN_TOOL_SKIN_CHECK = "/dashboard/facial-analysis (skin check)";

const VISITOR_KEY = "fmx_visitor_id";
// Set in a browser once it has unlocked /stats, so the owner's own use isn't counted.
const OWNER_KEY = "fmx_owner";
const BOT = /bot|crawl|spider|slurp|lighthouse|headless|prerender/i;

export function getVisitorId(): string {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return "no-storage";
  }
}

export function markThisBrowserAsOwner(): void {
  try {
    localStorage.setItem(OWNER_KEY, "1");
  } catch {
    // Storage blocked: the owner's events still get excluded server-side by visitor ID.
  }
}

function isOwnerBrowser(): boolean {
  try {
    return localStorage.getItem(OWNER_KEY) === "1";
  } catch {
    return false;
  }
}

function normalize(path: string): string {
  return path.replace(/\/+$/, "") || "/";
}

// Pages that belong to a tool's funnel: the homepage (entry to the main tool), every
// /tools/* page, the programmatic landing pages and the main analysis itself.
function isFunnelPage(path: string): boolean {
  return path === "/" || path.startsWith("/tools/") || path === MAIN_TOOL_PATH || path.slice(1) in seoLandingPageMap;
}

export function trackFunnel(event: FunnelEvent, tool: string = window.location.pathname, detail?: string): void {
  if (typeof window === "undefined" || BOT.test(navigator.userAgent) || isOwnerBrowser()) return;
  supabase
    .rpc("track_funnel_event", {
      p_event: event,
      p_tool: normalize(tool),
      p_visitor: getVisitorId(),
      p_detail: detail ? detail.slice(0, 200) : null,
    })
    .then(({ error }) => {
      if (error) console.warn("Funnel tracking failed:", error.message);
    });
}

export function trackPageView(path: string): void {
  const tool = normalize(path);
  if (isFunnelPage(tool)) trackFunnel("view", tool);
}

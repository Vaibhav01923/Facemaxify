// Anonymous funnel tracking for /stats: page views and photo submissions per tool. Sends only
// the tool's path and a random per-browser ID — never the photo or anything about the user.
// Events are written by the track_funnel_event database function (see the funnel_stats
// migration); the table itself isn't readable from the browser.
import { supabase } from "./supabase";
import { seoLandingPageMap } from "../data/seoLandingPages";

export type FunnelEvent = "view" | "photo_submitted";

export const MAIN_TOOL_PATH = "/dashboard/facial-analysis";
export const MAIN_TOOL_SKIN_CHECK = "/dashboard/facial-analysis (skin check)";

const VISITOR_KEY = "fmx_visitor_id";
const BOT = /bot|crawl|spider|slurp|lighthouse|headless|prerender/i;

function visitorId(): string {
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

function normalize(path: string): string {
  return path.replace(/\/+$/, "") || "/";
}

// Pages that belong to a tool's funnel: the homepage (entry to the main tool), every
// /tools/* page, the programmatic landing pages and the main analysis itself.
function isFunnelPage(path: string): boolean {
  return path === "/" || path.startsWith("/tools/") || path === MAIN_TOOL_PATH || path.slice(1) in seoLandingPageMap;
}

export function trackFunnel(event: FunnelEvent, tool: string = window.location.pathname): void {
  if (typeof window === "undefined" || BOT.test(navigator.userAgent)) return;
  supabase
    .rpc("track_funnel_event", { p_event: event, p_tool: normalize(tool), p_visitor: visitorId() })
    .then(({ error }) => {
      if (error) console.warn("Funnel tracking failed:", error.message);
    });
}

export function trackPageView(path: string): void {
  const tool = normalize(path);
  if (isFunnelPage(tool)) trackFunnel("view", tool);
}

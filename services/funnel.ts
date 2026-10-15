// Anonymous funnel tracking for /stats: page views, photo submissions and whether each analysis
// worked, per tool. Sends only the tool's path, a random per-browser ID and (for failures) the
// error message shown — never the photo or anything about the user. Events are written by the
// track_funnel_event database function (see the funnel_stats migrations); the table itself
// isn't readable from the browser.
import { supabase } from "./supabase";
import { seoLandingPageMap } from "../data/seoLandingPages";
import { getVisitorId, isExcludedBrowser } from "./visitor";
import { trackTrafficEvent } from "./trafficSource";

// The visitor ID / owner / bot helpers live in ./visitor (shared with the traffic-source tracking).
export { getVisitorId, markThisBrowserAsOwner } from "./visitor";

export type FunnelEvent = "view" | "photo_submitted" | "analysis_succeeded" | "analysis_failed";

export const MAIN_TOOL_PATH = "/dashboard/facial-analysis";
export const MAIN_TOOL_SKIN_CHECK = "/dashboard/facial-analysis (skin check)";

function normalize(path: string): string {
  return path.replace(/\/+$/, "") || "/";
}

// Pages that belong to a tool's funnel: the homepage (entry to the main tool), every
// /tools/* page, the programmatic landing pages and the main analysis itself.
function isFunnelPage(path: string): boolean {
  return path === "/" || path.startsWith("/tools/") || path === MAIN_TOOL_PATH || path.slice(1) in seoLandingPageMap;
}

export function trackFunnel(event: FunnelEvent, tool: string = window.location.pathname, detail?: string): void {
  if (isExcludedBrowser()) return;
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
  // Also credit the visitor's traffic source (e.g. YouTube) with the conversion — see /stats → Traffic sources.
  if (event === "photo_submitted" || event === "analysis_succeeded") trackTrafficEvent(event, normalize(tool));
}

export function trackPageView(path: string): void {
  const tool = normalize(path);
  if (isFunnelPage(tool)) trackFunnel("view", tool);
}

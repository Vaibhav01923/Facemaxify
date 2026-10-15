// Traffic-source tracking for /stats ("where do visitors come from?"). The logic lives in trafficSourceCore.ts;
// this file connects it to the browser and to the track_traffic_* database functions
// (see supabase_traffic_sources.sql). Anonymous: a random per-browser ID, the landing path, the source tags
// (utm_*) and the referring site's hostname — never the photo, the full referring URL or anything personal.
import { supabase } from "./supabase";
import { getVisitorId, isExcludedBrowser } from "./visitor";
import { createTracker, type TrafficEvent } from "./trafficSourceCore";

let tracker: ReturnType<typeof createTracker> | null = null;

function getTracker() {
  if (typeof window === "undefined") return null;
  if (!tracker) {
    tracker = createTracker({
      now: () => Date.now(),
      href: () => window.location.href,
      referrer: () => document.referrer,
      ownHosts: () => [window.location.hostname.replace(/^www\./, ""), "facemaxify.com"],
      local: window.localStorage,
      session: window.sessionStorage,
      visitorId: getVisitorId,
      excluded: isExcludedBrowser,
      send: async (fn, args) => {
        const { error } = await supabase.rpc(fn, args);
        return { error: error ? { code: error.code, message: error.message } : null };
      },
    });
  }
  return tracker;
}

/** Call once at startup (index.tsx), before React Router or Clerk can redirect away from the landing URL. */
export function initTrafficTracking(): void {
  try {
    getTracker()?.init();
  } catch {
    /* storage blocked etc.: tracking must never break the site */
  }
}

export function trackTrafficEvent(event: TrafficEvent, tool?: string): void {
  try {
    getTracker()?.event(event, tool);
  } catch {
    /* ignore */
  }
}

export function trackSignedIn(): void {
  try {
    getTracker()?.signedIn();
  } catch {
    /* ignore */
  }
}

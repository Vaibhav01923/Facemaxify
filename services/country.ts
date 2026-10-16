// Country tracking for /stats → Countries. The country is worked out on the server from the request (api/geo.js
// reads Vercel's x-vercel-ip-country header), so no IP address ever reaches the browser code or the database and
// no third-party geo service is involved. This file relays that two-letter code, with the random per-browser ID,
// to the track_visitor_country database function (see supabase_country_tracking.sql). Nothing else is sent.
import { supabase } from "./supabase";
import { getVisitorId, isExcludedBrowser } from "./visitor";

// sessionStorage: this browsing session's country has been reported (or tracking is not set up), so don't ask again.
const SENT_KEY = "fmx_country_sent";

/** Call once at startup (index.tsx). Never throws: tracking must not break the site. */
export async function initCountryTracking(): Promise<void> {
  try {
    if (isExcludedBrowser()) return;
    const { pathname } = window.location;
    if (pathname === "/stats" || pathname.startsWith("/stats/")) return; // the owner's dashboard is never a visit
    if (sessionStorage.getItem(SENT_KEY)) return;

    const response = await fetch("/api/geo", { cache: "no-store" });
    if (!response.ok) return;
    const { country } = (await response.json()) as { country?: unknown };
    // No country (local dev, or the edge didn't know): record nothing, /stats shows these visitors as Unknown.
    if (typeof country !== "string" || !/^[A-Z]{2}$/.test(country)) return;

    const { error } = await supabase.rpc("track_visitor_country", { p_visitor: getVisitorId(), p_country: country });
    if (error) {
      if (error.code === "PGRST202" || /could not find the function|does not exist/i.test(error.message)) {
        // The database migration (supabase_country_tracking.sql) has not been run yet: stop trying quietly.
        sessionStorage.setItem(SENT_KEY, "off");
        console.warn("Country tracking is off: run supabase_country_tracking.sql in Supabase.");
      }
      return;
    }
    sessionStorage.setItem(SENT_KEY, "1");
  } catch {
    /* storage blocked, offline, or the page isn't served by Vercel: ignore */
  }
}

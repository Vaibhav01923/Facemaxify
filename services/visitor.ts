// Anonymous per-browser identity shared by the funnel (services/funnel.ts) and traffic-source
// (services/trafficSource.ts) tracking: a random ID, plus flags for "this is the owner" and
// "this is a bot" so neither of them is counted.

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

export function isOwnerBrowser(): boolean {
  try {
    return localStorage.getItem(OWNER_KEY) === "1";
  } catch {
    return false;
  }
}

/** True for bots and for the owner's own browsers: nothing should be recorded for these. */
export function isExcludedBrowser(): boolean {
  return typeof window === "undefined" || BOT.test(navigator.userAgent) || isOwnerBrowser();
}

// A scan started by someone who isn't signed in yet, kept in this browser (localStorage) so it survives a
// reload or the redirect to Clerk's sign-in page, and can be saved to their account once they sign in.
//
// Nothing here leaves the device: the photo is only uploaded after sign-in (see FacialAnalysis.claimGuestScan).
import type { Point } from "../types";

const KEY = "fmx_guest_scan";
const VERSION = 1;
const MAX_AGE_MS = 7 * 24 * 3600 * 1000;

export interface GuestScan {
  v: number;
  /** "edit" = photo uploaded, landmarks still being refined; "done" = all landmarks confirmed, waiting for sign-in */
  stage: "edit" | "done";
  /** the standardised (levelled, square) photo as a data URL */
  photo: string;
  landmarks: Record<string, Point>;
  /** face box used by the landmark editor */
  box: unknown;
  /** which point the landmark editor was on (stage "edit"), so a reload resumes there */
  index?: number;
  savedAt: number;
}

/** Returns false when the browser refuses (storage full or blocked); the flow still works, it just can't resume. */
export function saveGuestScan(scan: Omit<GuestScan, "v" | "savedAt">): boolean {
  try {
    const record: GuestScan = { ...scan, v: VERSION, savedAt: Date.now() };
    localStorage.setItem(KEY, JSON.stringify(record));
    return true;
  } catch {
    return false;
  }
}

export function loadGuestScan(): GuestScan | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const scan = JSON.parse(raw) as GuestScan;
    const valid =
      scan &&
      scan.v === VERSION &&
      (scan.stage === "edit" || scan.stage === "done") &&
      typeof scan.photo === "string" &&
      scan.photo.startsWith("data:image/") &&
      scan.landmarks &&
      typeof scan.landmarks === "object" &&
      Object.keys(scan.landmarks).length > 0 &&
      Date.now() - scan.savedAt < MAX_AGE_MS;
    if (!valid) {
      clearGuestScan();
      return null;
    }
    return scan;
  } catch {
    return null;
  }
}

export function clearGuestScan(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

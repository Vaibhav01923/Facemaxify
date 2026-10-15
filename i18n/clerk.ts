import { esES, jaJP } from "@clerk/localizations";
import { localeOfPath } from "./registry";

// Clerk's sign-in / sign-up popup in the language of the page it opens on (Clerk's own
// translations — it marks them experimental); English everywhere else, so nothing changes for the
// English site. Clerk's hosted sign-in page and its emails stay English.
export function clerkLocalizationFor(pathname: string) {
  switch (localeOfPath(pathname)) {
    case "es":
      return esES;
    case "ja":
      return jaJP;
    default:
      return undefined;
  }
}

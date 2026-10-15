import { useCallback } from "react";
import { useClerk, useUser } from "@clerk/clerk-react";
import { rememberFullReportClick } from "../../services/attribution";

const FULL_REPORT_PATH = "/dashboard/facial-analysis";

// "See my full report" on the translated pages. Records which page the click came from, then goes
// straight to the report when signed in; otherwise opens Clerk's sign-in popup (in the page's
// language, see i18n/clerk.ts) and sends the visitor to the report afterwards. Linking straight to
// /dashboard would bounce signed-out visitors to Clerk's English-only hosted sign-in page.
export function useFullReport(): () => void {
  const { isSignedIn } = useUser();
  const { openSignIn } = useClerk();

  return useCallback(() => {
    rememberFullReportClick();
    if (isSignedIn) {
      window.location.href = FULL_REPORT_PATH;
      return;
    }
    try {
      localStorage.setItem("pendingAction", "dashboard");
    } catch {
      // storage blocked: the redirect URL below does the work anyway
    }
    const redirect = `${window.location.origin}${FULL_REPORT_PATH}`;
    openSignIn({ forceRedirectUrl: redirect, signUpForceRedirectUrl: redirect });
  }, [isSignedIn, openSignIn]);
}

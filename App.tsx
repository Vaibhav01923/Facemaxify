import React, { Suspense, useState } from "react";
import { SignedIn, SignedOut, UserButton, useUser, RedirectToSignIn } from "@clerk/clerk-react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { LandingPage } from "./components/LandingPage";
import { Navbar } from "./components/Navbar";
import { FinalResult, FrontLandmarks, Point } from "./types";
import { standardizeImage } from "./utils/imageProcessing";
import { supabase } from "./services/supabase";
import { trackPageView } from "./services/funnel";
import { initAttribution } from "./services/attribution";
import { trackSignedIn } from "./services/trafficSource";
import { resolveAccess, type SubscriptionInfo } from "./services/subscription";

import {
  SEO,
  FacialAnalysisSEO,
} from "./components/SEO";
import { FacialShapePage } from "./pages/FacialShapePage";
import { ToolsDirectoryPage } from "./pages/ToolsDirectoryPage";
import { GoldenRatioPage } from "./pages/GoldenRatioPage";
import { CanthalTiltPage } from "./pages/CanthalTiltPage";
import { FaceSymmetryPage } from "./pages/FaceSymmetryPage";
import { FacialThirdsPage } from "./pages/FacialThirdsPage";
import { EyeSpacingPage } from "./pages/EyeSpacingPage";
import { JawlineScorePage } from "./pages/JawlineScorePage";
import { NoseRatioPage } from "./pages/NoseRatioPage";
import { LipRatioPage } from "./pages/LipRatioPage";
import { HunterEyesPage } from "./pages/HunterEyesPage";
import { FacialWidthHeightPage } from "./pages/FacialWidthHeightPage";
import { CheekboneWidthPage } from "./pages/CheekboneWidthPage";
import { MidfaceRatioPage } from "./pages/MidfaceRatioPage";
import { ForeheadRatioPage } from "./pages/ForeheadRatioPage";
import { PhiltrumRatioPage } from "./pages/PhiltrumRatioPage";
import { BrowPositionPage } from "./pages/BrowPositionPage";
import { ChinRatioPage } from "./pages/ChinRatioPage";
import { LowerThirdPage } from "./pages/LowerThirdPage";
import { LooksmaxScorePage } from "./pages/LooksmaxScorePage";
import { PslRatingPage } from "./pages/PslRatingPage";
import { FaceRatingPage } from "./pages/FaceRatingPage";
import { AttractivenessScorePage } from "./pages/AttractivenessScorePage";
import { HarmonyScorePage } from "./pages/HarmonyScorePage";
import { SeoLandingPageRoute } from "./pages/SeoLandingPageRoute";
import { BlogListingPage } from "./pages/BlogListingPage";
import { BlogPostPage } from "./pages/BlogPostPage";
import { MethodologyPage } from "./pages/MethodologyPage";
import { LocalizedHubPage } from "./components/i18n/LocalizedHubPage";
import { LocalizedToolPage } from "./components/i18n/LocalizedToolPage";
import { hubPath, LOCALIZED_HUBS, LOCALIZED_PAGES, pagePath } from "./i18n/registry";

// Auth-gated and admin routes are not prerendered, so they load on demand instead of
// weighing down the landing page bundle (recharts, MediaPipe, the dashboard shell).
const DashboardHome = React.lazy(() => import("./components/DashboardHome").then((m) => ({ default: m.DashboardHome })));
const DashboardLayout = React.lazy(() => import("./components/dashboard/DashboardLayout").then((m) => ({ default: m.DashboardLayout })));
const SectionPage = React.lazy(() => import("./components/dashboard/SectionPage").then((m) => ({ default: m.SectionPage })));
const ScanFlow = React.lazy(() => import("./components/dashboard/ScanFlow").then((m) => ({ default: m.ScanFlow })));
const StatsPage = React.lazy(() => import("./pages/StatsPage").then((m) => ({ default: m.StatsPage })));

const RouteSpinner = () => (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  constructor(props: any) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-8 text-center">
          <p className="text-red-400 font-mono text-sm mb-2">App crashed — error details:</p>
          <pre className="text-slate-300 text-xs bg-slate-900 p-4 rounded-xl max-w-xl overflow-auto text-left">{this.state.error.message}{"\n"}{this.state.error.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const App: React.FC = () => {
  const { user, isLoaded } = useUser();
  const { pathname } = useLocation();

  // Funnel views for /stats (only counted on tool pages — see services/funnel.ts), and the
  // first-party attribution kept for checkout (first page, language — see services/attribution.ts).
  React.useEffect(() => {
    trackPageView(pathname);
    initAttribution(pathname);
  }, [pathname]);

  // Traffic sources: count a signed-in visit (once per session) against the visitor's source.
  React.useEffect(() => {
    if (isLoaded && user) trackSignedIn();
  }, [isLoaded, user]);
  const [isPaid, setIsPaid] = useState<boolean | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [checkingPayment, setCheckingPayment] = useState(false);

  React.useEffect(() => {
    async function checkPaymentStatus() {
      if (!user?.primaryEmailAddress?.emailAddress) return;

      setCheckingPayment(true);
      try {
        // 1. Get User Data
        const { data: userData, error } = await supabase
          .from("users")
          .select("*") // Fetch everything to be sure of column names
          .eq("email", user.primaryEmailAddress.emailAddress)
          .single();

        console.log("DEBUG: Supabase User Fetch:", { userData, error });

        // 2. Detect Country if missing
        if (!userData?.country) {
          const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          let country = timeZone; // Fallback to timezone

          // Simple mapping for major regions
          if (timeZone.includes("Calcutta") || timeZone.includes("Kolkata"))
            country = "India";
          else if (timeZone.includes("London")) country = "UK";
          else if (
            timeZone.includes("New_York") ||
            timeZone.includes("Los_Angeles") ||
            timeZone.includes("Chicago")
          )
            country = "USA";
          else if (timeZone.includes("Paris")) country = "France";
          else if (timeZone.includes("Berlin")) country = "Germany";
          else if (timeZone.includes("Dubai")) country = "UAE";
          else if (timeZone.includes("Tokyo")) country = "Japan";
          else if (
            timeZone.includes("Sydney") ||
            timeZone.includes("Melbourne")
          )
            country = "Australia";
          else if (timeZone.includes("Canada")) country = "Canada";
          else if (timeZone.includes("Sao_Paulo")) country = "Brazil";

          // 3. Upsert User (Insert if new, Update if exists)
          if (!user.id) {
            console.error("CRITICAL: user.id is missing!", user);
            return;
          }
          console.log("DEBUG: Upserting user with ID:", user.id);

          const { error: upsertError } = await supabase.from("users").upsert(
            {
              // Use Clerk ID as the primary key if possible,
              // otherwise ensuring this field is populated fixes the "null value" error
              id: user.id,
              email: user.primaryEmailAddress.emailAddress,
              country: country,
              // We don't overwrite isPaid to false on upsert to avoid revoking access if logic fails,
              // but for new users it defaults to false/null in DB structure usually.
              // If userData exists, keep existing isPaid.
              ...(userData ? {} : { isPaid: false }),
            },
            { onConflict: "email" },
          );

          if (upsertError)
            console.error("Failed to save country:", upsertError);
        }

        // Handles both casing possibilities and string/bool types, and ends a cancelled
        // subscriber's access when their paid period ends (services/subscription.ts).
        const access = resolveAccess(userData);
        setSubscription(access.subscription);
        setIsPaid(access.isPaid);
      } catch (err) {
        console.error("Failed to check payment status:", err);
        setIsPaid(false);
      } finally {
        setCheckingPayment(false);
      }
    }

    if (user) {
      checkPaymentStatus();
    }
  }, [user]);

  // Show loader while Clerk is loading, OR while we are checking payment,
  // OR if we have a user but haven't determined their paid status yet.
  const isDeterminingAccess =
    !isLoaded || checkingPayment || (user && isPaid === null);

  // Only the dashboard depends on auth and payment state. Public pages ship prerendered in
  // the HTML (scripts/prerender.mjs), so they render straight away instead of swapping that
  // content for a spinner while Clerk loads.
  if (isDeterminingAccess && pathname.startsWith("/dashboard")) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Suspense fallback={<RouteSpinner />}>
    <Routes>
      <Route
        path="/"
        element={
          <>
            <SEO />
            {isLoaded && user ? <Navigate to="/dashboard" replace /> : <LandingPage />}
          </>
        }
      />

      {/* Dashboard hub: one shell (left rail + mobile tab bar) around the overview and the four report sections. */}
      <Route
        path="/dashboard"
        element={
          <>
            <SignedIn>
              <DashboardLayout isPaid={!!isPaid} subscription={subscription} />
            </SignedIn>
            <SignedOut><RedirectToSignIn /></SignedOut>
          </>
        }
      >
        <Route index element={<DashboardHome />} />
        <Route path="facial" element={<SectionPage kind="facial" />} />
        <Route path="skincare" element={<SectionPage kind="skincare" />} />
        <Route path="color" element={<SectionPage kind="color" />} />
        <Route path="hairstyle" element={<SectionPage kind="hairstyle" />} />
      </Route>

      <Route
        path="/dashboard/facial-analysis"
        element={
          // Open to signed-out visitors: they can upload and map their landmarks without an account, and are asked
          // to sign in only to see the results (see GuestResultsGate / services/guestScan.ts).
          <>
            <FacialAnalysisSEO />
            <ScanFlow />
          </>
        }
      />

      <Route path="/methodology" element={<MethodologyPage />} />
      <Route path="/stats" element={<StatsPage />} />
      <Route path="/tools" element={<ToolsDirectoryPage />} />
      <Route path="/blog" element={<BlogListingPage />} />
      <Route path="/blog/:slug" element={<BlogPostPage />} />
      <Route path="/tools/facial-shape" element={<FacialShapePage />} />
      <Route path="/tools/golden-ratio" element={<GoldenRatioPage />} />
      <Route path="/tools/canthal-tilt" element={<CanthalTiltPage />} />
      <Route path="/tools/face-symmetry" element={<FaceSymmetryPage />} />
      <Route path="/tools/facial-thirds" element={<FacialThirdsPage />} />
      <Route path="/tools/eye-spacing" element={<EyeSpacingPage />} />
      <Route path="/tools/jawline-score" element={<JawlineScorePage />} />
      <Route path="/tools/nose-ratio" element={<NoseRatioPage />} />
      <Route path="/tools/lip-ratio" element={<LipRatioPage />} />
      <Route path="/tools/hunter-eyes" element={<HunterEyesPage />} />
      <Route path="/tools/facial-width-height" element={<FacialWidthHeightPage />} />
      <Route path="/tools/cheekbone-width" element={<CheekboneWidthPage />} />
      <Route path="/tools/midface-ratio" element={<MidfaceRatioPage />} />
      <Route path="/tools/forehead-ratio" element={<ForeheadRatioPage />} />
      <Route path="/tools/philtrum-ratio" element={<PhiltrumRatioPage />} />
      <Route path="/tools/brow-position" element={<BrowPositionPage />} />
      <Route path="/tools/chin-ratio" element={<ChinRatioPage />} />
      <Route path="/tools/lower-third" element={<LowerThirdPage />} />
      <Route path="/tools/looksmax-score" element={<LooksmaxScorePage />} />
      <Route path="/tools/psl-rating" element={<PslRatingPage />} />
      <Route path="/tools/face-rating" element={<FaceRatingPage />} />
      <Route path="/tools/attractiveness-score" element={<AttractivenessScorePage />} />
      <Route path="/tools/harmony-score" element={<HarmonyScorePage />} />

      {/* Translated pages (Spanish, Japanese): /es, /es/<slug>, /ja, /ja/<slug>. Generated from
          i18n/pages.ts; an unknown path under a language goes to that language's hub. */}
      {LOCALIZED_HUBS.map((hub) => (
        <React.Fragment key={hub.locale}>
          <Route path={hubPath(hub.locale)} element={<LocalizedHubPage locale={hub.locale} />} />
          <Route path={`${hubPath(hub.locale)}/*`} element={<Navigate to={hubPath(hub.locale)} replace />} />
        </React.Fragment>
      ))}
      {LOCALIZED_PAGES.map((page) => (
        <React.Fragment key={pagePath(page)}>
          <Route path={pagePath(page)} element={<LocalizedToolPage page={page} />} />
        </React.Fragment>
      ))}

      <Route path="/:slug" element={<SeoLandingPageRoute />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  );
};

const WaitlistSuccess: React.FC = () => (
  <>
    <Navbar />
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center animate-fadeIn text-white">
      <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
        <span className="text-4xl">🔒</span>
      </div>
      <h2 className="text-3xl font-bold mb-2">Access Required</h2>
      <p className="text-slate-400 mb-8 max-w-md">
        You need to purchase access to use this tool.
      </p>
      <button
        onClick={() => {
          window.location.href = "/";
        }}
        className="px-6 py-3 bg-blue-600 rounded-lg font-semibold hover:bg-blue-500 transition-colors"
      >
        Go to Home
      </button>
    </div>
  </>
);

export default App;

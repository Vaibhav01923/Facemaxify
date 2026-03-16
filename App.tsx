import React, { useState } from "react";
import { SignedIn, SignedOut, UserButton, useUser } from "@clerk/clerk-react";
import { Routes, Route, Navigate } from "react-router-dom";
import { LandingPage } from "./components/LandingPage";
import { Dashboard } from "./components/Dashboard";
import { LandmarkEditor } from "./components/LandmarkEditor";
import { Navbar } from "./components/Navbar";
import { FinalResult, FrontLandmarks, Point } from "./types";
import {
  detectLandmarksInstant,
  initializeMediaPipe,
} from "./services/mediaPipeService";
import { standardizeImage } from "./utils/imageProcessing";
import { supabase } from "./services/supabase";

import { DashboardHome } from "./components/DashboardHome";
import { FacialAnalysis } from "./components/FacialAnalysis";
import { Guides } from "./components/Guides";
import { GuideDetail } from "./components/GuideDetail";
import {
  SEO,
  DashboardSEO,
  FacialAnalysisSEO,
  GuidesSEO,
} from "./components/SEO";
import { FacialShapePage } from "./pages/FacialShapePage";
import { ToolsDirectoryPage } from "./pages/ToolsDirectoryPage";
import { GoldenRatioPage } from "./pages/GoldenRatioPage";
import { CanthalTiltPage } from "./pages/CanthalTiltPage";
import { SeoLandingPageRoute } from "./pages/SeoLandingPageRoute";

const App: React.FC = () => {
  const { user, isLoaded } = useUser();
  const [isPaid, setIsPaid] = useState<boolean | null>(null);
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

        let currentIsPaid = false;

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

        // Handle both casing possibilities and string/bool types
        if (userData) {
          if (
            userData.isPaid === true ||
            userData.is_paid === true ||
            userData.isPaid === "true"
          ) {
            currentIsPaid = true;
          }
        }

        setIsPaid(currentIsPaid);
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

  if (isDeterminingAccess) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <>
            <SEO />
            <SignedOut>
              <LandingPage />
            </SignedOut>
            <SignedIn>
              <Navigate to="/dashboard" replace />
            </SignedIn>
          </>
        }
      />

      <Route
        path="/dashboard"
        element={
          <SignedIn>
            <>
              <DashboardSEO />
              <DashboardHome isPaid={isPaid} />
            </>
          </SignedIn>
        }
      />

      <Route
        path="/dashboard/facial-analysis"
        element={
          <SignedIn>
            <>
              <FacialAnalysisSEO />
              <FacialAnalysis isPaid={isPaid} />
            </>
          </SignedIn>
        }
      />

      <Route
        path="/dashboard/guides"
        element={
          <SignedIn>
            <>
              <GuidesSEO />
              <Guides isPaid={isPaid} />
            </>
          </SignedIn>
        }
      />

      <Route
        path="/dashboard/guides/:guideId"
        element={
          <SignedIn>
            {isPaid ? (
              <GuideDetail />
            ) : (
              <Navigate to="/dashboard/guides" replace />
            )}
          </SignedIn>
        }
      />

      <Route path="/tools" element={<ToolsDirectoryPage />} />
      <Route path="/tools/facial-shape" element={<FacialShapePage />} />
      <Route path="/tools/golden-ratio" element={<GoldenRatioPage />} />
      <Route path="/tools/canthal-tilt" element={<CanthalTiltPage />} />
      <Route path="/:slug" element={<SeoLandingPageRoute />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
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

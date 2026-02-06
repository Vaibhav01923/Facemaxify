import React, { useState } from "react";
import { SignedIn, SignedOut, UserButton, useUser } from "@clerk/clerk-react";
import { Routes, Route, Navigate } from "react-router-dom";
import { LandingPage } from "./components/LandingPage";
import { Dashboard } from "./components/Dashboard";
import { LandmarkEditor } from "./components/LandmarkEditor";
import { Navbar } from "./components/Navbar";
import { FinalResult, FrontLandmarks, SideLandmarks, Point } from "./types";
import {
  detectLandmarksInstant,
  initializeMediaPipe,
} from "./services/mediaPipeService";
import { standardizeImage } from "./utils/imageProcessing";
import { supabase } from "./services/supabase";

import { DashboardHome } from "./components/DashboardHome";
import { FacialAnalysis } from "./components/FacialAnalysis";
import { Guides } from "./components/Guides";

const App: React.FC = () => {
  const { user, isLoaded } = useUser();
  const [isPaid, setIsPaid] = useState<boolean | null>(null);
  const [checkingPayment, setCheckingPayment] = useState(false);

  React.useEffect(() => {
    async function checkPaymentStatus() {
      if (!user?.primaryEmailAddress?.emailAddress) return;
      
      setCheckingPayment(true);
      try {
        const { data, error } = await supabase
          .from("users")
          .select("isPaid")
          .eq("email", user.primaryEmailAddress.emailAddress)
          .single();

        if (data && data.isPaid) {
          setIsPaid(true);
        } else {
          setIsPaid(false);
        }
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

  // Check if the current user is the owner (bypass payment)
  const isOwner = user?.primaryEmailAddress?.emailAddress === "kandpal1221@gmail.com";
  
  // Grant access if owner OR paid
  const hasAccess = isOwner || isPaid;

  if (!isLoaded || checkingPayment) {
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
            <SignedOut>
              <LandingPage />
            </SignedOut>
            <SignedIn>
              {hasAccess ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <WaitlistSuccess />
              )}
            </SignedIn>
          </>
        }
      />

      <Route
        path="/dashboard"
        element={
          <SignedIn>
            {hasAccess ? <DashboardHome /> : <Navigate to="/" replace />}
          </SignedIn>
        }
      />

      <Route
        path="/dashboard/facial-analysis"
        element={
          <SignedIn>
            {hasAccess ? <FacialAnalysis /> : <Navigate to="/" replace />}
          </SignedIn>
        }
      />

      <Route
        path="/dashboard/guides"
        element={
          <SignedIn>
            {hasAccess ? <Guides /> : <Navigate to="/" replace />}
          </SignedIn>
        }
      />

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

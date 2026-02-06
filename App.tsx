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

/**
 * STEP-BY-STEP FLOW:
 * Step 0: Upload Front Photo
 * Step 1: Initial Detection (Front)
 * Step 2: Standardize Front Image
 * Step 3: Re-detect Front Landmarks
 * Step 4: Edit Front Landmarks
 * Step 5: Upload Side Photo (Optional)
 * Step 6: Process Side Photo (if uploaded)
 * Step 7: Edit Side Landmarks (if side photo)
 * Step 8: Show Dashboard
 */

const AnalysisFlow: React.FC = () => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for Front Photo Pipeline
  const [frontPhotoRaw, setFrontPhotoRaw] = useState<string | null>(null);
  const [frontPhotoStandardized, setFrontPhotoStandardized] = useState<
    string | null
  >(null);
  const [frontLandmarks, setFrontLandmarks] = useState<Record<
    string,
    Point
  > | null>(null);
  const [frontBox, setFrontBox] = useState<any>(null);

  // State for Side Photo Pipeline
  const [sidePhotoRaw, setSidePhotoRaw] = useState<string | null>(null);
  const [sidePhotoStandardized, setSidePhotoStandardized] = useState<
    string | null
  >(null);
  const [sideLandmarks, setSideLandmarks] = useState<Record<
    string,
    Point
  > | null>(null);
  const [sideBox, setSideBox] = useState<any>(null);

  // Final Result
  const [finalResult, setFinalResult] = useState<FinalResult | null>(null);

  // Initialize MediaPipe on mount
  React.useEffect(() => {
    initializeMediaPipe();
  }, []);

  // PHASE A: NORMALIZATION PIPELINE
  const handleFrontPhotoUpload = async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        setFrontPhotoRaw(base64);

        // Step 1: Initial Detection
        const { landmarks: initialLandmarks, box } =
          await detectLandmarksInstant(base64, "front");

        // Step 2: Standardize Image
        const standardized = await standardizeImage(base64, initialLandmarks);
        setFrontPhotoStandardized(standardized);

        // Step 3: Re-detect on standardized image
        const { landmarks: finalLandmarks, box: finalBox } =
          await detectLandmarksInstant(standardized, "front");
        setFrontLandmarks(finalLandmarks);
        setFrontBox(finalBox);

        // Move to editing step
        setStep(4);
        setLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process image");
      setLoading(false);
    }
  };

  // PHASE B: PRECISION REFINEMENT
  const handleFrontEditComplete = (editedLandmarks: Record<string, Point>) => {
    setFrontLandmarks(editedLandmarks);
    setStep(5); // Move to side photo upload
  };

  const handleSkipSidePhoto = () => {
    // Go directly to dashboard
    if (frontPhotoStandardized && frontLandmarks) {
      setFinalResult({
        frontPhotoUrl: frontPhotoStandardized,
        frontLandmarks: frontLandmarks as FrontLandmarks,
        gender: "unknown",
        race: "unknown",
      });
      setStep(8);
    }
  };

  const handleSidePhotoUpload = async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        setSidePhotoRaw(base64);

        // Initial detection
        const { landmarks: initialLandmarks, box } =
          await detectLandmarksInstant(base64, "side");

        // Standardize
        const standardized = await standardizeImage(base64, initialLandmarks);
        setSidePhotoStandardized(standardized);

        // Re-detect
        const { landmarks: finalLandmarks, box: finalBox } =
          await detectLandmarksInstant(standardized, "side");
        setSideLandmarks(finalLandmarks);
        setSideBox(finalBox);

        setStep(7); // Move to side editing
        setLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to process side image"
      );
      setLoading(false);
    }
  };

  const handleSideEditComplete = (editedLandmarks: Record<string, Point>) => {
    setSideLandmarks(editedLandmarks);

    // PHASE E: FINAL RENDERING
    if (frontPhotoStandardized && frontLandmarks) {
      setFinalResult({
        frontPhotoUrl: frontPhotoStandardized,
        frontLandmarks: frontLandmarks as FrontLandmarks,
        sidePhotoUrl: sidePhotoStandardized,
        sideLandmarks: editedLandmarks as SideLandmarks,
        gender: "unknown",
        race: "unknown",
      });
      setStep(8);
    }
  };

  // RENDER BASED ON STEP
  if (step === 0) {
    // Upload Front Photo
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-8">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
            <h1 className="text-3xl font-bold mb-4">Facial Analysis</h1>
            <p className="text-slate-400 mb-8">
              Upload a front-facing photo to begin
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <label className="block w-full cursor-pointer bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-4 rounded-xl transition-colors">
              <span>{loading ? "Processing..." : "Upload Front Photo"}</span>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                disabled={loading}
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleFrontPhotoUpload(e.target.files[0]);
                  }
                }}
              />
            </label>
          </div>
        </div>
      </>
    );
  }

  if (step === 4 && frontPhotoStandardized && frontLandmarks && frontBox) {
    // PHASE B: Edit Front Landmarks
    return (
      <LandmarkEditor
        photoUrl={frontPhotoStandardized}
        initialLandmarks={frontLandmarks}
        faceBox={frontBox}
        onComplete={handleFrontEditComplete}
        title="Refine Front View Landmarks"
        landmarkType="front"
      />
    );
  }

  if (step === 5) {
    // Upload Side Photo (Optional)
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-8">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Side Profile (Optional)</h1>
            <p className="text-slate-400 mb-8">
              Upload a side profile photo for additional analysis, or skip to
              see results
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <label className="block w-full cursor-pointer bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-4 rounded-xl transition-colors mb-4">
              <span>{loading ? "Processing..." : "Upload Side Photo"}</span>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                disabled={loading}
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleSidePhotoUpload(e.target.files[0]);
                  }
                }}
              />
            </label>

            <button
              onClick={handleSkipSidePhoto}
              disabled={loading}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-3 px-4 rounded-xl border border-slate-700 transition-colors"
            >
              Skip & View Results
            </button>
          </div>
        </div>
      </>
    );
  }

  if (step === 7 && sidePhotoStandardized && sideLandmarks && sideBox) {
    // Edit Side Landmarks
    return (
      <LandmarkEditor
        photoUrl={sidePhotoStandardized}
        initialLandmarks={sideLandmarks}
        faceBox={sideBox}
        onComplete={handleSideEditComplete}
        title="Refine Side Profile Landmarks"
        landmarkType="side"
      />
    );
  }

  if (step === 8 && finalResult) {
    // PHASE E: Dashboard with Results
    return <Dashboard data={finalResult} />;
  }

  // Loading state
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Processing...</p>
        </div>
      </div>
    </>
  );
};

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
              {isLoaded && !checkingPayment ? (
                  hasAccess ? <AnalysisFlow /> : <WaitlistSuccess />
              ) : (
                <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
                   <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </SignedIn>
          </>
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
             // Redirect to checkout again if they claim they paid but it's not showing, or if they need to buy
             // But actually, maybe simpler to just redirect to home or show purchase button again?
             // For now let's just show a purchase button logic again or sign out
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

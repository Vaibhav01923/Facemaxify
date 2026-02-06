import React, { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { LandmarkEditor } from "./LandmarkEditor";
import { Dashboard as ResultsDashboard } from "./Dashboard";
import { Navbar } from "./Navbar";
import { Clock } from "lucide-react";
import { FinalResult, FrontLandmarks, SideLandmarks, Point } from "../types";
import {
  detectLandmarksInstant,
  initializeMediaPipe,
} from "../services/mediaPipeService";
import { standardizeImage } from "../utils/imageProcessing";
import { saveScanResult, getScanHistory } from "../services/supabase";
import { AnalysisHistory } from "./AnalysisHistory";

export const FacialAnalysis: React.FC = () => {
  const { user } = useUser();
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

  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null);

  // Initialize MediaPipe and fetch history on mount
  React.useEffect(() => {
    initializeMediaPipe();
    
    async function initHistory() {
      if (user?.id) {
        const data = await getScanHistory(user.id);
        if (data && data.length > 0) {
          // Default to latest scan
          loadFromHistory(data[0]);
          setSelectedScanId(data[0].id);
        }
        setHistoryLoaded(true);
      } else {
        setHistoryLoaded(true);
      }
    }
    initHistory();
  }, [user]);

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
      const result: FinalResult = {
        frontPhotoUrl: frontPhotoStandardized,
        frontLandmarks: frontLandmarks as FrontLandmarks,
        gender: "unknown",
        race: "unknown",
      };
      setFinalResult(result);
      setStep(8);

      // AUTO-SAVE
      if (user?.id) {
        saveScanResult(result, 0, user.id);
      }
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
      const result: FinalResult = {
        frontPhotoUrl: frontPhotoStandardized,
        frontLandmarks: frontLandmarks as FrontLandmarks,
        sidePhotoUrl: sidePhotoStandardized,
        sideLandmarks: editedLandmarks as SideLandmarks,
        gender: "unknown",
        race: "unknown",
      };
      setFinalResult(result);
      setStep(8);

      // AUTO-SAVE
      if (user?.id) {
        saveScanResult(result, 0, user.id);
      }
    }
  };

  const loadFromHistory = (scan: any) => {
    // Reconstruct FinalResult from DB scan
    const historyResult: FinalResult = {
      gender: scan.gender,
      race: scan.race,
      frontPhotoUrl: scan.front_photo_url,
      sidePhotoUrl: scan.side_photo_url,
      frontLandmarks: scan.front_landmarks,
      sideLandmarks: scan.side_landmarks
    };
    setSelectedScanId(scan.id);
    setFinalResult(historyResult);
    setStep(8);
  };

  const startNewAnalysis = () => {
    setFinalResult(null);
    setStep(0);
    setFrontPhotoRaw(null);
    setFrontPhotoStandardized(null);
    setFrontLandmarks(null);
    setSidePhotoRaw(null);
    setSidePhotoStandardized(null);
    setSideLandmarks(null);
  };

  // If we are still determining if history exists, show a basic loader
  if (!historyLoaded) {
    return (
      <div className="min-h-screen bg-[#050510] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // WRAP EVERYTHING IN A SIDEBAR LAYOUT IF USER IS LOGGED IN
  return (
    <div className="flex h-screen bg-[#050510] overflow-hidden">
      {user && (
        <AnalysisHistory 
          onSelectScan={loadFromHistory} 
          onNewScan={startNewAnalysis}
          selectedScanId={selectedScanId || undefined} 
        />
      )}
      
      <div className="flex-1 flex flex-col min-w-0 bg-[#050510]">
        <div className="flex-1 overflow-y-auto relative">
          {/* Main Content Area */}
          {step === 0 && (
            <div className="flex flex-col items-center justify-center p-8 min-h-full">
               <div className="max-w-md w-full bg-slate-900/50 border border-white/5 backdrop-blur-xl rounded-3xl p-10 text-center shadow-2xl">
                <h1 className="text-3xl font-black text-white mb-4 tracking-tight">Facial Analysis</h1>
                <p className="text-slate-400 mb-10 font-medium">
                  Upload a front-facing photo to begin your aesthetic journey
                </p>

                {error && (
                  <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-medium">
                    {error}
                  </div>
                )}

                <label className="block w-full cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-lg shadow-indigo-500/10 active:scale-[0.98]">
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
          )}

          {step === 4 && frontPhotoStandardized && frontLandmarks && frontBox && (
            <div className="h-full">
              <LandmarkEditor
                photoUrl={frontPhotoStandardized}
                initialLandmarks={frontLandmarks}
                faceBox={frontBox}
                onComplete={handleFrontEditComplete}
                title="Refine Front View Landmarks"
                landmarkType="front"
              />
            </div>
          )}

          {step === 5 && (
            <div className="flex flex-col items-center justify-center p-8 min-h-full">
              <div className="max-w-md w-full bg-slate-900/50 border border-white/5 backdrop-blur-xl rounded-3xl p-10 text-center shadow-2xl">
                <h1 className="text-3xl font-black text-white mb-4 tracking-tight">Side Profile</h1>
                <p className="text-slate-400 mb-10 font-medium italic">
                  (Optional) Upload a side profile photo for additional analysis, or skip to see results
                </p>

                <label className="block w-full cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-lg shadow-indigo-500/10 active:scale-[0.98] mb-4">
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
                  className="w-full bg-white/5 hover:bg-white/10 text-slate-300 font-bold py-4 px-6 rounded-2xl border border-white/5 transition-all active:scale-[0.98]"
                >
                  Skip & View Results
                </button>
              </div>
            </div>
          )}

          {step === 7 && sidePhotoStandardized && sideLandmarks && sideBox && (
            <div className="h-full">
              <LandmarkEditor
                photoUrl={sidePhotoStandardized}
                initialLandmarks={sideLandmarks}
                faceBox={sideBox}
                onComplete={handleSideEditComplete}
                title="Refine Side Profile Landmarks"
                landmarkType="side"
              />
            </div>
          )}

          {step === 8 && finalResult && (
            <ResultsDashboard data={finalResult} />
          )}

          {/* Loading Overlay for internal transitions */}
          {loading && (step !== 0 && step !== 5) && (
             <div className="absolute inset-0 bg-[#050510]/60 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="text-center">
                 <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                 <p className="text-slate-400 font-bold tracking-wide">Refining Analysis...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

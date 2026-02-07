import React, { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { LandmarkEditor } from "./LandmarkEditor";
import { Dashboard as ResultsDashboard } from "./Dashboard";
import { Navbar } from "./Navbar";
import { Clock, Menu, X } from "lucide-react";
import { FinalResult, FrontLandmarks, Point } from "../types";
import {
  detectLandmarksInstant,
  initializeMediaPipe,
} from "../services/mediaPipeService";
import { standardizeImage } from "../utils/imageProcessing";
import { saveScanResult, getScanHistory, supabase } from "../services/supabase";
import { calculateFrontRatios } from "../services/ratioCalculator";
import { AnalysisHistory } from "./AnalysisHistory";

export const FacialAnalysis: React.FC<{ isPaid?: boolean }> = ({ isPaid = false }) => {
  const { user } = useUser();
  const [step, setStep] = useState(0);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

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

  const handleFrontEditComplete = (editedLandmarks: Record<string, Point>) => {
    setFrontLandmarks(editedLandmarks);
    
    // Jump directly to results
    if (frontPhotoStandardized) {
      const result: FinalResult = {
        frontPhotoUrl: frontPhotoStandardized,
        frontLandmarks: editedLandmarks as FrontLandmarks,
        gender: "unknown",
        race: "unknown",
      };
      setFinalResult(result);
      setStep(8);

      // AUTO-SAVE with calculated score
      if (user?.id) {
        const metrics = calculateFrontRatios(editedLandmarks as FrontLandmarks);
        const score = metrics.length > 0 
          ? parseFloat((metrics.reduce((acc, curr) => acc + curr.score, 0) / metrics.length).toFixed(1))
          : 0;
        
        saveScanResult(result, score, user.id);
      }
    }
  };

  const loadFromHistory = (scan: any) => {
    // Reconstruct FinalResult from DB scan
    const historyResult: FinalResult = {
      gender: scan.gender,
      race: scan.race,
      frontPhotoUrl: scan.front_photo_url,
      frontLandmarks: scan.front_landmarks,
    };
    setSelectedScanId(scan.id);
    setFinalResult(historyResult);
    setStep(8);
    setSidebarOpen(false); // Close sidebar on mobile selection
  };

  const startNewAnalysis = () => {
    setFinalResult(null);
    setStep(0);
    setFrontPhotoRaw(null);
    setFrontPhotoStandardized(null);
    setFrontLandmarks(null);
    setSidebarOpen(false); // Close sidebar
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
    <div className="flex h-screen bg-[#050510] overflow-hidden relative">
      {/* Mobile Sidebar Overlay & Drawer */}
      {user && (
        <>
          {/* Backdrop */}
          {isSidebarOpen && (
            <div 
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 md:hidden animate-fadeIn"
              onClick={() => setSidebarOpen(false)}
            />
          )}
          
          {/* Sidebar */}
          <div className={`
            fixed inset-y-0 left-0 z-50 w-80 bg-[#0A0A0F] transform transition-transform duration-300 ease-in-out md:translate-x-0 md:relative md:block
            ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}>
             <div className="absolute top-4 right-4 md:hidden z-10">
               <button onClick={() => setSidebarOpen(false)} className="p-2 text-slate-400 hover:text-white">
                 <X className="w-6 h-6" />
               </button>
             </div>
             <AnalysisHistory 
              onSelectScan={loadFromHistory} 
              onNewScan={startNewAnalysis}
              selectedScanId={selectedScanId || undefined} 
            />
          </div>
        </>
      )}
      
      <div className="flex-1 flex flex-col min-w-0 bg-[#050510] relative z-0">
        {/* Mobile Header Toggle */}
        {user && (
          <div className="md:hidden p-4 flex items-center justify-between border-b border-white/5 bg-[#050510]/80 backdrop-blur-md sticky top-0 z-40">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="font-bold text-white text-sm tracking-tight">Facemaxify</span>
            <div className="w-10" /> {/* Spacer for balance */}
          </div>
        )}

        <div className={`flex-1 relative custom-scrollbar ${step === 4 ? 'overflow-hidden' : 'overflow-y-auto'}`}>
          {/* Main Content Area */}
          {step === 0 && (
            <div className="flex flex-col items-center justify-center p-8 min-h-full">
               <div className="max-w-md w-full bg-slate-900/50 border border-white/5 backdrop-blur-xl rounded-3xl p-10 text-center shadow-2xl">
                <h1 className="text-3xl font-black text-white mb-4 tracking-tight">Facial Analysis</h1>
                <p className="text-slate-400 mb-10 font-medium tracking-tight">
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
                title="Refine My Landmarks"
                landmarkType="front"
              />
            </div>
          )}

          {step === 8 && finalResult && (
            <ResultsDashboard data={finalResult} isPaid={isPaid} />
          )}

          {/* Loading Overlay for internal transitions */}
          {loading && step !== 0 && (
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

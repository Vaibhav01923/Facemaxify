import React, { useRef, useState } from "react";
import { useClerk, useUser } from "@clerk/clerk-react";
import { useSearchParams } from "react-router-dom";
import { LandmarkEditor } from "./LandmarkEditor";
import { Dashboard as ResultsDashboard } from "./Dashboard";
import { GuestResultsGate } from "./GuestResultsGate";
import { clearGuestScan, loadGuestScan, saveGuestScan, type GuestScan } from "../services/guestScan";
import { Navbar } from "./Navbar";
import { Clock, Menu, X } from "lucide-react";
import { FinalResult, FrontLandmarks, Point } from "../types";
import {
  detectLandmarksInstant,
  initializeMediaPipe,
} from "../services/mediaPipeService";
import { standardizeImage } from "../utils/imageProcessing";
import { saveScanResult, getScanHistory, supabase } from "../services/supabase";
import {
  calculateFrontRatios,
  calculateWeightedTotalScore,
} from "../services/ratioCalculator";
import { AnalysisHistory } from "./AnalysisHistory";
import { MAIN_TOOL_PATH, MAIN_TOOL_SKIN_CHECK, trackFunnel } from "../services/funnel";

export const FacialAnalysis: React.FC<{ isPaid?: boolean }> = ({
  isPaid = false,
}) => {
  const { user } = useUser();
  const { openSignIn } = useClerk();
  const [searchParams, setSearchParams] = useSearchParams();
  const [step, setStep] = useState(0);
  // Guards "save the scan this visitor made before signing in" so it only ever happens once.
  const claimingGuestScan = useRef(false);
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
  // Which landmark the editor opens on (non-zero only when resuming a half-finished guest session)
  const [editorStartIndex, setEditorStartIndex] = useState(0);

  // Final Result
  const [finalResult, setFinalResult] = useState<FinalResult | null>(null);

  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);

  // Put a scan made before signing in back on screen (after a reload, or coming back from the sign-in page).
  const restoreGuestScan = (pending: GuestScan) => {
    setFrontPhotoStandardized(pending.photo);
    setFrontLandmarks(pending.landmarks);
    setFrontBox(pending.box);
    if (pending.stage === "edit") {
      setEditorStartIndex(pending.index ?? 0);
      setStep(4); // back to refining landmarks
    } else {
      setFinalResult({
        frontPhotoUrl: pending.photo,
        frontLandmarks: pending.landmarks as FrontLandmarks,
        gender: "unknown",
        race: "unknown",
      });
      setStep(8); // all landmarks confirmed: the sign-in gate (guests) or the results (signed in)
    }
  };

  // The visitor finished mapping every landmark as a guest and has now signed in: save that scan to their
  // account, then show it on the normal results screen (with the usual paid/locked content). We save first so
  // the results screen knows the scan id when it generates and stores the AI report.
  const claimGuestScan = async (pending: GuestScan, userId: string) => {
    const result: FinalResult = {
      frontPhotoUrl: pending.photo,
      frontLandmarks: pending.landmarks as FrontLandmarks,
      gender: "unknown",
      race: "unknown",
    };
    try {
      const metrics = calculateFrontRatios(pending.landmarks as FrontLandmarks);
      const score = metrics.length > 0 ? calculateWeightedTotalScore(metrics) : 0;
      const history = (await getScanHistory(userId)) ?? [];
      setHistoryData(history);

      // same 20-scan limit as a normal upload; over it, they still see their results, just not saved
      const saved = history.length < 20 ? await saveScanResult(result, score, userId) : null;
      if (saved) {
        clearGuestScan();
        const fresh = (await getScanHistory(userId)) ?? [];
        setHistoryData(fresh);
        const scan = fresh.find((s) => s.id === saved.id);
        if (scan) {
          loadFromHistory(scan);
          return;
        }
        setSelectedScanId(saved.id);
      }
    } catch (err) {
      console.error("Could not save the scan made before sign-in:", err);
    }
    setFinalResult(result);
    setStep(8);
  };

  // Initialize MediaPipe  // Load history on mount
  React.useEffect(() => {
    initializeMediaPipe().catch((err) => console.warn("MediaPipe init failed:", err));
    const initHistory = async () => {
      const pending = loadGuestScan();

      if (!user?.id) {
        // Not signed in: carry on where they left off, if they were part-way through a scan.
        if (pending) restoreGuestScan(pending);
        setHistoryLoaded(true);
        return;
      }

      if (pending?.stage === "done") {
        // Signed in with a finished guest scan waiting: that is what they came back to see.
        if (!claimingGuestScan.current) {
          claimingGuestScan.current = true;
          setHistoryLoaded(false);
          await claimGuestScan(pending, user.id);
        }
        setHistoryLoaded(true);
        return;
      }

      if (pending?.stage === "edit") {
        // Signed in part-way through refining landmarks: resume if it was just now, otherwise it is a leftover
        // and their latest saved scan is what they want to see.
        if (Date.now() - pending.savedAt < 2 * 3600 * 1000) {
          restoreGuestScan(pending);
          setHistoryLoaded(true);
          return;
        }
        clearGuestScan();
      }

      if (user?.id && historyData.length === 0) {
        const data = await getScanHistory(user.id);
        if (data && data.length > 0) {
          setHistoryData(data);

          // Auto-load based on URL param
          const params = new URLSearchParams(window.location.search);
          const scanId = params.get("scanId");
          if (scanId) {
            const scan = data.find((s) => s.id === scanId);
            if (scan) {
              loadFromHistory(scan);
              setSelectedScanId(scan.id);
            } else {
              loadFromHistory(data[0]);
              setSelectedScanId(data[0].id);
            }
          } else {
            // Default to latest scan
            loadFromHistory(data[0]);
            setSelectedScanId(data[0].id);
          }
        }
        setHistoryLoaded(true);
      } else {
        setHistoryLoaded(true);
      }
    };
    initHistory();
  }, [user]);

  // Function to refresh history after saving
  const refreshHistory = async () => {
    if (user?.id) {
      const data = await getScanHistory(user.id);
      if (data) {
        setHistoryData(data);

        // SYNC CURRENT VIEW: Update finalResult if we are currently viewing a scan
        if (selectedScanId) {
          const updatedScan = data.find((s) => s.id === selectedScanId);
          if (updatedScan) {
            const updatedResult: FinalResult = {
              gender: updatedScan.gender,
              race: updatedScan.race,
              frontPhotoUrl: updatedScan.front_photo_url,
              frontLandmarks: updatedScan.front_landmarks,
              analysis: updatedScan.analysis,
              skincare_analysis: updatedScan.skincare_analysis,
            };
            setFinalResult(updatedResult);
          }
        }
      }
    }
  };

  // PHASE A: NORMALIZATION PIPELINE
  const handleFrontPhotoUpload = async (
    file: File,
    mode: "full" | "skincare" = "full",
  ) => {
    trackFunnel("photo_submitted", mode === "skincare" ? MAIN_TOOL_SKIN_CHECK : MAIN_TOOL_PATH);
    setLoading(true);
    setError(null);
    try {
      // SECURITY: Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/heic",
      ];
      const allowedExtensions = [
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
        ".heic",
        ".heif",
      ];
      const fileExtension = file.name
        .toLowerCase()
        .substring(file.name.lastIndexOf("."));

      // Check MIME type OR file extension (HEIC files often have incorrect MIME types)
      if (
        !allowedTypes.includes(file.type) &&
        !allowedExtensions.includes(fileExtension)
      ) {
        throw new Error(
          "Invalid file type. Only JPEG, PNG, WebP, and HEIC images are allowed.",
        );
      }

      // SECURITY: Validate file size (20MB max)
      const maxSize = 20 * 1024 * 1024; // 20MB in bytes
      if (file.size > maxSize) {
        throw new Error("File too large. Maximum size is 20MB.");
      }

      // SECURITY: Check scan limit (20 scans max per user)
      if (user?.id) {
        const history = await getScanHistory(user.id);
        if (history && history.length >= 20) {
          throw new Error(
            "You have reached the maximum limit of 20 scans. Please delete old scans to create new ones.",
          );
        }
      }

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
        trackFunnel("analysis_succeeded", mode === "skincare" ? MAIN_TOOL_SKIN_CHECK : MAIN_TOOL_PATH);

        if (mode === "skincare") {
          // SKIP EDITOR: Auto-save and jump to results
          const result: FinalResult = {
            frontPhotoUrl: standardized,
            frontLandmarks: finalLandmarks as FrontLandmarks,
            gender: "unknown",
            race: "unknown",
          };
          setFinalResult(result);
          setStep(8); // Jump to results

          // AUTO-SAVE
          if (user?.id) {
            const metrics = calculateFrontRatios(
              finalLandmarks as FrontLandmarks,
            );
            const score =
              metrics.length > 0 ? calculateWeightedTotalScore(metrics) : 0;

            const savedScan = await saveScanResult(result, score, user.id);
            if (savedScan) {
              setSelectedScanId(savedScan.id);
              // Refresh history to include the new scan
              await refreshHistory();

              setSearchParams((prev) => {
                const newParams = new URLSearchParams(prev);
                newParams.set("tab", "skincare");
                // Ideally set scanId here too if we want to be explicit
                newParams.set("scanId", savedScan.id);
                return newParams;
              });
            }
          }
        } else {
          // Not signed in: keep the photo and landmarks in this browser so a reload or the sign-in redirect doesn't lose them
          if (!user?.id) {
            saveGuestScan({ stage: "edit", photo: standardized, landmarks: finalLandmarks, box: finalBox });
          }
          // Move to editing step
          setEditorStartIndex(0);
          setStep(4);
        }
        setLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      trackFunnel("analysis_failed", mode === "skincare" ? MAIN_TOOL_SKIN_CHECK : MAIN_TOOL_PATH, err instanceof Error ? err.message : undefined);
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

      // Not signed in: park the finished scan in this browser; it is saved to their account once they sign in
      if (!user?.id) {
        saveGuestScan({ stage: "done", photo: frontPhotoStandardized, landmarks: editedLandmarks, box: frontBox });
      }

      // AUTO-SAVE with calculated score
      if (user?.id) {
        const metrics = calculateFrontRatios(editedLandmarks as FrontLandmarks);
        const score =
          metrics.length > 0 ? calculateWeightedTotalScore(metrics) : 0;

        saveScanResult(result, score, user.id).then((savedScan) => {
          if (savedScan) {
            setSelectedScanId(savedScan.id);
            // Refresh history after save
            refreshHistory();

            // Update URL to reflect new scan ID
            setSearchParams((prev) => {
              const newParams = new URLSearchParams(prev);
              newParams.set("scanId", savedScan.id);
              return newParams;
            });
          }
        });
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
      analysis: scan.analysis, // Include cached analysis from DB
      skincare_analysis: scan.skincare_analysis, // Include cached skincare from DB
    };
    setSelectedScanId(scan.id);
    setFinalResult(historyResult);
    setStep(8);
    setSidebarOpen(false); // Close sidebar on mobile selection

    // Update URL without reloading
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.set("scanId", scan.id);
      return newParams;
    });
  };

  const startNewAnalysis = () => {
    clearGuestScan();
    setEditorStartIndex(0);
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
          <div
            className={`
            fixed inset-y-0 left-0 z-50 w-80 bg-[#0A0A0F] transform transition-transform duration-300 ease-in-out md:translate-x-0 md:relative md:block
            ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}
          >
            <div className="absolute top-4 right-4 md:hidden z-10">
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 text-slate-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <AnalysisHistory
              onSelectScan={loadFromHistory}
              onNewScan={startNewAnalysis}
              selectedScanId={selectedScanId || undefined}
              isPaid={isPaid}
              history={historyData}
              onRefresh={refreshHistory}
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
            <span className="font-bold text-white text-sm tracking-tight">
              Facemaxify
            </span>
            <div className="w-10" /> {/* Spacer for balance */}
          </div>
        )}

        <div
          className={`flex-1 relative custom-scrollbar ${step === 4 ? "overflow-hidden" : "overflow-y-auto"}`}
        >
          {/* Main Content Area */}
          {step === 0 && (
            <div className="flex flex-col items-center justify-center p-8 min-h-full">
              <div className="max-w-md w-full bg-slate-900/50 border border-white/5 backdrop-blur-xl rounded-3xl p-10 text-center shadow-2xl">
                <h1 className="text-3xl font-black text-white mb-4 tracking-tight">
                  Facial Analysis
                </h1>
                <p className="text-slate-400 mb-10 font-medium tracking-tight">
                  Upload a front-facing photo to begin your aesthetic journey
                </p>
                {!user && (
                  <p className="text-emerald-300/90 text-xs font-semibold -mt-6 mb-8">
                    No account needed to start. Your photo stays on your device until you sign in.
                  </p>
                )}

                {error && (
                  <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-medium">
                    {error}
                  </div>
                )}

                <div className="flex justify-center w-full">
                  <label className="cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-center text-white font-bold py-4 px-8 rounded-2xl transition-all shadow-lg shadow-indigo-500/10 active:scale-[0.98] min-w-[200px]">
                    <span>
                      {loading ? "Processing..." : "Full Facial Analysis"}
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      disabled={loading}
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleFrontPhotoUpload(e.target.files[0], "full");
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {step === 4 &&
            frontPhotoStandardized &&
            frontLandmarks &&
            frontBox && (
              <div className="h-full">
                <LandmarkEditor
                  photoUrl={frontPhotoStandardized}
                  initialLandmarks={frontLandmarks}
                  faceBox={frontBox}
                  onComplete={handleFrontEditComplete}
                  initialIndex={editorStartIndex}
                  onProgress={
                    user?.id
                      ? undefined
                      : (landmarks, index) =>
                          saveGuestScan({
                            stage: "edit",
                            photo: frontPhotoStandardized,
                            landmarks,
                            box: frontBox,
                            index,
                          })
                  }
                  title="Refine My Landmarks"
                  landmarkType="front"
                />
              </div>
            )}

          {step === 8 && finalResult && !user && (
            <GuestResultsGate
              photo={finalResult.frontPhotoUrl}
              landmarks={finalResult.frontLandmarks as Record<string, Point>}
              onSignIn={() => {
                const redirect = `${window.location.origin}/dashboard/facial-analysis`;
                openSignIn({ forceRedirectUrl: redirect, signUpForceRedirectUrl: redirect });
              }}
              onStartOver={startNewAnalysis}
            />
          )}

          {step === 8 && finalResult && user && (
            <ResultsDashboard
              data={finalResult}
              isPaid={isPaid}
              scanId={selectedScanId || undefined}
              onNewScan={startNewAnalysis}
              scans={historyData}
              onUploadSkincare={(file) =>
                handleFrontPhotoUpload(file, "skincare")
              }
              onRefresh={refreshHistory}
            />
          )}

          {/* Loading Overlay for internal transitions */}
          {loading && step !== 0 && (
            <div className="absolute inset-0 bg-[#050510]/60 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="text-center">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-400 font-bold tracking-wide">
                  Refining Analysis...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

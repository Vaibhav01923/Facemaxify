import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useClerk, useUser } from "@clerk/clerk-react";
import { ArrowLeft, ImagePlus } from "lucide-react";
import { LandmarkEditor } from "../LandmarkEditor";
import { GuestResultsGate } from "../GuestResultsGate";
import { Arrow } from "./DashboardLayout";
import { SECTIONS, sectionByKey } from "./sections";
import { withScan } from "./scanData";
import { clearGuestScan, loadGuestScan, saveGuestScan, type GuestScan } from "../../services/guestScan";
import { detectLandmarksInstant, initializeMediaPipe } from "../../services/mediaPipeService";
import { standardizeImage } from "../../utils/imageProcessing";
import { getScanHistory, saveScanResult } from "../../services/supabase";
import { calculateFrontRatios, calculateWeightedTotalScore } from "../../services/ratioCalculator";
import { MAIN_TOOL_PATH, trackFunnel } from "../../services/funnel";
import type { FinalResult, FrontLandmarks, Point } from "../../types";
import "./dashboard.css";

const MAX_SCANS = 20;
const MAX_BYTES = 20 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic"];
const ALLOWED_EXT = [".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"];

type Step = "upload" | "edit" | "gate";

const readFile = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("We couldn't read that file."));
    reader.readAsDataURL(file);
  });

const scoreOf = (landmarks: Record<string, Point>) => {
  const metrics = calculateFrontRatios(landmarks as unknown as FrontLandmarks);
  return metrics.length ? calculateWeightedTotalScore(metrics) : 0;
};

/**
 * The scan flow: upload a photo, place the landmarks, then land on the report.
 *
 * Open to people who are not signed in: they can upload and map their landmarks, and are asked to sign in (free) only
 * to see the results. That half-finished scan is kept in this browser (services/guestScan.ts) and saved to their
 * account when they come back signed in.
 */
export const ScanFlow: React.FC = () => {
  const { user, isLoaded } = useUser();
  const { openSignIn } = useClerk();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [step, setStep] = useState<Step>("upload");
  const [busy, setBusy] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [landmarks, setLandmarks] = useState<Record<string, Point> | null>(null);
  const [box, setBox] = useState<any>(null);
  const [startIndex, setStartIndex] = useState(0); // non-zero only when resuming a half-finished guest session
  const [pendingSave, setPendingSave] = useState<Record<string, Point> | null>(null); // finished but not saved yet
  const [overLimit, setOverLimit] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const claiming = useRef(false);

  useEffect(() => {
    initializeMediaPipe().catch((err) => console.warn("MediaPipe init failed:", err));
  }, []);

  const finishAndOpen = useCallback(
    async (finalLandmarks: Record<string, Point>, photoUrl: string, userId: string) => {
      setSaving(true);
      setError(null);
      try {
        const result: FinalResult = {
          frontPhotoUrl: photoUrl,
          frontLandmarks: finalLandmarks as unknown as FrontLandmarks,
          gender: "unknown",
          race: "unknown",
        };
        const history = (await getScanHistory(userId)) ?? [];
        if (history.length >= MAX_SCANS) {
          setOverLimit(true);
          setSaving(false);
          return;
        }
        const saved = await saveScanResult(result, scoreOf(finalLandmarks), userId);
        if (!saved) throw new Error("save failed");
        clearGuestScan();
        navigate(withScan(SECTIONS[0].route, saved.id), { replace: true });
      } catch (err) {
        console.error("Could not save the scan:", err);
        setPendingSave(finalLandmarks);
        setSaving(false);
        setError("We couldn't save your scan. Your landmarks are safe on this page, so try again.");
      }
    },
    [navigate],
  );

  // Pick up where they left off: a scan made before signing in, or one still being refined.
  useEffect(() => {
    if (!isLoaded) return;
    const pending = loadGuestScan();

    const restore = (p: GuestScan) => {
      setPhoto(p.photo);
      setLandmarks(p.landmarks);
      setBox(p.box);
      if (p.stage === "edit") {
        setStartIndex(p.index ?? 0);
        setStep("edit");
      } else {
        setStep("gate");
      }
    };

    if (!user?.id) {
      if (pending) restore(pending);
      return;
    }
    if (pending?.stage === "done") {
      // Signed in with a finished guest scan waiting: that is what they came back to see.
      if (!claiming.current) {
        claiming.current = true;
        setPhoto(pending.photo);
        setLandmarks(pending.landmarks);
        finishAndOpen(pending.landmarks, pending.photo, user.id);
      }
      return;
    }
    if (pending?.stage === "edit") {
      // Part-way through refining landmarks: resume if it was just now, otherwise it is a leftover.
      if (Date.now() - pending.savedAt < 2 * 3600 * 1000) restore(pending);
      else clearGuestScan();
    }
  }, [isLoaded, user?.id, finishAndOpen]);

  const handleFile = async (file: File | undefined | null) => {
    if (!file) return;
    trackFunnel("photo_submitted", MAIN_TOOL_PATH);
    setError(null);
    setBusy("Reading your photo…");
    try {
      const ext = file.name.toLowerCase().substring(file.name.lastIndexOf("."));
      // HEIC files often arrive with the wrong MIME type, so the extension counts too
      if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXT.includes(ext)) {
        throw new Error("That file type isn't supported. Use a JPEG, PNG, WebP or HEIC photo.");
      }
      if (file.size > MAX_BYTES) throw new Error("That file is too large. The limit is 20 MB.");

      if (user?.id) {
        const history = await getScanHistory(user.id);
        if (history && history.length >= MAX_SCANS) {
          throw new Error(`You have reached the limit of ${MAX_SCANS} scans. Delete an old scan to create a new one.`);
        }
      }

      const base64 = await readFile(file);
      setBusy("Finding your face…");
      const first = await detectLandmarksInstant(base64, "front");
      setBusy("Straightening and centering…");
      const standardized = await standardizeImage(base64, first.landmarks);
      setBusy("Placing the landmarks…");
      const final = await detectLandmarksInstant(standardized, "front");
      trackFunnel("analysis_succeeded", MAIN_TOOL_PATH);

      setPhoto(standardized);
      setLandmarks(final.landmarks);
      setBox(final.box);
      // Not signed in: keep the photo and landmarks in this browser so a reload or the sign-in redirect doesn't lose them
      if (!user?.id) saveGuestScan({ stage: "edit", photo: standardized, landmarks: final.landmarks, box: final.box });
      setStartIndex(0);
      setStep("edit");
    } catch (err) {
      trackFunnel("analysis_failed", MAIN_TOOL_PATH, err instanceof Error ? err.message : undefined);
      setError(err instanceof Error ? err.message : "We couldn't process that photo.");
    } finally {
      setBusy("");
    }
  };

  const onEditComplete = (edited: Record<string, Point>) => {
    setLandmarks(edited);
    if (!photo) return;
    if (!user?.id) {
      // Park the finished scan in this browser; it is saved to their account once they sign in.
      saveGuestScan({ stage: "done", photo, landmarks: edited, box });
      setStep("gate");
      return;
    }
    finishAndOpen(edited, photo, user.id);
  };

  const startOver = () => {
    clearGuestScan();
    setStep("upload");
    setPhoto(null);
    setLandmarks(null);
    setPendingSave(null);
    setError(null);
    setStartIndex(0);
  };

  // Old links like /dashboard/facial-analysis?scanId=…&tab=skincare now open the matching report.
  const legacyScan = params.get("scanId");
  if (user?.id && legacyScan) {
    const tab = params.get("tab");
    const target = sectionByKey(
      tab === "skincare" ? "skincare" : tab === "style" ? (params.get("style") === "hairstyle" ? "hairstyle" : "color") : "facial",
    ).route;
    return <Navigate to={withScan(target, legacyScan)} replace />;
  }

  const signedIn = !!user?.id;
  const stepNumber = step === "upload" ? 1 : step === "edit" ? 2 : 3;

  return (
    <div className="dash relative">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0"
        style={{ background: "radial-gradient(900px 520px at 88% -8%, rgba(154,168,255,0.07), transparent 60%), radial-gradient(700px 480px at 4% 108%, rgba(154,168,255,0.04), transparent 60%)" }}
      />

      {step === "edit" && photo && landmarks && box ? (
        <div className="fixed inset-0 z-40">
          <LandmarkEditor
            photoUrl={photo}
            initialLandmarks={landmarks}
            faceBox={box}
            onComplete={onEditComplete}
            initialIndex={startIndex}
            onProgress={signedIn ? undefined : (lm, index) => saveGuestScan({ stage: "edit", photo, landmarks: lm, box, index })}
            onExit={startOver}
            title="Place your landmarks"
            landmarkType="front"
          />
        </div>
      ) : (
        <>
          <header className="relative z-10 mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
            {signedIn ? (
              <Link to="/dashboard" className="inline-flex items-center gap-2 text-[13px] font-medium text-[var(--d-t2)] transition-colors hover:text-[var(--d-t1)]">
                <ArrowLeft className="h-4 w-4" strokeWidth={1.5} /> Dashboard
              </Link>
            ) : (
              <a href="/" className="flex items-center gap-2.5">
                <img src="/favicon.png" alt="" className="h-6 w-6 rounded-md" />
                <span className="text-[16px] font-semibold tracking-[-0.03em]">Facemaxify</span>
              </a>
            )}
            <ol className="flex items-center gap-2" aria-label={`Step ${stepNumber} of 3`}>
              {["Upload", "Landmarks", "Results"].map((label, i) => (
                <li key={label} className="flex items-center gap-2">
                  <span className="d-mono text-[11px]" style={{ color: i + 1 === stepNumber ? "var(--d-accent)" : i + 1 < stepNumber ? "var(--d-t2)" : "var(--d-t4)" }}>
                    0{i + 1}
                  </span>
                  <span className="hidden text-[12px] sm:inline" style={{ color: i + 1 === stepNumber ? "var(--d-t1)" : "var(--d-t3)" }}>{label}</span>
                  {i < 2 && <span className="mx-1 h-px w-5 bg-[var(--d-line3)]" />}
                </li>
              ))}
            </ol>
          </header>

          {step === "gate" && photo && landmarks ? (
            <div className="relative z-10 min-h-[calc(100dvh-64px)]">
              <GuestResultsGate
                photo={photo}
                landmarks={landmarks}
                onSignIn={() => {
                  const redirect = `${window.location.origin}/dashboard/facial-analysis`;
                  openSignIn({ forceRedirectUrl: redirect, signUpForceRedirectUrl: redirect });
                }}
                onStartOver={startOver}
              />
            </div>
          ) : overLimit ? (
            <Notice
              title="Your scan limit is full"
              body={`You can keep ${MAX_SCANS} scans. Delete an old one from the dashboard, then come back: this scan is kept on this device.`}
              action={<Link to="/dashboard" className="d-btn d-btn-primary"><span>Go to my scans</span><span className="d-btn-dot"><Arrow /></span></Link>}
            />
          ) : pendingSave && photo && user?.id ? (
            <Notice
              title="We couldn't save your scan"
              body={error ?? "Your landmarks are safe on this page. Try saving again."}
              action={
                <button type="button" className="d-btn d-btn-primary" onClick={() => finishAndOpen(pendingSave, photo, user.id)}>
                  <span>Try again</span>
                  <span className="d-btn-dot"><Arrow /></span>
                </button>
              }
            />
          ) : (
            <main className="relative z-10 mx-auto grid max-w-5xl items-center gap-10 px-5 pb-16 pt-6 lg:min-h-[calc(100dvh-64px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,430px)] lg:gap-16">
              <div>
                <p className="d-eyebrow mb-5">Facial analysis</p>
                <h1 className="d-h1 max-w-[18ch]">Upload a front-facing photo</h1>
                <p className="d-body mt-4 max-w-md">
                  We find your landmarks, you check them, and your face is measured against 25+ ratios. Every other report is built from this same photo.
                </p>
                <ul className="mt-8 space-y-3">
                  {["Face the camera straight on, neutral expression", "Hair off your forehead and ears", "Even light, no heavy filters", "Just you in the frame"].map((t) => (
                    <li key={t} className="flex gap-3 text-[14px] text-[var(--d-t2)]">
                      <span className="mt-[9px] h-px w-3 shrink-0 bg-[var(--d-accent)]" />
                      {t}
                    </li>
                  ))}
                </ul>
                {!signedIn && (
                  <p className="mt-8 max-w-md text-[13px] leading-snug text-[var(--d-t3)]">
                    No account needed to start. Your photo stays on your device until you sign in.
                  </p>
                )}
              </div>

              <div className="d-bezel">
                <div className="d-core p-4">
                  <label
                    className={`relative grid aspect-[4/5] cursor-pointer place-items-center overflow-hidden rounded-2xl border border-dashed text-center transition-colors duration-200 ${
                      dragOver ? "border-[var(--d-accent)] bg-[var(--d-accent-soft)]" : "border-[var(--d-line3)] bg-[var(--d-s2)] hover:border-[var(--d-accent-line)]"
                    } ${busy ? "pointer-events-none" : ""}`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      if (!busy) handleFile(e.dataTransfer.files?.[0]);
                    }}
                  >
                    <input type="file" accept="image/*" className="sr-only" disabled={!!busy} onChange={(e) => handleFile(e.target.files?.[0])} />
                    {busy ? (
                      <div className="px-6" role="status">
                        <div className="relative mx-auto mb-6 h-16 w-16 overflow-hidden rounded-full border border-[var(--d-accent-line)]">
                          <div className="d-scanline !h-full" style={{ animationIterationCount: "infinite", animationDelay: "0s" }} />
                        </div>
                        <p className="text-[15px] font-medium">{busy}</p>
                        <p className="d-body mt-1 text-[13px]">The first run downloads the face model, about 4 MB.</p>
                      </div>
                    ) : (
                      <div className="px-8">
                        <span className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-xl border border-[var(--d-line2)] bg-[var(--d-s3)] text-[var(--d-accent)]">
                          <ImagePlus className="h-5 w-5" strokeWidth={1.5} />
                        </span>
                        <p className="text-[15px] font-medium">Drop a photo here</p>
                        <p className="d-body mt-1 text-[13px]">or choose one from your device</p>
                        <span className="d-btn d-btn-primary mt-6 pointer-events-none">
                          <span>Choose a photo</span>
                          <span className="d-btn-dot"><Arrow /></span>
                        </span>
                        <p className="d-mono mt-5 text-[10.5px] uppercase tracking-[0.1em] text-[var(--d-t4)]">JPEG · PNG · WebP · HEIC · up to 20 MB</p>
                      </div>
                    )}
                  </label>
                  {error && (
                    <div role="alert" className="mt-4 rounded-xl border border-[rgba(252,165,165,0.3)] bg-[rgba(252,165,165,0.08)] px-4 py-3 text-[13px] leading-snug text-[#fca5a5]">
                      {error}
                    </div>
                  )}
                </div>
              </div>
            </main>
          )}
        </>
      )}

      {saving && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[var(--d-bg)]" role="status">
          <div className="text-center">
            <div className="relative mx-auto mb-6 h-14 w-14 overflow-hidden rounded-full border border-[var(--d-accent-line)]">
              <div className="d-scanline !h-full" style={{ animationIterationCount: "infinite", animationDelay: "0s" }} />
            </div>
            <p className="text-[15px] font-medium">Saving your scan…</p>
            <p className="d-body mt-1 text-[13px]">Opening your report in a moment.</p>
          </div>
        </div>
      )}
    </div>
  );
};

const Notice: React.FC<{ title: string; body: string; action: React.ReactNode }> = ({ title, body, action }) => (
  <main className="relative z-10 mx-auto grid min-h-[calc(100dvh-64px)] max-w-md place-items-center px-5 text-center">
    <div>
      <h1 className="d-h2">{title}</h1>
      <p className="d-body mt-3">{body}</p>
      <div className="mt-7 flex justify-center">{action}</div>
    </div>
  </main>
);

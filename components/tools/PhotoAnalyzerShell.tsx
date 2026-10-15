import React, { useState, useRef } from "react";
import { FaceMesh } from "@mediapipe/face_mesh";
import { useUser, useClerk } from "@clerk/clerk-react";
import { Upload, Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { trackFunnel } from "../../services/funnel";
import { rememberFullReportClick } from "../../services/attribution";
import type { ShellStrings } from "../../i18n/types";

/** The analysed photo and its MediaPipe landmarks, for tools that draw on top of the result. */
export interface PhotoContext {
  image: string;
  landmarks: any[];
}

/** Width and height of the analysed photo, in pixels. */
export interface ImageSize {
  width: number;
  height: number;
}

interface Props {
  // MediaPipe's landmark x and y are fractions of the photo's width and height separately, so a
  // calculation that mixes the two axes needs the photo's size to correct for its shape.
  onAnalyze: (landmarks: any[], size: ImageSize) => any;
  renderResults: (result: any, reset: () => void, context: PhotoContext) => React.ReactNode;
  analyzeLabel?: string;
  uploadHint?: string;
  // Text for translated pages (see i18n/strings.tsx). English pages leave this out.
  strings?: Partial<ShellStrings>;
  // What the "full report" button does. Translated pages pass the sign-in flow that keeps their
  // language (components/i18n/useFullReport.ts); English pages use the default below.
  onFullReport?: () => void;
}

const ENGLISH_STRINGS: ShellStrings = {
  uploadTitle: "Upload a front-facing photo",
  uploadHint: "JPG, PNG or WEBP · Max 10MB · Front-facing, no tilt",
  uploadedAlt: "uploaded",
  analyzing: "Analyzing...",
  notAnImage: "Please upload an image file.",
  tooLarge: "Image must be under 10MB.",
  noFace: "No face detected. Please use a clear front-facing photo.",
  failed: "Analysis failed. Please try a different photo.",
  ctaTitle: "Want the most accurate analysis?",
  ctaBody: (
    <>
      Upload your photo to the full Facemaxify report: <span className="text-slate-200">20+ facial ratios</span> like jaw angle, jaw width and facial width-to-height ratio, plus your overall <span className="text-slate-200">facial attractiveness score</span>.
    </>
  ),
  ctaButton: "Get my full report",
  another: "← Analyze another photo",
};

export const PhotoAnalyzerShell: React.FC<Props> = ({
  onAnalyze,
  renderResults,
  analyzeLabel = "Analyze Photo",
  uploadHint,
  strings,
  onFullReport,
}) => {
  const t: ShellStrings = { ...ENGLISH_STRINGS, ...strings };
  const { isSignedIn } = useUser();
  const { openSignIn } = useClerk();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [landmarks, setLandmarks] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError(t.notAnImage); return; }
    if (file.size > 10 * 1024 * 1024) { setError(t.tooLarge); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setSelectedImage(ev.target?.result as string);
      setResult(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const runAnalysis = async () => {
    if (!selectedImage) return;
    trackFunnel("photo_submitted");
    setIsAnalyzing(true);
    setError(null);
    try {
      const faceMesh = new FaceMesh({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      });
      faceMesh.setOptions({ maxNumFaces: 1, refineLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
      const imgEl = new Image();
      imgEl.src = selectedImage;
      await new Promise<void>((resolve) => { imgEl.onload = () => resolve(); });
      await new Promise<void>((resolve, reject) => {
        faceMesh.onResults((results) => {
          if (!results.multiFaceLandmarks?.[0]) {
            reject(new Error(t.noFace));
            return;
          }
          try {
            const size = { width: imgEl.naturalWidth || imgEl.width, height: imgEl.naturalHeight || imgEl.height };
            const res = onAnalyze(results.multiFaceLandmarks[0], size);
            setLandmarks(results.multiFaceLandmarks[0]);
            setResult(res);
            resolve();
          } catch (calcErr: any) {
            reject(calcErr);
          }
        });
        faceMesh.send({ image: imgEl }).catch(reject);
      });
      trackFunnel("analysis_succeeded");
    } catch (err: any) {
      trackFunnel("analysis_failed", undefined, err?.message);
      setError(err.message || t.failed);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => { setResult(null); setLandmarks([]); setSelectedImage(null); setError(null); };

  const goFull = () => {
    if (onFullReport) { onFullReport(); return; }
    rememberFullReportClick();
    if (isSignedIn) { window.location.href = "/dashboard/facial-analysis"; return; }
    localStorage.setItem("pendingAction", "dashboard");
    openSignIn();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {!result ? (
        <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-8">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-white/20 rounded-2xl p-10 text-center cursor-pointer hover:border-indigo-500/60 hover:bg-indigo-500/5 transition-all"
          >
            {selectedImage ? (
              <img src={selectedImage} alt={t.uploadedAlt} className="max-h-64 mx-auto rounded-xl object-contain" />
            ) : (
              <>
                <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-300 font-medium mb-1">{t.uploadTitle}</p>
                <p className="text-slate-500 text-sm">{uploadHint ?? t.uploadHint}</p>
              </>
            )}
            <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
          </div>
          {error && (
            <div className="mt-4 flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}
          {selectedImage && (
            <button
              onClick={runAnalysis}
              disabled={isAnalyzing}
              className="mt-5 w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
            >
              {isAnalyzing ? <><Loader2 className="w-5 h-5 animate-spin" /> {t.analyzing}</> : analyzeLabel}
            </button>
          )}
          {t.footnote && <p className="mt-4 text-center text-xs text-slate-500">{t.footnote}</p>}
        </div>
      ) : (
        <div className="space-y-6">
          {renderResults(result, reset, { image: selectedImage ?? "", landmarks })}
          <div className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 rounded-3xl p-6 flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1">
              <h3 className="text-white font-bold text-lg mb-1">{t.ctaTitle}</h3>
              <p className="text-slate-400 text-sm">{t.ctaBody}</p>
            </div>
            <button onClick={goFull} className="shrink-0 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl font-bold transition-all whitespace-nowrap">
              {t.ctaButton} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <button onClick={reset} className="text-slate-500 hover:text-slate-300 text-sm transition-colors">{t.another}</button>
        </div>
      )}
    </div>
  );
};

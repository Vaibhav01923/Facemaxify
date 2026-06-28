import React, { useState, useRef } from "react";
import { FaceMesh } from "@mediapipe/face_mesh";
import { useUser, useClerk } from "@clerk/clerk-react";
import { Upload, Loader2, AlertCircle, ArrowRight } from "lucide-react";

interface Props {
  onAnalyze: (landmarks: any[]) => any;
  renderResults: (result: any, reset: () => void) => React.ReactNode;
  analyzeLabel?: string;
  uploadHint?: string;
}

export const PhotoAnalyzerShell: React.FC<Props> = ({
  onAnalyze,
  renderResults,
  analyzeLabel = "Analyze Photo",
  uploadHint = "JPG, PNG or WEBP · Max 10MB · Front-facing, no tilt",
}) => {
  const { isSignedIn } = useUser();
  const { openSignIn } = useClerk();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please upload an image file."); return; }
    if (file.size > 10 * 1024 * 1024) { setError("Image must be under 10MB."); return; }
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
            reject(new Error("No face detected. Please use a clear front-facing photo."));
            return;
          }
          try {
            const res = onAnalyze(results.multiFaceLandmarks[0]);
            setResult(res);
            resolve();
          } catch (calcErr: any) {
            reject(calcErr);
          }
        });
        faceMesh.send({ image: imgEl }).catch(reject);
      });
    } catch (err: any) {
      setError(err.message || "Analysis failed. Please try a different photo.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => { setResult(null); setSelectedImage(null); setError(null); };

  const goFull = () => {
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
              <img src={selectedImage} alt="uploaded" className="max-h-64 mx-auto rounded-xl object-contain" />
            ) : (
              <>
                <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-300 font-medium mb-1">Upload a front-facing photo</p>
                <p className="text-slate-500 text-sm">{uploadHint}</p>
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
              {isAnalyzing ? <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing...</> : analyzeLabel}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {renderResults(result, reset)}
          <div className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 rounded-3xl p-6 flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1">
              <h3 className="text-white font-bold text-lg mb-1">Get Your Full Facial Analysis</h3>
              <p className="text-slate-400 text-sm">This is one metric. The complete Facemaxify report covers 15+ ratios — symmetry, golden ratio, canthal tilt, jawline score, color analysis, hairstyle recommendations, and a personalised improvement plan.</p>
            </div>
            <button onClick={goFull} className="shrink-0 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl font-bold transition-all whitespace-nowrap">
              Full Report <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <button onClick={reset} className="text-slate-500 hover:text-slate-300 text-sm transition-colors">← Analyze another photo</button>
        </div>
      )}
    </div>
  );
};

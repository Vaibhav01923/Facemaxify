import React, { useState, useRef } from "react";
import { FaceMesh } from "@mediapipe/face_mesh";
import { useUser, useClerk } from "@clerk/clerk-react";
import { Upload, Loader2, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";
import { calculateFaceSymmetry, FaceSymmetryResult } from "../../utils/faceSymmetryCalculator";

export const FaceSymmetryAnalyzer: React.FC = () => {
  const { isSignedIn } = useUser();
  const { openSignIn } = useClerk();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<FaceSymmetryResult | null>(null);
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

  const analyzeImage = async () => {
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
            reject(new Error("No face detected. Please use a clear, front-facing photo."));
            return;
          }
          const landmarks = results.multiFaceLandmarks[0];
          const res = calculateFaceSymmetry(landmarks);
          setResult(res);
          resolve();
        });
        faceMesh.send({ image: imgEl }).catch(reject);
      });
    } catch (err: any) {
      setError(err.message || "Analysis failed. Please try a different photo.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const goFullAnalysis = () => {
    if (isSignedIn) { window.location.href = "/dashboard/facial-analysis"; return; }
    localStorage.setItem("pendingAction", "dashboard");
    openSignIn();
  };

  const scoreColor = (s: number) => s >= 90 ? "text-emerald-400" : s >= 78 ? "text-indigo-400" : s >= 65 ? "text-amber-400" : "text-red-400";
  const scoreRing = (s: number) => s >= 90 ? "border-emerald-500" : s >= 78 ? "border-indigo-500" : s >= 65 ? "border-amber-500" : "border-red-500";

  return (
    <div className="bg-[#050510] min-h-screen text-white">
      <div className="max-w-4xl mx-auto px-4 py-12">

        {/* Upload Area */}
        <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-8 mb-8">
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
                <p className="text-slate-500 text-sm">JPG, PNG or WEBP · Max 10MB · No tilt, even lighting</p>
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

          {selectedImage && !result && (
            <button
              onClick={analyzeImage}
              disabled={isAnalyzing}
              className="mt-5 w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
            >
              {isAnalyzing ? <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing Symmetry...</> : "Analyze Face Symmetry"}
            </button>
          )}
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-6 animate-fadeIn">
            {/* Score Card */}
            <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-8 flex flex-col sm:flex-row items-center gap-8">
              <div className={`w-36 h-36 rounded-full border-4 ${scoreRing(result.score)} flex flex-col items-center justify-center shrink-0`}>
                <span className={`text-5xl font-black ${scoreColor(result.score)}`}>{result.score}</span>
                <span className="text-xs text-slate-400 font-medium">/100</span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-indigo-400" />
                  <span className="text-indigo-400 text-sm font-bold uppercase tracking-wider">{result.classification}</span>
                </div>
                <p className="text-slate-300 leading-relaxed">{result.review}</p>
                <div className="mt-4 flex gap-4 text-sm">
                  <div><span className="text-slate-500">Best feature: </span><span className="text-emerald-400 font-medium">{result.strongestFeature}</span></div>
                  <div><span className="text-slate-500">Lowest: </span><span className="text-amber-400 font-medium">{result.weakestFeature}</span></div>
                </div>
              </div>
            </div>

            {/* Per-zone breakdown */}
            <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6">
              <h3 className="text-white font-bold mb-5 text-lg">Zone-by-Zone Symmetry Breakdown</h3>
              <div className="space-y-3">
                {result.pairs.map((pair) => {
                  const pct = Math.round(pair.ratio * 100);
                  const barColor = pct >= 95 ? "bg-emerald-500" : pct >= 85 ? "bg-indigo-500" : pct >= 75 ? "bg-amber-500" : "bg-red-500";
                  return (
                    <div key={pair.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-300">{pair.name}</span>
                        <span className={pct >= 95 ? "text-emerald-400" : pct >= 85 ? "text-indigo-400" : pct >= 75 ? "text-amber-400" : "text-red-400"}>
                          {pct}%
                        </span>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full ${barColor} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Upsell */}
            <div className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 rounded-3xl p-6 flex flex-col sm:flex-row items-center gap-4">
              <div className="flex-1">
                <h3 className="text-white font-bold text-lg mb-1">Get Your Full Facial Analysis</h3>
                <p className="text-slate-400 text-sm">Symmetry is just one metric. The full report covers 15+ ratios including golden ratio, canthal tilt, facial thirds, jawline score, and a personalised improvement plan.</p>
              </div>
              <button
                onClick={goFullAnalysis}
                className="shrink-0 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl font-bold transition-all whitespace-nowrap"
              >
                Full Report <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <button onClick={() => { setResult(null); setSelectedImage(null); }} className="text-slate-500 hover:text-slate-300 text-sm transition-colors">
              ← Analyze another photo
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

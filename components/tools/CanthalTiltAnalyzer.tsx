import React, { useState, useRef, useEffect } from "react";
import { FaceMesh } from "@mediapipe/face_mesh";
import { useUser, useClerk } from "@clerk/clerk-react";
import { Upload, Loader2, CheckCircle, AlertCircle, Info } from "lucide-react";
import {
  calculateCanthalTilt,
  type CanthalTiltResult,
} from "../../utils/canthalTiltCalculator";

export const CanthalTiltAnalyzer: React.FC = () => {
  const { isSignedIn } = useUser();
  const { openSignIn } = useClerk();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<CanthalTiltResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Image size must be less than 10MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
      setResult(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const drawGuidelines = (landmarks: any[]) => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedImage) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.src = selectedImage;
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      setImageDimensions({ width: img.width, height: img.height });

      ctx.drawImage(img, 0, 0);

      const getPt = (idx: number) => ({
        x: landmarks[idx].x * canvas.width,
        y: landmarks[idx].y * canvas.height,
      });

      // Eye landmarks
      const leftInner = getPt(133);
      const leftOuter = getPt(33);
      const rightInner = getPt(362);
      const rightOuter = getPt(263);

      // Draw horizontal reference lines (cyan)
      ctx.strokeStyle = "rgba(6, 182, 212, 0.6)"; // Cyan-500
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 2;

      // Left eye horizontal
      ctx.beginPath();
      ctx.moveTo(leftOuter.x - 30, leftInner.y);
      ctx.lineTo(leftInner.x + 30, leftInner.y);
      ctx.stroke();

      // Right eye horizontal
      ctx.beginPath();
      ctx.moveTo(rightInner.x - 30, rightInner.y);
      ctx.lineTo(rightOuter.x + 30, rightInner.y);
      ctx.stroke();

      // Reset dashed line
      ctx.setLineDash([]);

      // Draw tilt lines (indigo)
      ctx.strokeStyle = "#4f46e5"; // Indigo-600
      ctx.lineWidth = 3;

      // Left eye tilt
      ctx.beginPath();
      ctx.moveTo(leftOuter.x, leftOuter.y);
      ctx.lineTo(leftInner.x, leftInner.y);
      ctx.stroke();

      // Right eye tilt
      ctx.beginPath();
      ctx.moveTo(rightInner.x, rightInner.y);
      ctx.lineTo(rightOuter.x, rightOuter.y);
      ctx.stroke();

      // Draw nodes
      ctx.fillStyle = "#ffffff";
      [leftInner, leftOuter, rightInner, rightOuter].forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    };
  };

  const analyzeFace = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const img = new Image();
      img.src = selectedImage;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const faceMesh = new FaceMesh({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      });

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
      });

      await new Promise<void>((resolve, reject) => {
        faceMesh.onResults((results) => {
          if (
            !results.multiFaceLandmarks ||
            results.multiFaceLandmarks.length === 0
          ) {
            reject(new Error("No face detected. Please try a clearer photo."));
            return;
          }

          try {
            const landmarks = results.multiFaceLandmarks[0];
            const tiltResult = calculateCanthalTilt(landmarks);
            setResult(tiltResult);
            drawGuidelines(landmarks);
            resolve();
          } catch (err) {
            reject(err);
          }
        });

        faceMesh.send({ image: img });
      });

      faceMesh.close();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Analysis failed.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050510] relative overflow-hidden text-white selection:bg-indigo-500/30">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            Canthal Tilt Tool
          </div>

          <h1 className="text-4xl sm:text-6xl font-black mb-6 tracking-tight">
            Canthal{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-indigo-400 to-purple-400">
              Tilt
            </span>{" "}
            Analyzer
          </h1>

          <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Measure the precise angle of your eyes to determine if you have a
            positive, neutral, or negative canthal tilt using advanced AI
            landmarking.
          </p>
        </div>

        {/* Main Interface */}
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Left Column: Upload / Image */}
          <div className="space-y-6">
            {!selectedImage ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="group cursor-pointer bg-slate-900/50 border-2 border-dashed border-slate-700 rounded-3xl p-12 text-center hover:border-indigo-500/50 transition-all duration-300 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div className="relative z-10 flex flex-col items-center gap-6">
                  <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-xl shadow-black/20">
                    <Upload className="w-8 h-8 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">
                      Upload Photo
                    </h3>
                    <p className="text-slate-400">
                      Front-facing, no glasses for best accuracy
                    </p>
                  </div>
                  <div className="px-6 py-3 bg-white text-black font-bold rounded-xl group-hover:bg-indigo-400 transition-colors">
                    Select Image
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                {/* Canvas for overlays */}
                <canvas
                  ref={canvasRef}
                  className={`absolute top-0 left-0 w-full h-full object-contain pointer-events-none z-10 ${!result ? "hidden" : ""}`}
                />

                {/* Original Image */}
                <img
                  src={selectedImage}
                  alt="Analysis Subject"
                  className="w-full h-auto object-contain max-h-[600px] bg-black/50"
                  style={{ opacity: result ? 0.4 : 1 }} // Dim image when showing results
                />

                {/* Reset Button */}
                <button
                  onClick={() => {
                    setSelectedImage(null);
                    setResult(null);
                  }}
                  className="absolute top-4 right-4 z-20 p-2 bg-black/50 backdrop-blur-md text-white rounded-full hover:bg-red-500/80 transition-colors"
                  title="Remove Image"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            {/* Analyze Button */}
            {selectedImage && !result && (
              <button
                onClick={analyzeFace}
                disabled={isAnalyzing}
                className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white font-bold text-lg rounded-2xl shadow-lg shadow-indigo-500/20 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Measuring Tilt...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Analyze Eye Tilt
                  </>
                )}
              </button>
            )}
          </div>

          {/* Right Column: Results */}
          <div className="space-y-6">
            {!result ? (
              <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 text-center h-full flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-24 h-24 bg-slate-800/50 rounded-full flex items-center justify-center mb-6 text-4xl grayscale opacity-50">
                  👁️
                </div>
                <h3 className="text-2xl font-bold text-slate-300 mb-2">
                  Ready to Calculate
                </h3>
                <p className="text-slate-500 max-w-sm">
                  Upload your photo to discover your precise canthal tilt angle
                  and what it means for your facial aesthetics.
                </p>
              </div>
            ) : (
              <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700 fade-in">
                {/* Score Card */}
                <div className="bg-gradient-to-b from-slate-800 to-slate-900 border border-indigo-500/30 rounded-3xl p-8 text-center relative overflow-hidden">
                  <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>

                  <p className="text-slate-400 font-medium tracking-widest text-sm uppercase mb-4">
                    Your Canthal Tilt Is
                  </p>

                  <div className="mb-4">
                    <span className="text-5xl font-black text-white px-6 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl inline-block shadow-lg shadow-indigo-500/10">
                      {result.classification}
                    </span>
                  </div>

                  <div className="flex justify-center items-center gap-2 mt-6 p-4 bg-slate-800/50 rounded-xl max-w-xs mx-auto">
                    <span className="font-mono text-3xl font-bold text-indigo-400">
                      {result.angle > 0 ? "+" : ""}
                      {result.angle}°
                    </span>
                    <span className="text-sm text-slate-400 uppercase tracking-widest">
                      Degrees
                    </span>
                  </div>

                  <p className="mt-6 text-lg text-slate-300 italic">
                    "{result.review}"
                  </p>
                </div>

                {/* Visual Guide Breakdown */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden p-6 py-8">
                  <h3 className="font-bold text-white flex items-center gap-2 mb-6">
                    <Info className="w-4 h-4 text-indigo-400" />
                    What does this mean?
                  </h3>

                  <div className="space-y-6">
                    <div
                      className={`p-4 rounded-xl border ${result.classification === "Positive" ? "bg-indigo-500/10 border-indigo-500/30" : "bg-slate-800/30 border-slate-700"}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-indigo-300 transform -rotate-12">
                          +°
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-200">
                            Positive Tilt
                          </h4>
                          <p className="text-xs text-slate-400">
                            Outer corner is higher than inner corner. Creates a
                            "feline" or "hunter" eye appearance.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`p-4 rounded-xl border ${result.classification === "Neutral" ? "bg-indigo-500/10 border-indigo-500/30" : "bg-slate-800/30 border-slate-700"}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-300">
                          0°
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-200">
                            Neutral Tilt
                          </h4>
                          <p className="text-xs text-slate-400">
                            Outer and inner corners fall on the same horizontal
                            line. Balanced and harmonious.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`p-4 rounded-xl border ${result.classification === "Negative" ? "bg-indigo-500/10 border-indigo-500/30" : "bg-slate-800/30 border-slate-700"}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-pink-300 transform rotate-12">
                          -°
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-200">
                            Negative Tilt
                          </h4>
                          <p className="text-xs text-slate-400">
                            Outer corner is lower than the inner corner.
                            Associated with a gentle, expressive look.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Accuracy Disclaimer & Upsell CTA */}
                <div className="mt-8 p-6 bg-slate-800/50 border border-slate-700 rounded-2xl text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500/0 via-indigo-500/50 to-indigo-500/0"></div>
                  <h4 className="font-bold text-white mb-2 text-xl">
                    Want an accurate analysis of your facial attractiveness?
                  </h4>
                  <p className="text-slate-300 text-base mb-6 leading-relaxed max-w-lg mx-auto">
                    Get a comprehensive analysis of all your facial features,
                    symmetry, and potential from our most accurate tool here.
                  </p>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      if (!isSignedIn) {
                        openSignIn({
                          forceRedirectUrl:
                            "https://facemaxify.com/dashboard/facial-analysis",
                        });
                      } else {
                        window.location.href =
                          "https://facemaxify.com/dashboard/facial-analysis";
                      }
                    }}
                    className="inline-block w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg shadow-indigo-500/20"
                  >
                    Get Full Facial Analysis
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

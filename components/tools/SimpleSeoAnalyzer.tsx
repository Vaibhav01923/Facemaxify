import React, { useMemo, useRef, useState } from "react";
import { FaceMesh } from "@mediapipe/face_mesh";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ImagePlus,
  Loader2,
  Sparkles,
} from "lucide-react";
import { SeoLandingPageConfig } from "../../data/seoLandingPages";
import { calculateCanthalTilt } from "../../utils/canthalTiltCalculator";
import { calculateGoldenRatio } from "../../utils/goldenRatioCalculator";

interface SimpleSeoAnalyzerProps {
  page: SeoLandingPageConfig;
  onOpenFullAnalysis: () => void;
}

type AnalysisResult = {
  score: number;
  label: string;
  summary: string;
  metrics: Array<{
    label: string;
    value: string;
  }>;
};

const getDistance = (p1: any, p2: any) => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
};

const getMidpoint = (p1: any, p2: any) => ({
  x: (p1.x + p2.x) / 2,
  y: (p1.y + p2.y) / 2,
});

const getAsymmetryPercent = (left: number, right: number) => {
  const max = Math.max(left, right, 0.0001);
  return (Math.abs(left - right) / max) * 100;
};

const clampScore = (value: number) => Math.max(35, Math.min(94, Math.round(value)));

const buildResult = (page: SeoLandingPageConfig, landmarks: any[]): AnalysisResult => {
  const faceWidth = getDistance(landmarks[234], landmarks[454]);
  const faceHeight = getDistance(landmarks[10], landmarks[152]);
  const leftEyeWidth = getDistance(landmarks[33], landmarks[133]);
  const rightEyeWidth = getDistance(landmarks[362], landmarks[263]);
  const eyeBalance = 100 - getAsymmetryPercent(leftEyeWidth, rightEyeWidth) * 3.2;
  const mouthWidth = getDistance(landmarks[61], landmarks[291]);
  const noseWidth = getDistance(landmarks[102], landmarks[331]);
  const faceRatio = faceHeight / faceWidth;
  const mouthToNose = mouthWidth / noseWidth;
  const noseToChin = getDistance(landmarks[2], landmarks[152]);
  const lipToChin = getDistance(landmarks[17], landmarks[152]);
  const lowerThird = noseToChin / lipToChin;
  const leftFaceHalf = getDistance(landmarks[234], landmarks[2]);
  const rightFaceHalf = getDistance(landmarks[2], landmarks[454]);
  const sideBalance = 100 - getAsymmetryPercent(leftFaceHalf, rightFaceHalf) * 2.5;
  const eyeLine = calculateCanthalTilt(landmarks);
  const golden = calculateGoldenRatio(landmarks);
  const faceCenter = getMidpoint(landmarks[234], landmarks[454]);
  const noseOffset = Math.abs(landmarks[2].x - faceCenter.x) / faceWidth;
  const noseCenterScore = 100 - noseOffset * 400;

  if (page.slug === "facial-harmony-analyzer") {
    const score = clampScore(
      golden.score * 0.4 + eyeBalance * 0.2 + sideBalance * 0.2 + noseCenterScore * 0.2,
    );
    const label =
      score >= 78 ? "Strong harmony preview" : score >= 60 ? "Balanced overall" : "Mixed harmony signals";

    return {
      score,
      label,
      summary:
        "This quick preview blends facial balance, eye symmetry, centering, and proportion checks. The full report goes deeper with a much larger set of ratios.",
      metrics: [
        { label: "Overall balance", value: `${Math.round(sideBalance)}/100` },
        { label: "Eye symmetry", value: `${Math.round(eyeBalance)}/100` },
        { label: "Golden-ratio fit", value: `${golden.score}/100` },
      ],
    };
  }

  if (page.slug === "facial-harmony-score") {
    const score = clampScore(golden.score * 0.5 + eyeBalance * 0.15 + sideBalance * 0.15 + noseCenterScore * 0.2);
    const label =
      score >= 78 ? "High preview score" : score >= 60 ? "Solid preview score" : "Early estimate only";

    return {
      score,
      label,
      summary:
        "This is a rough visual estimate from a few landmark relationships, not your full proprietary harmony score.",
      metrics: [
        { label: "Preview score", value: `${score}/100` },
        { label: "Proportion fit", value: `${golden.score}/100` },
        { label: "Face centering", value: `${Math.round(noseCenterScore)}/100` },
      ],
    };
  }

  if (page.slug === "face-ratio-analyzer") {
    const ratioBalance = clampScore(
      100 - Math.abs(faceRatio - 1.45) * 90 - Math.abs(mouthToNose - 1.62) * 35 - Math.abs(lowerThird - 1.62) * 30,
    );
    const label =
      ratioBalance >= 78 ? "Ratios look strong" : ratioBalance >= 60 ? "Ratios look decent" : "Ratios look mixed";

    return {
      score: ratioBalance,
      label,
      summary:
        "This mini analyzer checks a few visible proportion relationships. The main analysis covers many more ratio pairs and explains them in detail.",
      metrics: [
        { label: "Face ratio", value: faceRatio.toFixed(2) },
        { label: "Mouth / nose", value: mouthToNose.toFixed(2) },
        { label: "Lower third", value: lowerThird.toFixed(2) },
      ],
    };
  }

  if (page.slug === "face-symmetry-test") {
    const symmetryScore = clampScore(eyeBalance * 0.35 + sideBalance * 0.35 + noseCenterScore * 0.3);
    const label =
      symmetryScore >= 78 ? "Strong symmetry" : symmetryScore >= 60 ? "Moderate symmetry" : "Visible asymmetry";

    return {
      score: symmetryScore,
      label,
      summary:
        "This preview estimates left-right balance across the eye area, facial halves, and nose centering.",
      metrics: [
        { label: "Symmetry score", value: `${symmetryScore}/100` },
        { label: "Eye balance", value: `${Math.round(eyeBalance)}/100` },
        { label: "Nose centering", value: `${Math.round(noseCenterScore)}/100` },
      ],
    };
  }

  const looksScore = clampScore(golden.score * 0.35 + eyeBalance * 0.2 + sideBalance * 0.2 + eyeLine.score * 0.25);
  const label =
    looksScore >= 78 ? "Strong first-impression read" : looksScore >= 60 ? "Good baseline" : "Needs deeper analysis";

  return {
    score: looksScore,
    label,
    summary:
      "This quick looksmax preview combines proportion fit, symmetry, and eye-area structure for a basic first-pass result.",
    metrics: [
      { label: "Preview score", value: `${looksScore}/100` },
      { label: "Eye-area tilt", value: `${eyeLine.angle.toFixed(1)}°` },
      { label: "Proportion fit", value: `${golden.score}/100` },
    ],
  };
};

export const SimpleSeoAnalyzer: React.FC<SimpleSeoAnalyzerProps> = ({
  page,
  onOpenFullAnalysis,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const resultTone = useMemo(() => {
    if (!result) return "from-sky-300 to-cyan-300";
    if (result.score >= 78) return "from-emerald-300 to-cyan-300";
    if (result.score >= 60) return "from-amber-300 to-yellow-300";
    return "from-rose-300 to-orange-300";
  }, [result]);

  const analyzeFace = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

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
        minTrackingConfidence: 0.5,
      });

      await new Promise<void>((resolve, reject) => {
        faceMesh.onResults((results) => {
          if (!results.multiFaceLandmarks?.length) {
            reject(new Error("No face detected. Try a clearer, front-facing photo."));
            return;
          }

          try {
            const landmarks = results.multiFaceLandmarks[0];
            setResult(buildResult(page, landmarks));
            resolve();
          } catch (analysisError) {
            reject(analysisError);
          }
        });

        faceMesh.send({ image: img });
      });

      faceMesh.close();
    } catch (analysisError: any) {
      setError(analysisError.message || "Analysis failed. Please try another photo.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="rounded-[32px] border border-white/10 bg-slate-950/75 p-6 shadow-2xl shadow-black/20 lg:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-400/10 text-sky-300">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white sm:text-3xl">{page.quickTool.title}</h2>
            <p className="mt-1 text-sm text-slate-400">{page.quickTool.description}</p>
          </div>
        </div>

        {!selectedImage ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="group cursor-pointer rounded-[28px] border-2 border-dashed border-white/12 bg-white/[0.03] p-10 text-center transition hover:border-sky-400/35 hover:bg-white/[0.05]"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                if (!file.type.startsWith("image/")) {
                  setError("Please upload an image file.");
                  return;
                }
                const reader = new FileReader();
                reader.onload = (loadEvent) => {
                  setSelectedImage(loadEvent.target?.result as string);
                  setResult(null);
                  setError(null);
                };
                reader.readAsDataURL(file);
              }}
            />

            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-sky-400/10 text-sky-300">
              <ImagePlus className="h-9 w-9" />
            </div>
            <h3 className="mt-5 text-2xl font-bold text-white">Upload your photo</h3>
            <p className="mx-auto mt-3 max-w-md text-slate-400">
              Use a clear, front-facing photo. We run a lightweight landmark pass here, then point users to the full Facemaxify analysis for the serious breakdown.
            </p>
            <div className="mt-6 inline-flex rounded-full bg-white px-5 py-3 font-semibold text-slate-950 transition group-hover:bg-sky-100">
              Select photo
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="overflow-hidden rounded-[28px] border border-white/8 bg-black/30">
              <img
                src={selectedImage}
                alt="Uploaded face"
                className="max-h-[480px] w-full object-contain"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => {
                  setSelectedImage(null);
                  setResult(null);
                  setError(null);
                }}
                className="rounded-full border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                Choose another photo
              </button>
              <button
                onClick={analyzeFace}
                disabled={isAnalyzing}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    Analyze photo
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-100">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div className="overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/75 shadow-2xl shadow-black/20">
          <div className="border-b border-white/8 px-5 py-4">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Detailed analysis preview
            </div>
            <h3 className="mt-2 text-2xl font-black text-white">See the full report style</h3>
          </div>
          <div className="p-4">
            <a
              href="https://facemaxify.com/dashboard/facial-analysis"
              className="group block overflow-hidden rounded-[24px] border border-white/8 bg-black/30"
            >
              <img
                src="/pagepromo.jpg"
                alt="Facemaxify detailed facial analysis preview"
                className="mx-auto max-h-[340px] w-full object-contain transition duration-300 group-hover:scale-[1.01]"
              />
            </a>
            <div className="px-1 pb-1 pt-4">
              <p className="text-sm leading-7 text-slate-300">
                For detailed analysis like this, visit our full analysis page.
              </p>
              <button
                onClick={onOpenFullAnalysis}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 font-semibold text-slate-950 transition hover:bg-slate-200"
              >
                Open full analysis
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-[32px] border border-white/10 bg-slate-950/75 p-6 shadow-2xl shadow-black/20 lg:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                {page.quickTool.scoreLabel}
              </div>
              <h3 className="mt-2 text-3xl font-black text-white sm:text-4xl">
                {result ? `${result.score}/100` : "Waiting for photo"}
              </h3>
            </div>
            {result && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-right">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Read</div>
                <div className="mt-1 text-lg font-bold text-white">{result.label}</div>
              </div>
            )}
          </div>

          <div className="mt-6 h-4 overflow-hidden rounded-full bg-slate-900">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${resultTone} transition-all duration-500`}
              style={{ width: `${result?.score ?? 8}%` }}
            />
          </div>

          {result ? (
            <>
              <p className="mt-5 text-base leading-7 text-slate-300">{result.summary}</p>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {result.metrics.map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-3xl border border-white/8 bg-white/[0.03] p-4"
                  >
                    <div className="text-sm text-slate-400">{metric.label}</div>
                    <div className="mt-2 text-2xl font-bold text-white">{metric.value}</div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-400/15 bg-emerald-400/10 p-4 text-sm text-slate-100">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                <span>
                  This is a lightweight preview. The full Facemaxify page goes much deeper with the detailed analysis and more measurements.
                </span>
              </div>
            </>
          ) : (
            <p className="mt-5 text-base leading-7 text-slate-400">
              Upload a clear photo and run the mini analyzer to get a quick result here.
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

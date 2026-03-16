import React, { useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ImagePlus,
  Loader2,
  Lock,
  Sparkles,
} from "lucide-react";
import { SeoLandingPageConfig } from "../../data/seoLandingPages";
import {
  calculateFrontRatios,
  MetricResult,
  RATIO_CONFIGS,
} from "../../services/ratioCalculator";
import { detectLandmarksInstant } from "../../services/mediaPipeService";
import { standardizeImage } from "../../utils/imageProcessing";

interface SimpleSeoAnalyzerProps {
  page: SeoLandingPageConfig;
  onOpenFullAnalysis: () => void;
}

interface AnalysisState {
  standardizedImage: string;
  metrics: MetricResult[];
  overallScore: number;
  resultLabel: string;
}

const getResultLabel = (score: number, prefix: string) => {
  if (score >= 80) return `${prefix}: strong`;
  if (score >= 65) return `${prefix}: promising`;
  return `${prefix}: mixed`;
};

const getResultTone = (score: number) => {
  if (score >= 80) return "from-emerald-300 to-cyan-300";
  if (score >= 65) return "from-amber-300 to-yellow-300";
  return "from-rose-300 to-orange-300";
};

const metricValueLabel = (metric: MetricResult) => `${metric.value}${metric.unit}`;

export const SimpleSeoAnalyzer: React.FC<SimpleSeoAnalyzerProps> = ({
  page,
  onOpenFullAnalysis,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisState | null>(null);

  const unlockedMetrics = useMemo(() => {
    if (!analysis) return [];
    return page.analyzer.unlockedMetricKeys
      .map((key) => analysis.metrics.find((metric) => metric.key === key))
      .filter(Boolean) as MetricResult[];
  }, [analysis, page.analyzer.unlockedMetricKeys]);

  const lockedMetrics = page.analyzer.lockedMetricKeys || [];

  const analyzePhoto = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setError(null);
    setAnalysis(null);

    try {
      const { landmarks: initialLandmarks } = await detectLandmarksInstant(
        selectedImage,
        "front",
      );
      const standardizedImage = await standardizeImage(selectedImage, initialLandmarks);
      const { landmarks: finalLandmarks } = await detectLandmarksInstant(
        standardizedImage,
        "front",
      );
      const metrics = calculateFrontRatios(finalLandmarks as any);

      const scoringMetrics = (page.analyzer.aggregateMetricKeys || page.analyzer.unlockedMetricKeys)
        .map((key) => metrics.find((metric) => metric.key === key))
        .filter(Boolean) as MetricResult[];

      if (scoringMetrics.length === 0) {
        throw new Error("Could not calculate a usable preview from this photo.");
      }

      const overallScore = Math.round(
        (scoringMetrics.reduce((sum, metric) => sum + metric.score, 0) /
          scoringMetrics.length) *
          10,
      );

      setAnalysis({
        standardizedImage,
        metrics,
        overallScore,
        resultLabel: getResultLabel(overallScore, page.analyzer.resultPrefix),
      });
    } catch (analysisError: any) {
      setError(
        analysisError?.message ||
          "Analysis failed. Try a clearer front-facing photo with a neutral expression.",
      );
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
            <h2 className="text-2xl font-black text-white sm:text-3xl">
              {page.analyzer.title}
            </h2>
            <p className="mt-1 text-sm text-slate-400">{page.analyzer.description}</p>
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
                if (file.size > 20 * 1024 * 1024) {
                  setError("Please upload an image smaller than 20MB.");
                  return;
                }

                const reader = new FileReader();
                reader.onload = (loadEvent) => {
                  setSelectedImage(loadEvent.target?.result as string);
                  setAnalysis(null);
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
              Use a clear, front-facing photo. This page runs a limited real
              preview using the same front-analysis pipeline as Facemaxify.
            </p>
            <div className="mt-6 inline-flex rounded-full bg-white px-5 py-3 font-semibold text-slate-950 transition group-hover:bg-sky-100">
              Select photo
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="overflow-hidden rounded-[28px] border border-white/8 bg-black/30">
              <img
                src={analysis?.standardizedImage || selectedImage}
                alt="Uploaded face"
                className="max-h-[480px] w-full object-contain"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => {
                  setSelectedImage(null);
                  setAnalysis(null);
                  setError(null);
                }}
                className="rounded-full border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                Choose another photo
              </button>
              <button
                onClick={analyzePhoto}
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
                For detailed analysis like this, use the full Facemaxify tool.
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
                {page.analyzer.scoreLabel}
              </div>
              <h3 className="mt-2 text-3xl font-black text-white sm:text-4xl">
                {analysis ? `${analysis.overallScore}/100` : "Waiting for photo"}
              </h3>
            </div>
            {analysis && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-right">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Read</div>
                <div className="mt-1 text-lg font-bold text-white">
                  {analysis.resultLabel}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 h-4 overflow-hidden rounded-full bg-slate-900">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${getResultTone(
                analysis?.overallScore || 0,
              )} transition-all duration-500`}
              style={{ width: `${analysis?.overallScore || 8}%` }}
            />
          </div>

          {analysis ? (
            <>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {unlockedMetrics.map((metric) => (
                  <div
                    key={metric.key}
                    className="rounded-3xl border border-white/8 bg-white/[0.03] p-4"
                  >
                    <div className="text-sm text-slate-400">{metric.name}</div>
                    <div className="mt-2 text-2xl font-bold text-white">
                      {metricValueLabel(metric)}
                    </div>
                    <div className="mt-2 text-sm text-sky-300">
                      Score {metric.score.toFixed(1)}/10
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      Ideal {metric.idealMin}-{metric.idealMax}
                      {metric.unit}
                    </div>
                  </div>
                ))}

                {lockedMetrics.map((metricKey) => (
                  <div
                    key={metricKey}
                    className="rounded-3xl border border-white/8 bg-white/[0.02] p-4 opacity-85"
                  >
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Lock className="h-4 w-4 text-amber-300" />
                      {RATIO_CONFIGS[metricKey].name}
                    </div>
                    <div className="mt-4 text-lg font-bold text-white">Locked</div>
                    <div className="mt-2 text-sm text-slate-500">
                      Unlock this metric in the premium Facemaxify analysis.
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-400/15 bg-emerald-400/10 p-4 text-sm text-slate-100">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                <span>
                  This preview is not fully accurate and can be off. For a more
                  accurate result, use the main Facemaxify tool with the full
                  detailed analysis.
                </span>
              </div>
            </>
          ) : (
            <p className="mt-5 text-base leading-7 text-slate-400">
              Upload a clear photo and run the analyzer to see a real preview
              result here.
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

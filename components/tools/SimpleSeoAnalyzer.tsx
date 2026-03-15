import React, { useMemo, useRef, useState } from "react";
import { ArrowRight, CheckCircle2, ImagePlus, Lock, Sparkles } from "lucide-react";
import { SeoLandingPageConfig } from "../../data/seoLandingPages";

interface SimpleSeoAnalyzerProps {
  page: SeoLandingPageConfig;
  onOpenFullAnalysis: () => void;
}

const getResultTone = (score: number, labels: [string, string, string]) => {
  if (score < 45) {
    return { label: labels[0], color: "text-rose-300", bar: "from-rose-400 to-orange-300" };
  }

  if (score < 75) {
    return { label: labels[1], color: "text-amber-200", bar: "from-amber-300 to-yellow-300" };
  }

  return { label: labels[2], color: "text-emerald-300", bar: "from-emerald-300 to-cyan-300" };
};

export const SimpleSeoAnalyzer: React.FC<SimpleSeoAnalyzerProps> = ({
  page,
  onOpenFullAnalysis,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>(
    Object.fromEntries(page.quickTool.questions.map((question) => [question.id, 5])),
  );

  const score = useMemo(() => {
    const values = Object.values(answers);
    const average = values.reduce((sum, value) => sum + value, 0) / values.length;
    return Math.round(average * 10);
  }, [answers]);

  const tone = getResultTone(score, page.quickTool.resultLabels);

  return (
    <section className="grid gap-8 rounded-[32px] border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-black/25 lg:grid-cols-[0.95fr_1.05fr] lg:p-8">
      <div className="space-y-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200">
            <Sparkles className="h-3.5 w-3.5" />
            Free quick tool
          </div>
          <h2 className="mt-4 text-3xl font-black text-white sm:text-4xl">
            {page.quickTool.title}
          </h2>
          <p className="mt-3 max-w-2xl text-lg leading-8 text-slate-300">
            {page.quickTool.description}
          </p>
        </div>

        <div
          onClick={() => fileInputRef.current?.click()}
          className="group cursor-pointer rounded-[28px] border border-dashed border-white/15 bg-white/[0.03] p-6 transition hover:border-sky-400/40 hover:bg-white/[0.05]"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;

              const reader = new FileReader();
              reader.onload = (loadEvent) => {
                setSelectedImage(loadEvent.target?.result as string);
              };
              reader.readAsDataURL(file);
            }}
          />

          {selectedImage ? (
            <div className="space-y-4">
              <img
                src={selectedImage}
                alt="Uploaded preview"
                className="max-h-[360px] w-full rounded-[22px] object-contain bg-black/30"
              />
              <div className="flex items-center justify-between gap-4 text-sm text-slate-300">
                <span>Photo added for visual reference while you rate the traits below.</span>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelectedImage(null);
                  }}
                  className="rounded-full border border-white/10 px-4 py-2 font-semibold text-white transition hover:bg-white/10"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 py-10 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-400/10 text-sky-300">
                <ImagePlus className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Upload a clear photo</h3>
                <p className="mt-2 text-slate-400">
                  Optional, but helpful while using this simple free preview tool.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-[28px] border border-white/8 bg-white/[0.03] p-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
              {page.quickTool.scoreLabel}
            </div>
            <div className={`mt-2 text-4xl font-black ${tone.color}`}>{score}/100</div>
          </div>
          <div className="rounded-2xl border border-white/8 bg-slate-950/80 px-4 py-3 text-right">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Result</div>
            <div className={`mt-1 text-lg font-bold ${tone.color}`}>{tone.label}</div>
          </div>
        </div>

        <div className="mb-8 h-4 overflow-hidden rounded-full bg-slate-900">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${tone.bar}`}
            style={{ width: `${score}%` }}
          />
        </div>

        <div className="space-y-5">
          {page.quickTool.questions.map((question) => (
            <div key={question.id} className="rounded-3xl border border-white/8 bg-slate-950/80 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-white">{question.label}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-400">{question.helper}</p>
                </div>
                <div className="min-w-12 text-right text-lg font-bold text-sky-300">
                  {answers[question.id]}
                </div>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={answers[question.id]}
                onChange={(event) =>
                  setAnswers((current) => ({
                    ...current,
                    [question.id]: Number(event.target.value),
                  }))
                }
                className="mt-4 h-2 w-full cursor-pointer accent-sky-400"
              />
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-[28px] border border-amber-300/15 bg-gradient-to-r from-amber-300/10 to-slate-900 p-5">
          <div className="flex items-start gap-3">
            <Lock className="mt-1 h-5 w-5 text-amber-200" />
            <div>
              <h3 className="text-lg font-bold text-white">Want the detailed analysis?</h3>
              <p className="mt-2 leading-7 text-slate-300">
                This free tool is intentionally lightweight. For a more serious result like the full Facemaxify report, visit our main analysis page.
              </p>
              <button
                onClick={onOpenFullAnalysis}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 font-semibold text-slate-950 transition hover:bg-slate-200"
              >
                Open Detailed Analysis
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-400/12 bg-emerald-400/8 p-4 text-sm text-slate-200">
          <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
          <span>
            Use this as a quick preview only. The detailed facial harmony breakdown lives in the main dashboard tool.
          </span>
        </div>
      </div>
    </section>
  );
};

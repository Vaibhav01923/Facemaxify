import React, { useEffect, useRef } from "react";
import { calculateGoldenRatio } from "../../../utils/goldenRatioCalculator";
import type { Locale } from "../../../i18n/types";
import { engineStrings, formatNumber, Note, pickTier, type Engine, type ResultsProps } from "./common";

// Same measurement as /tools/golden-ratio: three ratios compared with 1.618. The calculator
// returns English labels, so names and descriptions are looked up by position here.
const T: Partial<
  Record<
    Locale,
    {
      scoreLabel: string;
      reviews: [number, string][];
      ratios: { name: string; description: string }[];
      breakdown: string;
      yourRatio: string;
      ideal: string;
      match: string;
      overlayAlt: string;
      note: string;
    }
  >
> = {
  ja: {
    scoreLabel: "黄金比スコア",
    reviews: [
      [91, "あなたの顔の比率は、黄金比とほぼ完全に一致しています。"],
      [81, "顔のバランスと調和がとても優れています。"],
      [71, "整った比率に、あなたらしい個性が加わった顔立ちです。"],
      [0, "「黄金比」の基準からは離れていますが、それがあなたならではの個性になっています。"],
    ],
    ratios: [
      { name: "口幅 ÷ 鼻幅", description: "鼻の幅に対する、口の幅の比率です。" },
      { name: "鼻下〜あごの比率", description: "鼻・唇・あごのバランス(鼻下からあご ÷ 下唇からあご)です。" },
      { name: "目の外側の幅 ÷ 口幅", description: "口の幅に対する、両目の外側の幅の比率です。" },
    ],
    breakdown: "比率ごとの内訳",
    yourRatio: "あなたの値",
    ideal: "理想値",
    match: "% 一致",
    overlayAlt: "測定した位置を重ねた写真",
    note: "黄金比は「美しい比率」として有名ですが、実際の魅力は平均的な比率や左右対称性のほうが強く関係するという研究もあります。スコアが低くても、魅力的でないという意味ではありません。",
  },
};

// The measured distances drawn over the photo: face height and width, mouth, nose, outer eyes.
const LINES: [number, number][] = [
  [10, 152],
  [234, 454],
  [61, 291],
  [102, 331],
  [33, 263],
];

const Overlay: React.FC<{ image: string; landmarks: any[]; alt: string }> = ({ image, landmarks, alt }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !image || landmarks.length === 0) return;
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const unit = Math.max(2, Math.round(img.width / 300));
      ctx.lineWidth = unit;
      ctx.strokeStyle = "rgba(251, 191, 36, 0.9)";
      ctx.fillStyle = "#f59e0b";
      const point = (i: number) => ({ x: landmarks[i].x * canvas.width, y: landmarks[i].y * canvas.height });
      LINES.forEach(([a, b]) => {
        const p1 = point(a);
        const p2 = point(b);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
        [p1, p2].forEach((p) => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, unit * 2, 0, 2 * Math.PI);
          ctx.fill();
        });
      });
    };
    img.src = image;
  }, [image, landmarks]);

  return <canvas ref={canvasRef} role="img" aria-label={alt} className="w-full max-w-md mx-auto rounded-2xl" />;
};

const Results: React.FC<ResultsProps> = ({ result, context, locale }) => {
  const t = engineStrings(T, locale, "golden-ratio");
  const r = result as ReturnType<typeof calculateGoldenRatio>;

  return (
    <div className="space-y-5">
      <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-8 text-center">
        <p className="text-slate-400 font-medium text-sm mb-4">{t.scoreLabel}</p>
        <div className="relative inline-flex items-center justify-center">
          <svg className="w-40 h-40 -rotate-90" aria-hidden="true">
            <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-slate-800" />
            <circle
              cx="80"
              cy="80"
              r="70"
              stroke="currentColor"
              strokeWidth="10"
              fill="transparent"
              strokeDasharray={440}
              strokeDashoffset={440 - (440 * r.score) / 100}
              className="text-amber-500"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-black text-white">{r.score}</span>
            <span className="text-xs text-slate-500 mt-1">/ 100</span>
          </div>
        </div>
        <p className="mt-6 text-lg text-slate-300">{pickTier(r.score, t.reviews)}</p>
      </div>

      <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-4 sm:p-6">
        <Overlay image={context.image} landmarks={context.landmarks} alt={t.overlayAlt} />
      </div>

      <div className="bg-slate-900/60 border border-white/10 rounded-3xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10">
          <h3 className="font-bold text-white">{t.breakdown}</h3>
        </div>
        <div className="divide-y divide-white/5">
          {r.ratios.map((ratio, i) => (
            <div key={i} className="p-6">
              <div className="flex justify-between items-start gap-4 mb-2">
                <div>
                  <h4 className="font-semibold text-white">{t.ratios[i]?.name ?? ratio.name}</h4>
                  <p className="text-xs text-slate-500">{t.ratios[i]?.description ?? ratio.description}</p>
                </div>
                <div
                  className={`shrink-0 text-sm font-bold px-2 py-1 rounded ${
                    ratio.score > 85
                      ? "bg-green-500/20 text-green-400"
                      : ratio.score > 70
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {ratio.score}
                  {t.match}
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm mt-3">
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-500">{t.yourRatio}</span>
                    <span className="text-white font-mono">{formatNumber(ratio.value, locale, 2)}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${Math.min(100, (ratio.value / ratio.ideal) * 100)}%` }}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block text-xs">{t.ideal}</span>
                  <span className="text-amber-500 font-mono font-bold">{formatNumber(ratio.ideal, locale, 2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Note>{t.note}</Note>
    </div>
  );
};

export const goldenRatioEngine: Engine = { calculate: calculateGoldenRatio, Results };

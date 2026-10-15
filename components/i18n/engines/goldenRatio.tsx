import React from "react";
import { calculateGoldenRatio } from "../../../utils/goldenRatioCalculator";
import type { Locale } from "../../../i18n/types";
import { chinProportionLayer, eyesMouthLayer, mouthNoseLayer } from "../overlay/layers";
import { AnnotatedResult } from "../overlay/AnnotatedResult";
import { LayerDot, LayerRow } from "../overlay/selection";
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
      note: string;
      // Short texts drawn on the photo.
      photo: { mouthNose: (ratio: string) => string; chin: (ratio: string) => string; eyesMouth: (ratio: string) => string };
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
    note: "黄金比は「美しい比率」として有名ですが、実際の魅力は平均的な比率や左右対称性のほうが強く関係するという研究もあります。スコアが低くても、魅力的でないという意味ではありません。",
    photo: {
      mouthNose: (ratio) => `口幅÷鼻幅 ${ratio}`,
      chin: (ratio) => `あごの比率 ${ratio}`,
      eyesMouth: (ratio) => `目幅÷口幅 ${ratio}`,
    },
  },
};

const Results: React.FC<ResultsProps> = ({ result, context, locale }) => {
  const t = engineStrings(T, locale, "golden-ratio");
  const r = result as ReturnType<typeof calculateGoldenRatio>;
  // The calculator lists its ratios in this order: mouth/nose, nose-to-chin, eyes/mouth.
  const keys = ["mouthNose", "chin", "eyesMouth"];
  const layers = [
    mouthNoseLayer({ id: "mouthNose", label: t.photo.mouthNose }),
    chinProportionLayer({ id: "chin", label: t.photo.chin }),
    eyesMouthLayer({ id: "eyesMouth", label: t.photo.eyesMouth }),
  ];

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

      <AnnotatedResult context={context} locale={locale} layers={layers}>
        <div className="bg-slate-900/60 border border-white/10 rounded-3xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10">
            <h3 className="font-bold text-white">{t.breakdown}</h3>
          </div>
          <div className="divide-y divide-white/5">
            {r.ratios.map((ratio, i) => (
              <LayerRow key={i} layer={keys[i]} className="block p-5 rounded-none">
                <div className="flex justify-between items-start gap-4 mb-2">
                  <div>
                    <h4 className="font-semibold text-white flex items-center gap-2">
                      <LayerDot layer={keys[i]} />
                      {t.ratios[i]?.name ?? ratio.name}
                    </h4>
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
              </LayerRow>
            ))}
          </div>
        </div>
      </AnnotatedResult>
      <Note>{t.note}</Note>
    </div>
  );
};

export const goldenRatioEngine: Engine = { calculate: calculateGoldenRatio, Results };

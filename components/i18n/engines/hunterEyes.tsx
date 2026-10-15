import React from "react";
import { calculate } from "../../../pages/HunterEyesPage";
import type { Locale } from "../../../i18n/types";
import { formatNumber, Note, pickTier, ScoreCard, TONES, type Engine, type ResultsProps } from "./common";

// Same measurement as /tools/hunter-eyes (eye openness 55 % + canthal tilt 45 %).
const T: Record<
  Locale,
  {
    tiers: [number, string][];
    descriptions: [number, string][];
    heading: string;
    openness: string;
    opennessIdeal: string;
    tilt: string;
    tiltIdeal: string;
    idealLabel: string;
    note: string;
  }
> = {
  es: {
    tiers: [
      [80, "Ojos de cazador"],
      [60, "Ojos semi-cazador"],
      [40, "Ojos neutros"],
      [0, "Ojos de presa"],
    ],
    descriptions: [
      [
        80,
        "Ojos compactos y rasgados, con una inclinación cantal positiva. Es el tipo de ojos más valorado en la estética facial actual: se asocia con intensidad, determinación y una mirada afilada.",
      ],
      [
        60,
        "Buena combinación de ojos moderadamente compactos y una ligera inclinación positiva. Los ojos semi-cazador transmiten una mirada equilibrada y definida, sin llegar al extremo del párpado muy encapuchado.",
      ],
      [
        40,
        "Ojos neutros, con una apertura media y poca inclinación. Transmiten cercanía y amabilidad: ni cazador ni presa.",
      ],
      [
        0,
        "Ojos más grandes y abiertos, con inclinación neutra o negativa. Suelen asociarse con una mirada expresiva y tierna.",
      ],
    ],
    heading: "Medidas de los ojos",
    openness: "Apertura del ojo (alto ÷ ancho)",
    opennessIdeal: "< 28 %",
    tilt: "Inclinación cantal",
    tiltIdeal: "> 3°",
    idealLabel: "ideal:",
    note: "Hazte la foto con la cara relajada: entrecerrar los ojos o sonreír estrecha el ojo y sube las comisuras, y eso infla el resultado.",
  },
  ja: {
    tiers: [
      [80, "ハンターアイ"],
      [60, "セミハンターアイ"],
      [40, "ニュートラルな目"],
      [0, "プレイアイ(丸く開いた目)"],
    ],
    descriptions: [
      [
        80,
        "コンパクトで切れ長な目に、目尻が上がった(ポジティブなキャンタルティルトの)形です。現代の顔面美学でもっとも評価されやすい目元で、鋭さ・意志の強さ・シャープな印象と結びつけて語られます。",
      ],
      [
        60,
        "ほどよくコンパクトな目と、わずかな目尻の上がりを兼ね備えています。セミハンターアイは、重たすぎずバランスのとれたシャープな印象を与えます。",
      ],
      [40, "目の開きは平均的で、目尻の傾きもわずかです。親しみやすく柔らかい印象で、ハンターでもプレイでもない中間タイプです。"],
      [0, "大きく丸く開いた目で、目尻の傾きは水平か下がり気味です。表情豊かで優しい印象を与えやすい目元です。"],
    ],
    heading: "目の測定値",
    openness: "目の開き(縦÷横)",
    opennessIdeal: "28%未満",
    tilt: "目尻の傾き(キャンタルティルト)",
    tiltIdeal: "3°超",
    idealLabel: "目安:",
    note: "表情はリラックスした状態で撮影してください。目を細めたり笑ったりすると目が細くなり目尻も上がるため、結果が高めに出ます。",
  },
};

const Results: React.FC<ResultsProps> = ({ result: r, locale }) => {
  const t = T[locale];
  const tone = r.score >= 80 ? TONES.green : r.score >= 60 ? TONES.indigo : r.score >= 40 ? TONES.amber : TONES.orange;
  const measurements = [
    { label: t.openness, value: `${formatNumber(r.avgOpenness, locale)}%`, ideal: t.opennessIdeal, good: r.avgOpenness < 30 },
    { label: t.tilt, value: `${formatNumber(r.avgTilt, locale)}°`, ideal: t.tiltIdeal, good: r.avgTilt > 2 },
  ];

  return (
    <div className="space-y-5">
      <ScoreCard locale={locale} value={r.score} unit="/100" tone={tone} label={pickTier(r.score, t.tiers)}>
        {pickTier(r.score, t.descriptions)}
      </ScoreCard>
      <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6">
        <h3 className="text-white font-bold mb-4">{t.heading}</h3>
        {measurements.map((m) => (
          <div key={m.label} className="flex justify-between gap-4 py-3 border-b border-white/5 last:border-0">
            <span className="text-slate-400 text-sm">{m.label}</span>
            <div className="text-right shrink-0">
              <span className={`font-bold text-sm ${m.good ? "text-emerald-400" : "text-amber-400"}`}>{m.value}</span>
              <span className="text-slate-600 text-xs ml-2">
                {t.idealLabel} {m.ideal}
              </span>
            </div>
          </div>
        ))}
      </div>
      <Note>{t.note}</Note>
    </div>
  );
};

export const hunterEyesEngine: Engine = { calculate, Results };

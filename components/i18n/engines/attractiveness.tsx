import React from "react";
import { calculate } from "../../../pages/AttractivenessScorePage";
import type { Locale } from "../../../i18n/types";
import { BreakdownCard, Note, pickTier, ScoreCard, TONES, type Engine, type ResultsProps } from "./common";

// Same measurement as /tools/attractiveness-score; only the wording changes per language.
const T: Record<
  Locale,
  {
    tiers: [number, string][];
    body: string;
    heading: string;
    rows: [string, string, string, string, string]; // symmetry, jaw, youth, nose, eye spacing
    note: string;
  }
> = {
  es: {
    tiers: [
      [88, "Atractivo muy alto"],
      [75, "Por encima de la media"],
      [60, "Atractivo medio"],
      [0, "Por debajo de la media"],
    ],
    body: "Puntuación basada en cinco rasgos faciales que la investigación relaciona con la belleza: simetría, mandíbula, rasgos juveniles, proporción de la nariz y distancia entre los ojos. Se apoya en hallazgos de la psicología evolutiva y de la estética.",
    heading: "Componentes de la puntuación",
    rows: [
      "Simetría facial (35 %)",
      "Definición de la mandíbula (25 %)",
      "Rasgos juveniles (20 %)",
      "Proporción de la nariz (10 %)",
      "Distancia entre los ojos (10 %)",
    ],
    note: "Es una medida de la geometría de tu rostro en una foto, no de ti como persona ni de todo lo que hace atractivo a un rostro en la vida real.",
  },
  ja: {
    tiers: [
      [88, "とても魅力的"],
      [75, "平均より上"],
      [60, "平均的"],
      [0, "平均をやや下回る"],
    ],
    body: "研究で顔の魅力との関連が報告されている5つの特徴(左右対称性・フェイスライン・若々しさの指標・鼻の比率・目の間隔)から算出したスコアです。進化心理学・美学の知見に基づいています。",
    heading: "スコアの内訳",
    rows: ["左右対称性(35%)", "フェイスラインの明瞭さ(25%)", "若々しさの指標(20%)", "鼻の比率(10%)", "目の間隔(10%)"],
    note: "顔の幾何学的な比率を1枚の写真から測った目安です。あなた自身の価値や、実際の印象のすべてを示すものではありません。",
  },
};

const Results: React.FC<ResultsProps> = ({ result: r, locale }) => {
  const t = T[locale];
  const tone = r.score >= 88 ? TONES.gold : r.score >= 75 ? TONES.green : r.score >= 60 ? TONES.indigo : TONES.amber;
  const scores = [r.symScore, r.jawScore, r.youthScore, r.noseScore, r.eyeSpaceScore] as number[];

  return (
    <div className="space-y-5">
      <ScoreCard locale={locale} value={r.score} unit="/100" tone={tone} label={pickTier(r.score, t.tiers)}>
        {t.body}
      </ScoreCard>
      <BreakdownCard title={t.heading} rows={t.rows.map((label, i) => ({ label, score: scores[i] }))} />
      <Note>{t.note}</Note>
    </div>
  );
};

export const attractivenessEngine: Engine = { calculate, Results };

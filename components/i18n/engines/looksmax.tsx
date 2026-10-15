import React from "react";
import { calculate } from "../../../pages/LooksmaxScorePage";
import type { Locale } from "../../../i18n/types";
import {
  BreakdownCard,
  engineStrings,
  Note,
  pickTier,
  ScoreCard,
  TONES,
  type Engine,
  type ResultsProps,
} from "./common";

// Same measurement as /tools/looksmax-score (symmetry 25 %, jaw 25 %, canthal tilt 20 %, thirds
// 15 %, eye compactness 15 %), presented as an "ikemen score" for the Japanese page.
const T: Partial<
  Record<
    Locale,
    {
      tiers: [number, string][];
      body: string;
      heading: string;
      rows: [string, string, string, string, string]; // symmetry, canthal tilt, jaw, thirds, eyes
      note: string;
    }
  >
> = {
  ja: {
    tiers: [
      [90, "トップ級"],
      [78, "上位"],
      [65, "中位"],
      [50, "平均的"],
      [0, "平均をやや下回る"],
    ],
    body: "イケメン度は、左右対称性・目尻の上がり・フェイスライン・顔の三分割・切れ長度の5項目を加重平均した、顔の「かたち」のスコアです。清潔感・表情・髪型・雰囲気は含まれません。",
    heading: "項目別スコア",
    rows: [
      "左右対称性(25%)",
      "目尻の上がり(キャンタルティルト・20%)",
      "フェイスラインの明瞭さ(25%)",
      "顔の三分割バランス(15%)",
      "切れ長度(目の横長さ・15%)",
    ],
    note: "全体の点数より、項目ごとの内訳が大切です。伸ばせるのはフェイスライン(体脂肪・髪型・ヒゲ)や写真の撮り方、構造的な部分は変えにくい項目です。",
  },
};

const Results: React.FC<ResultsProps> = ({ result: r, locale }) => {
  const t = engineStrings(T, locale, "looksmax");
  const tone =
    r.score >= 90 ? TONES.gold : r.score >= 78 ? TONES.green : r.score >= 65 ? TONES.indigo : r.score >= 50 ? TONES.amber : TONES.red;
  const scores = [r.symmetryScore, r.canthalScore, r.jawScore, r.thirdsScore, r.eyeScore] as number[];

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

export const looksmaxEngine: Engine = { calculate, Results };

import React from "react";
import { calculate } from "../../../pages/FaceRatingPage";
import type { Locale } from "../../../i18n/types";
import { SYMMETRY_PAIRS } from "../overlay/geometry";
import { faceRectLayer, jawLayer, noseLayer, symmetryLayer, thirdsLayer } from "../overlay/layers";
import { AnnotatedResult } from "../overlay/AnnotatedResult";
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

// 偏差値 (the standardized score Japanese people use for exams, 50 = typical, 10 = one standard
// deviation) is a linear rescaling of this tool's own 0–100 score: 56 — the middle of the tool's
// "average" band of 50–62 — maps to 50, and every 10 points moves it by 6. It is NOT measured on a
// population of faces, and the page says so (see content/i18n/ja/ganmen-hensachi.md).
export const toHensachi = (score: number) => Math.min(80, Math.max(25, Math.round(50 + (score - 56) * 0.6)));

const T: Partial<
  Record<
    Locale,
    {
      tiers: [number, string][];
      body: string;
      unit: string;
      scoreLine: (score: number, rating: number) => string;
      heading: string;
      rows: [string, string, string, string, string]; // symmetry, jaw, golden ratio, thirds, nose
      note: string;
      // Short texts drawn on the photo.
      photo: {
        symmetry: string;
        cheek: string;
        jaw: (percent: string) => string;
        face: (ratio: string) => string;
        thirds: (index: 0 | 1 | 2, percent: string) => string;
        nose: (percent: string) => string;
      };
    }
  >
> = {
  ja: {
    tiers: [
      [88, "トップクラス"],
      [76, "かなり高い"],
      [63, "高め"],
      [50, "平均的"],
      [0, "平均をやや下回る"],
    ],
    body: "左右対称性・フェイスライン・黄金比・顔の三分割・鼻の比率の5指標を重み付けして出した100点満点のスコアを、偏差値の目安に換算しています。",
    unit: "偏差値",
    scoreLine: (score, rating) => `診断スコア: ${score}/100(10点満点に換算すると ${rating.toFixed(1)})`,
    heading: "スコアの内訳",
    rows: ["左右対称性(30%)", "フェイスライン(25%)", "黄金比(20%)", "顔の三分割(15%)", "鼻の比率(10%)"],
    note: "偏差値は、このツールの「平均的」ゾーン(50〜62点)の中心にあたる56点を偏差値50とし、10点ごとに6を加減した換算値です。実際の人口を調べた統計ではないため、あくまで目安として楽しんでください。",
    photo: {
      symmetry: "左右対称性",
      cheek: "頬骨の幅",
      jaw: (percent) => `あご幅 ${percent}%`,
      face: (ratio) => `縦÷横 ${ratio}(理想 1.62)`,
      thirds: (index, percent) => `${["額〜眉", "眉〜鼻下", "鼻下〜あご"][index]} ${percent}%`,
      nose: (percent) => `鼻幅 ${percent}%`,
    },
  },
};

const Results: React.FC<ResultsProps> = ({ result: r, locale, context }) => {
  const t = engineStrings(T, locale, "face-rating");
  const tone =
    r.score >= 88 ? TONES.gold : r.score >= 76 ? TONES.green : r.score >= 63 ? TONES.indigo : r.score >= 50 ? TONES.amber : TONES.red;
  const scores = [r.sym, r.jaw, r.golden, r.thirds, r.nose] as number[];
  const keys = ["sym", "jaw", "golden", "thirds", "nose"];
  const layers = [
    symmetryLayer({ id: "sym", pairs: SYMMETRY_PAIRS, label: t.photo.symmetry }),
    jawLayer({ id: "jaw", cheek: t.photo.cheek, jaw: t.photo.jaw }),
    faceRectLayer({ id: "golden", label: t.photo.face }),
    thirdsLayer({ id: "thirds", name: t.photo.thirds }),
    noseLayer({ id: "nose", label: t.photo.nose }),
  ];

  return (
    <div className="space-y-5">
      <ScoreCard locale={locale} value={toHensachi(r.score)} unit={t.unit} tone={tone} label={pickTier(r.score, t.tiers)}>
        <p>{t.body}</p>
        <p className="mt-2 text-slate-400">{t.scoreLine(r.score, r.rating)}</p>
      </ScoreCard>
      <AnnotatedResult context={context} locale={locale} layers={layers}>
        <BreakdownCard
          title={t.heading}
          rows={t.rows.map((label, i) => ({ label, score: scores[i], layer: keys[i] }))}
        />
      </AnnotatedResult>
      <Note>{t.note}</Note>
    </div>
  );
};

export const faceRatingEngine: Engine = { calculate, Results };

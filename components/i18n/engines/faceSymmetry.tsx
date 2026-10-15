import React from "react";
import { calculateFaceSymmetry, type FaceSymmetryResult } from "../../../utils/faceSymmetryCalculator";
import type { Locale } from "../../../i18n/types";
import { midlineLayer, pairLayer, type Layer } from "../overlay/layers";
import { AnnotatedResult } from "../overlay/AnnotatedResult";
import { LayerDot, LayerRow } from "../overlay/selection";
import { engineStrings, Note, pickTier, ScoreCard, TONES, type Engine, type ResultsProps } from "./common";

// Same measurement as /tools/face-symmetry (eight left–right pairs around the facial midline).
// The calculator returns English labels, so zone names, tiers and reviews are written out per
// language here, keyed by the calculator's own zone names.
const T: Partial<
  Record<
    Locale,
    {
      tiers: [number, string][];
      reviews: [number, string][];
      zones: Record<string, string>;
      // Short zone names for the labels drawn on the photo.
      shortZones: Record<string, string>;
      percent: string;
      best: string;
      lowest: string;
      heading: string;
      note: string;
    }
  >
> = {
  es: {
    tiers: [
      [90, "Muy simétrico"],
      [78, "Bastante simétrico"],
      [65, "Asimetría moderada"],
      [0, "Asimetría notable"],
    ],
    reviews: [
      [
        90,
        "Tu rostro muestra una simetría izquierda-derecha excepcional en todas las zonas medidas. Una simetría facial alta se asocia con la percepción de atractivo y es un componente clave de la armonía estética.",
      ],
      [
        78,
        "Tu rostro está bien equilibrado y tiene buena simetría izquierda-derecha. Hay pequeñas asimetrías, pero están dentro de lo normal: la mayoría de las personas tienen variaciones sutiles que no se ven a simple vista.",
      ],
      [
        65,
        "Tu rostro tiene cierta asimetría medible en algunas zonas. Es totalmente normal: ningún rostro humano es perfectamente simétrico. Esas variaciones aportan carácter y suelen pasar desapercibidas en el día a día.",
      ],
      [
        0,
        "Tus medidas muestran diferencias más marcadas entre izquierda y derecha en algunas zonas. Puede deberse al ángulo de la foto, a la luz o a la estructura natural de tu rostro. Una foto de frente con luz uniforme da la lectura más fiable.",
      ],
    ],
    zones: {
      "Outer Eye Corners": "Comisuras externas de los ojos",
      "Inner Eye Corners": "Comisuras internas de los ojos",
      "Eye Height": "Altura de los ojos (párpados)",
      "Eyebrow Arch": "Arco de las cejas",
      "Mouth Corners": "Comisuras de la boca",
      Cheekbones: "Pómulos",
      "Jaw Angles": "Ángulos de la mandíbula",
      Nostrils: "Fosas nasales",
    },
    shortZones: {
      "Outer Eye Corners": "Ojos (exterior)",
      "Inner Eye Corners": "Ojos (interior)",
      "Eye Height": "Altura de ojos",
      "Eyebrow Arch": "Cejas",
      "Mouth Corners": "Boca",
      Cheekbones: "Pómulos",
      "Jaw Angles": "Mandíbula",
      Nostrils: "Fosas nasales",
    },
    percent: " %",
    best: "Rasgo más simétrico:",
    lowest: "Menos simétrico:",
    heading: "Simetría zona por zona",
    note: "Si tu puntuación te parece baja, suele deberse más a la foto que a tu rostro: un pequeño giro de la cabeza ya acerca al eje central todos los rasgos de un lado. Repite la foto de frente, con la cabeza recta y luz uniforme.",
  },
};

// The landmark pair behind each zone of the calculator (same indices as utils/faceSymmetryCalculator.ts).
const PAIRS: Record<string, [number, number]> = {
  "Outer Eye Corners": [33, 263],
  "Inner Eye Corners": [133, 362],
  "Eye Height": [159, 386],
  "Eyebrow Arch": [105, 334],
  "Mouth Corners": [61, 291],
  Cheekbones: [234, 454],
  "Jaw Angles": [172, 397],
  Nostrils: [98, 327],
};

const Results: React.FC<ResultsProps> = ({ result, locale, context }) => {
  const t = engineStrings(T, locale, "face-symmetry");
  const r = result as FaceSymmetryResult;
  const tone = r.score >= 90 ? TONES.green : r.score >= 78 ? TONES.indigo : r.score >= 65 ? TONES.amber : TONES.red;
  const zone = (name: string) => t.zones[name] ?? name;
  const layers: Layer[] = [
    midlineLayer(),
    ...r.pairs.flatMap((pair) => {
      const indices = PAIRS[pair.name];
      if (!indices) return [];
      const label = `${t.shortZones[pair.name] ?? pair.name} ${Math.round(pair.ratio * 100)}${t.percent}`;
      return [pairLayer({ id: pair.name, left: indices[0], right: indices[1], ratio: pair.ratio, label })];
    }),
  ];

  return (
    <div className="space-y-5">
      <ScoreCard locale={locale} value={r.score} unit="/100" tone={tone} label={pickTier(r.score, t.tiers)}>
        <p>{pickTier(r.score, t.reviews)}</p>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <div>
            <span className="text-slate-500">{t.best} </span>
            <span className="text-emerald-400 font-medium">{zone(r.strongestFeature)}</span>
          </div>
          <div>
            <span className="text-slate-500">{t.lowest} </span>
            <span className="text-amber-400 font-medium">{zone(r.weakestFeature)}</span>
          </div>
        </div>
      </ScoreCard>

      <AnnotatedResult context={context} locale={locale} layers={layers} defaultLayer={null}>
        <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-4 sm:p-5">
          <h3 className="text-white font-bold mb-2 text-lg px-3">{t.heading}</h3>
          {r.pairs.map((pair) => {
            const pct = Math.round(pair.ratio * 100);
            const bar = pct >= 95 ? "bg-emerald-500" : pct >= 85 ? "bg-indigo-500" : pct >= 75 ? "bg-amber-500" : "bg-red-500";
            const text = pct >= 95 ? "text-emerald-400" : pct >= 85 ? "text-indigo-400" : pct >= 75 ? "text-amber-400" : "text-red-400";
            return (
              <LayerRow key={pair.name} layer={pair.name} className="block px-3 py-2.5">
                <div className="flex justify-between gap-3 text-sm mb-1.5">
                  <span className="text-slate-300 flex items-center gap-2">
                    <LayerDot layer={pair.name} />
                    {zone(pair.name)}
                  </span>
                  <span className={`shrink-0 ${text}`}>
                    {pct}
                    {t.percent}
                  </span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full ${bar} rounded-full`} style={{ width: `${pct}%` }} />
                </div>
              </LayerRow>
            );
          })}
        </div>
      </AnnotatedResult>
      <Note>{t.note}</Note>
    </div>
  );
};

export const faceSymmetryEngine: Engine = { calculate: calculateFaceSymmetry, Results };

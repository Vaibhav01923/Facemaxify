import React from "react";
import {
  classifyFaceShape,
  extractMeasurements,
  type FaceShape,
  type FaceShapeResult,
} from "../../../utils/faceShapeClassifier";
import type { Locale } from "../../../i18n/types";
import { chinAngleLayer, contourLayer, foreheadJawLayer, lengthWidthLayer } from "../overlay/layers";
import { AnnotatedResult } from "../overlay/AnnotatedResult";
import { LayerDot, LayerRow } from "../overlay/selection";
import { engineStrings, formatNumber, Note, type Engine, type ResultsProps } from "./common";

// Same measurement as /tools/facial-shape. The classifier returns English text, so shape
// names, explanations and styling tips are written out per language here, keyed by shape.
// (The English page shows a "confidence" percentage that is a fixed number per shape rather
// than something measured, so the translated pages leave it out.)
interface ShapeCopy {
  name: string;
  reasoning: string;
  hairstyles: string[];
  glasses: string[];
  makeup: string[];
}

interface Copy {
  title: (shape: string) => string;
  measurementsHeading: string;
  lengthWidth: string;
  foreheadJaw: string;
  chinAngle: string;
  shapeLabel: string;
  hairstyles: string;
  glasses: string;
  makeup: string;
  celebrities: string;
  celebritiesIntro: (shape: string) => string;
  note: string;
  // Short texts drawn on the photo.
  photo: {
    lengthWidth: (ratio: string) => string;
    foreheadJaw: (ratio: string) => string;
    chinAngle: (degrees: string) => string;
  };
  shapes: Record<FaceShape, ShapeCopy>;
}

const T: Partial<Record<Locale, Copy>> = {
  es: {
    title: (shape) => `Tu tipo de rostro: ${shape}`,
    measurementsHeading: "Medidas clave",
    lengthWidth: "Relación largo/ancho",
    foreheadJaw: "Relación frente/mandíbula",
    chinAngle: "Ángulo de la barbilla",
    shapeLabel: "Tipo de rostro",
    hairstyles: "✨ Ideas de peinados y cortes",
    glasses: "👓 Ideas de gafas",
    makeup: "💄 Consejos de maquillaje",
    celebrities: "⭐ Famosos con tu tipo de rostro",
    celebritiesIntro: (shape) => `Famosos con el mismo tipo de rostro (${shape.toLowerCase()}):`,
    note: "Si tu resultado está en el límite entre dos formas, es normal: muchos rostros comparten rasgos de dos tipos. Prueba con otra foto con el pelo recogido y la cabeza recta.",
    photo: {
      lengthWidth: (ratio) => `Largo/ancho ${ratio}`,
      foreheadJaw: (ratio) => `Frente/mandíbula ${ratio}`,
      chinAngle: (degrees) => `Barbilla ${degrees}°`,
    },
    shapes: {
      oval: {
        name: "Ovalado",
        reasoning:
          "Tu rostro tiene proporciones equilibradas y curvas suaves. El largo es aproximadamente 1,5 veces el ancho, y la frente y la mandíbula tienen un ancho similar.",
        hairstyles: [
          "Casi cualquier peinado te favorece gracias a tus proporciones equilibradas",
          "El flequillo de lado aporta elegancia",
          "Las capas largas crean movimiento",
          "Los cortes bob enmarcan bien tu rostro",
          "Los cortes muy cortos realzan tus rasgos",
        ],
        glasses: [
          "Las monturas oversize encajan con tus proporciones",
          "Las monturas ojo de gato añaden sofisticación",
          "Las gafas aviador crean un look clásico",
          "Las monturas cuadradas aportan contraste",
        ],
        makeup: [
          "Ilumina los pómulos para dar definición",
          "Usa un contorno suave para realzar tu forma natural",
          "Aplica el colorete en las manzanas de las mejillas",
          "Mantén las cejas cuidadas y ligeramente arqueadas",
        ],
      },
      round: {
        name: "Redondo",
        reasoning:
          "Tu rostro tiene un largo y un ancho similares, con rasgos suaves y redondeados. La línea de la mandíbula es curva, sin ángulos marcados.",
        hairstyles: [
          "Los cortes largos y en capas alargan visualmente el rostro",
          "La raya al lado crea asimetría y sensación de largura",
          "Los bob angulares aportan definición",
          "Evita los flequillos rectos y pesados, que ensanchan el rostro",
          "Las ondas que empiezan por debajo de la barbilla funcionan bien",
        ],
        glasses: [
          "Las monturas rectangulares aportan longitud",
          "Las monturas angulares tipo ojo de gato crean definición",
          "Las formas geométricas dan contraste",
          "Evita las monturas redondas, que acentúan la redondez",
        ],
        makeup: [
          "Contornea las sienes y la mandíbula para dar definición",
          "Ilumina el centro del rostro en vertical",
          "Aplica el colorete en diagonal hacia las sienes",
          "Usa tonos más oscuros en los laterales del rostro",
        ],
      },
      square: {
        name: "Cuadrado",
        reasoning:
          "Tu rostro tiene una mandíbula fuerte y angulosa y un ancho equilibrado. La frente y la mandíbula tienen un ancho similar, lo que da una apariencia cuadrada.",
        hairstyles: [
          "Las ondas suaves atenúan los rasgos angulosos",
          "Los cortes en capas aportan movimiento y suavidad",
          "Los estilos con el flequillo de lado equilibran una mandíbula marcada",
          "Evita los cortes rectos y pesados que acentúan los ángulos",
          "El pelo largo con capas queda muy bien",
        ],
        glasses: [
          "Las monturas redondas suavizan los rasgos angulosos",
          "Las monturas ovaladas crean equilibrio",
          "Las monturas ojo de gato con curvas aportan suavidad",
          "Evita las monturas cuadradas, que acentúan los ángulos",
        ],
        makeup: [
          "Suaviza la mandíbula con un contorno ligero",
          "Aplica el colorete de forma redondeada",
          "Ilumina los pómulos y el centro del rostro",
          "Evita los contornos marcados en la mandíbula",
        ],
      },
      heart: {
        name: "Corazón",
        reasoning:
          "Tu rostro es más ancho en la frente y se estrecha hasta una barbilla más pequeña y puntiaguda, lo que da forma de corazón.",
        hairstyles: [
          "Los bob a la altura de la barbilla equilibran las proporciones",
          "El flequillo de lado suaviza una frente ancha",
          "Las ondas a la altura de la barbilla añaden anchura abajo",
          "Evita el volumen en la coronilla",
          "Las puntas con textura crean equilibrio",
        ],
        glasses: [
          "Las monturas con más peso en la parte inferior equilibran una frente ancha",
          "Las gafas aviador favorecen esta forma",
          "Las monturas ojo de gato complementan tus rasgos",
          "Monturas al aire o de colores claros en la parte superior",
        ],
        makeup: [
          "Contornea las sienes para reducir la anchura",
          "Ilumina la barbilla para añadir anchura",
          "Aplica el colorete en las manzanas de las mejillas",
          "Equilibra las proporciones con iluminador bien colocado",
        ],
      },
      diamond: {
        name: "Diamante",
        reasoning:
          "Tu rostro es más ancho a la altura de los pómulos, con la frente y la barbilla más estrechas. Los rasgos angulosos dan forma de diamante.",
        hairstyles: [
          "La raya al lado crea asimetría",
          "Los estilos con textura añaden suavidad",
          "Los cortes a la altura de la barbilla equilibran las proporciones",
          "Un flequillo suave reduce la anchura de los pómulos",
          "Las ondas y los rizos aportan suavidad",
        ],
        glasses: [
          "Las monturas ovaladas complementan los rasgos angulosos",
          "Las monturas al aire no compiten con los pómulos",
          "Las monturas ojo de gato funcionan bien",
          "Evita las monturas más anchas que los pómulos",
        ],
        makeup: [
          "Suaviza los pómulos prominentes difuminando bien",
          "Ilumina la frente y la barbilla",
          "Usa técnicas de contorno suave",
          "Equilibra las proporciones colocando bien los productos",
        ],
      },
      oblong: {
        name: "Alargado (rectangular)",
        reasoning:
          "Tu rostro es alargado, con un ancho similar de arriba abajo. El largo es claramente mayor que el ancho.",
        hairstyles: [
          "Los cortes a la altura de los hombros añaden anchura",
          "El flequillo recto acorta visualmente el rostro",
          "Las ondas y los rizos añaden volumen y anchura",
          "Evita el pelo largo y liso, que alarga más",
          "Las capas a la altura de los pómulos funcionan bien",
        ],
        glasses: [
          "Las monturas oversize añaden anchura",
          "Las monturas de lente alta acortan visualmente el rostro",
          "Las patillas decoradas llevan la mirada en horizontal",
          "Evita las monturas estrechas, que alargan",
        ],
        makeup: [
          "Contornea la línea del cabello y la barbilla para acortar",
          "Aplica el colorete en horizontal sobre las mejillas",
          "Da sensación de anchura con iluminador bien colocado",
          "Evita los contornos verticales",
        ],
      },
      triangle: {
        name: "Triangular (pera)",
        reasoning:
          "Tu rostro es más ancho a la altura de la mandíbula y se estrecha hacia la frente, formando un triángulo o una pera.",
        hairstyles: [
          "Añade volumen en la coronilla para equilibrar",
          "El flequillo de lado aporta anchura arriba",
          "Los cortes cortos y en capas funcionan bien",
          "Evita los bob a la altura de la barbilla",
          "Los estilos con textura en la parte superior equilibran",
        ],
        glasses: [
          "Las monturas con más peso arriba equilibran una mandíbula ancha",
          "Las monturas ojo de gato añaden anchura arriba",
          "Las monturas tipo browline crean equilibrio",
          "Evita las monturas con más peso abajo",
        ],
        makeup: [
          "Contornea la mandíbula para reducir la anchura",
          "Ilumina la frente para añadir anchura",
          "Aplica el colorete en la parte alta de las mejillas",
          "Equilibra las proporciones con iluminador",
        ],
      },
    },
  },
  ja: {
    title: (shape) => `あなたの顔型:${shape}`,
    measurementsHeading: "主な測定値",
    lengthWidth: "縦横比(長さ÷幅)",
    foreheadJaw: "額幅÷フェイスライン幅",
    chinAngle: "あごの角度",
    shapeLabel: "顔型",
    hairstyles: "✨ おすすめの髪型",
    glasses: "👓 おすすめのメガネ",
    makeup: "💄 メイクのヒント",
    celebrities: "⭐ 同じ顔型の有名人",
    celebritiesIntro: (shape) => `${shape}タイプの有名人:`,
    note: "結果が2つの顔型の境目にあたる場合もあります。多くの人が2タイプの特徴を併せ持っているので自然なことです。髪をまとめて顔をまっすぐにした別の写真でも試してみてください。",
    photo: {
      lengthWidth: (ratio) => `縦÷横 ${ratio}`,
      foreheadJaw: (ratio) => `額÷あご ${ratio}`,
      chinAngle: (degrees) => `あご ${degrees}°`,
    },
    shapes: {
      oval: {
        name: "卵型",
        reasoning:
          "顔のバランスがよく、輪郭がなめらかな曲線を描いています。縦の長さは横幅の約1.5倍で、額とフェイスラインの幅も近い比率です。",
        hairstyles: [
          "バランスのよい輪郭なので、ほとんどの髪型が似合います",
          "サイドに流す前髪が上品な印象に",
          "ロングのレイヤーで動きを出せます",
          "ボブは輪郭をきれいに見せます",
          "ショートカットは目鼻立ちを引き立てます",
        ],
        glasses: [
          "大きめのフレームがバランスに合います",
          "キャッツアイ型は洗練された印象に",
          "ティアドロップ型で定番の雰囲気に",
          "スクエア型でほどよいコントラストを",
        ],
        makeup: [
          "頬骨にハイライトを入れて立体感を",
          "ごく軽いシェーディングで自然な輪郭を引き立てる",
          "チークは頬の高い位置に丸くのせる",
          "眉は整えて、ゆるやかなアーチに",
        ],
      },
      round: {
        name: "丸顔",
        reasoning:
          "縦と横の長さがほぼ同じで、やわらかく丸みのある印象です。フェイスラインはなだらかな曲線で、角ばった部分はあまりありません。",
        hairstyles: [
          "長めのレイヤーカットで縦のラインを強調",
          "サイドパートで非対称さと縦長感を",
          "角のあるボブで輪郭にシャープさを",
          "横に広がって見える重い一直線の前髪は避ける",
          "あごより下から始まるウェーブがよく合います",
        ],
        glasses: [
          "長方形のフレームで縦の長さをプラス",
          "角のあるキャッツアイでシャープな印象に",
          "幾何学的な形でコントラストを",
          "丸さが強調される丸型フレームは避ける",
        ],
        makeup: [
          "こめかみとフェイスラインにシェーディングで引き締め",
          "顔の中心を縦にハイライト",
          "チークはこめかみに向けて斜めに入れる",
          "顔の両サイドにやや濃い色をのせる",
        ],
      },
      square: {
        name: "四角型(ベース型)",
        reasoning:
          "エラ(フェイスライン)がしっかりして角張っており、横幅のバランスも取れています。額とフェイスラインの幅が近いため、四角い印象になります。",
        hairstyles: [
          "ゆるやかなウェーブで角ばった印象をやわらげる",
          "レイヤーカットで動きとやわらかさを",
          "サイドに流すスタイルで強いフェイスラインのバランスを取る",
          "角を強調する重く切りそろえたスタイルは避ける",
          "レイヤーを入れたロングヘアがよく合います",
        ],
        glasses: [
          "丸型フレームで角ばった印象をやわらげる",
          "オーバル型でバランスを取る",
          "曲線のあるキャッツアイでやわらかさをプラス",
          "角が強調されるスクエア型は避ける",
        ],
        makeup: [
          "軽いシェーディングでフェイスラインをやわらげる",
          "チークは丸くのせる",
          "頬骨と顔の中心にハイライトを",
          "フェイスラインへの強いシェーディングは避ける",
        ],
      },
      heart: {
        name: "逆三角形(ハート型)",
        reasoning:
          "額がいちばん広く、あごに向かって細くなる形です。あごが小さくとがって見えるため、ハート型の印象になります。",
        hairstyles: [
          "あごラインのボブで全体のバランスを整える",
          "サイドに流す前髪で広めの額をやわらげる",
          "あご周りのウェーブで下側にボリュームを",
          "トップ(頭頂部)のボリュームは控えめに",
          "毛先に動きを出してバランスを取る",
        ],
        glasses: [
          "下側に重心のあるフレームで広い額とのバランスを取る",
          "ティアドロップ型がよく合います",
          "キャッツアイ型が顔立ちを引き立てる",
          "リムレスや上部が淡い色のフレームもおすすめ",
        ],
        makeup: [
          "こめかみにシェーディングを入れて広さを抑える",
          "あごにハイライトを入れて横幅を足す",
          "チークは頬の高い位置にのせる",
          "ハイライトの位置でバランスを整える",
        ],
      },
      diamond: {
        name: "ひし形",
        reasoning:
          "頬骨がいちばん広く、額とあごが細めです。角のある輪郭がひし形の印象をつくります。",
        hairstyles: [
          "サイドパートで非対称さを出す",
          "質感のあるスタイルでやわらかさを",
          "あごラインの長さでバランスを取る",
          "やわらかい前髪で頬骨の幅を目立たなくする",
          "ウェーブやカールでやわらかい印象に",
        ],
        glasses: [
          "オーバル型は角のある輪郭と相性がよい",
          "リムレスは頬骨と競合しない",
          "キャッツアイ型もおすすめ",
          "頬骨より幅の広いフレームは避ける",
        ],
        makeup: [
          "目立つ頬骨はぼかしてやわらげる",
          "額とあごにハイライトを",
          "やわらかいシェーディングの技法を使う",
          "ハイライトやシェードの位置でバランスを整える",
        ],
      },
      oblong: {
        name: "面長(長方形)",
        reasoning:
          "縦に長く、横幅がほぼ一定の輪郭です。縦の長さが横幅よりも明らかに長くなっています。",
        hairstyles: [
          "肩までの長さのカットで横幅をプラス",
          "ぱっつん前髪で顔の縦の長さを短く見せる",
          "ウェーブやカールでボリュームと横の広がりを",
          "縦のラインを強調するストレートのロングは避ける",
          "頬骨の高さにレイヤーを入れる",
        ],
        glasses: [
          "大きめのフレームで横幅をプラス",
          "レンズに高さのあるフレームで縦の長さを短く見せる",
          "装飾のあるテンプルで視線を横に誘導",
          "細いフレームは縦長が強調されるので避ける",
        ],
        makeup: [
          "生え際とあごにシェーディングを入れて短く見せる",
          "チークは頬の横方向に入れる",
          "ハイライトの位置で横の広がりを演出",
          "縦方向のシェーディングは避ける",
        ],
      },
      triangle: {
        name: "三角型(洋梨型)",
        reasoning:
          "フェイスラインがいちばん広く、額に向かって狭くなる輪郭です。三角形や洋梨のような印象になります。",
        hairstyles: [
          "トップ(頭頂部)にボリュームを出してバランスを取る",
          "サイドに流す前髪で上部に横幅をプラス",
          "ショートレイヤーがよく合います",
          "あごラインのボブは避ける",
          "トップに質感のあるスタイルでバランスを整える",
        ],
        glasses: [
          "上側に重心のあるフレームで広いフェイスラインとのバランスを取る",
          "キャッツアイ型で上部に横幅をプラス",
          "ブロウライン(ブロータイプ)でバランスを",
          "下側に重心のあるフレームは避ける",
        ],
        makeup: [
          "フェイスラインにシェーディングを入れて幅を抑える",
          "額にハイライトを入れて横幅を足す",
          "チークは頬の上の方にのせる",
          "ハイライトでバランスを整える",
        ],
      },
    },
  },
};

const calculate = (landmarks: any[]): FaceShapeResult => classifyFaceShape(extractMeasurements(landmarks));

const TipList: React.FC<{ title: string; items: string[] }> = ({ title, items }) => (
  <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6">
    <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="text-slate-300 text-sm flex items-start gap-2">
          <span className="text-indigo-400 mt-0.5">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  </div>
);

const Results: React.FC<ResultsProps> = ({ result, locale, context }) => {
  const t = engineStrings(T, locale, "face-shape");
  const r = result as FaceShapeResult;
  const shape = t.shapes[r.shape];
  const m = r.measurements;
  const tiles = [
    { layer: "lengthWidth", label: t.lengthWidth, value: `${formatNumber(m.lengthToWidthRatio, locale, 2)} : 1` },
    { layer: "foreheadJaw", label: t.foreheadJaw, value: `${formatNumber(m.foreheadToJawRatio, locale, 2)} : 1` },
    { layer: "chinAngle", label: t.chinAngle, value: `${formatNumber(m.chinAngle, locale, 0)}°` },
    { layer: "shape", label: t.shapeLabel, value: shape.name, accent: true },
  ];
  const layers = [
    lengthWidthLayer({ id: "lengthWidth", label: t.photo.lengthWidth }),
    foreheadJawLayer({ id: "foreheadJaw", label: t.photo.foreheadJaw }),
    chinAngleLayer({ id: "chinAngle", label: t.photo.chinAngle }),
    contourLayer({ id: "shape", label: shape.name }),
  ];

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-3xl p-8 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">{t.title(shape.name)}</h2>
        <p className="text-slate-300 max-w-2xl mx-auto leading-relaxed">{shape.reasoning}</p>
      </div>

      <AnnotatedResult context={context} locale={locale} layers={layers} defaultLayer="shape">
        <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-4 sm:p-5">
          <h3 className="text-xl font-semibold text-white mb-3 px-1">{t.measurementsHeading}</h3>
          <div className="grid grid-cols-2 gap-2">
            {tiles.map((tile) => (
              <LayerRow key={tile.layer} layer={tile.layer} className="block p-1">
                <div className="bg-slate-800/50 rounded-lg p-3.5 h-full">
                  <p className="text-slate-400 text-sm mb-1 flex items-start gap-2">
                    <span className="mt-1.5">
                      <LayerDot layer={tile.layer} />
                    </span>
                    {tile.label}
                  </p>
                  <p className={`text-xl sm:text-2xl font-bold ${tile.accent ? "text-indigo-400" : "text-white"}`}>{tile.value}</p>
                </div>
              </LayerRow>
            ))}
          </div>
        </div>
      </AnnotatedResult>

      <div className="grid md:grid-cols-2 gap-5">
        <TipList title={t.hairstyles} items={shape.hairstyles} />
        <TipList title={t.glasses} items={shape.glasses} />
        <TipList title={t.makeup} items={shape.makeup} />
        <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6">
          <h3 className="text-lg font-semibold text-white mb-3">{t.celebrities}</h3>
          <p className="text-slate-400 text-sm mb-3">{t.celebritiesIntro(shape.name)}</p>
          <div className="flex flex-wrap gap-2">
            {r.recommendations.celebrities.map((name) => (
              <span key={name} className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-sm">
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
      <Note>{t.note}</Note>
    </div>
  );
};

export const faceShapeEngine: Engine = { calculate, Results };

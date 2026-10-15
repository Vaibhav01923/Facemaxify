import React from "react";
import type { Locale, UiStrings } from "./types";

// Interface text shared by every page of a language. Page-specific copy (titles, hero text,
// articles) lives in pages.ts and content/i18n/<locale>/*.md; results copy lives next to
// each measuring engine in components/i18n/engines/.
export const UI: Record<Locale, UiStrings> = {
  es: {
    navHub: "Herramientas gratis",
    navFullReport: "Informe completo",
    logoLabel: "Logotipo de Facemaxify",
    relatedHeading: "Más herramientas gratuitas",
    allToolsLink: "Ver todas las herramientas",
    disclaimerHeading: "Qué mide esta herramienta (y qué no)",
    disclaimer:
      "Facemaxify mide proporciones geométricas de una sola foto en 2D. No mide la piel, la expresión, el peinado, el estilo ni la personalidad, y los valores de referencia son proporciones generales que varían entre poblaciones. Tómalo como una referencia orientativa, no como un veredicto sobre ti. Si tu aspecto te genera angustia constante, hablar con alguien de confianza o con un profesional de la salud mental puede ayudarte.",
    fullReportNote:
      "El informe completo de Facemaxify está en inglés, requiere iniciar sesión y, a diferencia de estas herramientas gratuitas, sube tu foto para generar los informes.",
    languageNavLabel: "Idioma",
    shell: {
      uploadTitle: "Sube una foto frontal",
      uploadHint: "JPG, PNG o WEBP · Máx. 10 MB · De frente, sin inclinar la cabeza",
      uploadedAlt: "foto subida",
      analyzing: "Analizando...",
      notAnImage: "Sube un archivo de imagen.",
      tooLarge: "La imagen debe pesar menos de 10 MB.",
      noFace: "No se detectó ningún rostro. Usa una foto frontal y nítida.",
      failed: "El análisis falló. Prueba con otra foto.",
      ctaTitle: "¿Quieres el análisis más preciso?",
      ctaBody: (
        <>
          Sube tu foto al informe completo de Facemaxify (en inglés):{" "}
          <span className="text-slate-200">más de 20 proporciones faciales</span>, como el ángulo y el ancho de la mandíbula
          o la relación ancho-alto del rostro, además de tu{" "}
          <span className="text-slate-200">puntuación de atractivo facial</span> global.
        </>
      ),
      ctaButton: "Ver mi informe completo",
      another: "← Analizar otra foto",
      footnote: "Tu foto no se sube: el análisis se hace en tu propio navegador.",
    },
    photo: {
      alt: "Tu foto con el contorno del rostro y las medidas dibujadas encima",
      hint: "Toca una medida de la lista para ver dónde se mide en tu foto.",
    },
    fullReport: {
      heading: "El informe completo de Facemaxify",
      intro:
        "Cada herramienta gratuita mide una sola cosa. El informe completo analiza todo tu rostro a partir de una foto y te dice qué hacer con el resultado.",
      features: [
        "Más de 25 proporciones faciales, cada una con tu valor, el rango ideal y una nota de 0 a 10 (la vista previa gratuita muestra 3).",
        "Plan personalizado con IA: mejoras sin cirugía (grasa corporal, piel, estilo) y, aparte, orientación sobre procedimientos médicos, según tus proporciones.",
        "Análisis de colores personales: tu paleta de temporada, el subtono de tu piel y los mejores colores de ropa.",
        "Análisis de peinados: cuáles te favorecen, cuáles están bien y cuáles evitar según la forma de tu rostro.",
        "Informe de piel con IA: tu tipo de piel, lo que conviene mejorar y una rutina de mañana y de noche.",
        "Guías de mejora facial para llevar el plan a la práctica.",
      ],
      priceLine: (price) => `${price} USD · pago único · acceso de por vida`,
      notes: [
        "Los textos que genera la IA (resumen, consejos, rutina de piel) se escriben en español. Los menús, los nombres de las medidas y las guías siguen en inglés por ahora.",
        "Para generar el informe hay que iniciar sesión y, a diferencia de las herramientas gratuitas, tu foto se sube y se procesa con modelos de IA de Google y OpenAI.",
      ],
      button: "Ver el informe completo",
      imageAlt: "Vista previa del informe completo de Facemaxify: proporciones faciales con su puntuación",
    },
  },
  ja: {
    navHub: "無料ツール一覧",
    navFullReport: "フルレポート",
    logoLabel: "Facemaxifyのロゴ",
    relatedHeading: "ほかの無料診断ツール",
    allToolsLink: "ツール一覧を見る",
    disclaimerHeading: "この診断でわかること・わからないこと",
    disclaimer:
      "Facemaxifyは、1枚の2D写真から顔の比率などの幾何学的な特徴を測定します。肌の状態・表情・髪型・雰囲気・人柄は測定できません。基準値は一般的な比率で、地域や人種によって平均は異なります。結果はあくまで目安として楽しむもので、あなたの価値を決めるものではありません。外見への不安が強く続くときは、信頼できる人や専門家に相談してください。",
    fullReportNote:
      "Facemaxifyのフルレポートは現在英語のみで、ログインが必要です。この無料ツールとは異なり、レポート作成のために写真がサーバーに送信されます。",
    languageNavLabel: "言語",
    shell: {
      uploadTitle: "正面の顔写真をアップロード",
      uploadHint: "JPG・PNG・WEBP／10MBまで／正面向き・顔を傾けない",
      uploadedAlt: "アップロードした写真",
      analyzing: "診断中...",
      notAnImage: "画像ファイルをアップロードしてください。",
      tooLarge: "画像は10MB未満にしてください。",
      noFace: "顔を検出できませんでした。正面から撮った鮮明な写真を使ってください。",
      failed: "診断に失敗しました。別の写真でお試しください。",
      ctaTitle: "もっと精度の高い診断を受けますか?",
      ctaBody: (
        <>
          フルレポート(英語版)では、<span className="text-slate-200">20以上の顔の比率</span>
          (顎の角度・顎の幅・顔の縦横比など)と、総合的な<span className="text-slate-200">顔の魅力スコア</span>
          を確認できます。
        </>
      ),
      ctaButton: "フルレポートを見る",
      another: "← 別の写真を診断する",
      footnote: "写真はアップロードされません。診断はお使いのブラウザ内で行われます。",
    },
    photo: {
      alt: "顔の輪郭と測定位置を重ねたあなたの写真",
      hint: "項目をタップすると、写真のどこを測っているかが表示されます。",
    },
    fullReport: {
      heading: "Facemaxify フルレポート",
      intro:
        "無料ツールは、それぞれ1つの項目を測ります。フルレポートは、1枚の写真から顔全体を分析し、結果をどう活かすかまで示します。",
      features: [
        "25以上の顔の比率。それぞれにあなたの値・理想の範囲・10点満点のスコアを表示します(無料プレビューで見られるのは3つ)。",
        "AIによる個別プラン。手術なしの改善(体脂肪・肌・スタイル)と、別枠で医療的な施術についての考え方を、あなたの比率にもとづいて提示します。",
        "パーソナルカラー分析。シーズンごとのパレット、肌のアンダートーン、似合う服の色がわかります。",
        "ヘアスタイル分析。顔型に合わせて、似合う髪型・普通の髪型・避けたい髪型を示します。",
        "AI肌レポート。肌タイプ、気になる点、朝と夜のスキンケアルーティンを提案します。",
        "プランを実践するための、顔の改善ガイド。",
      ],
      priceLine: (price) => `${price}(USD)・買い切り・ずっと使える`,
      notes: [
        "AIが生成する文章(総評・アドバイス・肌のルーティンなど)は日本語で表示されます。メニュー、測定項目の名前、ガイドは今のところ英語です。",
        "レポートの作成にはログインが必要で、無料ツールとは異なり、写真がアップロードされ、GoogleとOpenAIのAIモデルで処理されます。",
      ],
      button: "フルレポートを見る",
      imageAlt: "Facemaxifyフルレポートのプレビュー(顔の比率とスコア)",
    },
  },
};

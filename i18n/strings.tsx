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
  },
};

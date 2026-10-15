import type { LocalizedHub, LocalizedPage } from "./types";

// Page copy for every localized tool page and hub. The long article under each page lives in
// content/i18n/<locale>/<slug>.md (hubs: content/i18n/<locale>/hub.md).
//
// Each page is written around the keyword people in that language actually search, not
// translated word for word from the English page — see I18N_GUIDE.md for the keyword research
// behind these choices.

const UPDATED = "2026-10-15";

export const LOCALIZED_PAGES: LocalizedPage[] = [
  // ───────────────────────────── Español ─────────────────────────────
  {
    locale: "es",
    slug: "test-de-belleza",
    group: "attractiveness",
    engine: "attractiveness",
    updated: UPDATED,
    seo: {
      title: "Test de belleza facial con IA: tu puntuación gratis | Facemaxify",
      description:
        "Haz el test de belleza facial gratis. La IA mide simetría, mandíbula y proporciones y te da una puntuación de 0 a 100. Sin registro; tu foto no se sube.",
      keywords:
        "test de belleza, test de belleza facial, medidor de belleza, test de atractivo, medidor de atractivo facial, qué tan guapo soy, puntuación de belleza",
    },
    hero: {
      badge: "Gratis · Sin registro · Tu foto no se sube",
      h1: "Test de belleza facial",
      intro:
        "Sube una foto frontal y la IA mide cinco rasgos que la investigación relaciona con la belleza facial: simetría, mandíbula, rasgos juveniles, nariz y distancia entre los ojos. Obtienes una puntuación de 0 a 100 y el detalle de cada rasgo.",
    },
    analyzeLabel: "Calcular mi puntuación de belleza",
    schemaName: "Test de belleza facial",
    card: {
      title: "Test de belleza facial",
      blurb: "Puntuación de 0 a 100 con cinco rasgos: simetría, mandíbula, rasgos juveniles, nariz y ojos.",
    },
    related: ["simetria-facial", "ojos-de-cazador", "tipo-de-rostro"],
  },
  {
    locale: "es",
    slug: "ojos-de-cazador",
    group: "hunter-eyes",
    engine: "hunter-eyes",
    updated: UPDATED,
    seo: {
      title: "Test de ojos de cazador con IA: ¿tienes hunter eyes? | Facemaxify",
      description:
        "Descubre gratis si tienes ojos de cazador, semi-cazador o de presa. La IA mide la apertura del ojo y la inclinación cantal desde una foto. Sin registro.",
      keywords:
        "ojos de cazador, test ojos de cazador, hunter eyes, ojos de presa, inclinación cantal, cómo tener ojos de cazador, forma de ojos",
    },
    hero: {
      badge: "Gratis · Sin registro",
      h1: "Test de ojos de cazador",
      intro:
        "Sube tu foto para saber si tienes ojos de cazador o de presa. Medimos la apertura del ojo y la inclinación cantal, los dos factores que definen esta forma de mirada, y te damos una puntuación al instante.",
    },
    analyzeLabel: "Analizar mis ojos",
    schemaName: "Test de ojos de cazador",
    card: {
      title: "Test de ojos de cazador",
      blurb: "¿Ojos de cazador, semi-cazador, neutros o de presa? Mide apertura e inclinación cantal.",
    },
    related: ["test-de-belleza", "simetria-facial", "tipo-de-rostro"],
  },
  {
    locale: "es",
    slug: "tipo-de-rostro",
    group: "face-shape",
    engine: "face-shape",
    updated: UPDATED,
    seo: {
      title: "Tipo de rostro con IA: descubre la forma de tu cara | Facemaxify",
      description:
        "Averigua gratis qué forma de rostro tienes (ovalado, redondo, cuadrado, corazón…) con una foto. Incluye ideas de cortes de pelo y gafas para tu tipo de cara.",
      keywords:
        "tipo de rostro, forma de rostro, tipo de cara hombre, cómo saber mi tipo de rostro, forma de cara test, test de forma de rostro, rostro ovalado, rostro redondo",
    },
    hero: {
      badge: "Gratis · Sin registro · Tu foto no se sube",
      h1: "Detector de tipo de rostro",
      intro:
        "Sube una foto frontal con el pelo recogido y la IA mide el largo, el ancho de pómulos, frente y mandíbula, y el ángulo de la barbilla para decirte cuál de los siete tipos de rostro se parece más al tuyo.",
    },
    analyzeLabel: "Descubrir mi tipo de rostro",
    schemaName: "Detector de tipo de rostro",
    card: {
      title: "Tipo de rostro",
      blurb: "Ovalado, redondo, cuadrado, corazón… y qué cortes de pelo y gafas te favorecen.",
    },
    related: ["test-de-belleza", "simetria-facial", "ojos-de-cazador"],
  },
  {
    locale: "es",
    slug: "simetria-facial",
    group: "face-symmetry",
    engine: "face-symmetry",
    updated: UPDATED,
    seo: {
      title: "Test de simetría facial con IA: mide tu rostro gratis | Facemaxify",
      description:
        "Mide la simetría de tu cara con una foto: puntuación de 0 a 100 y desglose de 8 zonas (ojos, cejas, boca, pómulos, mandíbula). Gratis y sin registro.",
      keywords:
        "simetría facial, test de simetría facial, simetría del rostro, medir simetría facial, asimetría facial, calculadora de simetría facial",
    },
    hero: {
      badge: "Gratis · Instantáneo · Sin registro",
      h1: "Test de simetría facial",
      intro:
        "Sube una foto frontal y la IA mide la simetría izquierda-derecha en 8 zonas del rostro: ojos, cejas, comisuras de la boca, pómulos, fosas nasales y ángulos de la mandíbula.",
    },
    analyzeLabel: "Analizar mi simetría",
    schemaName: "Test de simetría facial",
    card: {
      title: "Test de simetría facial",
      blurb: "Puntuación de simetría con el desglose de 8 zonas del rostro.",
    },
    related: ["test-de-belleza", "tipo-de-rostro", "ojos-de-cazador"],
  },

  // ───────────────────────────── 日本語 ─────────────────────────────
  {
    locale: "ja",
    slug: "ganmen-hensachi",
    group: "face-rating",
    engine: "face-rating",
    updated: UPDATED,
    seo: {
      title: "顔面偏差値診断【無料】AIが顔の比率から判定 | Facemaxify",
      description:
        "顔面偏差値を無料でAI診断。写真1枚から左右対称性・フェイスライン・黄金比・三分割・鼻の比率を測定し、100点満点のスコアと偏差値の目安を表示。登録不要。",
      keywords: "顔面偏差値, 顔面偏差値 診断, 顔面偏差値 AI, 顔採点, 顔 点数, 顔面偏差値 無料",
    },
    hero: {
      badge: "無料・登録不要・写真は端末内で処理",
      h1: "顔面偏差値診断",
      intro:
        "正面から撮った写真をアップロードすると、AIが左右対称性・フェイスライン・黄金比・顔の三分割・鼻の比率の5項目を測定。100点満点のスコアと、顔面偏差値の目安をすぐに表示します。",
    },
    analyzeLabel: "顔面偏差値を診断する",
    schemaName: "顔面偏差値診断",
    card: {
      title: "顔面偏差値診断",
      blurb: "5つの比率から100点満点のスコアと偏差値の目安を表示。",
    },
    related: ["ikemen-shindan", "bijin-shindan", "ougonhi", "kaogata-shindan"],
  },
  {
    locale: "ja",
    slug: "ikemen-shindan",
    group: "ikemen",
    engine: "looksmax",
    updated: UPDATED,
    seo: {
      title: "イケメン診断【無料】AIが顔の特徴を測定してスコア化 | Facemaxify",
      description:
        "イケメン診断を無料で。写真1枚から左右対称性・フェイスライン・目尻の角度・顔の三分割・目の形を測定し、100点満点でイケメン度を表示。登録不要。",
      keywords: "イケメン診断, イケメン診断 AI, イケメン度, イケメン 診断 無料, 顔診断 男, かっこいい 診断",
    },
    hero: {
      badge: "無料・登録不要・写真は端末内で処理",
      h1: "イケメン診断",
      intro:
        "写真1枚で、左右対称性・フェイスライン・目尻の角度・顔の三分割・目の形の5項目を測定します。100点満点のイケメン度と、項目ごとの強み・伸ばせるポイントがわかります。",
    },
    analyzeLabel: "イケメン度を診断する",
    schemaName: "イケメン診断",
    card: {
      title: "イケメン診断",
      blurb: "左右対称性・フェイスライン・目尻の角度などからイケメン度を判定。",
    },
    related: ["ganmen-hensachi", "bijin-shindan", "kaogata-shindan", "ougonhi"],
  },
  {
    locale: "ja",
    slug: "bijin-shindan",
    group: "attractiveness",
    engine: "attractiveness",
    updated: UPDATED,
    seo: {
      title: "美人診断【無料】AIが顔の対称性・バランスを測定 | Facemaxify",
      description:
        "美人診断を無料で。写真1枚から左右対称性・フェイスライン・若々しさの指標・鼻の比率・目の間隔を測定し、100点満点の美人度を表示。登録不要。",
      keywords: "美人診断, 美人度診断, 美人診断 AI, 美人 診断 無料, 顔 バランス 診断, 顔の魅力 診断",
    },
    hero: {
      badge: "無料・登録不要・写真は端末内で処理",
      h1: "美人診断(美人度診断)",
      intro:
        "顔の左右対称性・フェイスライン・若々しさの指標・鼻の比率・目の間隔。研究で「魅力的な顔」と関連が報告されている5つの特徴を測定し、100点満点の美人度として表示します。",
    },
    analyzeLabel: "美人度を診断する",
    schemaName: "美人診断",
    card: {
      title: "美人診断",
      blurb: "対称性・若々しさの指標・顔のバランスから美人度を判定。",
    },
    related: ["ganmen-hensachi", "ikemen-shindan", "ougonhi", "kaogata-shindan"],
  },
  {
    locale: "ja",
    slug: "ougonhi",
    group: "golden-ratio",
    engine: "golden-ratio",
    updated: UPDATED,
    seo: {
      title: "顔の黄金比診断【無料】AIが3つの比率を測定 | Facemaxify",
      description:
        "あなたの顔は黄金比(1:1.618)にどれだけ近い?口と鼻の幅・鼻下からあごの比率・目と口の幅を写真から測定。登録不要・無料で診断できます。",
      keywords: "顔の黄金比, 顔 黄金比 診断, 黄金比 顔 AI, 黄金比 顔 測り方, 黄金比 顔 無料, 美人 比率",
    },
    hero: {
      badge: "無料・登録不要・写真は端末内で処理",
      h1: "顔の黄金比診断",
      intro:
        "黄金比(約1:1.618)は「美しい比率」として語られてきました。口と鼻の幅・鼻下からあごの比率・目と口の幅という3つの比率を写真から測定し、黄金比との近さを表示します。",
    },
    analyzeLabel: "黄金比を測定する",
    schemaName: "顔の黄金比診断",
    card: {
      title: "顔の黄金比診断",
      blurb: "3つの比率が黄金比(1:1.618)にどれだけ近いかを測定。",
    },
    related: ["ganmen-hensachi", "bijin-shindan", "kaogata-shindan", "ikemen-shindan"],
  },
  {
    locale: "ja",
    slug: "kaogata-shindan",
    group: "face-shape",
    engine: "face-shape",
    updated: UPDATED,
    seo: {
      title: "顔型診断【無料】AIで卵型・丸顔・面長など7タイプを判定 | Facemaxify",
      description:
        "顔型診断を無料で。写真1枚から卵型・丸顔・ベース型・逆三角形・ひし形・面長・三角型の7タイプを判定し、似合う髪型・メガネ・メイクの目安も表示します。",
      keywords: "顔型診断, 顔型診断 AI, 輪郭診断, 顔の形 診断, 顔型 男, 卵型 丸顔 面長, 顔型診断 無料",
    },
    hero: {
      badge: "無料・登録不要・写真は端末内で処理",
      h1: "顔型診断",
      intro:
        "髪をまとめた正面の写真をアップロードすると、顔の長さ・頬骨・額・フェイスラインの幅とあごの角度を測定し、7つの顔型のうちどれに近いかを判定。似合う髪型やメガネの目安も紹介します。",
    },
    analyzeLabel: "顔型を診断する",
    schemaName: "顔型診断",
    card: {
      title: "顔型診断",
      blurb: "卵型・丸顔・面長など7タイプを判定し、似合う髪型も紹介。",
    },
    related: ["ganmen-hensachi", "ikemen-shindan", "bijin-shindan", "ougonhi"],
  },
];

export const LOCALIZED_HUBS: LocalizedHub[] = [
  {
    locale: "es",
    updated: UPDATED,
    seo: {
      title: "Análisis facial gratis con IA: herramientas en español | Facemaxify",
      description:
        "Herramientas gratuitas de análisis facial con IA: test de belleza, ojos de cazador, tipo de rostro y simetría facial. Todo se calcula en tu navegador.",
      keywords:
        "análisis facial, análisis facial gratis, análisis facial con IA, test de belleza facial, tipo de rostro, simetría facial, ojos de cazador",
    },
    hero: {
      badge: "Gratis · Sin registro · Tu foto no se sube",
      h1: "Análisis facial gratis con IA",
      intro:
        "Herramientas que miden proporciones concretas de tu rostro a partir de una sola foto frontal: belleza facial, forma del rostro, simetría y forma de los ojos. Todo se calcula en tu navegador.",
    },
    toolsHeading: "Elige una herramienta",
  },
  {
    locale: "ja",
    updated: UPDATED,
    seo: {
      title: "AI顔診断【無料】顔面偏差値・イケメン診断・顔型診断 | Facemaxify",
      description:
        "無料のAI顔診断ツール集。顔面偏差値・イケメン診断・美人診断・顔の黄金比・顔型診断。写真1枚で診断でき、画像はブラウザ内で処理されて保存されません。",
      keywords:
        "顔診断, AI顔診断, 顔診断 AI, 顔分析, 顔面偏差値, イケメン診断, 美人診断, 顔型診断, 顔の黄金比",
    },
    hero: {
      badge: "無料・登録不要・写真は端末内で処理",
      h1: "AI顔診断",
      intro:
        "正面から撮った写真1枚から、顔の比率・左右対称性・顔型などを測定する無料ツール集です。診断はすべてお使いのブラウザ内で行われ、写真はアップロードされません。",
    },
    toolsHeading: "診断ツールを選ぶ",
  },
];

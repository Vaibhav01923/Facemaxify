import type { RatioMetricKey } from "../services/ratioCalculator";

type PageCategory = "feature" | "high-intent" | "adjacent";

interface PageSection {
  title: string;
  paragraphs: string[];
}

interface PageFaq {
  question: string;
  answer: string;
}

interface AnalyzerConfig {
  title: string;
  description: string;
  unlockedMetricKeys: RatioMetricKey[];
  lockedMetricKeys?: RatioMetricKey[];
  aggregateMetricKeys?: RatioMetricKey[];
  scoreLabel: string;
  resultPrefix: string;
}

export interface SeoLandingPageConfig {
  slug: string;
  category: PageCategory;
  title: string;
  description: string;
  keywords: string;
  heroTitle: string;
  heroDescription: string;
  intro: string[];
  bullets: string[];
  sections: PageSection[];
  faqs: PageFaq[];
  analyzer: AnalyzerConfig;
}

const featurePage = (config: {
  slug: string;
  heroTitle: string;
  description: string;
  keywords: string;
  unlockedMetricKeys: RatioMetricKey[];
  lockedMetricKeys?: RatioMetricKey[];
  toolHook: string;
  sections: PageSection[];
  faqs: PageFaq[];
}): SeoLandingPageConfig => ({
  slug: config.slug,
  category: "feature",
  title: `${config.heroTitle} - Free Photo-Based ${config.heroTitle}`,
  description: config.description,
  keywords: config.keywords,
  heroTitle: config.heroTitle,
  heroDescription: config.toolHook,
  intro: [
    `${config.heroTitle} pages work best when they show a real measurement instead of vague advice. This tool uses the same MediaPipe-based facial landmark flow as Facemaxify's front analysis, but keeps the output focused on one feature at a time.`,
    "That makes the page useful enough to rank and useful enough to convert, while the full premium tool still keeps the larger multi-metric report, score context, and deeper guidance.",
  ],
  bullets: [
    "Upload a front-facing photo and get a real feature-specific measurement.",
    "Only the lead metric is shown publicly so the page stays useful without leaking the full report.",
    "Locked companion metrics push users into the main premium analysis.",
    "The full Facemaxify tool still gives the broader 25+ ratio context.",
  ],
  sections: config.sections,
  faqs: config.faqs,
  analyzer: {
    title: `${config.heroTitle} Tool`,
    description: config.toolHook,
    unlockedMetricKeys: config.unlockedMetricKeys,
    lockedMetricKeys: config.lockedMetricKeys,
    aggregateMetricKeys: config.unlockedMetricKeys,
    scoreLabel: `${config.heroTitle} preview`,
    resultPrefix: "Preview read",
  },
});

const clusterPage = (config: {
  slug: string;
  heroTitle: string;
  description: string;
  keywords: string;
  aggregateMetricKeys: RatioMetricKey[];
  unlockedMetricKeys: RatioMetricKey[];
  sections: PageSection[];
  faqs: PageFaq[];
  category?: PageCategory;
}): SeoLandingPageConfig => ({
  slug: config.slug,
  category: config.category || "high-intent",
  title: `${config.heroTitle} - Free AI Photo Analysis Tool`,
  description: config.description,
  keywords: config.keywords,
  heroTitle: config.heroTitle,
  heroDescription:
    "Upload a photo, run a real landmark-based preview, and then use the full Facemaxify tool for the deeper premium breakdown.",
  intro: [
    `${config.heroTitle} searches are high intent because people want a result, not generic beauty content. This page uses a real preview built from the same front-analysis pipeline as the main product.`,
    "The public version stays intentionally lighter than the premium product. It gives users enough signal to trust the page, then pushes them into the full analysis for the rest of the story.",
  ],
  bullets: [
    "Real photo-based preview using facial landmarks.",
    "Small subset of true metrics instead of a fake slider tool.",
    "Clear upgrade path into the premium Facemaxify analysis.",
    "Built to rank for non-branded search while protecting the full system.",
  ],
  sections: config.sections,
  faqs: config.faqs,
  analyzer: {
    title: `${config.heroTitle} Tool`,
    description:
      "Run a limited real preview here, then unlock the bigger report and more ratios inside the full Facemaxify analysis.",
    unlockedMetricKeys: config.unlockedMetricKeys,
    aggregateMetricKeys: config.aggregateMetricKeys,
    scoreLabel: `${config.heroTitle} preview`,
    resultPrefix: "Preview read",
  },
});

export const seoLandingPages: SeoLandingPageConfig[] = [
  clusterPage({
    slug: "facial-harmony-analyzer",
    heroTitle: "Facial Harmony Analyzer",
    description:
      "Use a real photo-based preview to estimate facial harmony from key facial ratios, then unlock the full premium breakdown in Facemaxify.",
    keywords:
      "facial harmony analyzer, facial harmony analysis, face harmony analyzer, facial balance analyzer",
    aggregateMetricKeys: ["canthalTilt", "midfaceRatio", "mouthToNoseWidth", "chinPhiltrum", "jawSlope"],
    unlockedMetricKeys: ["canthalTilt", "mouthToNoseWidth", "midfaceRatio"],
    sections: [
      {
        title: "What facial harmony means",
        paragraphs: [
          "Facial harmony is the way your eyes, nose, lips, jaw, and facial thirds work together. It is broader than symmetry alone and usually feels better when the ratios support each other.",
          "This page gives you a smaller real preview so you can test the concept quickly before using the full report.",
        ],
      },
      {
        title: "Why the full tool is deeper",
        paragraphs: [
          "A real harmony read needs more than one or two checks. Facemaxify's premium flow goes much wider and ties the results together with a proper overall score.",
        ],
      },
    ],
    faqs: [
      { question: "What is facial harmony?", answer: "Facial harmony is the overall balance created by your feature relationships, thirds, spacing, and structural ratios." },
      { question: "Is this the full Facemaxify score?", answer: "No. This page shows a limited preview. The full analysis lives in the main Facemaxify tool." },
    ],
  }),
  clusterPage({
    slug: "facial-harmony-score",
    heroTitle: "Facial Harmony Score",
    description:
      "Get a limited facial harmony score preview from a real photo and then unlock the full Facemaxify report for better accuracy.",
    keywords:
      "facial harmony score, harmony score face, face harmony score, facial harmony test",
    aggregateMetricKeys: ["canthalTilt", "midfaceRatio", "mouthToNoseWidth", "chinPhiltrum", "intercanthalNasal"],
    unlockedMetricKeys: ["midfaceRatio", "intercanthalNasal", "chinPhiltrum"],
    sections: [
      {
        title: "What this score previews",
        paragraphs: [
          "This page converts a small set of real front-face measurements into a quick preview score. It is directionally useful, but not as complete as the premium analysis.",
        ],
      },
      {
        title: "How to read the result",
        paragraphs: [
          "Treat the preview as a first pass. If you want the better answer, run the main tool where more metrics and the fuller weighting model are available.",
        ],
      },
    ],
    faqs: [
      { question: "Is this score exact?", answer: "No. It is a limited preview and can be off. The main Facemaxify tool is the more accurate option." },
      { question: "Why show a preview score at all?", answer: "Because it helps users understand the concept quickly before moving into the full report." },
    ],
  }),
  clusterPage({
    slug: "face-ratio-analyzer",
    heroTitle: "Face Ratio Analyzer",
    description:
      "Analyze key facial ratios from your photo and preview how balanced your proportions look before using the full Facemaxify report.",
    keywords:
      "face ratio analyzer, face ratio analysis, facial ratio analyzer, facial ratios",
    aggregateMetricKeys: ["mouthToNoseWidth", "midfaceRatio", "intercanthalNasal", "chinPhiltrum"],
    unlockedMetricKeys: ["mouthToNoseWidth", "midfaceRatio", "chinPhiltrum"],
    sections: [
      {
        title: "Why facial ratios matter",
        paragraphs: [
          "Ratios explain how features relate to each other, not just how large they are in isolation. That is why ratio-based pages usually convert better than vague face-rating pages.",
        ],
      },
      {
        title: "Preview first, full report second",
        paragraphs: [
          "This page shows a few real ratios only. The premium report expands that into a fuller map of the face.",
        ],
      },
    ],
    faqs: [
      { question: "What is face ratio analysis?", answer: "It is the measurement of proportion relationships between major facial landmarks." },
      { question: "Does this page show every ratio?", answer: "No. It shows a limited subset and keeps the deeper system inside the main tool." },
    ],
  }),
  clusterPage({
    slug: "face-symmetry-test",
    heroTitle: "Face Symmetry Test",
    description:
      "Run a real face symmetry preview from your uploaded photo and compare it with the full Facemaxify analysis for deeper accuracy.",
    keywords:
      "face symmetry test, facial symmetry test, face symmetry analyzer, symmetry face test",
    aggregateMetricKeys: ["canthalTilt", "intercanthalNasal", "oneEyeApart"],
    unlockedMetricKeys: ["oneEyeApart", "intercanthalNasal"],
    sections: [
      {
        title: "What symmetry can tell you",
        paragraphs: [
          "Symmetry pages are useful because users immediately understand left-right balance. They are still only one layer of the broader facial picture.",
        ],
      },
      {
        title: "What symmetry misses",
        paragraphs: [
          "A face can have decent symmetry and still have weaker harmony if the proportions are off. That is why the full report matters.",
        ],
      },
    ],
    faqs: [
      { question: "Can a face be perfectly symmetrical?", answer: "Almost never. Minor asymmetry is normal." },
      { question: "Should I use symmetry as the final verdict?", answer: "No. It is helpful, but it is not the whole analysis." },
    ],
  }),
  clusterPage({
    slug: "looksmax-calculator",
    heroTitle: "Looksmax Calculator",
    description:
      "Use a real photo-based preview to estimate aesthetic structure and then unlock the fuller Facemaxify analysis for a more accurate breakdown.",
    keywords:
      "looksmax calculator, looksmaxing calculator, looksmax score, facial improvement calculator",
    aggregateMetricKeys: ["jawSlope", "cheekboneHeight", "canthalTilt", "midfaceRatio", "mouthToNoseWidth"],
    unlockedMetricKeys: ["jawSlope", "cheekboneHeight", "canthalTilt"],
    sections: [
      {
        title: "What a useful looksmax tool should do",
        paragraphs: [
          "A good looksmax page should show objective visual structure, not just throw out a random number. That is why this page uses real facial landmarks.",
        ],
      },
      {
        title: "Where the premium tool fits",
        paragraphs: [
          "The preview gives you a quick read. The premium tool adds much more context, especially when several features interact.",
        ],
      },
    ],
    faqs: [
      { question: "What is a looksmax calculator?", answer: "It is a tool that estimates facial aesthetics or improvement potential from visible structure and ratios." },
      { question: "Is this preview enough on its own?", answer: "It is useful as a teaser, but the full analysis is better if you want detail." },
    ],
  }),

  featurePage({
    slug: "jawline-analyzer",
    heroTitle: "Jawline Analyzer",
    description:
      "Measure jaw slope from your photo with a real landmark-based jawline analyzer, then unlock deeper jaw metrics in the premium Facemaxify tool.",
    keywords:
      "jawline analyzer, jawline analysis, jaw slope analyzer, jaw angle analyzer",
    unlockedMetricKeys: ["jawSlope"],
    lockedMetricKeys: ["jawFrontalAngle", "bigonialWidth"],
    toolHook:
      "Upload a front-facing photo and get a real jaw slope read. The other jaw metrics stay locked until the full premium analysis.",
    sections: [
      {
        title: "What jaw slope measures",
        paragraphs: [
          "Jaw slope captures the angle running from the cheek region toward the chin. It affects how sharp, soft, or descending the jawline reads from the front.",
        ],
      },
      {
        title: "Why only one jaw metric is public here",
        paragraphs: [
          "This page shows jaw slope only. The other jaw metrics are intentionally locked so the premium tool still owns the fuller jawline breakdown.",
        ],
      },
    ],
    faqs: [
      { question: "Does this page show the full jaw analysis?", answer: "No. This page unlocks jaw slope only and keeps the other jaw metrics for the main tool." },
      { question: "Why is jaw slope useful?", answer: "It gives a strong first-pass read on how sharp and structured the jawline appears from the front." },
    ],
  }),
  featurePage({
    slug: "chin-ratio-analyzer",
    heroTitle: "Chin Ratio Analyzer",
    description:
      "Measure chin-to-philtrum balance from your photo with a real chin ratio analyzer built on facial landmarks.",
    keywords:
      "chin ratio analyzer, chin ratio calculator, chin to philtrum ratio, chin proportion analyzer",
    unlockedMetricKeys: ["chinPhiltrum"],
    toolHook:
      "Upload a front-facing photo and preview your chin-to-philtrum ratio using the same landmark pipeline that powers Facemaxify's front analysis.",
    sections: [
      {
        title: "Why chin-to-philtrum ratio matters",
        paragraphs: [
          "Lower-face balance often changes the whole read of a face. Chin-to-philtrum ratio is one of the cleaner ways to preview that balance quickly.",
        ],
      },
      {
        title: "What the premium tool adds",
        paragraphs: [
          "The premium tool adds more lower-face metrics so you can see whether the chin ratio is the main issue or only one part of the pattern.",
        ],
      },
    ],
    faqs: [
      { question: "What is the chin-to-philtrum ratio?", answer: "It compares chin height with philtrum height to preview lower-face proportion." },
      { question: "Why use this page?", answer: "Because it gives you one real lower-face measurement fast without exposing the rest of the premium report." },
    ],
  }),
  featurePage({
    slug: "cheekbone-analyzer",
    heroTitle: "Cheekbone Analyzer",
    description:
      "Check cheekbone height from your photo with a real landmark-based analyzer and then unlock the fuller structure report in Facemaxify.",
    keywords:
      "cheekbone analyzer, cheekbone height analyzer, cheekbone calculator, facial structure cheekbones",
    unlockedMetricKeys: ["cheekboneHeight"],
    toolHook:
      "Upload a front-facing photo to preview cheekbone height from your actual landmark positions.",
    sections: [
      {
        title: "What cheekbone height means",
        paragraphs: [
          "Cheekbone height helps determine how lifted and structured the midface appears. Higher-looking cheekbones often support a sharper overall read.",
        ],
      },
      {
        title: "Why it should not be isolated forever",
        paragraphs: [
          "Cheekbones matter more when viewed with jaw, midface, and eye-area structure. That is why this page previews one metric and the main tool handles the bigger pattern.",
        ],
      },
    ],
    faqs: [
      { question: "Is this actual cheekbone measurement?", answer: "It is a real preview from facial landmarks, not a manual guess." },
      { question: "Do cheekbones alone define attractiveness?", answer: "No. They help, but they work together with other parts of the face." },
    ],
  }),
  featurePage({
    slug: "midface-ratio-calculator",
    heroTitle: "Midface Ratio Calculator",
    description:
      "Measure midface ratio from your uploaded photo with a real front-analysis preview tool.",
    keywords:
      "midface ratio calculator, midface ratio analyzer, midface analysis, midface proportions",
    unlockedMetricKeys: ["midfaceRatio"],
    toolHook:
      "Upload a front-facing photo and preview your midface ratio using the same base pipeline as the main Facemaxify analysis.",
    sections: [
      {
        title: "Why midface ratio is searched so much",
        paragraphs: [
          "Midface ratio strongly affects perceived compactness, balance, and aesthetic sharpness. It is one of the most common feature-specific questions in face analysis.",
        ],
      },
      {
        title: "Where the premium tool goes further",
        paragraphs: [
          "The premium tool shows midface ratio together with thirds, lower-face balance, and eye spacing so the result makes more sense.",
        ],
      },
    ],
    faqs: [
      { question: "What is midface ratio?", answer: "It compares interpupillary distance with midface height to preview how compact or elongated the midface reads." },
      { question: "Is this enough to judge the whole face?", answer: "No. It is useful, but only as one strong structural signal." },
    ],
  }),
  featurePage({
    slug: "lower-third-face-calculator",
    heroTitle: "Lower Third Face Calculator",
    description:
      "Check lower-third facial proportion from your uploaded photo using a real landmark-based preview.",
    keywords:
      "lower third face calculator, lower third face analysis, lower third ratio, lower face proportion",
    unlockedMetricKeys: ["lowerThird"],
    lockedMetricKeys: ["lowerThirdProp"],
    toolHook:
      "Upload a front-facing photo and preview lower-third balance from real landmark geometry.",
    sections: [
      {
        title: "Why the lower third matters",
        paragraphs: [
          "Lower-third balance affects the chin, lip zone, and overall maturity or softness of the face. Small proportion shifts can change the read a lot.",
        ],
      },
      {
        title: "Why the companion metric is locked",
        paragraphs: [
          "This page shows one lower-third preview publicly and leaves the companion lower-face read for the premium tool.",
        ],
      },
    ],
    faqs: [
      { question: "What is the lower third?", answer: "It is the section from the base of the nose down to the chin." },
      { question: "Why does this matter?", answer: "It strongly influences balance between the nose, lips, and chin." },
    ],
  }),
  featurePage({
    slug: "eye-area-analyzer",
    heroTitle: "Eye Area Analyzer",
    description:
      "Preview eye-area structure from your photo with a real landmark-based analyzer for canthal tilt and eye ratio signals.",
    keywords:
      "eye area analyzer, eye area analysis, eye ratio analyzer, canthal tilt eye analysis",
    unlockedMetricKeys: ["canthalTilt"],
    lockedMetricKeys: ["eyeAspectRatio", "oneEyeApart"],
    toolHook:
      "Upload a front-facing photo and preview one real eye-area metric. Extra eye metrics stay locked for the premium report.",
    sections: [
      {
        title: "Why the eye area is so influential",
        paragraphs: [
          "The eye area drives first impression more than almost any other single region. Even one solid eye-area metric can make the page useful.",
        ],
      },
      {
        title: "Why the rest stays inside the premium tool",
        paragraphs: [
          "Facemaxify keeps the bigger eye-area stack locked so users still need the full product for the deeper read.",
        ],
      },
    ],
    faqs: [
      { question: "What do I see on this page?", answer: "A real eye-area preview metric from your photo, plus locked premium companion metrics." },
      { question: "Why lock the other eye metrics?", answer: "To keep the page useful without giving away the fuller premium analysis." },
    ],
  }),
  featurePage({
    slug: "eyebrow-tilt-analyzer",
    heroTitle: "Eyebrow Tilt Analyzer",
    description:
      "Measure eyebrow tilt from your uploaded photo with a real landmark-based analyzer.",
    keywords:
      "eyebrow tilt analyzer, eyebrow tilt calculator, brow tilt analysis, eyebrow angle analyzer",
    unlockedMetricKeys: ["eyebrowTilt"],
    toolHook:
      "Upload a front-facing photo and preview eyebrow tilt using real brow landmarks.",
    sections: [
      {
        title: "Why eyebrow tilt matters",
        paragraphs: [
          "Eyebrow tilt changes the emotional read of the face and can affect whether the eye area looks sharper, flatter, or friendlier.",
        ],
      },
      {
        title: "How the premium analysis expands it",
        paragraphs: [
          "In the full tool, brow metrics make more sense when paired with canthal tilt, eyelid shape, and orbital structure.",
        ],
      },
    ],
    faqs: [
      { question: "Is this measuring both brows?", answer: "Yes. The preview uses both brow sides and averages the result." },
      { question: "Can eyebrow grooming affect the read?", answer: "Yes. Hair shape and styling can change the visual appearance of brow tilt." },
    ],
  }),
  featurePage({
    slug: "mouth-to-nose-ratio-calculator",
    heroTitle: "Mouth To Nose Ratio Calculator",
    description:
      "Measure mouth width to nose width ratio from your photo with a real landmark-based facial proportion tool.",
    keywords:
      "mouth to nose ratio calculator, mouth width to nose width ratio, facial proportion calculator mouth nose",
    unlockedMetricKeys: ["mouthToNoseWidth"],
    toolHook:
      "Upload a front-facing photo and preview your mouth-to-nose width ratio with a real calculation.",
    sections: [
      {
        title: "Why this ratio matters",
        paragraphs: [
          "Mouth width relative to nose width is one of the cleaner front-view proportion checks. It often appears in beauty and harmony discussions because it is easy to interpret.",
        ],
      },
      {
        title: "Why it works well as a landing page",
        paragraphs: [
          "This ratio is specific enough to rank on its own and strong enough to funnel users into the premium tool for supporting context.",
        ],
      },
    ],
    faqs: [
      { question: "What is mouth-to-nose width ratio?", answer: "It compares mouth width with nose width to estimate one part of lower-face proportion balance." },
      { question: "Is one ratio enough?", answer: "No. It helps, but the full product uses a much larger set of metrics." },
    ],
  }),
  featurePage({
    slug: "lip-ratio-analyzer",
    heroTitle: "Lip Ratio Analyzer",
    description:
      "Measure lower-to-upper lip ratio from your uploaded photo with a real landmark-based lip analysis preview.",
    keywords:
      "lip ratio analyzer, lip ratio calculator, upper lower lip ratio, lip proportion analyzer",
    unlockedMetricKeys: ["lipRatio"],
    lockedMetricKeys: ["cupidsBowDepth"],
    toolHook:
      "Upload a front-facing photo and preview one real lip proportion metric while keeping the companion lip detail locked for premium.",
    sections: [
      {
        title: "Why lip ratio matters",
        paragraphs: [
          "Lip ratio influences softness, sharpness, and lower-face balance. It is one of the easiest lip metrics to preview cleanly from a front photo.",
        ],
      },
      {
        title: "Why extra lip detail stays locked",
        paragraphs: [
          "The premium tool adds cupid's bow depth and other surrounding context so users do not overreact to one lip ratio alone.",
        ],
      },
    ],
    faqs: [
      { question: "What is lip ratio?", answer: "It is the relationship between lower-lip height and upper-lip height." },
      { question: "Does expression affect the result?", answer: "Yes. Use a neutral face for the best preview." },
    ],
  }),
  featurePage({
    slug: "nose-width-ratio-calculator",
    heroTitle: "Nose Width Ratio Calculator",
    description:
      "Preview nose-width balance from your uploaded photo with a real facial landmark-based analyzer.",
    keywords:
      "nose width ratio calculator, nose width analyzer, intercanthal nasal ratio, nose bridge width analyzer",
    unlockedMetricKeys: ["intercanthalNasal"],
    lockedMetricKeys: ["noseBridgeWidth"],
    toolHook:
      "Upload a front-facing photo and preview one real nose-width ratio from your facial landmarks.",
    sections: [
      {
        title: "What nose width ratio shows",
        paragraphs: [
          "This preview compares nasal width with inner-eye spacing to show whether the nose reads broad, narrow, or balanced in context.",
        ],
      },
      {
        title: "Why the bridge metric is locked",
        paragraphs: [
          "The premium tool keeps the companion nose bridge metric private so the public page stays useful without exposing the full nose analysis.",
        ],
      },
    ],
    faqs: [
      { question: "What is intercanthal-nasal ratio?", answer: "It compares nose width with inner-eye distance." },
      { question: "Can a single nose metric tell the whole story?", answer: "No. It is useful, but nose shape needs more context in the full product." },
    ],
  }),

  clusterPage({
    slug: "facial-harmony-test",
    heroTitle: "Facial Harmony Test",
    description: "Take a real facial harmony test from your photo using a limited set of actual facial metrics.",
    keywords: "facial harmony test, face harmony test, facial harmony checker, harmony face test",
    aggregateMetricKeys: ["canthalTilt", "midfaceRatio", "mouthToNoseWidth", "chinPhiltrum"],
    unlockedMetricKeys: ["canthalTilt", "midfaceRatio"],
    sections: [{ title: "How this test works", paragraphs: ["This page uses real front-analysis landmarks and a smaller metric subset so you can get a usable harmony preview quickly."] }],
    faqs: [{ question: "Is this a real test?", answer: "Yes, but it is still a limited preview compared with the full tool." }],
  }),
  clusterPage({
    slug: "facial-harmony-calculator",
    heroTitle: "Facial Harmony Calculator",
    description: "Use a real facial harmony calculator preview built on MediaPipe landmarks and a limited metric subset.",
    keywords: "facial harmony calculator, face harmony calculator, harmony calculator face",
    aggregateMetricKeys: ["midfaceRatio", "intercanthalNasal", "mouthToNoseWidth", "jawSlope"],
    unlockedMetricKeys: ["intercanthalNasal", "jawSlope"],
    sections: [{ title: "Why this calculator exists", paragraphs: ["This page gives users a real calculator experience while still saving the larger premium breakdown for the main product."] }],
    faqs: [{ question: "Why is the preview limited?", answer: "So the page can rank and convert without leaking the full premium system." }],
  }),
  clusterPage({
    slug: "facial-proportions-analyzer",
    heroTitle: "Facial Proportions Analyzer",
    description: "Analyze core facial proportions from your uploaded photo using real front-analysis ratios.",
    keywords: "facial proportions analyzer, facial proportions analysis, face proportions analyzer",
    aggregateMetricKeys: ["upperThird", "middleThird", "lowerThird", "midfaceRatio", "mouthToNoseWidth"],
    unlockedMetricKeys: ["middleThird", "lowerThird", "midfaceRatio"],
    sections: [{ title: "What this analyzer focuses on", paragraphs: ["This page focuses on thirds and proportion relationships that drive facial balance in a front-facing photo."] }],
    faqs: [{ question: "What are facial proportions?", answer: "They are the measurable relationships between the main parts of the face." }],
  }),
  clusterPage({
    slug: "facial-proportions-calculator",
    heroTitle: "Facial Proportions Calculator",
    description: "Use a real facial proportions calculator to preview thirds and ratio balance from your photo.",
    keywords: "facial proportions calculator, face proportions calculator, facial proportion test",
    aggregateMetricKeys: ["upperThird", "middleThird", "lowerThird", "totalFacialWidthHeight"],
    unlockedMetricKeys: ["middleThird", "totalFacialWidthHeight"],
    sections: [{ title: "Why this page converts well", paragraphs: ["People searching this term usually want a usable result immediately, which is why this page uses a real preview instead of static content only."] }],
    faqs: [{ question: "Is this based on my actual photo?", answer: "Yes. The preview uses your uploaded image and facial landmarks." }],
  }),
  clusterPage({
    slug: "face-symmetry-analyzer",
    heroTitle: "Face Symmetry Analyzer",
    description: "Preview facial symmetry from your uploaded photo using real feature spacing and eye-balance metrics.",
    keywords: "face symmetry analyzer, facial symmetry analyzer, symmetry analyzer face",
    aggregateMetricKeys: ["oneEyeApart", "intercanthalNasal", "canthalTilt"],
    unlockedMetricKeys: ["oneEyeApart", "canthalTilt"],
    sections: [{ title: "What this analyzer checks", paragraphs: ["This page focuses on symmetry-adjacent ratios and visible balance signals from the front view."] }],
    faqs: [{ question: "Is symmetry the same as attractiveness?", answer: "No. It helps, but it is only one factor." }],
  }),
  clusterPage({
    slug: "facial-thirds-calculator",
    heroTitle: "Facial Thirds Calculator",
    description: "Measure facial thirds from your photo using real landmark positions and a simple thirds preview.",
    keywords: "facial thirds calculator, facial thirds analysis, face thirds calculator",
    aggregateMetricKeys: ["upperThird", "middleThird", "lowerThird"],
    unlockedMetricKeys: ["upperThird", "middleThird", "lowerThird"],
    sections: [{ title: "Why thirds matter", paragraphs: ["Facial thirds are one of the simplest frameworks for understanding vertical balance."] }],
    faqs: [{ question: "What are facial thirds?", answer: "They divide the face into upper, middle, and lower sections to check vertical balance." }],
  }),
  clusterPage({
    slug: "facial-attractiveness-analyzer",
    heroTitle: "Facial Attractiveness Analyzer",
    description: "Preview facial attractiveness signals from your uploaded photo using a limited real metric set.",
    keywords: "facial attractiveness analyzer, attractiveness analyzer face, face attractiveness analyzer",
    aggregateMetricKeys: ["canthalTilt", "cheekboneHeight", "jawSlope", "midfaceRatio", "mouthToNoseWidth"],
    unlockedMetricKeys: ["cheekboneHeight", "jawSlope", "canthalTilt"],
    sections: [{ title: "Why this is only a preview", paragraphs: ["Attractiveness is too broad for one number alone, so this page only previews a smaller set of structural signals."] }],
    faqs: [{ question: "Does this measure all of attractiveness?", answer: "No. It previews structural signals only." }],
  }),
  clusterPage({
    slug: "facial-beauty-calculator",
    heroTitle: "Facial Beauty Calculator",
    description: "Use a real photo-based facial beauty calculator preview built from actual front-face metrics.",
    keywords: "facial beauty calculator, beauty calculator face, face beauty calculator",
    aggregateMetricKeys: ["intercanthalNasal", "mouthToNoseWidth", "chinPhiltrum", "canthalTilt"],
    unlockedMetricKeys: ["mouthToNoseWidth", "chinPhiltrum"],
    sections: [{ title: "What this page measures", paragraphs: ["This page focuses on a smaller ratio set that often appears in beauty-related searches and discussions."] }],
    faqs: [{ question: "Is this a beauty rating app?", answer: "No. It is a limited ratio-based preview from real landmarks." }],
  }),
  clusterPage({
    slug: "beauty-ratio-calculator",
    heroTitle: "Beauty Ratio Calculator",
    description: "Calculate a limited set of beauty-related facial ratios from your uploaded photo using real landmarks.",
    keywords: "beauty ratio calculator, beauty ratios face, face ratio beauty calculator",
    aggregateMetricKeys: ["mouthToNoseWidth", "intercanthalNasal", "midfaceRatio", "lipRatio"],
    unlockedMetricKeys: ["mouthToNoseWidth", "lipRatio", "intercanthalNasal"],
    sections: [{ title: "Why ratio pages work", paragraphs: ["People searching beauty ratios want concrete numbers. That is why real metric previews work better than generic content pages here."] }],
    faqs: [{ question: "What kind of ratios are shown?", answer: "A limited set of facial ratios that relate to visible balance and beauty discussions." }],
  }),
  clusterPage({
    slug: "facial-structure-analyzer",
    heroTitle: "Facial Structure Analyzer",
    description: "Analyze facial structure from your photo with a real preview of jaw, cheekbone, and proportion metrics.",
    keywords: "facial structure analyzer, face structure analyzer, facial bone structure analyzer",
    aggregateMetricKeys: ["jawSlope", "cheekboneHeight", "midfaceRatio", "bigonialWidth"],
    unlockedMetricKeys: ["jawSlope", "cheekboneHeight", "midfaceRatio"],
    sections: [{ title: "What structure means here", paragraphs: ["This page focuses on visible structure cues that show up clearly from the front: jaw, midface, and cheekbone positioning."] }],
    faqs: [{ question: "Does this replace the full report?", answer: "No. It is a smaller structure preview only." }],
  }),
  clusterPage({
    slug: "looksmax-analyzer",
    heroTitle: "Looksmax Analyzer",
    description: "Use a real photo-based looksmax analyzer preview built on actual facial landmark metrics.",
    keywords: "looksmax analyzer, looksmax analysis, face looksmax analyzer",
    aggregateMetricKeys: ["jawSlope", "canthalTilt", "cheekboneHeight", "midfaceRatio"],
    unlockedMetricKeys: ["jawSlope", "canthalTilt"],
    sections: [{ title: "Why this page exists", paragraphs: ["Looksmax intent is high because users want actionable feedback. This page gives a real preview while keeping the rest for premium."] }],
    faqs: [{ question: "What does this page analyze?", answer: "A smaller set of structural and ratio signals that are useful for a first-pass looksmax read." }],
  }),
  clusterPage({
    slug: "face-beauty-score-calculator",
    heroTitle: "Face Beauty Score Calculator",
    description: "Get a limited beauty score preview from your photo using real facial metrics instead of a fake rating slider.",
    keywords: "face beauty score calculator, facial beauty score, beauty score calculator face",
    aggregateMetricKeys: ["canthalTilt", "mouthToNoseWidth", "midfaceRatio", "cheekboneHeight"],
    unlockedMetricKeys: ["canthalTilt", "mouthToNoseWidth"],
    sections: [{ title: "Why this score is limited", paragraphs: ["This page shows a smaller score preview to match search intent while protecting the full premium system."] }],
    faqs: [{ question: "Is this beauty score fully accurate?", answer: "No. It is a preview and can be off. The main Facemaxify tool is more accurate." }],
  }),

  clusterPage({
    slug: "facial-balance-test",
    heroTitle: "Facial Balance Test",
    description: "Take a facial balance test from your photo using real landmark-based proportion checks.",
    keywords: "facial balance test, face balance test, balance test face",
    aggregateMetricKeys: ["middleThird", "lowerThird", "midfaceRatio", "intercanthalNasal"],
    unlockedMetricKeys: ["middleThird", "intercanthalNasal"],
    sections: [{ title: "What balance means", paragraphs: ["Balance is about how evenly the main features and thirds work together across the face."] }],
    faqs: [{ question: "What does facial balance test mean?", answer: "It means checking whether your proportions and spacing read as even and supportive overall." }],
    category: "adjacent",
  }),
  clusterPage({
    slug: "face-balance-analyzer",
    heroTitle: "Face Balance Analyzer",
    description: "Analyze facial balance from your uploaded photo using a real subset of facial metrics.",
    keywords: "face balance analyzer, facial balance analyzer, face balance analysis",
    aggregateMetricKeys: ["midfaceRatio", "mouthToNoseWidth", "chinPhiltrum"],
    unlockedMetricKeys: ["midfaceRatio", "chinPhiltrum"],
    sections: [{ title: "How this analyzer works", paragraphs: ["The page uses a limited set of true metrics to preview overall balance quickly."] }],
    faqs: [{ question: "Is this separate from facial harmony?", answer: "It overlaps, but balance searches tend to use slightly different language and intent." }],
    category: "adjacent",
  }),
  clusterPage({
    slug: "facial-proportions-test",
    heroTitle: "Facial Proportions Test",
    description: "Take a real facial proportions test using your uploaded photo and a smaller front-analysis preview.",
    keywords: "facial proportions test, face proportions test, facial proportion test",
    aggregateMetricKeys: ["upperThird", "middleThird", "lowerThird", "totalFacialWidthHeight"],
    unlockedMetricKeys: ["upperThird", "lowerThird"],
    sections: [{ title: "What this test covers", paragraphs: ["This page focuses on the simplest proportion checks users usually want first: thirds and overall height-to-width balance."] }],
    faqs: [{ question: "Is this a real photo test?", answer: "Yes. It uses your uploaded photo and landmark-based measurements." }],
    category: "adjacent",
  }),
  clusterPage({
    slug: "face-proportion-analyzer",
    heroTitle: "Face Proportion Analyzer",
    description: "Analyze face proportions from your photo using a real subset of structural and ratio checks.",
    keywords: "face proportion analyzer, face proportion analysis, face proportions analyzer",
    aggregateMetricKeys: ["middleThird", "midfaceRatio", "mouthToNoseWidth"],
    unlockedMetricKeys: ["middleThird", "mouthToNoseWidth"],
    sections: [{ title: "Why proportion pages rank", paragraphs: ["Proportion language is broad but still highly relevant to users who want a real result fast."] }],
    faqs: [{ question: "Does proportion mean the whole face?", answer: "Mostly yes, but this page still uses a limited subset for the preview." }],
    category: "adjacent",
  }),
  clusterPage({
    slug: "facial-aesthetics-calculator",
    heroTitle: "Facial Aesthetics Calculator",
    description: "Use a real facial aesthetics calculator preview based on actual front-face metrics and proportions.",
    keywords: "facial aesthetics calculator, facial aesthetic calculator, face aesthetics calculator",
    aggregateMetricKeys: ["jawSlope", "cheekboneHeight", "canthalTilt", "mouthToNoseWidth"],
    unlockedMetricKeys: ["jawSlope", "cheekboneHeight"],
    sections: [{ title: "What aesthetics means here", paragraphs: ["This page turns broad aesthetics search intent into a real, limited, photo-based preview."] }],
    faqs: [{ question: "Does this page judge attractiveness?", answer: "It previews a few structural cues only, not the full picture." }],
    category: "adjacent",
  }),
  clusterPage({
    slug: "facial-attractiveness-score",
    heroTitle: "Facial Attractiveness Score",
    description: "Get a limited facial attractiveness score preview from your uploaded photo using actual landmark-based checks.",
    keywords: "facial attractiveness score, attractiveness score face, face attractiveness score",
    aggregateMetricKeys: ["canthalTilt", "jawSlope", "midfaceRatio", "intercanthalNasal"],
    unlockedMetricKeys: ["canthalTilt", "midfaceRatio"],
    sections: [{ title: "How to read this score", paragraphs: ["The preview score is useful as a first signal, but it is not the full premium read and can be off."] }],
    faqs: [{ question: "Is this score exact?", answer: "No. It is a limited preview score." }],
    category: "adjacent",
  }),
  clusterPage({
    slug: "ai-face-score",
    heroTitle: "AI Face Score",
    description: "Upload a photo and get an AI face score preview built on real facial landmark measurements.",
    keywords: "AI face score, ai beauty score face, ai face rating",
    aggregateMetricKeys: ["canthalTilt", "mouthToNoseWidth", "midfaceRatio", "jawSlope"],
    unlockedMetricKeys: ["jawSlope", "mouthToNoseWidth"],
    sections: [{ title: "Why this is better than random AI raters", paragraphs: ["This page uses real geometric measurements instead of a black-box vibe score only."] }],
    faqs: [{ question: "Is this just AI guessing?", answer: "No. It is a landmark-based preview built on actual measurable facial relationships." }],
    category: "adjacent",
  }),
  clusterPage({
    slug: "beauty-score-ai",
    heroTitle: "Beauty Score AI",
    description: "Use a real landmark-based beauty score AI preview from your uploaded photo and then unlock the full Facemaxify analysis.",
    keywords: "beauty score ai, ai beauty score, beauty ai calculator",
    aggregateMetricKeys: ["cheekboneHeight", "canthalTilt", "mouthToNoseWidth", "chinPhiltrum"],
    unlockedMetricKeys: ["cheekboneHeight", "chinPhiltrum"],
    sections: [{ title: "What this AI score actually uses", paragraphs: ["This page turns broad AI beauty intent into a smaller set of measurable facial signals rather than a fake slider or random rating."] }],
    faqs: [{ question: "What makes this different?", answer: "It is built on real facial landmarks and true measurements, even though the public preview is still limited." }],
    category: "adjacent",
  }),
];

export const seoLandingPageMap = Object.fromEntries(
  seoLandingPages.map((page) => [page.slug, page]),
) as Record<string, SeoLandingPageConfig>;

export const seoLandingPageSlugs = seoLandingPages.map((page) => page.slug);

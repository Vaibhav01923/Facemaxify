# Translated pages (Spanish, Japanese)

Facemaxify has native-language versions of its most-searched tools under `/es/…` and `/ja/…`. They are
**written around the keyword people search in that language**, not translated word for word, and they reuse
the English tools' calculations, so a photo scores the same in every language (including the photo-shape
correction described under "Things to know").

## What exists

| URL | Targets (monthly Google searches, Oct 2026) | Measuring engine |
|---|---|---|
| `/es` | análisis facial | hub |
| `/es/test-de-belleza` | test de belleza (9.9k), medidor de belleza (2.9k) | attractiveness |
| `/es/ojos-de-cazador` | ojos de cazador (8.1k) | hunter-eyes |
| `/es/tipo-de-rostro` | tipo de cara hombre (2.9k), cómo saber mi tipo de rostro (1.9k) | face-shape |
| `/es/simetria-facial` | simetría facial (1.6k) | face-symmetry |
| `/ja` | 顔診断 (33k) | hub |
| `/ja/ganmen-hensachi` | 顔面偏差値 (201k), 顔面偏差値 診断 (110k) | face-rating (+ 偏差値 conversion) |
| `/ja/ikemen-shindan` | イケメン診断 (49.5k) | looksmax |
| `/ja/bijin-shindan` | 美人診断 (8.1k), 美人度診断 (4.4k) | attractiveness |
| `/ja/ougonhi` | 顔の黄金比 (12.1k) | golden-ratio |
| `/ja/kaogata-shindan` | 顔型診断 (5.4k), 輪郭診断 (1k) | face-shape |

Spanish volumes are worldwide Spanish; Japanese is Japan. Other languages looked at and parked: German
(gesichtsanalyse 12k, KD 17), Russian, Portuguese, Korean, Turkish — see "Add a language" below.

## Where things live

| What | Where |
|---|---|
| Page copy: SEO title/description, hero text, hub copy | `i18n/pages.ts` |
| URL registry, hreflang groups, language switcher, sitemap entries, validation | `i18n/registry.ts` |
| Interface text per language (nav, upload box, disclaimers) | `i18n/strings.tsx` |
| Long article under each tool (ends with the FAQ) | `content/i18n/<locale>/<slug>.md`, hub: `hub.md` |
| Results view per engine and language | `components/i18n/engines/*.tsx` |
| The user's photo with outlines and measurements drawn on it | `components/i18n/overlay/*` (see "The photo with outlines") |
| Page components | `components/i18n/Localized*.tsx` |
| Routes | `App.tsx` (generated from the registry) |
| Prerendered HTML, hreflang, JSON-LD, `sitemap-i18n.xml` | `scripts/prerender.mjs`, `scripts/i18nHead.mjs` |

`npm run build` prerenders every page to static HTML (so crawlers get the content without running JS) and
**fails** if a page has no article, an engine has no strings for the page's language, or the registry is
inconsistent — nothing ships half-translated.

## Add a page in Spanish or Japanese

1. Add an entry to `LOCALIZED_PAGES` in `i18n/pages.ts` (pick the `engine`; set `group` to the English tool's
   group so hreflang links the two — see `ENGLISH_GROUP_PATHS` in `i18n/registry.ts`).
2. Write `content/i18n/<locale>/<slug>.md`. Keep a `## Preguntas frecuentes` / `## よくある質問` section with
   `###` questions: the build turns it into FAQ structured data.
3. If the engine has no strings for that language yet, add them in `components/i18n/engines/<engine>.tsx`
   (the build tells you which one is missing).
4. `npm run build`, then check `dist/<locale>/<slug>/index.html` and `dist/sitemap-i18n.xml`.

## Add a language (e.g. German)

1. Add the code to `Locale` (`i18n/types.ts`) and an entry to `LOCALE_META` / `LOCALES` (`i18n/registry.ts`).
2. Add its `UI` strings (`i18n/strings.tsx`), a hub (`LOCALIZED_HUBS`) and `content/i18n/de/hub.md`.
3. Add pages and engine strings as above. TypeScript flags every `Record<Locale, …>` that still needs a `de` entry.
4. Don't auto-redirect by browser language — it hides pages from Google. The language switcher in every
   navbar is the link between versions.

## The photo with outlines

Every translated result shows the visitor's own photo, cropped to the face, with the face outlined (face,
eyes, brows, lips, nose) and the measurements drawn on top, so the result reads as an analysis of *their*
face rather than a bare score. Tap or hover a row of the results and its measurement lights up on the photo
(with the number, e.g. `あご幅 82%`); the other measurements fade back. Nothing leaves the browser: it is a
`<canvas>` drawn from the photo and the landmarks the tool already has.

- `overlay/AnnotatedResult.tsx` is the layout (photo card next to the result rows; stacked on phones, where
  tapping a row scrolls the photo back into view) and holds which measurement is selected.
- Each engine's `Results` builds a list of **layers** (`overlay/layers.ts`: `jawLayer`, `thirdsLayer`,
  `canthalLayer`, `pairLayer`, …) and gives each result row a `layer` id (`BreakdownCard` rows) or wraps it in
  `<LayerRow layer="…">`. A new engine = a few layer builders plus a `photo` block of short label texts.
- Layers recompute their numbers from the same landmarks and formulas as the score, so the label on the photo
  equals the number in the row (spot-checked on a test photo: the face-shape ratios and chin angle, the
  golden-ratio ratios, eye openness). Tilt labels carry no number on purpose: see "Things to know".
- **Keep label texts short** (about 12 Japanese characters or 25 Latin ones). They sit beside the face on a
  canvas that is roughly twice the face's width; a longer label is lifted above its line instead of beside it.
- `overlay/geometry.ts` holds the landmark index lists and `SYMMETRY_PAIRS` (copied from the English
  calculators: update both if a calculator changes its pairs), and the photo-shape correction
  (`toSquareSpace`, `imageSize`; see "Things to know").

## From free tool to paid sale

The full report (dashboard, paywall, checkout) is English-only, and that is where the money is, so the
translated pages try to carry the visitor's language as far down the funnel as it can go:

| Step | What happens | Where |
|---|---|---|
| Hub page | A "what's in the full report" section: contents, price, honest note that menus and guides are English, button | `components/i18n/FullReportSection.tsx`, copy in `i18n/strings.tsx`, price in `i18n/offer.ts` |
| Click through | Opens Clerk's sign-in popup **in Spanish / Japanese** and goes straight to `/dashboard/facial-analysis` afterwards (not Clerk's English-only hosted page) | `components/i18n/useFullReport.ts`, `i18n/clerk.ts` (`@clerk/localizations`, pinned) |
| AI report | The report text (summary, advice, skin routine) and the text inside the colour / hairstyle images are written in the visitor's language | `api/_lib/language.js`, the four `api/generate-*.js`, `services/aiService.ts` |
| Checkout | Dodo's checkout page is forced to Spanish / Japanese; if Dodo ever rejects that, the checkout retries without it, so a sale is never lost over language | `api/checkout.js` |

**Attribution.** A first-party cookie, `fmx_attr` (30 days, page paths and language only), records the
first page a visitor landed on, the last page they clicked "full report" on, and their language
(`services/attribution.ts`; format and validation in `api/_lib/attribution.js`). `api/checkout.js` reads it
and puts it on the payment as metadata: `landing_page`, `source_page`, `language`, `first_seen`. So each
sale in Dodo (and in the `payment.succeeded` webhook payload) says which page it came from, e.g.
`source_page: /ja/ganmen-hensachi`. Clicks on "full report" are also sent to Vercel Analytics as a
`full_report_click` event, which only shows up on plans that include custom events.

The language used for the AI report and the checkout is the language of the site pages the visitor last
read (English pages reset it to English); the signed-in app never changes it.

Not covered (yet): Clerk's emails, the dashboard UI, the 25+ metric names and the guides are still English.

## After deploying

- In Search Console, submit `https://facemaxify.com/sitemap-i18n.xml`. It's listed separately from
  `sitemap.xml` on purpose: its "Pages" report shows how many translated pages get indexed.
- Request indexing for the hubs (`/es`, `/ja`) and the highest-volume pages first
  (`/ja/ganmen-hensachi`, `/es/test-de-belleza`, `/es/ojos-de-cazador`). Search Console limits manual
  requests to a handful per day, so spread them over a few days; the sitemap and the language links in
  every English page's navbar do the rest.
- Have a native speaker read the Japanese pages in particular before pushing for rankings.

## Things to know

- **偏差値 is a conversion, not a statistic.** `/ja/ganmen-hensachi` shows `50 + (score − 56) × 0.6`,
  anchored on the tool's own "average" band (50–62). The engine looks generous (the one clear, well-lit
  test photo I ran scored 83/100, i.e. 偏差値 66), so 偏差値 may come out high for ordinary faces. To make it
  a real population measure, run 50–100 varied photos through the engine and replace the 56 / 0.6 in
  `engines/faceRating.tsx` with the sample's mean and spread. The page says plainly that it's an estimate.
- **Every tool corrects for the shape of the photo.** MediaPipe gives every landmark's x and y as a fraction
  of the photo's width and height *separately*, so on a portrait photo any measurement that mixes the two
  axes (face length ÷ width, eye height ÷ width, the chin angle, the canthal tilt) is stretched. The same
  face, cropped square and cropped 3:4, used to come out as `1.21 / 110° / oval` and `0.92 / 124° / heart`
  on `/tools/facial-shape`; now both crops give the same numbers (to the detector's own noise: ~0.01 on a
  ratio, ~1° on an angle).
  - **Tools built on `PhotoAnalyzerShell`** (English and translated alike) get the landmarks already
    corrected: the shell runs `toSquareSpace` (`overlay/geometry.ts`) before it calls `onAnalyze`. Don't
    correct them again. `renderResults` still receives the raw landmarks in `context`, which is what drawing
    on the photo needs.
  - **Standalone analyzers** that run MediaPipe themselves (`FacialShapeAnalyzer`, `GoldenRatioAnalyzer`,
    `CanthalTiltAnalyzer`, `FaceSymmetryAnalyzer`) call it directly: pass
    `toSquareSpace(landmarks, imageSize(img))` to the calculation and keep the raw landmarks for drawing.
    A new analyzer that doesn't use the shell has to do the same. (Golden ratio only compares widths with
    widths and heights with heights, and symmetry only compares left with right, so neither score moves
    much with or without it.)
  - **The full report** (`/dashboard/facial-analysis`, and `SimpleSeoAnalyzer` on the landing pages) needs
    nothing: it re-detects the landmarks on a 1024×1024 square (`standardizeImage`), where x and y already
    share a unit.
  - **Portrait photos score differently than before on the English pages** (the same face on a 3:4 crop used
    to score 92 on `/tools/hunter-eyes` against 66 square; now 65 against 66). To re-check after touching a
    calculation, crop one photo square and 3:4 without rescaling it (e.g.
    `helperimages/outer_corner_where_eyelids_meet.png`: x 225–675 with y 10–460 against y 0–600) and compare
    the two on `/tools/facial-shape` and `/tools/hunter-eyes`.
- **The hunter-eyes "canthal tilt" is not in degrees.** `pages/HunterEyesPage.tsx` multiplies the sine of the
  tilt by 180 instead of 180/π, so the number it shows (and the "ideal: > 3°" next to it) is about 3.14×
  the real angle. The translated page copies it so the languages agree, and the photo label for tilt shows
  no number. Fixing it means changing the English page and the score thresholds together.
- **The face-shape "confidence" is left out** of the translated results: the classifier returns a fixed
  number per shape (92, 88, …) rather than something measured.
- **Funnel tracking** records `/es/…` and `/ja/…` page views and photo submissions like the English tools,
  and `/stats` has a "Translated pages" table. It relies on the `track_funnel_event` database function
  accepting those paths.
- The full report (dashboard) is English-only; translated pages say so, and say that it uploads the photo.
- **Check these once by hand** (they need real accounts, so they weren't exercised in testing): the Clerk
  popup language, a Spanish and a Japanese full report (is the Japanese text inside the colour / hairstyle
  images legible? if not, remove `ja` from `IMAGE_TEXT_LANGUAGES` in `api/_lib/language.js`), and one checkout in
  each language.
- After pulling this change, run `npm install` (it adds `@clerk/localizations`, pinned with an `overrides`
  entry so Clerk's own packages keep their locked versions).

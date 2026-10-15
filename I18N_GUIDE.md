# Translated pages (Spanish, Japanese)

Facemaxify has native-language versions of its most-searched tools under `/es/…` and `/ja/…`. They are
**written around the keyword people search in that language**, not translated word for word, and they reuse
the English tools' calculations, so a photo scores the same everywhere. English pages are unchanged.

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
- **The face-shape "confidence" is left out** of the translated results: the classifier returns a fixed
  number per shape (92, 88, …) rather than something measured.
- **Funnel tracking** records `/es/…` and `/ja/…` page views and photo submissions like the English tools,
  and `/stats` has a "Translated pages" table. It relies on the `track_funnel_event` database function
  accepting those paths.
- The full report (dashboard) is English-only; translated pages say so, and say that it uploads the photo.

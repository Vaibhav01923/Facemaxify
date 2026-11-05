import { generateJson } from "./claude.js";

// Voice-over for the public video maker (a short, under a minute). Ported from the video generator's script writer;
// the visitor's browser sends the measurements, this only turns them into spoken lines.

const BASE_PROMPT = `You write the voice-over for videos in which a facial-analysis app breaks a person's face down ratio by ratio, with animated measurement lines on screen and the score shown next to them.

The voice-over is read aloud by a text-to-speech voice, so write plain spoken sentences: no emojis, no markdown, no parentheses, no slashes, no abbreviations, no symbols (write "degrees", "percent", "out of 10"). Say numbers the way a person would, rounded to one decimal at most.

Style
- Confident, analytical and entertaining, like a sharp sports commentator who happens to know facial anatomy. Vary how sentences open; do not start every line the same way.
- Be honest and proportional to the score: 9 or above is elite, 7 to 9 is a clear strength, 5 to 7 is average and fine, 3 to 5 is a weaker point, below 3 is a clear weak spot. State low scores plainly and neutrally; never mock, insult or shame anyone.
- Each ratio has a "role": "headline" ratios are the main features, so give them weight; "perfect ten" ratios are inside the ideal range, so celebrate that; "weak spot" ratios are among the lowest scores, so call them out plainly; "average" ratios are just part of the picture.
- Each ratio's voice-over must stand completely on its own: scenes can be reordered or cut, so never say "next", "now", "finally", "first", "moving on" or refer to another ratio.
- Use only the numbers provided. Never invent measurements, never compare to named people, never comment on race, ethnicity, age, health or character. Do not claim to identify anyone from the photo.
- Use the pronouns provided consistently (or the person's name now and then).
- Never say the app name or any website address.

Format: a SHORT under 60 seconds. Every ratio only gets about 3.5 seconds on screen, so speed is everything.
- Each ratio: ONE punchy sentence of 7 to 10 words, never more than 11. Name the feature and give the score as "x out of 10". Mention the measured value only when it is striking. No filler, no throat-clearing.
- The outro is the final seconds of the short: keep it tight.`;

const SCHEMA = {
  type: "object",
  properties: {
    scan: { type: "string", description: "One short sentence (max 9 words) that kicks off the analysis. It must mention the exact number of facial ratios." },
    scenes: {
      type: "array",
      description: "One voice-over per ratio, in the same order and with the same keys as the input.",
      items: {
        type: "object",
        properties: { key: { type: "string" }, voiceover: { type: "string" } },
        required: ["key", "voiceover"],
        additionalProperties: false,
      },
    },
    outro: { type: "string", description: "At most 18 words: the overall score out of 100 and the percentile wording. Do not name individual features (they are shown on screen)." },
  },
  required: ["scan", "scenes", "outro"],
  additionalProperties: false,
};

const PRONOUNS = {
  he: { subj: "he", obj: "him", poss: "his" },
  she: { subj: "she", obj: "her", poss: "her" },
  they: { subj: "they", obj: "them", poss: "their" },
};

const ROLE_TEXT = { core: "headline", perfect: "perfect ten", weak: "weak spot", mid: "average", filler: "average" };
const words = (s) => s.trim().split(/\s+/).filter(Boolean).length;
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function describe({ name, pronouns, metrics, overall100, percentileText }) {
  const p = PRONOUNS[pronouns] ?? PRONOUNS.they;
  const best = [...metrics].sort((a, b) => b.score - a.score)[0];
  const worst = [...metrics].sort((a, b) => a.score - b.score)[0];
  return JSON.stringify(
    {
      person: name,
      pronouns: `${p.subj}/${p.obj}/${p.poss}`,
      ratioCount: metrics.length,
      overallScoreOutOf100: overall100,
      percentileWording: percentileText,
      bestFeature: best?.short,
      weakestFeature: worst?.short,
      ratios: metrics.map((m, i) => ({
        order: i + 1,
        key: m.key,
        feature: m.short,
        role: m.perfect ? "perfect ten" : ROLE_TEXT[m.reason] ?? "average",
        definition: m.what || m.name,
        measured: m.displayValue,
        idealRange: `${m.idealMin} to ${m.idealMax} ${m.unit}`,
        score: m.score,
        rating: m.label,
      })),
    },
    null,
    2,
  );
}

function validate(raw, metrics) {
  if (typeof raw?.scan !== "string" || typeof raw?.outro !== "string" || !Array.isArray(raw?.scenes)) throw new Error("unexpected shape");
  const scenes = {};
  for (const s of raw.scenes) if (typeof s?.key === "string" && typeof s?.voiceover === "string" && s.voiceover.trim()) scenes[s.key] = s.voiceover.trim();
  for (const m of metrics) {
    if (!scenes[m.key]) throw new Error(`missing voice-over for ${m.key}`);
    if (words(scenes[m.key]) > 20) throw new Error(`voice-over for ${m.key} is too long`);
  }
  return { scan: raw.scan.trim(), scenes, outro: raw.outro.trim() };
}

/** Offline fallback so the page still works when the model is unavailable. */
function template({ name, pronouns, metrics, overall100, percentileText }) {
  const p = PRONOUNS[pronouns] ?? PRONOUNS.they;
  const scenes = {};
  metrics.forEach((m, i) => {
    const f = m.short.toLowerCase();
    const sc = Number(m.score).toFixed(1);
    const v =
      m.score >= 9.95
        ? [`${cap(f)}: a perfect 10 out of 10.`, `${cap(p.poss)} ${f} is flawless. 10 out of 10.`]
        : m.score >= 7
          ? [`${cap(f)}: ${sc} out of 10. A real strength.`, `${cap(p.poss)} ${f} scores ${sc} out of 10.`]
          : m.score >= 5
            ? [`${cap(f)} lands at ${sc} out of 10. Average.`, `${cap(p.poss)} ${f}: ${sc} out of 10.`]
            : [`${cap(f)} is a weak spot. ${sc} out of 10.`, `${cap(p.poss)} ${f} only scores ${sc} out of 10.`];
    scenes[m.key] = v[i % 2];
  });
  return {
    scan: `${metrics.length} facial ratios. Let's break it down.`,
    scenes,
    outro: `${overall100} out of 100, ${String(percentileText).toLowerCase().replace("%", " percent")}.`,
  };
}

export async function writeVideoScript(input) {
  let lastError = "";
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const raw = await generateJson({
        prompt: `${BASE_PROMPT}\n\nWrite the voice-over script for this analysis.\n\n${describe(input)}`,
        schema: SCHEMA,
        maxTokens: 3000,
        effort: "low",
      });
      return { ...validate(raw, input.metrics), source: "claude" };
    } catch (err) {
      lastError = err.message;
      console.warn(`[video-script] attempt ${attempt} failed: ${lastError}`);
    }
  }
  return { ...template(input), source: "template" };
}

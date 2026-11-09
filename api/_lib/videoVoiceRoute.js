import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { guard, spendVoiceToken, WINDOWS } from "./videoLimit.js";

// Narrators offered on the page. The ids are the page's own; each maps to a free Microsoft Edge neural voice.
const EDGE_VOICES = {
  onyx: "en-US-GuyNeural",
  ash: "en-US-AndrewNeural",
  echo: "en-US-ChristopherNeural",
  fable: "en-GB-RyanNeural",
  nova: "en-US-AriaNeural",
  shimmer: "en-US-JennyNeural",
  coral: "en-US-AvaNeural",
  sage: "en-US-BrianNeural",
};
const RATE = { calm: "+0%", normal: "+12%", fast: "+28%" };

/** One line of speech from the Edge service (no API key). The service now and then returns nothing, so callers retry. */
function edgeSpeech(text, voice, rate) {
  return new Promise(async (resolve, reject) => {
    try {
      const tts = new MsEdgeTTS();
      await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
      const { audioStream } = tts.toStream(text, { rate });
      const chunks = [];
      const timer = setTimeout(() => reject(new Error("speech timed out")), 15_000);
      audioStream.on("data", (c) => chunks.push(c));
      audioStream.on("end", () => {
        clearTimeout(timer);
        const audio = Buffer.concat(chunks);
        audio.length > 1000 ? resolve(audio) : reject(new Error("no audio received"));
      });
      audioStream.on("error", (e) => {
        clearTimeout(timer);
        reject(e);
      });
    } catch (e) {
      reject(e);
    }
  });
}

/** Optional paid fallback, used only when OPENAI_API_KEY is set and the free service fails. */
async function openAiSpeech(text, voice, pace) {
  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const speech = await client.audio.speech.create({
    model: "gpt-4o-mini-tts",
    voice,
    input: text,
    instructions: pace === "calm" ? "Calm, clear documentary narrator." : "Confident, punchy short-form video narrator. Brisk pace.",
    response_format: "mp3",
  });
  return Buffer.from(await speech.arrayBuffer());
}

/** One narration line as an MP3. The browser asks for each line separately so responses stay small. */
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (
    await guard(req, res, {
      bucket: "voice",
      perIp: [
        { window: 10, max: 12 },
        { window: WINDOWS.HOUR, max: 40 },
        { window: WINDOWS.DAY, max: 100 },
      ],
      global: { window: WINDOWS.DAY, max: 10000 },
      message: "Too many voice lines. Please try again later.",
    })
  )
    return;
  if (!(await spendVoiceToken(req.body?.token))) {
    return res.status(403).json({ error: "This video session has expired. Please start the video again." });
  }

  const text = String(req.body?.text ?? "").trim().slice(0, 260);
  if (!text) return res.status(400).json({ error: "No text" });
  const id = EDGE_VOICES[req.body?.voice] ? req.body.voice : "onyx";
  const pace = RATE[req.body?.pace] ? req.body.pace : "normal";

  let audio = null;
  for (let attempt = 1; attempt <= 3 && !audio; attempt++) {
    try {
      audio = await edgeSpeech(text, EDGE_VOICES[id], RATE[pace]);
    } catch (err) {
      console.warn(`[video-voice] edge attempt ${attempt} failed: ${err.message}`);
    }
  }
  if (!audio && process.env.OPENAI_API_KEY) {
    try {
      audio = await openAiSpeech(text, id, pace);
    } catch (err) {
      console.warn(`[video-voice] openai fallback failed: ${err.message}`);
    }
  }
  if (!audio) return res.status(502).json({ error: "Could not record the voice line. Please try again." });

  res.setHeader("Content-Type", "audio/mpeg");
  res.setHeader("Cache-Control", "no-store");
  res.status(200).send(audio);
}

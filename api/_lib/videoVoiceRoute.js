import OpenAI from "openai";
import { limited } from "./videoLimit.js";

// Narrators offered on the page (OpenAI text-to-speech voices).
const VOICES = ["onyx", "ash", "echo", "fable", "nova", "shimmer", "coral", "sage"];
const PACE = {
  calm: "Calm, clear documentary narrator. Measured pace.",
  normal: "Confident, punchy short-form video narrator. Brisk pace, clear emphasis on numbers.",
  fast: "Very fast, energetic short-form video narrator. Rapid pace, no pauses between sentences, clear emphasis on numbers.",
};

let client = null;

/** One narration line as an MP3. The browser asks for each line separately so responses stay small. */
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: "Voice is not set up yet." });
  if (limited(req, "voice", 40)) return res.status(429).json({ error: "Too many requests. Please try again in an hour." });

  const input = String(req.body?.text ?? "").trim().slice(0, 260);
  if (!input) return res.status(400).json({ error: "No text" });
  const voice = VOICES.includes(req.body?.voice) ? req.body.voice : "onyx";
  const instructions = PACE[req.body?.pace] ?? PACE.normal;

  try {
    client ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const speech = await client.audio.speech.create({ model: "gpt-4o-mini-tts", voice, input, instructions, response_format: "mp3" });
    const audio = Buffer.from(await speech.arrayBuffer());
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    res.status(200).send(audio);
  } catch (err) {
    console.error("[video-voice]", err);
    res.status(500).json({ error: "Could not record the voice line." });
  }
}

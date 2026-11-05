// Local-only: serves the video maker's two API routes on :4000 (what vite proxies /api to), so the page can be tried
// without the Supabase keys the full backend needs. The script route is the real handler. The voice route uses the
// real handler when OPENAI_API_KEY is set, and otherwise falls back to the Python `edge-tts` package (pip install
// edge-tts) so narration can be tested for free. Production (Vercel) runs api/ directly and never uses this file.
import express from "express";
import dotenv from "dotenv";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import script from "../api/video-script.js";
import voice from "../api/video-voice.js";

dotenv.config({ path: new URL("../.env.local", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1") });
const run = promisify(execFile);
const EDGE = { onyx: "en-US-GuyNeural", ash: "en-US-AndrewNeural", echo: "en-US-ChristopherNeural", fable: "en-GB-RyanNeural", nova: "en-US-AriaNeural", shimmer: "en-US-JennyNeural", coral: "en-US-AvaNeural", sage: "en-US-BrianNeural" };
const RATE = { calm: "+0%", normal: "+12%", fast: "+28%" };

async function edgeVoice(req, res) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "vm-tts-"));
  try {
    const out = path.join(dir, "line.mp3");
    await run("python", ["-m", "edge_tts", "--voice", EDGE[req.body?.voice] ?? EDGE.onyx, `--rate=${RATE[req.body?.pace] ?? RATE.normal}`, "--text", String(req.body?.text ?? "").slice(0, 260), "--write-media", out]);
    res.setHeader("Content-Type", "audio/mpeg").send(await readFile(out));
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Could not record the voice line." });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

const app = express();
app.use(express.json({ limit: "1mb" }));
app.post("/api/video-script", (req, res) => script(req, res));
app.post("/api/video-voice", (req, res) => (process.env.OPENAI_API_KEY ? voice(req, res) : edgeVoice(req, res)));
app.listen(4000, () => console.log("video-maker api on :4000"));

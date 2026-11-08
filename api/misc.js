import script from "./_lib/videoScriptRoute.js";
import voice from "./_lib/videoVoiceRoute.js";

// One function for several small routes, because the Hobby plan allows only 12 functions per deployment.
//   POST /api/misc?op=script        voice-over text for the public video maker
//   POST /api/misc?op=voice         one narration line for the video maker
export const config = { maxDuration: 30 };

export default function handler(req, res) {
  const op = req.query?.op ?? new URL(req.url, "http://x").searchParams.get("op");
  if (op === "script") return script(req, res);
  if (op === "voice") return voice(req, res);
  return res.status(404).json({ error: "Unknown operation" });
}

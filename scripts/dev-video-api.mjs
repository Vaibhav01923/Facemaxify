// Local-only: serves the video maker's API route on :4000 (what vite proxies /api to), so the page can be tried
// without the Supabase keys the full backend needs. Production (Vercel) runs api/ directly and never uses this file.
import express from "express";
import dotenv from "dotenv";
import misc from "../api/misc.js";

dotenv.config({ path: new URL("../.env.local", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1") });
const app = express();
app.use(express.json({ limit: "1mb" }));
app.post("/api/misc", (req, res) => misc(req, res));
app.listen(4000, () => console.log("video-maker api on :4000"));

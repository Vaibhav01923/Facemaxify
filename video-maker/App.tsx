import React, { useEffect, useMemo, useRef, useState } from "react";
import { analyzePhoto, type AnalysisResult } from "./analysis/analyze";
import { SHORT_LIMIT_SECONDS, autoShortCount, smartSelect } from "./shared/selection";
import { totalFrames } from "./shared/timeline";
import { FPS } from "./shared/timing";
import type { MetricData, Pronouns } from "./shared/types";
import { assemble, browserCanRender, overLimit, pool, recordLine, renderVideo, scanLine, writeScript, type Clip, type Quality, type Voice } from "./render";
import { CSS } from "./styles";

/*
 * Public video maker. The photo, the face analysis and the video all stay in the visitor's browser; the server only
 * writes the voice-over text and records the narration lines. There is deliberately no upload to any platform: the
 * visitor downloads their own MP4.
 */

const VOICES = [
  { id: "onyx", label: "Deep" },
  { id: "ash", label: "Calm" },
  { id: "echo", label: "Clear" },
  { id: "fable", label: "Storyteller" },
  { id: "nova", label: "Bright" },
  { id: "shimmer", label: "Soft" },
  { id: "coral", label: "Warm" },
  { id: "sage", label: "Gentle" },
];
const PACES = [
  { id: "calm", label: "Calm" },
  { id: "normal", label: "Normal" },
  { id: "fast", label: "Fast" },
];
const TRACKS = [
  { id: "dark-trap", label: "Dark trap", note: "Heavy 808s, 140 BPM" },
  { id: "lofi-chill", label: "Lo-fi chill", note: "Soft keys, 80 BPM" },
  { id: "cinematic-pulse", label: "Cinematic", note: "Low drone and pulse" },
  { id: "upbeat-pop", label: "Upbeat", note: "Bright, 120 BPM" },
];
const QUALITIES: { id: Quality; label: string; note: string }[] = [
  { id: "low", label: "Small file", note: "Fastest, ~15 MB" },
  { id: "medium", label: "Balanced", note: "~25 MB" },
  { id: "high", label: "Best", note: "Sharpest, ~40 MB" },
];
const STEPS = [
  { id: "analyze", label: "Measuring the face" },
  { id: "script", label: "Writing the voice-over" },
  { id: "voice", label: "Recording the narration" },
  { id: "render", label: "Making the video" },
] as const;
type StepId = (typeof STEPS)[number]["id"];
const TIPS = [
  "Keep this tab open and in front: the video is being made on your device.",
  "Front-facing photos with even light give the most accurate measurements.",
  "Every ratio is scored against its ideal range, then explained in the voice-over.",
  "Your photo never leaves your device. Only the measurements are used to write the script.",
  "The video is 1080 by 1920, ready for Shorts, Reels and TikTok.",
];

interface Cache {
  key: string;
  name: string;
  picks: MetricData[];
  token: string;
  voice: Voice;
}

const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export const App: React.FC = () => {
  const [photo, setPhoto] = useState<{ url: string; file: File } | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [name, setName] = useState("");
  const [pronouns, setPronouns] = useState<Pronouns>("they");
  const [voice, setVoice] = useState("onyx");
  const [pace, setPace] = useState("normal");
  const [music, setMusic] = useState<string>("dark-trap"); // "none" | built-in id | "custom"
  const [custom, setCustom] = useState<{ url: string; name: string } | null>(null);
  const [volume, setVolume] = useState(14);
  const [ratioMode, setRatioMode] = useState<"auto" | "manual">("auto");
  const [ratioCount, setRatioCount] = useState(12);
  const [sfx, setSfx] = useState(true);
  const [quality, setQuality] = useState<Quality>("medium");
  const [advanced, setAdvanced] = useState(false);

  const [stage, setStage] = useState<StepId | null>(null);
  const [sub, setSub] = useState(0);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [result, setResult] = useState<{ url: string; size: number; seconds: number } | null>(null);
  const [now, setNow] = useState(Date.now());
  const [tipIndex, setTipIndex] = useState(0);
  const [supported, setSupported] = useState(true);

  const cache = useRef<Cache | null>(null);
  const abort = useRef<AbortController | null>(null);
  const wake = useRef<{ release: () => Promise<void> } | null>(null);
  const preview = useRef<HTMLAudioElement | null>(null);
  const [previewing, setPreviewing] = useState<string | null>(null);
  const started = useRef(0);
  const renderStarted = useRef(0);

  const busy = stage !== null;
  const maxRatios = analysis ? Math.min(analysis.metrics.length, 18) : 18;

  useEffect(() => void browserCanRender().then(setSupported), []);
  useEffect(() => {
    if (!busy) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    const tip = setInterval(() => setTipIndex((i) => (i + 1) % TIPS.length), 7000);
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => {
      clearInterval(t);
      clearInterval(tip);
      window.removeEventListener("beforeunload", warn);
    };
  }, [busy]);
  useEffect(() => () => preview.current?.pause(), []);

  const stopPreview = () => {
    preview.current?.pause();
    setPreviewing(null);
  };
  const playPreview = (id: string, url: string) => {
    if (previewing === id) return stopPreview();
    preview.current?.pause();
    const a = new Audio(url);
    a.volume = 0.6;
    a.onended = () => setPreviewing(null);
    preview.current = a;
    void a.play();
    setPreviewing(id);
  };

  const fail = (m: string) => {
    setErr(m);
    setStage(null);
    void wake.current?.release().catch(() => undefined);
  };

  const onFile = async (f?: File | null) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) return setErr("Please choose a photo (JPG, PNG or WebP).");
    setErr("");
    setResult(null);
    setAnalysis(null);
    cache.current = null;
    setPhoto({ url: URL.createObjectURL(f), file: f });
    setStage("analyze");
    setSub(0.1);
    setMsg("Finding the face...");
    started.current = Date.now();
    try {
      setAnalysis(await analyzePhoto(f, (m: string) => setMsg(m)));
      setStage(null);
    } catch (e) {
      setPhoto(null);
      fail((e as Error).message || "We could not find a clear face in that photo. Try a front-facing one with good light.");
    }
  };

  const onMusicFile = (f?: File | null) => {
    if (!f) return;
    if (!f.type.startsWith("audio/")) return setErr("Please choose an audio file (MP3, WAV, M4A).");
    if (f.size > 30 * 1024 * 1024) return setErr("That audio file is over 30 MB. Please pick a smaller one.");
    setErr("");
    if (custom) URL.revokeObjectURL(custom.url);
    setCustom({ url: URL.createObjectURL(f), name: f.name });
    setMusic("custom");
  };

  const make = async () => {
    if (!analysis || !name.trim()) return;
    setErr("");
    setResult(null);
    started.current = Date.now();
    try {
      wake.current = ((await (navigator as any).wakeLock?.request("screen").catch(() => null)) as any) ?? null;
      const key = JSON.stringify({ name: name.trim(), pronouns, voice, pace, ratioMode, ratioCount });
      if (cache.current?.key !== key) {
        // 1. which ratios, and the script
        setStage("script");
        setSub(0);
        setMsg("Choosing the most interesting ratios...");
        const count = ratioMode === "auto" ? Math.min(analysis.metrics.length, autoShortCount()) : Math.min(ratioCount, analysis.metrics.length);
        const picks = smartSelect(analysis.metrics, count);
        setMsg("Claude is writing the voice-over...");
        const { name: cleaned, script, token } = await writeScript({ name: name.trim(), pronouns, metrics: picks, overall100: analysis.overall100, percentileText: analysis.percentileText });

        // 2. record every line
        setStage("voice");
        const lines = [
          { key: "intro", text: `How attractive is ${cleaned}?` },
          { key: "scan", text: script.scan },
          ...picks.map((m) => ({ key: `m_${m.key}`, text: script.scenes[m.key] })),
          { key: "outro", text: script.outro },
        ];
        setSub(0);
        const clips: Record<string, Clip> = {};
        await pool(
          lines,
          4,
          async (l) => {
            clips[l.key] = await recordLine(l.text, voice, pace, token);
          },
          (done) => {
            setSub(done / lines.length);
            setMsg(`Recorded ${done} of ${lines.length} lines`);
          },
        );
        cache.current = { key, name: cleaned, picks, token, voice: { script, clips } };
      }
      const c = cache.current!;
      const musicUrl = music === "none" ? undefined : music === "custom" ? custom?.url : `/video-music/${music}.wav`;
      const build = (picks: MetricData[], v: Voice) => assemble({ analysis, name: c.name, picks, voice: v, musicUrl, musicVolume: volume / 100, sfx });

      // 3. keep it under a minute for Shorts: drop the least important ratios (never the best and the weakest)
      let picks = c.picks;
      let v = c.voice;
      let props = build(picks, v);
      if (overLimit(props)) {
        const byScore = [...picks].sort((x, y) => y.score - x.score);
        const keep = new Set([byScore[0]?.key, byScore[byScore.length - 1]?.key]);
        setStage("voice");
        setMsg("Trimming to fit under a minute...");
        while (overLimit(props) && picks.length > 6) {
          const victim = picks.filter((m) => !keep.has(m.key)).sort((x, y) => (x.keep ?? 0) - (y.keep ?? 0))[0];
          if (!victim) break;
          picks = picks.filter((m) => m.key !== victim.key);
          const scan = await recordLine(scanLine(picks.length), voice, pace, c.token);
          v = { script: { ...v.script, scan: scanLine(picks.length) }, clips: { ...v.clips, scan } };
          props = build(picks, v);
        }
        cache.current = { ...c, picks, voice: v };
      }

      // 4. render
      setStage("render");
      setSub(0);
      setMsg("Starting the video engine...");
      renderStarted.current = Date.now();
      abort.current = new AbortController();
      const blob = await renderVideo(props, quality, (p) => setSub(p), abort.current.signal);
      setResult({ url: URL.createObjectURL(blob), size: blob.size, seconds: totalFrames(props) / FPS });
      setStage(null);
      void wake.current?.release().catch(() => undefined);
    } catch (e) {
      if (abort.current?.signal.aborted || (e as Error).name === "AbortError" || /abort|cancel/i.test((e as Error).message)) {
        setStage(null);
        return void wake.current?.release().catch(() => undefined);
      }
      fail((e as Error).message || "Something went wrong while making the video. Please try again.");
    }
  };

  const reset = () => {
    setResult(null);
    setPhoto(null);
    setAnalysis(null);
    setName("");
    cache.current = null;
  };

  const elapsed = (now - started.current) / 1000;
  const renderElapsed = (now - renderStarted.current) / 1000;
  const eta = stage === "render" && sub > 0.04 ? (renderElapsed * (1 - sub)) / sub : null;
  const overall = useMemo(() => {
    const i = STEPS.findIndex((s) => s.id === stage);
    return i < 0 ? 0 : Math.min(1, (i + sub) / STEPS.length);
  }, [stage, sub]);
  const fileName = `${(name.trim() || "face").replace(/[^\p{L}\p{N}]+/gu, "-")}-facial-analysis.mp4`;
  const mobile = /Mobi|Android/i.test(navigator.userAgent);

  return (
    <main className="vm">
      <style>{CSS}</style>
      <header>
        <a className="brand" href="/">Facemaxify</a>
        <h1>Face analysis video maker</h1>
        <p className="sub">Upload a photo and get a narrated video with animated measurements, voice-over and music. Free, made in your browser.</p>
      </header>

      {!supported && <p className="warn">This browser can't make videos yet. Please use Chrome or Edge on a computer, or a recent Chrome on Android.</p>}
      {err && <p className="err" role="alert">{err}</p>}

      {result ? (
        <section className="card result">
          <video src={result.url} controls playsInline />
          <p className="meta">{result.seconds.toFixed(0)} seconds &middot; {(result.size / 1e6).toFixed(0)} MB &middot; 1080 x 1920 MP4</p>
          <a className="go" href={result.url} download={fileName}>Download video</a>
          <div className="row">
            <button onClick={() => setResult(null)}>Change music, voice or quality</button>
            <button onClick={reset}>Make another</button>
          </div>
        </section>
      ) : busy && stage !== "analyze" ? (
        <section className="card progress" aria-live="polite">
          <div className="big"><i style={{ width: `${Math.round(overall * 100)}%` }} /></div>
          <ol className="steps">
            {STEPS.map((s, i) => {
              const cur = STEPS.findIndex((x) => x.id === stage);
              const state = i < cur ? "done" : i === cur ? "now" : "todo";
              return (
                <li key={s.id} className={state}>
                  <span className="dot">{state === "done" ? "✓" : state === "now" ? <b className="spin" /> : i + 1}</span>
                  <span className="lbl">{s.label}</span>
                  {state === "now" && <span className="pct">{Math.round(sub * 100)}%</span>}
                </li>
              );
            })}
          </ol>
          <p className="msg">{stage === "render" ? (sub > 0 ? `Rendering frames... ${eta != null ? `about ${fmtTime(eta)} left` : ""}` : msg) : msg}</p>
          <p className="time">Elapsed {fmtTime(elapsed)}</p>
          {mobile && stage === "render" && <p className="note">Phones are slower than computers. This can take a few minutes, so keep the screen on.</p>}
          <p className="tip">{TIPS[tipIndex]}</p>
          {stage === "render" && <button onClick={() => abort.current?.abort()}>Cancel</button>}
        </section>
      ) : (
        <>
          <section className="card">
            <h2>1. Photo</h2>
            {photo ? (
              <div className="photo">
                <div className={`pic ${stage === "analyze" ? "scan" : ""}`}>
                  <img src={analysis?.displayImage ?? photo.url} alt="" />
                  {stage === "analyze" && <i className="line" />}
                </div>
                <div>
                  {stage === "analyze" ? (
                    <>
                      <p className="msg"><b className="spin" /> {msg}</p>
                      <p className="note">Mapping 468 points and measuring the ratios. This takes a few seconds.</p>
                    </>
                  ) : analysis ? (
                    <>
                      <p className="ok">Face found. Overall score {analysis.overall100}/100.</p>
                      <label className="link">
                        Use a different photo
                        <input type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />
                      </label>
                    </>
                  ) : null}
                </div>
              </div>
            ) : (
              <label
                className="drop"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  void onFile(e.dataTransfer.files?.[0]);
                }}
              >
                <input type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />
                <b>Choose a photo</b>
                <span>or drop one here. A clear, front-facing photo works best.</span>
              </label>
            )}
          </section>

          {analysis && (
            <>
              <section className="card">
                <h2>2. Details</h2>
                <label className="field">
                  Name shown in the video
                  <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="e.g. Alex" />
                </label>
                <div className="seg">
                  {(["he", "she", "they"] as Pronouns[]).map((p) => (
                    <button key={p} className={pronouns === p ? "on" : ""} onClick={() => setPronouns(p)}>
                      {p === "he" ? "He / him" : p === "she" ? "She / her" : "They / them"}
                    </button>
                  ))}
                </div>
              </section>

              <section className="card">
                <h2>3. Voice and music</h2>
                <p className="label">Narrator</p>
                <div className="chips">
                  {VOICES.map((v) => (
                    <button key={v.id} className={voice === v.id ? "on" : ""} onClick={() => setVoice(v.id)}>{v.label}</button>
                  ))}
                </div>
                <p className="label">Background music</p>
                <ul className="tracks">
                  <li className={music === "none" ? "on" : ""}>
                    <button className="pick" onClick={() => setMusic("none")}><b>No music</b><span>Voice and sound effects only</span></button>
                  </li>
                  {TRACKS.map((t) => (
                    <li key={t.id} className={music === t.id ? "on" : ""}>
                      <button className="pick" onClick={() => setMusic(t.id)}><b>{t.label}</b><span>{t.note}</span></button>
                      <button className="play" aria-label={`Preview ${t.label}`} onClick={() => playPreview(t.id, `/video-music/${t.id}.wav`)}>{previewing === t.id ? "❚❚" : "▶"}</button>
                    </li>
                  ))}
                  <li className={music === "custom" ? "on" : ""}>
                    <label className="pick">
                      <b>{custom ? custom.name : "Upload your own"}</b>
                      <span>{custom ? "Your file, used only in your video" : "MP3, WAV or M4A up to 30 MB"}</span>
                      <input type="file" accept="audio/*" hidden onChange={(e) => onMusicFile(e.target.files?.[0])} />
                    </label>
                    {custom && <button className="play" aria-label="Preview your music" onClick={() => playPreview("custom", custom.url)}>{previewing === "custom" ? "❚❚" : "▶"}</button>}
                  </li>
                </ul>
                {music !== "none" && (
                  <label className="field">
                    Music volume: {volume}%
                    <input type="range" min={4} max={40} value={volume} onChange={(e) => setVolume(Number(e.target.value))} />
                  </label>
                )}
                {music === "custom" && <p className="note">Only use music you have the rights to. It is mixed into your video on your device and never uploaded.</p>}
              </section>

              <section className="card">
                <button className="adv" onClick={() => setAdvanced(!advanced)} aria-expanded={advanced}>
                  Advanced options <span>{advanced ? "−" : "+"}</span>
                </button>
                {advanced && (
                  <div className="advbody">
                    <p className="label">Speaking pace</p>
                    <div className="seg">
                      {PACES.map((p) => (
                        <button key={p.id} className={pace === p.id ? "on" : ""} onClick={() => setPace(p.id)}>{p.label}</button>
                      ))}
                    </div>
                    <p className="label">Ratios shown</p>
                    <div className="seg">
                      <button className={ratioMode === "auto" ? "on" : ""} onClick={() => setRatioMode("auto")}>Auto (best fit under 1 min)</button>
                      <button className={ratioMode === "manual" ? "on" : ""} onClick={() => setRatioMode("manual")}>Choose</button>
                    </div>
                    {ratioMode === "manual" && (
                      <label className="field">
                        {ratioCount} ratios {ratioCount > autoShortCount() ? `(the video is trimmed to ${SHORT_LIMIT_SECONDS} seconds)` : ""}
                        <input type="range" min={6} max={maxRatios} value={Math.min(ratioCount, maxRatios)} onChange={(e) => setRatioCount(Number(e.target.value))} />
                      </label>
                    )}
                    <p className="label">Video quality</p>
                    <div className="chips">
                      {QUALITIES.map((q) => (
                        <button key={q.id} className={quality === q.id ? "on" : ""} onClick={() => setQuality(q.id)} title={q.note}>{q.label}</button>
                      ))}
                    </div>
                    <label className="check">
                      <input type="checkbox" checked={sfx} onChange={(e) => setSfx(e.target.checked)} /> Sound effects (whooshes, dings)
                    </label>
                  </div>
                )}
              </section>

              <p className="note">Only upload photos of yourself or of people who agreed. Your photo stays on your device.</p>
              <button className="go" onClick={make} disabled={!name.trim() || !supported}>
                {name.trim() ? "Make my video" : "Enter a name to continue"}
              </button>
            </>
          )}
        </>
      )}
    </main>
  );
};

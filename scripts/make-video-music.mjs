// Generates the royalty-free background loops for the video maker (public/video-music/*.wav).
// They are synthesised from scratch here, so there is nothing to license. Run: node scripts/make-video-music.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SR = 24000;
const out = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public", "video-music");
mkdirSync(out, { recursive: true });

const mtof = (m) => 440 * 2 ** ((m - 69) / 12);
let seed = 7;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;

/** A track is built bar by bar into a Float32 buffer; every voice adds into it. */
function track(bpm, bars) {
  const beat = 60 / bpm;
  const len = Math.round(bars * 4 * beat * SR);
  return { bpm, beat, len, buf: new Float32Array(len), at: (b) => Math.round(b * beat * SR) };
}
function add(t, start, dur, fn, gain) {
  const n = Math.min(Math.round(dur * SR), t.len - start);
  for (let i = 0; i < n; i++) t.buf[(start + i) % t.len] += fn(i / SR, i / n) * gain;
}
const env = (p, a = 0.01) => Math.min(1, p / a) * (1 - p) ** 2;

const kick = (t, b, g = 0.9) => add(t, t.at(b), 0.28, (s, p) => Math.sin(2 * Math.PI * (45 + 90 * Math.exp(-s * 28)) * s) * (1 - p) ** 1.6, g);
const snare = (t, b, g = 0.5) => add(t, t.at(b), 0.2, (s, p) => (rnd() * 0.8 + Math.sin(2 * Math.PI * 190 * s) * 0.4) * (1 - p) ** 2.2, g);
const hat = (t, b, g = 0.18, open = false) => add(t, t.at(b), open ? 0.18 : 0.05, (s, p) => rnd() * (1 - p) ** (open ? 1.6 : 3), g);
const bass808 = (t, b, midi, d, g = 0.8) =>
  add(t, t.at(b), d * t.beat, (s, p) => Math.sin(2 * Math.PI * mtof(midi) * s * (1 + 0.5 * Math.exp(-s * 18))) * env(p, 0.004) ** 0.6 * (1 - p * 0.3), g);
const pluck = (t, b, midi, d, g = 0.25) =>
  add(t, t.at(b), d * t.beat, (s, p) => {
    const f = mtof(midi);
    return (Math.sin(2 * Math.PI * f * s) + 0.4 * Math.sin(4 * Math.PI * f * s) + 0.15 * Math.sin(6 * Math.PI * f * s)) * Math.exp(-s * 5) * env(p, 0.003) ** 0.3;
  }, g);
const epiano = (t, b, midi, d, g = 0.2) =>
  add(t, t.at(b), d * t.beat, (s, p) => {
    const f = mtof(midi);
    return (Math.sin(2 * Math.PI * f * s) + 0.5 * Math.sin(2 * Math.PI * f * 2 * s) * Math.exp(-s * 4) + 0.2 * Math.sin(2 * Math.PI * f * 4 * s) * Math.exp(-s * 9)) * Math.exp(-s * 1.3) * Math.min(1, s / 0.01) * (1 - p) ** 0.6;
  }, g);
/** Soft pad: a few detuned saws through a one-pole low-pass, slow attack and release. */
function pad(t, b, notes, d, g = 0.1, cutoff = 900) {
  const start = t.at(b);
  const n = Math.min(Math.round(d * t.beat * SR), t.len - start);
  const a = Math.exp((-2 * Math.PI * cutoff) / SR);
  for (const m of notes) {
    let lp = 0;
    for (const det of [-0.12, 0, 0.12]) {
      const f = mtof(m + det);
      lp = 0;
      for (let i = 0; i < n; i++) {
        const s = i / SR;
        const saw = 2 * ((f * s) % 1) - 1;
        lp = (1 - a) * saw + a * lp;
        const p = i / n;
        t.buf[start + i] += lp * Math.min(1, p / 0.12) * Math.min(1, (1 - p) / 0.15) * g;
      }
    }
  }
}
const noiseBed = (t, g) => {
  let lp = 0;
  for (let i = 0; i < t.len; i++) {
    lp = 0.97 * lp + 0.03 * rnd();
    t.buf[i] += lp * g * 6 + (Math.random() < 0.0008 ? rnd() * g * 4 : 0);
  }
};

function finish(name, t) {
  let peak = 0;
  for (const v of t.buf) peak = Math.max(peak, Math.abs(v));
  const scale = 0.85 / (peak || 1);
  const pcm = Buffer.alloc(44 + t.len * 2);
  pcm.write("RIFF", 0);
  pcm.writeUInt32LE(36 + t.len * 2, 4);
  pcm.write("WAVEfmt ", 8);
  pcm.writeUInt32LE(16, 16);
  pcm.writeUInt16LE(1, 20);
  pcm.writeUInt16LE(1, 22);
  pcm.writeUInt32LE(SR, 24);
  pcm.writeUInt32LE(SR * 2, 28);
  pcm.writeUInt16LE(2, 32);
  pcm.writeUInt16LE(16, 34);
  pcm.write("data", 36);
  pcm.writeUInt32LE(t.len * 2, 40);
  for (let i = 0; i < t.len; i++) pcm.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(t.buf[i] * scale * 32767))), 44 + i * 2);
  writeFileSync(path.join(out, `${name}.wav`), pcm);
  console.log(name, (pcm.length / 1e6).toFixed(2), "MB", (t.len / SR).toFixed(1), "s");
}

// 1. Dark trap: half-time kick/clap, rolling hats, 808 on the root of a minor progression
{
  const t = track(140, 8);
  const roots = [33, 29, 36, 31]; // A1 F1 C2 G1
  const chords = [[57, 60, 64], [53, 57, 60], [55, 60, 64], [55, 59, 62]];
  for (let bar = 0; bar < 8; bar++) {
    const b0 = bar * 4;
    const i = Math.floor(bar / 2) % 4;
    kick(t, b0); kick(t, b0 + 2.5, 0.7);
    snare(t, b0 + 2);
    for (let s = 0; s < 16; s++) hat(t, b0 + s / 4, s % 2 ? 0.1 : 0.17 + (s % 4 === 0 ? 0.05 : 0));
    hat(t, b0 + 3.5, 0.2, true);
    bass808(t, b0, roots[i] + 12, 1.8); bass808(t, b0 + 2.5, roots[i] + 12, 1.2, 0.6);
    if (bar % 2 === 0) pad(t, b0, chords[i], 8, 0.05, 700);
  }
  finish("dark-trap", t);
}

// 2. Lo-fi chill: soft drums, vinyl crackle, warm electric-piano chords
{
  const t = track(80, 8);
  const chords = [[50, 53, 57, 60], [55, 59, 62, 65], [48, 52, 55, 59], [57, 60, 64, 67]];
  for (let bar = 0; bar < 8; bar++) {
    const b0 = bar * 4;
    const c = chords[Math.floor(bar / 2) % 4];
    kick(t, b0, 0.6); kick(t, b0 + 1.75, 0.4); kick(t, b0 + 2.5, 0.5);
    snare(t, b0 + 1, 0.22); snare(t, b0 + 3, 0.25);
    for (let s = 0; s < 8; s++) hat(t, b0 + s / 2, 0.07 + (s % 2 ? 0 : 0.03));
    if (bar % 2 === 0) c.forEach((m, k) => epiano(t, b0 + k * 0.04, m, 3.8, 0.13));
    else epiano(t, b0 + 2, c[2] + 12, 1.5, 0.1);
    bass808(t, b0, c[0] - 12, 1.6, 0.35);
  }
  noiseBed(t, 0.012);
  finish("lofi-chill", t);
}

// 3. Cinematic pulse: low drone, steady plucked arpeggio, light percussion
{
  const t = track(100, 8);
  const roots = [45, 41, 48, 43];
  for (let bar = 0; bar < 8; bar++) {
    const b0 = bar * 4;
    const r = roots[Math.floor(bar / 2) % 4];
    if (bar % 2 === 0) pad(t, b0, [r - 12, r, r + 7], 8, 0.07, 500);
    for (let s = 0; s < 8; s++) pluck(t, b0 + s / 2, r + 12 + [0, 7, 12, 7, 15, 12, 7, 3][s], 0.5, 0.17);
    kick(t, b0, 0.55); kick(t, b0 + 2, 0.45);
    hat(t, b0 + 1, 0.1); hat(t, b0 + 3, 0.1);
  }
  finish("cinematic-pulse", t);
}

// 4. Upbeat pop: four-on-the-floor, off-beat hats, bright major arpeggios
{
  const t = track(120, 8);
  const chords = [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]];
  for (let bar = 0; bar < 8; bar++) {
    const b0 = bar * 4;
    const c = chords[Math.floor(bar / 2) % 4];
    for (let k = 0; k < 4; k++) kick(t, b0 + k, 0.7);
    snare(t, b0 + 1, 0.3); snare(t, b0 + 3, 0.3);
    for (let k = 0; k < 4; k++) hat(t, b0 + k + 0.5, 0.15);
    for (let s = 0; s < 8; s++) pluck(t, b0 + s / 2, c[s % 3] + 12 + (s > 4 ? 12 : 0), 0.4, 0.15);
    bass808(t, b0, c[0] - 24, 0.9, 0.5); bass808(t, b0 + 2, c[0] - 24, 0.9, 0.5);
  }
  finish("upbeat-pop", t);
}

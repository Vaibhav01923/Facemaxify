export type Pt = { x: number; y: number };

export type VideoFormat = "short" | "long";

/** Why a ratio made it into the video. */
export type PickReason = "core" | "weak" | "perfect" | "mid" | "filler";

/** One scored facial ratio, as produced by Facemaxify's calculateFrontRatios(). */
export interface MetricData {
  key: string;
  /** Facemaxify's official metric name. */
  name: string;
  /** Short on-screen title. */
  short: string;
  value: number;
  unit: string;
  score: number; // 0-10
  idealMin: number;
  idealMax: number;
  label: string; // "Good", "Poor", ...
  displayValue: string; // "8.6°"
  /** Set by the smart selector. */
  reason?: PickReason;
  /** Score is a perfect 10 (inside the ideal range). */
  perfect?: boolean;
  /** Higher = keep when a short has to be trimmed to fit 60 seconds. */
  keep?: number;
}

export interface MetricScene extends MetricData {
  narration: string;
  audioSrc?: string;
  audioFrames: number;
  durationInFrames: number;
}

export interface IntroScene {
  titleTop: string; // "HOW ATTRACTIVE IS"
  titleName: string; // "TOM WELLING?"
  narration: string;
  audioSrc?: string;
  audioFrames: number;
  durationInFrames: number;
}

export interface ScanScene {
  narration: string;
  audioSrc?: string;
  audioFrames: number;
  durationInFrames: number;
  landmarkCount: number;
  ratioCount: number;
}

/** A short "get your free analysis" moment placed between two ratio scenes. */
export interface PromoScene {
  narration: string;
  audioSrc?: string;
  audioFrames: number;
  durationInFrames: number;
  /** shown after the metric scene with this index */
  afterMetric: number;
}

export interface OutroScene {
  narration: string;
  audioSrc?: string;
  audioFrames: number;
  durationInFrames: number;
  overall100: number;
  percentileText: string;
  strengths: { short: string; score: number }[];
  weaknesses: { short: string; score: number }[];
}

/** Everything the Remotion composition needs to render a video. */
export interface VideoProps {
  /** short = 1080x1920 (9:16), long = 1920x1080 (16:9) */
  format: VideoFormat;
  name: string;
  imageSrc: string;
  /** Small pre-blurred, darkened copy of the photo used as the 9:16 background. */
  backdropSrc?: string;
  /** Facemaxify landmarks, normalised 0-1000 on the (square) standardised photo. */
  landmarks: Record<string, Pt>;
  /** Full face mesh, normalised 0-1, used for the scan animation. May be empty. */
  mesh: [number, number][];
  intro: IntroScene;
  scan: ScanScene;
  metrics: MetricScene[];
  outro: OutroScene;
  promo?: PromoScene;
  /** The public in-browser tool: no channel promo banner, and the end card points to the website. */
  publicMode?: boolean;
  musicSrc?: string;
  /** Segment of the track to play (seconds); the whole track when omitted. */
  musicStartSeconds?: number;
  musicEndSeconds?: number;
  musicVolume: number;
  sfx: boolean;
}

/** Output of the browser-side analysis that is sent to the server. */
export interface AnalysisPayload {
  displayImage: string; // data URL, square, landmark-aligned
  backdropImage?: string; // data URL, small blurred 9:16 background
  landmarks: Record<string, Pt>;
  metrics: {
    key: string;
    name: string;
    value: number;
    unit: string;
    idealMin: number;
    idealMax: number;
    score: number;
  }[];
  overall: number; // 0-10 weighted
  overall100: number;
  percentileText: string;
  mesh: [number, number][];
}

export type Pronouns = "he" | "she" | "they";

export interface ShortOptions {
  enabled: boolean;
  /** auto = smart selection that fits under 60 seconds; manual = exactly `count` ratios. */
  mode: "auto" | "manual";
  count: number;
}

export interface LongOptions {
  enabled: boolean;
  count: number;
}

export interface MusicOptions {
  enabled: boolean;
  /** file name in the music library, or "random" to pick one */
  track: string;
  /** mix level of the music under the voice, 0.03 - 0.4 */
  volume: number;
  /** Optional segment of the track to use (seconds). Only applies to a specific track, not "random". */
  startSeconds?: number;
  endSeconds?: number;
}

export const DEFAULT_MUSIC_VOLUME = 0.11;

export interface YouTubeOptions {
  /** upload each finished video straight away */
  auto: boolean;
  privacy: "private" | "unlisted" | "public";
}

export interface YouTubeUploadStatus {
  state: "uploading" | "done" | "error";
  url?: string;
  title?: string;
  error?: string;
}

export interface JobRequest {
  name: string;
  pronouns: Pronouns;
  voice?: string;
  music: MusicOptions;
  short: ShortOptions;
  long: LongOptions;
  youtube?: YouTubeOptions;
  analysis: AnalysisPayload;
}

export type JobStage = "queued" | "script" | "voice" | "render" | "done" | "error";

export interface OutputStatus {
  format: VideoFormat;
  stage: JobStage;
  /** 0-1 progress of the current stage. */
  progress: number;
  message: string;
  videoUrl?: string;
  durationSeconds?: number;
  scriptSource?: "claude" | "template";
  error?: string;
  /** The ratios that ended up in this video. */
  ratios?: { key: string; short: string; score: number; reason?: PickReason }[];
  /** Ratios dropped after recording the voice so a short fits under 60 seconds. */
  trimmed?: string[];
  warning?: string;
  youtube?: YouTubeUploadStatus;
}

export interface JobStatus {
  id: string;
  stage: "queued" | "running" | "done" | "error";
  message: string;
  outputs: OutputStatus[];
  error?: string;
}

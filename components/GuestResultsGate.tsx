import React, { useMemo } from "react";
import { Check, Lock, ShieldCheck } from "lucide-react";
import { Point } from "../types";
import { calculateFrontRatios } from "../services/ratioCalculator";
import { ScanPortrait } from "./dashboard/visuals";

interface GuestResultsGateProps {
  photo: string;
  landmarks: Record<string, Point>;
  onSignIn: () => void;
  onStartOver: () => void;
}

// What someone who isn't signed in sees after mapping every landmark: their analysis is ready, but the results are
// behind a (free) sign-in, shown with the same blur treatment as the paid report. The numbers behind the blur are
// placeholders on purpose: the real report (which also triggers the AI report and saves the scan) only exists once
// they are signed in. Rendered inside the scan flow, which provides the dashboard design tokens.
const DECOY_SCORES = [8.4, 6.1, 9.2, 7.7, 5.3, 8.8, 6.9];

export const GuestResultsGate: React.FC<GuestResultsGateProps> = ({ photo, landmarks, onSignIn, onStartOver }) => {
  const rows = useMemo(() => {
    const names = calculateFrontRatios(landmarks as any).map((m) => m.name).filter(Boolean);
    return { names: names.slice(0, DECOY_SCORES.length), total: names.length };
  }, [landmarks]);
  const landmarkCount = Object.keys(landmarks).length;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center px-5 py-10 sm:py-14" data-testid="guest-results-gate">
      <ul className="mb-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] text-[var(--d-t2)]">
        {[`${landmarkCount} landmarks mapped`, `${rows.total} facial ratios scored`, "Facial harmony score ready"].map((t) => (
          <li key={t} className="inline-flex items-center gap-2">
            <Check className="h-4 w-4 text-[var(--d-accent)]" strokeWidth={1.75} /> {t}
          </li>
        ))}
      </ul>

      <div className="d-bezel w-56 sm:w-64">
        <div className="d-core">
          <ScanPortrait src={photo} landmarks={landmarks} alt="Your photo with the mapped landmarks" />
        </div>
      </div>

      <div className="mt-9 text-center">
        <p className="d-eyebrow mb-4">Step 3 of 3</p>
        <h1 className="d-h1">Your analysis is ready</h1>
        <p className="d-body mx-auto mt-4 max-w-md">
          Sign in, it's free, to see your facial harmony score, every ratio broken down, and your strongest and weakest features.
        </p>
      </div>

      <div className="d-card relative mt-9 w-full overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none select-none space-y-4 p-6 opacity-40" style={{ filter: "blur(9px)" }}>
          <div className="flex items-center justify-between">
            <div className="h-4 w-36 rounded bg-[var(--d-s3)]" />
            <div className="d-num text-4xl font-light text-[var(--d-accent)]">78/100</div>
          </div>
          {rows.names.map((name, i) => (
            <div key={name} className="flex items-center gap-4">
              <div className="flex-1 truncate text-[13px] font-medium">{name}</div>
              <div className="relative h-[6px] flex-[2] rounded-full bg-[var(--d-s3)]">
                <div className="absolute inset-y-0 left-0 rounded-full bg-[var(--d-accent)]" style={{ width: `${DECOY_SCORES[i] * 10}%` }} />
              </div>
              <div className="d-mono w-10 text-right text-[13px]">{DECOY_SCORES[i]}</div>
            </div>
          ))}
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[linear-gradient(to_bottom,rgba(7,8,13,0.25),rgba(7,8,13,0.8))] px-6 text-center">
          <span className="mb-4 grid h-11 w-11 place-items-center rounded-xl border border-[var(--d-line2)] bg-[var(--d-s2)] text-[var(--d-accent)]">
            <Lock className="h-[18px] w-[18px]" strokeWidth={1.5} />
          </span>
          <button type="button" onClick={onSignIn} className="d-btn d-btn-primary">
            <span>Sign in to view results</span>
            <span className="d-btn-dot">
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3.5 8h9M8.5 4l4 4-4 4" />
              </svg>
            </span>
          </button>
          <p className="mt-3 inline-flex items-center gap-1.5 text-[12px] text-[var(--d-t3)]">
            <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.5} /> Free · about 10 seconds · your photo stays on your device until you sign in
          </p>
        </div>
      </div>

      <button type="button" onClick={onStartOver} className="mt-4 py-3 text-[13px] text-[var(--d-t3)] underline underline-offset-4 transition-colors hover:text-[var(--d-t1)]">
        Start over with a different photo
      </button>
    </div>
  );
};

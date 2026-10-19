import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { Lock, Plus, X } from "lucide-react";
import { Arrow, PlanTerms, useDashboard } from "../DashboardLayout";
import { NEW_SCAN, type SectionMeta } from "../sections";
import { SectionArt } from "../visuals";
import { shortDate, type Scan } from "../scanData";

/* -------------------------------------------------------------------------------------------------
 * useGeneratedReport: one AI report (overview, skincare, color, hairstyle) for one scan.
 *
 * - shows what is already saved on the scan;
 * - when `enabled` and nothing is saved, makes ONE automatic attempt per scan, then waits for "Try again";
 * - saves the result and asks the dashboard to reload, even if you have moved to another scan meanwhile.
 * ---------------------------------------------------------------------------------------------- */
export function useGeneratedReport<T>(opts: {
  scanId?: string;
  /** What is already saved for this scan. */
  existing: T | null;
  /** Whether it may start by itself (signed in, plan allows it, photo available). */
  enabled: boolean;
  generate: () => Promise<T | null>;
  save?: (value: T) => Promise<unknown>;
  onSaved?: () => void;
}) {
  const { scanId, existing, enabled } = opts;
  const [value, setValue] = useState<T | null>(existing);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const attempted = useRef<string | null>(null);
  const currentScan = useRef(scanId);
  currentScan.current = scanId;
  const latest = useRef(opts);
  latest.current = opts;

  // A different scan, or a freshly saved copy of this one, replaces what is on screen.
  useEffect(() => {
    setValue(existing);
    setFailed(false);
  }, [scanId, existing]);
  useEffect(() => setLoading(false), [scanId]);

  const run = useCallback(async () => {
    const o = latest.current;
    const key = o.scanId;
    attempted.current = key ?? "none";
    setLoading(true);
    setFailed(false);
    try {
      const result = await o.generate();
      if (!result) {
        if (currentScan.current === key) setFailed(true);
        return;
      }
      if (currentScan.current === key) setValue(result);
      try {
        await o.save?.(result);
      } catch (err) {
        console.error("Could not save the generated report:", err);
      }
      o.onSaved?.();
    } catch (err) {
      console.error("Report generation failed:", err);
      if (currentScan.current === key) setFailed(true);
    } finally {
      if (currentScan.current === key) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled || value || loading) return;
    if (attempted.current === (scanId ?? "none")) return;
    run();
  }, [enabled, value, loading, scanId, run]);

  return { value, loading, failed, retry: run };
}

/* ---------------------------------------------------------------------------------------------- */

/** Blurs a report and lays an unlock prompt over it, for the parts free accounts can't read. */
export const Locked: React.FC<{
  locked: boolean;
  meta: SectionMeta;
  /** Replace the generic one-liner under the title. */
  note?: string;
  children: React.ReactNode;
  minHeight?: number;
}> = ({ locked, meta, note, children, minHeight = 420 }) => {
  const { upgradeHref, upgradePrice } = useDashboard();
  if (!locked) return <>{children}</>;
  return (
    <div className="relative overflow-hidden" style={{ minHeight }}>
      <div className="pointer-events-none select-none" style={{ filter: "blur(14px)", opacity: 0.4 }} aria-hidden="true">
        {children}
      </div>
      <div className="absolute inset-0 grid place-items-center p-6 text-center">
        <div className="d-card-raised max-w-xs p-7">
          <span className="mx-auto mb-4 grid h-10 w-10 place-items-center rounded-xl border border-[var(--d-line2)] bg-[var(--d-s3)] text-[var(--d-accent)]">
            <Lock className="h-[18px] w-[18px]" strokeWidth={1.5} />
          </span>
          <h3 className="text-[16px] font-semibold tracking-[-0.02em]">{meta.title} is Pro</h3>
          <p className="d-body mt-1.5">{note ?? `${meta.blurb.split(",")[0].replace(/\.$/, "")}.`}</p>
          <a href={upgradeHref} className="d-btn d-btn-primary d-btn-sm mt-5 w-full justify-between">
            <span>Unlock · {upgradePrice}</span>
            <span className="d-btn-dot">
              <Arrow />
            </span>
          </a>
          <PlanTerms className="mt-2.5" />
        </div>
      </div>
    </div>
  );
};

/** What a report page shows when the account has no scans at all. */
export const NoScan: React.FC = () => (
  <div className="grid min-h-[420px] place-items-center p-8 text-center">
    <div className="max-w-sm">
      <SectionArt kind="facial" className="mx-auto mb-6 w-[200px] opacity-80" />
      <h2 className="d-h2">Every report starts with a scan</h2>
      <p className="d-body mt-2">Upload one front-facing photo and this report is built from it.</p>
      <Link to={NEW_SCAN} className="d-btn d-btn-primary mt-6">
        <span>Upload a photo</span>
        <span className="d-btn-dot">
          <Arrow />
        </span>
      </Link>
    </div>
  </div>
);

/** Full-screen view of a generated image. Click anywhere or press Escape to close. */
export const Lightbox: React.FC<{ src: string; alt: string; onClose: () => void }> = ({ src, alt, onClose }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return createPortal(
    <div className="dash fixed inset-0 z-[60] grid place-items-center bg-[rgba(3,4,8,0.94)] p-4" role="dialog" aria-modal="true" aria-label={alt} onClick={onClose}>
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full border border-[var(--d-line2)] bg-[var(--d-s2)] text-[var(--d-t1)] transition-colors hover:bg-[var(--d-s3)]"
        aria-label="Close"
      >
        <X className="h-5 w-5" strokeWidth={1.5} />
      </button>
      <img src={src} alt={alt} className="max-h-full max-w-full rounded-xl object-contain" onClick={(e) => e.stopPropagation()} />
    </div>,
    document.body,
  );
};

/** The scan the page is showing, with "New scan" and a two-step delete. */
export const ScanBar: React.FC<{ scan: Scan; score?: number | null }> = ({ scan, score }) => {
  const { removeScan, scans } = useDashboard();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setConfirming(false);
    setError("");
  }, [scan.id]);

  const remove = async () => {
    setBusy(true);
    setError("");
    const ok = await removeScan(scan.id);
    setBusy(false);
    if (!ok) setError("We couldn't delete that scan. Try again.");
    else setConfirming(false);
  };

  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <p className="d-mono text-[12px] text-[var(--d-t3)]">
        Scan from {new Date(scan.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
        {score != null ? <span className="text-[var(--d-t2)]"> · {score}/100</span> : null}
        <span className="text-[var(--d-t4)]"> · {scans.findIndex((s) => s.id === scan.id) + 1} of {scans.length}</span>
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {error && <span className="text-[12px] text-[var(--d-warn)]">{error}</span>}
        {confirming ? (
          <>
            <span className="text-[12px] text-[var(--d-t2)]">Delete the {shortDate(scan.created_at)} scan?</span>
            <button type="button" className="d-btn d-btn-ghost d-btn-sm !px-3" onClick={() => setConfirming(false)} disabled={busy}>
              Keep it
            </button>
            <button type="button" className="d-btn d-btn-sm !px-3" style={{ background: "rgba(252,165,165,0.14)", color: "#fca5a5", border: "1px solid rgba(252,165,165,0.35)" }} onClick={remove} disabled={busy}>
              {busy ? "Deleting…" : "Delete"}
            </button>
          </>
        ) : (
          <>
            <button type="button" className="d-btn d-btn-ghost d-btn-sm !px-3 text-[var(--d-t2)]" onClick={() => setConfirming(true)}>
              Delete scan
            </button>
            <Link to={NEW_SCAN} className="d-btn d-btn-ghost d-btn-sm">
              <span>New scan</span>
              <span className="d-btn-dot">
                <Plus className="h-3 w-3" strokeWidth={1.75} />
              </span>
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

import React from "react";
import { GenerationFailed, GenerationNotice, useLeaveWarning } from "../../GenerationNotice";
import { useDashboard } from "../DashboardLayout";
import { sectionByKey } from "../sections";
import { ratioTone, skincareOf, type Scan } from "../scanData";
import { Locked, useGeneratedReport } from "./shared";
import { generateSkincareRoutine } from "../../../services/aiService";
import { updateSkincareAnalysis } from "../../../services/supabase";

const meta = sectionByKey("skincare");

/** Skin type, concerns and the morning and night routine, built from the scan photo. */
export const SkincareReport: React.FC<{ scan: Scan }> = ({ scan }) => {
  const { isPaid, userId, refresh } = useDashboard();

  // One automatic attempt per scan, then "Try again". It starts for every signed-in account (free accounts see the
  // result blurred), exactly as the old skincare tab did.
  const report = useGeneratedReport<any>({
    scanId: scan.id,
    existing: skincareOf(scan),
    enabled: !!userId,
    generate: () => generateSkincareRoutine(scan.front_photo_url),
    save: (result) => (userId ? updateSkincareAnalysis(scan.id, userId, result) : Promise.resolve()),
    onSaved: refresh,
  });
  useLeaveWarning(report.loading);

  const a = report.value?.analysis ?? {};
  const severity = Math.max(0, Math.min(10, Number(a.severity_score) || 0));

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
      <div className="lg:col-span-8">
        <div className="d-card overflow-hidden">
          <Locked locked={!isPaid} meta={meta} note="Your skin type, the concerns that matter, and a morning and night routine." minHeight={460}>
            {report.loading ? (
              <div className="space-y-4 p-6">
                <GenerationNotice what="skincare report" />
                <div className="d-skel h-32" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="d-skel h-48" />
                  <div className="d-skel h-48" />
                </div>
              </div>
            ) : report.value ? (
              <Results data={report.value} />
            ) : report.failed ? (
              <GenerationFailed what="skincare report" onRetry={report.retry} />
            ) : (
              <p className="d-body p-10 text-center">Your skincare report will appear here.</p>
            )}
          </Locked>
        </div>
      </div>

      <aside className="space-y-5 lg:col-span-4">
        <section className="d-card p-6" aria-label="Skin at a glance">
          <p className="d-eyebrow mb-4">At a glance</p>
          <div style={!isPaid ? { filter: "blur(8px)", opacity: 0.5 } : undefined} aria-hidden={!isPaid}>
            <p className="text-[28px] font-semibold capitalize leading-none tracking-[-0.03em]">{report.value ? a.skin_type || "Unknown" : "—"}</p>
            <p className="d-eyebrow mb-2.5 mt-6">Severity</p>
            <div className="flex items-center gap-3">
              <div className="flex flex-1 gap-1" role="img" aria-label={`Severity ${severity} of 10`}>
                {Array.from({ length: 10 }, (_, i) => (
                  <span key={i} className="h-4 flex-1 rounded-[2px]" style={{ background: report.value && i < severity ? ratioTone(10 - severity) : "transparent", border: report.value && i < severity ? "none" : "1px solid var(--d-line3)" }} />
                ))}
              </div>
              <span className="d-mono text-[13px]">{report.value ? severity : "–"}/10</span>
            </div>
            {Array.isArray(a.concerns) && a.concerns.length > 0 && (
              <>
                <p className="d-eyebrow mb-2.5 mt-6">Main concerns</p>
                <div className="flex flex-wrap gap-1.5">
                  {a.concerns.map((c: string) => (
                    <span key={c} className="rounded-md border border-[var(--d-line2)] px-2.5 py-1 text-[12.5px] text-[var(--d-t2)]">
                      {c}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>

        <section className="d-card p-6">
          <p className="d-eyebrow mb-4">Best photo for this</p>
          <ul className="space-y-2.5">
            {meta.photoTips.map((t) => (
              <li key={t} className="flex gap-3 text-[13px] leading-snug text-[var(--d-t3)]">
                <span className="mt-[7px] h-px w-3 shrink-0 bg-[var(--d-t4)]" />
                {t}
              </li>
            ))}
          </ul>
        </section>
      </aside>
    </div>
  );
};

const Step: React.FC<{ n: number; step: any }> = ({ n, step }) => (
  <li className="flex gap-4">
    <span className="d-mono mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md border border-[var(--d-line2)] text-[11px] text-[var(--d-t2)]">{n}</span>
    <div className="min-w-0">
      <p className="text-[14px] font-medium">
        {step.step}
        {step.product_type ? <span className="font-normal text-[var(--d-accent)]">: {step.product_type}</span> : null}
      </p>
      {step.reason && <p className="mt-1 text-[13px] leading-relaxed text-[var(--d-t3)]">{step.reason}</p>}
    </div>
  </li>
);

const Results: React.FC<{ data: any }> = ({ data }) => (
  <div className="divide-y divide-[var(--d-line)]">
    <section className="p-6 sm:p-7">
      <p className="d-eyebrow mb-3">Skin assessment</p>
      <p className="text-[15px] leading-relaxed">{data.analysis?.summary || "Analysis complete."}</p>
    </section>

    {data.improvements?.length > 0 && (
      <section className="p-6 sm:p-7">
        <p className="d-eyebrow mb-4">Key improvements</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {data.improvements.map((item: any, i: number) => (
            <div key={i} className="rounded-xl border border-[var(--d-line)] bg-[var(--d-s2)] p-4">
              <p className="text-[14px] font-medium">{item.area}</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--d-t3)]">{item.advice}</p>
            </div>
          ))}
        </div>
      </section>
    )}

    {data.routine && (
      <section className="grid grid-cols-1 gap-8 p-6 sm:p-7 md:grid-cols-2">
        <div>
          <p className="d-eyebrow mb-5">Morning routine</p>
          <ol className="space-y-5">{data.routine.morning?.map((s: any, i: number) => <Step key={i} n={i + 1} step={s} />)}</ol>
        </div>
        <div>
          <p className="d-eyebrow mb-5">Night routine</p>
          <ol className="space-y-5">{data.routine.evening?.map((s: any, i: number) => <Step key={i} n={i + 1} step={s} />)}</ol>
        </div>
      </section>
    )}
  </div>
);

import React, { useState } from "react";
import { Check, Expand } from "lucide-react";
import { GenerationFailed, GenerationNotice, useLeaveWarning } from "../../GenerationNotice";
import { Arrow, useDashboard } from "../DashboardLayout";
import { sectionByKey } from "../sections";
import { colorImageUrl, hairstyleImageUrl, type Scan } from "../scanData";
import { SectionArt } from "../visuals";
import { Lightbox, Locked, useGeneratedReport } from "./shared";
import { generateColorAnalysis, generateHairstyleAnalysis } from "../../../services/aiService";
import { saveStyleAnalysisImage } from "../../../services/supabase";

/**
 * Color and hairstyle analysis. Both are one generated image per scan: it is made once (Pro), saved to the scan, and
 * shown here at full width. Replaces the "Style" tab and its two sub-tabs.
 */
export const StyleReport: React.FC<{ kind: "color" | "hairstyle"; scan: Scan }> = ({ kind, scan }) => {
  const { isPaid, userId, refresh, upgradeHref, upgradePrice } = useDashboard();
  const meta = sectionByKey(kind);
  const [open, setOpen] = useState(false);
  const color = kind === "color";

  // Pro accounts get one automatic attempt per scan; after that it is a "Try again" button.
  const report = useGeneratedReport<string>({
    scanId: scan.id,
    existing: (color ? colorImageUrl(scan) : hairstyleImageUrl(scan)) ?? null,
    enabled: isPaid && !!userId,
    generate: () => (color ? generateColorAnalysis(scan.front_photo_url) : generateHairstyleAnalysis(scan.front_photo_url)),
    save: (image) => (userId ? saveStyleAnalysisImage(scan.id, userId, kind, image) : Promise.resolve()),
    onSaved: refresh,
  });
  useLeaveWarning(report.loading);

  const noun = color ? "color analysis" : "hairstyle analysis";
  // the infographic is landscape for color and a tall sheet for hairstyle
  const frame = color ? "aspect-[3/2]" : "aspect-[4/5]";

  return (
    <div className="grid gap-5 lg:grid-cols-12">
      <div className="lg:col-span-8">
        <div className="d-bezel h-full">
          <div className="d-core relative h-full">
            <Locked locked={!isPaid} meta={meta} minHeight={460}>
              {report.loading ? (
                <div className="space-y-4 p-6">
                  <GenerationNotice what={noun} />
                  <div className={`d-skel w-full ${frame} max-h-[620px]`} />
                </div>
              ) : report.value ? (
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  className="group relative block w-full bg-[var(--d-s2)]"
                  aria-label={`Open your ${noun} full size`}
                >
                  <img src={report.value} alt={color ? "Your personal color analysis" : "Your hairstyle analysis"} className="mx-auto max-h-[78vh] w-auto max-w-full object-contain" />
                  <span className="d-chip absolute right-4 top-4 bg-[var(--d-bg)] opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
                    <Expand className="h-3 w-3" strokeWidth={1.75} /> Full size
                  </span>
                </button>
              ) : report.failed ? (
                <GenerationFailed what={noun} onRetry={report.retry} />
              ) : (
                <div className="grid min-h-[420px] place-items-center p-8 text-center">
                  <div className="max-w-sm">
                    <SectionArt kind={kind} className="mx-auto mb-6 w-[220px] opacity-90" />
                    <h2 className="d-h2">Getting your {noun} ready</h2>
                    <p className="d-body mt-2">It starts as soon as this page opens, and it is saved to this scan afterwards.</p>
                  </div>
                </div>
              )}
            </Locked>
          </div>
        </div>
      </div>

      <aside className="d-card flex flex-col p-6 lg:col-span-4">
        <p className="d-eyebrow mb-5">Inside this report</p>
        <ul className="space-y-3.5">
          {meta.inside.map((line) => (
            <li key={line} className="flex gap-3 text-[14px] leading-snug text-[var(--d-t2)]">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--d-accent)]" strokeWidth={1.75} />
              {line}
            </li>
          ))}
        </ul>

        <div className="d-hair my-6" />
        <p className="d-eyebrow mb-4">Best photo for this</p>
        <ul className="space-y-2.5">
          {meta.photoTips.map((t) => (
            <li key={t} className="flex gap-3 text-[13px] leading-snug text-[var(--d-t3)]">
              <span className="mt-[7px] h-px w-3 shrink-0 bg-[var(--d-t4)]" />
              {t}
            </li>
          ))}
        </ul>

        <div className="mt-auto pt-8">
          {!isPaid ? (
            <a href={upgradeHref} className="d-btn d-btn-primary w-full justify-between">
              <span>Unlock · {upgradePrice}</span>
              <span className="d-btn-dot">
                <Arrow />
              </span>
            </a>
          ) : report.value ? (
            <button type="button" onClick={() => setOpen(true)} className="d-btn d-btn-primary w-full justify-between">
              <span>Open full size</span>
              <span className="d-btn-dot">
                <Expand className="h-3.5 w-3.5" strokeWidth={1.75} />
              </span>
            </button>
          ) : (
            <p className="text-center text-[12px] text-[var(--d-t3)]">{report.loading ? "Takes about 30 seconds. Keep the page open." : "Not generated yet."}</p>
          )}
        </div>
      </aside>

      {open && report.value && <Lightbox src={report.value} alt={`Your ${noun}`} onClose={() => setOpen(false)} />}
    </div>
  );
};

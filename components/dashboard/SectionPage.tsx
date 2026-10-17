import React from "react";
import { Link } from "react-router-dom";
import { Arrow, useDashboard } from "./DashboardLayout";
import { SECTIONS, sectionByKey, statusOf } from "./sections";
import { score100, shortDate, withScan, type Scan, type SectionKey } from "./scanData";
import { Reveal } from "./visuals";
import { NoScan, ScanBar } from "./report/shared";
import { FacialReport } from "./report/FacialReport";
import { SkincareReport } from "./report/SkincareReport";
import { StyleReport } from "./report/StyleReport";

/** One report page: header, which scan you are looking at, then the report itself. */
export const SectionPage: React.FC<{ kind: SectionKey }> = ({ kind }) => {
  const meta = sectionByKey(kind);
  const { loading, scans, selected, selectScan, isPaid } = useDashboard();

  if (loading) {
    return (
      <div aria-busy="true" aria-label="Loading">
        <div className="d-skel mb-4 h-3 w-28" />
        <div className="d-skel mb-4 h-10 w-80 max-w-full" />
        <div className="d-skel mb-10 h-4 w-96 max-w-full" />
        <div className="grid gap-5 lg:grid-cols-12">
          <div className="d-skel h-[460px] lg:col-span-8" />
          <div className="d-skel h-[460px] lg:col-span-4" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <header className="mb-8 sm:mb-10">
        <p className="d-eyebrow mb-4">
          Report {meta.index} <span className="text-[var(--d-t4)]">/ 04</span>
        </p>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h1 className="d-h1">{meta.title}</h1>
            <p className="d-body mt-3 max-w-xl">{meta.blurb}</p>
          </div>
          {scans.length > 1 && <ScanPicker scans={scans} selectedId={selected?.id} onPick={selectScan} />}
        </div>
      </header>

      {selected ? (
        <>
          <ScanBar scan={selected} score={isPaid ? score100(selected) : null} />
          {/* key: switching scan resets every report's local state */}
          <Reveal key={`${kind}-${selected.id}`}>
            {kind === "facial" ? (
              <FacialReport scan={selected} />
            ) : kind === "skincare" ? (
              <SkincareReport scan={selected} />
            ) : (
              <StyleReport kind={kind} scan={selected} />
            )}
          </Reveal>
        </>
      ) : (
        <div className="d-bezel">
          <div className="d-core">
            <NoScan />
          </div>
        </div>
      )}

      <OtherReports current={kind} scan={selected} isPaid={isPaid} />
    </div>
  );
};

const ScanPicker: React.FC<{ scans: Scan[]; selectedId?: string; onPick: (id: string) => void }> = ({ scans, selectedId, onPick }) => (
  <div>
    <p className="d-eyebrow mb-2.5 lg:text-right">Scan</p>
    <div role="radiogroup" aria-label="Choose a scan" className="d-scroll-x flex max-w-full gap-2 overflow-x-auto">
      {scans.slice(0, 8).map((s) => {
        const on = s.id === selectedId;
        return (
          <button
            key={s.id}
            role="radio"
            aria-checked={on}
            onClick={() => onPick(s.id)}
            title={shortDate(s.created_at)}
            className="relative h-11 w-11 shrink-0 overflow-hidden rounded-[10px] border transition-[border-color,opacity,transform] duration-200 active:scale-95"
            style={{ borderColor: on ? "var(--d-accent)" : "var(--d-line2)", opacity: on ? 1 : 0.55 }}
          >
            <img src={s.front_photo_url} alt={`Scan from ${shortDate(s.created_at)}`} className="h-full w-full object-cover" />
          </button>
        );
      })}
    </div>
  </div>
);

const OtherReports: React.FC<{ current: SectionKey; scan: Scan | null; isPaid: boolean }> = ({ current, scan, isPaid }) => (
  <Reveal className="mt-10">
    <p className="d-eyebrow mb-4">Other reports</p>
    <div className="grid gap-3 sm:grid-cols-3">
      {SECTIONS.filter((s) => s.key !== current).map((s) => {
        const st = statusOf(s, scan, isPaid);
        return (
          <Link key={s.key} to={withScan(s.route, scan?.id)} className="d-card group flex items-center gap-4 p-4 transition-colors duration-300 hover:border-[var(--d-line3)]">
            <span className="d-mono text-[11px] text-[var(--d-t4)]">{s.index}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-medium">{s.title}</span>
              <span className="d-chip mt-1.5" data-tone={st.tone}>{st.label}</span>
            </span>
            <span className="d-link"><Arrow /></span>
          </Link>
        );
      })}
    </div>
  </Reveal>
);

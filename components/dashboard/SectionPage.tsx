import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Lock } from "lucide-react";
import { Arrow, useDashboard } from "./DashboardLayout";
import { NEW_SCAN, SECTIONS, sectionByKey, statusOf, type SectionMeta } from "./sections";
import {
  FREE_METRIC_NAMES,
  colorImageUrl,
  hairstyleImageUrl,
  metricsOf,
  percentileLabel,
  ratioTone,
  reportsReady,
  score100,
  shortDate,
  skincareOf,
  type Scan,
  type SectionKey,
} from "./scanData";
import { CaliperRule, Reveal, ScanPortrait, SectionArt } from "./visuals";

export const SectionPage: React.FC<{ kind: SectionKey }> = ({ kind }) => {
  const meta = sectionByKey(kind);
  const { loading, scans, latest, isPaid, upgradeHref, upgradePrice } = useDashboard();
  const [pickedId, setPickedId] = useState<string | null>(null);

  // follow the newest scan until the user picks another one
  useEffect(() => setPickedId(null), [kind]);
  const scan = useMemo(() => scans.find((s) => s.id === pickedId) ?? latest, [scans, pickedId, latest]);

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

  const st = statusOf(meta, scan, isPaid);
  const open = scan ? meta.deepLink(scan.id) : NEW_SCAN;

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
          {scans.length > 1 && <ScanPicker scans={scans} selectedId={scan?.id} onPick={setPickedId} />}
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-12">
        <Reveal className="lg:col-span-8">
          <div className="d-bezel h-full">
            <div className="d-core relative h-full min-h-[420px]">
              {!scan ? (
                <NoScan />
              ) : kind === "facial" ? (
                <FacialPreview scan={scan} isPaid={isPaid} />
              ) : kind === "skincare" ? (
                <Locked locked={st.locked} href={upgradeHref} price={upgradePrice} meta={meta}>
                  <SkincarePreview scan={scan} />
                </Locked>
              ) : (
                <Locked locked={st.locked} href={upgradeHref} price={upgradePrice} meta={meta}>
                  <StylePreview kind={kind} scan={scan} />
                </Locked>
              )}
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.08} className="lg:col-span-4">
          <aside className="d-card flex h-full flex-col p-6">
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
              <PrimaryAction scan={scan} meta={meta} status={st} open={open} href={upgradeHref} price={upgradePrice} />
            </div>
          </aside>
        </Reveal>
      </div>

      {scan && scans.length > 0 && (
        <Reveal className="mt-5">
          <HistoryStrip meta={meta} scans={scans} selectedId={scan.id} onPick={setPickedId} />
        </Reveal>
      )}

      <OtherReports current={kind} scan={scan} isPaid={isPaid} />
    </div>
  );
};

/* ---------------------------------------------------------------------------------------------- */

const PrimaryAction: React.FC<{
  scan: Scan | null;
  meta: SectionMeta;
  status: ReturnType<typeof statusOf>;
  open: string;
  href: string;
  price: string;
}> = ({ scan, meta, status, open, href, price }) => {
  if (!scan) {
    return (
      <Link to={NEW_SCAN} className="d-btn d-btn-primary w-full justify-between">
        <span>Take a scan first</span>
        <span className="d-btn-dot"><Arrow /></span>
      </Link>
    );
  }
  if (status.locked) {
    return (
      <div className="space-y-3">
        <a href={href} className="d-btn d-btn-primary w-full justify-between">
          <span>Unlock all reports · {price}</span>
          <span className="d-btn-dot"><Arrow /></span>
        </a>
        <p className="text-center text-[12px] text-[var(--d-t3)]">Opens your score, skincare, color and hairstyle reports.</p>
      </div>
    );
  }
  const label = meta.key === "facial" ? "Open full report" : status.ready ? "Open report" : "Generate report";
  return (
    <div className="space-y-3">
      <Link to={open} className="d-btn d-btn-primary w-full justify-between">
        <span>{label}</span>
        <span className="d-btn-dot"><Arrow /></span>
      </Link>
      {!status.ready && meta.key !== "facial" && <p className="text-center text-[12px] text-[var(--d-t3)]">Takes about 30 seconds. Keep the page open while it runs.</p>}
    </div>
  );
};

/* ---------------------------------------------------------------------------------------------- */

const ScanPicker: React.FC<{ scans: Scan[]; selectedId?: string; onPick: (id: string) => void }> = ({ scans, selectedId, onPick }) => (
  <div>
    <p className="d-eyebrow mb-2.5 lg:text-right">Scan</p>
    <div role="radiogroup" aria-label="Choose a scan" className="d-scroll-x flex max-w-full gap-2 overflow-x-auto">
      {scans.slice(0, 7).map((s) => {
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

/* ---------------------------------------------------------------------------------------------- */

const NoScan: React.FC = () => (
  <div className="grid h-full min-h-[420px] place-items-center p-8 text-center">
    <div className="max-w-sm">
      <SectionArt kind="facial" className="mx-auto mb-6 w-[200px] opacity-80" />
      <h2 className="d-h2">Every report starts with a scan</h2>
      <p className="d-body mt-2">Upload one front-facing photo and this report is built from it.</p>
      <Link to={NEW_SCAN} className="d-btn d-btn-primary mt-6">
        <span>Upload a photo</span>
        <span className="d-btn-dot"><Arrow /></span>
      </Link>
    </div>
  </div>
);

/** Blurs a preview and overlays an unlock prompt for free accounts. */
const Locked: React.FC<{ locked: boolean; href: string; price: string; meta: SectionMeta; children: React.ReactNode }> = ({ locked, href, price, meta, children }) => {
  if (!locked) return <>{children}</>;
  return (
    <div className="relative h-full min-h-[420px] overflow-hidden">
      <div className="pointer-events-none h-full select-none" style={{ filter: "blur(14px)", opacity: 0.4 }} aria-hidden="true">
        {children}
      </div>
      <div className="absolute inset-0 grid place-items-center p-6 text-center">
        <div className="d-card-raised max-w-xs p-7">
          <span className="mx-auto mb-4 grid h-10 w-10 place-items-center rounded-xl border border-[var(--d-line2)] bg-[var(--d-s3)] text-[var(--d-accent)]">
            <Lock className="h-[18px] w-[18px]" strokeWidth={1.5} />
          </span>
          <h3 className="text-[16px] font-semibold tracking-[-0.02em]">{meta.title} is Pro</h3>
          <p className="d-body mt-1.5">{meta.blurb.split(",")[0].replace(/\.$/, "")}.</p>
          <a href={href} className="d-btn d-btn-primary d-btn-sm mt-5 w-full justify-between">
            <span>Unlock · {price}</span>
            <span className="d-btn-dot"><Arrow /></span>
          </a>
        </div>
      </div>
    </div>
  );
};

/* ---------------------------------------------------------------------------------------------- */

const FacialPreview: React.FC<{ scan: Scan; isPaid: boolean }> = ({ scan, isPaid }) => {
  const metrics = useMemo(() => metricsOf(scan), [scan]);
  const score = score100(scan);
  const open = (name: string) => isPaid || FREE_METRIC_NAMES.includes(name);
  const rows = useMemo(
    () =>
      [...metrics]
        .filter((m) => open(m.name))
        .sort((a, b) => (isPaid ? a.score - b.score : FREE_METRIC_NAMES.indexOf(a.name) - FREE_METRIC_NAMES.indexOf(b.name)))
        .slice(0, 6),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [metrics, isPaid],
  );
  const locked = metrics.length - rows.length;

  return (
    <div className="grid h-full md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <ScanPortrait src={scan.front_photo_url} landmarks={scan.front_landmarks} aspect="aspect-[5/4] md:aspect-auto" className="md:h-full md:min-h-[420px]" />
      <div className="flex flex-col p-6 sm:p-8">
        <div className="flex items-baseline justify-between">
          <span className="d-eyebrow">Facial harmony</span>
          <span className="d-mono text-[11px] text-[var(--d-t3)]">{shortDate(scan.created_at)}</span>
        </div>
        <div className="mt-4 flex items-baseline gap-2">
          <span className={`d-num text-[72px] font-light leading-[0.95] ${isPaid && score != null ? "" : "text-[var(--d-t4)]"}`}>{isPaid && score != null ? score : "??"}</span>
          <span className="d-mono text-[14px] text-[var(--d-t3)]">/100</span>
          {isPaid && score != null && <span className="d-chip ml-2" data-tone="ready">{percentileLabel(score)}</span>}
        </div>
        <div className="mt-3">
          <CaliperRule value={score ?? 0} masked={!isPaid || score == null} label="Score on a 0 to 100 scale" />
        </div>

        <p className="d-eyebrow mb-1 mt-6">{isPaid ? "Needs the most work" : "Free ratios"}</p>
        <ul>
          {rows.map((m) => (
            <li key={m.key} className="flex items-center gap-3 border-b border-[var(--d-line)] py-2.5 last:border-b-0">
              <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--d-t2)]">{m.name}</span>
              <span className="relative h-[3px] w-14 overflow-hidden rounded-full bg-[var(--d-s3)]">
                <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${m.score * 10}%`, background: ratioTone(m.score) }} />
              </span>
              <span className="d-mono w-8 text-right text-[13px]" style={{ color: ratioTone(m.score) }}>
                {m.score.toFixed(1)}
              </span>
            </li>
          ))}
          {!isPaid && locked > 0 && (
            <li className="mt-1 flex items-center gap-2 rounded-lg border border-dashed border-[var(--d-line3)] px-3 py-2.5 text-[12px] text-[var(--d-t3)]">
              <Lock className="h-3.5 w-3.5" strokeWidth={1.5} />
              {locked} more ratios in Pro
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

const SkincarePreview: React.FC<{ scan: Scan }> = ({ scan }) => {
  const data = skincareOf(scan);
  if (!data) return <NotRun kind="skincare" />;
  const a = data.analysis ?? {};
  const sev = Number(a.severity_score) || 0;
  const morning = data.routine?.morning?.length ?? 0;
  const evening = data.routine?.evening?.length ?? 0;

  return (
    <div className="grid h-full gap-0 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <ScanPortrait src={scan.front_photo_url} plain aspect="aspect-[5/4] md:aspect-auto" className="md:h-full md:min-h-[420px]" alt="Photo used for this skin analysis" />
      <div className="flex flex-col p-6 sm:p-8">
        <span className="d-eyebrow">Skin type</span>
        <p className="mt-3 text-[32px] font-semibold capitalize leading-none tracking-[-0.03em]">{a.skin_type || "Unknown"}</p>

        <p className="d-eyebrow mb-3 mt-7">Severity</p>
        <div className="flex items-center gap-3">
          <div className="flex flex-1 gap-1" role="img" aria-label={`Severity ${sev} of 10`}>
            {Array.from({ length: 10 }, (_, i) => (
              <span key={i} className="h-5 flex-1 rounded-[2px]" style={{ background: i < sev ? ratioTone(10 - sev) : "transparent", border: i < sev ? "none" : "1px solid var(--d-line3)" }} />
            ))}
          </div>
          <span className="d-mono text-[13px]">{sev}/10</span>
        </div>

        {Array.isArray(a.concerns) && a.concerns.length > 0 && (
          <>
            <p className="d-eyebrow mb-3 mt-7">Main concerns</p>
            <div className="flex flex-wrap gap-2">
              {a.concerns.slice(0, 5).map((c: string) => (
                <span key={c} className="rounded-lg border border-[var(--d-line2)] px-2.5 py-1 text-[12.5px] text-[var(--d-t2)]">
                  {c}
                </span>
              ))}
            </div>
          </>
        )}

        {a.summary && <p className="d-body mt-6 line-clamp-3">{a.summary}</p>}

        <div className="mt-auto grid grid-cols-2 gap-3 pt-6">
          <div className="rounded-xl border border-[var(--d-line)] bg-[var(--d-s2)] p-3.5">
            <p className="d-eyebrow">Morning</p>
            <p className="d-mono d-num mt-2 text-[22px]">{morning} <span className="text-[12px] text-[var(--d-t3)]">steps</span></p>
          </div>
          <div className="rounded-xl border border-[var(--d-line)] bg-[var(--d-s2)] p-3.5">
            <p className="d-eyebrow">Night</p>
            <p className="d-mono d-num mt-2 text-[22px]">{evening} <span className="text-[12px] text-[var(--d-t3)]">steps</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};

const StylePreview: React.FC<{ kind: "color" | "hairstyle"; scan: Scan }> = ({ kind, scan }) => {
  const url = kind === "color" ? colorImageUrl(scan) : hairstyleImageUrl(scan);
  if (!url) return <NotRun kind={kind} />;
  return (
    <a href={url} target="_blank" rel="noreferrer" className="group relative block h-full bg-[var(--d-s2)]" aria-label={`Open the ${kind} analysis full size`}>
      <img src={url} alt={kind === "color" ? "Your personal color analysis" : "Your hairstyle analysis"} className="h-full max-h-[640px] w-full object-contain" loading="lazy" />
      <span className="d-chip absolute right-4 top-4 bg-[var(--d-bg)] opacity-0 transition-opacity duration-200 group-hover:opacity-100">Open full size</span>
    </a>
  );
};

const NotRun: React.FC<{ kind: SectionKey }> = ({ kind }) => (
  <div className="grid h-full min-h-[420px] place-items-center p-8 text-center">
    <div className="max-w-sm">
      <SectionArt kind={kind} className="mx-auto mb-6 w-[220px] opacity-90" />
      <h2 className="d-h2">Not generated for this scan</h2>
      <p className="d-body mt-2">Open the report and it is built from your photo. It is saved here afterwards, so you only wait once.</p>
    </div>
  </div>
);

/* ---------------------------------------------------------------------------------------------- */

const HistoryStrip: React.FC<{ meta: SectionMeta; scans: Scan[]; selectedId: string; onPick: (id: string) => void }> = ({ meta, scans, selectedId, onPick }) => (
  <section className="d-card p-6" aria-label={`${meta.title} across your scans`}>
    <div className="mb-5 flex items-center justify-between">
      <p className="d-eyebrow">{meta.short} across your scans</p>
      <p className="d-mono text-[12px] text-[var(--d-t3)]">{scans.filter((s) => reportsReady(s)[meta.key]).length} of {scans.length} done</p>
    </div>
    <ul className="d-scroll-x flex gap-3 overflow-x-auto pb-1">
      {scans.map((s) => {
        const done = reportsReady(s)[meta.key];
        const on = s.id === selectedId;
        return (
          <li key={s.id} className="shrink-0">
            <button
              onClick={() => onPick(s.id)}
              className="group flex w-[116px] flex-col gap-2 text-left transition-opacity"
              style={{ opacity: on ? 1 : 0.7 }}
              aria-pressed={on}
            >
              <span className="relative block aspect-[4/5] overflow-hidden rounded-xl border" style={{ borderColor: on ? "var(--d-accent)" : "var(--d-line2)" }}>
                <img src={s.front_photo_url} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <span
                  className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full"
                  style={{ background: done ? "var(--d-accent)" : "rgba(7,8,13,0.7)", color: done ? "#07080d" : "var(--d-t3)", border: done ? "none" : "1px dashed var(--d-line3)" }}
                  aria-label={done ? "Done" : "Not run"}
                >
                  {done && <Check className="h-3 w-3" strokeWidth={2.5} />}
                </span>
              </span>
              <span className="d-mono text-[11px] text-[var(--d-t3)]">{shortDate(s.created_at)}</span>
            </button>
          </li>
        );
      })}
    </ul>
  </section>
);

const OtherReports: React.FC<{ current: SectionKey; scan: Scan | null; isPaid: boolean }> = ({ current, scan, isPaid }) => (
  <Reveal className="mt-10">
    <p className="d-eyebrow mb-4">Other reports</p>
    <div className="grid gap-3 sm:grid-cols-3">
      {SECTIONS.filter((s) => s.key !== current).map((s) => {
        const st = statusOf(s, scan, isPaid);
        return (
          <Link key={s.key} to={s.route} className="d-card group flex items-center gap-4 p-4 transition-colors duration-300 hover:border-[var(--d-line3)]">
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

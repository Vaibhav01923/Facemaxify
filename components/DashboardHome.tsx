import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { Lock, Plus } from "lucide-react";
import { Arrow, PlanTerms, useDashboard } from "./dashboard/DashboardLayout";
import { NEW_SCAN, SECTIONS, statusOf, type SectionMeta } from "./dashboard/sections";
import {
  FREE_METRIC_NAMES,
  colorImageUrl,
  greeting,
  hairstyleImageUrl,
  metricsOf,
  percentileLabel,
  ratioTone,
  reportsReady,
  score100,
  shortDate,
  skincareOf,
  timeAgo,
  withScan,
  type Scan,
} from "./dashboard/scanData";
import { CaliperRule, CountUp, Reveal, ScanPortrait, ScoreTrend, SectionArt, StepTicks } from "./dashboard/visuals";

/* ---------------------------------------------------------------------------------------------- */

export const DashboardHome: React.FC = () => {
  const { user } = useUser();
  const { loading, latest, scans } = useDashboard();
  const name = user?.firstName;

  if (loading) return <OverviewSkeleton />;

  return (
    <div>
      <header className="mb-8 flex flex-col gap-5 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="d-eyebrow mb-4">Overview</p>
          <h1 className="d-h1">
            {greeting()}
            {name ? `, ${name}` : ""}
          </h1>
          <p className="d-body mt-3 max-w-md">
            {latest
              ? `Your last scan was ${timeAgo(latest.created_at)}. ${scans.length} scan${scans.length === 1 ? "" : "s"} saved.`
              : "Nothing measured yet. One photo is enough to start."}
          </p>
        </div>
        {latest && (
          <Link to={NEW_SCAN} className="d-btn d-btn-ghost self-start sm:self-auto">
            <span>New scan</span>
            <span className="d-btn-dot">
              <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
            </span>
          </Link>
        )}
      </header>

      {latest ? <Filled /> : <FirstScan />}
    </div>
  );
};

/* ---------------------------------------------------------------------------------------------- */

const Filled: React.FC = () => {
  const { latest, previous, scans, isPaid } = useDashboard();
  const scan = latest!;
  const ready = reportsReady(scan);
  const readyCount = Object.values(ready).filter(Boolean).length;
  const score = score100(scan);
  const prevScore = previous ? score100(previous) : null;
  const delta = score != null && prevScore != null ? score - prevScore : null;
  const nextUp = SECTIONS.find((s) => !ready[s.key]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* ---------- hero: latest scan ---------- */}
        <Reveal className="lg:col-span-8">
          <div className="d-bezel h-full">
            <div className="d-core grid h-full grid-cols-1 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
              <ScanPortrait src={scan.front_photo_url} landmarks={scan.front_landmarks} aspect="aspect-[5/4] md:aspect-auto" className="md:h-full md:min-h-[360px]" />
              <div className="flex flex-col p-6 sm:p-8">
                <div className="flex items-center justify-between">
                  <span className="d-eyebrow">Facial harmony</span>
                  <span className="d-mono text-[11px] text-[var(--d-t3)]">{shortDate(scan.created_at)}</span>
                </div>

                <div className="mt-5 flex items-baseline gap-2">
                  {isPaid && score != null ? (
                    <CountUp value={score} className="d-num text-[clamp(84px,9vw,124px)] font-light leading-[0.9]" />
                  ) : (
                    <span className="d-num select-none text-[clamp(84px,9vw,124px)] font-light leading-[0.9] text-[var(--d-t4)]" aria-label="Score locked">
                      {isPaid ? "–" : "??"}
                    </span>
                  )}
                  <span className="d-mono text-[15px] text-[var(--d-t3)]">/100</span>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  {isPaid && score != null ? (
                    <>
                      <span className="d-chip" data-tone="ready">{percentileLabel(score)}</span>
                      {delta != null && delta !== 0 && (
                        <span className="d-chip" style={{ color: delta > 0 ? "var(--d-accent)" : "var(--d-warn)" }}>
                          {delta > 0 ? "+" : ""}
                          {delta} vs last scan
                        </span>
                      )}
                      {score >= 50 && <span className="d-chip">Above average face</span>}
                    </>
                  ) : (
                    <span className="d-chip" data-tone="lock">
                      <Lock className="h-3 w-3" strokeWidth={1.75} /> Score is Pro
                    </span>
                  )}
                </div>

                <div className="mt-6">
                  <CaliperRule value={score ?? 0} ghost={isPaid ? prevScore : null} masked={!isPaid || score == null} label="Where your score sits on the 0 to 100 scale" />
                </div>

                <div className="mt-auto flex flex-wrap items-center gap-3 pt-7">
                  <Link to={withScan(SECTIONS[0].route, scan.id)} className="d-btn d-btn-primary">
                    <span>Open full report</span>
                    <span className="d-btn-dot">
                      <Arrow />
                    </span>
                  </Link>
                  {!isPaid && <UnlockLink />}
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* ---------- reports for this scan ---------- */}
        <Reveal delay={0.08} className="lg:col-span-4">
          <section className="d-card flex h-full flex-col p-6" aria-labelledby="reports-h">
            <div className="flex items-center justify-between">
              <h2 id="reports-h" className="d-eyebrow">This scan</h2>
              <span className="d-mono text-[12px] text-[var(--d-t2)]">
                {readyCount} of 4 ready
              </span>
            </div>
            <div className="mt-4">
              <StepTicks done={readyCount} total={4} />
            </div>

            <ul className="mt-5 divide-y divide-[var(--d-line)]">
              {SECTIONS.map((s) => {
                const st = statusOf(s, scan, isPaid);
                return (
                  <li key={s.key}>
                    <Link to={withScan(s.route, scan.id)} className="group flex items-center gap-3 py-3">
                      <span className="d-mono w-5 text-[11px] text-[var(--d-t4)]">{s.index}</span>
                      <span className="flex-1 text-[14px] font-medium text-[var(--d-t1)]">{s.short}</span>
                      <span className="d-chip" data-tone={st.tone}>
                        {st.label}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>

            {nextUp && (
              <Link
                to={withScan(nextUp.route, scan.id)}
                className="group mt-auto flex items-center justify-between gap-3 rounded-xl border border-[var(--d-line2)] bg-[var(--d-s2)] px-4 py-3 transition-colors hover:border-[var(--d-accent-line)]"
              >
                <span>
                  <span className="d-eyebrow block">Next up</span>
                  <span className="mt-1.5 block text-[14px] font-medium">{nextUp.title}</span>
                </span>
                <span className="d-link">
                  <Arrow />
                </span>
              </Link>
            )}
          </section>
        </Reveal>
      </div>

      {/* ---------- the four reports ---------- */}
      <div className="pt-6 sm:pt-8">
        <Reveal>
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="d-eyebrow mb-3">Reports</p>
              <h2 className="d-h2">Everything we can read from your photo</h2>
            </div>
          </div>
        </Reveal>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {SECTIONS.map((s, i) => (
            <Reveal key={s.key} delay={(i % 2) * 0.06} className={i === 0 || i === 3 ? "lg:col-span-7" : "lg:col-span-5"}>
              <SectionCard section={s} scan={scan} isPaid={isPaid} />
            </Reveal>
          ))}
        </div>
      </div>

      {/* ---------- progress + history ---------- */}
      <div className="grid grid-cols-1 gap-5 pt-6 sm:pt-8 lg:grid-cols-12">
        <Reveal className="lg:col-span-7">
          <ProgressCard scans={scans} isPaid={isPaid} />
        </Reveal>
        <Reveal delay={0.06} className="lg:col-span-5">
          <RecentScans scans={scans} isPaid={isPaid} />
        </Reveal>
      </div>
    </div>
  );
};

/* ---------------------------------------------------------------------------------------------- */

const UnlockLink: React.FC = () => {
  const { upgradeHref, upgradePrice } = useDashboard();
  return (
    <div>
      <a href={upgradeHref} className="d-link">
        Unlock everything · {upgradePrice}
        <Arrow />
      </a>
      <PlanTerms className="mt-1" />
    </div>
  );
};

/* ---------------------------------------------------------------------------------------------- */

const SectionCard: React.FC<{ section: SectionMeta; scan: Scan | null; isPaid: boolean }> = ({ section: s, scan, isPaid }) => {
  const st = statusOf(s, scan, isPaid);
  const cta =
    !scan ? "Start with a scan"
    : st.tone === "lock" ? "See what's inside"
    : st.tone === "ready" ? "Open report"
    : "Generate report";
  const to = scan ? withScan(s.route, scan.id) : NEW_SCAN;

  return (
    <Link to={to} className="d-card group flex h-full flex-col overflow-hidden transition-colors duration-300 hover:border-[var(--d-line3)]">
      <div className="relative grid h-[168px] place-items-center overflow-hidden border-b border-[var(--d-line)] bg-[var(--d-s2)]">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-60"
          style={{ backgroundImage: "linear-gradient(var(--d-line) 1px, transparent 1px), linear-gradient(90deg, var(--d-line) 1px, transparent 1px)", backgroundSize: "24px 24px", maskImage: "radial-gradient(ellipse at center, #000 30%, transparent 75%)", WebkitMaskImage: "radial-gradient(ellipse at center, #000 30%, transparent 75%)" }}
        />
        <SectionArt kind={s.key} className="relative h-[150px] w-[240px] transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.04]" />
        <span className="d-mono absolute left-5 top-4 text-[11px] text-[var(--d-t3)]">{s.index}</span>
        <span className="d-chip absolute right-4 top-3.5" data-tone={st.tone}>
          {st.tone === "lock" && <Lock className="h-3 w-3" strokeWidth={1.75} />}
          {st.label}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-[18px] font-semibold tracking-[-0.02em]">{s.title}</h3>
        <p className="d-body mt-2 max-w-[46ch]">{s.blurb}</p>

        {s.key === "facial" && scan && <FacialSnapshot scan={scan} isPaid={isPaid} />}
        {s.key !== "facial" && scan && st.ready && !st.locked && <ReadySnapshot kind={s.key} scan={scan} />}
        {s.key !== "facial" && scan && !(st.ready && !st.locked) && (
          <div className="mt-5 grid aspect-[3/2] max-h-[190px] w-full place-items-center rounded-xl border border-dashed border-[var(--d-line3)] px-6 text-center">
            <p className="max-w-[28ch] text-[13px] leading-snug text-[var(--d-t3)]">
              {st.locked ? (
                <>
                  <Lock className="mx-auto mb-2 h-4 w-4" strokeWidth={1.5} />
                  Part of Pro. Unlock to see yours.
                </>
              ) : (
                "Not generated for this scan yet. It takes about 30 seconds."
              )}
            </p>
          </div>
        )}

        <span className="d-link mt-auto pt-5">
          {cta}
          <Arrow />
        </span>
      </div>
    </Link>
  );
};

/** A small readout of a finished report, so the card shows something real rather than only describing it. */
const ReadySnapshot: React.FC<{ kind: SectionMeta["key"]; scan: Scan }> = ({ kind, scan }) => {
  if (kind === "skincare") {
    const a = skincareOf(scan)?.analysis ?? {};
    const sev = Math.max(0, Math.min(10, Number(a.severity_score) || 0));
    return (
      <div className="mt-5 border-t border-[var(--d-line)] pt-5">
        <div className="mb-3 flex items-baseline justify-between">
          <span className="d-eyebrow">Skin type</span>
          <span className="d-mono text-[12px] text-[var(--d-t2)]">severity {sev}/10</span>
        </div>
        <p className="text-[22px] font-semibold capitalize leading-none tracking-[-0.03em]">{a.skin_type || "Unknown"}</p>
        <div className="mt-4 flex gap-1" role="img" aria-label={`Severity ${sev} of 10`}>
          {Array.from({ length: 10 }, (_, i) => (
            <span key={i} className="h-3 flex-1 rounded-[2px]" style={{ background: i < sev ? ratioTone(10 - sev) : "transparent", border: i < sev ? "none" : "1px solid var(--d-line3)" }} />
          ))}
        </div>
        {Array.isArray(a.concerns) && a.concerns.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {a.concerns.slice(0, 3).map((c: string) => (
              <span key={c} className="rounded-md border border-[var(--d-line2)] px-2 py-0.5 text-[12px] text-[var(--d-t2)]">
                {c}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }
  const url = kind === "color" ? colorImageUrl(scan) : hairstyleImageUrl(scan);
  if (!url) return null;
  return (
    <div className="mt-5 overflow-hidden rounded-xl border border-[var(--d-line2)] bg-[var(--d-s2)]">
      <img src={url} alt={kind === "color" ? "Your color analysis" : "Your hairstyle analysis"} loading="lazy" className="aspect-[3/2] w-full object-cover object-top" />
    </div>
  );
};

/** One tick per ratio, coloured by how close it sits to its ideal range, plus the weakest few. */
const FacialSnapshot: React.FC<{ scan: Scan; isPaid: boolean }> = ({ scan, isPaid }) => {
  const metrics = useMemo(() => metricsOf(scan), [scan]);
  if (metrics.length === 0) return null;

  const inRange = metrics.filter((m) => m.score >= 9.95).length;
  const weakest = [...metrics]
    .filter((m) => isPaid || FREE_METRIC_NAMES.includes(m.name))
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);
  const open = (name: string) => isPaid || FREE_METRIC_NAMES.includes(name);

  return (
    <div className="mt-5 border-t border-[var(--d-line)] pt-5">
      <div className="mb-3 flex items-baseline justify-between">
        <span className="d-eyebrow">{isPaid ? "Ratios" : "Free ratios"}</span>
        {isPaid ? (
          <span className="d-mono text-[12px] text-[var(--d-t2)]">
            {inRange} of {metrics.length} in the ideal range
          </span>
        ) : (
          <span className="d-mono text-[12px] text-[var(--d-t3)]">{FREE_METRIC_NAMES.length} of {metrics.length} open</span>
        )}
      </div>
      <div className="flex h-5 items-end gap-[3px]" role="img" aria-label={`${metrics.length} ratios, each coloured by score`}>
        {metrics.map((m) => (
          <span
            key={m.key}
            className="block flex-1 rounded-[2px]"
            style={{
              height: open(m.name) ? `${30 + m.score * 7}%` : "35%",
              background: open(m.name) ? ratioTone(m.score) : "transparent",
              border: open(m.name) ? "none" : "1px dashed var(--d-line3)",
              opacity: open(m.name) ? 0.9 : 1,
            }}
          />
        ))}
      </div>

      <p className="d-eyebrow mb-1 mt-5">{isPaid ? "Needs the most work" : "Your open ratios"}</p>
      <ul>
        {weakest.map((m) => (
          <li key={m.key} className="flex items-center gap-3 border-b border-[var(--d-line)] py-2.5 last:border-b-0">
            <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--d-t2)]">{m.name}</span>
            <span className="relative h-[3px] w-16 overflow-hidden rounded-full bg-[var(--d-s3)]">
              <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${m.score * 10}%`, background: ratioTone(m.score) }} />
            </span>
            <span className="d-mono w-8 text-right text-[13px]" style={{ color: ratioTone(m.score) }}>
              {m.score.toFixed(1)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

/* ---------------------------------------------------------------------------------------------- */

const ProgressCard: React.FC<{ scans: Scan[]; isPaid: boolean }> = ({ scans, isPaid }) => {
  const points = useMemo(
    () =>
      [...scans]
        .reverse()
        .slice(-8)
        .map((s) => ({ score: score100(s), label: shortDate(s.created_at) }))
        .filter((p): p is { score: number; label: string } => p.score != null),
    [scans],
  );
  const first = points[0]?.score;
  const last = points[points.length - 1]?.score;
  const change = points.length > 1 ? last - first : null;

  return (
    <section className="d-card h-full p-6 sm:p-7" aria-labelledby="progress-h">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p id="progress-h" className="d-eyebrow mb-3">Progress</p>
          <h2 className="d-h2">Score over time</h2>
        </div>
        {isPaid && change != null && (
          <span className="d-chip" style={{ color: change >= 0 ? "var(--d-accent)" : "var(--d-warn)" }}>
            {change > 0 ? "+" : ""}
            {change} since {points[0].label}
          </span>
        )}
      </div>

      {points.length >= 2 ? (
        <div className="relative">
          <ScoreTrend points={points} masked={!isPaid} />
          {!isPaid && (
            <div className="absolute inset-0 grid place-items-center">
              <span className="d-chip" data-tone="lock">
                <Lock className="h-3 w-3" strokeWidth={1.75} /> Trend is Pro
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="grid min-h-[150px] place-items-center rounded-xl border border-dashed border-[var(--d-line2)] px-6 py-8 text-center">
          <div>
            <p className="text-[14px] font-medium">One scan so far</p>
            <p className="d-body mx-auto mt-1.5 max-w-[34ch]">Scan again in a few weeks, in the same light, to see whether your score moves.</p>
          </div>
        </div>
      )}
    </section>
  );
};

const RecentScans: React.FC<{ scans: Scan[]; isPaid: boolean }> = ({ scans, isPaid }) => (
  <section className="d-card h-full p-6 sm:p-7" aria-labelledby="recent-h">
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <p id="recent-h" className="d-eyebrow mb-3">History</p>
        <h2 className="d-h2">Recent scans</h2>
      </div>
      <span className="d-mono text-[12px] text-[var(--d-t3)]">{scans.length}/20</span>
    </div>

    <ul className="grid grid-cols-3 gap-3">
      <li>
        <Link
          to={NEW_SCAN}
          className="group grid aspect-[4/5] place-items-center rounded-xl border border-dashed border-[var(--d-line3)] text-[var(--d-t3)] transition-colors hover:border-[var(--d-accent-line)] hover:text-[var(--d-accent)]"
        >
          <span className="flex flex-col items-center gap-2 text-[12px] font-medium">
            <Plus className="h-5 w-5 transition-transform duration-300 group-hover:rotate-90" strokeWidth={1.5} />
            New scan
          </span>
        </Link>
      </li>
      {scans.slice(0, 5).map((s) => {
        const sc = score100(s);
        return (
          <li key={s.id}>
            <Link to={withScan(SECTIONS[0].route, s.id)} className="group block">
              <span className="relative block aspect-[4/5] overflow-hidden rounded-xl border border-[var(--d-line2)] bg-[var(--d-s2)]">
                <img src={s.front_photo_url} alt={`Scan from ${shortDate(s.created_at)}`} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <span className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/70 to-transparent px-2 pb-1.5 pt-6">
                  <span className="d-mono text-[10px] text-[var(--d-t2)]">{shortDate(s.created_at)}</span>
                  <span className="d-mono d-num text-[13px] font-semibold">{isPaid && sc != null ? sc : "??"}</span>
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  </section>
);

/* ---------------------------------------------------------------------------------------------- */

const FirstScan: React.FC = () => {
  const steps = [
    ["Upload", "One front-facing photo, hair off your forehead."],
    ["Check the points", "We place the key landmarks on your face. Drag any that sit in the wrong spot."],
    ["Read your reports", "Facial ratios first, then skincare, color and hairstyle from the same photo."],
  ];
  return (
    <div className="space-y-5">
      <Reveal>
        <div className="d-bezel">
          <div className="d-core grid grid-cols-1 md:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
            <div className="flex flex-col p-7 sm:p-10">
              <span className="d-eyebrow">Start here</span>
              <h2 className="d-h1 mt-5 max-w-[16ch]">Take your first scan</h2>
              <p className="d-body mt-4 max-w-[44ch]">
                Upload one photo and we measure your face against 25+ ratios. Everything else on this page builds on that same photo.
              </p>
              <ol className="mt-8 space-y-4">
                {steps.map(([title, text], i) => (
                  <li key={title} className="flex gap-4">
                    <span className="d-mono mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md border border-[var(--d-line2)] text-[11px] text-[var(--d-t2)]">{i + 1}</span>
                    <span>
                      <span className="block text-[14px] font-medium">{title}</span>
                      <span className="d-body block">{text}</span>
                    </span>
                  </li>
                ))}
              </ol>
              <div className="mt-9">
                <Link to={NEW_SCAN} className="d-btn d-btn-primary">
                  <span>Upload a photo</span>
                  <span className="d-btn-dot">
                    <Arrow />
                  </span>
                </Link>
              </div>
            </div>
            <div className="relative hidden min-h-[360px] place-items-center border-l border-[var(--d-line)] bg-[var(--d-s2)] md:grid">
              <div
                aria-hidden="true"
                className="absolute inset-0 opacity-70"
                style={{ backgroundImage: "linear-gradient(var(--d-line) 1px, transparent 1px), linear-gradient(90deg, var(--d-line) 1px, transparent 1px)", backgroundSize: "28px 28px", maskImage: "radial-gradient(ellipse at center, #000 25%, transparent 72%)", WebkitMaskImage: "radial-gradient(ellipse at center, #000 25%, transparent 72%)" }}
              />
              <SectionArt kind="facial" className="relative w-[88%] max-w-[360px]" />
            </div>
          </div>
        </div>
      </Reveal>

      <div className="pt-6 sm:pt-8">
        <Reveal>
          <p className="d-eyebrow mb-3">Reports</p>
          <h2 className="d-h2 mb-5">What you'll unlock from one photo</h2>
        </Reveal>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {SECTIONS.map((s, i) => (
            <Reveal key={s.key} delay={(i % 2) * 0.06} className={i === 0 || i === 3 ? "lg:col-span-7" : "lg:col-span-5"}>
              <SectionCard section={s} scan={null} isPaid={false} />
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ---------------------------------------------------------------------------------------------- */

const OverviewSkeleton: React.FC = () => (
  <div aria-busy="true" aria-label="Loading your dashboard">
    <div className="d-skel mb-4 h-3 w-24" />
    <div className="d-skel mb-3 h-10 w-80 max-w-full" />
    <div className="d-skel mb-10 h-4 w-64 max-w-full" />
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
      <div className="d-skel h-[420px] lg:col-span-8" />
      <div className="d-skel h-[420px] lg:col-span-4" />
    </div>
    <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-12">
      <div className="d-skel h-[360px] lg:col-span-7" />
      <div className="d-skel h-[360px] lg:col-span-5" />
    </div>
  </div>
);

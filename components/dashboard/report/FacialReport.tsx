import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "react-router-dom";
import { Lock } from "lucide-react";
import { FaceOverlay } from "../../FaceOverlay";
import { LandmarkEditor } from "../../LandmarkEditor";
import { GenerationFailed, GenerationNotice, useLeaveWarning } from "../../GenerationNotice";
import { Arrow, useDashboard } from "../DashboardLayout";
import { sectionByKey } from "../sections";
import { FREE_METRIC_NAMES, ratioTone, type Scan } from "../scanData";
import { CaliperRule, CountUp } from "../visuals";
import { Locked, useGeneratedReport } from "./shared";
import { calculateFrontRatios, calculateWeightedTotalScore, type MetricResult } from "../../../services/ratioCalculator";
import { getAiRecommendations } from "../../../services/aiService";
import { calculateWebsitePercentile, updateScanAnalysis, updateScanLandmarks } from "../../../services/supabase";
import { calculatePercentile, getPercentileText } from "../../../utils/percentile";
import type { FrontLandmarks, Point } from "../../../types";

type View = "ratios" | "coach";

/**
 * The facial report: harmony score, your photo with each ratio drawn on it, every ratio against its ideal range,
 * and the written AI coach. Replaces the old "Overview" and "Front" tabs.
 */
export const FacialReport: React.FC<{ scan: Scan }> = ({ scan }) => {
  const { isPaid, userId, refresh, upgradeHref, upgradePrice } = useDashboard();
  const meta = sectionByKey("facial");
  const [params, setParams] = useSearchParams();
  const view: View = params.get("view") === "coach" ? "coach" : "ratios";
  const setView = (v: View) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("view", v);
        return next;
      },
      { replace: true },
    );

  // Landmarks can be adjusted here (click a dot on the photo), so keep an editable copy of the saved ones.
  const [landmarks, setLandmarks] = useState<Record<string, Point> | null>(scan.front_landmarks);
  useEffect(() => setLandmarks(scan.front_landmarks), [scan.id, scan.front_landmarks]);
  const [editKey, setEditKey] = useState<string | null>(null);
  const [hovered, setHovered] = useState<MetricResult | null>(null);
  const [pinned, setPinned] = useState<MetricResult | null>(null);
  useEffect(() => setPinned(null), [scan.id]);

  const metrics = useMemo(() => {
    if (!landmarks) return [];
    try {
      return calculateFrontRatios(landmarks as unknown as FrontLandmarks)
        .filter((m) => m.name)
        .sort((a, b) => a.score - b.score);
    } catch {
      return [];
    }
  }, [landmarks]);

  const overall = useMemo(() => (metrics.length ? calculateWeightedTotalScore(metrics) : 0), [metrics]);
  const score = Math.round(overall * 10);

  // how this score ranks among everyone on the site (only shown once the score is unlocked)
  const [sitePercentile, setSitePercentile] = useState<number | null>(null);
  useEffect(() => {
    if (!isPaid || !metrics.length) return;
    let alive = true;
    calculateWebsitePercentile(overall).then((p) => alive && setSitePercentile(p));
    return () => {
      alive = false;
    };
  }, [isPaid, overall, metrics.length]);

  const coach = useGeneratedReport<any>({
    scanId: scan.id,
    existing: scan.analysis ?? null,
    enabled: metrics.length > 0 && !!userId,
    generate: () => getAiRecommendations(metrics, scan.front_photo_url),
    save: (result) => (userId ? updateScanAnalysis(scan.id, userId, result) : Promise.resolve()),
    onSaved: refresh,
  });
  // A refresh or closed tab cancels the request in flight, so ask first. Free accounts see the report blurred.
  useLeaveWarning(coach.loading && isPaid);

  const active = pinned ?? hovered;
  const onEditDone = async (updated: Record<string, Point>) => {
    if (!editKey || !landmarks) return;
    const next = { ...landmarks, [editKey]: updated[editKey] };
    setLandmarks(next);
    setEditKey(null);
    if (userId) {
      const m = calculateFrontRatios(next as unknown as FrontLandmarks);
      await updateScanLandmarks(scan.id, userId, next, m.length ? calculateWeightedTotalScore(m) : 0);
      refresh();
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-12">
      {/* ---------------- score ---------------- */}
      <div className="lg:col-span-7 lg:col-start-6 lg:row-start-1">
        <ScoreCard score={score} paid={isPaid} sitePercentile={sitePercentile} count={metrics.length} />
      </div>

      {/* ---------------- your face, with the ratio drawn on it ---------------- */}
      <div className="lg:sticky lg:top-8 lg:col-span-5 lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:self-start">
        <div className="d-bezel">
          <div className="d-core">
            <div className="relative aspect-[3/4] bg-black">
              <FaceOverlay
                photoUrl={scan.front_photo_url}
                landmarks={landmarks ?? {}}
                highlightedLandmarks={active?.relatedLandmarks}
                metricName={active?.name}
                onPointClick={setEditKey}
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-5 pb-4 pt-14">
                {active ? (
                  <>
                    <p className="d-eyebrow !text-[var(--d-accent)]">
                      {pinned ? "Pinned" : "Previewing"}
                    </p>
                    <p className="mt-1.5 text-[15px] font-medium tracking-[-0.01em]">{active.name}</p>
                  </>
                ) : (
                  <p className="d-eyebrow">Analysis view</p>
                )}
              </div>
            </div>
            <div className="border-t border-[var(--d-line)] px-5 py-3.5">
              <p className="text-[12.5px] leading-snug text-[var(--d-t3)]">
                Click a ratio to pin it on your face. Then click a dot to move it, and the score updates.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- ratios / AI coach ---------------- */}
      <div className="space-y-5 lg:col-span-7 lg:col-start-6 lg:row-start-2">
        <div role="tablist" aria-label="Facial report sections" className="inline-flex rounded-full border border-[var(--d-line2)] bg-[var(--d-s1)] p-1">
          {(
            [
              ["ratios", `Ratios${metrics.length ? ` · ${metrics.length}` : ""}`],
              ["coach", "AI coach"],
            ] as [View, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              role="tab"
              aria-selected={view === key}
              onClick={() => setView(key)}
              className="h-9 rounded-full px-5 text-[13px] font-medium transition-[background-color,color] duration-200"
              style={view === key ? { background: "var(--d-t1)", color: "#07080d" } : { color: "var(--d-t2)" }}
            >
              {label}
            </button>
          ))}
        </div>

        {view === "ratios" ? (
          <div className="d-card overflow-hidden">
            <div className="border-b border-[var(--d-line)] px-6 py-5">
              <h2 className="d-h2">Facial ratios</h2>
              <p className="d-body mt-1.5 text-[13px]">
                {metrics.length} measurements from your landmarks, worst first. The green band is the ideal range.
              </p>
            </div>
            {metrics.length === 0 ? (
              <p className="d-body p-6">We couldn't measure ratios from this scan's landmarks. Try a new scan.</p>
            ) : (
              <ul>
                {metrics.map((m) => (
                  <RatioRow
                    key={m.key}
                    metric={m}
                    active={pinned?.name === m.name}
                    locked={!isPaid && !FREE_METRIC_NAMES.includes(m.name)}
                    onHover={setHovered}
                    onPin={(metric) => setPinned((p) => (p?.name === metric.name ? null : metric))}
                    upgradeHref={upgradeHref}
                  />
                ))}
              </ul>
            )}
            {!isPaid && metrics.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--d-line)] bg-[var(--d-s2)] px-6 py-4">
                <p className="text-[13px] text-[var(--d-t2)]">{metrics.filter((m) => !FREE_METRIC_NAMES.includes(m.name)).length} more ratios are part of Pro.</p>
                <a href={upgradeHref} className="d-btn d-btn-primary d-btn-sm">
                  <span>Unlock · {upgradePrice}</span>
                  <span className="d-btn-dot">
                    <Arrow />
                  </span>
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className="d-card overflow-hidden">
            <Locked locked={!isPaid} meta={meta} note="Your personal Softmax and Hardmax protocols, written from your exact ratios." minHeight={480}>
              <Coach analysis={coach.value} loading={coach.loading} failed={coach.failed} retry={coach.retry} />
            </Locked>
          </div>
        )}
      </div>

      {editKey &&
        landmarks &&
        createPortal(
          <div className="dash fixed inset-0 z-[60]">
            <LandmarkEditor
              photoUrl={scan.front_photo_url}
              initialLandmarks={{ [editKey]: landmarks[editKey] }}
              faceBox={{ xmin: 0, ymin: 0, xmax: 1000, ymax: 1000 }}
              title="Adjust landmark"
              landmarkType="front"
              onComplete={onEditDone}
            />
          </div>,
          document.body,
        )}
    </div>
  );
};

/* ---------------------------------------------------------------------------------------------- */

const ScoreCard: React.FC<{ score: number; paid: boolean; sitePercentile: number | null; count: number }> = ({ score, paid, sitePercentile, count }) => {
  const { upgradeHref, upgradePrice } = useDashboard();
  const percentile = calculatePercentile(score);
  // Same leanness note as before: for scores between the 50th and 80th percentile, being lean moves the real rank up.
  const lean = paid && percentile >= 50 && percentile <= 80 ? { max: Math.max(30, percentile - 10), min: Math.max(10, percentile - 20) } : null;

  return (
    <section className="d-card p-6 sm:p-7" aria-label="Facial harmony score">
      <div className="flex items-center justify-between">
        <span className="d-eyebrow">Facial harmony</span>
        <span className="text-[12px] text-[var(--d-t3)]">50 is the average face</span>
      </div>

      <div className="mt-5 flex flex-wrap items-end gap-x-6 gap-y-3">
        <div className="flex items-baseline gap-2">
          {paid && count > 0 ? (
            <CountUp key={score} value={score} className="d-num text-[clamp(72px,8vw,104px)] font-light leading-[0.9]" />
          ) : (
            <span className="d-num select-none text-[clamp(72px,8vw,104px)] font-light leading-[0.9] text-[var(--d-t4)]" aria-label="Score locked">
              ??
            </span>
          )}
          <span className="d-mono text-[15px] text-[var(--d-t3)]">/100</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 pb-1.5">
          {paid && count > 0 ? (
            <>
              <span className="d-chip" data-tone="ready">{getPercentileText(percentile)}</span>
              {sitePercentile != null && <span className="d-chip">{sitePercentile.toFixed(1)}% on site</span>}
              {score >= 50 && <span className="d-chip">Above average face</span>}
            </>
          ) : (
            <>
              <span className="d-chip" data-tone="lock">
                <Lock className="h-3 w-3" strokeWidth={1.75} /> Score is Pro
              </span>
              <a href={upgradeHref} className="d-link">
                Unlock · {upgradePrice}
                <Arrow />
              </a>
            </>
          )}
        </div>
      </div>

      <div className="mt-5">
        <CaliperRule value={score} masked={!paid || count === 0} label="Where your score sits on the 0 to 100 scale" />
      </div>

      {lean && (
        <p className="mt-4 rounded-xl border border-[var(--d-line)] bg-[var(--d-s2)] px-4 py-3 text-[13px] leading-snug text-[var(--d-t2)]">
          <span className="font-medium text-[var(--d-t1)]">Leanness bonus.</span> Below 15% body fat, your real percentile could be Top {lean.max}% to Top {lean.min}%,
          because facial definition lifts how attractive a face reads.
        </p>
      )}
    </section>
  );
};

/* ---------------------------------------------------------------------------------------------- */

const RatioRow: React.FC<{
  metric: MetricResult;
  active: boolean;
  locked: boolean;
  onHover: (m: MetricResult | null) => void;
  onPin: (m: MetricResult) => void;
  upgradeHref: string;
}> = ({ metric, active, locked, onHover, onPin, upgradeHref }) => {
  // the bar spans half the ideal minimum to one and a half times the ideal maximum, as before
  const barMin = metric.idealMin * 0.5;
  const barMax = metric.idealMax * 1.5;
  const span = barMax - barMin;
  const pct = (v: number) => (span === 0 ? 50 : Math.min(100, Math.max(0, ((v - barMin) / span) * 100)));
  const you = pct(metric.value);
  const zoneStart = pct(metric.idealMin);
  const zoneWidth = pct(metric.idealMax) - zoneStart;
  const tone = ratioTone(metric.score);

  const inner = (
    <>
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="min-w-0 truncate text-[14px] font-medium tracking-[-0.01em]">{metric.name}</h3>
        {locked ? (
          <span className="d-chip shrink-0" data-tone="lock">
            <Lock className="h-3 w-3" strokeWidth={1.75} /> Pro
          </span>
        ) : (
          <span className="d-mono d-num shrink-0 text-[15px] font-semibold" style={{ color: tone }}>
            {metric.score}
            <span className="ml-0.5 text-[11px] font-normal text-[var(--d-t4)]">/10</span>
          </span>
        )}
      </div>

      <div className={locked ? "select-none opacity-50" : ""} style={locked ? { filter: "blur(5px)" } : undefined}>
        <div className="relative mt-3 h-[6px] rounded-full bg-[var(--d-s3)]">
          <div className="absolute inset-y-[-1px] rounded-[3px] border border-[var(--d-accent-line)] bg-[var(--d-accent-soft)]" style={{ left: `${zoneStart}%`, width: `${Math.max(zoneWidth, 1.5)}%` }} />
          <div
            className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition-[left] duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]"
            style={{ left: `${you}%`, background: "var(--d-bg)", borderColor: tone }}
          />
        </div>
        <div className="d-mono mt-2.5 flex justify-between text-[11.5px] text-[var(--d-t3)]">
          <span>
            You <span className="text-[var(--d-t2)]">{metric.value}{metric.unit === "x" || metric.unit === "%" || metric.unit === "°" ? metric.unit : ` ${metric.unit}`}</span>
          </span>
          <span>
            Ideal {metric.idealMin} to {metric.idealMax}
          </span>
        </div>
      </div>
    </>
  );

  const base = "block w-full border-b border-[var(--d-line)] px-6 py-4 text-left transition-colors duration-150 last:border-b-0";
  return (
    <li>
      {locked ? (
        <a href={upgradeHref} className={`${base} hover:bg-[var(--d-s2)]`} aria-label={`${metric.name} is Pro. Unlock to see it.`}>
          {inner}
        </a>
      ) : (
        <button
          type="button"
          aria-pressed={active}
          onMouseEnter={() => onHover(metric)}
          onMouseLeave={() => onHover(null)}
          onFocus={() => onHover(metric)}
          onBlur={() => onHover(null)}
          onClick={() => onPin(metric)}
          className={`${base} relative hover:bg-[var(--d-s2)] ${active ? "bg-[var(--d-s2)]" : ""}`}
        >
          {active && <span className="absolute inset-y-3 left-0 w-[2px] rounded-full bg-[var(--d-accent)]" aria-hidden="true" />}
          {inner}
        </button>
      )}
    </li>
  );
};

/* ---------------------------------------------------------------------------------------------- */

const Block: React.FC<{ label: string; text?: string; advice?: string; tone?: "accent" | "warn" }> = ({ label, text, advice, tone }) => (
  <div className="rounded-xl border border-[var(--d-line)] bg-[var(--d-s2)] p-4" style={tone === "warn" ? { borderColor: "rgba(252,211,77,0.25)" } : undefined}>
    <p className="d-eyebrow" style={tone === "warn" ? { color: "var(--d-warn)" } : undefined}>{label}</p>
    <p className="mt-2.5 text-[14px] leading-relaxed text-[var(--d-t1)]">{text || "Analysis unavailable"}</p>
    {advice !== undefined && <p className="mt-2 text-[13px] italic leading-relaxed text-[var(--d-t3)]">{advice || "No advice available"}</p>}
  </div>
);

const Coach: React.FC<{ analysis: any; loading: boolean; failed: boolean; retry: () => void }> = ({ analysis, loading, failed, retry }) => {
  if (loading) {
    return (
      <div className="space-y-4 p-6">
        <GenerationNotice what="overview analysis" />
        <div className="d-skel h-28" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="d-skel h-52" />
          <div className="d-skel h-52" />
        </div>
      </div>
    );
  }
  if (!analysis) {
    return failed ? (
      <GenerationFailed what="overview analysis" onRetry={retry} />
    ) : (
      <p className="d-body p-8 text-center">The AI coach will appear here once your scan has been analysed.</p>
    );
  }
  const legacy = typeof analysis === "string";
  return (
    <div className="space-y-5 p-6 sm:p-7">
      <div>
        <p className="d-eyebrow mb-3">Executive summary</p>
        <p className="text-[15px] leading-relaxed text-[var(--d-t1)]">
          {legacy ? "This is an older analysis format. Take a new scan to get the updated one." : analysis.executive_summary || "Summary not available."}
        </p>
      </div>

      {!legacy && (
        <div className="grid gap-5 xl:grid-cols-2">
          <section className="space-y-3" aria-label="Softmax protocol">
            <div>
              <h3 className="text-[16px] font-semibold tracking-[-0.02em]">Softmax</h3>
              <p className="text-[12.5px] text-[var(--d-t3)]">What you can change</p>
            </div>
            <Block label="Body fat and leanness" text={analysis.softmax?.body_fat?.assessment} advice={analysis.softmax?.body_fat?.advice} />
            <Block label="Skin and grooming" text={analysis.softmax?.skin_grooming?.assessment} advice={analysis.softmax?.skin_grooming?.advice} />
            <Block label="Styling" text={analysis.softmax?.style?.assessment} advice={analysis.softmax?.style?.advice} />
          </section>

          <section className="space-y-3" aria-label="Hardmax protocol">
            <div>
              <h3 className="text-[16px] font-semibold tracking-[-0.02em]">Hardmax</h3>
              <p className="text-[12.5px] text-[var(--d-t3)]">Structure, and what a specialist could do</p>
            </div>
            <Block label="Bone structure" text={analysis.hardmax?.bone_structure} />
            <Block label="Harmony and balance" text={analysis.hardmax?.balance} />
            <Block label="Medical recommendation" text={analysis.hardmax?.recommendation || "Consult a professional."} tone="warn" />
          </section>
        </div>
      )}
    </div>
  );
};


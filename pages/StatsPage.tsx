import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../services/supabase";
import { MAIN_TOOL_PATH, MAIN_TOOL_SKIN_CHECK, getVisitorId, markThisBrowserAsOwner } from "../services/funnel";
import { seoLandingPageMap } from "../data/seoLandingPages";

// Private funnel dashboard at /stats (not linked anywhere, noindex). The password is checked
// inside the get_funnel_stats database function against a bcrypt hash, so it never appears
// in this code or the repo; the page only keeps it in memory to refresh the numbers.
// Unlocking also marks this browser as the owner's, so its own visits aren't counted.

interface Row {
  tool: string;
  views: number;
  unique_viewers: number;
  submissions: number;
  unique_submitters: number;
  successes: number;
  unique_succeeded: number;
  failures: number;
}

interface Stats {
  tracking_since: string | null;
  outcomes_since: string | null;
  internal_browsers: number;
  totals: { visitors: number; submitters: number; succeeded: number; submissions: number; successes: number; failures: number };
  rows: Row[];
  failure_reasons: { tool: string; reason: string; count: number }[];
}

const TOOL_NAMES: Record<string, string> = {
  "attractiveness-score": "Attractiveness test",
  "brow-position": "Brow position",
  "canthal-tilt": "Canthal tilt",
  "cheekbone-width": "Cheekbone width",
  "chin-ratio": "Chin ratio",
  "eye-spacing": "Eye spacing",
  "face-rating": "Face rating",
  "face-symmetry": "Face symmetry",
  "facial-shape": "Face shape",
  "facial-thirds": "Facial thirds",
  "facial-width-height": "fWHR",
  "forehead-ratio": "Forehead ratio",
  "golden-ratio": "Golden ratio",
  "harmony-score": "Facial harmony",
  "hunter-eyes": "Hunter eyes",
  "jawline-score": "Jawline score",
  "lip-ratio": "Lip ratio",
  "looksmax-score": "Looksmax score",
  "lower-third": "Lower third",
  "midface-ratio": "Midface ratio",
  "nose-ratio": "Nose ratio",
  "philtrum-ratio": "Philtrum ratio",
  "psl-rating": "PSL rating",
};

const RANGES = [
  { label: "24 hours", hours: 24 },
  { label: "7 days", hours: 24 * 7 },
  { label: "30 days", hours: 24 * 30 },
  { label: "All time", hours: null },
] as const;

const EMPTY = { views: 0, unique_viewers: 0, submissions: 0, unique_submitters: 0, successes: 0, unique_succeeded: 0, failures: 0 };

function percent(part: number, whole: number): string {
  return whole > 0 ? `${Math.round((part / whole) * 100)}%` : "–";
}

function rowsFor(paths: string[], byTool: Map<string, Row>): Row[] {
  return paths
    .map((tool) => byTool.get(tool) ?? { tool, ...EMPTY })
    .sort((a, b) => b.unique_submitters - a.unique_submitters || b.views - a.views || a.tool.localeCompare(b.tool));
}

const Table: React.FC<{ title: string; rows: Row[]; label: (tool: string) => string }> = ({ title, rows, label }) => (
  <section className="mb-10">
    <h2 className="text-lg font-bold text-white mb-3">{title}</h2>
    <div className="overflow-x-auto rounded-2xl border border-white/10">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-900/80 text-slate-300">
          <tr>
            <th className="py-3 px-4 font-semibold">Tool</th>
            <th className="py-3 px-4 font-semibold text-right">Visitors</th>
            <th className="py-3 px-4 font-semibold text-right">People who submitted</th>
            <th className="py-3 px-4 font-semibold text-right">Conversion</th>
            <th className="py-3 px-4 font-semibold text-right">Attempts</th>
            <th className="py-3 px-4 font-semibold text-right">Results shown</th>
            <th className="py-3 px-4 font-semibold text-right">Failed</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.tool} className="border-t border-white/5 text-slate-300">
              <td className="py-2.5 px-4">
                <span className="text-white">{label(r.tool)}</span>
                <span className="block text-xs text-slate-500">{r.tool}</span>
              </td>
              <td className="py-2.5 px-4 text-right tabular-nums">{r.unique_viewers}</td>
              <td className="py-2.5 px-4 text-right tabular-nums text-white font-semibold">{r.unique_submitters}</td>
              <td className="py-2.5 px-4 text-right tabular-nums">{percent(r.unique_submitters, r.unique_viewers)}</td>
              <td className="py-2.5 px-4 text-right tabular-nums">{r.submissions}</td>
              <td className="py-2.5 px-4 text-right tabular-nums">{r.successes}</td>
              <td className={`py-2.5 px-4 text-right tabular-nums ${r.failures > 0 ? "text-amber-400" : ""}`}>{r.failures}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);

export const StatsPage: React.FC = () => {
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [rangeIndex, setRangeIndex] = useState(3);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Also sent as an X-Robots-Tag header for /stats (vercel.json).
  useEffect(() => {
    document.title = "Stats";
    const meta = document.querySelector<HTMLMetaElement>('meta[name="robots"]') ?? document.head.appendChild(document.createElement("meta"));
    const previous = meta.content;
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    return () => {
      meta.content = previous;
    };
  }, []);

  const load = async (pw: string, index: number) => {
    setLoading(true);
    setError(null);
    const hours = RANGES[index].hours;
    const since = hours === null ? null : new Date(Date.now() - hours * 3600 * 1000).toISOString();
    const { data, error: rpcError } = await supabase.rpc("get_funnel_stats", {
      p_password: pw,
      p_since: since,
      p_visitor: getVisitorId(),
    });
    setLoading(false);
    if (rpcError) {
      const wrong = rpcError.message.includes("invalid password");
      setError(wrong ? "Wrong password." : `Couldn't load stats: ${rpcError.message}`);
      if (wrong) setUnlocked(false);
      return;
    }
    markThisBrowserAsOwner();
    setStats(data as Stats);
    setUnlocked(true);
  };

  const byTool = useMemo(() => new Map((stats?.rows ?? []).map((r) => [r.tool, r])), [stats]);

  const label = (tool: string) => {
    if (tool === "/") return "Homepage";
    if (tool === MAIN_TOOL_PATH) return "Full facial analysis";
    if (tool === MAIN_TOOL_SKIN_CHECK) return "Skin check";
    if (tool.startsWith("/tools/")) return TOOL_NAMES[tool.slice(7)] ?? tool;
    return seoLandingPageMap[tool.slice(1)]?.heroTitle ?? tool;
  };

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-[#050510] text-white flex items-center justify-center px-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (password) load(password, rangeIndex);
          }}
          className="w-full max-w-sm bg-slate-900/60 border border-white/10 rounded-3xl p-8"
        >
          <h1 className="text-2xl font-bold mb-6">Stats</h1>
          <label htmlFor="stats-password" className="block text-sm text-slate-400 mb-2">
            Password
          </label>
          <input
            id="stats-password"
            type="password"
            autoComplete="current-password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-3 text-white outline-none"
          />
          {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full mt-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 font-semibold"
          >
            {loading ? "Checking…" : "View stats"}
          </button>
        </form>
      </div>
    );
  }

  const toolPaths = Object.keys(TOOL_NAMES).map((slug) => `/tools/${slug}`);
  const landingPaths = Object.keys(seoLandingPageMap).map((slug) => `/${slug}`);
  const totals = stats?.totals ?? { visitors: 0, submitters: 0, succeeded: 0, submissions: 0, successes: 0, failures: 0 };
  const home = byTool.get("/") ?? { tool: "/", ...EMPTY };
  const main = byTool.get(MAIN_TOOL_PATH) ?? { tool: MAIN_TOOL_PATH, ...EMPTY };
  const skin = byTool.get(MAIN_TOOL_SKIN_CHECK) ?? { tool: MAIN_TOOL_SKIN_CHECK, ...EMPTY };
  const reasons = stats?.failure_reasons ?? [];

  const Tile: React.FC<{ title: string; value: number; note: string }> = ({ title, value, note }) => (
    <div className="rounded-2xl bg-slate-900/60 border border-white/10 p-4">
      <p className="text-xs uppercase tracking-wider text-slate-400">{title}</p>
      <p className="text-3xl font-black mt-1 tabular-nums">{value}</p>
      <p className="text-xs text-slate-500 mt-1">{note}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050510] text-white px-4 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black">Funnel stats</h1>
            <p className="text-sm text-slate-500 mt-1">
              {stats?.tracking_since ? `Tracking since ${new Date(stats.tracking_since).toLocaleString()}` : "No events recorded yet."}
              {stats?.outcomes_since && ` · results and failures since ${new Date(stats.outcomes_since).toLocaleString()}`}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Your own browsers are excluded ({stats?.internal_browsers ?? 0} so far). Open this page once on each device you use to exclude it too.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {RANGES.map((r, i) => (
              <button
                key={r.label}
                onClick={() => {
                  setRangeIndex(i);
                  load(password, i);
                }}
                className={`px-4 py-2 rounded-full text-sm ${i === rangeIndex ? "bg-white text-black" : "bg-slate-900 border border-slate-700 text-slate-300"}`}
              >
                {r.label}
              </button>
            ))}
            <button
              onClick={() => load(password, rangeIndex)}
              disabled={loading}
              className="px-4 py-2 rounded-full text-sm bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50"
            >
              {loading ? "Loading…" : "Refresh"}
            </button>
          </div>
        </div>

        {error && <p className="text-red-400 text-sm mb-6">{error}</p>}

        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          <Tile title="Visitors" value={totals.visitors} note="unique people on the homepage or any tool" />
          <Tile title="Submitted a photo" value={totals.submitters} note={`unique people · ${percent(totals.submitters, totals.visitors)} of visitors`} />
          <Tile title="Got a result" value={totals.succeeded} note="unique people who saw their result" />
          <Tile title="Failed attempts" value={totals.failures} note={`of ${totals.submissions} attempts in total`} />
        </section>

        <section className="mb-10 rounded-3xl border border-indigo-500/30 bg-indigo-500/5 p-6">
          <h2 className="text-lg font-bold mb-4">Main tool (freemium): full facial analysis</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Tile title="Homepage visitors" value={home.unique_viewers} note={`${home.views} views`} />
            <Tile title="Reached the analysis" value={main.unique_viewers} note={`${percent(main.unique_viewers, home.unique_viewers)} of homepage visitors`} />
            <Tile title="Submitted a photo" value={main.unique_submitters} note={`${main.submissions} attempts · ${percent(main.unique_submitters, main.unique_viewers)} of those who reached it`} />
            <Tile title="Skin check" value={skin.unique_submitters} note={`${skin.submissions} attempts`} />
          </div>
        </section>

        <p className="text-sm text-slate-400 mb-6">
          "Visitors" and "People who submitted" count unique browsers. "Attempts" counts every press of Analyze, including retries; "Failed" counts attempts that showed an error instead of a result.
        </p>

        <Table title="Free tools" rows={rowsFor(toolPaths, byTool)} label={label} />
        <Table title="Landing pages" rows={rowsFor(landingPaths, byTool)} label={label} />

        <section className="mb-10">
          <h2 className="text-lg font-bold text-white mb-3">Why attempts failed</h2>
          {reasons.length === 0 ? (
            <p className="text-sm text-slate-500">No failed attempts recorded in this period.</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-900/80 text-slate-300">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Tool</th>
                    <th className="py-3 px-4 font-semibold">Error shown to the visitor</th>
                    <th className="py-3 px-4 font-semibold text-right">Times</th>
                  </tr>
                </thead>
                <tbody>
                  {reasons.map((f) => (
                    <tr key={`${f.tool}|${f.reason}`} className="border-t border-white/5 text-slate-300">
                      <td className="py-2.5 px-4 text-white">{label(f.tool)}</td>
                      <td className="py-2.5 px-4">{f.reason}</td>
                      <td className="py-2.5 px-4 text-right tabular-nums">{f.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

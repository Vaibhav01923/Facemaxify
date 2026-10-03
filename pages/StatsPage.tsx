import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../services/supabase";
import { MAIN_TOOL_PATH, MAIN_TOOL_SKIN_CHECK } from "../services/funnel";
import { seoLandingPageMap } from "../data/seoLandingPages";

// Private funnel dashboard at /stats (not linked anywhere, noindex). The password is checked
// inside the get_funnel_stats database function against a bcrypt hash, so it never appears
// in this code or the repo; the page only keeps it in memory to refresh the numbers.

interface Row {
  tool: string;
  views: number;
  unique_viewers: number;
  submissions: number;
  unique_submitters: number;
}

interface Stats {
  tracking_since: string | null;
  rows: Row[];
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

const EMPTY = { views: 0, unique_viewers: 0, submissions: 0, unique_submitters: 0 };

function percent(part: number, whole: number): string {
  return whole > 0 ? `${Math.round((part / whole) * 100)}%` : "–";
}

function rowsFor(paths: string[], byTool: Map<string, Row>): Row[] {
  return paths
    .map((tool) => byTool.get(tool) ?? { tool, ...EMPTY })
    .sort((a, b) => b.submissions - a.submissions || b.views - a.views || a.tool.localeCompare(b.tool));
}

const Table: React.FC<{ title: string; rows: Row[]; label: (tool: string) => string }> = ({ title, rows, label }) => (
  <section className="mb-10">
    <h2 className="text-lg font-bold text-white mb-3">{title}</h2>
    <div className="overflow-x-auto rounded-2xl border border-white/10">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-900/80 text-slate-300">
          <tr>
            <th className="py-3 px-4 font-semibold">Tool</th>
            <th className="py-3 px-4 font-semibold text-right">Views</th>
            <th className="py-3 px-4 font-semibold text-right">Visitors</th>
            <th className="py-3 px-4 font-semibold text-right">Photos submitted</th>
            <th className="py-3 px-4 font-semibold text-right">People</th>
            <th className="py-3 px-4 font-semibold text-right">Conversion</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.tool} className="border-t border-white/5 text-slate-300">
              <td className="py-2.5 px-4">
                <span className="text-white">{label(r.tool)}</span>
                <span className="block text-xs text-slate-500">{r.tool}</span>
              </td>
              <td className="py-2.5 px-4 text-right tabular-nums">{r.views}</td>
              <td className="py-2.5 px-4 text-right tabular-nums">{r.unique_viewers}</td>
              <td className="py-2.5 px-4 text-right tabular-nums text-white font-semibold">{r.submissions}</td>
              <td className="py-2.5 px-4 text-right tabular-nums">{r.unique_submitters}</td>
              <td className="py-2.5 px-4 text-right tabular-nums">{percent(r.unique_submitters, r.unique_viewers)}</td>
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
    const { data, error: rpcError } = await supabase.rpc("get_funnel_stats", { p_password: pw, p_since: since });
    setLoading(false);
    if (rpcError) {
      setError(rpcError.message.includes("invalid password") ? "Wrong password." : `Couldn't load stats: ${rpcError.message}`);
      if (rpcError.message.includes("invalid password")) setUnlocked(false);
      return;
    }
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
  const all = stats?.rows ?? [];
  const totalSubmissions = all.filter((r) => r.tool !== "/").reduce((s, r) => s + r.submissions, 0);
  const home = byTool.get("/") ?? { tool: "/", ...EMPTY };
  const main = byTool.get(MAIN_TOOL_PATH) ?? { tool: MAIN_TOOL_PATH, ...EMPTY };
  const skin = byTool.get(MAIN_TOOL_SKIN_CHECK) ?? { tool: MAIN_TOOL_SKIN_CHECK, ...EMPTY };

  return (
    <div className="min-h-screen bg-[#050510] text-white px-4 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black">Funnel stats</h1>
            <p className="text-sm text-slate-500 mt-1">
              {stats?.tracking_since
                ? `Tracking since ${new Date(stats.tracking_since).toLocaleString()}`
                : "No events recorded yet."}
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

        <section className="mb-10 rounded-3xl border border-indigo-500/30 bg-indigo-500/5 p-6">
          <h2 className="text-lg font-bold mb-4">Main tool (freemium): full facial analysis</h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[
              ["Homepage visitors", home.unique_viewers, `${home.views} views`],
              ["Reached the analysis", main.unique_viewers, `${percent(main.unique_viewers, home.unique_viewers)} of homepage visitors`],
              ["Submitted a photo", main.unique_submitters, `${main.submissions} photos · ${percent(main.unique_submitters, main.unique_viewers)} of those who reached it`],
              ["Skin check photos", skin.unique_submitters, `${skin.submissions} photos`],
            ].map(([title, value, note]) => (
              <div key={title as string} className="rounded-2xl bg-slate-900/60 border border-white/10 p-4">
                <p className="text-xs uppercase tracking-wider text-slate-400">{title}</p>
                <p className="text-3xl font-black mt-1 tabular-nums">{value}</p>
                <p className="text-xs text-slate-500 mt-1">{note}</p>
              </div>
            ))}
          </div>
        </section>

        <p className="text-sm text-slate-400 mb-6">
          <span className="text-white font-semibold tabular-nums">{totalSubmissions}</span> photos submitted across all tools in this period. "People" and "Visitors" count unique browsers; "Conversion" is people who submitted a photo ÷ visitors.
        </p>

        <Table title="Free tools" rows={rowsFor(toolPaths, byTool)} label={label} />
        <Table title="Landing pages" rows={rowsFor(landingPaths, byTool)} label={label} />
      </div>
    </div>
  );
};

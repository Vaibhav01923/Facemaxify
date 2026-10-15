import React, { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import { MAIN_TOOL_PATH, getVisitorId } from "../services/funnel";

// "Traffic sources" tab of /stats: where visitors come from (YouTube, Google, ...) and how far they get.
// Data comes from the get_traffic_stats database function (supabase_traffic_sources.sql); the source of a visit is
// the ?utm_source tag on the link if there is one, otherwise the site the visitor clicked from.

interface SourceRow {
  source: string;
  visits: number;
  visitors: number;
  signed_in: number;
  submitters: number;
  succeeded: number;
}
interface CampaignRow extends SourceRow {
  medium: string;
  campaign: string;
  content: string;
}
interface Traffic {
  tracking_since: string | null;
  totals: { visits: number; visitors: number; signed_in: number; submitters: number; succeeded: number };
  sources: SourceRow[];
  campaigns: CampaignRow[];
  referrers: { host: string; source: string; visits: number; visitors: number }[];
  landing: { path: string; visits: number; visitors: number }[];
}

const SITE = "https://facemaxify.com";

const SOURCE_NAMES: Record<string, string> = {
  youtube: "YouTube",
  google: "Google search",
  bing: "Bing",
  duckduckgo: "DuckDuckGo",
  instagram: "Instagram",
  tiktok: "TikTok",
  facebook: "Facebook",
  x: "X (Twitter)",
  reddit: "Reddit",
  pinterest: "Pinterest",
  linkedin: "LinkedIn",
  discord: "Discord",
  telegram: "Telegram",
  whatsapp: "WhatsApp",
  chatgpt: "ChatGPT",
  perplexity: "Perplexity",
  claude: "Claude",
  direct: "Direct / unknown",
  other: "Other",
};

const sourceName = (s: string) => SOURCE_NAMES[s] ?? s;

function percent(part: number, whole: number): string {
  return whole > 0 ? `${Math.round((part / whole) * 100)}%` : "–";
}

function tagged(path: string, source: string, campaign: string, medium = "social"): string {
  const q = new URLSearchParams({ utm_source: source, utm_medium: medium });
  if (campaign) q.set("utm_campaign", campaign);
  return `${SITE}${path}?${q.toString()}`;
}

const Tile: React.FC<{ title: string; value: string | number; note: string; accent?: boolean }> = ({ title, value, note, accent }) => (
  <div className={`rounded-2xl border p-4 ${accent ? "bg-red-500/10 border-red-500/30" : "bg-slate-900/60 border-white/10"}`}>
    <p className="text-xs uppercase tracking-wider text-slate-400">{title}</p>
    <p className="text-3xl font-black mt-1 tabular-nums">{value}</p>
    <p className="text-xs text-slate-500 mt-1">{note}</p>
  </div>
);

const CopyRow: React.FC<{ label: string; link: string }> = ({ label, link }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      const area = document.createElement("textarea");
      area.value = link;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      document.body.removeChild(area);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 py-2.5 border-t border-white/5 first:border-t-0">
      <span className="sm:w-48 shrink-0 text-sm text-slate-300">{label}</span>
      <code className="flex-1 min-w-0 truncate rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-300" title={link}>
        {link}
      </code>
      <button onClick={copy} className="shrink-0 px-4 py-2 rounded-lg text-sm bg-indigo-600 hover:bg-indigo-500 font-semibold">
        {copied ? "Copied ✓" : "Copy"}
      </button>
    </div>
  );
};

const FunnelTable: React.FC<{ title: string; rows: (SourceRow & { label: string; sub?: string })[]; highlight?: string; first: string }> = ({
  title,
  rows,
  highlight,
  first,
}) => (
  <section className="mb-10">
    <h2 className="text-lg font-bold text-white mb-3">{title}</h2>
    <div className="overflow-x-auto rounded-2xl border border-white/10">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-900/80 text-slate-300">
          <tr>
            <th className="py-3 px-4 font-semibold">{first}</th>
            <th className="py-3 px-4 font-semibold text-right">Visitors</th>
            <th className="py-3 px-4 font-semibold text-right">Visits</th>
            <th className="py-3 px-4 font-semibold text-right">Signed in</th>
            <th className="py-3 px-4 font-semibold text-right">Submitted a photo</th>
            <th className="py-3 px-4 font-semibold text-right">Got a result</th>
            <th className="py-3 px-4 font-semibold text-right">Visitor → photo</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={7} className="py-6 px-4 text-center text-slate-500">
                Nothing recorded in this period yet.
              </td>
            </tr>
          )}
          {rows.map((r) => (
            <tr key={`${r.label}|${r.sub ?? ""}`} className={`border-t border-white/5 text-slate-300 ${r.source === highlight ? "bg-red-500/10" : ""}`}>
              <td className="py-2.5 px-4">
                <span className="text-white">{r.label}</span>
                {r.sub && <span className="block text-xs text-slate-500">{r.sub}</span>}
              </td>
              <td className="py-2.5 px-4 text-right tabular-nums text-white font-semibold">{r.visitors}</td>
              <td className="py-2.5 px-4 text-right tabular-nums">{r.visits}</td>
              <td className="py-2.5 px-4 text-right tabular-nums">{r.signed_in}</td>
              <td className="py-2.5 px-4 text-right tabular-nums">{r.submitters}</td>
              <td className="py-2.5 px-4 text-right tabular-nums">{r.succeeded}</td>
              <td className="py-2.5 px-4 text-right tabular-nums">{percent(r.submitters, r.visitors)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);

export const StatsTrafficTab: React.FC<{ password: string; hours: number | null; refreshKey: number }> = ({ password, hours, refreshKey }) => {
  const [data, setData] = useState<Traffic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [campaign, setCampaign] = useState("video_1");
  const [builderSource, setBuilderSource] = useState("youtube");
  const [builderPath, setBuilderPath] = useState(MAIN_TOOL_PATH);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const since = hours === null ? null : new Date(Date.now() - hours * 3600 * 1000).toISOString();
      const { data: result, error: rpcError } = await supabase.rpc("get_traffic_stats", {
        p_password: password,
        p_since: since,
        p_visitor: getVisitorId(),
      });
      if (cancelled) return;
      setLoading(false);
      if (rpcError) {
        const missing = rpcError.code === "PGRST202" || /could not find the function|does not exist/i.test(rpcError.message);
        setNeedsSetup(missing);
        setError(missing ? null : rpcError.message.includes("invalid password") ? "Wrong password." : `Couldn't load traffic sources: ${rpcError.message}`);
        return;
      }
      setNeedsSetup(false);
      setData(result as Traffic);
    })();
    return () => {
      cancelled = true;
    };
  }, [password, hours, refreshKey]);

  if (needsSetup) {
    return (
      <section className="rounded-3xl border border-amber-500/30 bg-amber-500/5 p-6">
        <h2 className="text-lg font-bold mb-2">One-time database setup needed</h2>
        <p className="text-sm text-slate-300 mb-3">
          Traffic sources are collected in new database tables that haven't been created yet. Until then the site works normally, it just isn't recording where
          visitors come from.
        </p>
        <ol className="list-decimal pl-5 text-sm text-slate-300 space-y-1">
          <li>Open your Supabase project → <b>SQL Editor</b> → <b>New query</b>.</li>
          <li>
            Paste the contents of <code className="text-amber-300">supabase_traffic_sources.sql</code> (in the root of the repo) and press <b>Run</b>. It is safe to run twice and
            doesn't touch your existing stats.
          </li>
          <li>Come back here and press <b>Refresh</b>. Numbers start counting from that moment.</li>
        </ol>
      </section>
    );
  }

  const totals = data?.totals ?? { visits: 0, visitors: 0, signed_in: 0, submitters: 0, succeeded: 0 };
  const sources = data?.sources ?? [];
  const yt = sources.find((s) => s.source === "youtube") ?? { source: "youtube", visits: 0, visitors: 0, signed_in: 0, submitters: 0, succeeded: 0 };
  const ytCampaigns = (data?.campaigns ?? []).filter((c) => c.source === "youtube");

  return (
    <div>
      {error && <p className="text-red-400 text-sm mb-6">{error}</p>}
      <p className="text-sm text-slate-400 mb-6">
        {data?.tracking_since ? `Tracking since ${new Date(data.tracking_since).toLocaleString()}. ` : "No visits recorded yet. "}
        A visitor's source is the <code className="text-slate-300">utm_source</code> tag on the link they clicked, or else the site they came from. It is remembered through the sign-in page and
        credited for 30 days, so someone who clicks from YouTube today and signs up tomorrow still counts as YouTube. Your own browsers are excluded.
      </p>

      <section className="mb-10 rounded-3xl border border-red-500/30 bg-red-500/5 p-6">
        <h2 className="text-lg font-bold mb-4">YouTube {loading && <span className="text-xs font-normal text-slate-500 ml-2">loading…</span>}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <Tile title="Visitors" value={yt.visitors} note={`${percent(yt.visitors, totals.visitors)} of all visitors`} accent />
          <Tile title="Visits" value={yt.visits} note="every time they arrived" />
          <Tile title="Signed in" value={yt.signed_in} note={`${percent(yt.signed_in, yt.visitors)} of YouTube visitors`} />
          <Tile title="Submitted a photo" value={yt.submitters} note={`${percent(yt.submitters, yt.visitors)} of YouTube visitors`} />
          <Tile title="Got a result" value={yt.succeeded} note="saw their analysis" />
        </div>
        {yt.visitors === 0 && !loading && (
          <p className="text-sm text-slate-400 mt-4">
            No YouTube visits yet. Put the tagged links below in your channel's About section and pinned comment, then check back after a few clicks.
          </p>
        )}
        {ytCampaigns.length > 0 && (
          <div className="mt-5 grid gap-2">
            {ytCampaigns.map((c) => (
              <div key={`${c.campaign}|${c.content}`} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-900/60 border border-white/5 px-4 py-2.5 text-sm">
                <span className="text-white font-medium">
                  {c.campaign}
                  {c.content && <span className="text-slate-500"> · {c.content}</span>}
                </span>
                <span className="text-slate-300 tabular-nums">
                  {c.visitors} visitors · {c.signed_in} signed in · {c.submitters} submitted · {c.succeeded} got a result
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mb-10 rounded-3xl border border-indigo-500/30 bg-indigo-500/5 p-6">
        <h2 className="text-lg font-bold mb-1">Links to use on YouTube</h2>
        <p className="text-sm text-slate-400 mb-4">
          Use these exact links (they carry a tag that says "this came from YouTube, from this spot"). Links without a tag still count as YouTube when the visitor comes from youtube.com,
          but the YouTube app doesn't always send that, so tagged links are more reliable and tell you which placement works.
        </p>
        <CopyRow label="Channel About section" link={tagged(MAIN_TOOL_PATH, "youtube", "about")} />
        <CopyRow label="Pinned comment" link={tagged(MAIN_TOOL_PATH, "youtube", "pinned_comment")} />
        <CopyRow label="Video / Shorts description" link={tagged(MAIN_TOOL_PATH, "youtube", "description")} />
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-sm text-slate-300 mb-2">Make your own (for one specific video, another platform, …)</p>
          <div className="flex flex-wrap gap-2 mb-2">
            <input value={builderSource} onChange={(e) => setBuilderSource(e.target.value)} placeholder="source (youtube, tiktok…)" aria-label="source" className="w-44 bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-lg px-3 py-2 text-sm outline-none" />
            <input value={campaign} onChange={(e) => setCampaign(e.target.value)} placeholder="name (video_12, shorts_may…)" aria-label="campaign" className="w-56 bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-lg px-3 py-2 text-sm outline-none" />
            <input value={builderPath} onChange={(e) => setBuilderPath(e.target.value.startsWith("/") ? e.target.value : `/${e.target.value}`)} aria-label="page" className="w-64 bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-lg px-3 py-2 text-sm outline-none" />
          </div>
          <CopyRow label="Your link" link={tagged(builderPath || "/", builderSource.trim().toLowerCase() || "youtube", campaign.trim().toLowerCase().replace(/\s+/g, "_"))} />
        </div>
      </section>

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <Tile title="Visitors" value={totals.visitors} note="unique people, all sources" />
        <Tile title="Visits" value={totals.visits} note="every arrival (a person can visit more than once)" />
        <Tile title="Signed in" value={totals.signed_in} note="unique people" />
        <Tile title="Submitted a photo" value={totals.submitters} note={`${percent(totals.submitters, totals.visitors)} of visitors`} />
      </section>

      <FunnelTable title="All traffic sources" first="Source" highlight="youtube" rows={sources.map((s) => ({ ...s, label: sourceName(s.source) }))} />

      <FunnelTable
        title="Tagged campaigns"
        first="Campaign"
        highlight="youtube"
        rows={(data?.campaigns ?? []).map((c) => ({ ...c, label: `${sourceName(c.source)} · ${c.campaign}`, sub: [c.medium, c.content].filter(Boolean).join(" · ") || undefined }))}
      />

      <section className="mb-10">
        <h2 className="text-lg font-bold text-white mb-3">Sites that sent visitors</h2>
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-900/80 text-slate-300">
              <tr>
                <th className="py-3 px-4 font-semibold">Referring site</th>
                <th className="py-3 px-4 font-semibold">Counted as</th>
                <th className="py-3 px-4 font-semibold text-right">Visitors</th>
                <th className="py-3 px-4 font-semibold text-right">Visits</th>
              </tr>
            </thead>
            <tbody>
              {(data?.referrers ?? []).length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 px-4 text-center text-slate-500">
                    No referring sites recorded in this period.
                  </td>
                </tr>
              )}
              {(data?.referrers ?? []).map((r) => (
                <tr key={r.host} className="border-t border-white/5 text-slate-300">
                  <td className="py-2.5 px-4 text-white">{r.host}</td>
                  <td className="py-2.5 px-4">{sourceName(r.source)}</td>
                  <td className="py-2.5 px-4 text-right tabular-nums">{r.visitors}</td>
                  <td className="py-2.5 px-4 text-right tabular-nums">{r.visits}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-bold text-white mb-3">Where visitors landed</h2>
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-900/80 text-slate-300">
              <tr>
                <th className="py-3 px-4 font-semibold">Page</th>
                <th className="py-3 px-4 font-semibold text-right">Visitors</th>
                <th className="py-3 px-4 font-semibold text-right">Visits</th>
              </tr>
            </thead>
            <tbody>
              {(data?.landing ?? []).map((l) => (
                <tr key={l.path} className="border-t border-white/5 text-slate-300">
                  <td className="py-2.5 px-4 text-white">{l.path}</td>
                  <td className="py-2.5 px-4 text-right tabular-nums">{l.visitors}</td>
                  <td className="py-2.5 px-4 text-right tabular-nums">{l.visits}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

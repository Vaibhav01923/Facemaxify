import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../services/supabase";
import { getVisitorId } from "../services/funnel";
import { Tile, percent } from "./StatsTrafficTab";

// "Countries" tab of /stats: where visitors are, and how far each country's visitors get. Data comes from the
// get_country_stats database function (supabase_country_tracking.sql). The country is worked out on the server from the
// request (api/geo.js), kept per visitor and joined onto the same visits/events as the Traffic sources tab, so the numbers
// line up with it. Visitors with no recorded country (older visits, or location not available) are listed as "Unknown".

interface CountryRow {
  country: string; // ISO 3166-1 alpha-2 code, or "unknown"
  visits: number;
  visitors: number;
  signed_in: number;
  submitters: number;
  succeeded: number;
}
interface Countries {
  tracking_since: string | null;
  totals: { visits: number; visitors: number; with_country: number; signed_in: number; submitters: number; succeeded: number };
  countries: CountryRow[];
}

const UNKNOWN = "unknown";

let regionNames: Intl.DisplayNames | null = null;
function countryName(code: string): string {
  if (code === UNKNOWN) return "Unknown";
  try {
    regionNames ??= new Intl.DisplayNames(["en"], { type: "region" });
    return regionNames.of(code) ?? code;
  } catch {
    return code;
  }
}

export const StatsCountriesTab: React.FC<{ password: string; hours: number | null; refreshKey: number }> = ({ password, hours, refreshKey }) => {
  const [data, setData] = useState<Countries | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const since = hours === null ? null : new Date(Date.now() - hours * 3600 * 1000).toISOString();
      const { data: result, error: rpcError } = await supabase.rpc("get_country_stats", {
        p_password: password,
        p_since: since,
        p_visitor: getVisitorId(),
      });
      if (cancelled) return;
      setLoading(false);
      if (rpcError) {
        const missing = rpcError.code === "PGRST202" || /could not find the function|does not exist/i.test(rpcError.message);
        setNeedsSetup(missing);
        setError(missing ? null : rpcError.message.includes("invalid password") ? "Wrong password." : `Couldn't load countries: ${rpcError.message}`);
        return;
      }
      setNeedsSetup(false);
      setData(result as Countries);
    })();
    return () => {
      cancelled = true;
    };
  }, [password, hours, refreshKey]);

  const rows = data?.countries ?? [];
  const known = useMemo(() => rows.filter((r) => r.country !== UNKNOWN), [rows]);

  if (needsSetup) {
    return (
      <section className="rounded-3xl border border-amber-500/30 bg-amber-500/5 p-6">
        <h2 className="text-lg font-bold mb-2">One-time database setup needed</h2>
        <p className="text-sm text-slate-300 mb-3">
          Visitors' countries are stored in a new database table that hasn't been created yet. Until then the site works normally, it just isn't recording countries.
        </p>
        <ol className="list-decimal pl-5 text-sm text-slate-300 space-y-1">
          <li>Open your Supabase project → <b>SQL Editor</b> → <b>New query</b>.</li>
          <li>
            If you haven't yet, run <code className="text-amber-300">supabase_traffic_sources.sql</code> first (this tab breaks those numbers down by country).
          </li>
          <li>
            Paste the contents of <code className="text-amber-300">supabase_country_tracking.sql</code> (in the root of the repo) and press <b>Run</b>. It is safe to run twice and
            doesn't touch your existing stats.
          </li>
          <li>Come back here and press <b>Refresh</b>. Countries start being recorded from that moment.</li>
        </ol>
      </section>
    );
  }

  const totals = data?.totals ?? { visits: 0, visitors: 0, with_country: 0, signed_in: 0, submitters: 0, succeeded: 0 };
  const top = known[0];

  return (
    <div>
      {error && <p className="text-red-400 text-sm mb-6">{error}</p>}
      <p className="text-sm text-slate-400 mb-6">
        {data?.tracking_since ? `Countries recorded since ${new Date(data.tracking_since).toLocaleString()}. ` : "No countries recorded yet. "}
        The country comes from the visitor's connection and is worked out on the server; no IP address is stored. Each person counts once, in the latest country seen for them.
        People recorded before country tracking started count as Unknown until they come back. Your own browsers are excluded.
      </p>

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <Tile title="Countries" value={known.length} note="with at least one visitor in this period" />
        <Tile
          title="Top country"
          value={top ? countryName(top.country) : "–"}
          note={top ? `${top.visitors} visitors · ${percent(top.visitors, totals.visitors)} of all visitors` : "nothing recorded yet"}
        />
        <Tile title="Visitors" value={totals.visitors} note="unique people, all countries" />
        <Tile title="Country known" value={percent(totals.with_country, totals.visitors)} note={`${totals.with_country} of ${totals.visitors} visitors`} />
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-bold text-white mb-3">
          Visitors by country {loading && <span className="text-xs font-normal text-slate-500 ml-2">loading…</span>}
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-900/80 text-slate-300">
              <tr>
                <th className="py-3 px-4 font-semibold">Country</th>
                <th className="py-3 px-4 font-semibold text-right">Visitors</th>
                <th className="py-3 px-4 font-semibold min-w-32">Share</th>
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
                  <td colSpan={8} className="py-6 px-4 text-center text-slate-500">
                    Nothing recorded in this period yet.
                  </td>
                </tr>
              )}
              {rows.map((r) => {
                const isUnknown = r.country === UNKNOWN;
                const share = totals.visitors > 0 ? (r.visitors / totals.visitors) * 100 : 0;
                return (
                  <tr key={r.country} className="border-t border-white/5 text-slate-300">
                    <td className="py-2.5 px-4">
                      <span className={isUnknown ? "text-slate-400" : "text-white"}>{countryName(r.country)}</span>
                      <span className="block text-xs text-slate-500">{isUnknown ? "no country recorded" : r.country}</span>
                    </td>
                    <td className="py-2.5 px-4 text-right tabular-nums text-white font-semibold">{r.visitors}</td>
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 rounded-full bg-slate-800 overflow-hidden">
                          <div className={`h-full rounded-full ${isUnknown ? "bg-slate-600" : "bg-indigo-500"}`} style={{ width: `${share}%` }} />
                        </div>
                        <span className="w-10 text-right text-xs tabular-nums text-slate-400">{percent(r.visitors, totals.visitors)}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-right tabular-nums">{r.visits}</td>
                    <td className="py-2.5 px-4 text-right tabular-nums">{r.signed_in}</td>
                    <td className="py-2.5 px-4 text-right tabular-nums">{r.submitters}</td>
                    <td className="py-2.5 px-4 text-right tabular-nums">{r.succeeded}</td>
                    <td className="py-2.5 px-4 text-right tabular-nums">{percent(r.submitters, r.visitors)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

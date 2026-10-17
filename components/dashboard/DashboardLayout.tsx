import React, { createContext, useCallback, useContext, useEffect, useMemo } from "react";
import { Link, NavLink, Outlet, useLocation, useSearchParams } from "react-router-dom";
import { UserButton, useUser } from "@clerk/clerk-react";
import { Lock } from "lucide-react";
import { useRegionalDiscount } from "../../hooks/useRegionalDiscount";
import { DashboardSEO } from "../SEO";
import { deleteScan } from "../../services/supabase";
import { FREE_METRIC_NAMES, SCAN_PARAM, reportsReady, useScans, withScan, type Scan, type SectionKey } from "./scanData";
import { OVERVIEW_ICON, SECTIONS } from "./sections";
import { StepTicks } from "./visuals";
import "./dashboard.css";

interface DashboardContextValue {
  isPaid: boolean;
  scans: Scan[];
  latest: Scan | null;
  previous: Scan | null;
  /** The scan the report pages are showing: `?scan=` when it matches one of yours, otherwise the newest. */
  selected: Scan | null;
  selectScan: (id: string) => void;
  /** Deletes a scan (it is archived, as before) and reloads the list. Resolves false when it could not. */
  removeScan: (id: string) => Promise<boolean>;
  userId?: string;
  loading: boolean;
  refresh: () => Promise<void>;
  /** Link that starts checkout for the signed-in user. */
  upgradeHref: string;
  upgradePrice: string;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export const useDashboard = () => {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used inside <DashboardLayout>");
  return ctx;
};

const NAV = [
  { to: "/dashboard", end: true, index: "00", label: "Overview", short: "Overview", icon: OVERVIEW_ICON, key: null as SectionKey | null },
  ...SECTIONS.map((s) => ({ to: s.route, end: false, index: s.index, label: s.title, short: s.short, icon: s.icon, key: s.key as SectionKey | null })),
];

export const DashboardLayout: React.FC<{ isPaid?: boolean }> = ({ isPaid = false }) => {
  const { user } = useUser();
  const { pathname } = useLocation();
  const scans = useScans();
  const [params, setParams] = useSearchParams();
  const discount = useRegionalDiscount();
  const scanParam = params.get(SCAN_PARAM);
  const selected = useMemo(() => scans.scans.find((s) => s.id === scanParam) ?? scans.latest, [scans.scans, scans.latest, scanParam]);

  const selectScan = useCallback(
    (id: string) =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set(SCAN_PARAM, id);
          return next;
        },
        { replace: true },
      ),
    [setParams],
  );

  const { refresh } = scans;
  const removeScan = useCallback(
    async (id: string) => {
      if (!user?.id) return false;
      const ok = await deleteScan(id, user.id);
      if (ok) {
        if (scanParam === id)
          setParams(
            (prev) => {
              const next = new URLSearchParams(prev);
              next.delete(SCAN_PARAM);
              return next;
            },
            { replace: true },
          );
        await refresh();
      }
      return ok;
    },
    [user?.id, scanParam, setParams, refresh],
  );
  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const upgradeHref = `${discount.link}${discount.link.includes("?") ? "&" : "?"}customerEmail=${encodeURIComponent(email)}`;

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  const ready = selected ? reportsReady(selected) : null;
  const readyCount = ready ? Object.values(ready).filter(Boolean).length : 0;

  const value = useMemo<DashboardContextValue>(
    () => ({ ...scans, selected, selectScan, removeScan, userId: user?.id, isPaid, upgradeHref, upgradePrice: discount.price }),
    [scans, selected, selectScan, removeScan, user?.id, isPaid, upgradeHref, discount.price],
  );

  return (
    <DashboardContext.Provider value={value}>
      <DashboardSEO />
      <div className="dash relative">
        {/* ambient light, fixed so it never scrolls or repaints */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0"
          style={{
            background:
              "radial-gradient(900px 520px at 88% -8%, rgba(154,168,255,0.07), transparent 60%), radial-gradient(700px 480px at 4% 108%, rgba(154,168,255,0.04), transparent 60%)",
          }}
        />

        {/* ---------------- desktop rail ---------------- */}
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col border-r border-[var(--d-line)] px-5 py-6 lg:flex">
          <Link to="/dashboard" className="mb-9 flex items-center gap-3 px-2">
            <img src="/favicon.png" alt="" className="h-7 w-7 rounded-lg" />
            <span className="text-[17px] font-semibold tracking-[-0.03em]">Facemaxify</span>
          </Link>

          <p className="d-eyebrow mb-3 px-2.5">Reports</p>
          <nav aria-label="Dashboard" className="flex flex-col gap-0.5">
            {NAV.map((item) => {
              const sec = item.key;
              const isReady = sec && ready ? ready[sec] : false;
              const locked = sec && !isPaid && SECTIONS.find((s) => s.key === sec)?.access === "pro";
              return (
                <NavLink key={item.to} to={withScan(item.to, scanParam)} end={item.end} className="d-nav">
                  <span className="d-idx">{item.index}</span>
                  <span className="truncate">{item.label}</span>
                  {locked ? (
                    <Lock className="h-3.5 w-3.5 text-[var(--d-t4)]" strokeWidth={1.5} aria-label="Pro" />
                  ) : sec && isReady && selected ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--d-accent)]" aria-label="Ready" />
                  ) : null}
                </NavLink>
              );
            })}
          </nav>

          <div className="mt-auto space-y-4">
            {selected && (
              <div className="px-2.5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="d-eyebrow">{selected.id === scans.latest?.id ? "Latest scan" : "This scan"}</span>
                  <span className="d-mono text-[11px] text-[var(--d-t3)]">{readyCount}/4</span>
                </div>
                <StepTicks done={readyCount} total={4} />
              </div>
            )}

            {isPaid ? (
              <div className="d-card flex items-center gap-3 px-4 py-3">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-[var(--d-accent-soft)] text-[var(--d-accent)]">
                  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m3.5 8.5 3 3 6-7" />
                  </svg>
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium leading-tight">Pro</p>
                  <p className="text-[12px] leading-tight text-[var(--d-t3)]">All reports unlocked</p>
                </div>
              </div>
            ) : (
              <div className="d-card-raised p-4">
                <p className="text-[13px] font-medium leading-tight">Preview plan</p>
                <p className="mt-1 text-[12px] leading-snug text-[var(--d-t3)]">
                  {FREE_METRIC_NAMES.length} of 25+ ratios open. Score, skincare, color and hairstyle are Pro.
                </p>
                <a href={upgradeHref} className="d-btn d-btn-primary d-btn-sm mt-3 w-full justify-between">
                  <span>Unlock all · {discount.price}</span>
                  <span className="d-btn-dot">
                    <Arrow />
                  </span>
                </a>
              </div>
            )}

            <div className="flex items-center gap-3 px-1.5">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8",
                    userButtonPopoverCard: "bg-slate-900 border border-slate-800",
                    userButtonPopoverActionButton: "hover:bg-slate-800",
                  },
                }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium leading-tight">{user?.firstName || user?.fullName || "Account"}</p>
                <p className="truncate text-[12px] leading-tight text-[var(--d-t3)]">{email}</p>
              </div>
            </div>

            <div className="flex gap-4 px-2.5 text-[12px] text-[var(--d-t3)]">
              <a href="/tools" className="-my-2 py-2 transition-colors hover:text-[var(--d-t1)]">Free tools</a>
              <a href="/blog" className="-my-2 py-2 transition-colors hover:text-[var(--d-t1)]">Blog</a>
              <a href="/methodology" className="-my-2 py-2 transition-colors hover:text-[var(--d-t1)]">How it works</a>
            </div>
          </div>
        </aside>

        {/* ---------------- mobile top bar ---------------- */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[var(--d-line)] bg-[rgba(7,8,13,0.82)] px-5 backdrop-blur-xl lg:hidden">
          <Link to="/dashboard" className="flex items-center gap-2.5 py-2.5">
            <img src="/favicon.png" alt="" className="h-6 w-6 rounded-md" />
            <span className="text-[16px] font-semibold tracking-[-0.03em]">Facemaxify</span>
          </Link>
          <UserButton appearance={{ elements: { avatarBox: "w-8 h-8", userButtonPopoverCard: "bg-slate-900 border border-slate-800" } }} />
        </header>

        {/* ---------------- content ---------------- */}
        <main className="relative z-10 lg:pl-[264px]">
          <div className="mx-auto w-full max-w-[1180px] px-5 pb-32 pt-7 sm:px-8 lg:px-12 lg:pb-24 lg:pt-14">
            <Outlet />
          </div>
        </main>

        {/* ---------------- mobile tab bar ---------------- */}
        <nav
          aria-label="Dashboard"
          className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--d-line)] bg-[rgba(7,8,13,0.88)] backdrop-blur-xl lg:hidden"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <ul className="mx-auto grid max-w-md grid-cols-5">
            {NAV.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <NavLink
                    to={withScan(item.to, scanParam)}
                    end={item.end}
                    className={({ isActive }) =>
                      `flex h-[58px] flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
                        isActive ? "text-[var(--d-accent)]" : "text-[var(--d-t3)] active:text-[var(--d-t1)]"
                      }`
                    }
                  >
                    <Icon className="h-[21px] w-[21px]" strokeWidth={1.5} />
                    <span>{item.short}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </DashboardContext.Provider>
  );
};

export const Arrow: React.FC<{ className?: string }> = ({ className = "h-3.5 w-3.5" }) => (
  <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3.5 8h9M8.5 4l4 4-4 4" />
  </svg>
);

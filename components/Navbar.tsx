import React from "react";
import { UserButton, SignInButton, useUser } from "@clerk/clerk-react";
import { LanguageSwitcher } from "./i18n/LanguageSwitcher";

export const Navbar: React.FC = () => {
  const { isSignedIn } = useUser();
  // The links above are hidden below the md breakpoint, so phones get this menu instead.
  const [menuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <nav className="sticky top-0 z-50 md:backdrop-blur-xl bg-slate-950/95 md:bg-slate-950/80 border-b border-slate-800 shadow-2xl shadow-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <a href="/" className="flex items-center gap-3">
            <img
              src="/favicon.png"
              alt="Facemaxify Logo"
              width={32}
              height={32}
              className="w-8 h-8 rounded-lg shadow-lg shadow-blue-500/20"
            />
            <span className="text-lg font-bold tracking-tight text-white">
              Facemaxify
            </span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center ml-10 space-x-8">
            <div className="relative group">
              <button className="py-3 text-slate-300 hover:text-white font-medium flex items-center gap-1 transition-colors">
                Free Tools
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Dropdown */}
              <div className="absolute left-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-left z-50 overflow-hidden">
                <div className="py-2">
                  <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Popular Tools
                  </div>
                  <a
                    href="/facial-harmony-analyzer"
                    className="flex items-start gap-3 px-4 py-3 hover:bg-slate-800 transition-colors group/item block"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-lg mt-0.5 group-hover/item:bg-amber-500/20 transition-colors flex-shrink-0">
                      🎯
                    </div>
                    <div>
                      <div className="text-white font-medium mb-0.5 group-hover/item:text-amber-300 transition-colors">
                        Facial Harmony Analyzer
                      </div>
                      <div className="text-xs text-slate-400">
                        Broad keyword page into full report
                      </div>
                    </div>
                  </a>

                  <a
                    href="/tools/facial-shape"
                    className="flex items-start gap-3 px-4 py-3 hover:bg-slate-800 transition-colors group/item block"
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-lg mt-0.5 group-hover/item:bg-indigo-500/20 transition-colors flex-shrink-0">
                      📐
                    </div>
                    <div>
                      <div className="text-white font-medium mb-0.5 group-hover/item:text-indigo-300 transition-colors">
                        Face Shape Detector
                      </div>
                      <div className="text-xs text-slate-400">
                        Identify your face shape instantly
                      </div>
                    </div>
                  </a>

                  <div className="h-px bg-slate-800 my-2"></div>

                  <a
                    href="/tools"
                    className="flex items-center justify-between px-4 py-3 hover:bg-indigo-500/10 transition-colors group/all block"
                  >
                    <span className="text-sm font-medium text-indigo-400 group-hover/all:text-indigo-300">
                      View All Tools and Pages
                    </span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-indigo-400 group-hover/all:translate-x-1 transition-transform"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            <a href="/blog" className="py-3 text-slate-300 hover:text-white font-medium transition-colors">
              Blog
            </a>

            <a href="/methodology" className="py-3 text-slate-300 hover:text-white font-medium transition-colors">
              How it works
            </a>
          </div>

          {/* Right Side - Auth */}
          <div className="flex items-center gap-2 sm:gap-4">
            <LanguageSwitcher />
            {isSignedIn ? (
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-9 h-9",
                    userButtonPopoverCard:
                      "bg-slate-900 border border-slate-800",
                    userButtonPopoverActionButton: "hover:bg-slate-800",
                  },
                }}
              />
            ) : (
              <SignInButton mode="modal">
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors text-sm">
                  Sign In
                </button>
              </SignInButton>
            )}

            {/* Phone menu button */}
            <button
              type="button"
              className="md:hidden -mr-2 inline-flex h-11 w-11 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
                {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div id="mobile-menu" className="md:hidden absolute inset-x-0 top-full border-b border-slate-800 bg-slate-950 shadow-2xl shadow-black/40">
          <div className="mx-auto max-w-7xl space-y-1 px-4 py-3">
            <div className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Popular tools</div>
            <a href="/facial-harmony-analyzer" className="flex min-h-12 items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-slate-800">
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-lg">🎯</span>
              <span>
                <span className="block font-medium text-white">Facial Harmony Analyzer</span>
                <span className="block text-xs text-slate-400">Broad keyword page into full report</span>
              </span>
            </a>
            <a href="/tools/facial-shape" className="flex min-h-12 items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-slate-800">
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-lg">📐</span>
              <span>
                <span className="block font-medium text-white">Face Shape Detector</span>
                <span className="block text-xs text-slate-400">Identify your face shape instantly</span>
              </span>
            </a>
            <a href="/tools" className="flex min-h-12 items-center justify-between rounded-xl px-3 py-2 text-sm font-medium text-indigo-400 transition-colors hover:bg-indigo-500/10 hover:text-indigo-300">
              View All Tools and Pages
              <span aria-hidden="true">→</span>
            </a>

            <div className="my-2 h-px bg-slate-800" />

            <a href="/blog" className="flex min-h-12 items-center rounded-xl px-3 font-medium text-slate-200 transition-colors hover:bg-slate-800 hover:text-white">
              Blog
            </a>
            <a href="/methodology" className="flex min-h-12 items-center rounded-xl px-3 font-medium text-slate-200 transition-colors hover:bg-slate-800 hover:text-white">
              How it works
            </a>
          </div>
        </div>
      )}
    </nav>
  );
};

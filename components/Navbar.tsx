import React from "react";
import { UserButton, SignInButton, useUser } from "@clerk/clerk-react";

export const Navbar: React.FC = () => {
  const { isSignedIn } = useUser();

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800 shadow-2xl shadow-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <a href="/" className="flex items-center gap-3">
            <img
              src="/favicon.png"
              alt="Facemaxify Logo"
              className="w-8 h-8 rounded-lg shadow-lg shadow-blue-500/20"
            />
            <h1 className="text-lg font-bold tracking-tight text-white">
              Facemaxify
            </h1>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center ml-10 space-x-8">
            <div className="relative group">
              <button className="text-slate-300 hover:text-white font-medium flex items-center gap-1 transition-colors">
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
          </div>

          {/* Right Side - Auth */}
          <div className="flex items-center gap-4">
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
          </div>
        </div>
      </div>
    </nav>
  );
};

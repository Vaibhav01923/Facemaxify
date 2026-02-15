import React, { useEffect, useState } from "react";
import { SignUpButton, useUser, useClerk } from "@clerk/clerk-react";
import { motion } from "framer-motion";
import {
  Scan,
  Shield,
  Activity,
  Sparkles,
  ArrowRight,
  Lock,
  TrendingUp,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { supabase } from "../services/supabase";
import { FAQ } from "./FAQ";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const LandingPage: React.FC = () => {
  const { isSignedIn, user } = useUser();
  const { openSignIn } = useClerk();
  const [userCount, setUserCount] = useState<number | null>(null);
  console.log(user);
  useEffect(() => {
    // Initial fetch
    fetchUserCount();

    // Poll every 30 seconds (Optimized for performance)
    const interval = setInterval(fetchUserCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUserCount = async () => {
    try {
      const { count, error } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true });

      if (error) {
        console.error("Error fetching user count:", error);
        return;
      }

      if (count !== null) {
        setUserCount(count);
      }
    } catch (err) {
      console.error("Failed to fetch user count:", err);
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  useEffect(() => {
    // Check if we need to redirect after login
    const pendingAction = localStorage.getItem("pendingAction");
    if (isSignedIn && pendingAction) {
      localStorage.removeItem("pendingAction");
      if (pendingAction === "purchase") {
        window.location.href = `/api/checkout?products=98df164f-7f50-4df1-bba7-0a24d340f60c&customerEmail=${user?.primaryEmailAddress?.emailAddress}`;
      } else if (pendingAction === "dashboard") {
        window.location.href = "/dashboard";
      }
    }
  }, [isSignedIn]);

  return (
    <div className="min-h-screen bg-[#050510] text-white font-sans selection:bg-indigo-500/30 overflow-hidden relative">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[150px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-600/10 rounded-full blur-[150px] animate-pulse-slow delay-1000"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
      </div>

      {/* Main Content - Minimal */}
      <motion.main
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 flex flex-col justify-center items-center min-h-[80vh] px-6 text-center pt-12"
      >
        {/* Top Tools Strip */}
        <motion.div variants={item} className="w-full max-w-4xl mx-auto mb-16">
          <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 hover:border-indigo-500/30 transition-colors">
            <div className="flex items-center gap-3">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              <p className="text-sm font-medium text-slate-300">
                New: Free AI Tools Available
              </p>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide max-w-full">
              <a
                href="/tools/facial-shape"
                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 text-indigo-300 rounded-lg text-xs font-semibold transition-all whitespace-nowrap"
              >
                <span>📐 Face Shape Detector</span>
                <ArrowRight className="w-3 h-3" />
              </a>
              <a
                href="/tools/golden-ratio"
                className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-amber-300 rounded-lg text-xs font-semibold transition-all whitespace-nowrap"
              >
                <span>✨ Golden Ratio</span>
                <ArrowRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        </motion.div>
        {/* Hero Text */}
        <motion.h1
          variants={item}
          className="text-6xl sm:text-8xl font-bold tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-slate-500"
        >
          Facemaxify
        </motion.h1>

        <motion.p
          variants={item}
          className="text-lg sm:text-2xl text-slate-400 mb-10 max-w-xl mx-auto leading-relaxed font-medium"
        >
          Facial Analysis and guides without BS and cope
        </motion.p>

        {/* CTAs */}
        <motion.div
          variants={item}
          className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full max-w-2xl"
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full sm:w-auto"
          >
            <button
              onClick={() => {
                if (!isSignedIn) {
                  localStorage.setItem("pendingAction", "dashboard");
                  openSignIn();
                } else {
                  window.location.href = "/dashboard";
                }
              }}
              className="group relative w-full sm:w-auto px-8 py-4 bg-white/5 text-white border border-white/10 rounded-full font-semibold text-lg hover:bg-white/10 transition-all flex items-center justify-center gap-2 backdrop-blur-md"
            >
              <span className="relative z-10">Free analysis</span>
              <Scan className="w-4 h-4" />
            </button>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full sm:w-auto"
          >
            <button
              onClick={() => {
                if (!isSignedIn) {
                  localStorage.setItem("pendingAction", "purchase");
                  openSignIn();
                } else {
                  window.location.href = `/api/checkout?customerEmail=${user?.primaryEmailAddress?.emailAddress}`;
                }
              }}
              className="group relative w-full sm:w-auto px-8 py-4 bg-white text-black rounded-full font-semibold text-lg hover:bg-slate-200 transition-all flex items-center justify-center gap-2 shadow-[0_0_50px_-10px_rgba(255,255,255,0.2)]"
            >
              <span className="relative z-10">Purchase Now</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full sm:w-auto"
          >
            <button
              onClick={() => {
                document
                  .getElementById("value-prop")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className="group relative w-full sm:w-auto px-8 py-4 bg-slate-800/50 text-white border border-slate-700 rounded-full font-semibold text-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 backdrop-blur-md hover:border-indigo-500/50"
            >
              <span className="relative z-10">Why Us?</span>
              <TrendingUp className="w-4 h-4 text-indigo-400" />
            </button>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: 1 }}
          className="absolute bottom-0 left-0 w-full flex justify-center cursor-pointer p-4 hover:text-indigo-400 transition-colors"
          onClick={() => {
            document
              .getElementById("proof-section")
              ?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs text-slate-500 uppercase tracking-widest">
              See the evidence
            </span>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m7 13 5 5 5-5" />
              <path d="m7 6 5 5 5-5" />
            </svg>
          </div>
        </motion.div>
      </motion.main>

      {/* Value Proposition Section */}
      <section
        id="value-prop"
        className="relative z-10 py-24 px-6 min-h-[90vh] flex flex-col items-center justify-center overflow-hidden"
      >
        {/* Background Gradients */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-indigo-950/10 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/5 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="max-w-6xl mx-auto w-full relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl sm:text-7xl font-black mb-6 tracking-tighter leading-[1.1]">
              Why{" "}
              <span className="text-emerald-400 inline-block transform hover:scale-105 transition-transform duration-300 cursor-default shadow-emerald-500/20 drop-shadow-lg">
                Us?
              </span>
            </h2>

            <p className="text-xl sm:text-3xl text-slate-300 font-light max-w-4xl mx-auto leading-relaxed">
              We're offering this at a
              <span className="text-white font-bold mx-2 relative inline-block">
                <span className="absolute inset-0 bg-indigo-500/20 skew-x-[-10deg] rounded-sm transform scale-110"></span>
                <span className="relative z-10">dirt cheap price</span>
              </span>
              because we're just getting started.
            </p>
          </motion.div>

          {/* Bento Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left Card: No BS */}
            <motion.div
              whileHover={{ y: -5 }}
              className="md:col-span-5 bg-gradient-to-br from-slate-900/80 to-slate-900/40 border border-white/5 p-8 rounded-3xl backdrop-blur-xl flex flex-col justify-between group overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-6 border border-indigo-500/20 group-hover:bg-indigo-500/30 transition-colors">
                  <Shield className="w-6 h-6 text-indigo-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  Real, No-BS Guides
                </h3>
                <p className="text-slate-400 leading-relaxed font-light">
                  Our library is growing. We are committed to updating the
                  quality and quantity of our guides weekly with{" "}
                  <span className="text-slate-200 font-medium">
                    actionable, no-cope protocols
                  </span>
                  .
                </p>
              </div>
            </motion.div>

            {/* Right Card: No AI Slop */}
            <motion.div
              whileHover={{ y: -5 }}
              className="md:col-span-7 bg-gradient-to-bl from-slate-900/80 to-slate-900/40 border border-white/5 p-8 rounded-3xl backdrop-blur-xl flex flex-col justify-between group overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-gradient-to-bl from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-6 border border-emerald-500/20 group-hover:bg-emerald-500/30 transition-colors">
                  <Activity className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  NOT "AI Slop"
                </h3>
                <p className="text-slate-400 leading-relaxed font-light">
                  This isn't a black box. We use{" "}
                  <span className="text-white font-bold bg-white/5 px-2 py-0.5 rounded">
                    actual mathematical metrics
                  </span>{" "}
                  calculated for your face.
                  <br className="my-2" />
                  You can verify every metric and ratio visually by simply
                  hovering over the results. Transparancy is key.
                </p>
              </div>
            </motion.div>

            {/* Bottom: The Offer (Ticket Style) */}
            <motion.div
              whileHover={{ scale: 1.005 }}
              className="md:col-span-12 relative overflow-hidden group"
            >
              {/* Ticket Container */}
              <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl p-1 relative overflow-hidden shadow-2xl shadow-indigo-500/20">
                {/* Glowing Border Animation */}
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-20 animate-gradient-xy"></div>

                <div className="bg-slate-950/90 backdrop-blur-xl rounded-[20px] p-8 sm:p-12 relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 border border-white/5">
                  {/* Left Side: Text */}
                  <div className="flex-1 text-center md:text-left">
                    <div className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-4">
                      Limited Time Launch Offer (41% OFF)
                    </div>
                    <h3 className="text-3xl sm:text-5xl font-black text-white mb-2 tracking-tight">
                      Full Access Pass
                    </h3>
                    <p className="text-slate-400 text-lg">
                      Unlock the facial rating tool for life.
                    </p>
                  </div>

                  {/* Middle: Divider (Dashed Line) */}
                  <div className="hidden md:block w-px h-32 border-l-2 border-dashed border-slate-700 mx-4 relative">
                    <div className="absolute -top-14 -left-3 w-6 h-6 bg-slate-950 rounded-full"></div>
                    <div className="absolute -bottom-14 -left-3 w-6 h-6 bg-slate-950 rounded-full"></div>
                  </div>

                  {/* Right Side: Price & Code */}
                  <div className="flex flex-col items-center gap-4 min-w-[280px]">
                    <div className="text-center">
                      <span className="text-slate-500 line-through text-lg font-bold mr-2">
                        $10
                      </span>
                      <span className="text-5xl sm:text-6xl font-black text-white tracking-tighter shadow-indigo-500/50 drop-shadow-lg">
                        $5.99
                      </span>
                    </div>

                    <div
                      onClick={() => {
                        navigator.clipboard.writeText("EARLY40");
                        // Simple visual feedback could be added here if we had a toast lib
                        // For now we can change text momentarily or just rely on user knowing it copied
                        const el = document.getElementById("code-text");
                        if (el) {
                          const original = el.innerText;
                          el.innerText = "COPIED!";
                          setTimeout(() => (el.innerText = original), 1000);
                        }
                      }}
                      className="w-full bg-indigo-500/10 border border-indigo-500/30 border-dashed rounded-lg p-3 flex flex-col items-center gap-1 group/code cursor-pointer transition-colors hover:bg-indigo-500/20 active:scale-95 select-none"
                    >
                      <span className="text-[10px] text-indigo-300 uppercase tracking-widest font-bold">
                        Use Code (Click to Copy)
                      </span>
                      <span
                        id="code-text"
                        className="text-2xl font-mono font-bold text-white tracking-widest group-hover/code:text-indigo-200 transition-colors"
                      >
                        EARLY40
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        if (!isSignedIn) {
                          localStorage.setItem("pendingAction", "purchase");
                          openSignIn();
                        } else {
                          window.location.href = `/api/checkout?customerEmail=${user?.primaryEmailAddress?.emailAddress}`;
                        }
                      }}
                      className="w-full py-4 bg-white hover:bg-indigo-50 text-black rounded-xl font-bold text-lg transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 group/btn mt-2"
                    >
                      Get Access{" "}
                      <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                    <p className="text-xs text-slate-500 font-medium">
                      One-time payment • Lifetime access
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Proof Section */}
      <section
        id="proof-section"
        className="relative z-10 py-24 px-6 min-h-screen flex flex-col items-center justify-center"
      >
        <div className="max-w-6xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-5xl font-bold mb-6">
              Same Tech.{" "}
              <span className="text-indigo-400">Better Pricing.</span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg text-balance">
              We use the exact same advanced computer vision frameworks that our
              competitors use !{" "}
              <span className="text-white font-extrabold">don't overpay</span>{" "}
              for it !
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            {[1, 2, 3].map((num, i) => (
              <motion.div
                key={num}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                whileHover={{ y: -10 }}
                className="relative group rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/50 shadow-2xl"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-0 group-hover:opacity-60 transition-opacity z-10"></div>
                <img
                  src={`/proof-${num}.png`}
                  alt={`Comparison Proof ${num}`}
                  className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-700 opacity-80 group-hover:opacity-100"
                />
              </motion.div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500 max-w-2xl mx-auto leading-relaxed">
              <span className="inline-block px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700/50">
                📸 Snippet from F**eIQ's website
              </span>
              <br />
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section for SEO */}
      <FAQ />

      {/* CSS for custom animations (inline for simplicity) */}
      <style>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.1); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 6s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes scan {
            0% { top: 0%; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
        }
        .animate-scan {
            animation: scan 3s linear infinite;
        }
        @keyframes gradient-x {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
        }
        .animate-gradient-x {
            background-size: 200% 200%;
            animation: gradient-x 15s ease infinite;
        }
      `}</style>
    </div>
  );
};

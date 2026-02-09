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
        className="relative z-10 flex flex-col justify-center items-center min-h-[80vh] px-6 text-center"
      >
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
          className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full max-w-lg"
        >
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
              competitors use ! We don't Lie to our customers, a manual rating
              by an expert will always be better, but If you want to use AI,
              then{" "}
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
              <span className="text-xs text-slate-600 mt-2 inline-block">
                (their code was exposed and not secure, so we could replicate
                their exact formulas and algorithms)
              </span>
            </p>
          </div>
        </div>
      </section>

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

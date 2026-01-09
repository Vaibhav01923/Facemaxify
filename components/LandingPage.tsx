import React, { useEffect, useState } from "react";
import { SignUpButton, useUser } from "@clerk/clerk-react";
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
  const { isSignedIn } = useUser();
  const [userCount, setUserCount] = useState<number | null>(null);

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
        {/* Badge */}
        <motion.div variants={item} className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors cursor-default">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-medium text-slate-300 tracking-wide uppercase">
              Waitlist Open
            </span>
          </div>
        </motion.div>

        {/* Hero Text */}
        <motion.h1
          variants={item}
          className="text-6xl sm:text-8xl font-bold tracking-tighter mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-slate-500"
        >
          Facemaxify
        </motion.h1>

        <motion.p
          variants={item}
          className="text-lg sm:text-xl text-slate-400 mb-12 max-w-xl mx-auto leading-relaxed font-light"
        >
          The next generation of facial aesthetics analysis.{" "}
          <br className="hidden sm:block" />
          Join the exclusive waitlist for early access.
        </motion.p>

        {/* CTA */}
        <motion.div
          variants={item}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <SignUpButton mode="modal">
            <button className="group relative px-8 py-4 bg-white text-black rounded-full font-semibold text-lg hover:bg-slate-200 transition-all flex items-center gap-2 shadow-[0_0_50px_-10px_rgba(255,255,255,0.2)]">
              <span className="relative z-10">Join the waitlist</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </SignUpButton>
        </motion.div>

        {/* Minimal Social Proof */}
        <motion.div
          variants={item}
          className="mt-16 flex items-center gap-4 text-sm text-slate-500 font-medium"
        >
          <div className="flex -space-x-2">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full border border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] text-slate-400 overflow-hidden"
              >
                <div
                  className={`w-full h-full bg-gradient-to-br ${
                    [
                      "from-purple-500 to-indigo-500",
                      "from-blue-500 to-cyan-500",
                      "from-emerald-500 to-teal-500",
                      "from-amber-500 to-orange-500",
                    ][i]
                  } opacity-50`}
                ></div>
              </div>
            ))}
          </div>
          <span>
            Joined by{" "}
            <span className="text-white font-semibold">
              {userCount !== null ? userCount.toLocaleString() : "..."}
            </span>{" "}
            users
          </span>
        </motion.div>
      </motion.main>

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

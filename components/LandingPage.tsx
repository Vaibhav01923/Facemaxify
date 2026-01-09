
import React from 'react';
import { SignUpButton, useUser } from "@clerk/clerk-react";
import { motion } from "framer-motion";
import { Scan, Shield, Activity, Sparkles, ArrowRight, Lock, TrendingUp } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const LandingPage: React.FC = () => {
  const { isSignedIn } = useUser();

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

      {/* Navigation / Header */}
      <nav className="relative z-50 max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <span className="font-bold text-white text-lg">F</span>
            </div>
            <span className="font-bold text-xl tracking-tight hidden sm:block">Facemaxify</span>
        </div>
        <div className="flex items-center gap-4">
             {!isSignedIn && (
                <SignUpButton mode="modal">
                    <button className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
                        Sign In
                    </button>
                </SignUpButton>
             )}
            <SignUpButton mode="modal">
                <button className="bg-white text-black px-5 py-2 rounded-full text-sm font-semibold hover:bg-indigo-50 transition-colors shadow-lg shadow-white/10">
                    Get Started ->
                </button>
            </SignUpButton>
        </div>
      </nav>

      {/* Main Content */}
      <motion.main 
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 max-w-7xl mx-auto px-6 py-12 lg:py-20 flex flex-col items-center"
      >
        
        {/* Hero Text */}
        <motion.div variants={item} className="text-center max-w-3xl mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/50 border border-indigo-500/20 mb-6 backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                <span className="text-xs font-medium text-indigo-300 tracking-wide uppercase">AI Engine v2.0 Live</span>
            </div>
            
            <h1 className="text-5xl sm:text-7xl font-bold tracking-tight mb-8 leading-[1.1]">
                Enhance Your <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 animate-gradient-x">Aesthetic Potential</span>
            </h1>
            
            <p className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                Advanced facial harmonization analysis powered by deep learning. 
                Get precise symmetry scores, skin quality metrics, and personalized improvement plans.
            </p>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <SignUpButton mode="modal">
                    <button className="group relative px-8 py-4 bg-white text-black rounded-full font-bold text-lg shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-15px_rgba(255,255,255,0.5)] transition-all overflow-hidden">
                        <span className="relative z-10 flex items-center gap-2">
                            Analyze My Face Free <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-100 to-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                </SignUpButton>
            </motion.div>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full max-w-6xl">
            
            {/* Feature 1: Large Scan Visualization */}
            <motion.div variants={item} className="col-span-1 md:col-span-2 lg:col-span-2 row-span-2 bg-slate-900/40 border border-slate-800/50 rounded-3xl p-8 backdrop-blur-sm relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 group-hover:from-indigo-500/10 group-hover:to-purple-500/10 transition-colors duration-500"></div>
                <div className="relative z-10 h-full flex flex-col justify-between">
                    <div>
                        <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-6">
                            <Scan className="w-6 h-6 text-indigo-400" />
                        </div>
                        <h3 className="text-2xl font-bold mb-2">Deep Facial Analysis</h3>
                        <p className="text-slate-400 text-sm leading-relaxed max-w-xs">Our AI maps 120+ landmarks to calculate your facial symmetry and proportions against the Golden Ratio.</p>
                    </div>
                    
                    {/* Abstract Scan Animation */}
                    <div className="mt-8 relative h-48 w-full bg-slate-950/50 rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center">
                        <div className="absolute inset-0 flex items-center justify-center">
                             {/* Scan Line */}
                            <div className="w-[120%] h-1 bg-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.5)] absolute top-0 animate-scan"></div>
                            
                            {/* Grid Lines */}
                            <svg className="w-full h-full opacity-20" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                                <defs>
                                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-indigo-500"/>
                                    </pattern>
                                </defs>
                                <rect width="100%" height="100%" fill="url(#grid)" />
                            </svg>

                            {/* Face Points (Abstract) */}
                            <div className="relative w-32 h-40 border-2 border-indigo-500/30 rounded-[3rem] animate-pulse">
                                <div className="absolute top-1/3 left-1/4 w-2 h-2 bg-indigo-400 rounded-full shadow-[0_0_10px_currentColor]"></div>
                                <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-indigo-400 rounded-full shadow-[0_0_10px_currentColor]"></div>
                                <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-8 h-1 bg-indigo-400/50 rounded-full"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Feature 2: Score Card */}
            <motion.div variants={item} className="col-span-1 md:col-span-1 bg-slate-900/40 border border-slate-800/50 rounded-3xl p-6 backdrop-blur-sm relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Activity className="w-24 h-24 text-emerald-500" />
                 </div>
                 <h3 className="text-lg font-bold mb-1">Harmony Score</h3>
                 <p className="text-slate-500 text-xs mb-6">Real-time metric</p>
                 <div className="flex items-end gap-2">
                    <span className="text-5xl font-bold text-emerald-400">9.4</span>
                    <span className="text-sm text-slate-400 mb-2">/ 10</span>
                 </div>
                 <div className="mt-4 h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: "94%" }}
                        transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                        className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                    />
                 </div>
            </motion.div>

            {/* Feature 3: Skin Analysis */}
            <motion.div variants={item} className="col-span-1 md:col-span-1 bg-slate-900/40 border border-slate-800/50 rounded-3xl p-6 backdrop-blur-sm relative overflow-hidden group">
                <div className="w-10 h-10 bg-pink-500/20 rounded-xl flex items-center justify-center mb-4">
                    <Sparkles className="w-5 h-5 text-pink-400" />
                </div>
                <h3 className="text-lg font-bold">Skin Quality</h3>
                <p className="text-slate-400 text-sm mt-2">Texture, redness, and clarity analysis with dermatologist-grade precision.</p>
            </motion.div>

            {/* Feature 4: Privacy */}
             <motion.div variants={item} className="col-span-1 bg-slate-900/40 border border-slate-800/50 rounded-3xl p-6 backdrop-blur-sm relative overflow-hidden group flex flex-col justify-center items-center text-center">
                 <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Shield className="w-6 h-6 text-slate-300" />
                 </div>
                 <h3 className="font-bold">100% Private</h3>
                 <p className="text-xs text-slate-500 mt-2">Analysis happens locally. Photos are deleted instantly if not saved.</p>
            </motion.div>

            {/* Feature 5: Trends */}
            <motion.div variants={item} className="col-span-1 md:col-span-2 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-8 relative overflow-hidden text-white group">
                <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                         <div className="flex justify-between items-start">
                             <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium border border-white/10">
                                <TrendingUp className="w-3 h-3" /> Trending
                             </div>
                             <Lock className="w-5 h-5 opacity-50" />
                         </div>
                         <h3 className="text-2xl font-bold mt-4">Join the Waitlist</h3>
                         <p className="text-indigo-100 mt-2 text-sm max-w-sm">
                             We are processing 10,000+ faces weekly. Secure your spot for premium features.
                         </p>
                    </div>
                    <SignUpButton mode="modal">
                        <button className="mt-8 bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-colors w-fit shadow-lg">
                            Get Access Now
                        </button>
                    </SignUpButton>
                </div>
                
                {/* Decorative BG */}
                <div className="absolute right-[-20px] bottom-[-20px] opacity-10 scale-150 rotate-12 pointer-events-none">
                    <Scan className="w-64 h-64" />
                </div>
            </motion.div>
        
        </div>

        {/* Footer */}
        <motion.footer variants={item} className="mt-20 border-t border-slate-800/50 pt-8 w-full max-w-7xl flex flex-col md:flex-row justify-between items-center text-slate-500 text-sm gap-4">
             <p>© 2026 Facemaxify AI. All rights reserved.</p>
             <div className="flex gap-6">
                 <a href="#" className="hover:text-slate-300 transition-colors">Privacy</a>
                 <a href="#" className="hover:text-slate-300 transition-colors">Terms</a>
                 <a href="#" className="hover:text-slate-300 transition-colors">Twitter</a>
             </div>
        </motion.footer>

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

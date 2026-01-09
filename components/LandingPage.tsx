import React from "react";
import { SignUpButton } from "@clerk/clerk-react";
import { Button } from "./Button";

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-blue-500/30 overflow-hidden relative">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-20 min-h-screen flex flex-col items-center justify-center text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-full px-4 py-1.5 mb-8 animate-fadeIn">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">
            First 10 Signups Get Free Access
          </span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
          Unlock Your True
          <br />
          Aesthetic Potential
        </h1>

        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-12 leading-relaxed">
          State-of-the-art facial analysis powered by AI. Get detailed harmony
          scores, ratio breakdowns, and personalized improvement insights
          instantly.
        </p>

        <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-2 shadow-2xl shadow-blue-500/5 transform transition-all hover:scale-[1.01] flex flex-col items-center gap-4">
          <SignUpButton mode="modal">
            <Button className="whitespace-nowrap rounded-xl px-12 h-14 text-lg font-semibold w-full">
              Get Early Access
            </Button>
          </SignUpButton>
        </div>

        <div className="mt-16 flex gap-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
          {/* Simple visual placeholders for trust */}
          <div className="text-xs text-slate-500 uppercase tracking-widest font-bold">
            Secure
          </div>
          <div className="text-xs text-slate-500 uppercase tracking-widest font-bold">
            Private
          </div>
          <div className="text-xs text-slate-500 uppercase tracking-widest font-bold">
            AI-Powered
          </div>
        </div>
      </div>
    </div>
  );
};

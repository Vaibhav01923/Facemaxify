import React, { useState } from "react";
import { saveSignup } from "../services/supabase";
import { Button } from "./Button";

export const LandingPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError("");

    // Simulate delay for effect
    await new Promise((r) => setTimeout(r, 800));

    const success = await saveSignup(email);
    setLoading(false);

    if (success) {
      setSubmitted(true);
      // No redirect for waitlist mode
    } else {
      setError("Something went wrong. Please try again.");
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center animate-fadeIn">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
          <span className="text-4xl">🎉</span>
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">
          You're on the list!
        </h2>
        <p className="text-slate-400">
          We'll notify you as soon as your free premium access is ready.
        </p>
      </div>
    );
  }

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
          scores, ratio breaksdowns, and personalized improvement insights
          instantly.
        </p>

        <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-2 shadow-2xl shadow-blue-500/5 transform transition-all hover:scale-[1.01]">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="email"
              required
              placeholder="Enter your email"
              className="flex-1 bg-transparent border-none text-white placeholder:text-slate-500 focus:ring-0 px-4 py-3 outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button
              type="submit"
              disabled={loading}
              className="whitespace-nowrap rounded-xl px-8 h-12"
            >
              {loading ? "Joining..." : "Get Early Access"}
            </Button>
          </form>
        </div>

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

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

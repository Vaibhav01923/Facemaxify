import React from "react";
import { Navbar } from "./Navbar";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock } from "lucide-react";

export const Guides: React.FC = () => {
  const navigate = useNavigate();

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#050510] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="mb-6 bg-indigo-500/10 w-20 h-20 rounded-full flex items-center justify-center border border-indigo-500/20">
          <Clock className="w-10 h-10 text-indigo-400 animate-pulse" />
        </div>
        
        <h1 className="text-4xl font-bold mb-4">Premium Guides</h1>
        <p className="text-slate-400 text-lg mb-12 max-w-md mx-auto">
          We are currently curating the most effective aesthetic improvement guides. 
          Expect scientifically-backed content very soon.
        </p>

        <div className="inline-flex flex-col gap-4">
          <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-indigo-300 font-medium">
             ✨ Coming Q1 2026
          </div>
          
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mx-auto mt-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>
      </div>
    </>
  );
};

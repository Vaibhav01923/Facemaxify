import React from "react";
import { Navbar } from "./Navbar";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, ChevronRight, Sparkles, Clock, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { guides } from "../data/guidesData";

export const Guides: React.FC<{ isPaid?: boolean }> = ({ isPaid = false }) => {
  const navigate = useNavigate();
  const { user } = useUser();

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#050510] text-white pt-24 px-6 pb-12 relative overflow-hidden">
        {/* Background Blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="max-w-5xl mx-auto relative z-10">
          <header className="mb-12">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Dashboard
            </button>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              Premium Guides
            </h1>
            <p className="text-slate-400 text-lg">
              Unlock the secrets of peak aesthetics with our expert-curated content.
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {guides.map((guide, idx) => (
              <motion.div
                key={guide.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => isPaid && navigate(`/dashboard/guides/${guide.id}`)}
                className={`group relative bg-slate-900/40 border border-slate-800 rounded-3xl p-6 transition-all overflow-hidden ${
                  isPaid ? "cursor-pointer hover:bg-slate-800/40 hover:border-indigo-500/30" : "cursor-default"
                }`}
              >
                {!isPaid && (
                   <div className="absolute inset-0 bg-[#050510]/80 backdrop-blur-[4px] z-20 flex flex-col items-center justify-center text-center p-6">
                      <div className="w-12 h-12 bg-indigo-600/20 rounded-2xl flex items-center justify-center mb-4 border border-indigo-500/20">
                        <Lock className="w-6 h-6 text-indigo-400" />
                      </div>
                      <h4 className="text-white font-bold text-sm mb-1 uppercase tracking-tight">Locked Content</h4>
                      <p className="text-slate-500 text-[11px] mb-4 leading-relaxed px-4">This guide is exclusive to premium members.</p>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `/api/checkout?customerEmail=${user?.primaryEmailAddress?.emailAddress}`;
                        }}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-[10px] font-black uppercase tracking-tighter transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
                      >
                        Upgrade Now
                      </button>
                   </div>
                )}

                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
                   <Sparkles className="w-12 h-12 text-indigo-400" />
                </div>
                
                <div className="mb-6 aspect-video bg-indigo-600/10 rounded-2xl flex items-center justify-center border border-white/5 overflow-hidden">
                   <img 
                    src={guide.thumbnail} 
                    alt={guide.title} 
                    className={`w-full h-full object-cover transition-transform duration-500 ${isPaid ? "group-hover:scale-110" : ""}`}
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=800";
                    }}
                   />
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-0.5 bg-indigo-500/20 border border-indigo-500/30 rounded-md text-indigo-400 text-[10px] font-bold uppercase tracking-wider">
                    {guide.category}
                  </span>
                  <span className="flex items-center gap-1 text-slate-500 text-xs font-medium">
                    <Clock className="w-3 h-3" />
                    {guide.readTime}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-indigo-400 transition-colors">
                  {guide.title}
                </h3>
                
                <p className="text-sm text-slate-400 mb-6 line-clamp-2">
                  {guide.description}
                </p>

                <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                  {isPaid ? "Read Full Guide" : "Premium Guide"}
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            ))}

            {/* Coming Soon Card */}
            <div className="bg-white/5 border border-white/5 rounded-3xl p-6 flex flex-col items-center justify-center text-center opacity-60">
               <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6 text-slate-500" />
               </div>
               <h3 className="text-lg font-bold text-slate-300 mb-2">More coming soon</h3>
               <p className="text-xs text-slate-500 leading-relaxed">
                  Deep dives on Jawline, Eyes, and Hairline improvements.
               </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

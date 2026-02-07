import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "./Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChevronDown, Sparkles, BookOpen, Clock, CheckCircle2 } from "lucide-react";
import { guides } from "../data/guidesData";

export const GuideDetail: React.FC = () => {
  const { guideId } = useParams();
  const navigate = useNavigate();
  const guide = guides.find((g) => g.id === guideId);
  const [openSections, setOpenSections] = useState<string[]>([guide?.sections[0].title || ""]);

  if (!guide) {
    return (
      <div className="min-h-screen bg-[#050510] text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Guide not found</h2>
          <button onClick={() => navigate("/dashboard/guides")} className="text-indigo-400 hover:underline">
            Back to Guides
          </button>
        </div>
      </div>
    );
  }

  const toggleSection = (title: string) => {
    setOpenSections((prev) =>
      prev.includes(title) ? prev.filter((s) => s !== title) : [...prev, title]
    );
  };

  return (
    <div className="min-h-screen bg-[#050510] text-slate-200 selection:bg-indigo-500/30">
      <Navbar />
      
      {/* Hero Header */}
      <div className="pt-32 pb-16 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-indigo-600/10 to-transparent pointer-events-none"></div>
        <div className="max-w-4xl mx-auto relative z-10">
          <button
            onClick={() => navigate("/dashboard/guides")}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to all guides
          </button>
          
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-indigo-400 text-xs font-bold uppercase tracking-wider">
              {guide.category}
            </span>
            <span className="flex items-center gap-1.5 text-slate-500 text-sm font-medium">
              <Clock className="w-4 h-4" />
              {guide.readTime}
            </span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            {guide.title}
          </h1>
          <p className="text-xl text-slate-400 leading-relaxed max-w-2xl">
            {guide.description}
          </p>
        </div>
      </div>

      {/* Content Sections */}
      <div className="max-w-4xl mx-auto px-6 pb-24 relative z-10">
        <div className="space-y-6">
          {guide.sections.map((section, idx) => (
            <div 
              key={idx}
              className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-xl"
            >
              <button
                onClick={() => toggleSection(section.title)}
                className="w-full flex items-center justify-between p-6 md:p-8 text-left hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center border border-indigo-500/30">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-white">{section.title}</h2>
                </div>
                <ChevronDown 
                  className={`w-6 h-6 text-slate-500 transition-transform duration-300 ${
                    openSections.includes(section.title) ? "rotate-180" : ""
                  }`}
                />
              </button>

              <AnimatePresence>
                {openSections.includes(section.title) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <div className="px-6 md:px-8 pb-8 pt-2 space-y-12">
                      {section.steps.map((step, sIdx) => (
                        <div key={sIdx} className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                          <div className="md:col-span-1 flex flex-col items-center">
                            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400 font-bold text-sm">
                              {sIdx + 1}
                            </div>
                            {sIdx < section.steps.length - 1 && (
                              <div className="w-px h-full bg-gradient-to-b from-slate-700 to-transparent mt-4 opacity-50"></div>
                            )}
                          </div>
                          
                          <div className="md:col-span-11 bg-slate-800/20 rounded-2xl p-6 border border-white/5 hover:border-white/10 transition-colors">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                              {step.title}
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div className="space-y-4">
                                <p className="text-slate-400 leading-relaxed whitespace-pre-wrap">
                                  {step.content}
                                </p>
                              </div>
                              {step.image && (
                                <div className="aspect-video md:aspect-square rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl relative group">
                                  <div className="absolute inset-0 bg-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                  <img 
                                    src={step.image} 
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                    alt={step.title}
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.src = "https://images.unsplash.com/photo-1556229162-5c63ed9c4ffb?auto=format&fit=crop&q=80&w=800";
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

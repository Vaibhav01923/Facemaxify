import React from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "./Navbar";
import { motion } from "framer-motion";
import { Sparkles, BookOpen, ArrowRight } from "lucide-react";

export const DashboardHome: React.FC = () => {
  const navigate = useNavigate();

  const cards = [
    {
      title: "Facial Analysis",
      description: "Advanced AI-powered analysis of your facial aesthetics and symmetry.",
      icon: <Sparkles className="w-8 h-8 text-indigo-400" />,
      route: "/dashboard/facial-analysis",
      buttonText: "Start Analysis",
      color: "from-indigo-600/20 to-indigo-900/20",
      borderColor: "border-indigo-500/30",
    },
    {
      title: "Premium Guides",
      description: "Exclusive step-by-step guides to improve your facial features and grooming.",
      icon: <BookOpen className="w-8 h-8 text-emerald-400" />,
      route: "/dashboard/guides",
      buttonText: "View Guides",
      color: "from-emerald-600/20 to-emerald-900/20",
      borderColor: "border-emerald-500/30",
    },
  ];

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#050510] text-white pt-24 px-6 pb-12 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/5 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-5xl mx-auto relative z-10">
          <header className="mb-12 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              Welcome back
            </h1>
            <p className="text-slate-400 text-lg">
              Choose your path to aesthetic excellence.
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
            {cards.map((card, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -5 }}
                className={`group relative p-8 rounded-3xl border ${card.borderColor} bg-gradient-to-br ${card.color} backdrop-blur-xl transition-all overflow-hidden`}
              >
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="mb-6 bg-slate-900/50 w-16 h-16 rounded-2xl flex items-center justify-center border border-white/5 shadow-inner">
                  {card.icon}
                </div>

                <h2 className="text-2xl font-bold mb-3 group-hover:text-white transition-colors">
                  {card.title}
                </h2>
                <p className="text-slate-400 mb-8 leading-relaxed">
                  {card.description}
                </p>

                <button
                  onClick={() => navigate(card.route)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full font-semibold hover:bg-slate-200 transition-all active:scale-95"
                >
                  {card.buttonText}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

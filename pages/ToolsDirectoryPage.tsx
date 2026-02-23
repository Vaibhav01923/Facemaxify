import React, { useState } from "react";
import { SEO } from "../components/SEO";
import { motion } from "framer-motion";
import { Search, Sparkles, ArrowRight, Lock, Clock } from "lucide-react";

interface Tool {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: "Face" | "Eyes" | "Skin" | "Body" | "Style";
  status: "Live" | "Coming Soon" | "Premium";
  link?: string;
}

const TOOLS: Tool[] = [
  // Live Tools
  {
    id: "face-shape",
    title: "Face Shape Detector",
    description:
      "Identify your face shape (Oval, Round, Square, etc.) instantly with AI.",
    icon: "📐",
    category: "Face",
    status: "Live",
    link: "/tools/facial-shape",
  },

  // Coming Soon - Phase 1
  {
    id: "golden-ratio",
    title: "Golden Ratio Calculator",
    description: "Calculate your facial proportions and golden ratio score.",
    icon: "✨",
    category: "Face",
    status: "Live",
    link: "/tools/golden-ratio",
  },
  {
    id: "face-age",
    title: "Face Age Estimator",
    description: "AI-powered estimation of your perceived facial age.",
    icon: "📅",
    category: "Face",
    status: "Coming Soon",
  },
  {
    id: "skin-tone",
    title: "Skin Tone Analyzer",
    description: "Find your perfect skin tone match and color season.",
    icon: "🎨",
    category: "Skin",
    status: "Coming Soon",
  },

  // Phase 2
  {
    id: "jawline",
    title: "Jawline Analyzer",
    description: "Analyze your jawline definition and strength.",
    icon: "🗿",
    category: "Face",
    status: "Coming Soon",
  },
  {
    id: "eye-shape",
    title: "Eye Shape Detector",
    description: "Determine your eye shape and tilt for the best aesthetics.",
    icon: "👁️",
    category: "Eyes",
    status: "Coming Soon",
  },
  {
    id: "nose-shape",
    title: "Nose Shape Analyzer",
    description: "Identify your nose shape and get contouring tips.",
    icon: "👃",
    category: "Face",
    status: "Coming Soon",
  },

  // Phase 3 & 4
  {
    id: "symmetry",
    title: "Facial Symmetry Test",
    description: "Check how symmetrical your facial features are.",
    icon: "⚖️",
    category: "Face",
    status: "Coming Soon",
  },
  {
    id: "hairstyles",
    title: "Hairstyle Recommender",
    description: "Get AI-suggested hairstyles based on your face shape.",
    icon: "💇",
    category: "Style",
    status: "Coming Soon",
  },
  {
    id: "canthal-tilt",
    title: "Canthal Tilt Analyzer",
    description: "Measure your precise eye tilt (positive, neutral, negative).",
    icon: "👁️",
    category: "Eyes",
    status: "Live",
    link: "/tools/canthal-tilt",
  },
  {
    id: "glasses",
    title: "Glasses Frame Finder",
    description: "Find the perfect glasses for your face shape.",
    icon: "👓",
    category: "Style",
    status: "Coming Soon",
  },
  {
    id: "celebrity-match",
    title: "Celebrity Lookalike",
    description: "Find out which celebrity you look like the most.",
    icon: "⭐",
    category: "Face",
    status: "Coming Soon",
  },
];

const CATEGORIES = ["All", "Face", "Eyes", "Skin", "Style"];

export const ToolsDirectoryPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredTools = TOOLS.filter((tool) => {
    const matchesSearch =
      tool.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || tool.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#050510] relative overflow-hidden">
      <SEO
        title="Free AI Facial Analysis Tools Directory | Facemaxify"
        description="Explore our collection of free AI-powered facial analysis tools. Detect your face shape, analyze symmetry, find your golden ratio, and more."
        keywords="free face analysis tools, AI beauty tools, face shape detector, golden ratio calculator, eye shape analyzer, looksmax tools"
        canonicalUrl="https://facemaxify.com/tools"
      />

      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[150px]"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-purple-600/10 rounded-full blur-[150px]"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block px-4 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-semibold mb-6"
          >
            AI-Powered Analysis
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-6xl font-black text-white mb-6"
          >
            Free Facial{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              Analysis Tools
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-lg max-w-2xl mx-auto"
          >
            Discover insights about your facial features with our suite of
            advanced AI tools. Private, secure, and completely free to start.
          </motion.p>
        </div>

        {/* Search & Filter */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="relative mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="Search tools (e.g. 'Face Shape', 'Eyes')..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-800 focus:border-indigo-500 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 outline-none transition-all shadow-xl"
            />
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === category
                    ? "bg-white text-black"
                    : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTools.map((tool, index) => (
            <motion.a
              key={tool.id}
              href={tool.status === "Live" ? tool.link : "#"}
              onClick={(e) => tool.status !== "Live" && e.preventDefault()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={tool.status === "Live" ? { y: -5 } : {}}
              className={`relative group bg-slate-900/50 border border-slate-800 rounded-3xl p-8 transition-all overflow-hidden ${
                tool.status === "Live"
                  ? "hover:border-indigo-500/50 cursor-pointer"
                  : "opacity-60 cursor-not-allowed"
              }`}
            >
              <div className="absolute top-0 right-0 p-4">
                {tool.status === "Live" ? (
                  <div className="bg-indigo-500/10 text-indigo-400 text-xs font-bold px-2 py-1 rounded border border-indigo-500/20">
                    LIVE
                  </div>
                ) : (
                  <div className="bg-slate-800 text-slate-500 text-xs font-bold px-2 py-1 rounded border border-slate-700 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> SOON
                  </div>
                )}
              </div>

              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-6 ${
                  tool.status === "Live"
                    ? "bg-indigo-500/10"
                    : "bg-slate-800/50"
                }`}
              >
                {tool.icon}
              </div>

              <h3
                className={`text-xl font-bold mb-3 ${
                  tool.status === "Live"
                    ? "text-white group-hover:text-indigo-400"
                    : "text-slate-400"
                } transition-colors`}
              >
                {tool.title}
              </h3>

              <p className="text-slate-500 mb-6 leading-relaxed">
                {tool.description}
              </p>

              {tool.status === "Live" && (
                <div className="flex items-center text-indigo-400 font-semibold text-sm">
                  Try Now{" "}
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              )}
            </motion.a>
          ))}
        </div>

        {filteredTools.length === 0 && (
          <div className="text-center py-24 text-slate-500">
            <p className="text-lg">No tools found matching your search.</p>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("All");
              }}
              className="mt-4 text-indigo-400 hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

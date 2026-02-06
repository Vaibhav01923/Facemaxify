import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { getScanHistory } from "../services/supabase";
import { motion } from "framer-motion";
import { Clock, ChevronRight, Sparkles, Calendar } from "lucide-react";

interface AnalysisHistoryProps {
  onSelectScan: (scan: any) => void;
}

export const AnalysisHistory: React.FC<AnalysisHistoryProps> = ({ onSelectScan }) => {
  const { user } = useUser();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      if (!user?.id) return;
      setLoading(true);
      const data = await getScanHistory(user.id);
      setHistory(data);
      setLoading(false);
    }
    fetchHistory();
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-medium">Loading your previous scans...</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center p-12 bg-white/5 border border-white/10 rounded-3xl">
        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
           <Clock className="w-8 h-8 text-slate-600" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">No scans yet</h3>
        <p className="text-slate-400">Start your first facial analysis to see your history here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
        <Clock className="w-5 h-5 text-indigo-400" />
        Your Scan History
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {history.map((scan) => (
          <motion.div
            key={scan.id}
            whileHover={{ y: -4 }}
            onClick={() => onSelectScan(scan)}
            className="group relative bg-slate-900/40 border border-slate-800 rounded-2xl p-4 cursor-pointer hover:bg-slate-800/60 transition-all hover:border-indigo-500/30 overflow-hidden"
          >
            <div className="flex gap-4">
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-950 border border-white/5">
                <img 
                  src={scan.front_photo_url} 
                  alt="Scan thumbnail" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                    <Sparkles className="w-3 h-3" />
                    Facial Analysis
                  </div>
                  <div className="text-emerald-400 font-bold text-lg">
                    {scan.overall_score || "??"}
                  </div>
                </div>
                
                <h4 className="text-white font-bold text-sm mb-2">
                  {scan.gender === "male" ? "Male" : "Female"} • {scan.race?.charAt(0).toUpperCase() + scan.race?.slice(1)}
                </h4>
                
                <div className="flex items-center gap-1 text-slate-500 text-[10px]">
                  <Calendar className="w-3 h-3" />
                  {new Date(scan.created_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
              </div>
              <div className="flex items-center">
                <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-indigo-400 transition-colors" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

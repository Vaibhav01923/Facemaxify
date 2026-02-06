import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { getScanHistory } from "../services/supabase";
import { motion } from "framer-motion";
import { Plus, MoreHorizontal, ArrowUpCircle, ChevronRight, LayoutGrid } from "lucide-react";

interface AnalysisHistoryProps {
  onSelectScan: (scan: any) => void;
  onNewScan: () => void;
  selectedScanId?: string;
}

export const AnalysisHistory: React.FC<AnalysisHistoryProps> = ({ 
  onSelectScan, 
  onNewScan,
  selectedScanId 
}) => {
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
      <div className="flex items-center justify-center h-full p-8">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white text-slate-900 border-r border-slate-100 w-80 shrink-0">
      {/* User Info Header */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
              <img src={user?.imageUrl} alt="Profile" className="w-full h-full object-cover" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-800 leading-tight">
                {user?.fullName || "Aesthetic User"}
              </h4>
              <p className="text-[11px] text-slate-400 font-medium tracking-wide">
                Free
              </p>
            </div>
          </div>
          <button className="text-slate-400 hover:text-slate-600 transition-colors">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        <button className="w-full py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98]">
          <ArrowUpCircle className="w-4 h-4 text-indigo-400" />
          Upgrade
        </button>
      </div>

      {/* Control Buttons */}
      <div className="p-4 flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          History
        </span>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-600 hover:bg-slate-50 relative group">
            Compare <LayoutGrid className="w-3.5 h-3.5" />
            <span className="absolute -top-2 -right-1 bg-blue-500 text-white text-[8px] px-1 rounded-sm font-bold shadow-sm">Pro</span>
          </button>
          <button 
            onClick={onNewScan}
            className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-600 hover:bg-slate-50 active:scale-95 transition-all"
          >
            New <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1 pb-8 custom-scrollbar">
        {history.map((scan) => (
          <motion.div
            key={scan.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => onSelectScan(scan)}
            className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all ${
              selectedScanId === scan.id 
              ? "bg-slate-50 border-l-4 border-indigo-500" 
              : "hover:bg-slate-50/80 border-l-4 border-transparent"
            }`}
          >
            <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 shrink-0">
              <img 
                src={scan.front_photo_url} 
                className="w-full h-full object-cover"
                alt="Scan" 
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">Overall</span>
                <span className="text-[9px] font-bold text-slate-300">1mo</span>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  {['H', 'A', 'D', 'F'].map((char) => (
                    <div key={char} className="w-5 h-5 rounded-md border border-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-300">
                      {char}
                    </div>
                  ))}
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-200" />
              </div>
            </div>
          </motion.div>
        ))}

        {history.length === 0 && (
          <div className="text-center py-12 px-4">
            <p className="text-xs text-slate-400 font-medium">No skin history yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

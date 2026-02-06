import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { getScanHistory, supabase } from "../services/supabase";
import { motion } from "framer-motion";
import { Plus, MoreHorizontal, ArrowUpCircle, ChevronRight } from "lucide-react";

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
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!user?.id) return;
      setLoading(true);
      
      try {
        const [historyData, userData] = await Promise.all([
          getScanHistory(user.id),
          supabase.from("users").select("isPaid").eq("id", user.id).single()
        ]);
        
        setHistory(historyData);
        if (userData.data) {
          setIsPaid(userData.data.isPaid);
        }
      } catch (err) {
        console.error("Fetch data error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-8 bg-[#0A0A0F]">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0A0A0F] text-slate-300 border-r border-white/5 w-80 shrink-0">
      {/* User Info Header */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-900 border border-white/5">
              <img src={user?.imageUrl} alt="Profile" className="w-full h-full object-cover" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white leading-tight">
                {user?.fullName || "Aesthetic User"}
              </h4>
              <p className="text-[11px] text-slate-500 font-medium tracking-wide">
                {isPaid ? "Pro" : "Free"}
              </p>
            </div>
          </div>
          <button className="text-slate-500 hover:text-white transition-colors">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        {!isPaid && (
          <button className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98]">
            <ArrowUpCircle className="w-4 h-4 text-white/80" />
            Upgrade to Pro
          </button>
        )}
      </div>

      {/* Control Buttons */}
      <div className="p-4 flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          History
        </span>
        <button 
          onClick={onNewScan}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-white/10 rounded-lg text-[11px] font-bold text-slate-300 hover:bg-white/5 active:scale-95 transition-all"
        >
          New Analysis <Plus className="w-3.5 h-3.5" />
        </button>
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
              ? "bg-white/5 border-l-4 border-indigo-500" 
              : "hover:bg-white/[0.02] border-l-4 border-transparent"
            }`}
          >
            <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-900 border border-white/5 shrink-0">
              <img 
                src={scan.front_photo_url} 
                className="w-full h-full object-cover grayscale-[0.2]"
                alt="Scan" 
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter">Overall</span>
                <span className="text-[9px] font-bold text-slate-500">
                  {new Date(scan.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  {['H', 'A', 'D', 'F'].map((char) => (
                    <div key={char} className="w-5 h-5 rounded-md border border-white/5 flex items-center justify-center text-[8px] font-bold text-slate-600">
                      {char}
                    </div>
                  ))}
                </div>
                <div className="flex-1 h-px bg-white/5" />
                <ChevronRight className="w-3.5 h-3.5 text-slate-700" />
              </div>
            </div>
          </motion.div>
        ))}

        {history.length === 0 && (
          <div className="text-center py-12 px-4">
            <p className="text-xs text-slate-600 font-medium">No skin history yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { getScanHistory, deleteScan, supabase } from "../services/supabase";
import { motion } from "framer-motion";
import { Plus, MoreHorizontal, ArrowUpCircle, ChevronRight, Trash2, Calendar } from "lucide-react";

interface AnalysisHistoryProps {
  onSelectScan: (scan: any) => void;
  onNewScan: () => void;
  selectedScanId?: string;
  isPaid: boolean;
}

export const AnalysisHistory: React.FC<AnalysisHistoryProps> = ({ 
  onSelectScan, 
  onNewScan,
  selectedScanId,
  isPaid
}) => {
  const { user } = useUser();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!user?.id) return;
      setLoading(true);
      
      try {
        const historyData = await getScanHistory(user.id);
        // Sort by created_at desc
        const sorted = [...historyData].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setHistory(sorted);
      } catch (err) {
        console.error("Fetch data error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  const handleDelete = async (e: React.MouseEvent, scanId: string) => {
    e.stopPropagation();
    if (!user?.id) return;

    if (window.confirm("Are you sure you want to delete this scan? This action cannot be undone.")) {
      try {
        const success = await deleteScan(scanId, user.id);
        if (success) {
          setHistory(prev => prev.filter(s => s.id !== scanId));
          if (selectedScanId === scanId) {
            onNewScan();
          }
        }
      } catch (err) {
        console.error("Failed to delete scan", err);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  };

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
                {isPaid ? "Pro Member" : "Free Tier"}
              </p>
            </div>
          </div>
          
          {history.length > 0 && isPaid && (
            <div className="text-right">
              <div className="text-[10px] font-black text-indigo-400 uppercase tracking-tighter">Overall</div>
              <div className="text-2xl font-black text-white tracking-tighter leading-none">
                {Math.round((history.find(s => s.id === selectedScanId) || history[0]).overall_score * 10)}
              </div>
            </div>
          )}
        </div>

        {!isPaid && (
          <button 
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold py-2 px-3 rounded-lg shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all flex items-center justify-center gap-2"
            onClick={() => window.open('https://buy.stripe.com/test_8wM6qC6d83U82Zy144', '_blank')}
          >
            <span>✨ Upgrade to Pro</span>
          </button>
        )}
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
         <div className="flex items-center justify-between px-2 py-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">History</h3>
            <button onClick={onNewScan} className="text-indigo-400 hover:text-indigo-300 transition-colors">
                <Plus className="w-4 h-4" />
            </button>
         </div>

        {history.map((scan) => (
          <div
            key={scan.id}
            onClick={() => onSelectScan(scan)}
            className={`
              group relative p-3 rounded-xl border transition-all duration-200 cursor-pointer flex items-center gap-3
              ${selectedScanId === scan.id 
                ? 'bg-slate-900/80 border-indigo-500/50 shadow-lg shadow-indigo-500/10' 
                : 'bg-slate-900/30 border-white/5 hover:bg-slate-900/50 hover:border-white/10'
              }
            `}
          >
            {/* Thumbnail */}
            <div className="w-12 h-12 rounded-lg overflow-hidden border border-white/10 relative">
               <img src={scan.front_photo_url} className="w-full h-full object-cover" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
               <div className="flex items-center justify-between mb-1">
                   <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                       <Calendar className="w-3 h-3 text-slate-500" />
                       {formatDate(scan.created_at)}
                   </div>
                   {isPaid && (
                       <span className={`text-xs font-black ${
                           (scan.overall_score * 10) >= 80 ? 'text-emerald-400' : 
                           (scan.overall_score * 10) >= 60 ? 'text-indigo-400' : 'text-slate-400'
                       }`}>
                           {Math.round(scan.overall_score * 10)}
                       </span>
                   )}
               </div>
               
               <div className="flex items-center gap-2">
                  <div className="px-1.5 py-0.5 rounded-md bg-white/5 border border-white/5 text-[10px] text-slate-400 font-medium">
                     {scan.gender || "Unknown"}
                  </div>
                  {/* Delete button (hover only) */}
                  <button 
                    onClick={(e) => handleDelete(e, scan.id)}
                    className="ml-auto p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
               </div>
            </div>
            
            {selectedScanId === scan.id && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-r-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
            )}
          </div>
        ))}
        
        {history.length === 0 && !loading && (
            <div className="text-center py-8 px-4 opacity-50">
                <p className="text-xs">No analysis history yet.</p>
                <button onClick={onNewScan} className="text-indigo-400 text-xs mt-2 hover:underline">Start your first scan</button>
            </div>
        )}
      </div>
    </div>
  );
};

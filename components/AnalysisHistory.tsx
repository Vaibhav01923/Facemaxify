import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { getScanHistory, deleteScan, supabase } from "../services/supabase";
import { motion } from "framer-motion";
import { Plus, ChevronRight } from "lucide-react";

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
  const [profiles, setProfiles] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      if (!user?.id) return;
      setLoading(true);
      
      try {
        const historyData = await getScanHistory(user.id);
        setHistory(historyData);
      } catch (err) {
        console.error("Fetch data error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  // Group scans into a "Profile"
  useEffect(() => {
    if (history.length > 0) {
        const sorted = [...history].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        setProfiles([{
            id: 'profile_1',
            name: user?.fullName || "My Journey",
            photo: sorted[0].front_photo_url,
            latestScanDate: sorted[0].created_at,
            scanCount: sorted.length
        }]);
    }
  }, [history, user]);

  const handleDelete = async (e: React.MouseEvent, scanId: string) => {
    e.stopPropagation();
    if (!user?.id) return;

    if (window.confirm("Are you sure you want to delete this scan? This action cannot be undone.")) {
      try {
        const success = await deleteScan(scanId, user.id);
        if (success) {
          setHistory(prev => prev.filter(s => s.id !== scanId));
          // If we were selecting a specific scan, we might need to reset, 
          // but since we are now selecting "profiles", this logic might need adjustment.
          // For now, if the timeline is open, Dashboard handles specific scan deletion updates if we needed.
          // But here we are deleting from the sidebar? 
          // Actually, with the new UI, specific scans aren't listed in sidebar.
          // So this delete function is effectively dead code in the SIDEBAR, 
          // but useful if we ever re-add specific scan management.
          // We'll keep it for now but it's not reachable via UI currently.
          if (selectedScanId === scanId) {
            onNewScan();
          }
        }
      } catch (err) {
        console.error("Failed to delete scan", err);
      }
    }
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
         <div className="flex items-center gap-3 mb-4">
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
      </div>

       {/* Profiles List */}
       <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
           <div className="flex items-center justify-between px-2 py-2">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Journeys</h3>
              <button onClick={onNewScan} className="text-indigo-400 hover:text-indigo-300 transition-colors">
                  <Plus className="w-4 h-4" />
              </button>
           </div>
           
           {profiles.map(profile => (
             <div 
                key={profile.id}
                onClick={() => {
                    // Start from latest scan of this profile
                    const sortedScans = [...history].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                    const latestScan = sortedScans[0];
                    if(latestScan) onSelectScan(latestScan);
                }}
                className={`
                    group relative p-3 rounded-xl border transition-all duration-200 cursor-pointer flex items-center gap-3
                    ${!selectedScanId && profiles.length > 0
                        ? 'bg-slate-900/80 border-indigo-500/50 shadow-lg shadow-indigo-500/10' 
                        : 'bg-slate-900/30 border-white/5 hover:bg-slate-900/50 hover:border-white/10'
                    }
                `}
             >
                {/* Profile Thumb */}
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/10 relative">
                     <img src={profile.photo || user?.imageUrl} className="w-full h-full object-cover" alt={profile.name} />
                </div>
                
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-white truncate">{profile.name}</h4>
                    <p className="text-[11px] text-slate-400">{profile.scanCount} Check-ins</p>
                </div>
                
                <ChevronRight className="w-4 h-4 text-slate-500 transition-transform group-hover:text-indigo-400" />
             </div>
           ))}
           
            {profiles.length === 0 && !loading && (
                <div className="text-center py-8 px-4 opacity-50">
                    <p className="text-xs">No journeys started.</p>
                </div>
            )}
       </div>
    </div>
  );
};

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Calendar, Upload, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from './Button';

interface SkincareTimelineProps {
  scans: any[];
  currentScanId?: string;
  onUploadCheckIn: (file: File) => void;
  loading: boolean;
}

export const SkincareTimeline: React.FC<SkincareTimelineProps> = ({ 
  scans, 
  currentScanId, 
  onUploadCheckIn,
  loading 
}) => {
  // Sort scans by date descending
  const sortedScans = [...scans].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Expanded state for each card
  const [expandedScanIds, setExpandedScanIds] = useState<Set<string>>(new Set());

  // Effect: When scans change (e.g. new upload), expand the latest one
  React.useEffect(() => {
    if (sortedScans.length > 0) {
      setExpandedScanIds(new Set([sortedScans[0].id]));
    }
  }, [scans]); // Re-run when scans list updates

  const toggleScan = (id: string) => {
    const newExpanded = new Set(expandedScanIds);
    // If we want true accordion (only one open), we would clear others:
    // const newExpanded = new Set(); 
    
    if (expandedScanIds.has(id)) {
        newExpanded.delete(id);
    } else {
        // Optional: Uncomment to enforce single-expand (accordion)
        // newExpanded.clear();
        newExpanded.add(id);
    }
    setExpandedScanIds(newExpanded);
  };

  // Helper to get formatted date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Upload Check-in Button */}
      <div className="flex items-center justify-between bg-slate-900/50 p-6 rounded-2xl border border-white/5 backdrop-blur-sm">
        <div>
          <h3 className="text-lg font-bold text-white mb-1">Update Your Journey</h3>
          <p className="text-sm text-slate-400">Upload a new photo to track your progress.</p>
        </div>
        <label className={`
          flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 
          text-white rounded-lg font-bold transition-all cursor-pointer shadow-lg shadow-indigo-500/20 active:scale-95
          ${loading ? 'opacity-50 pointer-events-none' : ''}
        `}>
          <Upload className="w-4 h-4" />
          <span>{loading ? 'Processing...' : 'Add Check-in'}</span>
          <input 
            type="file" 
            className="hidden" 
            accept="image/*"
            disabled={loading}
            onChange={(e) => {
              if (e.target.files?.[0]) onUploadCheckIn(e.target.files[0]);
            }}
          />
        </label>
      </div>

      {/* Timeline list */}
      <div className="space-y-4">
        {sortedScans.map((scan, index) => {
          const isExpanded = expandedScanIds.has(scan.id);
          const analysis = scan.analysis?.skincare;
          const hasAnalysis = !!analysis;

          return (
            <motion.div 
              key={scan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`rounded-2xl border overflow-hidden transition-all duration-300 ${
                isExpanded 
                  ? 'bg-slate-900/80 border-indigo-500/30 shadow-2xl shadow-indigo-500/5' 
                  : 'bg-slate-900/30 border-white/5 hover:bg-slate-900/50'
              }`}
            >
              {/* Card Header (Always Visible) */}
              <div 
                onClick={() => toggleScan(scan.id)}
                className="p-4 flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  {/* Thumbnail */}
                  <div className="w-12 h-12 rounded-lg overflow-hidden border border-white/10 relative group">
                    <img 
                      src={scan.front_photo_url} 
                      alt="Scan thumbnail" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span className="text-white font-bold text-sm">{formatDate(scan.created_at)}</span>
                    </div>
                    {/* Status Badge */}
                    {hasAnalysis && (
                      <div className="mt-1 flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                             analysis.progress_report?.status === 'improved' 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                : analysis.progress_report?.status === 'worsened'
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                        }`}>
                            {analysis.progress_report?.status?.replace('_', ' ').toUpperCase() || 'ANALYZED'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <button className="text-slate-400 p-2 hover:bg-white/5 rounded-full transition-colors">
                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
              </div>

              {/* Card Body (Collapsible) */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-6 border-t border-white/5 bg-black/20">
                      {hasAnalysis ? (
                         <SkincareResults analysis={analysis} />
                      ) : (
                        <div className="text-center p-8 text-slate-500">
                          <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          <p>No specific skincare analysis found for this scan.</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

// Internal component to display the detailed analysis (refactored from Dashboard structure)
const SkincareResults: React.FC<{ analysis: any }> = ({ analysis }) => {
    return (
        <div className="space-y-8">
            {/* 1. Progress / Status Card */}
            <div className={`p-6 rounded-2xl border ${
                analysis.progress_report?.status === 'improved' ? 'bg-emerald-950/30 border-emerald-500/30' :
                analysis.progress_report?.status === 'worsened' ? 'bg-rose-950/30 border-rose-500/30' :
                'bg-slate-900/50 border-white/10'
            }`}>
                <div className="flex items-start gap-4">
                   <div className={`p-3 rounded-xl ${
                        analysis.progress_report?.status === 'improved' ? 'bg-emerald-500/20 text-emerald-400' :
                        analysis.progress_report?.status === 'worsened' ? 'bg-rose-500/20 text-rose-400' :
                        'bg-indigo-500/20 text-indigo-400'
                   }`}>
                       {analysis.progress_report?.status === 'improved' ? <CheckCircle2 className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
                   </div>
                   <div>
                       <h3 className="text-lg font-bold text-white mb-2">
                           Status: {analysis.progress_report?.status?.replace('_', ' ').toUpperCase()}
                       </h3>
                       <p className="text-slate-300 leading-relaxed">
                           {analysis.progress_report?.summary}
                       </p>
                   </div>
                </div>
            </div>

            {/* 2. Skin Analysis Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Skin Type</h4>
                    <p className="text-xl font-bold text-white mb-1">{analysis.analysis?.skin_type || "Unknown"}</p>
                    <p className="text-xs text-slate-500">Based on visual analysis</p>
                </div>
                <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Main Concerns</h4>
                    <div className="flex flex-wrap gap-2">
                        {analysis.analysis?.concerns?.map((c: string) => (
                            <span key={c} className="px-3 py-1 bg-red-500/10 text-red-400 text-xs font-bold rounded-lg border border-red-500/20">
                                {c}
                            </span>
                        ))}
                    </div>
                </div>
                <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Severity Score</h4>
                    <div className="flex items-end gap-2">
                        <span className={`text-4xl font-black ${
                            (analysis.analysis?.severity_score || 0) > 6 ? 'text-red-500' : 'text-emerald-500'
                        }`}>
                            {analysis.analysis?.severity_score || 0}
                        </span>
                        <span className="text-sm text-slate-500 mb-1">/ 10</span>
                    </div>
                </div>
            </div>
            
            {/* 3. Routine */}
             {analysis.routine && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Morning */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">
                    <span>☀️</span> Morning Routine
                  </h3>
                  <div className="bg-slate-900/50 rounded-2xl border border-white/5 p-6 space-y-4">
                    {analysis.routine.morning?.map((step: string, i: number) => (
                      <div key={i} className="flex gap-4">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold border border-amber-500/20">
                          {i + 1}
                        </span>
                        <p className="text-slate-300 text-sm">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Evening */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-indigo-400 flex items-center gap-2">
                    <span>🌙</span> Evening Routine
                  </h3>
                  <div className="bg-slate-900/50 rounded-2xl border border-white/5 p-6 space-y-4">
                    {analysis.routine.evening?.map((step: string, i: number) => (
                      <div key={i} className="flex gap-4">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold border border-indigo-500/20">
                          {i + 1}
                        </span>
                        <p className="text-slate-300 text-sm">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
        </div>
    );
};

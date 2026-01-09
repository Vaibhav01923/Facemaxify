import React from 'react';
import { MetricResult } from '../services/ratioCalculator';

interface RatioRowProps {
  metric: MetricResult;
  onHover: (metric: MetricResult | null) => void;
}

export const RatioRow: React.FC<RatioRowProps> = ({ metric, onHover }) => {
  const getScoreColor = (score: number) => {
    if (score >= 9) return "text-green-500";
    if (score >= 7) return "text-green-400";
    if (score >= 5) return "text-yellow-400";
    return "text-red-400";
  };

  const barMin = metric.idealMin * 0.5;
  const barMax = metric.idealMax * 1.5;
  const totalRange = barMax - barMin;
  
  const getPercent = (val: number) => {
    if (totalRange === 0) return 50;
    const p = ((val - barMin) / totalRange) * 100;
    return Math.min(Math.max(p, 0), 100);
  };

  const youPercent = getPercent(metric.value);
  const idealStart = getPercent(metric.idealMin);
  const idealWidth = getPercent(metric.idealMax) - idealStart;

  return (
    <div 
        className="py-4 border-b border-slate-800/50 last:border-0 hover:bg-slate-900 transition-colors px-4 cursor-default group"
        onMouseEnter={() => onHover(metric)}
        onMouseLeave={() => onHover(null)}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div className="flex-1">
          <h4 className="font-medium text-slate-200 text-sm group-hover:text-blue-400 transition-colors">{metric.name}</h4>
        </div>
        
        {/* Visual Bar Area */}
        <div className="flex-[2] relative h-2.5 bg-slate-800 rounded-full overflow-visible mt-1 sm:mt-0">
            {/* Track */}
            <div className="absolute inset-0 rounded-full bg-slate-800 shadow-inner"></div>

            {/* Ideal Zone */}
            <div 
                className="absolute top-0 bottom-0 rounded-sm bg-gradient-to-r from-transparent via-green-500/40 to-transparent border-b-2 border-green-500/60"
                style={{ left: `${idealStart}%`, width: `${idealWidth}%` }}
            ></div>

            {/* You Marker (The Knob) */}
            <div 
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-[0_2px_5px_rgba(0,0,0,0.5)] z-10 border-2 border-slate-200 transition-all duration-500 ease-out flex items-center justify-center group-hover:scale-125 group-hover:border-blue-500"
                style={{ left: `calc(${youPercent}% - 8px)` }}
            >
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
            </div>
            
            {/* Tooltip on Hover */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded border border-slate-600 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none">
                You: <span className="font-bold text-blue-400">{metric.value} {metric.unit}</span>
            </div>
        </div>

        {/* Score Area */}
        <div className="flex-1 text-right flex flex-col items-end justify-center">
          <span className={`text-lg font-bold ${getScoreColor(metric.score)}`}>
            {metric.score}<span className="text-xs text-slate-600 ml-0.5">/10</span>
          </span>
          <span className="text-[10px] text-slate-500">
             Ideal: {metric.idealMin} - {metric.idealMax}
          </span>
        </div>
      </div>
    </div>
  );
};

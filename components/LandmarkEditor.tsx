
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from './Button';
import { Point } from '../types';
import { FRONT_LANDMARK_DEFINITIONS, SIDE_LANDMARK_DEFINITIONS } from '../constants';

interface LandmarkEditorProps {
  photoUrl: string;
  initialLandmarks: Record<string, Point>;
  faceBox: { ymin: number, xmin: number, ymax: number, xmax: number };
  onComplete: (landmarks: Record<string, Point>) => void;
  title: string;
  landmarkType: 'front' | 'side';
}

export const LandmarkEditor: React.FC<LandmarkEditorProps> = ({ 
  photoUrl, 
  initialLandmarks, 
  faceBox,
  onComplete,
  title,
  landmarkType
}) => {
  const [landmarks, setLandmarks] = useState<Record<string, Point>>(initialLandmarks);
  const [activeKey, setActiveKey] = useState<string>(Object.keys(initialLandmarks)[0]);
  
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const [imgDim, setImgDim] = useState({ w: 0, h: 0 });
  
  // Refs for accessing state inside event listeners/intervals
  const transformRef = useRef(transform);
  const activeKeyRef = useRef(activeKey);
  const landmarksRef = useRef(landmarks);
  
  // Sync refs
  useEffect(() => { transformRef.current = transform; }, [transform]);
  useEffect(() => { activeKeyRef.current = activeKey; }, [activeKey]);
  useEffect(() => { landmarksRef.current = landmarks; }, [landmarks]);

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [startTransform, setStartTransform] = useState({ x: 0, y: 0 });

  const keys = Object.keys(initialLandmarks);
  const currentIndex = keys.indexOf(activeKey);

  // Get definition
  const definitions = landmarkType === 'front' ? FRONT_LANDMARK_DEFINITIONS : SIDE_LANDMARK_DEFINITIONS;
  // @ts-ignore
  const definition = definitions[activeKey];
  const activeLabel = definition ? definition.name : activeKey;
  const activeInstruction = definition ? definition.howToFind : "Adjust point location";

  // --- ARROW KEY & NUDGE LOGIC ---
  const nudgeInterval = useRef<any>(null);

  const nudge = useCallback((dx: number, dy: number) => {
      const currentK = transformRef.current.k;
      // Slower movement when zoomed in
      const speed = Math.max(0.5, 4 / currentK);
      
      const key = activeKeyRef.current;
      setLandmarks(prev => {
        const pt = prev[key];
        return {
          ...prev,
          [key]: {
            x: Math.max(0, Math.min(1000, pt.x + dx * speed)),
            y: Math.max(0, Math.min(1000, pt.y + dy * speed))
          }
        };
      });
  }, []);

  const startNudge = (dx: number, dy: number) => {
      nudge(dx, dy); // Initial move
      // Delay before continuous
      setTimeout(() => {
          if (nudgeInterval.current) return; 
          nudgeInterval.current = setInterval(() => nudge(dx, dy), 50);
      }, 300);
  };

  const stopNudge = () => {
      if (nudgeInterval.current) {
          clearInterval(nudgeInterval.current);
          nudgeInterval.current = null;
      }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key === 'ArrowUp') startNudge(0, -1);
      if (e.key === 'ArrowDown') startNudge(0, 1);
      if (e.key === 'ArrowLeft') startNudge(-1, 0);
      if (e.key === 'ArrowRight') startNudge(1, 0);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
       if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
           stopNudge();
       }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      stopNudge();
    };
  }, [nudge]);

  // Helper to clamp translation
  const getClampedTransform = (tx: number, ty: number, k: number, w: number, h: number, containerW: number, containerH: number) => {
    const cx = containerW / 2;
    const cy = containerH / 2;
    
    // Allow panning a bit past edges so points near edge can be centered
    // Margin of 50% screen size
    const marginX = containerW * 0.5;
    const marginY = containerH * 0.5;

    const minTx = cx - w * k + marginX; // Right edge in
    const maxTx = cx - marginX;         // Left edge in

    const minTy = cy - h * k + marginY;
    const maxTy = cy - marginY;

    // If image is smaller than container, center it
    if (w * k < containerW) return { x: (containerW - w * k) / 2, y: (containerH - h * k) / 2, k };

    return {
      x: tx, 
      y: ty,
      k
    };
  };

  // Initialize
  const onImageLoad = (w: number, h: number) => {
    if (w === imgDim.w && h === imgDim.h) return;
    setImgDim({ w, h });
    centerOnLandmark(activeKey, w, h, 2.5); // Initial zoom
  };

  useEffect(() => {
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
        onImageLoad(imgRef.current.naturalWidth, imgRef.current.naturalHeight);
    }
  }, []);

  // Center on Landmark Function
  const centerOnLandmark = (key: string, w: number, h: number, zoomLevel: number) => {
    if (!containerRef.current) return;
    
    const pt = landmarksRef.current[key];
    const rect = containerRef.current.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    const px = (pt.x / 1000) * w;
    const py = (pt.y / 1000) * h;

    const tx = cx - px * zoomLevel;
    const ty = cy - py * zoomLevel;

    setTransform({ x: tx, y: ty, k: zoomLevel });
  };

  // Auto-Center Effect when activeKey changes
  useEffect(() => {
    if (imgDim.w === 0) return;
    
    // Determine Zoom Level:
    // If we are zoomed out (< 1.5), zoom in to 3x.
    // If we are already zoomed in, keep current zoom, just pan.
    const targetZoom = Math.max(transform.k, 3);
    centerOnLandmark(activeKey, imgDim.w, imgDim.h, targetZoom);
  }, [activeKey]);

  // Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag if not clicking a button
    if ((e.target as HTMLElement).tagName === 'BUTTON') return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setStartTransform({ x: transform.x, y: transform.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current || imgDim.w === 0) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setTransform({ ...transform, x: startTransform.x + dx, y: startTransform.y + dy });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Zoom towards Center
  const handleZoom = (factor: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 2;

      const newK = Math.max(0.5, Math.min(15, transform.k * factor));
      
      // Maintain center point
      const pCx = (cx - transform.x) / transform.k;
      const pCy = (cy - transform.y) / transform.k;
      
      const rawTx = cx - pCx * newK;
      const rawTy = cy - pCy * newK;

      setTransform({ x: rawTx, y: rawTy, k: newK });
  };

  // Calculate center point based on current transform
  const getCenterPoint = useCallback(() => {
    if (!containerRef.current || imgDim.w === 0 || imgDim.h === 0) return null;

    const rect = containerRef.current.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    // Inverse transform to find point under center
    // Screen = Img * k + t  =>  Img = (Screen - t) / k
    const imgX = (cx - transform.x) / transform.k;
    const imgY = (cy - transform.y) / transform.k;

    // Convert to relative 0-1000 scale
    const x = (imgX / imgDim.w) * 1000;
    const y = (imgY / imgDim.h) * 1000;

    return { x, y };
  }, [transform, imgDim]);

  const saveCurrentPosition = () => {
    const pt = getCenterPoint();
    if (pt) {
        setLandmarks(prev => ({
            ...prev,
            [activeKey]: pt
        }));
    }
  };

  const handleNext = () => {
      saveCurrentPosition();
      if (currentIndex < keys.length - 1) {
          setActiveKey(keys[currentIndex + 1]);
      } else {
          // For the last item, we need to ensure state is updated before completing
          // But setLandmarks is async. So we calculate it directly for the onComplete callback
          const pt = getCenterPoint();
          const finalLandmarks = { ...landmarks };
          if (pt) finalLandmarks[activeKey] = pt;
          
          onComplete(finalLandmarks);
      }
  };

  const handlePrev = () => {
      saveCurrentPosition();
      if (currentIndex > 0) setActiveKey(keys[currentIndex - 1]);
  };

  const progress = Math.round(((currentIndex + 1) / keys.length) * 100);

  // Nudge Button Component
  const NudgeButton = ({ dir, label }: { dir: 'up'|'down'|'left'|'right', label: string }) => {
      const getHandlers = () => {
          let dx=0, dy=0;
          if (dir === 'up') dy = -1;
          if (dir === 'down') dy = 1;
          if (dir === 'left') dx = -1;
          if (dir === 'right') dx = 1;
          return {
              onMouseDown: (e: any) => { e.preventDefault(); e.stopPropagation(); startNudge(dx, dy); },
              onMouseUp: stopNudge,
              onMouseLeave: stopNudge,
              onTouchStart: (e: any) => { e.preventDefault(); e.stopPropagation(); startNudge(dx, dy); },
              onTouchEnd: stopNudge
          };
      };

      const rotation = {
          up: 'rotate-0',
          down: 'rotate-180',
          left: '-rotate-90',
          right: 'rotate-90'
      }[dir];

      return (
        <button 
           {...getHandlers()}
           className="w-12 h-12 bg-white/90 backdrop-blur shadow-lg rounded-xl flex items-center justify-center active:bg-blue-50 active:scale-95 transition-all border border-slate-200"
           aria-label={label}
        >
           <svg className={`w-6 h-6 text-slate-700 ${rotation}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
           </svg>
        </button>
      );
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white overflow-hidden select-none">
      {/* Top Bar */}
      <div className="flex-none p-4 bg-slate-800 border-b border-slate-700 z-20 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-bold">{title}</h2>
            <p className="text-xs text-slate-400">Step {currentIndex + 1} of {keys.length}</p>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs font-bold text-blue-400 mb-1">{progress}%</span>
            <div className="w-32 h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between bg-slate-700/50 p-3 rounded-lg border border-slate-600 backdrop-blur-sm">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold shadow-lg ring-2 ring-blue-500/30">
                 {currentIndex + 1}
              </div>
              <div className="flex flex-col">
                 <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Aligning</span>
                 <span className="text-lg font-bold text-white">{activeLabel}</span>
              </div>
           </div>
           <div className="flex gap-2">
              <Button variant="secondary" onClick={handlePrev} disabled={currentIndex === 0} className="text-xs py-2 px-4 h-10">Back</Button>
              <Button onClick={handleNext} className="text-xs py-2 px-6 h-10 bg-blue-600 hover:bg-blue-500">
                  {currentIndex === keys.length - 1 ? "Finish" : "Next Point"}
              </Button>
           </div>
        </div>
      </div>

      {/* Main Viewport */}
      <div className="flex-1 relative bg-black overflow-hidden cursor-move">
         <div 
            ref={containerRef}
            className="w-full h-full relative touch-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
         >
            {/* Image Layer */}
            <div 
                style={{
                    transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})`,
                    transformOrigin: '0 0',
                    willChange: 'transform'
                }}
                className="absolute top-0 left-0"
            >
                <img 
                   ref={imgRef}
                   src={photoUrl} 
                   onLoad={(e) => onImageLoad(e.currentTarget.naturalWidth, e.currentTarget.naturalHeight)}
                   className="block pointer-events-none select-none"
                   alt="Analysis Subject"
                   draggable={false}
                   style={{ maxWidth: 'none', display: 'block' }} 
                />
                
                {/* Confirmed Points - Only show landmarks UP TO the current index */}
                {keys.map((key, idx) => {
                    // Only show points for steps we have already passed (idx < currentIndex)
                    // The current step (idx === currentIndex) is handled by the red crosshair
                    // Future steps (idx > currentIndex) should be hidden
                    if (idx >= currentIndex) return null; 
                    
                    const pt = landmarks[key];
                    return (
                        <div 
                            key={key}
                            className="absolute w-3 h-3 bg-green-500 rounded-full z-10 shadow-sm border border-black/30"
                            style={{
                                left: (pt.x / 1000) * imgDim.w,
                                top: (pt.y / 1000) * imgDim.h,
                                transform: `translate(-50%, -50%) scale(${1/transform.k})`
                            }}
                        />
                    );
                })}
            </div>

            {/* Static UI Layer - Precision Crosshair */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50 flex flex-col items-center justify-center">
                 <div className="relative flex items-center justify-center">
                      <div className="absolute w-[1px] h-[100px] bg-red-500/80 shadow-[0_0_2px_rgba(0,0,0,0.8)]"></div>
                      <div className="absolute h-[1px] w-[100px] bg-red-500/80 shadow-[0_0_2px_rgba(0,0,0,0.8)]"></div>
                      <div className="w-2 h-2 bg-red-600 rounded-full border border-white/80 shadow-md z-10"></div>
                 </div>
            </div>
            
            <div className="absolute top-6 w-full px-4 text-center pointer-events-none z-40 flex flex-col items-center gap-2">
                 <span className="bg-blue-900/80 text-blue-100 text-xs px-3 py-1.5 rounded-lg backdrop-blur-md border border-blue-500/30 shadow-lg max-w-sm">
                    ℹ️ {activeInstruction}
                 </span>
            </div>

            {/* Nudge Controls (Mobile Dial) */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-50">
               <NudgeButton dir="up" label="Move Up" />
               <div className="flex gap-12">
                   <NudgeButton dir="left" label="Move Left" />
                   <NudgeButton dir="right" label="Move Right" />
               </div>
               <NudgeButton dir="down" label="Move Down" />
            </div>

         </div>

         {/* Zoom Controls */}
         <div className="absolute bottom-8 right-8 flex flex-col gap-3 z-50">
             <Button variant="secondary" onClick={() => handleZoom(1.5)} className="w-12 h-12 rounded-full p-0 flex items-center justify-center text-xl shadow-xl bg-slate-800 text-white border-slate-700 hover:bg-slate-700 hover:scale-105 active:scale-95 transition-transform">+</Button>
             <Button variant="secondary" onClick={() => handleZoom(1/1.5)} className="w-12 h-12 rounded-full p-0 flex items-center justify-center text-xl shadow-xl bg-slate-800 text-white border-slate-700 hover:bg-slate-700 hover:scale-105 active:scale-95 transition-transform">-</Button>
         </div>
      </div>
    </div>
  );
};


import React, { useState, useEffect, useRef, useCallback } from 'react';
import './dashboard/dashboard.css';
import { Point } from '../types';
import { FRONT_LANDMARK_DEFINITIONS, SIDE_LANDMARK_DEFINITIONS, LANDMARK_REFERENCE_IMAGES } from '../constants';
import { ReferenceImageViewer } from './ReferenceImageViewer';
import { Info } from 'lucide-react';

interface LandmarkEditorProps {
  photoUrl: string;
  initialLandmarks: Record<string, Point>;
  faceBox: { ymin: number, xmin: number, ymax: number, xmax: number };
  onComplete: (landmarks: Record<string, Point>) => void;
  /** Called each time the user moves between points, with the landmarks so far and the index they are now on. */
  onProgress?: (landmarks: Record<string, Point>, index: number) => void;
  /** Which point to start on (used to resume a half-finished session). */
  initialIndex?: number;
  /** When given, the header shows an "Exit" button that calls it. */
  onExit?: () => void;
  title: string;
  landmarkType: 'front' | 'side';
}

export const LandmarkEditor: React.FC<LandmarkEditorProps> = ({
  photoUrl,
  initialLandmarks,
  faceBox,
  onComplete,
  onProgress,
  initialIndex = 0,
  onExit,
  title,
  landmarkType
}) => {
  const [landmarks, setLandmarks] = useState<Record<string, Point>>(initialLandmarks);
  const [activeKey, setActiveKey] = useState<string>(() => {
    const all = Object.keys(initialLandmarks);
    return all[Math.min(Math.max(Math.floor(initialIndex) || 0, 0), all.length - 1)];
  });
  const [showReference, setShowReference] = useState(false);
  
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
  const currentDef = definition; // Alias for clarity
  const activeLabel = definition ? definition.name : activeKey;
  const activeInstruction = definition ? definition.howToFind : "Adjust point location";

  // --- ARROW KEY & NUDGE LOGIC (DETERMINISTIC) ---
  const STOP_EVENT = (e: any) => {
      e.preventDefault();
      e.stopPropagation();
  };

  const nudgeStep = useCallback((dx: number, dy: number) => {
      if (!imgDim.w || !imgDim.h) return;

      // 2px precision
      const STEP_PX = 2; 
      
      const key = activeKeyRef.current;
      
      // Convert pixel movement → normalized (0–1000)
      // Landmarks are 0-1000
      const stepX = (STEP_PX / imgDim.w) * 1000;
      const stepY = (STEP_PX / imgDim.h) * 1000;

      // Also account for zoom? If we want visual pixel steps...
      // The user asked for "2px in image space", so zoom doesn't affect the size of the step in the image
      // Correct.
      
      // Speed multiplier for holding shift? Maybe later.
      
      setLandmarks(prev => {
        const pt = prev[key];
        return {
          ...prev,
          [key]: {
            x: Math.max(0, Math.min(1000, pt.x + dx * stepX)),
            y: Math.max(0, Math.min(1000, pt.y + dy * stepY)),
          }
        };
      });

      // Visual feedback pan (inverse pan)
      const k = transformRef.current.k;
      setTransform(prev => ({
        ...prev,
        x: prev.x - dx * STEP_PX * k, 
        y: prev.y - dy * STEP_PX * k
      }));
  }, [imgDim]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Map keys to direction vectors
      const map: Record<string, [number, number]> = {
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
      };

      if (!(e.key in map)) return;

      e.preventDefault(); 
      // e.repeat is handled naturally by the OS firing repeated keydown events

      const [dx, dy] = map[e.key];
      nudgeStep(dx, dy); // 🔥 ONE press = ONE move
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nudgeStep]);

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

  // No need to stop nudge on activeKey change anymore since there are no intervals
  
  const saveCurrentPosition = () => {
    const pt = getCenterPoint();
    if (pt) {
        setLandmarks(prev => ({
            ...prev,
            [activeKey]: pt
        }));
    }
  };

  // Landmarks including the point being placed right now (state updates are async, so build it directly).
  const withCurrentPosition = () => {
      const pt = getCenterPoint();
      return pt ? { ...landmarks, [activeKey]: pt } : landmarks;
  };

  const handleNext = () => {
      saveCurrentPosition();
      if (currentIndex < keys.length - 1) {
          setActiveKey(keys[currentIndex + 1]);
          onProgress?.(withCurrentPosition(), currentIndex + 1);
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
      if (currentIndex > 0) {
          setActiveKey(keys[currentIndex - 1]);
          onProgress?.(withCurrentPosition(), currentIndex - 1);
      }
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
          
          // Simple, deterministic handlers
          // ONE press = ONE move
          const handler = (e: any) => {
              if (e.cancelable) e.preventDefault();
              e.stopPropagation();
              nudgeStep(dx, dy);
          };

          return {
              onMouseDown: handler,
              onTouchStart: handler,
              onContextMenu: (e: any) => e.preventDefault()
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
           className="flex h-12 w-12 touch-none select-none items-center justify-center rounded-xl border border-[var(--d-line2)] bg-[rgba(17,20,29,0.88)] text-[var(--d-t1)] backdrop-blur transition-[background-color,transform] duration-150 hover:bg-[var(--d-s3)] active:scale-95"
           aria-label={label}
           style={{ touchAction: 'none' }} // Force browser to ignore native gestures
        >
           <svg className={`h-5 w-5 ${rotation}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M5 15l7-7 7 7" />
           </svg>
        </button>
      );
  };

  return (
    <div className="dash flex h-full flex-col overflow-hidden select-none !min-h-0">
        {/* Header */}
        <div className="z-50 flex items-center justify-between gap-4 border-b border-[var(--d-line)] bg-[rgba(7,8,13,0.92)] px-5 py-3.5 backdrop-blur-xl sm:px-6">
          <div className="min-w-0">
            <p className="d-eyebrow">{title}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
              <h2 className="truncate text-[17px] font-semibold tracking-[-0.02em]">{currentDef.name}</h2>
              <span className="d-mono text-[12px] text-[var(--d-t3)]">
                {currentIndex + 1} / {keys.length}
              </span>
              {/* Info Icon Button */}
              {LANDMARK_REFERENCE_IMAGES[activeKey] && (
                <button
                  onClick={() => setShowReference(true)}
                  className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-[var(--d-accent-line)] bg-[var(--d-accent-soft)] px-2.5 text-[12px] font-medium text-[var(--d-accent)] transition-colors hover:border-[var(--d-accent)]"
                  aria-label="View reference image"
                >
                  <Info className="h-3.5 w-3.5" strokeWidth={1.75} />
                  See example
                </button>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <div className="hidden flex-col items-end sm:flex">
              <span className="d-mono mb-1.5 text-[11px] text-[var(--d-accent)]">{progress}%</span>
              <div className="h-[3px] w-32 overflow-hidden rounded-full bg-[var(--d-s3)]">
                <div className="h-full rounded-full bg-[var(--d-accent)] transition-[width] duration-300 ease-out" style={{ width: `${progress}%` }} />
              </div>
            </div>
            {onExit && (
              <button onClick={onExit} className="d-btn d-btn-ghost d-btn-sm !px-3.5 text-[var(--d-t2)]">
                Exit
              </button>
            )}
          </div>
        </div>

      {/* Control Bar */}
      <div className="z-20 flex-none border-b border-[var(--d-line)] bg-[var(--d-s1)] px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
           <div className="flex min-w-0 items-center gap-4">
              <div className="d-mono grid h-10 w-10 shrink-0 place-items-center rounded-[10px] border border-[var(--d-accent-line)] bg-[var(--d-accent-soft)] text-[14px] font-semibold text-[var(--d-accent)]">
                 {currentIndex + 1}
              </div>
              <div className="min-w-0">
                 <span className="d-eyebrow block">Placing</span>
                 <span className="mt-1.5 block truncate text-[16px] font-medium tracking-[-0.01em]">{activeLabel}</span>
              </div>
           </div>
           <div className="flex shrink-0 gap-2">
              <button onClick={handlePrev} disabled={currentIndex === 0} className="d-btn d-btn-ghost d-btn-sm !px-4 disabled:opacity-40">Back</button>
              <button onClick={handleNext} className="d-btn d-btn-primary d-btn-sm !px-5">
                  {currentIndex === keys.length - 1 ? "Finish" : "Next point"}
              </button>
           </div>
        </div>
      </div>

      {/* Main Viewport */}
      <div className="relative flex-1 cursor-move overflow-hidden bg-black">
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
                 <span className="max-w-sm rounded-xl border border-[var(--d-line2)] bg-[rgba(7,8,13,0.82)] px-3.5 py-2 text-[12.5px] leading-snug text-[var(--d-t1)] backdrop-blur-md">
                    {activeInstruction}
                 </span>
            </div>

            {/* Nudge Controls (Mobile Dial) - Moved up on mobile for better accessibility */}
            <div className="absolute bottom-28 md:bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-50 touch-none">
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
             <button aria-label="Zoom in" onClick={() => handleZoom(1.5)} className="grid h-12 w-12 place-items-center rounded-full border border-[var(--d-line2)] bg-[rgba(17,20,29,0.88)] text-xl text-[var(--d-t1)] backdrop-blur transition-[background-color,transform] duration-150 hover:bg-[var(--d-s3)] active:scale-95">+</button>
             <button aria-label="Zoom out" onClick={() => handleZoom(1/1.5)} className="grid h-12 w-12 place-items-center rounded-full border border-[var(--d-line2)] bg-[rgba(17,20,29,0.88)] text-xl text-[var(--d-t1)] backdrop-blur transition-[background-color,transform] duration-150 hover:bg-[var(--d-s3)] active:scale-95">&minus;</button>
         </div>
      </div>

      {/* Reference Image Viewer */}
      <ReferenceImageViewer
        landmarkKey={activeKey}
        landmarkName={currentDef.name}
        isOpen={showReference}
        onClose={() => setShowReference(false)}
      />
    </div>
  );
};

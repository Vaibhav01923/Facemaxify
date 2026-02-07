
import React, { useRef, useState, useEffect } from 'react';
import { Point } from '../types';

interface FaceOverlayProps {
  photoUrl: string;
  landmarks: Record<string, Point>;
  highlightedLandmarks?: string[];
  metricName?: string;
}

export const FaceOverlay: React.FC<FaceOverlayProps> = ({ 
  photoUrl, 
  landmarks, 
  highlightedLandmarks = [],
  metricName
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [overlayStyle, setOverlayStyle] = useState<React.CSSProperties>({
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%'
  });

  const updateOverlayPosition = () => {
      const container = containerRef.current;
      const img = imgRef.current;
      if (!container || !img) return;

      const cW = container.clientWidth;
      const cH = container.clientHeight;
      const iW = img.naturalWidth;
      const iH = img.naturalHeight;

      if (!iW || !iH) return;

      const scale = Math.min(cW / iW, cH / iH);
      const renderedW = iW * scale;
      const renderedH = iH * scale;
      const left = (cW - renderedW) / 2;
      const top = (cH - renderedH) / 2;

      setOverlayStyle({
          position: 'absolute',
          left: left,
          top: top,
          width: renderedW,
          height: renderedH,
          pointerEvents: 'none'
      });
  };

  useEffect(() => {
      window.addEventListener('resize', updateOverlayPosition);
      return () => window.removeEventListener('resize', updateOverlayPosition);
  }, []);

  const getPt = (key: string) => {
    const pt = landmarks[key];
    if (!pt) return null;
    return { x: pt.x / 10, y: pt.y / 10 };
  };

  const renderLines = () => {
    if (highlightedLandmarks.length === 0) return null;

    // --- Lower Lip to Upper Lip Ratio ---
    if (metricName === "Lower Lip to Upper Lip Ratio") {
        const upper = getPt('cupidsBow');
        const middle = getPt('mouthMiddle');
        const lower = getPt('lowerLip');

        if (upper && middle && lower) {
             const ratio = (Math.abs(lower.y - middle.y) / Math.abs(middle.y - upper.y)).toFixed(2);
             const offsetX = 5; 
             return (
                <>
                    <line x1={middle.x + offsetX} y1={upper.y} x2={middle.x + offsetX} y2={middle.y} stroke="white" strokeWidth="1.2" />
                    <line x1={middle.x + offsetX - 1.5} y1={upper.y} x2={middle.x + offsetX + 1.5} y2={upper.y} stroke="white" strokeWidth="1" />
                    <line x1={middle.x + offsetX - 1.5} y1={middle.y} x2={middle.x + offsetX + 1.5} y2={middle.y} stroke="white" strokeWidth="1" />
                    <line x1={middle.x} y1={middle.y} x2={middle.x} y2={lower.y} stroke="#22d3ee" strokeWidth="1.2" />
                    <line x1={middle.x - 1.5} y1={lower.y} x2={middle.x + 1.5} y2={lower.y} stroke="#22d3ee" strokeWidth="1" />
                    <g transform={`translate(${middle.x}, ${(middle.y + lower.y) / 2})`}>
                       <rect x="-6" y="-2" width="12" height="4" rx="1" fill="rgba(0,0,0,0.6)" />
                       <text x="0" y="1" fill="#22d3ee" fontSize="2.5" fontWeight="bold" textAnchor="middle">{ratio}x</text>
                    </g>
                    <circle cx={middle.x + offsetX} cy={upper.y} r="0.4" fill="white" />
                    <circle cx={middle.x} cy={middle.y} r="0.4" fill="#22d3ee" />
                    <circle cx={middle.x} cy={lower.y} r="0.4" fill="#22d3ee" />
                </>
             );
        }
    }

    // --- Total Facial Width to Height Ratio (Uses H/W visual) ---
    if (metricName === "Total Facial Width to Height Ratio") {
        const lCheek = getPt('leftCheek');
        const rCheek = getPt('rightCheek');
        const hairline = getPt('hairline');
        const chin = getPt('chinBottom');

        if (lCheek && rCheek && hairline && chin) {
            const midX = (lCheek.x + rCheek.x) / 2;
            return (
                <>
                    <line x1={lCheek.x} y1={lCheek.y} x2={rCheek.x} y2={rCheek.y} stroke="#22d3ee" strokeWidth="1.2" strokeLinecap="round" />
                    <line x1={midX} y1={hairline.y} x2={midX} y2={chin.y} stroke="#22d3ee" strokeWidth="1.2" strokeLinecap="round" />
                    <circle cx={lCheek.x} cy={lCheek.y} r="0.8" fill="#22d3ee" />
                    <circle cx={rCheek.x} cy={rCheek.y} r="0.8" fill="#22d3ee" />
                    <circle cx={midX} cy={hairline.y} r="0.8" fill="#22d3ee" />
                    <circle cx={midX} cy={chin.y} r="0.8" fill="#22d3ee" />
                </>
            );
        }
    }

    // --- Face Width to Height Ratio ---
    if (metricName === "Face Width to Height Ratio") {
        const lCheek = getPt('leftCheek');
        const rCheek = getPt('rightCheek');
        const lBrow = getPt('leftBrowHead');
        const rBrow = getPt('rightBrowHead');
        const mouth = getPt('mouthMiddle');

        if (lCheek && rCheek && mouth) {
            const midX = (lCheek.x + rCheek.x) / 2;
            let browY = 0;
            if (lBrow && rBrow) browY = (lBrow.y + rBrow.y) / 2;
            
            return (
                <>
                    <line x1={lCheek.x} y1={lCheek.y} x2={rCheek.x} y2={rCheek.y} stroke="#22d3ee" strokeWidth="1.2" />
                    <line x1={midX} y1={browY} x2={midX} y2={mouth.y} stroke="#22d3ee" strokeWidth="1.2" />
                    <circle cx={midX} cy={browY} r="0.8" fill="#22d3ee" />
                    <circle cx={midX} cy={mouth.y} r="0.8" fill="#22d3ee" />
                </>
            );
        }
    }

    // --- Thirds ---
    if (["Top Third", "Middle Third", "Lower Third", "Upper Third", "Lower Third Proportion"].includes(metricName || "")) {
        let y1 = 0;
        let y2 = 0;
        let x = 50;
        let ready = false;
        
        const nasion = getPt('nasion') || getPt('noseBottom'); 
        if(nasion) x = nasion.x;

        if (metricName === "Top Third" || metricName === "Upper Third") {
            const hairline = getPt('hairline');
            const lBrow = getPt('leftBrowInnerCorner');
            if (hairline && lBrow) {
                y1 = hairline.y;
                y2 = lBrow.y;
                x = hairline.x;
                ready = true;
            }
        } 
        else if (metricName === "Middle Third") {
            const nose = getPt('noseBottom');
            const lBrow = getPt('leftBrowInnerCorner');
            if (lBrow && nose) {
                y1 = lBrow.y;
                y2 = nose.y;
                if(nasion) x = nasion.x;
                ready = true;
            }
        } 
        else if (metricName === "Lower Third" || metricName === "Lower Third Proportion") {
            const nose = getPt('noseBottom');
            const chin = getPt('chinBottom');
            if (nose && chin) {
                y1 = nose.y;
                y2 = chin.y;
                x = nose.x;
                ready = true;
            }
        }

        if (ready) {
             return (
                <>
                    <line x1={x - 12} y1={y1} x2={x + 12} y2={y1} stroke="white" strokeWidth="0.8" strokeDasharray="2,2" />
                    <line x1={x - 12} y1={y2} x2={x + 12} y2={y2} stroke="white" strokeWidth="0.8" strokeDasharray="2,2" />
                    <line x1={x} y1={y1} x2={x} y2={y2} stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx={x} cy={y1} r="0.8" fill="#22d3ee" />
                    <circle cx={x} cy={y2} r="0.8" fill="#22d3ee" />
                </>
             );
        }
    }

    // --- One Eye Apart Test (EYE SPACING) ---
    if (metricName === "One Eye Apart Test") {
        const lIn = getPt('leftEyeMedialCanthus');
        const lOut = getPt('leftEyeLateralCanthus');
        const rIn = getPt('rightEyeMedialCanthus');
        const rOut = getPt('rightEyeLateralCanthus');

        if (lIn && lOut && rIn && rOut) {
            const avgEyeW = (Math.abs(lOut.x - lIn.x) + Math.abs(rOut.x - rIn.x)) / 2;
            const gap = Math.abs(rIn.x - lIn.x);
            const gapRatio = (gap / avgEyeW).toFixed(2);
            const midY = (lIn.y + lOut.y + rIn.y + rOut.y) / 4;

            return (
                <>
                    {/* Left Eye Width */}
                    <line x1={lOut.x} y1={lOut.y} x2={lIn.x} y2={lIn.y} stroke="white" strokeWidth="0.8" />
                    <line x1={lOut.x} y1={lOut.y - 1} x2={lOut.x} y2={lOut.y + 1} stroke="white" strokeWidth="0.5" />
                    <line x1={lIn.x} y1={lIn.y - 1} x2={lIn.x} y2={lIn.y + 1} stroke="white" strokeWidth="0.5" />

                    {/* Gap (Intercanthal) */}
                    <line x1={lIn.x} y1={midY} x2={rIn.x} y2={midY} stroke="#22d3ee" strokeWidth="1" />
                    <line x1={lIn.x} y1={midY - 1.5} x2={lIn.x} y2={midY + 1.5} stroke="#22d3ee" strokeWidth="0.8" />
                    <line x1={rIn.x} y1={midY - 1.5} x2={rIn.x} y2={midY + 1.5} stroke="#22d3ee" strokeWidth="0.8" />

                    {/* Right Eye Width */}
                    <line x1={rIn.x} y1={rIn.y} x2={rOut.x} y2={rOut.y} stroke="white" strokeWidth="0.8" />
                    <line x1={rIn.x} y1={rIn.y - 1} x2={rIn.x} y2={rIn.y + 1} stroke="white" strokeWidth="0.5" />
                    <line x1={rOut.x} y1={rOut.y - 1} x2={rOut.x} y2={rOut.y + 1} stroke="white" strokeWidth="0.5" />

                    {/* Label for Gap */}
                    <g transform={`translate(${(lIn.x + rIn.x) / 2}, ${midY + 4})`}>
                        <rect x="-6" y="-2" width="12" height="4" rx="1" fill="rgba(0,0,0,0.6)" />
                        <text x="0" y="1" fill="#22d3ee" fontSize="2.8" fontWeight="bold" textAnchor="middle">{gapRatio}x</text>
                    </g>
                </>
            );
        }
    }

    // --- Chin to Philtrum Ratio ---

    // --- Width Comparisons ---
    if (["Bigonial Width", "Bitemporal Width", "Eye Separation Ratio"].includes(metricName || "")) {
        const lCheek = getPt('leftCheek');
        const rCheek = getPt('rightCheek');
        let p1: {x:number, y:number}|null = null;
        let p2: {x:number, y:number}|null = null;
        let label = "Target";

        if (metricName === "Bigonial Width") {
             p1 = getPt('leftBottomGonion');
             p2 = getPt('rightBottomGonion');
             label = "Jaw";
        } else if (metricName === "Eye Separation Ratio") {
             p1 = getPt('leftEyePupil');
             p2 = getPt('rightEyePupil');
             label = "Eyes";
        }

        if (lCheek && rCheek && p1 && p2) {
            return (
                <>
                    <line x1={lCheek.x} y1={lCheek.y} x2={rCheek.x} y2={rCheek.y} stroke="#3b82f6" strokeWidth="0.8" opacity="0.6" strokeDasharray="4,2" />
                    <text x={rCheek.x + 2} y={rCheek.y} fill="#3b82f6" fontSize="2.5" opacity="0.8">Cheek</text>
                    <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#22d3ee" strokeWidth="1.5" />
                    <text x={p2.x + 2} y={p2.y} fill="#22d3ee" fontSize="2.5" fontWeight="bold">{label}</text>
                </>
            );
        }
    }

    // --- Midface Ratio ---
    if (metricName === "Midface Ratio") {
        const lPupil = getPt('leftEyePupil');
        const rPupil = getPt('rightEyePupil');
        const lip = getPt('cupidsBow');
        if (lPupil && rPupil && lip) {
            const midX = (lPupil.x + rPupil.x) / 2;
            const midY = (lPupil.y + rPupil.y) / 2;
            return (
                <>
                    <line x1={lPupil.x} y1={lPupil.y} x2={rPupil.x} y2={rPupil.y} stroke="#22d3ee" strokeWidth="1.2" strokeLinecap="round" />
                    <line x1={midX} y1={midY} x2={midX} y2={lip.y} stroke="#22d3ee" strokeWidth="1.2" strokeLinecap="round" />
                    <circle cx={midX} cy={midY} r="0.6" fill="#22d3ee" />
                </>
            );
        }
    }

    // --- Cheekbone Height (FIXED VISUALIZATION) ---
    if (metricName === "Cheekbone Height") {
        const lPupil = getPt('leftEyePupil');
        const rPupil = getPt('rightEyePupil');
        const lCheek = getPt('leftCheek');
        const rCheek = getPt('rightCheek');
        const mouth = getPt('mouthMiddle');

        if (lPupil && rPupil && lCheek && rCheek && mouth) {
            const centerX = mouth.x;
            const eyeY = (lPupil.y + rPupil.y) / 2;
            const cheekY = (lCheek.y + rCheek.y) / 2;
            const mouthY = mouth.y;

            // Distances for percentages
            const totalH = Math.abs(mouthY - eyeY);
            const topH = Math.abs(cheekY - eyeY);
            const bottomH = Math.abs(mouthY - cheekY);
            
            // Calculate percentages
            const topPct = ((topH / totalH) * 100).toFixed(1);
            const bottomPct = ((bottomH / totalH) * 100).toFixed(1);

            return (
                <>
                    {/* Horizontal Eye Line (Dotted) */}
                    <line x1={lPupil.x - 20} y1={eyeY} x2={rPupil.x + 20} y2={eyeY} stroke="white" strokeWidth="0.8" strokeDasharray="3,3" opacity="0.8" />
                    
                    {/* Top Segment (Eye to Cheek) - White Dotted */}
                    <line x1={centerX} y1={eyeY} x2={centerX} y2={cheekY} stroke="white" strokeWidth="1.5" strokeDasharray="3,3" />
                    
                    {/* Bottom Segment (Cheek to Mouth) - Blue Solid */}
                    <line x1={centerX} y1={cheekY} x2={centerX} y2={mouthY} stroke="#22d3ee" strokeWidth="2" />
                    
                    {/* Cheek Level Marker */}
                    <line x1={centerX - 5} y1={cheekY} x2={centerX + 5} y2={cheekY} stroke="#22d3ee" strokeWidth="2" />
                    <circle cx={centerX} cy={cheekY} r="1" fill="#22d3ee" />

                    {/* Labels */}
                    <g transform={`translate(${centerX + 6}, ${eyeY + (topH/2)})`}>
                         <rect x="-1" y="-2" width="14" height="4" fill="rgba(0,0,0,0.5)" rx="1"/>
                         <text x="0" y="1" fill="white" fontSize="2.8" fontWeight="bold">{topPct}%</text>
                    </g>
                    <g transform={`translate(${centerX + 6}, ${cheekY + (bottomH/2)})`}>
                         <rect x="-1" y="-2" width="14" height="4" fill="rgba(0,0,0,0.5)" rx="1"/>
                         <text x="0" y="1" fill="#22d3ee" fontSize="2.8" fontWeight="bold">{bottomPct}%</text>
                    </g>

                    {/* Checkmarks on Cheeks */}
                    <circle cx={lCheek.x} cy={lCheek.y} r="0.8" fill="#22d3ee" opacity="0.6"/>
                    <circle cx={rCheek.x} cy={rCheek.y} r="0.8" fill="#22d3ee" opacity="0.6"/>
                </>
            );
        }
    }

    // --- Jaw Frontal Angle (Intersection Visual) ---
    if (metricName === "Jaw Frontal Angle") {
        const lBot = getPt('leftBottomGonion');
        const lChin = getPt('chinLeft');
        const rBot = getPt('rightBottomGonion');
        const rChin = getPt('chinRight');

        if (lBot && lChin && rBot && rChin) {
            // Calculate Intersection (in visual coordinates)
            const det = (lChin.x - lBot.x) * (rChin.y - rBot.y) - (rChin.x - rBot.x) * (lChin.y - lBot.y);
            let vertex = { x: (lChin.x + rChin.x) / 2, y: (lChin.y + rChin.y) / 2 }; // fallback

            if (det !== 0) {
                const lambda = ((rChin.y - rBot.y) * (rChin.x - lBot.x) + (rBot.x - rChin.x) * (rChin.y - lBot.y)) / det;
                vertex = {
                    x: lBot.x + lambda * (lChin.x - lBot.x),
                    y: lBot.y + lambda * (lChin.y - lBot.y)
                };
            }

            return (
                <>
                    {/* Jawline Extensions to Vertex */}
                    <line x1={lBot.x} y1={lBot.y} x2={vertex.x} y2={vertex.y} stroke="#22d3ee" strokeWidth="1" strokeLinecap="round" />
                    <line x1={rBot.x} y1={rBot.y} x2={vertex.x} y2={vertex.y} stroke="#22d3ee" strokeWidth="1" strokeLinecap="round" />

                    {/* Key Points */}
                    <circle cx={lBot.x} cy={lBot.y} r="0.8" fill="#22d3ee" />
                    <circle cx={rBot.x} cy={rBot.y} r="0.8" fill="#22d3ee" />
                    <circle cx={vertex.x} cy={vertex.y} r="1.2" fill="#22d3ee" stroke="white" strokeWidth="0.5" />

                    {/* Angle Arc at Vertex */}
                    <text x={vertex.x} y={vertex.y + 6} fill="white" fontSize="3" fontWeight="bold" textAnchor="middle">Angle</text>
                </>
            );
        }
    }

    // Fallback: Simple Connection
    if (highlightedLandmarks.length === 2) {
        const p1 = getPt(highlightedLandmarks[0]);
        const p2 = getPt(highlightedLandmarks[1]);
        if (!p1 || !p2) return null;
        return <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#3b82f6" strokeWidth="0.8" strokeLinecap="round" />;
    } else if (highlightedLandmarks.length > 2) {
         return highlightedLandmarks.map(key => {
             const p = getPt(key);
             if (!p) return null;
             return <circle key={key} cx={p.x} cy={p.y} r="0.6" fill="#3b82f6" />;
         });
    }

    // --- Jaw Slope (Cheek -> Top Gonion -> Side Chin) ---
    if (metricName === "Jaw Slope") {
        const lCheek = getPt('leftCheek');
        const lTop = getPt('leftTopGonion'); // Vertex
        const lChin = getPt('chinLeft');
        
        const rCheek = getPt('rightCheek');
        const rTop = getPt('rightTopGonion'); // Vertex
        const rChin = getPt('chinRight');

        // Helper to find point on line at specific distance
        const ptOnLine = (start: {x:number, y:number}, end: {x:number, y:number}, dist: number) => {
             const len = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
             const t = dist / (len || 1);
             return { x: start.x + (end.x - start.x) * t, y: start.y + (end.y - start.y) * t };
        };

        if (lCheek && lTop && lChin && rCheek && rTop && rChin) {
             // Calculate Arc Points (Distance 10% of viewbox for visibility)
             const lA = ptOnLine(lTop, lCheek, 8);
             const lB = ptOnLine(lTop, lChin, 8);
             
             const rA = ptOnLine(rTop, rCheek, 8);
             const rB = ptOnLine(rTop, rChin, 8);

             return (
                <>
                    {/* Left Side Lines */}
                    <line x1={lCheek.x} y1={lCheek.y} x2={lTop.x} y2={lTop.y} stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1={lTop.x} y1={lTop.y} x2={lChin.x} y2={lChin.y} stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" />
                    
                    {/* Left Points */}
                    <circle cx={lCheek.x} cy={lCheek.y} r="1" fill="#22d3ee" />
                    <circle cx={lTop.x} cy={lTop.y} r="1.5" fill="#22d3ee" stroke="white" strokeWidth="0.5" />
                    <circle cx={lChin.x} cy={lChin.y} r="1" fill="#22d3ee" />
                    
                    {/* Left Angle Arc (White) */}
                    <path d={`M ${lA.x} ${lA.y} Q ${lTop.x} ${lTop.y} ${lB.x} ${lB.y}`} stroke="white" strokeWidth="1.5" fill="none" />
                    <text x={lTop.x - 6} y={lTop.y} fill="white" fontSize="3" fontWeight="bold">Angle</text>

                    {/* Right Side Lines */}
                    <line x1={rCheek.x} y1={rCheek.y} x2={rTop.x} y2={rTop.y} stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1={rTop.x} y1={rTop.y} x2={rChin.x} y2={rChin.y} stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" />
                    
                    {/* Right Points */}
                    <circle cx={rCheek.x} cy={rCheek.y} r="1" fill="#22d3ee" />
                    <circle cx={rTop.x} cy={rTop.y} r="1.5" fill="#22d3ee" stroke="white" strokeWidth="0.5" />
                    <circle cx={rChin.x} cy={rChin.y} r="1" fill="#22d3ee" />

                    {/* Right Angle Arc (White) */}
                    <path d={`M ${rA.x} ${rA.y} Q ${rTop.x} ${rTop.y} ${rB.x} ${rB.y}`} stroke="white" strokeWidth="1.5" fill="none" />
                    <text x={rTop.x + 6} y={rTop.y} fill="white" fontSize="3" fontWeight="bold">Angle</text>
                </>
             );
        }
    }

    return null;
  };

  return (
    <div ref={containerRef} className="relative w-full h-full rounded-xl overflow-hidden bg-slate-900 shadow-inner group">
      <div className="absolute inset-0 bg-center bg-cover opacity-30 blur-xl scale-110" style={{ backgroundImage: `url(${photoUrl})` }}></div>
      <img ref={imgRef} src={photoUrl} className="relative w-full h-full object-contain z-10" alt="Analysis Subject" onLoad={updateOverlayPosition} />
      <svg style={overlayStyle} className="z-20" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="0.6" result="coloredBlur"/>
            <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        {/* Conditionally apply glow. Complex geometric metrics (Jaw Slope/Angle) are rendered without filter for maximum clarity on mobile */}
        { ["Jaw Slope", "Jaw Frontal Angle"].includes(metricName || "") ? (
             <g>{renderLines()}</g>
        ) : (
             <g filter="url(#glow)">{renderLines()}</g>
        )}
      </svg>
    </div>
  );
};

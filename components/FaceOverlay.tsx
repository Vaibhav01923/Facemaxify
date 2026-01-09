
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

    // --- Chin to Philtrum Ratio ---
    if (metricName === "Chin to Philtrum Ratio") {
        const chin = getPt('chinBottom');
        const lipLower = getPt('lowerLip');
        const lipUpper = getPt('cupidsBow');
        const nose = getPt('nasalBase');

        if (chin && lipLower && lipUpper && nose) {
            const midX = nose.x; 
            return (
                <>
                    <line x1={midX} y1={nose.y} x2={midX} y2={lipUpper.y} stroke="#22d3ee" strokeWidth="1.5" />
                    <line x1={midX} y1={lipLower.y} x2={midX} y2={chin.y} stroke="#3b82f6" strokeWidth="1.5" />
                    <text x={midX + 2} y={(nose.y + lipUpper.y)/2} fill="#22d3ee" fontSize="2.5" fontWeight="bold">Philtrum</text>
                    <text x={midX + 2} y={(lipLower.y + chin.y)/2} fill="#3b82f6" fontSize="2.5" fontWeight="bold">Chin</text>
                </>
            );
        }
    }

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
        <g filter="url(#glow)">{renderLines()}</g>
      </svg>
    </div>
  );
};

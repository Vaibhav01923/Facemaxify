
import React, { useRef, useState, useEffect } from 'react';
import { Point } from '../types';

interface FaceOverlayProps {
  photoUrl: string;
  landmarks: Record<string, Point>;
  highlightedLandmarks?: string[];
  metricName?: string;
  onPointClick?: (key: string) => void;
}

export const FaceOverlay: React.FC<FaceOverlayProps> = ({ 
  photoUrl, 
  landmarks, 
  highlightedLandmarks = [],
  metricName,
  onPointClick
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
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
          // pointerEvents: 'none'
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

  const renderInteractivePoint = (key: string, cx: number, cy: number, fill: string = "#22d3ee", r: number = 0.8) => {
      return (
          <circle 
            cx={cx} 
            cy={cy} 
            r={r + 0.5}
            fill={fill}
            className="cursor-pointer hover:opacity-80 transition-all pointer-events-auto hover:stroke-white hover:stroke-1"
            onClick={(e) => {
                e.stopPropagation();
                onPointClick?.(key);
            }}
          />
      );
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
                    <line x1={middle.x + offsetX} y1={upper.y} x2={middle.x + offsetX} y2={middle.y} stroke="white" strokeWidth="0.5" />
                    <line x1={middle.x + offsetX - 1.5} y1={upper.y} x2={middle.x + offsetX + 1.5} y2={upper.y} stroke="white" strokeWidth="0.5" />
                    <line x1={middle.x + offsetX - 1.5} y1={middle.y} x2={middle.x + offsetX + 1.5} y2={middle.y} stroke="white" strokeWidth="0.5" />
                    <line x1={middle.x} y1={middle.y} x2={middle.x} y2={lower.y} stroke="#22d3ee" strokeWidth="0.5" />
                    <line x1={middle.x - 1.5} y1={lower.y} x2={middle.x + 1.5} y2={lower.y} stroke="#22d3ee" strokeWidth="0.4" />
                    <g transform={`translate(${middle.x}, ${(middle.y + lower.y) / 2})`}>
                       <text x="0" y="1" fill="#22d3ee" fontSize="2.5" fontWeight="bold" textAnchor="middle">{ratio}x</text>
                    </g>
                    {renderInteractivePoint('cupidsBow', middle.x + offsetX, upper.y, "white", 0.3)}
                    {renderInteractivePoint('mouthMiddle', middle.x, middle.y, "#22d3ee", 0.3)}
                    {renderInteractivePoint('lowerLip', middle.x, lower.y, "#22d3ee", 0.3)}
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
                    <line x1={lCheek.x} y1={lCheek.y} x2={rCheek.x} y2={rCheek.y} stroke="#22d3ee" strokeWidth="0.6" strokeLinecap="round" />
                    <line x1={midX} y1={hairline.y} x2={midX} y2={chin.y} stroke="#22d3ee" strokeWidth="0.6" strokeLinecap="round" />
                    {renderInteractivePoint('leftCheek', lCheek.x, lCheek.y, "#22d3ee", 0.5)}
                    {renderInteractivePoint('rightCheek', rCheek.x, rCheek.y, "#22d3ee", 0.5)}
                    {renderInteractivePoint('hairline', midX, hairline.y, "#22d3ee", 0.5)}
                    {renderInteractivePoint('chinBottom', midX, chin.y, "#22d3ee", 0.5)}
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
                    <line x1={lCheek.x} y1={lCheek.y} x2={rCheek.x} y2={rCheek.y} stroke="#22d3ee" strokeWidth="0.6" />
                    <line x1={midX} y1={browY} x2={midX} y2={mouth.y} stroke="#22d3ee" strokeWidth="0.6" />
                    <circle cx={midX} cy={browY} r="0.5" fill="#22d3ee" /> {/* Derived point */}
                    <circle cx={midX} cy={mouth.y} r="0.5" fill="#22d3ee" /> {/* Derived point? Top and Bottom markers of Line. */}
                    {/* Actually, user might want to edit the inputs: cheeks, brows, mouth */}
                    {renderInteractivePoint('leftCheek', lCheek.x, lCheek.y, "#22d3ee00", 0.5)} {/* Hidden hit area? */}
                    {renderInteractivePoint('rightCheek', rCheek.x, rCheek.y, "#22d3ee00", 0.5)}
                    {/* The line is MidX. If we drag cheeks, MidX changes. */}
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
                    <line x1={x - 12} y1={y1} x2={x + 12} y2={y1} stroke="white" strokeWidth="0.5" strokeDasharray="2,2" />
                    <line x1={x - 12} y1={y2} x2={x + 12} y2={y2} stroke="white" strokeWidth="0.5" strokeDasharray="2,2" />
                    <line x1={x} y1={y1} x2={x} y2={y2} stroke="#22d3ee" strokeWidth="0.8" strokeLinecap="round" />
                    {/* Render active points. Need to identify which keys were used. */}
                    {metricName.includes("Top") && renderInteractivePoint('hairline', x, y1, "#22d3ee", 0.5)}
                    {metricName.includes("Top") && renderInteractivePoint('leftBrowInnerCorner', x, y2, "#22d3ee", 0.5)}
                    
                    {metricName === "Middle Third" && renderInteractivePoint('leftBrowInnerCorner', x, y1, "#22d3ee", 0.5)}
                    {metricName === "Middle Third" && renderInteractivePoint('noseBottom', x, y2, "#22d3ee", 0.5)}

                    {metricName.includes("Lower") && renderInteractivePoint('noseBottom', x, y1, "#22d3ee", 0.5)}
                    {metricName.includes("Lower") && renderInteractivePoint('chinBottom', x, y2, "#22d3ee", 0.5)}
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
                    <line x1={lOut.x} y1={lOut.y} x2={lIn.x} y2={lIn.y} stroke="white" strokeWidth="0.5" />
                    <line x1={lOut.x} y1={lOut.y - 1} x2={lOut.x} y2={lOut.y + 1} stroke="white" strokeWidth="0.4" />
                    <line x1={lIn.x} y1={lIn.y - 1} x2={lIn.x} y2={lIn.y + 1} stroke="white" strokeWidth="0.4" />

                    {/* Gap (Intercanthal) */}
                    <line x1={lIn.x} y1={midY} x2={rIn.x} y2={midY} stroke="#22d3ee" strokeWidth="0.6" />
                    <line x1={lIn.x} y1={midY - 1.5} x2={lIn.x} y2={midY + 1.5} stroke="#22d3ee" strokeWidth="0.5" />
                    <line x1={rIn.x} y1={midY - 1.5} x2={rIn.x} y2={midY + 1.5} stroke="#22d3ee" strokeWidth="0.5" />

                    {/* Right Eye Width */}
                    <line x1={rIn.x} y1={rIn.y} x2={rOut.x} y2={rOut.y} stroke="white" strokeWidth="0.5" />
                    <line x1={rIn.x} y1={rIn.y - 1} x2={rIn.x} y2={rIn.y + 1} stroke="white" strokeWidth="0.4" />
                    <line x1={rOut.x} y1={rOut.y - 1} x2={rOut.x} y2={rOut.y + 1} stroke="white" strokeWidth="0.4" />

                    {/* Label for Gap */}
                    <g transform={`translate(${(lIn.x + rIn.x) / 2}, ${midY + 4})`}>
                        <rect x="-6" y="-2" width="12" height="4" rx="1" fill="rgba(0,0,0,0.6)" />
                        <text x="0" y="1" fill="#22d3ee" fontSize="2.8" fontWeight="bold" textAnchor="middle">{gapRatio}x</text>
                    </g>
                    {renderInteractivePoint('leftEyeMedialCanthus', lIn.x, lIn.y, "#22d3ee", 0.5)}
                    {renderInteractivePoint('leftEyeLateralCanthus', lOut.x, lOut.y, "#22d3ee", 0.5)}
                    {renderInteractivePoint('rightEyeMedialCanthus', rIn.x, rIn.y, "#22d3ee", 0.5)}
                    {renderInteractivePoint('rightEyeLateralCanthus', rOut.x, rOut.y, "#22d3ee", 0.5)}
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
                    <line x1={lCheek.x} y1={lCheek.y} x2={rCheek.x} y2={rCheek.y} stroke="#3b82f6" strokeWidth="0.4" opacity="0.6" strokeDasharray="4,2" />
                    <text x={rCheek.x + 2} y={rCheek.y} fill="#3b82f6" fontSize="2.5" opacity="0.8">Cheek</text>
                    <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#22d3ee" strokeWidth="0.8" />
                    <text x={p2.x + 2} y={p2.y} fill="#22d3ee" fontSize="2.5" fontWeight="bold">{label}</text>
                    
                    {renderInteractivePoint('leftCheek', lCheek.x, lCheek.y, "#3b82f6", 0.5)}
                    {renderInteractivePoint('rightCheek', rCheek.x, rCheek.y, "#3b82f6", 0.5)}
                    
                    {metricName === "Bigonial Width" && renderInteractivePoint('leftBottomGonion', p1.x, p1.y, "#22d3ee", 0.5)}
                    {metricName === "Bigonial Width" && renderInteractivePoint('rightBottomGonion', p2.x, p2.y, "#22d3ee", 0.5)}
                    
                    {metricName === "Eye Separation Ratio" && renderInteractivePoint('leftEyePupil', p1.x, p1.y, "#22d3ee", 0.5)}
                    {metricName === "Eye Separation Ratio" && renderInteractivePoint('rightEyePupil', p2.x, p2.y, "#22d3ee", 0.5)}
                </>
            );
        }
    }

    // --- Midface Ratio ---
    if (metricName === "Midface Ratio") {
        const lPupil = getPt('leftEyePupil');
        const rPupil = getPt('rightEyePupil');
        const lip = getPt('innerCupidsBow');
        if (lPupil && rPupil && lip) {
            const midX = (lPupil.x + rPupil.x) / 2;
            const midY = (lPupil.y + rPupil.y) / 2;
            return (
                <>
                    <line x1={lPupil.x} y1={lPupil.y} x2={rPupil.x} y2={rPupil.y} stroke="#22d3ee" strokeWidth="0.6" strokeLinecap="round" />
                    <line x1={midX} y1={midY} x2={midX} y2={lip.y} stroke="#22d3ee" strokeWidth="0.6" strokeLinecap="round" />
                    <circle cx={midX} cy={midY} r="0.4" fill="#22d3ee" />
                    {renderInteractivePoint('leftEyePupil', lPupil.x, lPupil.y, "#22d3ee", 0.5)}
                    {renderInteractivePoint('rightEyePupil', rPupil.x, rPupil.y, "#22d3ee", 0.5)}
                    {renderInteractivePoint('innerCupidsBow', lip.x, lip.y, "#22d3ee", 0.5)}
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
                    <line x1={lPupil.x - 20} y1={eyeY} x2={rPupil.x + 20} y2={eyeY} stroke="white" strokeWidth="0.5" strokeDasharray="3,3" opacity="0.8" />
                    
                    {/* Top Segment (Eye to Cheek) - White Dotted */}
                    <line x1={centerX} y1={eyeY} x2={centerX} y2={cheekY} stroke="white" strokeWidth="1" strokeDasharray="3,3" />
                    
                    {/* Bottom Segment (Cheek to Mouth) - Blue Solid */}
                    <line x1={centerX} y1={cheekY} x2={centerX} y2={mouthY} stroke="#22d3ee" strokeWidth="1.2" />
                    
                    {/* Cheek Level Marker */}
                    <line x1={centerX - 5} y1={cheekY} x2={centerX + 5} y2={cheekY} stroke="#22d3ee" strokeWidth="1.2" />
                    <circle cx={centerX} cy={cheekY} r="0.6" fill="#22d3ee" />

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
                    {renderInteractivePoint('leftCheek', lCheek.x, lCheek.y, "#22d3ee", 0.5)}
                    {renderInteractivePoint('rightCheek', rCheek.x, rCheek.y, "#22d3ee", 0.5)}
                    {renderInteractivePoint('leftEyePupil', lPupil.x, lPupil.y, "#22d3ee", 0.5)}
                    {renderInteractivePoint('rightEyePupil', rPupil.x, rPupil.y, "#22d3ee", 0.5)}
                    {renderInteractivePoint('mouthMiddle', mouth.x, mouth.y, "#22d3ee", 0.5)}
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

            // Helper to find point on line at specific distance
            const ptOnLine = (start: {x:number, y:number}, end: {x:number, y:number}, dist: number) => {
                 const len = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
                 const t = dist / (len || 1);
                 return { x: start.x + (end.x - start.x) * t, y: start.y + (end.y - start.y) * t };
            };

            const pA = ptOnLine(vertex, lBot, 8);
            const pB = ptOnLine(vertex, rBot, 8);

            // Calculate Arc Params using simple svg arc
            // We want an arc centered at vertex with radius 8
            // Start at pA, End at pB
            // Since angles are < 180, large-arc-flag is 0
            // Sweep-flag depends on direction. Usually 1 for clockwise (pA to pB around vertex if vertex is bottom).
            // Let's assume standard orientation where Left is pA and Right is pB.
            
            // Calculate Angle Value for Display
            // Vector V->L and V->R
            const v1 = { x: lBot.x - vertex.x, y: lBot.y - vertex.y };
            const v2 = { x: rBot.x - vertex.x, y: rBot.y - vertex.y };
            const dot = v1.x * v2.x + v1.y * v2.y;
            const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
            const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
            let angleVal = 0;
            if (mag1 * mag2 !== 0) {
               const cosine = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
               angleVal = Math.acos(cosine) * (180 / Math.PI);
            }
            
            return (
                <>
                    {/* Jawline Extensions to Vertex */}
                    <line x1={lBot.x} y1={lBot.y} x2={vertex.x} y2={vertex.y} stroke="#22d3ee" strokeWidth="0.8" strokeLinecap="round" />
                    <line x1={rBot.x} y1={rBot.y} x2={vertex.x} y2={vertex.y} stroke="#22d3ee" strokeWidth="0.8" strokeLinecap="round" />

                    {/* Key Points */}
                    {renderInteractivePoint('leftBottomGonion', lBot.x, lBot.y, "#22d3ee", 0.5)}
                    {renderInteractivePoint('rightBottomGonion', rBot.x, rBot.y, "#22d3ee", 0.5)}
                    {renderInteractivePoint('chinLeft', lChin.x, lChin.y, "#22d3ee", 0.5)}
                    {renderInteractivePoint('chinRight', rChin.x, rChin.y, "#22d3ee", 0.5)}
                    {renderInteractivePoint('vertex', vertex.x, vertex.y, "#22d3ee", 0.8)} {/* Derived? */}

                    {/* Angle Arc at Vertex (Proper Circular Arc) */}
                    {/* A rx ry x-axis-rotation large-arc-flag sweep-flag x y */}
                    <path d={`M ${pA.x} ${pA.y} A 8 8 0 0 1 ${pB.x} ${pB.y}`} stroke="white" strokeWidth="0.8" fill="none" />
                    
                    {/* Display Angle Value */}
                    <g transform={`translate(${vertex.x}, ${vertex.y + 6})`}>
                         <rect x="-8" y="-3" width="16" height="6" rx="2" fill="rgba(0,0,0,0.7)" />
                         <text x="0" y="1.5" fill="#22d3ee" fontSize="3.5" fontWeight="bold" textAnchor="middle">{angleVal.toFixed(1)}°</text>
                    </g>
                </>
            );

        }
    }

    // --- Ipsilateral Alar Angle (IAA) ---
    if (metricName === "Ipsilateral Alar Angle") {
        const lCanthus = getPt('leftEyeLateralCanthus');
        const rCanthus = getPt('rightEyeLateralCanthus');
        const noseBottom = getPt('noseBottom');

        if (lCanthus && rCanthus && noseBottom) {
            // Helper to find point on line at specific distance
            const ptOnLine = (start: {x:number, y:number}, end: {x:number, y:number}, dist: number) => {
                const len = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
                const t = dist / (len || 1);
                return { x: start.x + (end.x - start.x) * t, y: start.y + (end.y - start.y) * t };
            };

            const pL = ptOnLine(noseBottom, lCanthus, 8);
            const pR = ptOnLine(noseBottom, rCanthus, 8);

            // Calculate angle
            const v1 = { x: lCanthus.x - noseBottom.x, y: lCanthus.y - noseBottom.y };
            const v2 = { x: rCanthus.x - noseBottom.x, y: rCanthus.y - noseBottom.y };
            const dot = v1.x * v2.x + v1.y * v2.y;
            const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
            const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
            let angleVal = 0;
            if (mag1 * mag2 !== 0) {
                const cosine = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
                angleVal = Math.acos(cosine) * (180 / Math.PI);
            }

            return (
                <>
                    {/* Lines from lateral canthi to nose bottom */}
                    <line x1={lCanthus.x} y1={lCanthus.y} x2={noseBottom.x} y2={noseBottom.y} stroke="#22d3ee" strokeWidth="0.8" strokeLinecap="round" />
                    <line x1={rCanthus.x} y1={rCanthus.y} x2={noseBottom.x} y2={noseBottom.y} stroke="#22d3ee" strokeWidth="0.8" strokeLinecap="round" />
                    
                    {/* Arc at nose bottom vertex */}
                    <path d={`M ${pL.x} ${pL.y} A 8 8 0 0 1 ${pR.x} ${pR.y}`} stroke="white" strokeWidth="0.8" fill="none" />
                    
                    {/* Angle value display */}
                    <g transform={`translate(${noseBottom.x}, ${noseBottom.y + 6})`}>
                        <rect x="-8" y="-3" width="16" height="6" rx="2" fill="rgba(0,0,0,0.7)" />
                        <text x="0" y="1.5" fill="#22d3ee" fontSize="3.5" fontWeight="bold" textAnchor="middle">{angleVal.toFixed(1)}°</text>
                    </g>

                    {/* Interactive points */}
                    {renderInteractivePoint('leftEyeLateralCanthus', lCanthus.x, lCanthus.y, "#22d3ee", 0.5)}
                    {renderInteractivePoint('rightEyeLateralCanthus', rCanthus.x, rCanthus.y, "#22d3ee", 0.5)}
                    {renderInteractivePoint('noseBottom', noseBottom.x, noseBottom.y, "#22d3ee", 0.5)}
                </>
            );
        }
    }

    // --- Chin to Philtrum Ratio ---
    if (metricName === "Chin to Philtrum") {
        const chinBottom = getPt('chinBottom');
        const lowerLip = getPt('lowerLip');
        const innerCupid = getPt('innerCupidsBow');
        const noseBottom = getPt('noseBottom');

        if (chinBottom && lowerLip && innerCupid && noseBottom) {
            const midX = (chinBottom.x + lowerLip.x) / 2;
            const ratio = (Math.abs(chinBottom.y - lowerLip.y) / Math.abs(innerCupid.y - noseBottom.y)).toFixed(2);

            return (
                <>
                    {/* Chin height (chinBottom to lowerLip) */}
                    <line x1={midX} y1={chinBottom.y} x2={midX} y2={lowerLip.y} stroke="#22d3ee" strokeWidth="0.6" strokeLinecap="round" />
                    <line x1={midX - 1.5} y1={chinBottom.y} x2={midX + 1.5} y2={chinBottom.y} stroke="#22d3ee" strokeWidth="0.5" />
                    <line x1={midX - 1.5} y1={lowerLip.y} x2={midX + 1.5} y2={lowerLip.y} stroke="#22d3ee" strokeWidth="0.5" />

                    {/* Philtrum height (innerCupidsBow to noseBottom) */}
                    <line x1={midX + 5} y1={innerCupid.y} x2={midX + 5} y2={noseBottom.y} stroke="white" strokeWidth="0.6" strokeLinecap="round" />
                    <line x1={midX + 3.5} y1={innerCupid.y} x2={midX + 6.5} y2={innerCupid.y} stroke="white" strokeWidth="0.5" />
                    <line x1={midX + 3.5} y1={noseBottom.y} x2={midX + 6.5} y2={noseBottom.y} stroke="white" strokeWidth="0.5" />

                    {/* Ratio display */}
                    <g transform={`translate(${midX + 10}, ${(chinBottom.y + lowerLip.y) / 2})`}>
                        <text x="0" y="1" fill="#22d3ee" fontSize="3" fontWeight="bold">{ratio}x</text>
                    </g>

                    {/* Interactive points */}
                    {renderInteractivePoint('chinBottom', midX, chinBottom.y, "#22d3ee", 0.5)}
                    {renderInteractivePoint('lowerLip', midX, lowerLip.y, "#22d3ee", 0.5)}
                    {renderInteractivePoint('innerCupidsBow', midX + 5, innerCupid.y, "white", 0.5)}
                    {renderInteractivePoint('noseBottom', midX + 5, noseBottom.y, "white", 0.5)}
                </>
            );
        }
    }

    // --- Canthal Tilt ---
    if (metricName === "Canthal Tilt") {
        const lMedial = getPt('leftEyeMedialCanthus');
        const lLateral = getPt('leftEyeLateralCanthus');
        const rMedial = getPt('rightEyeMedialCanthus');
        const rLateral = getPt('rightEyeLateralCanthus');

        if (lMedial && lLateral && rMedial && rLateral) {
            // Calculate tilts
            const leftTilt = Math.atan2(lLateral.y - lMedial.y, lLateral.x - lMedial.x) * (180 / Math.PI);
            const rightTilt = Math.atan2(rLateral.y - rMedial.y, rLateral.x - rMedial.x) * (180 / Math.PI);

            return (
                <>
                    {/* Left eye tilt line */}
                    <line x1={lMedial.x} y1={lMedial.y} x2={lLateral.x} y2={lLateral.y} stroke="#22d3ee" strokeWidth="0.8" strokeLinecap="round" />
                    <text x={(lMedial.x + lLateral.x) / 2} y={lMedial.y - 3} fill="#22d3ee" fontSize="3" fontWeight="bold" textAnchor="middle">{leftTilt.toFixed(1)}°</text>
                    
                    {/* Right eye tilt line */}
                    <line x1={rMedial.x} y1={rMedial.y} x2={rLateral.x} y2={rLateral.y} stroke="#22d3ee" strokeWidth="0.8" strokeLinecap="round" />
                    <text x={(rMedial.x + rLateral.x) / 2} y={rMedial.y - 3} fill="#22d3ee" fontSize="3" fontWeight="bold" textAnchor="middle">{rightTilt.toFixed(1)}°</text>

                    {/* Interactive points */}
                    {renderInteractivePoint('leftEyeMedialCanthus', lMedial.x, lMedial.y, "#22d3ee", 0.5)}
                    {renderInteractivePoint('leftEyeLateralCanthus', lLateral.x, lLateral.y, "#22d3ee", 0.5)}
                    {renderInteractivePoint('rightEyeMedialCanthus', rMedial.x, rMedial.y, "#22d3ee", 0.5)}
                    {renderInteractivePoint('rightEyeLateralCanthus', rLateral.x, rLateral.y, "#22d3ee", 0.5)}
                </>
            );
        }
    }
    
    // --- Eyebrow Tilt ---
    if (metricName === "Eyebrow Tilt") {
        const lInner = getPt('leftBrowInnerCorner');
        const lArch = getPt('leftBrowArch');
        const rInner = getPt('rightBrowInnerCorner');
        const rArch = getPt('rightBrowArch');

        if (lInner && lArch && rInner && rArch) {
            // Calculate tilts (absolute angle relative to horizontal)
            const leftTilt = Math.abs(Math.atan2(lArch.y - lInner.y, lArch.x - lInner.x) * (180 / Math.PI));
            const rightTilt = Math.abs(Math.atan2(rArch.y - rInner.y, rArch.x - rInner.x) * (180 / Math.PI));

            return (
                <>
                    {/* Left Brow Tilt */}
                    <line x1={lInner.x} y1={lInner.y} x2={lArch.x} y2={lArch.y} stroke="#22d3ee" strokeWidth="0.8" strokeLinecap="round" />
                    <text x={(lInner.x + lArch.x) / 2} y={lInner.y - 3} fill="#22d3ee" fontSize="3" fontWeight="bold" textAnchor="middle">{leftTilt.toFixed(1)}°</text>
                    
                    {/* Right Brow Tilt */}
                    <line x1={rInner.x} y1={rInner.y} x2={rArch.x} y2={rArch.y} stroke="#22d3ee" strokeWidth="0.8" strokeLinecap="round" />
                    <text x={(rInner.x + rArch.x) / 2} y={rInner.y - 3} fill="#22d3ee" fontSize="3" fontWeight="bold" textAnchor="middle">{rightTilt.toFixed(1)}°</text>

                    {/* Interactive points */}
                    {renderInteractivePoint('leftBrowInnerCorner', lInner.x, lInner.y, "#22d3ee", 0.5)}
                    {renderInteractivePoint('leftBrowArch', lArch.x, lArch.y, "#22d3ee", 0.5)}
                    {renderInteractivePoint('rightBrowInnerCorner', rInner.x, rInner.y, "#22d3ee", 0.5)}
                    {renderInteractivePoint('rightBrowArch', rArch.x, rArch.y, "#22d3ee", 0.5)}
                </>
            );
        }
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

        const validL = lCheek && lTop && lChin;
        const validR = rCheek && rTop && rChin;

        if (validL || validR) {
             const lA = validL ? ptOnLine(lTop!, lCheek!, 8) : {x:0,y:0};
             const lB = validL ? ptOnLine(lTop!, lChin!, 8) : {x:0,y:0};
             
             const rA = validR ? ptOnLine(rTop!, rCheek!, 8) : {x:0,y:0};
             const rB = validR ? ptOnLine(rTop!, rChin!, 8) : {x:0,y:0};

             // Calculate angle values
             let leftAngle = 0;
             let rightAngle = 0;

             if (validL) {
                 const v1 = { x: lCheek!.x - lTop!.x, y: lCheek!.y - lTop!.y };
                 const v2 = { x: lChin!.x - lTop!.x, y: lChin!.y - lTop!.y };
                 const dot = v1.x * v2.x + v1.y * v2.y;
                 const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
                 const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
                 if (mag1 * mag2 !== 0) {
                    const cosine = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
                    leftAngle = Math.acos(cosine) * (180 / Math.PI);
                 }
             }

             if (validR) {
                 const v1 = { x: rCheek!.x - rTop!.x, y: rCheek!.y - rTop!.y };
                 const v2 = { x: rChin!.x - rTop!.x, y: rChin!.y - rTop!.y };
                 const dot = v1.x * v2.x + v1.y * v2.y;
                 const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
                 const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
                 if (mag1 * mag2 !== 0) {
                    const cosine = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
                    rightAngle = Math.acos(cosine) * (180 / Math.PI);
                 }
             }

             return (
                <>
                    {/* Left Side */}
                    {validL && (
                        <>
                            <line x1={lCheek!.x} y1={lCheek!.y} x2={lTop!.x} y2={lTop!.y} stroke="#22d3ee" strokeWidth="0.8" strokeLinecap="round" />
                            <line x1={lTop!.x} y1={lTop!.y} x2={lChin!.x} y2={lChin!.y} stroke="#22d3ee" strokeWidth="0.8" strokeLinecap="round" />
                            {renderInteractivePoint('leftCheek', lCheek!.x, lCheek!.y, "#22d3ee", 0.5)}
                            {renderInteractivePoint('leftTopGonion', lTop!.x, lTop!.y, "#22d3ee", 0.5)}
                            {renderInteractivePoint('chinLeft', lChin!.x, lChin!.y, "#22d3ee", 0.5)}
                            
                            {/* Arc for Left Side */}
                            <path d={`M ${lA.x} ${lA.y} A 8 8 0 0 1 ${lB.x} ${lB.y}`} stroke="white" strokeWidth="0.8" fill="none" />
                            <text x={lTop!.x - 8} y={lTop!.y} fill="white" fontSize="3" fontWeight="bold">{leftAngle.toFixed(1)}°</text>
                        </>
                    )}

                    {/* Right Side */}
                    {validR && (
                        <>
                            <line x1={rCheek!.x} y1={rCheek!.y} x2={rTop!.x} y2={rTop!.y} stroke="#22d3ee" strokeWidth="0.8" strokeLinecap="round" />
                            <line x1={rTop!.x} y1={rTop!.y} x2={rChin!.x} y2={rChin!.y} stroke="#22d3ee" strokeWidth="0.8" strokeLinecap="round" />
                            {renderInteractivePoint('rightCheek', rCheek!.x, rCheek!.y, "#22d3ee", 0.5)}
                            {renderInteractivePoint('rightTopGonion', rTop!.x, rTop!.y, "#22d3ee", 0.5)}
                            {renderInteractivePoint('chinRight', rChin!.x, rChin!.y, "#22d3ee", 0.5)}
                            
                            {/* Arc for Right Side - sweep-flag 0 for acute angle */}
                            <path d={`M ${rA.x} ${rA.y} A 8 8 0 0 0 ${rB.x} ${rB.y}`} stroke="white" strokeWidth="0.8" fill="none" />
                            <text x={rTop!.x + 8} y={rTop!.y} fill="white" fontSize="3" fontWeight="bold">{rightAngle.toFixed(1)}°</text>
                        </>
                    )}
                </>
             );
        }
    }

    // Fallback: Simple Connection
    if (highlightedLandmarks.length === 2) {
        const p1 = getPt(highlightedLandmarks[0]);
        const p2 = getPt(highlightedLandmarks[1]);
        if (!p1 || !p2) return null;
        return (
            <>
                <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#3b82f6" strokeWidth="0.8" strokeLinecap="round" />
                {renderInteractivePoint(highlightedLandmarks[0], p1.x, p1.y, "#3b82f6", 0.8)}
                {renderInteractivePoint(highlightedLandmarks[1], p2.x, p2.y, "#3b82f6", 0.8)}
            </>
        );
    } else if (highlightedLandmarks.length > 2) {
         return highlightedLandmarks.map(key => {
             const p = getPt(key);
             if (!p) return null;
             return renderInteractivePoint(key, p.x, p.y, "#3b82f6", 0.8);
         });
    }

    return null;

    // --- Neck Width (AB vs CD) ---
    if (metricName === "Neck Width") {
        const lTop = getPt('leftTopGonion');
        const rTop = getPt('rightTopGonion');
        const lNeck = getPt('neckLeft');
        const rNeck = getPt('neckRight');

        if (lTop && rTop && lNeck && rNeck) {
            return (
                <>
                    {/* Line AB (Top Gonions) */}
                    <line x1={lTop.x} y1={lTop.y} x2={rTop.x} y2={rTop.y} stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" />
                    <text x={(lTop.x + rTop.x) / 2} y={lTop.y - 4} fill="white" fontSize="3" fontWeight="bold" textAnchor="middle">Upper Jaw Width</text>
                    {renderInteractivePoint('leftTopGonion', lTop.x, lTop.y, "#22d3ee", 1.5)}
                    {renderInteractivePoint('rightTopGonion', rTop.x, rTop.y, "#22d3ee", 1.5)}

                    {/* Line CD (Neck) */}
                    <line x1={lNeck.x} y1={lNeck.y} x2={rNeck.x} y2={rNeck.y} stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" />
                    <text x={(lNeck.x + rNeck.x) / 2} y={lNeck.y + 8} fill="white" fontSize="3" fontWeight="bold" textAnchor="middle">Neck Width</text>
                    {renderInteractivePoint('neckLeft', lNeck.x, lNeck.y, "#22d3ee", 1.5)}
                    {renderInteractivePoint('neckRight', rNeck.x, rNeck.y, "#22d3ee", 1.5)}
                    
                    {/* Dotted Connection (Visual Comparison) */}
                    <line x1={(lTop.x + rTop.x) / 2} y1={lTop.y} x2={(lNeck.x + rNeck.x) / 2} y2={lNeck.y} stroke="white" strokeWidth="1" strokeDasharray="2,2" opacity="0.6" />
                </>
            );
        }
    }

    // --- Deviation of IAA & JFA ---
    if (metricName === "Deviation of IAA & JFA") {
         const lBot = getPt('leftBottomGonion');
         const rBot = getPt('rightBottomGonion');
         const lChin = getPt('chinLeft');
         const rChin = getPt('chinRight');
         
         const lEye = getPt('leftEyeLateralCanthus');
         const rEye = getPt('rightEyeLateralCanthus');
         const nose = getPt('noseBottom');

         if (lBot && rBot && lChin && rChin && lEye && rEye && nose) {
             // --- JFA Visual (Cyan) ---
             // Calculate Vertex
             const det = (lChin.x - lBot.x) * (rChin.y - rBot.y) - (rChin.x - rBot.x) * (lChin.y - lBot.y);
             let vertexJFA = { x: (lChin.x + rChin.x) / 2, y: (lChin.y + rChin.y) / 2 };
             if (det !== 0) {
                 const lambda = ((rChin.y - rBot.y) * (rChin.x - lBot.x) + (rBot.x - rChin.x) * (rChin.y - lBot.y)) / det;
                 vertexJFA = { x: lBot.x + lambda * (lChin.x - lBot.x), y: lBot.y + lambda * (lChin.y - lBot.y) };
             }

             // JFA Arc
             const ptOnLine = (start: {x:number, y:number}, end: {x:number, y:number}, dist: number) => {
                  const len = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
                  const t = dist / (len || 1);
                  return { x: start.x + (end.x - start.x) * t, y: start.y + (end.y - start.y) * t };
             };
             const pA_JFA = ptOnLine(vertexJFA, lBot, 8);
             const pB_JFA = ptOnLine(vertexJFA, rBot, 8);

             // Calculate JFA Angle
             const v1 = { x: lBot.x - vertexJFA.x, y: lBot.y - vertexJFA.y };
             const v2 = { x: rBot.x - vertexJFA.x, y: rBot.y - vertexJFA.y };
             const dot = v1.x * v2.x + v1.y * v2.y;
             const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
             const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
             let valJFA = 0;
             if (mag1 * mag2 !== 0) valJFA = Math.acos(Math.max(-1, Math.min(1, dot / (mag1 * mag2)))) * (180 / Math.PI);


             // --- IAA Visual (Purple/Pink to distinguish) ---
             // Vertex is Nose
             const pA_IAA = ptOnLine(nose, lEye, 8);
             const pB_IAA = ptOnLine(nose, rEye, 8);

             // Calculate IAA Angle
             const v3 = { x: lEye.x - nose.x, y: lEye.y - nose.y };
             const v4 = { x: rEye.x - nose.x, y: rEye.y - nose.y };
             const dot2 = v3.x * v4.x + v3.y * v4.y;
             const mag3 = Math.sqrt(v3.x * v3.x + v3.y * v3.y);
             const mag4 = Math.sqrt(v4.x * v4.x + v4.y * v4.y);
             let valIAA = 0;
             if (mag3 * mag4 !== 0) valIAA = Math.acos(Math.max(-1, Math.min(1, dot2 / (mag3 * mag4)))) * (180 / Math.PI);

             const deviation = Math.abs(valJFA - valIAA).toFixed(1);

             return (
                <>
                    {/* JFA Visuals (Cyan) */}
                    <line x1={lBot.x} y1={lBot.y} x2={vertexJFA.x} y2={vertexJFA.y} stroke="#22d3ee" strokeWidth="0.8" />
                    <line x1={rBot.x} y1={rBot.y} x2={vertexJFA.x} y2={vertexJFA.y} stroke="#22d3ee" strokeWidth="0.8" />
                    <path d={`M ${pA_JFA.x} ${pA_JFA.y} A 8 8 0 0 1 ${pB_JFA.x} ${pB_JFA.y}`} stroke="#22d3ee" strokeWidth="0.8" fill="none" />
                    <text x={vertexJFA.x} y={vertexJFA.y + 6} fill="#22d3ee" fontSize="3" fontWeight="bold" textAnchor="middle">{valJFA.toFixed(1)}°</text>

                    {/* IAA Visuals (Pink/Purple) */}
                    <line x1={lEye.x} y1={lEye.y} x2={nose.x} y2={nose.y} stroke="#d946ef" strokeWidth="0.8" />
                    <line x1={rEye.x} y1={rEye.y} x2={nose.x} y2={nose.y} stroke="#d946ef" strokeWidth="0.8" />
                    <path d={`M ${pA_IAA.x} ${pA_IAA.y} A 8 8 0 0 1 ${pB_IAA.x} ${pB_IAA.y}`} stroke="#d946ef" strokeWidth="0.8" fill="none" />
                    <text x={nose.x} y={nose.y - 4} fill="#d946ef" fontSize="3" fontWeight="bold" textAnchor="middle">{valIAA.toFixed(1)}°</text>

                    {/* Deviation Label (Center) */}
                    <g transform={`translate(50, 50)`}>
                         <rect x="-10" y="-4" width="20" height="8" rx="2" fill="rgba(0,0,0,0.8)" stroke="white" strokeWidth="0.5" />
                         <text x="0" y="-1" fill="white" fontSize="2.5" textAnchor="middle">Deviation</text>
                         <text x="0" y="2.5" fill="#22d3ee" fontSize="3" fontWeight="bold" textAnchor="middle">{deviation}°</text>
                    </g>

                    {/* Interactive Points */}
                    {renderInteractivePoint('leftBottomGonion', lBot.x, lBot.y, "#22d3ee", 0.5)}
                    {renderInteractivePoint('rightBottomGonion', rBot.x, rBot.y, "#22d3ee", 0.5)}
                    {renderInteractivePoint('chinLeft', lChin.x, lChin.y, "#22d3ee", 0.5)}
                    {renderInteractivePoint('chinRight', rChin.x, rChin.y, "#22d3ee", 0.5)}
                    {renderInteractivePoint('leftEyeLateralCanthus', lEye.x, lEye.y, "#d946ef", 0.5)}
                    {renderInteractivePoint('rightEyeLateralCanthus', rEye.x, rEye.y, "#d946ef", 0.5)}
                    {renderInteractivePoint('noseBottom', nose.x, nose.y, "#d946ef", 0.5)}
                </>
             );
    }
    }


    return null;
  };

  return (
    <div ref={containerRef} className="relative w-full h-full rounded-xl overflow-hidden bg-slate-900 shadow-inner group">
      <div className="absolute inset-0 bg-center bg-cover opacity-30 blur-xl scale-110" style={{ backgroundImage: `url(${photoUrl})` }}></div>
      <img ref={imgRef} src={photoUrl} className="relative w-full h-full object-contain z-10 pointer-events-none" alt="Analysis Subject" onLoad={updateOverlayPosition} />
      <svg 
        ref={svgRef}
        style={overlayStyle} 
        className="z-20" 
        viewBox="0 0 100 100" 
        preserveAspectRatio="none"
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="0.6" result="coloredBlur"/>
            <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        {/* Conditionally apply glow. Complex geometric metrics (Jaw Slope/Angle/Neck Width) are rendered without filter for maximum clarity on mobile */}
        { ["Jaw Slope", "Jaw Frontal Angle", "Neck Width", "Deviation of IAA & JFA", "Ipsilateral Alar Angle"].includes(metricName || "") ? (
             <g>{renderLines()}</g>
        ) : (
             <g filter="url(#glow)">{renderLines()}</g>
        )}
      </svg>
    </div>
  );
};

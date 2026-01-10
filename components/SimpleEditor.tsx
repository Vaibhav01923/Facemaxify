// import React, { useState } from "react";
// import { LandmarkEditor } from "./LandmarkEditor";
// import { DEFAULT_FRONT_RELATIVE_POSITIONS } from "../constants";
// import { Point } from "../types";

// export const SimpleEditor: React.FC = () => {
//   // Application State
//   const [photoUrl, setPhotoUrl] = useState<string | null>(null);
//   const [landmarks, setLandmarks] = useState<Record<string, Point>>(() => {
//     // Initialize defaults scaled to 1000x1000
//     const initial: Record<string, Point> = {};
//     Object.entries(DEFAULT_FRONT_RELATIVE_POSITIONS).forEach(([key, pt]) => {
//       initial[key] = { x: pt.x * 1000, y: pt.y * 1000 };
//     });
//     return initial;
//   });

//   // Handlers
//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files && e.target.files[0]) {
//       setPhotoUrl(URL.createObjectURL(e.target.files[0]));
//     }
//   };

//   const handleUseDemo = () => {
//     setPhotoUrl(
//       "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
//     );
//   };

//   const handleComplete = (finalVal: Record<string, Point>) => {
//     console.log("Analysis Result:", finalVal);
//     alert("Analysis Complete! (Check console for raw data)");
//   };

//   // 1. Upload View
//   if (!photoUrl) {
//     return (
//       <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6">
//         <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl">
//           <h1 className="text-2xl font-bold mb-2">Editor Preview</h1>
//           <p className="text-slate-400 mb-8">
//             Upload a photo to test the Landmark Editor.
//           </p>

//           <label className="block w-full cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-4 rounded-xl transition-colors mb-4">
//             <span>Upload Photo</span>
//             <input
//               type="file"
//               className="hidden"
//               accept="image/*"
//               onChange={handleFileChange}
//             />
//           </label>

//           <div className="text-xs text-slate-500 my-4 uppercase tracking-wider">
//             Or
//           </div>

//           <button
//             onClick={handleUseDemo}
//             className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-3 px-4 rounded-xl border border-slate-700"
//           >
//             Use Demo Photo
//           </button>
//         </div>
//       </div>
//     );
//   }

//   // 2. Editor View
//   return (
//     <LandmarkEditor
//       photoUrl={photoUrl}
//       initialLandmarks={landmarks}
//       faceBox={{ xmin: 0, ymin: 0, xmax: 1000, ymax: 1000 }}
//       onComplete={handleComplete}
//       title="Editor Preview"
//       landmarkType="front"
//     />
//   );
// };

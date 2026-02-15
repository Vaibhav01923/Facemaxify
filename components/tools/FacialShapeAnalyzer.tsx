import React, { useState, useRef } from "react";
import { FaceMesh } from "@mediapipe/face_mesh";
import { Camera } from "@mediapipe/camera_utils";
import {
  Upload,
  Camera as CameraIcon,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import {
  extractMeasurements,
  classifyFaceShape,
  formatFaceShape,
  getConfidenceColor,
  type FaceShapeResult,
} from "../../utils/faceShapeClassifier";

export const FacialShapeAnalyzer: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<FaceShapeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("Image size must be less than 10MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
      setResult(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  // Analyze face shape
  const analyzeFaceShape = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      // Create image element
      const img = new Image();
      img.src = selectedImage;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // Initialize MediaPipe Face Mesh
      const faceMesh = new FaceMesh({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        },
      });

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      // Process image
      await new Promise<void>((resolve, reject) => {
        faceMesh.onResults((results) => {
          if (
            !results.multiFaceLandmarks ||
            results.multiFaceLandmarks.length === 0
          ) {
            reject(
              new Error(
                "No face detected in the image. Please upload a clear photo with your face visible.",
              ),
            );
            return;
          }

          try {
            // Extract landmarks
            const landmarks = results.multiFaceLandmarks[0];

            // Extract measurements
            const measurements = extractMeasurements(landmarks);

            // Classify face shape
            const faceShapeResult = classifyFaceShape(measurements);

            setResult(faceShapeResult);
            resolve();
          } catch (err) {
            reject(err);
          }
        });

        faceMesh.send({ image: img });
      });

      faceMesh.close();
    } catch (err: any) {
      console.error("Analysis error:", err);
      setError(
        err.message ||
          "Failed to analyze face shape. Please try another photo.",
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            AI Face Shape Detector
          </h1>
          <p className="text-xl text-slate-300 mb-2">
            Discover your face shape instantly with AI-powered analysis
          </p>
          <p className="text-slate-400">
            Free • No signup required • Privacy friendly
          </p>
        </div>

        {/* Upload Section */}
        {!selectedImage && (
          <div className="bg-slate-900/50 border-2 border-dashed border-slate-700 rounded-2xl p-12 text-center hover:border-indigo-500/50 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            <div className="flex flex-col items-center gap-6">
              <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center">
                <Upload className="w-10 h-10 text-indigo-400" />
              </div>

              <div>
                <h3 className="text-2xl font-semibold text-white mb-2">
                  Upload Your Photo
                </h3>
                <p className="text-slate-400 mb-6">
                  Choose a clear, front-facing photo for best results
                </p>
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors flex items-center gap-2"
              >
                <Upload className="w-5 h-5" />
                Choose Photo
              </button>

              <p className="text-sm text-slate-500">
                Supported formats: JPG, PNG, WEBP • Max size: 10MB
              </p>
            </div>
          </div>
        )}

        {/* Image Preview & Analysis */}
        {selectedImage && !result && (
          <div className="space-y-6">
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
              <img
                src={selectedImage}
                alt="Selected"
                className="w-full max-w-md mx-auto rounded-xl"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-300">{error}</p>
              </div>
            )}

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  setSelectedImage(null);
                  setError(null);
                }}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition-colors"
              >
                Choose Different Photo
              </button>

              <button
                onClick={analyzeFaceShape}
                disabled={isAnalyzing}
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Analyze Face Shape
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Main Result Card */}
            <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-2xl p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-500/20 rounded-full mb-4">
                <CheckCircle className="w-8 h-8 text-indigo-400" />
              </div>

              <h2 className="text-3xl font-bold text-white mb-2">
                Your Face Shape: {formatFaceShape(result.shape)}
              </h2>

              <div className="flex items-center justify-center gap-2 mb-4">
                <span
                  className={`text-lg font-semibold ${getConfidenceColor(result.confidence)}`}
                >
                  {result.confidence}% Confidence
                </span>
              </div>

              <p className="text-slate-300 max-w-2xl mx-auto">
                {result.reasoning}
              </p>
            </div>

            {/* Image with overlay */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
              <img
                src={selectedImage!}
                alt="Analysis result"
                className="w-full max-w-md mx-auto rounded-xl"
              />
            </div>

            {/* Measurements */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4">
                Key Measurements
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <p className="text-slate-400 text-sm mb-1">
                    Length/Width Ratio
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {result.measurements.lengthToWidthRatio.toFixed(2)}:1
                  </p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <p className="text-slate-400 text-sm mb-1">
                    Forehead/Jaw Ratio
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {result.measurements.foreheadToJawRatio.toFixed(2)}:1
                  </p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <p className="text-slate-400 text-sm mb-1">Chin Angle</p>
                  <p className="text-2xl font-bold text-white">
                    {result.measurements.chinAngle.toFixed(0)}°
                  </p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <p className="text-slate-400 text-sm mb-1">Face Shape</p>
                  <p className="text-2xl font-bold text-indigo-400">
                    {formatFaceShape(result.shape)}
                  </p>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Hairstyles */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-white mb-4">
                  ✨ Hairstyle Recommendations
                </h3>
                <ul className="space-y-2">
                  {result.recommendations.hairstyles.map((style, index) => (
                    <li
                      key={index}
                      className="text-slate-300 flex items-start gap-2"
                    >
                      <span className="text-indigo-400 mt-1">•</span>
                      <span>{style}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Glasses */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-white mb-4">
                  👓 Glasses Recommendations
                </h3>
                <ul className="space-y-2">
                  {result.recommendations.glasses.map((style, index) => (
                    <li
                      key={index}
                      className="text-slate-300 flex items-start gap-2"
                    >
                      <span className="text-indigo-400 mt-1">•</span>
                      <span>{style}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Makeup */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-white mb-4">
                  💄 Makeup Tips
                </h3>
                <ul className="space-y-2">
                  {result.recommendations.makeup.map((tip, index) => (
                    <li
                      key={index}
                      className="text-slate-300 flex items-start gap-2"
                    >
                      <span className="text-indigo-400 mt-1">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Celebrities */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-white mb-4">
                  ⭐ Celebrity Matches
                </h3>
                <p className="text-slate-400 text-sm mb-3">
                  Celebrities with similar{" "}
                  {formatFaceShape(result.shape).toLowerCase()} face shapes:
                </p>
                <div className="flex flex-wrap gap-2">
                  {result.recommendations.celebrities.map((celeb, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-sm"
                    >
                      {celeb}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Try Again Button */}
            <div className="text-center">
              <button
                onClick={() => {
                  setSelectedImage(null);
                  setResult(null);
                  setError(null);
                }}
                className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition-colors"
              >
                Analyze Another Photo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

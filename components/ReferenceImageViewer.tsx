import React from 'react';
import { X } from 'lucide-react';
import { LANDMARK_REFERENCE_IMAGES } from '../constants';

interface ReferenceImageViewerProps {
  landmarkKey: string;
  landmarkName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ReferenceImageViewer: React.FC<ReferenceImageViewerProps> = ({
  landmarkKey,
  landmarkName,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const imagePath = LANDMARK_REFERENCE_IMAGES[landmarkKey];

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Close on Escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!imagePath) {
    return null; // No reference image available for this landmark
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn"
      onClick={handleBackdropClick}
    >
      {/* Modal/Drawer Container */}
      <div className="relative w-full max-w-2xl mx-4 mb-4 sm:mb-0 bg-slate-900 rounded-t-3xl sm:rounded-3xl border border-white/10 shadow-2xl overflow-hidden animate-slideUp sm:animate-scaleIn">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-b from-slate-900 to-slate-900/95 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h3 className="text-lg font-bold text-white">{landmarkName}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Reference Guide</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Image Container */}
        <div className="p-6 max-h-[70vh] sm:max-h-[80vh] overflow-y-auto">
          <div className="bg-black/30 rounded-xl overflow-hidden border border-white/5">
            <img
              src={imagePath}
              alt={`Reference for ${landmarkName}`}
              className="w-full h-auto object-contain"
              style={{ maxHeight: '60vh' }}
            />
          </div>
          
          {/* Help Text */}
          <div className="mt-4 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
            <p className="text-sm text-indigo-200">
              💡 <span className="font-semibold">Tip:</span> Use this reference image to accurately place the landmark point on your photo.
            </p>
          </div>
        </div>

        {/* Mobile Pull Indicator */}
        <div className="sm:hidden absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/20 rounded-full"></div>
      </div>
    </div>
  );
};

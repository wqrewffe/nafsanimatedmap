import React from 'react';
import { GlobeIcon, PaintBrushIcon, PlayIcon } from '../Icons';

interface BottomNavProps {
  onPlannerClick: () => void;
  onSettingsClick: () => void;
  onAnimate: () => void;
  isProcessing: boolean;
  canAnimate: boolean;
  isRecording: boolean;
  animationMode: 'direct' | 'road' | 'border';
}

export const BottomNav: React.FC<BottomNavProps> = ({ 
  onPlannerClick, 
  onSettingsClick, 
  onAnimate,
  isProcessing,
  canAnimate,
  isRecording,
  animationMode,
}) => {
  const animateButtonText = () => {
    if (isProcessing) return "Processing...";
    if (animationMode === 'border') return "Trace";
    return "Animate";
  };
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900/80 backdrop-blur-lg border-t border-cyan-400/20 flex justify-around items-center h-20 z-30 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.5)]">
      <button 
        onClick={onPlannerClick} 
        className="flex flex-col items-center justify-center text-gray-300 hover:text-cyan-400 transition-colors p-2 rounded-lg"
        aria-label="Open planner"
      >
        <GlobeIcon className="h-7 w-7 mb-1" />
        <span className="text-xs font-semibold">Planner</span>
      </button>

      <button
        onClick={onAnimate}
        disabled={isProcessing || isRecording || !canAnimate}
        className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold h-16 w-16 rounded-full flex flex-col items-center justify-center transition-all duration-300 disabled:opacity-50 disabled:bg-gray-700 disabled:shadow-none shadow-[0_0_20px_rgba(6,182,212,0.7)] transform -translate-y-4"
        aria-label={animateButtonText()}
      >
        {isProcessing ? (
          <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <>
            <PlayIcon className="h-7 w-7" />
          </>
        )}
      </button>

      <button 
        onClick={onSettingsClick} 
        className="flex flex-col items-center justify-center text-gray-300 hover:text-cyan-400 transition-colors p-2 rounded-lg"
        aria-label="Open settings"
      >
        <PaintBrushIcon className="h-7 w-7 mb-1" />
        <span className="text-xs font-semibold">Settings</span>
      </button>
    </nav>
  );
};
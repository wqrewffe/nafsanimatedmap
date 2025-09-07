import React from 'react';
import type { WaypointGroup, BorderGroup, ShortcutConfig } from '../../types';
import { AlertTriangleIcon, PlayIcon, PauseIcon, ReplayIcon, RecordIcon } from '../Icons';

interface ActionsPanelProps {
  onAnimate: () => void;
  isProcessing: boolean;
  error: string | null;
  animationMode: 'direct' | 'road' | 'border';
  waypointGroups: WaypointGroup[];
  borderGroups: BorderGroup[];
  isRecording: boolean;
  onStartRecording: () => void;
  setIsAnimationPaused: (isPaused: boolean) => void;
  isAnimationPaused: boolean;
  isAnimationActive: boolean;
  onReplay: () => void;
  isReplayable: boolean;
  shortcuts: ShortcutConfig;
}

export const ActionsPanel: React.FC<ActionsPanelProps> = ({
  onAnimate, isProcessing, error, animationMode, waypointGroups, borderGroups, isRecording, onStartRecording, setIsAnimationPaused, isAnimationPaused, isAnimationActive, onReplay, isReplayable, shortcuts
}) => {
  const canAnimateRoute = waypointGroups.some(g => g.waypoints.length >= 2);
  const canAnimateBorder = borderGroups.some(g => g.locations.length > 0);
  const canAnimate = (animationMode === 'direct' || animationMode === 'road') ? canAnimateRoute : canAnimateBorder;

  const formatShortcut = (keys: string[]) => keys.join(' + ');
  
  return (
    <div className="flex flex-col space-y-4 flex-shrink-0">
      <div className="flex items-center space-x-2">
        <button onClick={() => setIsAnimationPaused(!isAnimationPaused)} disabled={!isAnimationActive || isProcessing} className="flex-1 bg-gray-800/80 hover:bg-gray-700/80 border border-gray-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed" title={`Pause/Resume Animation (${formatShortcut(shortcuts.pauseAnimation.keys)})`}>
          {isAnimationPaused ? <PlayIcon className="h-5 w-5" /> : <PauseIcon className="h-5 w-5" />}
          <span>{isAnimationPaused ? 'Resume' : 'Pause'}</span>
        </button>
        <button onClick={onReplay} disabled={!isReplayable || isProcessing} className="flex-1 bg-gray-800/80 hover:bg-gray-700/80 border border-gray-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Replay last animation" title={`Replay Animation (${formatShortcut(shortcuts.replay.keys)})`}>
          <ReplayIcon className="h-5 w-5" />
          <span>Replay</span>
        </button>
      </div>
      
      <div className="space-y-3 pt-4 border-t border-gray-800">
          <h4 className="flex items-center text-sm font-medium text-gray-400">
              <RecordIcon className="h-4 w-4 mr-2" />
              Record Animation
          </h4>
            <p className="text-xs text-gray-400 text-center bg-gray-900/50 p-2 rounded-md border border-gray-700">
              Recording will capture the screen area. The mouse cursor will be hidden.
          </p>
          <button onClick={onStartRecording} disabled={isProcessing || isRecording} className="w-full font-bold py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed bg-gray-800/80 hover:bg-gray-700/80 border border-gray-600 text-white" title={`Record & Animate (${formatShortcut(shortcuts.startRecording.keys)})`}>
              <RecordIcon className="h-5 w-5" />
              <span>Record & Animate</span>
          </button>
      </div>
      
      {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg flex items-center">
            <AlertTriangleIcon className="h-5 w-5 mr-3"/>
            <span className="text-sm">{error}</span>
          </div>
      )}

      <div className="pt-4 border-t border-gray-800">
        <button onClick={onAnimate} disabled={isProcessing || isRecording || !canAnimate} className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-3 px-4 rounded-lg flex items-center justify-center space-x-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:shadow-none hover:shadow-[0_0_20px_rgba(6,182,212,0.7)]" title={`Generate & Animate (${formatShortcut(shortcuts.animate.keys)})`}>
          {isProcessing ? (<><svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span>Processing...</span></>) : (<><PlayIcon className="h-5 w-5" /><span>{animationMode === 'border' ? 'Trace Border' : animationMode === 'road' ? 'Animate Road Trip' : 'Animate Direct Paths'}</span></>)}
        </button>
      </div>
    </div>
  );
};
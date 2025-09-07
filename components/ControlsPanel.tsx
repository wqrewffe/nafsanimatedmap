import React from 'react';
import type { WaypointGroup, CinematicZoomStyle, AnimationPathStyle, BorderGroup, CompletedBorder, ShortcutConfig } from '../types';
import { PlannerPanel } from './panels/PlannerPanel';
import { SettingsPanel } from './panels/SettingsPanel';
import { ActionsPanel } from './panels/ActionsPanel';


interface ControlsPanelProps {
  waypointGroups: WaypointGroup[];
  setWaypointGroups: React.Dispatch<React.SetStateAction<WaypointGroup[]>>;
  onAnimate: () => void;
  isProcessing: boolean;
  error: string | null;
  setError: (error: string | null) => void;
  animationSpeed: number;
  setAnimationSpeed: (speed: number) => void;
  isAnimationPaused: boolean;
  setIsAnimationPaused: (isPaused: boolean) => void;
  isAnimationActive: boolean;
  mapStyleId: string;
  setMapStyleId: (id: string) => void;
  animationMode: 'direct' | 'road' | 'border';
  setAnimationMode: (mode: 'direct' | 'road' | 'border') => void;
  borderGroups: BorderGroup[];
  setBorderGroups: React.Dispatch<React.SetStateAction<BorderGroup[]>>;
  pathWeight: number;
  setPathWeight: (weight: number) => void;
  pathStyle: 'solid' | 'dashed';
  setPathStyle: (style: 'solid' | 'dashed') => void;
  pathOpacity: number;
  setPathOpacity: (opacity: number) => void;
  cinematicZoom: CinematicZoomStyle;
  setCinematicZoom: (style: CinematicZoomStyle) => void;
  animationStyle: AnimationPathStyle;
  setAnimationStyle: (style: AnimationPathStyle) => void;
  lookAhead: boolean;
  setLookAhead: (enabled: boolean) => void;
  onReplay: () => void;
  isReplayable: boolean;
  durationControlMode: 'speed' | 'time';
  setDurationControlMode: (mode: 'speed' | 'time') => void;
  totalDuration: number;
  setTotalDuration: (duration: number) => void;
  durationPerLocation: number;
  setDurationPerLocation: (duration: number) => void;
  borderTimeControlMode: 'uniform' | 'manual';
  setBorderTimeControlMode: (mode: 'uniform' | 'manual') => void;
  completedBorders: CompletedBorder[];
  onFlyTo: (bounds: [number, number, number, number]) => void;
  onFlyToCenter: (center: [number, number]) => void;
  isRecording: boolean;
  onStartRecording: () => void;
  shortcuts: ShortcutConfig;
}

export const ControlsPanel: React.FC<ControlsPanelProps> = (props) => {
  return (
    <aside className="w-full h-full bg-black/40 backdrop-blur-md border-r border-cyan-400/10 flex flex-col p-6 space-y-6 overflow-y-auto z-10">
      <PlannerPanel {...props} />
      
      <div className="flex-grow"></div> {/* Spacer */}

      <div className="space-y-6 border-t border-gray-700 pt-6">
        <h3 className="text-lg font-semibold text-gray-200 text-glow">Settings</h3>
        <SettingsPanel {...props} />
      </div>

      <ActionsPanel {...props} />
    </aside>
  );
};
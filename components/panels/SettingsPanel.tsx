import React from 'react';
import type { CinematicZoomStyle, AnimationPathStyle, CompletedBorder, ShortcutConfig } from '../../types';
import { GlobeIcon, PaintBrushIcon, VideoCameraIcon, FilmIcon, ForwardIcon, ClockIcon, CrosshairIcon, ZoomInIcon } from '../Icons';
import { MAP_STYLES } from '../../mapStyles';

interface SettingsPanelProps {
    mapStyleId: string;
    setMapStyleId: (id: string) => void;
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
    durationControlMode: 'speed' | 'time';
    setDurationControlMode: (mode: 'speed' | 'time') => void;
    totalDuration: number;
    setTotalDuration: (duration: number) => void;
    durationPerLocation: number;
    setDurationPerLocation: (duration: number) => void;
    borderTimeControlMode: 'uniform' | 'manual';
    setBorderTimeControlMode: (mode: 'uniform' | 'manual') => void;
    animationSpeed: number;
    setAnimationSpeed: (speed: number) => void;
    isAnimationActive: boolean;
    isProcessing: boolean;
    completedBorders: CompletedBorder[];
    onFlyTo: (bounds: [number, number, number, number]) => void;
    onFlyToCenter: (center: [number, number]) => void;
    animationMode: 'direct' | 'road' | 'border';
    shortcuts: ShortcutConfig;
}

const ZOOM_OPTIONS: { id: CinematicZoomStyle; label: string }[] = [ { id: 'none', label: 'None' }, { id: 'smooth', label: 'Smooth' }, { id: 'fly-to', label: 'Fly-To' }, { id: 'wide', label: 'Wide' }, { id: 'close-up', label: 'Close-Up' } ];
const ANIMATION_STYLE_OPTIONS: { id: AnimationPathStyle; label: string }[] = [ { id: 'draw', label: 'Draw' }, { id: 'flow', label: 'Flow' }, { id: 'pulse', label: 'Pulse' }, { id: 'comet', label: 'Comet' }, { id: 'reveal', label: 'Reveal' } ];

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  mapStyleId, setMapStyleId, pathWeight, setPathWeight, pathStyle, setPathStyle, pathOpacity, setPathOpacity, cinematicZoom, setCinematicZoom, animationStyle, setAnimationStyle, lookAhead, setLookAhead, durationControlMode, setDurationControlMode, totalDuration, setTotalDuration, durationPerLocation, setDurationPerLocation, borderTimeControlMode, setBorderTimeControlMode, animationSpeed, setAnimationSpeed, isAnimationActive, isProcessing, completedBorders, onFlyTo, onFlyToCenter, animationMode, shortcuts,
}) => {
  const baseSegmentButtonClass = "flex-1 text-center text-sm font-semibold rounded-md transition-colors py-1.5 px-2 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:z-10";
  const activeSegmentButtonClass = "bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.7)]";
  const inactiveSegmentButtonClass = "hover:bg-gray-800 text-gray-300";
  const isLookAheadEnabled = cinematicZoom === 'smooth' || cinematicZoom === 'close-up';

  const formatShortcut = (keys: string[]) => keys.join(' + ');

  return (
    <div className='space-y-4'>
        <div className='space-y-2'><label htmlFor="map-style-select" className="flex items-center text-sm font-medium text-gray-400"><GlobeIcon className="h-4 w-4 mr-2" />Map Style</label><select id="map-style-select" value={mapStyleId} onChange={(e) => setMapStyleId(e.target.value)} className="w-full bg-gray-900/50 border border-gray-600 rounded-md px-3 py-2 text-gray-200 focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(6,182,212,0.5)] outline-none transition-all duration-200 custom-select" title="Select Map Style">{MAP_STYLES.map(style => (<option key={style.id} value={style.id} className="bg-gray-800 text-white">{style.name}</option>))}</select></div>
        <div className='space-y-3'><label className="flex items-center text-sm font-medium text-gray-400"><VideoCameraIcon className="h-4 w-4 mr-2" />Cinematic Zoom</label><div className="flex flex-wrap gap-1 p-1 bg-gray-900/50 border border-gray-700 rounded-md">{ZOOM_OPTIONS.map(opt => (<button key={opt.id} onClick={() => setCinematicZoom(opt.id)} className={`${baseSegmentButtonClass} ${cinematicZoom === opt.id ? activeSegmentButtonClass : inactiveSegmentButtonClass}`} title={`Set zoom style to ${opt.label}`}>{opt.label}</button>))}</div></div>
        <div className={`space-y-2 transition-opacity duration-300 ${(animationMode !== 'direct' && animationMode !== 'road') || !isLookAheadEnabled ? 'opacity-50' : ''}`}><label className="flex items-center text-sm font-medium text-gray-400"><ForwardIcon className="h-4 w-4 mr-2" />Look Ahead Camera</label><label htmlFor="look-ahead-toggle" title="Toggle look-ahead camera" className={`flex items-center ${isLookAheadEnabled ? 'cursor-pointer' : 'cursor-not-allowed'}`}><div className="relative"><input id="look-ahead-toggle" type="checkbox" className="sr-only peer" checked={lookAhead} onChange={() => setLookAhead(!lookAhead)} disabled={!isLookAheadEnabled} /><div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div></div><span className="ml-3 text-gray-300 text-sm">Pans camera ahead</span></label></div>
        <div className="space-y-3 pt-4 border-t border-gray-800"><h4 className="flex items-center text-sm font-medium text-gray-400"><FilmIcon className="h-4 w-4 mr-2" />Animation Style</h4><div className="flex flex-wrap gap-1 p-1 bg-gray-900/50 border border-gray-700 rounded-md">{ANIMATION_STYLE_OPTIONS.map(opt => (<button key={opt.id} onClick={() => setAnimationStyle(opt.id)} className={`${baseSegmentButtonClass} ${animationStyle === opt.id ? activeSegmentButtonClass : inactiveSegmentButtonClass}`} title={`Set animation style to ${opt.label}`}>{opt.label}</button>))}</div></div>
        <div className="space-y-4 pt-4 border-t border-gray-800"><h4 className="flex items-center text-sm font-medium text-gray-400"><PaintBrushIcon className="h-4 w-4 mr-2" />Path Appearance</h4><div className="space-y-2"><label htmlFor="weight-slider" className="flex justify-between text-sm font-medium text-gray-400"><span>Path Weight</span><span>{pathWeight}px</span></label><input id="weight-slider" type="range" min="1" max="10" step="1" value={pathWeight} onChange={(e) => setPathWeight(parseInt(e.target.value, 10))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed accent-cyan-500" title="Adjust Path Weight" /></div><div className="space-y-2"><label htmlFor="opacity-slider" className="flex justify-between text-sm font-medium text-gray-400"><span>Path Opacity</span><span>{pathOpacity.toFixed(1)}</span></label><input id="opacity-slider" type="range" min="0" max="1" step="0.1" value={pathOpacity} onChange={(e) => setPathOpacity(parseFloat(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed accent-cyan-500" title="Adjust Path Opacity" /></div><div className="flex bg-gray-900/50 border border-gray-700 rounded-md"><button onClick={() => setPathStyle('solid')} className={`flex-1 py-2 text-sm font-semibold rounded-l-md transition-colors ${pathStyle === 'solid' ? 'bg-cyan-500 text-black' : 'hover:bg-gray-800'}`} title="Set path style to Solid">Solid</button><button onClick={() => setPathStyle('dashed')} className={`flex-1 py-2 text-sm font-semibold rounded-r-md transition-colors ${pathStyle === 'dashed' ? 'bg-cyan-500 text-black' : 'hover:bg-gray-800'}`} title="Set path style to Dashed">Dashed</button></div></div>
        {animationMode === 'border' && completedBorders.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-gray-800"><h4 className="flex items-center text-sm font-medium text-gray-400"><CrosshairIcon className="h-4 w-4 mr-2" />Focus on Location</h4><div className="space-y-2">{completedBorders.map((border, index) => { const focusShortcutKey = `focusLocation${index + 1}` as keyof ShortcutConfig; const zoomShortcutKey = `zoomToLocation${index + 1}` as keyof ShortcutConfig; if (index >= 3) return null; return (<div key={`${border.name}-${index}`} className="w-full text-left font-semibold text-gray-200 bg-gray-900/50 border border-gray-700 p-2 rounded-lg flex items-center justify-between"><div className="flex items-center space-x-3"><GlobeIcon className="h-4 w-4 text-cyan-400 flex-shrink-0 ml-1" /><span>{border.name}</span></div><div className="flex items-center space-x-2"><button onClick={() => onFlyTo(border.bounds)} className="p-2 rounded-md bg-gray-700 hover:bg-cyan-500 text-gray-300 hover:text-black transition-colors" title={`Fit ${border.name} to View (${formatShortcut(shortcuts[focusShortcutKey].keys)})`}><CrosshairIcon className="h-4 w-4" /></button><button onClick={() => onFlyToCenter(border.center)} className="p-2 rounded-md bg-gray-700 hover:bg-cyan-500 text-gray-300 hover:text-black transition-colors" title={`Zoom to Center of ${border.name} (${formatShortcut(shortcuts[zoomShortcutKey].keys)})`}><ZoomInIcon className="h-4 w-4" /></button></div></div>) })}</div></div>
        )}
        <div className="space-y-3 pt-4 border-t border-gray-800"><h4 className="flex items-center text-sm font-medium text-gray-400"><ClockIcon className="h-4 w-4 mr-2" />Animation Pacing</h4><div className="flex bg-gray-900/50 border border-gray-700 rounded-md"><button onClick={() => setDurationControlMode('speed')} className={`${baseSegmentButtonClass} ${durationControlMode === 'speed' ? activeSegmentButtonClass : inactiveSegmentButtonClass}`} title="Control animation by speed">By Speed</button><button onClick={() => setDurationControlMode('time')} className={`${baseSegmentButtonClass} ${durationControlMode === 'time' ? activeSegmentButtonClass : inactiveSegmentButtonClass}`} title="Control animation by total time">By Time</button></div>
            {durationControlMode === 'time' && (
                <div className="bg-gray-900/30 p-3 rounded-md border border-gray-800 space-y-3">
                    {(animationMode === 'direct' || animationMode === 'road') ? (<div className="space-y-2"><label htmlFor="total-duration" className="text-sm font-medium text-gray-400">Total Animation Time (s)</label><input id="total-duration" type="number" min="1" value={totalDuration} onChange={(e) => setTotalDuration(Math.max(1, parseInt(e.target.value, 10)))} className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-gray-200 focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400 outline-none" title="Set total animation duration in seconds" /></div>) : (<div className="space-y-3"><label className="text-sm font-medium text-gray-400">Time Control</label><div className="flex bg-gray-800/50 border border-gray-700 rounded-md"><button onClick={() => setBorderTimeControlMode('uniform')} className={`${baseSegmentButtonClass} ${borderTimeControlMode === 'uniform' ? activeSegmentButtonClass : inactiveSegmentButtonClass}`} title="Set a uniform time for each location">Uniform</button><button onClick={() => setBorderTimeControlMode('manual')} className={`${baseSegmentButtonClass} ${borderTimeControlMode === 'manual' ? activeSegmentButtonClass : inactiveSegmentButtonClass}`} title="Set time manually for each location">Manual</button></div>
                        {borderTimeControlMode === 'uniform' && (<div className="space-y-2 pt-2"><label htmlFor="duration-per-location" className="text-sm font-medium text-gray-400">Time Per Location (s)</label><input id="duration-per-location" type="number" min="1" value={durationPerLocation} onChange={(e) => setDurationPerLocation(Math.max(1, parseInt(e.target.value, 10)))} className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-gray-200 focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400 outline-none" title="Set uniform time per location in seconds" /></div>)}
                    </div>)}
                </div>
            )}
        </div>
        <div className={`space-y-2 pt-4 border-t border-gray-800 transition-opacity duration-300 ${durationControlMode === 'time' ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <label htmlFor="speed-slider" className="flex justify-between text-sm font-medium text-gray-400"><span>Animation Speed</span><span>{animationSpeed.toFixed(1)}x</span></label>
          <input id="speed-slider" type="range" min="0.5" max="3" step="0.1" value={animationSpeed} onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))} disabled={!isAnimationActive || isProcessing || durationControlMode === 'time'} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed accent-cyan-500" title="Animation Speed (scroll on map to adjust)" />
          <p className="text-xs text-center text-gray-500 pt-1">Tip: Scroll on map to adjust speed.</p>
        </div>
    </div>
  );
};
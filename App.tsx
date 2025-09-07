import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ControlsPanel } from './components/ControlsPanel';
import { MapDisplay } from './components/MapDisplay';
import { getCoordinatesForLocations, getBorderForLocation, getRouteForWaypoints } from './services/geminiService';
import type { WaypointGroup, WaypointWithCoords, WaypointGroupWithCoords, CinematicZoomStyle, AnimationPathStyle, BorderGroup, CompletedBorder, MapDisplayHandle, ShortcutConfig } from './types';
import { LogoIcon, KeyboardIcon, DotsVerticalIcon, XIcon } from './components/Icons';
import { ShortcutsModal } from './components/ShortcutsModal';
import { loadShortcutsFromLocalStorage, saveShortcutsToLocalStorage, DEFAULT_SHORTCUTS } from './config/shortcuts';
import { PlannerPanel } from './components/panels/PlannerPanel';
import { SettingsPanel } from './components/panels/SettingsPanel';
import { ActionsPanel } from './components/panels/ActionsPanel';

export const PATH_COLORS = ['#06b6d4', '#3b82f6', '#84cc16', '#f59e0b', '#ef4444', '#a855f7', '#ec4899', '#f97316'];

const App: React.FC = () => {
  const [waypointGroups, setWaypointGroups] = useState<WaypointGroup[]>([
    {
      id: '1',
      name: 'European Tour',
      color: PATH_COLORS[0],
      waypoints: [
        { id: '1', name: 'Eiffel Tower, Paris' },
        { id: '2', name: 'Colosseum, Rome' },
        { id: '3', name: 'Brandenburg Gate, Berlin' },
      ],
    },
  ]);
   const [borderGroups, setBorderGroups] = useState<BorderGroup[]>([
    {
      id: 'bg1',
      name: 'Iberian Peninsula',
      color: PATH_COLORS[1],
      locations: [{ name: 'Spain', type: 'name' }, { name: 'Portugal', type: 'name' }],
    },
  ]);
  const [groupsWithCoords, setGroupsWithCoords] = useState<WaypointGroupWithCoords[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [animationKey, setAnimationKey] = useState<number>(0);
  const [animationSpeed, setAnimationSpeed] = useState<number>(1);
  const [isAnimationPaused, setIsAnimationPaused] = useState<boolean>(false);
  const [mapStyleId, setMapStyleId] = useState<string>('carto-dark');
  const [animationMode, setAnimationMode] = useState<'direct' | 'road' | 'border'>('direct');
  const [cinematicZoom, setCinematicZoom] = useState<CinematicZoomStyle>('smooth');
  const [replayData, setReplayData] = useState<WaypointGroupWithCoords[] | null>(null);
  const [completedBorders, setCompletedBorders] = useState<CompletedBorder[]>([]);
  const [flyToTarget, setFlyToTarget] = useState<{ bounds: [number, number, number, number] } | { center: [number, number]; zoom: number } | null>(null);
  const [animationStyle, setAnimationStyle] = useState<AnimationPathStyle>('draw');
  const [lookAhead, setLookAhead] = useState<boolean>(true);
  const [pathWeight, setPathWeight] = useState<number>(5);
  const [pathStyle, setPathStyle] = useState<'solid' | 'dashed'>('solid');
  const [pathOpacity, setPathOpacity] = useState<number>(1);
  const [durationControlMode, setDurationControlMode] = useState<'speed' | 'time'>('speed');
  const [totalDuration, setTotalDuration] = useState<number>(30);
  const [durationPerLocation, setDurationPerLocation] = useState<number>(15);
  const [borderTimeControlMode, setBorderTimeControlMode] = useState<'uniform' | 'manual'>('uniform');
  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingPaused, setIsRecordingPaused] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  
  const mapDisplayRef = useRef<MapDisplayHandle>(null);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [shortcuts, setShortcuts] = useState<ShortcutConfig>(loadShortcutsFromLocalStorage);
  const [isMobileControlsOpen, setIsMobileControlsOpen] = useState(false);


  const handleSaveShortcuts = (newShortcuts: ShortcutConfig) => {
    setShortcuts(newShortcuts);
    saveShortcutsToLocalStorage(newShortcuts);
  };

  const isAnimationActive = groupsWithCoords.length > 0;
  const canAnimateRoute = waypointGroups.some(g => g.waypoints.length >= 2);
  const canAnimateBorder = borderGroups.some(g => g.locations.length > 0);
  const canAnimate = (animationMode === 'direct' || animationMode === 'road') ? canAnimateRoute : canAnimateBorder;

  const handleAnimate = useCallback(async () => {
    setIsProcessing(true);
    setError(null);
    setGroupsWithCoords([]);
    setReplayData(null);
    setIsAnimationPaused(false);
    setCompletedBorders([]);
    setIsMobileControlsOpen(false); // Close mobile panel on animate

    try {
      let groupsWithCoordsData: WaypointGroupWithCoords[] = [];
      const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

      if (animationMode === 'direct' || animationMode === 'road') {
        const validGroups = waypointGroups.filter(g => g.waypoints.length >= 2);
        if (validGroups.length === 0) {
          throw new Error('Please add at least one group with two or more locations to create a route.');
        }
        const allWaypoints = validGroups.flatMap(g => g.waypoints);
        const locationNames = allWaypoints.map(wp => wp.name);
        const coordsWithDetails = await getCoordinatesForLocations(locationNames);
        const initialGroupsWithCoords = validGroups.map(group => {
            const waypointsForGroup = group.waypoints.map(wp => {
                const coordData = coordsWithDetails.find(c => c.name === wp.name);
                if (coordData && coordData.lat !== undefined && coordData.lng !== undefined) {
                    return { ...wp, lat: coordData.lat, lng: coordData.lng };
                }
                return null;
            }).filter((wp): wp is WaypointWithCoords => wp !== null);
            if (waypointsForGroup.length < 2) return null;
            return { ...group, waypoints: waypointsForGroup };
        }).filter((g): g is WaypointGroupWithCoords => g !== null);
        if (initialGroupsWithCoords.length === 0) {
            throw new Error("Could not find coordinates for enough locations to form any path.");
        }
        if (animationMode === 'road') {
            const routedGroups: WaypointGroupWithCoords[] = [];
            for (let i = 0; i < initialGroupsWithCoords.length; i++) {
                const group = initialGroupsWithCoords[i];
                const routeWaypoints = await getRouteForWaypoints(group.waypoints);
                routedGroups.push({ ...group, waypoints: routeWaypoints, userWaypoints: group.waypoints });
                if (i < initialGroupsWithCoords.length - 1) await delay(500);
            }
            groupsWithCoordsData = routedGroups;
        } else {
            groupsWithCoordsData = initialGroupsWithCoords.map(group => ({ ...group, userWaypoints: group.waypoints }));
        }
      } else {
        const validGroups = borderGroups.filter(g => g.locations.length > 0);
        if (validGroups.length === 0) {
          throw new Error('Please add at least one group with a country or city name.');
        }
        const newCompletedBorders: CompletedBorder[] = [];
        for (const group of validGroups) {
          for (let i = 0; i < group.locations.length; i++) {
            const location = group.locations[i];
            try {
              const { waypoints, bounds, center } = await getBorderForLocation(location);
              if (waypoints.length < 2) continue;
              newCompletedBorders.push({ name: location.name, bounds, center });
              groupsWithCoordsData.push({
                id: `${group.id}-${i}`, name: `${group.name}: ${location.name}`, color: group.color, waypoints: waypoints,
                duration: (borderTimeControlMode === 'manual' && location.duration) ? location.duration * 1000 : undefined,
              });
            } catch (err) {
               console.warn(`Skipping border for "${location.name}" in group "${group.name}" due to error:`, err);
            }
            if (i < group.locations.length - 1) await delay(1000);
          }
        }
        if (groupsWithCoordsData.length === 0) {
            throw new Error(`Could not generate a border path for any of the provided locations.`);
        }
        setCompletedBorders(newCompletedBorders);
      }
      setGroupsWithCoords(groupsWithCoordsData);
      setReplayData(groupsWithCoordsData);
      setAnimationKey(prevKey => prevKey + 1);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsProcessing(false);
    }
  }, [waypointGroups, borderGroups, animationMode, borderTimeControlMode]);
  
  const handleReplay = useCallback(() => {
    if (replayData) {
        setError(null);
        setIsAnimationPaused(false);
        setGroupsWithCoords(replayData);
        setAnimationKey(prevKey => prevKey + 1);
        setIsMobileControlsOpen(false);
    }
  }, [replayData]);

  const handleFlyTo = useCallback((bounds: [number, number, number, number]) => {
    setFlyToTarget({ bounds });
  }, []);

  const handleFlyToCenter = useCallback((center: [number, number]) => {
    setFlyToTarget({ center: center, zoom: 8 });
  }, []);

  const onFlyToComplete = () => setFlyToTarget(null);

  const handleStopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && (recorder.state === 'recording' || recorder.state === 'paused')) {
        recorder.stop();
        recorder.stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
        setIsRecordingPaused(false);
        mediaRecorderRef.current = null;
        document.body.classList.remove('recording-active');
        if (document.fullscreenElement) document.exitFullscreen();
    }
  }, []);

  const handlePauseRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.pause();
        setIsRecordingPaused(true);
    }
  }, []);

  const handleResumeRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'paused') {
        mediaRecorderRef.current.resume();
        setIsRecordingPaused(false);
    }
  }, []);

  const handleStartRecording = useCallback(async () => {
    try {
        const docEl = document.documentElement as any;
        if (docEl.requestFullscreen) await docEl.requestFullscreen();
        else if (docEl.mozRequestFullScreen) await docEl.mozRequestFullScreen();
        else if (docEl.webkitRequestFullscreen) await docEl.webkitRequestFullscreen();
        else if (docEl.msRequestFullscreen) await docEl.msRequestFullscreen();
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const stream = await navigator.mediaDevices.getDisplayMedia({
            video: { frameRate: { ideal: 30 }, cursor: 'never' } as any, audio: false,
        });

        let options = { mimeType: 'video/webm; codecs=vp9' };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) options = { mimeType: 'video/webm' };

        const recorder = new MediaRecorder(stream, options);
        mediaRecorderRef.current = recorder;
        recordedChunksRef.current = [];

        recorder.ondataavailable = (event) => { if (event.data.size > 0) recordedChunksRef.current.push(event.data); };
        recorder.onstop = () => {
            const blob = new Blob(recordedChunksRef.current, { type: options.mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none'; a.href = url;
            a.download = `map-animation-${new Date().toISOString().slice(0, 19).replace('T', '_').replace(/:/g, '-')}.webm`;
            document.body.appendChild(a); a.click();
            window.URL.revokeObjectURL(url); document.body.removeChild(a);
        };
        stream.getVideoTracks()[0].onended = handleStopRecording;

        recorder.start();
        setIsRecording(true);
        setIsRecordingPaused(false);
        document.body.classList.add('recording-active');
        setTimeout(() => { handleAnimate(); }, 100);
    } catch (err) {
        console.error("Error starting screen recording:", err);
        if (document.fullscreenElement) document.exitFullscreen();
        setError(err instanceof DOMException && err.name === 'NotAllowedError' ? "Screen recording permission was denied." : "Could not start screen recording.");
    }
  }, [handleStopRecording, handleAnimate]);
  
    const addGroup = useCallback(() => {
      const nextColor = PATH_COLORS[waypointGroups.length % PATH_COLORS.length];
      const newGroup = { id: Date.now().toString(), name: `Trip ${waypointGroups.length + 1}`, color: nextColor, waypoints: [] };
      setWaypointGroups(current => [...current, newGroup]);
    }, [waypointGroups.length]);
    const addBorderGroup = useCallback(() => {
      const nextColor = PATH_COLORS[(waypointGroups.length + borderGroups.length) % PATH_COLORS.length];
      const newGroup = { id: Date.now().toString(), name: `Border Group ${borderGroups.length + 1}`, color: nextColor, locations: [] };
      setBorderGroups(current => [...current, newGroup]);
    }, [waypointGroups.length, borderGroups.length]);

    const onAnimateRef = useRef(handleAnimate); useEffect(() => { onAnimateRef.current = handleAnimate; }, [handleAnimate]);
    const onStartRecordingRef = useRef(handleStartRecording); useEffect(() => { onStartRecordingRef.current = handleStartRecording; }, [handleStartRecording]);
    const onReplayRef = useRef(handleReplay); useEffect(() => { onReplayRef.current = handleReplay; }, [handleReplay]);

    useEffect(() => {
        const isShortcutPressed = (event: KeyboardEvent, keys: string[]): boolean => {
            if (!keys || keys.length === 0) return false;
            const lowerCaseKeys = keys.map(k => k.toLowerCase());
            const mainKey = lowerCaseKeys[lowerCaseKeys.length - 1];
            let keyMatch = false;
            if (mainKey === 'space') { keyMatch = event.code === 'Space'; } 
            else if (mainKey === 'enter') { keyMatch = event.key === 'Enter'; } 
            else { keyMatch = event.key.toLowerCase() === mainKey; }
            if (!keyMatch) return false;
            const ctrlCmdPressed = event.ctrlKey || event.metaKey;
            const altPressed = event.altKey;
            const shiftPressed = event.shiftKey;
            const expectsCtrlCmd = lowerCaseKeys.includes('ctrl') || lowerCaseKeys.includes('cmd');
            const expectsAlt = lowerCaseKeys.includes('alt');
            const expectsShift = lowerCaseKeys.includes('shift');
            return ctrlCmdPressed === expectsCtrlCmd && altPressed === expectsAlt && shiftPressed === expectsShift;
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;
            const checkAndExecute = (shortcut: keyof ShortcutConfig, action: () => void) => {
                if (isShortcutPressed(e, shortcuts[shortcut].keys)) { e.preventDefault(); action(); }
            };
            if (isRecording) {
                checkAndExecute('pauseRecording', () => isRecordingPaused ? handleResumeRecording() : handlePauseRecording());
                checkAndExecute('stopRecording', handleStopRecording);
                return;
            }
            checkAndExecute('zoomIn', () => mapDisplayRef.current?.zoomIn());
            checkAndExecute('zoomOut', () => mapDisplayRef.current?.zoomOut());
            checkAndExecute('animate', onAnimateRef.current);
            if (isAnimationActive) checkAndExecute('pauseAnimation', () => setIsAnimationPaused(p => !p));
            if (replayData) checkAndExecute('replay', onReplayRef.current);
            checkAndExecute('startRecording', onStartRecordingRef.current);
            checkAndExecute('switchDirectMode', () => setAnimationMode('direct'));
            checkAndExecute('switchRoadMode', () => setAnimationMode('road'));
            checkAndExecute('switchBorderMode', () => setAnimationMode('border'));
            checkAndExecute('addNewGroup', () => (animationMode === 'border' ? addBorderGroup() : addGroup()));
            if (animationMode === 'border' && completedBorders.length > 0) {
              const focusActions: ([keyof ShortcutConfig, () => void])[] = [
                ['focusLocation1', () => completedBorders[0] && handleFlyTo(completedBorders[0].bounds)],
                ['focusLocation2', () => completedBorders[1] && handleFlyTo(completedBorders[1].bounds)],
                ['focusLocation3', () => completedBorders[2] && handleFlyTo(completedBorders[2].bounds)],
                ['zoomToLocation1', () => completedBorders[0] && handleFlyToCenter(completedBorders[0].center)],
                ['zoomToLocation2', () => completedBorders[1] && handleFlyToCenter(completedBorders[1].center)],
                ['zoomToLocation3', () => completedBorders[2] && handleFlyToCenter(completedBorders[2].center)],
              ];
              focusActions.forEach(([key, action]) => checkAndExecute(key, action));
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [shortcuts, isRecording, isRecordingPaused, isAnimationActive, replayData, animationMode, completedBorders, addGroup, addBorderGroup, handleResumeRecording, handlePauseRecording, handleStopRecording, handleFlyTo, handleFlyToCenter]);

    useEffect(() => {
        if (isMobileControlsOpen) { document.body.style.overflow = 'hidden'; } 
        else { document.body.style.overflow = ''; }
        return () => { document.body.style.overflow = ''; };
    }, [isMobileControlsOpen]);

  if (isRecording) {
    return (
      <div className="w-screen h-screen bg-black relative">
        <MapDisplay ref={mapDisplayRef} groups={groupsWithCoords} key={animationKey} animationSpeed={animationSpeed} setAnimationSpeed={setAnimationSpeed} isAnimationPaused={isAnimationPaused} mapStyleId={mapStyleId} showMarkers={animationMode === 'direct' || animationMode === 'road'} pathWeight={pathWeight} pathStyle={pathStyle} pathOpacity={pathOpacity} cinematicZoom={cinematicZoom} animationStyle={animationStyle} lookAhead={lookAhead} durationControlMode={durationControlMode} totalDuration={totalDuration} durationPerLocation={durationPerLocation} flyToTarget={flyToTarget} onFlyToComplete={onFlyToComplete}/>
      </div>
    );
  }

  const panelProps = { waypointGroups, setWaypointGroups, onAnimate: handleAnimate, isProcessing, error, setError, animationSpeed, setAnimationSpeed, isAnimationPaused, setIsAnimationPaused, isAnimationActive, mapStyleId, setMapStyleId, animationMode, setAnimationMode, borderGroups, setBorderGroups, pathWeight, setPathWeight, pathStyle, setPathStyle, pathOpacity, setPathOpacity, cinematicZoom, setCinematicZoom, animationStyle, setAnimationStyle, lookAhead, setLookAhead, onReplay: handleReplay, isReplayable: replayData !== null, durationControlMode, setDurationControlMode, totalDuration, setTotalDuration, durationPerLocation, setDurationPerLocation, borderTimeControlMode, setBorderTimeControlMode, completedBorders, onFlyTo: handleFlyTo, onFlyToCenter: handleFlyToCenter, isRecording, onStartRecording: handleStartRecording, shortcuts };

  return (
    <div className="bg-black text-gray-200 h-screen flex flex-col font-sans">
      <header className="bg-black/30 backdrop-blur-md border-b border-cyan-400/20 p-4 shadow-lg z-20 flex items-center justify-between">
        <div className="flex items-center">
            <LogoIcon className="h-8 w-8 text-cyan-400 mr-3 text-glow" />
            <h1 className="text-xl md:text-2xl font-bold tracking-wider text-gray-100 text-glow">Map Animator AI</h1>
        </div>
        <div className="flex items-center space-x-2">
            <button onClick={() => setIsShortcutsModalOpen(true)} className="hidden md:block p-2 rounded-full text-gray-400 hover:text-cyan-400 hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400/50" title="View Keyboard Shortcuts" aria-label="View Keyboard Shortcuts">
                <KeyboardIcon className="h-6 w-6" />
            </button>
            <button onClick={() => setIsMobileControlsOpen(true)} className="md:hidden p-2 rounded-full text-gray-400 hover:text-cyan-400 hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400/50" title="Open Controls" aria-label="Open Controls">
                <DotsVerticalIcon className="h-6 w-6" />
            </button>
        </div>
      </header>
      
      <div className="flex-grow flex flex-col md:flex-row overflow-hidden relative z-10">
        <div className="hidden md:flex md:w-[450px] flex-shrink-0 flex-col">
          <ControlsPanel {...panelProps} />
        </div>
        <main className="flex-grow h-full w-full">
          <MapDisplay ref={mapDisplayRef} groups={groupsWithCoords} key={animationKey} animationSpeed={animationSpeed} setAnimationSpeed={setAnimationSpeed} isAnimationPaused={isAnimationPaused} mapStyleId={mapStyleId} showMarkers={animationMode === 'direct' || animationMode === 'road'} pathWeight={pathWeight} pathStyle={pathStyle} pathOpacity={pathOpacity} cinematicZoom={cinematicZoom} animationStyle={animationStyle} lookAhead={lookAhead} durationControlMode={durationControlMode} totalDuration={totalDuration} durationPerLocation={durationPerLocation} flyToTarget={flyToTarget} onFlyToComplete={onFlyToComplete} />
        </main>
      </div>

      {/* Mobile Controls Overlay and Backdrop */}
      <div 
          className={`mobile-controls-backdrop ${isMobileControlsOpen ? 'visible' : ''}`}
          onClick={() => setIsMobileControlsOpen(false)}
          aria-hidden="true"
      />
      <div className={`mobile-controls-overlay ${isMobileControlsOpen ? 'visible' : ''}`} role="dialog" aria-modal="true" aria-labelledby="mobile-controls-title">
          <header className="mobile-controls-header">
              <h2 id="mobile-controls-title" className="text-xl font-bold text-gray-100 text-glow">Controls</h2>
              <button onClick={() => setIsMobileControlsOpen(false)} className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 transition-colors" aria-label="Close controls">
                  <XIcon className="h-6 w-6" />
              </button>
          </header>
          <div className="mobile-controls-content space-y-8">
              <PlannerPanel {...panelProps} />
              <div className="space-y-6 border-t border-gray-700 pt-6">
                  <h3 className="text-lg font-semibold text-gray-200 text-glow">Settings</h3>
                  <SettingsPanel {...panelProps} />
              </div>
              <ActionsPanel {...panelProps} />
          </div>
      </div>

      <ShortcutsModal isOpen={isShortcutsModalOpen} onClose={() => setIsShortcutsModalOpen(false)} shortcuts={shortcuts} onSave={handleSaveShortcuts} defaultShortcuts={DEFAULT_SHORTCUTS} />
    </div>
  );
};

export default App;
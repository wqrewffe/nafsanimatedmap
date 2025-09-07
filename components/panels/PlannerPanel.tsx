import React, { useState, useRef, useEffect } from 'react';
import type { Waypoint, WaypointGroup, BorderGroup, BorderLocation, ShortcutConfig } from '../../types';
import { PlusIcon, TrashIcon, MapPinIcon, GlobeIcon, ChevronDownIcon, RoadIcon, MailIcon } from '../Icons';
import { PATH_COLORS } from '../../App';

interface PlannerPanelProps {
  waypointGroups: WaypointGroup[];
  setWaypointGroups: React.Dispatch<React.SetStateAction<WaypointGroup[]>>;
  isProcessing: boolean;
  setError: (error: string | null) => void;
  animationMode: 'direct' | 'road' | 'border';
  setAnimationMode: (mode: 'direct' | 'road' | 'border') => void;
  borderGroups: BorderGroup[];
  setBorderGroups: React.Dispatch<React.SetStateAction<BorderGroup[]>>;
  durationControlMode: 'speed' | 'time';
  borderTimeControlMode: 'uniform' | 'manual';
  durationPerLocation: number;
  shortcuts: ShortcutConfig;
}

export const PlannerPanel: React.FC<PlannerPanelProps> = ({
  waypointGroups,
  setWaypointGroups,
  isProcessing,
  setError,
  animationMode,
  setAnimationMode,
  borderGroups,
  setBorderGroups,
  durationControlMode,
  borderTimeControlMode,
  durationPerLocation,
  shortcuts,
}) => {
  const [newWaypointNames, setNewWaypointNames] = useState<{ [groupId: string]: string }>({});
  const [newBorderLocationNames, setNewBorderLocationNames] = useState<{ [groupId: string]: string }>({});
  const [openGroupId, setOpenGroupId] = useState<string | null>(waypointGroups[0]?.id || borderGroups[0]?.id || null);
  const [borderInputMode, setBorderInputMode] = useState<'name' | 'postal'>('name');
  const [openColorPickerId, setOpenColorPickerId] = useState<string | null>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
            setOpenColorPickerId(null);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const updateGroupColor = (groupId: string, newColor: string) => {
    setWaypointGroups(groups => groups.map(g => g.id === groupId ? { ...g, color: newColor } : g));
    setOpenColorPickerId(null);
  };

  const updateBorderGroupColor = (groupId: string, newColor: string) => {
      setBorderGroups(groups => groups.map(g => g.id === groupId ? { ...g, color: newColor } : g));
      setOpenColorPickerId(null);
  };

  const addGroup = () => {
    const nextColor = PATH_COLORS[(waypointGroups.length + borderGroups.length) % PATH_COLORS.length];
    const newGroup: WaypointGroup = {
      id: new Date().getTime().toString(),
      name: `Trip ${waypointGroups.length + 1}`,
      color: nextColor,
      waypoints: [],
    };
    setWaypointGroups(current => [...current, newGroup]);
    setOpenGroupId(newGroup.id);
  };

  const removeGroup = (groupId: string) => {
    setWaypointGroups(waypointGroups.filter(g => g.id !== groupId));
  };
  
  const updateGroupName = (groupId: string, newName: string) => {
    setWaypointGroups(waypointGroups.map(g => g.id === groupId ? { ...g, name: newName } : g));
  };

  const addWaypoint = (groupId: string) => {
    const waypointName = newWaypointNames[groupId]?.trim();
    if (waypointName) {
      const newWaypoint: Waypoint = { id: new Date().getTime().toString(), name: waypointName };
      setWaypointGroups(waypointGroups.map(group => {
        if (group.id === groupId) return { ...group, waypoints: [...group.waypoints, newWaypoint] };
        return group;
      }));
      setNewWaypointNames({ ...newWaypointNames, [groupId]: '' });
      setError(null);
    }
  };

  const removeWaypoint = (groupId: string, waypointId: string) => {
    setWaypointGroups(waypointGroups.map(group => {
      if (group.id === groupId) return { ...group, waypoints: group.waypoints.filter(wp => wp.id !== waypointId) };
      return group;
    }));
  };
  
  const handleWaypointInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, groupId: string) => {
    if (e.key === 'Enter') { e.preventDefault(); addWaypoint(groupId); }
  }

  const addBorderGroup = () => {
    const nextColor = PATH_COLORS[(waypointGroups.length + borderGroups.length) % PATH_COLORS.length];
    const newGroup: BorderGroup = {
      id: new Date().getTime().toString(),
      name: `Border Group ${borderGroups.length + 1}`,
      color: nextColor,
      locations: [],
    };
    setBorderGroups(current => [...current, newGroup]);
    setOpenGroupId(newGroup.id);
  };

  const removeBorderGroup = (groupId: string) => {
    setBorderGroups(borderGroups.filter(g => g.id !== groupId));
  };

  const updateBorderGroupName = (groupId: string, newName: string) => {
    setBorderGroups(borderGroups.map(g => (g.id === groupId ? { ...g, name: newName } : g)));
  };

  const addBorderLocation = (groupId: string) => {
    const locationName = newBorderLocationNames[groupId]?.trim();
    if (locationName) {
      const newLocation: BorderLocation = { name: locationName, type: borderInputMode };
      setBorderGroups(borderGroups.map(group => {
        if (group.id === groupId) return { ...group, locations: [...group.locations, newLocation] };
        return group;
      }));
      setNewBorderLocationNames({ ...newBorderLocationNames, [groupId]: '' });
      setError(null);
    }
  };

  const removeBorderLocation = (groupId: string, locationIndexToRemove: number) => {
    setBorderGroups(borderGroups.map(group => {
      if (group.id === groupId) return { ...group, locations: group.locations.filter((_, index) => index !== locationIndexToRemove) };
      return group;
    }));
  };

  const updateBorderLocationDuration = (groupId: string, locationIndex: number, newDurationStr: string) => {
    const newDuration = parseInt(newDurationStr, 10);
    setBorderGroups(currentGroups => currentGroups.map(group => {
        if (group.id === groupId) {
            const newLocations = [...group.locations];
            newLocations[locationIndex] = { ...newLocations[locationIndex], duration: isNaN(newDuration) || newDuration < 1 ? undefined : newDuration };
            return { ...group, locations: newLocations };
        }
        return group;
    }));
  };

  const handleBorderLocationInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, groupId: string) => {
    if (e.key === 'Enter') { e.preventDefault(); addBorderLocation(groupId); }
  };

  const formatShortcut = (keys: string[]) => keys.join(' + ');

  const baseTabClass = "flex-1 py-2.5 text-center font-semibold border-b-2 transition-all duration-200 focus:outline-none flex items-center justify-center space-x-2";
  const activeTabClass = "text-cyan-400 border-cyan-400 text-glow";
  const inactiveTabClass = "text-gray-400 border-gray-700 hover:text-gray-200 hover:border-gray-500";
  
  return (
    <div>
      <h2 id="planner-title" className="text-xl font-semibold text-gray-100 mb-4 text-glow">Route Planner</h2>
      
      <div className="flex mb-4 rounded-lg bg-gray-900/50 border border-gray-700">
          <button onClick={() => setAnimationMode('direct')} className={`${baseTabClass} rounded-l-md ${animationMode === 'direct' ? activeTabClass : inactiveTabClass}`} title={`Direct Path (${formatShortcut(shortcuts.switchDirectMode.keys)})`}>
              <MapPinIcon className="h-5 w-5" /> <span>Direct Path</span>
          </button>
          <button onClick={() => setAnimationMode('road')} className={`${baseTabClass} ${animationMode === 'road' ? activeTabClass : inactiveTabClass}`} title={`Road Trip (${formatShortcut(shortcuts.switchRoadMode.keys)})`}>
              <RoadIcon className="h-5 w-5" /> <span>Road Trip</span>
          </button>
          <button onClick={() => setAnimationMode('border')} className={`${baseTabClass} rounded-r-md ${animationMode === 'border' ? activeTabClass : inactiveTabClass}`} title={`By Border (${formatShortcut(shortcuts.switchBorderMode.keys)})`}>
              <GlobeIcon className="h-5 w-5" /> <span>By Border</span>
          </button>
      </div>

      {(animationMode === 'direct' || animationMode === 'road') ? (
        <div className="space-y-3">
          <div className="space-y-2 max-h-80 overflow-y-auto pr-2 -mr-2">
          {waypointGroups.map((group) => {
            const isOpen = openGroupId === group.id;
            return (
              <div key={group.id} className="bg-gray-900/50 border border-gray-700 rounded-lg">
                <div role="button" tabIndex={0} onClick={() => setOpenGroupId(isOpen ? null : group.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpenGroupId(isOpen ? null : group.id); } }} className="w-full flex items-center justify-between p-3 text-left font-semibold cursor-pointer">
                  <div className="flex items-center">
                    <div className="relative mr-3">
                        <button onClick={(e) => { e.stopPropagation(); setOpenColorPickerId(openColorPickerId === group.id ? null : group.id); }} className="w-4 h-4 rounded-full cursor-pointer ring-2 ring-transparent hover:ring-white transition-all focus:outline-none focus:ring-cyan-400" style={{ backgroundColor: group.color }} title="Change trip color"/>
                        {openColorPickerId === group.id && (<div ref={colorPickerRef} className="absolute z-20 top-full mt-2 left-0 bg-gray-800 border border-gray-600 rounded-lg p-2 grid grid-cols-4 gap-2 shadow-lg">{PATH_COLORS.map(color => (<button key={color} onClick={() => updateGroupColor(group.id, color)} className="w-6 h-6 rounded-full cursor-pointer transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white" style={{ backgroundColor: color }} aria-label={`Set color to ${color}`} />))}</div>)}
                    </div>
                    <input type="text" value={group.name} onChange={(e) => updateGroupName(group.id, e.target.value)} onClick={(e) => e.stopPropagation()} className="bg-transparent text-gray-200 font-semibold focus:ring-1 focus:ring-cyan-500 focus:bg-gray-800 rounded px-1" title="Edit trip name" />
                  </div>
                  <div className="flex items-center"><span className="text-xs text-gray-500 mr-3">{group.waypoints.length} stops</span><button onClick={(e) => { e.stopPropagation(); removeGroup(group.id); }} className="text-gray-500 hover:text-red-400 transition duration-200 disabled:opacity-50" disabled={isProcessing} title="Delete trip"><TrashIcon className="h-4 w-4" /></button><ChevronDownIcon className={`h-5 w-5 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} /></div>
                </div>
                {isOpen && (
                  <div className="p-4 border-t border-gray-800 space-y-3">
                    <div className="flex space-x-2"><input type="text" value={newWaypointNames[group.id] || ''} onChange={(e) => setNewWaypointNames({...newWaypointNames, [group.id]: e.target.value})} onKeyDown={(e) => handleWaypointInputKeyDown(e, group.id)} placeholder="e.g., 'Tokyo Tower, Japan'" className="flex-grow bg-gray-800 border border-gray-600 rounded-md px-4 py-2 text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400 outline-none transition-all duration-200" disabled={isProcessing} title="Enter a new location and press Enter" /><button onClick={() => addWaypoint(group.id)} className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold p-2 rounded-md flex items-center justify-center transition-all duration-200 disabled:bg-gray-700 disabled:cursor-not-allowed" disabled={isProcessing || !(newWaypointNames[group.id] || '').trim()} title="Add location to trip"><PlusIcon className="h-5 w-5" /></button></div>
                    <div className="space-y-2">{group.waypoints.map(waypoint => (<div key={waypoint.id} className="flex items-center bg-gray-800/60 p-2 rounded-md"><MapPinIcon className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" /><span className="flex-grow text-gray-300 text-sm truncate">{waypoint.name}</span><button onClick={() => removeWaypoint(group.id, waypoint.id)} className="ml-2 text-gray-500 hover:text-red-400 transition duration-200 disabled:opacity-50" disabled={isProcessing} title={`Remove ${waypoint.name}`}><TrashIcon className="h-4 w-4" /></button></div>))}{group.waypoints.length === 0 && <p className="text-center text-sm text-gray-500 py-2">Add a location to this trip.</p>}</div>
                  </div>
                )}
              </div>
            )
          })}
          </div>
          <button onClick={addGroup} className="w-full bg-gray-800/80 hover:bg-gray-700/80 border border-gray-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed" disabled={isProcessing} title={`Add New Trip (${formatShortcut(shortcuts.addNewGroup.keys)})`}><PlusIcon className="h-5 w-5" /><span>Add New Trip</span></button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="space-y-2 max-h-80 overflow-y-auto pr-2 -mr-2">
          {borderGroups.map((group) => {
            const isOpen = openGroupId === group.id;
            return (
              <div key={group.id} className="bg-gray-900/50 border border-gray-700 rounded-lg">
                <div role="button" tabIndex={0} onClick={() => setOpenGroupId(isOpen ? null : group.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpenGroupId(isOpen ? null : group.id); } }} className="w-full flex items-center justify-between p-3 text-left font-semibold cursor-pointer">
                  <div className="flex items-center">
                    <div className="relative mr-3">
                        <button onClick={(e) => { e.stopPropagation(); setOpenColorPickerId(openColorPickerId === group.id ? null : group.id); }} className="w-4 h-4 rounded-full cursor-pointer ring-2 ring-transparent hover:ring-white transition-all focus:outline-none focus:ring-cyan-400" style={{ backgroundColor: group.color }} title="Change group color"/>
                        {openColorPickerId === group.id && (<div ref={colorPickerRef} className="absolute z-20 top-full mt-2 left-0 bg-gray-800 border border-gray-600 rounded-lg p-2 grid grid-cols-4 gap-2 shadow-lg">{PATH_COLORS.map(color => (<button key={color} onClick={() => updateBorderGroupColor(group.id, color)} className="w-6 h-6 rounded-full cursor-pointer transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white" style={{ backgroundColor: color }} aria-label={`Set color to ${color}`} />))}</div>)}
                    </div>
                    <input type="text" value={group.name} onChange={(e) => updateBorderGroupName(group.id, e.target.value)} onClick={(e) => e.stopPropagation()} className="bg-transparent text-gray-200 font-semibold focus:ring-1 focus:ring-cyan-500 focus:bg-gray-800 rounded px-1" title="Edit group name" />
                  </div>
                  <div className="flex items-center"><span className="text-xs text-gray-500 mr-3">{group.locations.length} locations</span><button onClick={(e) => { e.stopPropagation(); removeBorderGroup(group.id); }} className="text-gray-500 hover:text-red-400 transition duration-200 disabled:opacity-50" disabled={isProcessing} title="Delete group"><TrashIcon className="h-4 w-4" /></button><ChevronDownIcon className={`h-5 w-5 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} /></div>
                </div>
                {isOpen && (
                  <div className="p-4 border-t border-gray-800 space-y-3">
                    <div className="flex bg-gray-800/50 border border-gray-700 rounded-md">
                      <button onClick={() => setBorderInputMode('name')} className={`flex-1 text-center text-sm font-semibold rounded-l-md transition-colors py-1.5 px-2 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:z-10 flex items-center justify-center space-x-1.5 ${borderInputMode === 'name' ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.7)]' : 'hover:bg-gray-800 text-gray-300'}`}>
                          <GlobeIcon className="h-4 w-4" />
                          <span>By Name</span>
                      </button>
                      <button onClick={() => setBorderInputMode('postal')} className={`flex-1 text-center text-sm font-semibold rounded-r-md transition-colors py-1.5 px-2 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:z-10 flex items-center justify-center space-x-1.5 ${borderInputMode === 'postal' ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.7)]' : 'hover:bg-gray-800 text-gray-300'}`}>
                          <MailIcon className="h-4 w-4" />
                          <span>By Postal Code</span>
                      </button>
                    </div>
                    <div className="flex space-x-2"><input type="text" value={newBorderLocationNames[group.id] || ''} onChange={(e) => setNewBorderLocationNames({...newBorderLocationNames, [group.id]: e.target.value})} onKeyDown={(e) => handleBorderLocationInputKeyDown(e, group.id)} placeholder={borderInputMode === 'name' ? "e.g., 'Germany', 'New York City'" : "e.g., '90210', 'SW1A 0AA'"} className="flex-grow bg-gray-800 border border-gray-600 rounded-md px-4 py-2 text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400 outline-none transition-all duration-200" disabled={isProcessing} title={`Enter a ${borderInputMode === 'name' ? 'location name' : 'postal code'} and press Enter`} /><button onClick={() => addBorderLocation(group.id)} className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold p-2 rounded-md flex items-center justify-center transition-all duration-200 disabled:bg-gray-700 disabled:cursor-not-allowed" disabled={isProcessing || !(newBorderLocationNames[group.id] || '').trim()} title="Add location to group"><PlusIcon className="h-5 w-5" /></button></div>
                    <div className="space-y-2">{group.locations.map((location, index) => (<div key={`${group.id}-loc-${index}`} className="flex items-center bg-gray-800/60 p-2 rounded-md">{location.type === 'postal' ? <MailIcon className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" /> : <GlobeIcon className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />}<span className="flex-grow text-gray-300 text-sm truncate">{location.name}</span>{durationControlMode === 'time' && borderTimeControlMode === 'manual' && (<div className="ml-auto flex items-center space-x-1 pl-2"><input type="number" min="1" value={location.duration || ''} placeholder={`${durationPerLocation}`} onChange={(e) => updateBorderLocationDuration(group.id, index, e.target.value)} onClick={(e) => e.stopPropagation()} className="w-16 bg-gray-700 border border-gray-600 rounded-md px-2 py-1 text-sm text-center focus:ring-1 focus:ring-cyan-500 outline-none placeholder:text-gray-500" title={`Set manual duration for ${location.name} (seconds)`} /><span className="text-xs text-gray-500">s</span></div>)}<button onClick={() => removeBorderLocation(group.id, index)} className="ml-2 text-gray-500 hover:text-red-400 transition duration-200 disabled:opacity-50" disabled={isProcessing} title={`Remove ${location.name}`}><TrashIcon className="h-4 w-4" /></button></div>))}{group.locations.length === 0 && <p className="text-center text-sm text-gray-500 py-2">Add a country, city, or postal code.</p>}</div>
                  </div>
                )}
              </div>
            )
          })}
          </div>
          <button onClick={addBorderGroup} className="w-full bg-gray-800/80 hover:bg-gray-700/80 border border-gray-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed" disabled={isProcessing} title={`Add New Border Group (${formatShortcut(shortcuts.addNewGroup.keys)})`}><PlusIcon className="h-5 w-5" /><span>Add New Border Group</span></button>
        </div>
      )}
    </div>
  );
};
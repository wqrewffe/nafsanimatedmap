export interface Waypoint {
  id: string;
  name: string;
}

export interface WaypointWithCoords extends Waypoint {
  lat: number;
  lng: number;
}

export interface WaypointGroup {
    id: string;
    name: string;
    color: string;
    waypoints: Waypoint[];
}

export interface BorderLocation {
    name: string;
    type?: 'name' | 'postal';
    duration?: number;
}

export interface BorderGroup {
    id:string;
    name: string;
    color: string;
    locations: BorderLocation[];
}

export interface WaypointGroupWithCoords {
    id: string;
    name: string;
    color: string;
    waypoints: WaypointWithCoords[]; // The full path to animate
    userWaypoints?: WaypointWithCoords[]; // Original user-defined points for markers
    duration?: number; // Optional duration in milliseconds
}

export interface CompletedBorder {
  name: string;
  bounds: [number, number, number, number]; // south, north, west, east
  center: [number, number]; // lat, lng
}

export interface MapStyle {
  id: string;
  name: string;
  url: string;
  attribution: string;
  maxZoom?: number;
}

export type CinematicZoomStyle = 'none' | 'smooth' | 'fly-to' | 'wide' | 'close-up';
export type AnimationPathStyle = 'draw' | 'flow' | 'jump' | 'comet' | 'reveal' | 'trail' | 'pulse';

export interface MapDisplayHandle {
  zoomIn: () => void;
  zoomOut: () => void;
}

// -- New Types for Customizable Shortcuts --

/**
 * Represents a single keyboard shortcut action.
 * `keys` is an array of strings representing the combination (e.g., ['Ctrl', 'Shift', 'R']).
 * `description` is a user-friendly explanation of the action.
 * `category` helps group related shortcuts in the UI.
 */
export interface Shortcut {
  keys: string[];
  description: string;
  category: 'Global' | 'Animation' | 'Recording' | 'Panel' | 'Focus';
}

/**
 * Defines the entire shortcut configuration for the application.
 * Each key represents a specific action that can be triggered.
 */
export type ShortcutConfig = {
  // Global
  zoomIn: Shortcut;
  zoomOut: Shortcut;
  
  // Animation
  animate: Shortcut;
  pauseAnimation: Shortcut;
  replay: Shortcut;

  // Recording
  startRecording: Shortcut;
  pauseRecording: Shortcut;
  stopRecording: Shortcut;

  // Panel
  switchDirectMode: Shortcut;
  switchRoadMode: Shortcut;
  switchBorderMode: Shortcut;
  addNewGroup: Shortcut;

  // Focus (used for border mode)
  focusLocation1: Shortcut;
  focusLocation2: Shortcut;
  focusLocation3: Shortcut;
  zoomToLocation1: Shortcut;
  zoomToLocation2: Shortcut;
  zoomToLocation3: Shortcut;
};
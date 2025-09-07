import type { ShortcutConfig } from '../types';

export const DEFAULT_SHORTCUTS: ShortcutConfig = {
  // Global
  zoomIn: { keys: ['Ctrl', '='], description: "Zoom In", category: 'Global' },
  zoomOut: { keys: ['Ctrl', '-'], description: "Zoom Out", category: 'Global' },

  // Animation
  animate: { keys: ['Ctrl', 'Enter'], description: "Generate & Animate", category: 'Animation' },
  pauseAnimation: { keys: ['Space'], description: "Pause / Resume Animation", category: 'Animation' },
  replay: { keys: ['Ctrl', 'Shift', 'P'], description: "Replay Last Animation", category: 'Animation' },
  
  // Recording
  startRecording: { keys: ['Ctrl', 'Shift', 'R'], description: "Start Recording", category: 'Recording' },
  pauseRecording: { keys: ['P'], description: "Pause / Resume Recording", category: 'Recording' },
  stopRecording: { keys: ['S'], description: "Stop Recording", category: 'Recording' },

  // Panel
  switchDirectMode: { keys: ['Alt', 'D'], description: "Switch to Direct Path Mode", category: 'Panel' },
  switchRoadMode: { keys: ['Alt', 'R'], description: "Switch to Road Trip Mode", category: 'Panel' },
  switchBorderMode: { keys: ['Alt', 'B'], description: "Switch to By Border Mode", category: 'Panel' },
  addNewGroup: { keys: ['Alt', 'N'], description: "Add New Trip / Group", category: 'Panel' },

  // Focus
  // NOTE: Using single-key shortcuts outside of input fields can sometimes be triggered accidentally.
  focusLocation1: { keys: ['Shift', '1'], description: "Fit Location 1 to View", category: 'Focus' },
  zoomToLocation1: { keys: ['1'], description: "Zoom to Location 1 Center", category: 'Focus' },
  focusLocation2: { keys: ['Shift', '2'], description: "Fit Location 2 to View", category: 'Focus' },
  zoomToLocation2: { keys: ['2'], description: "Zoom to Location 2 Center", category: 'Focus' },
  focusLocation3: { keys: ['Shift', '3'], description: "Fit Location 3 to View", category: 'Focus' },
  zoomToLocation3: { keys: ['3'], description: "Zoom to Location 3 Center", category: 'Focus' },
};

const SHORTCUTS_STORAGE_KEY = 'map-animator-shortcuts-config';

/**
 * Saves the user's custom shortcut configuration to local storage.
 * @param config The shortcut configuration to save.
 */
export const saveShortcutsToLocalStorage = (config: ShortcutConfig): void => {
  try {
    const configString = JSON.stringify(config);
    localStorage.setItem(SHORTCUTS_STORAGE_KEY, configString);
  } catch (error) {
    console.error("Could not save shortcuts to local storage:", error);
  }
};

/**
 * Loads the shortcut configuration from local storage.
 * If no saved configuration is found or if it's invalid, it returns the default configuration.
 * @returns The loaded or default shortcut configuration.
 */
export const loadShortcutsFromLocalStorage = (): ShortcutConfig => {
  try {
    const savedConfigString = localStorage.getItem(SHORTCUTS_STORAGE_KEY);
    if (savedConfigString) {
      const savedConfig = JSON.parse(savedConfigString);
      // Basic validation: ensure it's an object and has at least one expected key.
      if (typeof savedConfig === 'object' && savedConfig !== null && 'animate' in savedConfig) {
        // Merge saved config with defaults to ensure new shortcuts are added for existing users
        return { ...DEFAULT_SHORTCUTS, ...savedConfig };
      }
    }
  } catch (error) {
    console.error("Could not load shortcuts from local storage, using defaults:", error);
  }
  // Return a deep copy of the defaults to prevent mutation
  return JSON.parse(JSON.stringify(DEFAULT_SHORTCUTS));
};

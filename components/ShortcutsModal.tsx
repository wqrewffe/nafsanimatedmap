import React, { useState, useEffect, useRef, useMemo } from 'react';
import { XIcon, EditIcon, RotateCcwIcon } from './Icons';
import type { ShortcutConfig, Shortcut } from '../types';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: ShortcutConfig;
  onSave: (newShortcuts: ShortcutConfig) => void;
  defaultShortcuts: ShortcutConfig;
}

// --- Helper component for capturing a new shortcut ---
const EditableShortcutInput: React.FC<{ value: string[]; onChange: (newValue: string[]) => void; }> = ({ value, onChange }) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const divRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const mainKey = e.key.toLowerCase();
    
    // Only finalize the shortcut when a non-modifier key is pressed.
    // This prevents capturing just 'Ctrl' or 'Shift' and allows for combinations.
    if (!['control', 'meta', 'shift', 'alt'].includes(mainKey)) {
        const newKeys: string[] = [];
        
        // Enforce a consistent order for modifiers
        if (e.ctrlKey) newKeys.push('Ctrl');
        if (e.metaKey) newKeys.push('Cmd');
        if (e.altKey) newKeys.push('Alt');
        if (e.shiftKey) newKeys.push('Shift');

        let formattedKey = e.key;
        if (formattedKey === ' ') {
            formattedKey = 'Space';
        } else if (formattedKey.length === 1) {
            // This will handle letters and numbers
            formattedKey = formattedKey.toUpperCase();
        } else {
            // This will handle keys like 'Enter', 'ArrowUp', etc.
            formattedKey = formattedKey.charAt(0).toUpperCase() + formattedKey.slice(1);
        }
        
        newKeys.push(formattedKey);
    
        onChange(newKeys);
        setIsCapturing(false);
        divRef.current?.blur();
    }
    // If only a modifier key was pressed, we do nothing and wait for the main key,
    // allowing the user to form a key combination.
  };
  
  const handleClick = () => {
    setIsCapturing(true);
    divRef.current?.focus();
  }

  return (
    <div 
      ref={divRef} tabIndex={-1}
      onClick={handleClick} onKeyDown={isCapturing ? handleKeyDown : undefined} onBlur={() => setIsCapturing(false)}
      className="flex space-x-1.5 cursor-pointer rounded-md outline-none transition-all duration-200 p-1 -m-1"
      role="button" aria-label="Set new shortcut"
    >
      <div className={`flex space-x-1.5 border-2 rounded-md px-2 py-1 ${isCapturing ? 'border-cyan-500 bg-gray-900' : 'border-transparent'}`}>
        {isCapturing ? (
            <span className="text-cyan-400 text-sm italic animate-pulse">Press new keys...</span>
        ) : (
            (value && value.length > 0) 
              ? value.map(key => <kbd key={key}>{key}</kbd>) 
              : <kbd className="bg-red-900/50 border-red-700 text-red-300">None</kbd>
        )}
      </div>
    </div>
  );
};

// --- Main Modal Component ---
export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose, shortcuts, onSave, defaultShortcuts }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editableShortcuts, setEditableShortcuts] = useState<ShortcutConfig>(shortcuts);

  useEffect(() => {
    if (!isEditing) {
      setEditableShortcuts(shortcuts);
    }
  }, [shortcuts, isEditing, isOpen]);

  const handleUpdateShortcut = (action: keyof ShortcutConfig, newKeys: string[]) => {
    setEditableShortcuts(prev => ({
      ...prev,
      [action]: { ...prev[action], keys: newKeys },
    }));
  };

  const handleSave = () => {
    onSave(editableShortcuts);
    setIsEditing(false);
  };
  
  const handleCancel = () => {
    setEditableShortcuts(shortcuts);
    setIsEditing(false);
  };

  const handleReset = () => {
    setEditableShortcuts(defaultShortcuts);
  };

  const groupedShortcuts = useMemo(() => {
    const result = {} as Record<Shortcut['category'], (Shortcut & { action: string })[]>;
    // Iterate keys so we keep types intact and avoid `unknown` values from Object.entries
    (Object.keys(editableShortcuts) as (keyof ShortcutConfig)[]).forEach((actionKey) => {
      const action = actionKey as string;
      const shortcut = editableShortcuts[actionKey] as Shortcut;
      const category = shortcut.category;
      if (!result[category]) result[category] = [];
      result[category].push({ action, ...shortcut });
    });
    return result;
  }, [editableShortcuts]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[1020] transition-opacity duration-300"
      onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="shortcuts-title"
    >
      <div 
        className="bg-surface border border-cyan-400/20 rounded-lg shadow-2xl shadow-cyan-500/10 w-full max-w-2xl max-h-[80vh] flex flex-col m-4"
        onClick={e => e.stopPropagation()} style={{ '--color-surface': '#1a1a1a' } as React.CSSProperties}
      >
        <header className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 id="shortcuts-title" className="text-xl font-bold text-gray-100 text-glow">Keyboard Shortcuts</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
            aria-label="Close shortcuts modal"
          >
            <XIcon className="h-6 w-6" />
          </button>
        </header>

        <main className="p-6 overflow-y-auto">
          {Object.entries(groupedShortcuts).map(([category, items]) => (
            <div key={category}>
              <h3 className="text-lg font-semibold text-cyan-400 text-glow mt-4 mb-2">{category}</h3>
              {(items as (Shortcut & { action: string })[]).map(({ action, keys, description }) => (
                <div key={action} className="flex justify-between items-center py-3 border-b border-gray-700/50">
                  <p className="text-gray-300">{description}</p>
                  {isEditing ? (
                    <EditableShortcutInput 
                      value={keys} 
                      onChange={(newKeys) => handleUpdateShortcut(action as keyof ShortcutConfig, newKeys)}
                    />
                  ) : (
                    <div className="flex space-x-2">
                      {(keys && keys.length > 0)
                        ? keys.map(key => <kbd key={key}>{key}</kbd>)
                        : <kbd className="bg-red-900/50 border-red-700 text-red-300">None</kbd>
                      }
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
          <p className="text-sm text-gray-500 mt-6 text-center">
            Note: On macOS, <kbd>Cmd</kbd> is used instead of <kbd>Ctrl</kbd>. Shortcuts are disabled when typing in input fields.
          </p>
        </main>
        
        <footer className="p-4 border-t border-gray-700 flex justify-end items-center space-x-3 bg-gray-900/50 rounded-b-lg">
          {isEditing ? (
            <>
              <button onClick={handleReset} className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-200">
                <RotateCcwIcon className="h-5 w-5" />
                <span>Reset to Defaults</span>
              </button>
              <button onClick={handleCancel} className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-200">Cancel</button>
              <button onClick={handleSave} className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-2 px-4 rounded-md transition-colors duration-200">Save Changes</button>
            </>
          ) : (
            <button onClick={() => setIsEditing(true)} className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-200">
              <EditIcon className="h-5 w-5" />
              <span>Edit Shortcuts</span>
            </button>
          )}
        </footer>
      </div>
    </div>
  );
};
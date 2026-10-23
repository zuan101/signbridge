import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import type { AppSettings } from './types';
import { DEFAULT_SETTINGS } from './types';
import { getStorageItem, setStorageItem, removeStorageItem } from '../../lib/storage';

const SETTINGS_STORAGE_KEY = 'signbridge_settings_v1';

interface SettingsContextValue {
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const loaded = getStorageItem<AppSettings>(SETTINGS_STORAGE_KEY, DEFAULT_SETTINGS);
    if (loaded && loaded.recognitionMode === 'isl-geometric') {
      return { ...loaded, recognitionMode: 'isl-fingerspelling' };
    }
    return loaded;
  });

  useEffect(() => {
    setStorageItem(SETTINGS_STORAGE_KEY, settings);

    // Apply settings directly to DOM root attributes
    const root = document.documentElement;
    root.setAttribute('data-theme', settings.theme);
    root.setAttribute('data-contrast', settings.highContrast ? 'high' : 'normal');
    root.setAttribute('data-font-size', settings.fontSize);

    if (settings.reduceMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
  }, [settings]);

  const updateSettings = (partial: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...partial }));
  };

  const resetSettings = () => {
    removeStorageItem(SETTINGS_STORAGE_KEY);
    setSettings(DEFAULT_SETTINGS);
  };

  const value = useMemo(() => ({ settings, updateSettings, resetSettings }), [settings]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

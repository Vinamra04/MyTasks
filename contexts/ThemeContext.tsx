import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Theme, ThemeMode, AppSettings } from '../types';
import { darkTheme, lightTheme, getTheme } from '../constants/theme';
import { storageService } from '../services/storageService';

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('dark');
  const [theme, setTheme] = useState<Theme>(darkTheme);
  const [isLoading, setIsLoading] = useState(true);

  // Load theme mode from storage on mount
  useEffect(() => {
    loadThemeMode();
  }, []);

  // Update theme when theme mode changes
  useEffect(() => {
    setTheme(getTheme(themeMode));
  }, [themeMode]);

  const loadThemeMode = async () => {
    try {
      const settings = await storageService.getSettings();
      setThemeModeState(settings.themeMode);
    } catch (error) {
      console.error('Error loading theme mode:', error);
      // Default to dark theme if error
      setThemeModeState('dark');
    } finally {
      // Add a small delay to ensure smooth initialization
      setTimeout(() => setIsLoading(false), 100);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      // Update local state immediately
      setThemeModeState(mode);
      
      // Save to storage
      await storageService.updateSettings({ themeMode: mode });
    } catch (error) {
      console.error('Error saving theme mode:', error);
    }
  };

  const toggleTheme = () => {
    const newMode = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(newMode);
  };

  const value: ThemeContextType = {
    theme,
    themeMode,
    setThemeMode,
    toggleTheme,
    isLoading,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
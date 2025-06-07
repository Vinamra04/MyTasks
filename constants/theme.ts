import { Theme, ThemeMode } from '../types';

// Dark Theme (Primary)
export const darkTheme: Theme = {
  mode: 'dark',
  colors: {
    background: '#1e1e2f',
    surface: '#252541',
    card: '#2a2a3e',
    text: {
      primary: '#ffffff',
      secondary: '#b8b8cc',
      accent: '#8b8bff',
    },
    priority: {
      high: '#ff6b6b',
      medium: '#ffd93d',
      low: '#6bcf7f',
    },
    status: {
      success: '#51cf66',
      warning: '#ffd43b',
      error: '#ff6b6b',
    },
    button: {
      primary: '#8b8bff',
      secondary: '#4a4a6b',
      disabled: '#3a3a4f',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 6,
    md: 12,
    lg: 16,
  },
  typography: {
    h1: 32,
    h2: 24,
    h3: 20,
    body: 16,
    caption: 14,
  },
};

// Light Theme (Alternative)
export const lightTheme: Theme = {
  mode: 'light',
  colors: {
    background: '#ffffff',
    surface: '#f7f8fc',
    card: '#ffffff',
    text: {
      primary: '#1a202c',
      secondary: '#4a5568',
      accent: '#5a67d8',
    },
    priority: {
      high: '#e53e3e',
      medium: '#dd6b20',
      low: '#38a169',
    },
    status: {
      success: '#38a169',
      warning: '#d69e2e',
      error: '#e53e3e',
    },
    button: {
      primary: '#5a67d8',
      secondary: '#edf2f7',
      disabled: '#cbd5e0',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 6,
    md: 12,
    lg: 16,
  },
  typography: {
    h1: 32,
    h2: 24,
    h3: 20,
    body: 16,
    caption: 14,
  },
};

// Common Shadows for Cards (works for both themes)
export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 6,
  },
};

// Theme-specific shadows for better contrast
export const getThemeShadows = (mode: ThemeMode) => ({
  small: {
    shadowColor: mode === 'dark' ? '#000' : '#718096',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: mode === 'dark' ? 0.15 : 0.08,
    shadowRadius: 4,
    elevation: mode === 'dark' ? 3 : 2,
  },
  medium: {
    shadowColor: mode === 'dark' ? '#000' : '#718096',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: mode === 'dark' ? 0.2 : 0.12,
    shadowRadius: 8,
    elevation: mode === 'dark' ? 5 : 4,
  },
  large: {
    shadowColor: mode === 'dark' ? '#000' : '#718096',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: mode === 'dark' ? 0.25 : 0.16,
    shadowRadius: 16,
    elevation: mode === 'dark' ? 8 : 6,
  },
});

// Animation Constants
export const animations = {
  duration: {
    fast: 200,
    normal: 300,
    slow: 500,
  },
  easing: {
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
};

// Layout Constants
export const layout = {
  headerHeight: 60,
  tabBarHeight: 80,
  screenPadding: 20,
  cardPadding: 16,
  buttonHeight: 48,
  inputHeight: 44,
};

// Default App Settings
export const defaultSettings = {
  notificationDelay: 30, // 30 minutes
  themeMode: 'dark' as ThemeMode,
  enableNotifications: true,
  dailyReminderTime: '09:00',
};

// Motivational Quotes for Welcome Screen
export const motivationalQuotes = [
  "The way to get started is to quit talking and begin doing. - Walt Disney",
  "Don't let yesterday take up too much of today. - Will Rogers",
  "You learn more from failure than from success. - Unknown",
  "It's not whether you get knocked down, it's whether you get up. - Vince Lombardi",
  "If you are working on something that you really care about, you don't have to be pushed. - Steve Jobs",
  "Success is not final, failure is not fatal: it is the courage to continue that counts. - Winston Churchill",
  "The future belongs to those who believe in the beauty of their dreams. - Eleanor Roosevelt",
  "Your limitation—it's only your imagination.",
  "Push yourself, because no one else is going to do it for you.",
  "Great things never come from comfort zones.",
  "Dream it. Wish it. Do it.",
  "Success doesn't just find you. You have to go out and get it.",
];

// Helper function to get theme
export const getTheme = (mode: ThemeMode): Theme => {
  return mode === 'dark' ? darkTheme : lightTheme;
}; 
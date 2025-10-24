import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

// Кастомная цветовая схема из оригинального приложения
const customColors = {
  primary: '#1d4ed8',
  primaryContainer: '#dbeafe',
  secondary: '#64748b',
  secondaryContainer: '#e2e8f0',
  tertiary: '#059669',
  tertiaryContainer: '#d1fae5',
  surface: '#ffffff',
  surfaceVariant: '#f8fafc',
  background: '#f8fafc',
  error: '#dc2626',
  errorContainer: '#fecaca',
  onPrimary: '#ffffff',
  onPrimaryContainer: '#1e3a8a',
  onSecondary: '#ffffff',
  onSecondaryContainer: '#475569',
  onTertiary: '#ffffff',
  onTertiaryContainer: '#047857',
  onSurface: '#0f172a',
  onSurfaceVariant: '#64748b',
  onBackground: '#0f172a',
  onError: '#ffffff',
  onErrorContainer: '#991b1b',
  outline: '#d8dee9',
  outlineVariant: '#e2e8f0',
  shadow: '#6b8cae',
  scrim: '#000000',
  inverseSurface: '#1e293b',
  inverseOnSurface: '#e2e8f0',
  inversePrimary: '#93c5fd',
  elevation: {
    level0: 'transparent',
    level1: '#ffffff',
    level2: '#ffffff',
    level3: '#ffffff',
    level4: '#ffffff',
    level5: '#ffffff',
  },
};

const darkCustomColors = {
  primary: '#60a5fa',
  primaryContainer: '#1e3a8a',
  secondary: '#a78bfa',
  secondaryContainer: '#5b21b6',
  tertiary: '#34d399',
  tertiaryContainer: '#065f46',
  surface: '#0f172a',
  surfaceVariant: '#1e293b',
  background: '#030712',
  error: '#ef4444',
  errorContainer: '#7f1d1d',
  onPrimary: '#ffffff',
  onPrimaryContainer: '#dbeafe',
  onSecondary: '#ffffff',
  onSecondaryContainer: '#e9d5ff',
  onTertiary: '#ffffff',
  onTertiaryContainer: '#d1fae5',
  onSurface: '#e2e8f0',
  onSurfaceVariant: '#94a3b8',
  onBackground: '#e2e8f0',
  onError: '#ffffff',
  onErrorContainer: '#fecaca',
  outline: '#334155',
  outlineVariant: '#1e293b',
  shadow: '#000000',
  scrim: '#000000',
  inverseSurface: '#e2e8f0',
  inverseOnSurface: '#1e293b',
  inversePrimary: '#1e3a8a',
  elevation: {
    level0: 'transparent',
    level1: '#1e293b',
    level2: '#1e293b',
    level3: '#1e293b',
    level4: '#1e293b',
    level5: '#1e293b',
  },
};

export const lightTheme = {
  ...MD3LightTheme,
  colors: customColors,
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: darkCustomColors,
};

export const theme = lightTheme;

// Утилиты для работы с темами
export const getThemeColors = (isDark: boolean) => {
  return isDark ? darkTheme.colors : lightTheme.colors;
};

export const getStatusBarStyle = (isDark: boolean) => {
  return isDark ? 'light-content' : 'dark-content';
};

export const getBackgroundColor = (isDark: boolean) => {
  return isDark ? darkTheme.colors.background : lightTheme.colors.background;
};



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
  shadow: '#000000',
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
  primary: '#1e293b',
  primaryContainer: '#0b1220',
  secondary: '#94a3b8',
  secondaryContainer: '#17233a',
  tertiary: '#10b981',
  tertiaryContainer: '#064e3b',
  surface: '#0f172a',
  surfaceVariant: '#030712',
  background: '#030712',
  error: '#ef4444',
  errorContainer: '#7f1d1d',
  onPrimary: '#ffffff',
  onPrimaryContainer: '#e2e8f0',
  onSecondary: '#ffffff',
  onSecondaryContainer: '#cbd5e1',
  onTertiary: '#ffffff',
  onTertiaryContainer: '#a7f3d0',
  onSurface: '#e2e8f0',
  onSurfaceVariant: '#94a3b8',
  onBackground: '#e2e8f0',
  onError: '#ffffff',
  onErrorContainer: '#fecaca',
  outline: '#1f2a3d',
  outlineVariant: '#17233a',
  shadow: '#000000',
  scrim: '#000000',
  inverseSurface: '#e2e8f0',
  inverseOnSurface: '#1e293b',
  inversePrimary: '#1e3a8a',
  elevation: {
    level0: 'transparent',
    level1: '#0f172a',
    level2: '#0f172a',
    level3: '#0f172a',
    level4: '#0f172a',
    level5: '#0f172a',
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



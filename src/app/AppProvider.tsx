import React, { PropsWithChildren } from 'react';
import { Provider as ReduxProvider, useSelector } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useColorScheme } from 'react-native';

import { persistor, store, RootState } from '@/store';
import { lightTheme, darkTheme, getStatusBarStyle } from '@/utils/theme';
import LoadingScreen from '@/components/LoadingScreen';

const ThemedApp: React.FC<PropsWithChildren> = ({ children }) => {
  const { theme: themeMode } = useSelector((state: RootState) => state.ui);
  const systemColorScheme = useColorScheme();

  const isDark = themeMode === 'dark' || (themeMode === 'auto' && systemColorScheme === 'dark');
  const theme = isDark ? darkTheme : lightTheme;
  const statusBarStyle = getStatusBarStyle(isDark);

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <StatusBar style={statusBarStyle} />
        {children}
      </PaperProvider>
    </SafeAreaProvider>
  );
};

export const AppProvider: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ReduxProvider store={store}>
        <PersistGate persistor={persistor} loading={<LoadingScreen />}>
          <ThemedApp>
            {children}
          </ThemedApp>
        </PersistGate>
      </ReduxProvider>
    </GestureHandlerRootView>
  );
};

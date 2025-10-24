import React from 'react';
import { Image, useColorScheme } from 'react-native';
import { useSelector } from 'react-redux';

import { TabParamList } from '@/types';
import { RootState } from '@/store';

interface TabBarIconProps {
  route: keyof TabParamList;
  focused: boolean;
  color: string;
  size: number;
}

const ROUTE_ICON_MAP_LIGHT: Record<keyof TabParamList, any> = {
  ScheduleTab: require('../../assets/buttons/Расписание.png'),
  NewsTab: require('../../assets/buttons/Лента.png'),
  SettingsTab: require('../../assets/buttons/Настройки.png'),
};

const ROUTE_ICON_MAP_DARK: Record<keyof TabParamList, any> = {
  ScheduleTab: require('../../assets/buttons/Расписание_тёмная_тема.png'),
  NewsTab: require('../../assets/buttons/Лента_тёмная_тема.png'),
  SettingsTab: require('../../assets/buttons/Настройки_тёмная_тема.png'),
};

const TabBarIcon: React.FC<TabBarIconProps> = ({ route, focused, size }) => {
  const { theme: themeMode } = useSelector((state: RootState) => state.ui);
  const systemColorScheme = useColorScheme();
  
  // Match the theme logic from AppProvider
  const isDark = themeMode === 'dark' || (themeMode === 'auto' && systemColorScheme === 'dark');
  
  const iconMap = isDark ? ROUTE_ICON_MAP_DARK : ROUTE_ICON_MAP_LIGHT;
  const iconSource = iconMap[route];

  return (
    <Image
      source={iconSource}
      style={{ 
        width: size, 
        height: size,
        opacity: focused ? 1 : 0.6,
      }}
      resizeMode="contain"
    />
  );
};

export default TabBarIcon;

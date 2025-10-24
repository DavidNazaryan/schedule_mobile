import React from 'react';
import { TabParamList } from '../types';

interface TabBarIconProps {
  route: keyof TabParamList;
  focused: boolean;
  color: string;
  size: number;
}

const TabBarIcon: React.FC<TabBarIconProps> = ({ route, color, size }) => {
  let iconName: string;

  switch (route) {
    case 'ScheduleTab':
      iconName = 'calendar';
      break;
    case 'NewsTab':
      iconName = 'newspaper';
      break;
    case 'HomeworkTab':
      iconName = 'book';
      break;
    case 'NotificationsTab':
      iconName = 'bell';
      break;
    case 'SettingsTab':
      iconName = 'cog';
      break;
    default:
      iconName = 'circle';
  }

  // Здесь можно использовать react-native-vector-icons или другие иконки
  // Для простоты используем текстовые символы
  const iconMap: Record<string, string> = {
    calendar: '📅',
    newspaper: '📰',
    book: '📚',
    bell: '🔔',
    cog: '⚙️',
    circle: '●',
  };

  return (
    <span style={{ fontSize: size, color }}>
      {iconMap[iconName]}
    </span>
  );
};

export default TabBarIcon;

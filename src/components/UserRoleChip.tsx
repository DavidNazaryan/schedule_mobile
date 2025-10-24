import React from 'react';
import { StyleSheet } from 'react-native';
import { Chip, useTheme } from 'react-native-paper';

import { UserRole } from '@/types';

interface UserRoleChipProps {
  role: UserRole;
  size?: 'small' | 'medium' | 'large';
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: 16,
  },
  chipText: {
    fontWeight: 'bold',
  },
  smallChip: {
    height: 24,
  },
  mediumChip: {
    height: 32,
  },
  largeChip: {
    height: 40,
  },
  smallText: {
    fontSize: 10,
  },
  largeText: {
    fontSize: 16,
  },
});

const sizeStyles = {
  small: styles.smallChip,
  medium: styles.mediumChip,
  large: styles.largeChip,
} as const;

const textSizeStyles = {
  small: styles.smallText,
  medium: null,
  large: styles.largeText,
} as const;


const UserRoleChip: React.FC<UserRoleChipProps> = ({ role, size = 'medium' }) => {
  const theme = useTheme();
  
  const roleMeta = {
    [UserRole.GUEST]: {
      label: 'Гость',
      icon: 'account-outline',
      background: theme.colors.surfaceVariant,
      textColor: theme.colors.onSurfaceVariant,
    },
    [UserRole.STUDENT]: {
      label: 'Студент',
      icon: 'account',
      background: theme.colors.secondary,
      textColor: theme.colors.onSecondary,
    },
    [UserRole.MONITOR]: {
      label: 'Староста',
      icon: 'account-star',
      background: theme.colors.primary,
      textColor: theme.colors.onPrimary,
    },
    [UserRole.ADMIN]: {
      label: 'Администратор',
      icon: 'account-cog',
      background: theme.colors.tertiary,
      textColor: theme.colors.onTertiary,
    },
  } as const;

  const fallbackMeta = {
    label: 'Не указано',
    icon: 'account-question',
    background: theme.colors.outline,
    textColor: theme.colors.onSurface,
  };

  const meta = roleMeta[role] ?? fallbackMeta;

  return (
    <Chip
      icon={meta.icon}
      style={[styles.chip, sizeStyles[size], { backgroundColor: meta.background }]}
      textStyle={[styles.chipText, textSizeStyles[size] ?? undefined, { color: meta.textColor }]}
    >
      {meta.label}
    </Chip>
  );
};

export default UserRoleChip;

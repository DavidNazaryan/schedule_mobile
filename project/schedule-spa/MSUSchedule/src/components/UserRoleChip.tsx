import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Chip } from 'react-native-paper';
import { UserRole } from '../types';
import { theme } from '../utils/theme';

interface UserRoleChipProps {
  role: UserRole;
  size?: 'small' | 'medium' | 'large';
}

const UserRoleChip: React.FC<UserRoleChipProps> = ({ role, size = 'medium' }) => {
  const getRoleInfo = (role: UserRole) => {
    switch (role) {
      case UserRole.STUDENT:
        return {
          label: 'Студент',
          icon: 'account',
          color: theme.colors.secondary,
        };
      case UserRole.MONITOR:
        return {
          label: 'Староста',
          icon: 'account-star',
          color: theme.colors.primary,
        };
      case UserRole.ADMIN:
        return {
          label: 'Администратор',
          icon: 'account-cog',
          color: theme.colors.tertiary,
        };
      default:
        return {
          label: 'Неизвестно',
          icon: 'account-question',
          color: theme.colors.outline,
        };
    }
  };

  const roleInfo = getRoleInfo(role);
  
  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return styles.smallChip;
      case 'large':
        return styles.largeChip;
      default:
        return styles.mediumChip;
    }
  };

  return (
    <Chip
      icon={roleInfo.icon}
      style={[
        styles.chip,
        getSizeStyle(),
        { backgroundColor: roleInfo.color }
      ]}
      textStyle={[
        styles.chipText,
        size === 'small' && styles.smallText,
        size === 'large' && styles.largeText,
      ]}
    >
      {roleInfo.label}
    </Chip>
  );
};

const styles = StyleSheet.create({
  chip: {
    borderRadius: 16,
  },
  chipText: {
    color: theme.colors.onPrimary,
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

export default UserRoleChip;



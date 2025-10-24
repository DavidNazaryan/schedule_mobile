import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { UserRole, PermissionCheck } from '@/types';

interface PermissionGateProps {
  children: React.ReactNode;
  permission?: string;
  role?: UserRole;
  roles?: UserRole[];
  fallback?: React.ReactNode;
}

const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  permission,
  role,
  roles,
  fallback = null,
}) => {
  const { user } = useSelector((state: RootState) => state.auth);

  // Проверка роли
  const hasRole = () => {
    if (!user) return false;
    
    if (role) {
      return user.role === role;
    }
    
    if (roles) {
      return roles.includes(user.role);
    }
    
    return true;
  };

  // Проверка конкретного разрешения
  const hasPermission = (perm: string) => {
    if (!user) return false;
    
    // Базовые проверки для разных ролей
    switch (user.role) {
      case UserRole.ADMIN:
        return true; // Админ имеет все права
      
      case UserRole.MONITOR:
        return [
          'view_schedule',
          'edit_homework',
          'manage_group',
          'view_group_members',
          'send_notifications',
        ].includes(perm);
      
      case UserRole.STUDENT:
        return [
          'view_schedule',
          'view_homework',
          'view_news',
          'view_notifications',
        ].includes(perm);
      case UserRole.GUEST:
        return [
          'view_news',
        ].includes(perm);
      
      default:
        return false;
    }
  };

  // Основная логика проверки
  const canAccess = () => {
    if (!user) return false;
    
    if (permission) {
      return hasPermission(permission);
    }
    
    if (role || roles) {
      return hasRole();
    }
    
    return true;
  };

  return canAccess() ? <>{children}</> : <>{fallback}</>;
};

export const usePermissions = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  const canViewSchedule = () => {
    return !!user && [UserRole.STUDENT, UserRole.MONITOR, UserRole.ADMIN].includes(user.role);
  };

  const canEditHomework = () => {
    return !!user && [UserRole.MONITOR, UserRole.ADMIN].includes(user.role);
  };

  const canManageGroup = () => {
    return !!user && [UserRole.MONITOR, UserRole.ADMIN].includes(user.role);
  };

  const canManageUsers = () => {
    return !!user && user.role === UserRole.ADMIN;
  };

  const canViewAdminPanel = () => {
    return !!user && user.role === UserRole.ADMIN;
  };

  const canSendNotifications = () => {
    return !!user && [UserRole.MONITOR, UserRole.ADMIN].includes(user.role);
  };

  const canEditSchedule = () => {
    return !!user && [UserRole.MONITOR, UserRole.ADMIN].includes(user.role);
  };

  const canViewStatistics = () => {
    return !!user && user.role === UserRole.ADMIN;
  };

  const canManageSystem = () => {
    return !!user && user.role === UserRole.ADMIN;
  };

  return {
    user,
    canViewSchedule,
    canEditHomework,
    canManageGroup,
    canManageUsers,
    canViewAdminPanel,
    canSendNotifications,
    canEditSchedule,
    canViewStatistics,
    canManageSystem,
  };
};

export const useUserPermissions = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  const getPermissions = (): PermissionCheck => {
    if (!user) {
      return {
        can_view: false,
        can_edit: false,
        can_manage_users: false,
        can_manage_group: false,
        can_view_statistics: false,
        can_manage_system: false,
        user_role: UserRole.GUEST,
      };
    }

    const isAdmin = user.role === UserRole.ADMIN;
    const isMonitor = user.role === UserRole.MONITOR;
    const isStudent = user.role === UserRole.STUDENT;
    const isGuest = user.role === UserRole.GUEST;

    return {
      can_view: !isGuest && (isStudent || isMonitor || isAdmin),
      can_edit: !isGuest && (isMonitor || isAdmin),
      can_manage_users: isAdmin,
      can_manage_group: !isGuest && (isMonitor || isAdmin),
      can_view_statistics: isAdmin,
      can_manage_system: isAdmin,
      user_role: user.role,
      user_group: user.group_id,
    };
  };

  return {
    permissions: getPermissions(),
    user,
  };
};

export const RoleGate: React.FC<{
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallback?: React.ReactNode;
}> = ({ children, allowedRoles, fallback = null }) => {
  const { user } = useSelector((state: RootState) => state.auth);
  
  const hasAccess = user && allowedRoles.includes(user.role);
  
  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

export const PermissionGateComponent: React.FC<{
  children: React.ReactNode;
  permission: string;
  fallback?: React.ReactNode;
}> = ({ children, permission, fallback = null }) => {
  const { user } = useSelector((state: RootState) => state.auth);
  
  const hasPermission = () => {
    if (!user) return false;
    
    switch (user.role) {
      case UserRole.ADMIN:
        return true;
      case UserRole.MONITOR:
        return [
          'view_schedule',
          'edit_homework',
          'manage_group',
          'view_group_members',
          'send_notifications',
        ].includes(permission);
      case UserRole.STUDENT:
        return [
          'view_schedule',
          'view_homework',
          'view_news',
          'view_notifications',
        ].includes(permission);
      case UserRole.GUEST:
        return [
          'view_news',
        ].includes(permission);
      default:
        return false;
    }
  };
  
  return hasPermission() ? <>{children}</> : <>{fallback}</>;
};

export default PermissionGate;


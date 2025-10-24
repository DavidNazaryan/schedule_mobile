"""
Система ролей и разрешений для Telegram Mini App
"""

from enum import Enum
from typing import Dict, List, Set
from dataclasses import dataclass


class UserRole(Enum):
    """Роли пользователей в системе"""
    STUDENT = "student"      # Студент (по умолчанию для всех новых пользователей)
    MONITOR = "monitor"      # Староста группы
    ADMIN = "admin"         # Администратор системы


class UserStatus(Enum):
    """Статусы пользователей"""
    ACTIVE = "active"       # Активный пользователь
    INACTIVE = "inactive"   # Неактивный
    SUSPENDED = "suspended" # Заблокированный


class Permission(Enum):
    """Разрешения в системе"""
    # Просмотр расписания
    VIEW_SCHEDULE = "view_schedule"
    VIEW_OWN_GROUP_SCHEDULE = "view_own_group_schedule"
    VIEW_ALL_GROUPS_SCHEDULE = "view_all_groups_schedule"
    
    # Редактирование расписания
    EDIT_SCHEDULE = "edit_schedule"
    EDIT_OWN_GROUP_SCHEDULE = "edit_own_group_schedule"
    EDIT_ALL_GROUPS_SCHEDULE = "edit_all_groups_schedule"
    
    # Управление домашними заданиями
    MANAGE_HOMEWORK = "manage_homework"
    MANAGE_OWN_GROUP_HOMEWORK = "manage_own_group_homework"
    MANAGE_ALL_GROUPS_HOMEWORK = "manage_all_groups_homework"
    VIEW_HOMEWORK = "view_homework"
    
    # Управление пользователями
    MANAGE_USERS = "manage_users"
    MANAGE_OWN_GROUP_USERS = "manage_own_group_users"
    MANAGE_ALL_USERS = "manage_all_users"
    
    # Управление группами
    MANAGE_GROUPS = "manage_groups"
    CREATE_GROUPS = "create_groups"
    DELETE_GROUPS = "delete_groups"
    
    # Административные функции
    VIEW_STATISTICS = "view_statistics"
    MANAGE_SYSTEM = "manage_system"
    VIEW_AUDIT_LOG = "view_audit_log"


@dataclass
class RolePermissions:
    """Разрешения для роли"""
    role: UserRole
    permissions: Set[Permission]
    description: str


class RoleManager:
    """Менеджер ролей и разрешений"""
    
    def __init__(self):
        print(f"[ROLE MANAGER DEBUG] Initializing RoleManager...")
        self._role_permissions = self._initialize_role_permissions()
        print(f"[ROLE MANAGER DEBUG] Initialized with {len(self._role_permissions)} roles")
        for role, perms in self._role_permissions.items():
            print(f"[ROLE MANAGER DEBUG] Role {role}: {len(perms.permissions)} permissions")
    
    def _initialize_role_permissions(self) -> Dict[UserRole, RolePermissions]:
        """Инициализирует разрешения для каждой роли"""
        return {
            UserRole.STUDENT: RolePermissions(
                role=UserRole.STUDENT,
                permissions={
                    Permission.VIEW_SCHEDULE,
                    Permission.VIEW_OWN_GROUP_SCHEDULE,
                    Permission.VIEW_HOMEWORK,
                },
                description="Студент - может просматривать расписание и домашние задания"
            ),
            
            UserRole.MONITOR: RolePermissions(
                role=UserRole.MONITOR,
                permissions={
                    # Все разрешения студента
                    Permission.VIEW_SCHEDULE,
                    Permission.VIEW_OWN_GROUP_SCHEDULE,
                    Permission.VIEW_HOMEWORK,
                    
                    # Дополнительные разрешения старосты
                    Permission.EDIT_SCHEDULE,
                    Permission.EDIT_OWN_GROUP_SCHEDULE,
                    Permission.MANAGE_HOMEWORK,
                    Permission.MANAGE_OWN_GROUP_HOMEWORK,
                    Permission.MANAGE_USERS,
                    Permission.MANAGE_OWN_GROUP_USERS,
                },
                description="Староста - может управлять своей группой"
            ),
            
            UserRole.ADMIN: RolePermissions(
                role=UserRole.ADMIN,
                permissions={
                    # Все разрешения
                    Permission.VIEW_SCHEDULE,
                    Permission.VIEW_OWN_GROUP_SCHEDULE,
                    Permission.VIEW_ALL_GROUPS_SCHEDULE,
                    Permission.VIEW_HOMEWORK,
                    Permission.EDIT_SCHEDULE,
                    Permission.EDIT_OWN_GROUP_SCHEDULE,
                    Permission.EDIT_ALL_GROUPS_SCHEDULE,
                    Permission.MANAGE_HOMEWORK,
                    Permission.MANAGE_OWN_GROUP_HOMEWORK,
                    Permission.MANAGE_ALL_GROUPS_HOMEWORK,
                    Permission.MANAGE_USERS,
                    Permission.MANAGE_OWN_GROUP_USERS,
                    Permission.MANAGE_ALL_USERS,
                    Permission.MANAGE_GROUPS,
                    Permission.CREATE_GROUPS,
                    Permission.DELETE_GROUPS,
                    Permission.VIEW_STATISTICS,
                    Permission.MANAGE_SYSTEM,
                    Permission.VIEW_AUDIT_LOG,
                },
                description="Администратор - полный доступ ко всем функциям"
            )
        }
    
    def get_role_permissions(self, role: UserRole) -> Set[Permission]:
        """Получает разрешения для роли"""
        print(f"[ROLE MANAGER DEBUG] Getting permissions for role: {role}")
        print(f"[ROLE MANAGER DEBUG] Available roles: {list(self._role_permissions.keys())}")
        
        role_perm = self._role_permissions.get(role)
        print(f"[ROLE MANAGER DEBUG] Role permissions object: {role_perm}")
        
        if role_perm:
            print(f"[ROLE MANAGER DEBUG] Permissions set: {role_perm.permissions}")
            return role_perm.permissions
        else:
            print(f"[ROLE MANAGER DEBUG] No permissions found for role {role}")
            return set()
    
    def has_permission(self, role: UserRole, permission: Permission) -> bool:
        """Проверяет, есть ли у роли определенное разрешение"""
        permissions = self.get_role_permissions(role)
        return permission in permissions
    
    def get_role_description(self, role: UserRole) -> str:
        """Получает описание роли"""
        role_perm = self._role_permissions.get(role)
        return role_perm.description if role_perm else "Неизвестная роль"
    
    def get_all_roles(self) -> List[UserRole]:
        """Получает список всех ролей"""
        return list(UserRole)
    
    def get_role_display_name(self, role: UserRole) -> str:
        """Получает отображаемое название роли"""
        display_names = {
            UserRole.STUDENT: "Студент",
            UserRole.MONITOR: "Староста",
            UserRole.ADMIN: "Администратор"
        }
        return display_names.get(role, role.value)
    
    def can_promote_to_role(self, current_role: UserRole, target_role: UserRole) -> bool:
        """Проверяет, может ли пользователь с текущей ролью назначить целевую роль"""
        # Только админы могут назначать админов
        if target_role == UserRole.ADMIN:
            return current_role == UserRole.ADMIN
        
        # Админы могут назначать любые роли
        if current_role == UserRole.ADMIN:
            return True
        
        # Старосты могут назначать только студентов в своей группе
        if current_role == UserRole.MONITOR:
            return target_role == UserRole.STUDENT
        
        # Студенты не могут назначать роли
        return False
    
    def get_available_roles_for_promotion(self, current_role: UserRole) -> List[UserRole]:
        """Получает список ролей, которые может назначить пользователь с текущей ролью"""
        available_roles = []
        
        for role in UserRole:
            if self.can_promote_to_role(current_role, role):
                available_roles.append(role)
        
        return available_roles


# Глобальный экземпляр менеджера ролей
role_manager = RoleManager()


# Отдельные функции для совместимости
def can_promote_to_role(current_role: UserRole, target_role: UserRole) -> bool:
    """Проверяет, может ли пользователь с текущей ролью назначить целевую роль"""
    return role_manager.can_promote_to_role(current_role, target_role)


def get_available_roles_for_promotion(current_role: UserRole) -> List[UserRole]:
    """Получает список ролей, которые может назначить пользователь с текущей ролью"""
    return role_manager.get_available_roles_for_promotion(current_role)


def check_permission(user_role: UserRole, permission: Permission) -> bool:
    """Проверяет разрешение для роли пользователя"""
    global role_manager
    
    print(f"[PERMISSION CHECK] Role: {user_role}, Permission: {permission}")
    print(f"[PERMISSION CHECK] Role manager object: {role_manager}")
    print(f"[PERMISSION CHECK] Role manager type: {type(role_manager)}")
    print(f"[PERMISSION CHECK] Role manager has _role_permissions: {hasattr(role_manager, '_role_permissions')}")
    
    # ПРИНУДИТЕЛЬНАЯ ПЕРЕИНИЦИАЛИЗАЦИЯ ROLE_MANAGER
    print(f"[PERMISSION CHECK] Forcing role manager reinitialization...")
    role_manager = RoleManager()
    print(f"[PERMISSION CHECK] New role manager: {role_manager}")
    print(f"[PERMISSION CHECK] New role manager has _role_permissions: {hasattr(role_manager, '_role_permissions')}")
    if hasattr(role_manager, '_role_permissions'):
        print(f"[PERMISSION CHECK] Available roles: {list(role_manager._role_permissions.keys())}")
    
    permissions = role_manager.get_role_permissions(user_role)
    print(f"[PERMISSION CHECK] Role permissions: {permissions}")
    result = permission in permissions
    print(f"[PERMISSION CHECK] Result: {result}")
    return result


def get_user_permissions(user_role: UserRole) -> Dict[str, bool]:
    """Получает все разрешения пользователя в виде словаря"""
    permissions = role_manager.get_role_permissions(user_role)
    return {perm.value: True for perm in permissions}


def can_user_manage_group(user_role: UserRole, group_id: str, user_group_id: str = None) -> bool:
    """Проверяет, может ли пользователь управлять группой"""
    # Админы могут управлять всеми группами
    if user_role == UserRole.ADMIN:
        return True
    
    # Старосты могут управлять только своей группой
    if user_role == UserRole.MONITOR:
        return group_id == user_group_id
    
    # Студенты не могут управлять группами
    return False


def can_user_view_group_schedule(user_role: UserRole, group_id: str, user_group_id: str = None) -> bool:
    """Проверяет, может ли пользователь просматривать расписание группы"""
    # Админы могут просматривать все группы
    if user_role == UserRole.ADMIN:
        return True
    
    # Пользователи могут просматривать только свою группу
    return group_id == user_group_id


def can_user_edit_group_schedule(user_role: UserRole, group_id: str, user_group_id: str = None) -> bool:
    """Проверяет, может ли пользователь редактировать расписание группы"""
    # Админы могут редактировать все группы
    if user_role == UserRole.ADMIN:
        return True
    
    # Старосты могут редактировать только свою группу
    if user_role == UserRole.MONITOR:
        return group_id == user_group_id
    
    # Студенты не могут редактировать расписание
    return False

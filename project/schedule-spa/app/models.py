"""
Дополнительные модели для API Telegram Mini App
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from datetime import datetime
from enum import Enum


class UserProfileResponse(BaseModel):
    """Расширенный профиль пользователя"""
    id: int
    first_name: str
    last_name: Optional[str] = None
    username: Optional[str] = None
    photo_url: Optional[str] = None
    language_code: Optional[str] = None
    role: str
    role_display: str
    status: str
    group_id: Optional[str] = None
    group_name: Optional[str] = None
    created_at: Optional[str] = None
    last_seen: Optional[str] = None
    permissions: Dict[str, bool]


class GroupInfoResponse(BaseModel):
    """Информация о группе"""
    id: str
    name: str
    faculty_id: Optional[str] = None
    course_id: Optional[str] = None
    monitor_id: Optional[int] = None
    monitor_name: Optional[str] = None
    student_count: int
    created_at: Optional[str] = None


class UserListResponse(BaseModel):
    """Список пользователей с пагинацией"""
    users: List[UserProfileResponse]
    total: int
    page: int
    per_page: int
    total_pages: int


class GroupListResponse(BaseModel):
    """Список групп"""
    groups: List[GroupInfoResponse]
    total: int


class UserStatsResponse(BaseModel):
    """Статистика пользователей"""
    total_users: int
    total_groups: int
    active_users_week: int
    roles: Dict[str, int]
    statuses: Dict[str, int]


class PermissionCheckResponse(BaseModel):
    """Проверка разрешений"""
    can_view: bool
    can_edit: bool
    can_manage_users: bool
    can_manage_group: bool
    can_view_statistics: bool
    can_manage_system: bool
    user_role: str
    user_group: Optional[str] = None


class RoleUpdateResponse(BaseModel):
    """Ответ на обновление роли"""
    success: bool
    message: str
    user_id: int
    new_role: str
    group_id: Optional[str] = None


class GroupJoinRequest(BaseModel):
    """Запрос на присоединение к группе"""
    group_id: str


class GroupJoinResponse(BaseModel):
    """Ответ на присоединение к группе"""
    success: bool
    message: str
    group_id: str
    group_name: Optional[str] = None


class AuditLogResponse(BaseModel):
    """Запись аудита"""
    id: int
    user_id: int
    user_name: str
    action: str
    resource: Optional[str] = None
    details: Optional[str] = None
    created_at: str


class AuditLogListResponse(BaseModel):
    """Список записей аудита"""
    logs: List[AuditLogResponse]
    total: int
    page: int
    per_page: int
    total_pages: int


class SystemInfoResponse(BaseModel):
    """Информация о системе"""
    version: str
    database_status: str
    total_users: int
    total_groups: int
    uptime: str
    last_backup: Optional[str] = None


# === МОДЕЛИ ДЛЯ СИСТЕМЫ УВЕДОМЛЕНИЙ ===

class NotificationType(str, Enum):
    """Типы уведомлений"""
    HOMEWORK_ASSIGNED = "homework_assigned"
    HOMEWORK_UPDATED = "homework_updated" 
    HOMEWORK_DELETED = "homework_deleted"
    SCHEDULE_CHANGED = "schedule_changed"
    NEW_GROUP_MEMBER = "new_group_member"
    ROLE_CHANGED = "role_changed"
    SYSTEM_ANNOUNCEMENT = "system_announcement"
    REMINDER = "reminder"


class NotificationSettingsRequest(BaseModel):
    """Запрос на обновление настроек уведомлений"""
    notifications_enabled: bool = True
    homework_notifications: bool = True
    schedule_notifications: bool = True
    group_notifications: bool = True
    system_notifications: bool = True
    reminder_notifications: bool = True
    quiet_hours_start: Optional[str] = None  # "22:00"
    quiet_hours_end: Optional[str] = None  # "08:00"
    language: str = "ru"


class NotificationSettingsResponse(BaseModel):
    """Настройки уведомлений пользователя"""
    user_id: int
    notifications_enabled: bool
    homework_notifications: bool
    schedule_notifications: bool
    group_notifications: bool
    system_notifications: bool
    reminder_notifications: bool
    quiet_hours_start: Optional[str] = None
    quiet_hours_end: Optional[str] = None
    language: str
    updated_at: Optional[str] = None


class NotificationHistoryResponse(BaseModel):
    """Запись истории уведомлений"""
    id: int
    type: NotificationType
    title: str
    message: str
    data: Optional[Dict[str, Any]] = None
    sent: bool
    created_at: str
    sent_at: Optional[str] = None


class NotificationHistoryListResponse(BaseModel):
    """Список уведомлений пользователя"""
    notifications: List[NotificationHistoryResponse]
    total: int
    unread_count: int


class SendNotificationRequest(BaseModel):
    """Запрос на отправку уведомления (для админов)"""
    user_id: Optional[int] = None
    group_id: Optional[str] = None
    type: NotificationType
    title: str
    message: str
    data: Optional[Dict[str, Any]] = None


class SendNotificationResponse(BaseModel):
    """Ответ на отправку уведомления"""
    success: bool
    message: str
    sent_count: int = 0
    failed_count: int = 0

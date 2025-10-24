from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict

from .auth import TelegramUser, UserRole
from .database import db_manager


@dataclass
class UserGroup:
    group_id: str
    group_name: str
    monitor_user_id: Optional[int] = None
    student_user_ids: List[int] = None
    
    def __post_init__(self):
        if self.student_user_ids is None:
            self.student_user_ids = []


class UserManager:
    """Менеджер пользователей для Telegram Mini App (адаптирован для работы с SQLite)"""
    
    def __init__(self):
        # Используем глобальный менеджер базы данных
        self.db = db_manager
    
    def add_user(self, user: TelegramUser) -> TelegramUser:
        """Добавляем или обновляем пользователя"""
        success = self.db.add_user(user)
        if success:
            # Логируем действие
            self.db.log_audit(user.id, "user_added", "user", f"User {user.first_name} added/updated")
            return user
        else:
            raise Exception("Не удалось сохранить пользователя")
    
    def get_user(self, user_id: int) -> Optional[TelegramUser]:
        """Получаем пользователя по Telegram ID"""
        return self.db.get_user(user_id)
    
    def set_user_role(self, user_id: int, role: UserRole, group_id: Optional[str] = None) -> bool:
        """Устанавливаем роль пользователя"""
        success = self.db.update_user_role(user_id, role, group_id)
        if success:
            # Логируем действие
            self.db.log_audit(user_id, "role_updated", "user", f"Role changed to {role.value}, group: {group_id}")
        return success
    
    def get_group(self, group_id: str) -> Optional[UserGroup]:
        """Получаем группу по ID"""
        db_group = self.db.get_group(group_id)
        if not db_group:
            return None
        
        # Преобразуем в старый формат для совместимости
        return UserGroup(
            group_id=db_group.id,
            group_name=db_group.name,
            monitor_user_id=db_group.monitor_telegram_id,
            student_user_ids=[]  # Будет заполнено отдельным запросом
        )
    
    def get_group_monitor(self, group_id: str) -> Optional[TelegramUser]:
        """Получаем старосту группы"""
        return self.db.get_group_monitor(group_id)
    
    def get_group_students(self, group_id: str) -> List[TelegramUser]:
        """Получаем список студентов группы"""
        members = self.db.get_group_members(group_id)
        # Фильтруем только студентов (не старост и админов)
        return [user for user in members if user.role == UserRole.STUDENT]
    
    def is_user_in_group(self, user_id: int, group_id: str) -> bool:
        """Проверяем, состоит ли пользователь в группе"""
        members = self.db.get_group_members(group_id)
        return any(user.id == user_id for user in members)
    
    def remove_user_from_group(self, user_id: int, group_id: str) -> bool:
        """Удаляем пользователя из группы"""
        success = self.db.remove_user_from_group(user_id, group_id)
        if success:
            # Логируем действие
            self.db.log_audit(user_id, "removed_from_group", "group", f"Removed from group {group_id}")
        return success
    
    def create_group(self, group_id: str, group_name: str, monitor_user_id: Optional[int] = None) -> bool:
        """Создаем новую группу со старостой"""
        success = self.db.create_group(group_id, group_name, monitor_user_id)
        if success:
            actor_id = monitor_user_id if monitor_user_id is not None else 0
            self.db.log_audit(actor_id, "group_created", "group", f"Created group {group_id}")
        return success
    
    def add_user_to_group(self, user_id: int, group_id: str) -> bool:
        """Добавляем пользователя в группу"""
        success = self.db.add_user_to_group(user_id, group_id)
        if success:
            # Логируем действие
            self.db.log_audit(user_id, "added_to_group", "group", f"Added to group {group_id}")
        return success
    
    def get_all_users(self, limit: int = 100, offset: int = 0) -> List[TelegramUser]:
        """Получаем список всех пользователей с пагинацией"""
        return self.db.get_all_users(limit, offset)
    
    def get_user_stats(self) -> Dict[str, any]:
        """Получаем статистику пользователей"""
        return self.db.get_user_stats()
    
    def reset_data_file(self):
        """Сбрасываем данные пользователей (для совместимости)"""
        # В новой системе это не нужно, так как данные в базе
        print("⚠️ reset_data_file() устарел в новой системе с SQLite")
        return True


# Глобальный экземпляр менеджера пользователей
user_manager = UserManager()

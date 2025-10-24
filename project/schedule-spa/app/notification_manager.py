"""
Модуль системы уведомлений для Telegram Mini App
Интегрируется с Telegram Bot API для отправки уведомлений пользователям
"""

import requests
import json
import sqlite3
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any
from enum import Enum
from dataclasses import dataclass, asdict
from contextlib import contextmanager
from pathlib import Path

from .auth import TelegramUser, UserRole
from .database import DatabaseManager


class NotificationType(Enum):
    """Типы уведомлений"""
    HOMEWORK_ASSIGNED = "homework_assigned"
    HOMEWORK_UPDATED = "homework_updated" 
    HOMEWORK_DELETED = "homework_deleted"
    SCHEDULE_CHANGED = "schedule_changed"
    NEW_GROUP_MEMBER = "new_group_member"
    ROLE_CHANGED = "role_changed"
    SYSTEM_ANNOUNCEMENT = "system_announcement"
    REMINDER = "reminder"


@dataclass
class NotificationSettings:
    """Настройки уведомлений пользователя"""
    user_id: int
    notifications_enabled: bool = True
    homework_notifications: bool = True
    schedule_notifications: bool = True
    group_notifications: bool = True
    system_notifications: bool = True
    reminder_notifications: bool = True
    quiet_hours_start: Optional[str] = None  # "22:00"
    quiet_hours_end: Optional[str] = None    # "08:00"
    language: str = "ru"


@dataclass
class Notification:
    """Уведомление"""
    id: Optional[int] = None
    user_id: int = 0
    type: NotificationType = NotificationType.SYSTEM_ANNOUNCEMENT
    title: str = ""
    message: str = ""
    data: Dict[str, Any] = None
    sent: bool = False
    created_at: Optional[str] = None
    sent_at: Optional[str] = None
    
    def __post_init__(self):
        if self.data is None:
            self.data = {}
        if self.created_at is None:
            self.created_at = datetime.now().isoformat()


class TelegramNotificationService:
    """Сервис отправки уведомлений через Telegram Bot API"""
    
    def __init__(self, bot_token: str):
        self.bot_token = bot_token
        self.base_url = f"https://api.telegram.org/bot{bot_token}"
    
    async def send_notification(self, chat_id: int, notification: Notification) -> bool:
        """Отправляет уведомление пользователю"""
        try:
            message = self._format_notification_message(notification)
            
            url = f"{self.base_url}/sendMessage"
            data = {
                "chat_id": chat_id,
                "text": message,
                "parse_mode": "Markdown",
                "disable_web_page_preview": True
            }
            
            response = requests.post(url, json=data)
            result = response.json()
            
            if result.get("ok"):
                print(f"Уведомление отправлено пользователю {chat_id}: {notification.title}")
                return True
            else:
                print(f"Ошибка отправки уведомления: {result.get('description')}")
                return False
                
        except Exception as e:
            print(f"Исключение при отправке уведомления: {e}")
            return False
    
    def _format_notification_message(self, notification: Notification) -> str:
        """Форматирует сообщение уведомления"""
        icons = {
            NotificationType.HOMEWORK_ASSIGNED: "📝",
            NotificationType.HOMEWORK_UPDATED: "✏️",
            NotificationType.HOMEWORK_DELETED: "🗑️",
            NotificationType.SCHEDULE_CHANGED: "📅",
            NotificationType.NEW_GROUP_MEMBER: "👥",
            NotificationType.ROLE_CHANGED: "🔄",
            NotificationType.SYSTEM_ANNOUNCEMENT: "📢",
            NotificationType.REMINDER: "⏰"
        }
        
        icon = icons.get(notification.type, "📢")
        
        message = f"{icon} *{notification.title}*\n\n"
        message += f"{notification.message}\n\n"
        
        # Добавляем данные если есть
        if notification.data:
            if 'group_name' in notification.data:
                message += f"👥 *Группа:* {notification.data['group_name']}\n"
            if 'lesson_name' in notification.data:
                message += f"📚 *Предмет:* {notification.data['lesson_name']}\n"
            if 'homework_text' in notification.data:
                homework_preview = notification.data['homework_text'][:100]
                if len(notification.data['homework_text']) > 100:
                    homework_preview += "..."
                message += f"📋 *Задание:* {homework_preview}\n"
            if 'created_by' in notification.data:
                message += f"👤 *От:* {notification.data['created_by']}\n"
        
        message += f"\n🕐 {datetime.now().strftime('%H:%M, %d.%m.%Y')}"
        
        return message
    
    async def send_broadcast_notification(self, user_ids: List[int], notification: Notification) -> Dict[int, bool]:
        """Отправляет массовое уведомление группе пользователей"""
        results = {}
        
        for user_id in user_ids:
            # Получаем chat_id пользователя из базы данных
            chat_id = await self._get_user_chat_id(user_id)
            if chat_id:
                results[user_id] = await self.send_notification(chat_id, notification)
            else:
                results[user_id] = False
                print(f"Chat ID не найден для пользователя {user_id}")
        
        return results
    
    async def _get_user_chat_id(self, user_id: int) -> Optional[int]:
        """Получает chat_id пользователя из Telegram данных"""
        # В Telegram Bot API chat_id обычно равен user_id для приватных чатов
        return user_id


class NotificationManager:
    """Менеджер системы уведомлений"""
    
    def __init__(self, db_manager: DatabaseManager, bot_token: str):
        self.db_manager = db_manager
        self.tg_service = TelegramNotificationService(bot_token)
        self._init_notification_tables()
    
    def _init_notification_tables(self):
        """Инициализирует таблицы для системы уведомлений"""
        try:
            with self.db_manager.get_connection() as conn:
                # Таблица настроек уведомлений пользователей
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS notification_settings (
                        user_id INTEGER PRIMARY KEY,
                        notifications_enabled BOOLEAN DEFAULT 1,
                        homework_notifications BOOLEAN DEFAULT 1,
                        schedule_notifications BOOLEAN DEFAULT 1,
                        group_notifications BOOLEAN DEFAULT 1,
                        system_notifications BOOLEAN DEFAULT 1,
                        reminder_notifications BOOLEAN DEFAULT 1,
                        quiet_hours_start TEXT,
                        quiet_hours_end TEXT,
                        language TEXT DEFAULT 'ru',
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (user_id) REFERENCES users(telegram_id)
                    )
                """)
                
                # Таблица истории уведомлений
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS notifications (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id INTEGER NOT NULL,
                        type TEXT NOT NULL,
                        title TEXT NOT NULL,
                        message TEXT NOT NULL,
                        data TEXT,  -- JSON данные
                        sent BOOLEAN DEFAULT 0,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        sent_at TIMESTAMP,
                        FOREIGN KEY (user_id) REFERENCES users(telegram_id)
                    )
                """)
                
                # Индексы для оптимизации
                conn.execute("CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)")
                conn.execute("CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type)")
                conn.execute("CREATE INDEX IF NOT EXISTS idx_notifications_sent ON notifications(sent)")
                conn.execute("CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at)")
                
                conn.commit()
                print("Таблицы уведомлений инициализированы")
                
        except Exception as e:
            print(f"Ошибка инициализации таблиц уведомлений: {e}")
    
    def get_notification_settings(self, user_id: int) -> NotificationSettings:
        """Получает настройки уведомлений пользователя"""
        try:
            with self.db_manager.get_connection() as conn:
                row = conn.execute(
                    "SELECT * FROM notification_settings WHERE user_id = ?",
                    (user_id,)
                ).fetchone()
                
                if row:
                    return NotificationSettings(
                        user_id=row['user_id'],
                        notifications_enabled=bool(row['notifications_enabled']),
                        homework_notifications=bool(row['homework_notifications']),
                        schedule_notifications=bool(row['schedule_notifications']),
                        group_notifications=bool(row['group_notifications']),
                        system_notifications=bool(row['system_notifications']),
                        reminder_notifications=bool(row['reminder_notifications']),
                        quiet_hours_start=row['quiet_hours_start'],
                        quiet_hours_end=row['quiet_hours_end'],
                        language=row['language']
                    )
                else:
                    # Возвращаем настройки по умолчанию
                    return NotificationSettings(user_id=user_id)
                    
        except Exception as e:
            print(f"Ошибка получения настроек уведомлений: {e}")
            return NotificationSettings(user_id=user_id)
    
    def update_notification_settings(self, settings: NotificationSettings) -> bool:
        """Обновляет настройки уведомлений пользователя"""
        try:
            with self.db_manager.get_connection() as conn:
                conn.execute("""
                    INSERT OR REPLACE INTO notification_settings (
                        user_id, notifications_enabled, homework_notifications,
                        schedule_notifications, group_notifications, system_notifications,
                        reminder_notifications, quiet_hours_start, quiet_hours_end,
                        language, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    settings.user_id,                     settings.notifications_enabled,
                    settings.homework_notifications, settings.schedule_notifications,
                    settings.group_notifications, settings.system_notifications,
                    settings.reminder_notifications, settings.quiet_hours_start,
                    settings.quiet_hours_end, settings.language,
                    datetime.now().isoformat()
                ))
                conn.commit()
                return True
                
        except Exception as e:
            print(f"Ошибка обновления настроек уведомлений: {e}")
            return False
    
    async def should_send_notification(self, user_id: int, notification_type: NotificationType) -> bool:
        """Проверяет, нужно ли отправлять уведомление пользователю"""
        settings = self.get_notification_settings(user_id)
        
        # Общая проверка включенности уведомлений
        if not settings.notifications_enabled:
            return False
        
        # Проверка типов уведомлений
        notification_type_map = {
            NotificationType.HOMEWORK_ASSIGNED: settings.homework_notifications,
            NotificationType.HOMEWORK_UPDATED: settings.homework_notifications,
            NotificationType.HOMEWORK_DELETED: settings.homework_notifications,
            NotificationType.SCHEDULE_CHANGED: settings.schedule_notifications,
            NotificationType.NEW_GROUP_MEMBER: settings.group_notifications,
            NotificationType.ROLE_CHANGED: settings.group_notifications,
            NotificationType.SYSTEM_ANNOUNCEMENT: settings.system_notifications,
            NotificationType.REMINDER: settings.reminder_notifications
        }
        
        if not notification_type_map.get(notification_type, True):
            return False
        
        # Проверка времени тишины
        if settings.quiet_hours_start and settings.quiet_hours_end:
            current_time = datetime.now().time()
            start_time = datetime.strptime(settings.quiet_hours_start, "%H:%M").time()
            end_time = datetime.strptime(settings.quiet_hours_end, "%H:%M").time()
            
            if start_time <= end_time:
                # Обычное расписание (например, 22:00-08:00)
                if start_time <= current_time <= end_time:
                    return False
            else:
                # Переходящее время (например, 22:00-08:00 через полночь)
                if current_time >= start_time or current_time <= end_time:
                    return False
        
        return True
    
    async def send_notification(self, user_id: int, notification: Notification) -> bool:
        """Отправляет уведомление пользователю"""
        # Проверяем настройки
        if not await self.should_send_notification(user_id, notification.type):
            print(f"Уведомление пропущено для пользователя {user_id} (настройки)")
            return False
        
        try:
            # Сохраняем уведомление в базу данных
            with self.db_manager.get_connection() as conn:
                conn.execute("""
                    INSERT INTO notifications (
                        user_id, type, title, message, data, sent, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    user_id, notification.type.value, notification.title,
                    notification.message, json.dumps(notification.data),
                    False, notification.created_at
                ))
                
                notification_id = conn.lastrowid
                conn.commit()
            
            # Отправляем через Telegram
            success = await self.tg_service.send_notification(user_id, notification)
            
            # Обновляем статус отправки
            if success:
                with self.db_manager.get_connection() as conn:
                    conn.execute("""
                        UPDATE notifications 
                        SET sent = 1, sent_at = ?
                        WHERE id = ?
                    """, (datetime.now().isoformat(), notification_id))
                    conn.commit()
            
            return success
            
        except Exception as e:
            print(f"Ошибка отправки уведомления: {e}")
            return False
    
    async def send_group_notification(self, group_id: str, notification: Notification, 
                                    exclude_user_id: Optional[int] = None) -> Dict[int, bool]:
        """Отправляет уведомление всем участникам группы"""
        try:
            # Получаем участников группы
            group_members = self.db_manager.get_group_members(group_id)
            user_ids = [member.id for member in group_members]
            
            # Исключаем пользователя если указан
            if exclude_user_id:
                user_ids = [uid for uid in user_ids if uid != exclude_user_id]
            
            results = {}
            for user_id in user_ids:
                results[user_id] = await self.send_notification(user_id, notification)
            
            return results
            
        except Exception as e:
            print(f"Ошибка отправки группового уведомления: {e}")
            return {}
    
    def get_notification_history(self, user_id: int, limit: int = 50) -> List[Dict]:
        """Получает историю уведомлений пользователя"""
        try:
            with self.db_manager.get_connection() as conn:
                rows = conn.execute("""
                    SELECT * FROM notifications 
                    WHERE user_id = ?
                    ORDER BY created_at DESC
                    LIMIT ?
                """, (user_id, limit)).fetchall()
                
                return [dict(row) for row in rows]
                
        except Exception as e:
            print(f"Ошибка получения истории уведомлений: {e}")
            return []
    
    async def notify_homework_assigned(self, lesson_id: str, lesson_name: str, 
                                     homework_text: str, group_id: str, 
                                     created_by_user: TelegramUser) -> None:
        """Уведомляет группу о новом домашнем задании"""
        notification = Notification(
            user_id=0,  # Будет установлен при отправке
            type=NotificationType.HOMEWORK_ASSIGNED,
            title="Новое домашнее задание",
            message=f"Добавлено домашнее задание по предмету {lesson_name}",
            data={
                'lesson_id': lesson_id,
                'lesson_name': lesson_name,
                'homework_text': homework_text,
                'group_id': group_id,
                'created_by': f"{created_by_user.first_name} {created_by_user.last_name or ''}".strip()
            }
        )
        
        await self.send_group_notification(group_id, notification, exclude_user_id=created_by_user.id)
    
    async def notify_homework_updated(self, lesson_id: str, lesson_name: str, 
                                     homework_text: str, group_id: str, 
                                     updated_by_user: TelegramUser) -> None:
        """Уведомляет группу об обновлении домашнего задания"""
        notification = Notification(
            user_id=0,
            type=NotificationType.HOMEWORK_UPDATED,
            title="Обновлено домашнее задание",
            message=f"Изменено домашнее задание по предмету {lesson_name}",
            data={
                'lesson_id': lesson_id,
                'lesson_name': lesson_name,
                'homework_text': homework_text,
                'group_id': group_id,
                'updated_by': f"{updated_by_user.first_name} {updated_by_user.last_name or ''}".strip()
            }
        )
        
        await self.send_group_notification(group_id, notification, exclude_user_id=updated_by_user.id)
    
    async def notify_homework_deleted(self, lesson_id: str, lesson_name: str, 
                                    group_id: str, deleted_by_user: TelegramUser) -> None:
        notification = Notification(
            user_id=0,
            type=NotificationType.HOMEWORK_DELETED,
            title="Удалено домашнее задание",
            message=f"Удалено домашнее задание по предмету {lesson_name}",
            data={
                'lesson_id': lesson_id,
                'lesson_name': lesson_name,
                'group_id': group_id,  
                'deleted_by': f"{deleted_by_user.first_name} {deleted_by_user.last_name or ''}".strip()
            }
        )
        
        await self.send_group_notification(group_id, notification, exclude_user_id=deleted_by_user.id)


# Глобальная переменная для экземпляра менеджера уведомлений
notification_manager = None

def init_notification_manager(db_manager: DatabaseManager, bot_token: str) -> NotificationManager:
    """Инициализирует менеджер уведомлений"""
    global notification_manager
    notification_manager = NotificationManager(db_manager, bot_token)
    return notification_manager

def get_notification_manager() -> Optional[NotificationManager]:
    """Получает экземпляр менеджера уведомлений"""
    return notification_manager

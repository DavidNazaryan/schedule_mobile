"""
Модуль для работы с базой данных пользователей
Адаптирован для Telegram Mini App
"""

import sqlite3
import json
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from contextlib import contextmanager

from .auth import TelegramUser, UserRole


@dataclass
class UserStatus:
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"


@dataclass
class DatabaseUser:
    """Модель пользователя для базы данных"""
    id: Optional[int] = None
    telegram_id: int = 0
    first_name: str = ""
    last_name: Optional[str] = None
    username: Optional[str] = None
    photo_url: Optional[str] = None
    language_code: Optional[str] = None
    role: str = UserRole.STUDENT.value
    status: str = UserStatus.ACTIVE
    group_id: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    last_seen: Optional[str] = None


@dataclass
class DatabaseGroup:
    """Модель группы для базы данных"""
    id: str = ""
    name: str = ""
    faculty_id: Optional[str] = None
    course_id: Optional[str] = None
    monitor_telegram_id: Optional[int] = None
    created_at: Optional[str] = None


class DatabaseManager:
    """Менеджер базы данных для Telegram Mini App"""
    
    def __init__(self, db_file: str = "data/users.db"):
        self.db_file = Path(db_file)
        self.db_file.parent.mkdir(exist_ok=True)
        self._init_database()
    
    def _init_database(self):
        """Инициализирует базу данных, если она не существует"""
        if not self.db_file.exists():
            schema_file = Path("database/schema.sql")
            if schema_file.exists():
                with sqlite3.connect(self.db_file) as conn:
                    with open(schema_file, 'r', encoding='utf-8') as f:
                        schema_sql = f.read()
                    conn.executescript(schema_sql)
                    conn.commit()
                print(f"✅ База данных создана: {self.db_file}")
            else:
                print(f"⚠️ Схема базы данных не найдена: {schema_file}")
    
    @contextmanager
    def get_connection(self):
        """Контекстный менеджер для работы с базой данных"""
        conn = sqlite3.connect(self.db_file)
        conn.row_factory = sqlite3.Row  # Для доступа к колонкам по имени
        try:
            yield conn
        finally:
            conn.close()
    
    def add_user(self, user: TelegramUser) -> bool:
        """Добавляет или обновляет пользователя"""
        try:
            with self.get_connection() as conn:
                conn.execute("""
                    INSERT OR REPLACE INTO users (
                        telegram_id, first_name, last_name, username, 
                        photo_url, role, group_id, created_at, updated_at, last_seen
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    user.id,
                    user.first_name,
                    user.last_name,
                    user.username,
                    user.photo_url,
                    user.role.value,
                    user.group_id,
                    datetime.now().isoformat(),
                    datetime.now().isoformat(),
                    datetime.now().isoformat()
                ))
                conn.commit()
                return True
        except Exception as e:
            print(f"❌ Ошибка при добавлении пользователя: {e}")
            return False
    
    def get_user(self, telegram_id: int) -> Optional[TelegramUser]:
        """Получает пользователя по Telegram ID"""
        try:
            with self.get_connection() as conn:
                row = conn.execute(
                    "SELECT * FROM users WHERE telegram_id = ?", 
                    (telegram_id,)
                ).fetchone()
                
                if row:
                    return self._row_to_telegram_user(row)
                return None
        except Exception as e:
            print(f"❌ Ошибка при получении пользователя: {e}")
            return None
    
    def get_all_users(self, limit: int = 100, offset: int = 0) -> List[TelegramUser]:
        """Получает список всех пользователей с пагинацией"""
        try:
            with self.get_connection() as conn:
                rows = conn.execute(
                    "SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?",
                    (limit, offset)
                ).fetchall()
                
                return [self._row_to_telegram_user(row) for row in rows]
        except Exception as e:
            print(f"❌ Ошибка при получении пользователей: {e}")
            return []
    
    def update_user_role(self, telegram_id: int, role: UserRole, group_id: Optional[str] = None) -> bool:
        """Обновляет роль пользователя"""
        try:
            with self.get_connection() as conn:
                conn.execute("""
                    UPDATE users 
                    SET role = ?, group_id = ?, updated_at = ?
                    WHERE telegram_id = ?
                """, (role.value, group_id, datetime.now().isoformat(), telegram_id))
                
                # Обновляем связи с группами
                if group_id:
                    conn.execute("""
                        INSERT OR IGNORE INTO user_groups (user_telegram_id, group_id, joined_at)
                        VALUES (?, ?, ?)
                    """, (telegram_id, group_id, datetime.now().isoformat()))
                
                conn.commit()
                return True
        except Exception as e:
            print(f"❌ Ошибка при обновлении роли: {e}")
            return False
    
    def get_group(self, group_id: str) -> Optional[DatabaseGroup]:
        """Получает группу по ID"""
        try:
            with self.get_connection() as conn:
                row = conn.execute(
                    "SELECT * FROM groups WHERE id = ?", 
                    (group_id,)
                ).fetchone()
                
                if row:
                    return DatabaseGroup(
                        id=row['id'],
                        name=row['name'],
                        faculty_id=row['faculty_id'],
                        course_id=row['course_id'],
                        monitor_telegram_id=row['monitor_telegram_id'],
                        created_at=row['created_at']
                    )
                return None
        except Exception as e:
            print(f"❌ Ошибка при получении группы: {e}")
            return None
    
    def get_group_members(self, group_id: str) -> List[TelegramUser]:
        """Получает участников группы"""
        try:
            with self.get_connection() as conn:
                rows = conn.execute("""
                    SELECT u.* FROM users u
                    INNER JOIN user_groups ug ON u.telegram_id = ug.user_telegram_id
                    WHERE ug.group_id = ?
                    ORDER BY u.role DESC, u.first_name
                """, (group_id,)).fetchall()
                
                return [self._row_to_telegram_user(row) for row in rows]
        except Exception as e:
            print(f"❌ Ошибка при получении участников группы: {e}")
            return []
    
    def get_group_monitor(self, group_id: str) -> Optional[TelegramUser]:
        """Получает старосту группы"""
        try:
            with self.get_connection() as conn:
                row = conn.execute("""
                    SELECT u.* FROM users u
                    INNER JOIN groups g ON u.telegram_id = g.monitor_telegram_id
                    WHERE g.id = ?
                """, (group_id,)).fetchone()
                
                if row:
                    return self._row_to_telegram_user(row)
                return None
        except Exception as e:
            print(f"❌ Ошибка при получении старосты: {e}")
            return None
    
    def upsert_group(
        self,
        group_id: str,
        group_name: str,
        faculty_id: Optional[str] = None,
        course_id: Optional[str] = None,
        monitor_telegram_id: Optional[int] = None,
    ) -> bool:
        """Создает или обновляет запись о группе без назначения старосты."""
        try:
            with self.get_connection() as conn:
                now_iso = datetime.now().isoformat()
                conn.execute(
                    """
                    INSERT INTO groups (id, name, faculty_id, course_id, monitor_telegram_id, created_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET
                        name=COALESCE(excluded.name, groups.name),
                        faculty_id=COALESCE(excluded.faculty_id, groups.faculty_id),
                        course_id=COALESCE(excluded.course_id, groups.course_id),
                        monitor_telegram_id=CASE
                            WHEN excluded.monitor_telegram_id IS NOT NULL THEN excluded.monitor_telegram_id
                            ELSE groups.monitor_telegram_id
                        END
                    """,
                    (group_id, group_name, faculty_id, course_id, monitor_telegram_id, now_iso),
                )
                conn.commit()
                return True
        except Exception as e:
            print(f"❌ Ошибка при сохранении группы {group_id}: {e}")
            return False

    def create_group(
        self,
        group_id: str,
        group_name: str,
        monitor_telegram_id: Optional[int] = None,
        faculty_id: Optional[str] = None,
        course_id: Optional[str] = None,
    ) -> bool:
        """Создает новую группу со старостой (при наличии)."""
        try:
            success = self.upsert_group(
                group_id=group_id,
                group_name=group_name,
                faculty_id=faculty_id,
                course_id=course_id,
                monitor_telegram_id=monitor_telegram_id,
            )
            if not success:
                return False

            if monitor_telegram_id is None:
                return True

            with self.get_connection() as conn:
                conn.execute(
                    """
                    INSERT OR IGNORE INTO user_groups (user_telegram_id, group_id, joined_at)
                    VALUES (?, ?, ?)
                    """,
                    (monitor_telegram_id, group_id, datetime.now().isoformat()),
                )

                conn.execute(
                    """
                    UPDATE users
                    SET role = ?, group_id = ?, updated_at = ?
                    WHERE telegram_id = ?
                    """,
                    (UserRole.MONITOR.value, group_id, datetime.now().isoformat(), monitor_telegram_id),
                )

                conn.commit()

            return True
        except Exception as e:
            print(f"❌ Ошибка при создании группы: {e}")
            return False
    
    def add_user_to_group(self, telegram_id: int, group_id: str) -> bool:
        """Добавляет пользователя в группу"""
        try:
            with self.get_connection() as conn:
                conn.execute("""
                    INSERT OR IGNORE INTO user_groups (user_telegram_id, group_id, joined_at)
                    VALUES (?, ?, ?)
                """, (telegram_id, group_id, datetime.now().isoformat()))
                
                # Обновляем group_id у пользователя
                conn.execute("""
                    UPDATE users 
                    SET group_id = ?, updated_at = ?
                    WHERE telegram_id = ?
                """, (group_id, datetime.now().isoformat(), telegram_id))
                
                conn.commit()
                return True
        except Exception as e:
            print(f"❌ Ошибка при добавлении пользователя в группу: {e}")
            return False
    
    def remove_user_from_group(self, telegram_id: int, group_id: str) -> bool:
        """Удаляет пользователя из группы"""
        try:
            with self.get_connection() as conn:
                # Удаляем связь с группой
                conn.execute("""
                    DELETE FROM user_groups 
                    WHERE user_telegram_id = ? AND group_id = ?
                """, (telegram_id, group_id))
                
                # Если это староста, убираем его из группы
                conn.execute("""
                    UPDATE groups 
                    SET monitor_telegram_id = NULL 
                    WHERE id = ? AND monitor_telegram_id = ?
                """, (group_id, telegram_id))
                
                # Обновляем роль на студента
                conn.execute("""
                    UPDATE users 
                    SET role = ?, group_id = NULL, updated_at = ?
                    WHERE telegram_id = ?
                """, (UserRole.STUDENT.value, datetime.now().isoformat(), telegram_id))
                
                conn.commit()
                return True
        except Exception as e:
            print(f"❌ Ошибка при удалении пользователя из группы: {e}")
            return False
    
    def update_last_seen(self, telegram_id: int) -> bool:
        """Обновляет время последнего входа пользователя"""
        try:
            with self.get_connection() as conn:
                conn.execute("""
                    UPDATE users 
                    SET last_seen = ?
                    WHERE telegram_id = ?
                """, (datetime.now().isoformat(), telegram_id))
                conn.commit()
                return True
        except Exception as e:
            print(f"❌ Ошибка при обновлении last_seen: {e}")
            return False
    
    def log_audit(self, telegram_id: int, action: str, resource: str = None, details: str = None, ip_address: str = None):
        """Записывает действие в аудит"""
        try:
            with self.get_connection() as conn:
                conn.execute("""
                    INSERT INTO audit_log (user_telegram_id, action, resource, details, ip_address, created_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (telegram_id, action, resource, details, ip_address, datetime.now().isoformat()))
                conn.commit()
        except Exception as e:
            print(f"❌ Ошибка при записи аудита: {e}")
    
    def get_user_stats(self) -> Dict[str, Any]:
        """Получает статистику пользователей"""
        try:
            with self.get_connection() as conn:
                stats = {}
                
                # Общее количество пользователей
                stats['total_users'] = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
                
                # Статистика по ролям
                roles_stats = conn.execute("""
                    SELECT role, COUNT(*) as count 
                    FROM users 
                    GROUP BY role
                """).fetchall()
                stats['roles'] = {row['role']: row['count'] for row in roles_stats}
                
                # Статистика по статусам
                status_stats = conn.execute("""
                    SELECT status, COUNT(*) as count 
                    FROM users 
                    GROUP BY status
                """).fetchall()
                stats['statuses'] = {row['status']: row['count'] for row in status_stats}
                
                # Количество групп
                stats['total_groups'] = conn.execute("SELECT COUNT(*) FROM groups").fetchone()[0]
                
                # Активные пользователи за последние 7 дней
                week_ago = datetime.now() - timedelta(days=7)
                
                stats['active_users_week'] = conn.execute("""
                    SELECT COUNT(*) FROM users 
                    WHERE last_seen >= ?
                """, (week_ago.isoformat(),)).fetchone()[0]
                
                return stats
        except Exception as e:
            print(f"❌ Ошибка при получении статистики: {e}")
            return {}
    
    def add_homework_task(self, lesson_id: str, group_id: str, homework_text: str, created_by: int) -> bool:
        """Добавляет домашнее задание"""
        try:
            with self.get_connection() as conn:
                # Удаляем существующее домашнее задание для этого урока, если есть
                conn.execute("""
                    DELETE FROM homework_tasks 
                    WHERE lesson_id = ? AND group_id = ?
                """, (lesson_id, group_id))
                
                # Добавляем новое домашнее задание
                conn.execute("""
                    INSERT INTO homework_tasks (
                        lesson_id, group_id, homework_text, created_by, 
                        created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    lesson_id, group_id, homework_text, created_by,
                    datetime.now().isoformat(), datetime.now().isoformat()
                ))
                conn.commit()
                return True
        except Exception as e:
            print(f"❌ Ошибка при добавлении домашнего задания: {e}")
            return False
    
    def get_homework_task(self, lesson_id: str, group_id: str) -> Optional[dict]:
        """Получает домашнее задание для урока"""
        try:
            with self.get_connection() as conn:
                row = conn.execute("""
                    SELECT h.*, u.first_name, u.last_name 
                    FROM homework_tasks h
                    LEFT JOIN users u ON h.created_by = u.telegram_id
                    WHERE h.lesson_id = ? AND h.group_id = ?
                """, (lesson_id, group_id)).fetchone()
                
                if row:
                    return {
                        'id': row['id'],
                        'lesson_id': row['lesson_id'],
                        'group_id': row['group_id'],
                        'homework_text': row['homework_text'],
                        'created_by': row['created_by'],
                        'created_by_name': f"{row['first_name']} {row['last_name'] or ''}".strip(),
                        'created_at': row['created_at'],
                        'updated_at': row['updated_at']
                    }
                return None
        except Exception as e:
            print(f"❌ Ошибка при получении домашнего задания: {e}")
            return None
    
    def get_group_homework_tasks(self, group_id: str) -> List[dict]:
        """Получает все домашние задания для группы"""
        try:
            with self.get_connection() as conn:
                rows = conn.execute("""
                    SELECT h.*, u.first_name, u.last_name 
                    FROM homework_tasks h
                    LEFT JOIN users u ON h.created_by = u.telegram_id
                    WHERE h.group_id = ?
                    ORDER BY h.created_at DESC
                """, (group_id,)).fetchall()
                
                return [
                    {
                        'id': row['id'],
                        'lesson_id': row['lesson_id'],
                        'group_id': row['group_id'],
                        'homework_text': row['homework_text'],
                        'created_by': row['created_by'],
                        'created_by_name': f"{row['first_name']} {row['last_name'] or ''}".strip(),
                        'created_at': row['created_at'],
                        'updated_at': row['updated_at']
                    }
                    for row in rows
                ]
        except Exception as e:
            print(f"❌ Ошибка при получении домашних заданий группы: {e}")
            return []
    
    def delete_homework_task(self, lesson_id: str, group_id: str) -> bool:
        """Удаляет домашнее задание"""
        try:
            with self.get_connection() as conn:
                result = conn.execute("""
                    DELETE FROM homework_tasks 
                    WHERE lesson_id = ? AND group_id = ?
                """, (lesson_id, group_id))
                conn.commit()
                return result.rowcount > 0
        except Exception as e:
            print(f"❌ Ошибка при удалении домашнего задания: {e}")
            return False
    
    def update_homework_task(self, lesson_id: str, group_id: str, homework_text: str, updated_by: int) -> bool:
        """Обновляет домашнее задание"""
        try:
            with self.get_connection() as conn:
                result = conn.execute("""
                    UPDATE homework_tasks 
                    SET homework_text = ?, created_by = ?, updated_at = ?
                    WHERE lesson_id = ? AND group_id = ?
                """, (homework_text, updated_by, datetime.now().isoformat(), lesson_id, group_id))
                conn.commit()
                return result.rowcount > 0
        except Exception as e:
            print(f"❌ Ошибка при обновлении домашнего задания: {e}")
            return False

    def _row_to_telegram_user(self, row) -> TelegramUser:
        """Преобразует строку из базы данных в TelegramUser"""
        try:
            role = UserRole(row['role'])
        except ValueError:
            role = UserRole.STUDENT
        
        return TelegramUser(
            id=row['telegram_id'],
            first_name=row['first_name'],
            last_name=row['last_name'],
            username=row['username'],
            photo_url=row['photo_url'],
            role=role,
            group_id=row['group_id']
        )


# Глобальный экземпляр менеджера базы данных
db_manager = DatabaseManager()

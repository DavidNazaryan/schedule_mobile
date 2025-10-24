#!/usr/bin/env python3
"""
Миграционный скрипт для переноса данных пользователей из JSON в SQLite
Адаптирован для Telegram Mini App
"""

import json
import sqlite3
import os
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any, Optional


class DatabaseMigrator:
    def __init__(self, json_file: str = "data/users.json", db_file: str = "data/users.db"):
        self.json_file = Path(json_file)
        self.db_file = Path(db_file)
        self.schema_file = Path("database/schema.sql")
        
    def migrate(self) -> bool:
        """Выполняет миграцию данных из JSON в SQLite"""
        try:
            print("🔄 Начинаем миграцию данных пользователей...")
            
            # Проверяем существование файлов
            if not self.json_file.exists():
                print(f"❌ JSON файл не найден: {self.json_file}")
                return False
                
            if not self.schema_file.exists():
                print(f"❌ Схема базы данных не найдена: {self.schema_file}")
                return False
            
            # Создаем директорию для базы данных
            self.db_file.parent.mkdir(exist_ok=True)
            
            # Создаем базу данных
            self._create_database()
            
            # Загружаем данные из JSON
            json_data = self._load_json_data()
            if not json_data:
                print("❌ Не удалось загрузить данные из JSON")
                return False
            
            # Мигрируем пользователей
            users_migrated = self._migrate_users(json_data.get('users', []))
            print(f"✅ Мигрировано пользователей: {users_migrated}")
            
            # Мигрируем группы
            groups_migrated = self._migrate_groups(json_data.get('groups', []))
            print(f"✅ Мигрировано групп: {groups_migrated}")
            
            # Создаем резервную копию JSON файла
            self._create_backup()
            
            print("🎉 Миграция завершена успешно!")
            return True
            
        except Exception as e:
            print(f"❌ Ошибка при миграции: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def _create_database(self):
        """Создает базу данных по схеме"""
        print("📊 Создаем базу данных...")
        
        with sqlite3.connect(self.db_file) as conn:
            with open(self.schema_file, 'r', encoding='utf-8') as f:
                schema_sql = f.read()
            
            conn.executescript(schema_sql)
            conn.commit()
        
        print(f"✅ База данных создана: {self.db_file}")
    
    def _load_json_data(self) -> Optional[Dict[str, Any]]:
        """Загружает данные из JSON файла"""
        print("📖 Загружаем данные из JSON...")
        
        try:
            with open(self.json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            print(f"✅ Загружено данных: {len(data.get('users', []))} пользователей, {len(data.get('groups', []))} групп")
            return data
            
        except json.JSONDecodeError as e:
            print(f"❌ Ошибка JSON: {e}")
            return None
        except Exception as e:
            print(f"❌ Ошибка загрузки файла: {e}")
            return None
    
    def _migrate_users(self, users_data: List[Dict[str, Any]]) -> int:
        """Мигрирует пользователей из JSON в SQLite"""
        print("👥 Мигрируем пользователей...")
        
        migrated_count = 0
        
        with sqlite3.connect(self.db_file) as conn:
            for user_data in users_data:
                try:
                    # Проверяем обязательные поля
                    if 'id' not in user_data or 'first_name' not in user_data:
                        print(f"⚠️ Пропускаем пользователя с неполными данными: {user_data}")
                        continue
                    
                    # Проверяем роль
                    role = user_data.get('role', 'student')
                    if role not in ['student', 'monitor', 'admin']:
                        print(f"⚠️ Неверная роль {role}, устанавливаем 'student'")
                        role = 'student'
                    
                    # Вставляем пользователя
                    conn.execute("""
                        INSERT OR REPLACE INTO users (
                            telegram_id, first_name, last_name, username, 
                            photo_url, role, group_id, created_at, updated_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        user_data['id'],
                        user_data['first_name'],
                        user_data.get('last_name'),
                        user_data.get('username'),
                        user_data.get('photo_url'),
                        role,
                        user_data.get('group_id'),
                        datetime.now().isoformat(),
                        datetime.now().isoformat()
                    ))
                    
                    migrated_count += 1
                    
                except Exception as e:
                    print(f"❌ Ошибка при миграции пользователя {user_data.get('id', 'unknown')}: {e}")
                    continue
            
            conn.commit()
        
        return migrated_count
    
    def _migrate_groups(self, groups_data: List[Dict[str, Any]]) -> int:
        """Мигрирует группы из JSON в SQLite"""
        print("🏫 Мигрируем группы...")
        
        migrated_count = 0
        
        with sqlite3.connect(self.db_file) as conn:
            for group_data in groups_data:
                try:
                    # Проверяем обязательные поля
                    if 'group_id' not in group_data or 'group_name' not in group_data:
                        print(f"⚠️ Пропускаем группу с неполными данными: {group_data}")
                        continue
                    
                    # Вставляем группу
                    conn.execute("""
                        INSERT OR REPLACE INTO groups (
                            id, name, monitor_telegram_id, created_at
                        ) VALUES (?, ?, ?, ?)
                    """, (
                        group_data['group_id'],
                        group_data['group_name'],
                        group_data.get('monitor_user_id'),
                        datetime.now().isoformat()
                    ))
                    
                    # Добавляем связи пользователей с группами
                    monitor_id = group_data.get('monitor_user_id')
                    if monitor_id:
                        conn.execute("""
                            INSERT OR IGNORE INTO user_groups (user_telegram_id, group_id, joined_at)
                            VALUES (?, ?, ?)
                        """, (monitor_id, group_data['group_id'], datetime.now().isoformat()))
                    
                    # Добавляем студентов группы
                    student_ids = group_data.get('student_user_ids', [])
                    for student_id in student_ids:
                        conn.execute("""
                            INSERT OR IGNORE INTO user_groups (user_telegram_id, group_id, joined_at)
                            VALUES (?, ?, ?)
                        """, (student_id, group_data['group_id'], datetime.now().isoformat()))
                    
                    migrated_count += 1
                    
                except Exception as e:
                    print(f"❌ Ошибка при миграции группы {group_data.get('group_id', 'unknown')}: {e}")
                    continue
            
            conn.commit()
        
        return migrated_count
    
    def _create_backup(self):
        """Создает резервную копию JSON файла"""
        backup_file = self.json_file.with_suffix('.json.backup')
        try:
            import shutil
            shutil.copy2(self.json_file, backup_file)
            print(f"💾 Создана резервная копия: {backup_file}")
        except Exception as e:
            print(f"⚠️ Не удалось создать резервную копию: {e}")
    
    def verify_migration(self) -> bool:
        """Проверяет корректность миграции"""
        print("🔍 Проверяем корректность миграции...")
        
        try:
            with sqlite3.connect(self.db_file) as conn:
                # Проверяем количество пользователей
                users_count = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
                print(f"📊 Пользователей в базе: {users_count}")
                
                # Проверяем количество групп
                groups_count = conn.execute("SELECT COUNT(*) FROM groups").fetchone()[0]
                print(f"📊 Групп в базе: {groups_count}")
                
                # Проверяем связи пользователей с группами
                user_groups_count = conn.execute("SELECT COUNT(*) FROM user_groups").fetchone()[0]
                print(f"📊 Связей пользователь-группа: {user_groups_count}")
                
                # Показываем статистику по ролям
                roles_stats = conn.execute("""
                    SELECT role, COUNT(*) as count 
                    FROM users 
                    GROUP BY role
                """).fetchall()
                
                print("📈 Статистика по ролям:")
                for role, count in roles_stats:
                    print(f"  - {role}: {count}")
                
                return True
                
        except Exception as e:
            print(f"❌ Ошибка при проверке: {e}")
            return False


def main():
    """Основная функция миграции"""
    print("🚀 Миграция системы пользователей для Telegram Mini App")
    print("=" * 60)
    
    migrator = DatabaseMigrator()
    
    # Выполняем миграцию
    success = migrator.migrate()
    
    if success:
        # Проверяем результат
        migrator.verify_migration()
        
        print("\n" + "=" * 60)
        print("✅ Миграция завершена успешно!")
        print("\n📋 Следующие шаги:")
        print("1. Обновите код для работы с SQLite вместо JSON")
        print("2. Протестируйте новую систему")
        print("3. Удалите старый JSON файл после успешного тестирования")
    else:
        print("\n" + "=" * 60)
        print("❌ Миграция завершилась с ошибками!")
        print("Проверьте логи выше для диагностики проблем.")


if __name__ == "__main__":
    main()

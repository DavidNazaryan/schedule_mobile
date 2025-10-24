#!/usr/bin/env python3
"""
Скрипт для проверки структуры базы данных
"""

import sqlite3
from pathlib import Path


def check_database():
    """Проверяет структуру базы данных"""
    db_file = Path("data/users.db")
    
    if not db_file.exists():
        print("❌ База данных не найдена")
        return False
    
    try:
        conn = sqlite3.connect(db_file)
        cursor = conn.cursor()
        
        # Получаем список таблиц
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = cursor.fetchall()
        print("📊 Таблицы в базе данных:")
        for table in tables:
            print(f"  - {table[0]}")
        
        # Проверяем структуру каждой таблицы
        for table in tables:
            table_name = table[0]
            print(f"\n🔍 Структура таблицы '{table_name}':")
            cursor.execute(f"PRAGMA table_info({table_name})")
            columns = cursor.fetchall()
            for col in columns:
                print(f"  - {col[1]} ({col[2]})")
        
        # Проверяем количество записей
        print(f"\n📈 Количество записей:")
        for table in tables:
            table_name = table[0]
            cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
            count = cursor.fetchone()[0]
            print(f"  - {table_name}: {count}")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Ошибка при проверке базы данных: {e}")
        return False


if __name__ == "__main__":
    print("🔍 Проверка структуры базы данных")
    print("=" * 40)
    check_database()

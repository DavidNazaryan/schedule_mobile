#!/usr/bin/env python3
"""
Скрипт для запуска миграции данных пользователей
"""

import sys
from pathlib import Path

# Добавляем корневую директорию проекта в путь
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from migrate_to_sqlite import DatabaseMigrator


def main():
    """Запускает миграцию данных"""
    print("🚀 Запуск миграции системы пользователей")
    print("=" * 50)
    
    # Проверяем существование файлов
    json_file = project_root / "data" / "users.json"
    if not json_file.exists():
        print(f"❌ JSON файл не найден: {json_file}")
        print("Создаем пустую базу данных...")
        
        # Создаем пустую базу данных
        migrator = DatabaseMigrator()
        migrator._create_database()
        print("✅ Пустая база данных создана")
        return True
    
    # Выполняем миграцию
    migrator = DatabaseMigrator()
    success = migrator.migrate()
    
    if success:
        print("\n🎉 Миграция завершена успешно!")
        print("\n📋 Следующие шаги:")
        print("1. Протестируйте новую систему")
        print("2. Убедитесь, что все функции работают корректно")
        print("3. После успешного тестирования можно удалить старый JSON файл")
        
        # Показываем статистику
        print("\n📊 Статистика миграции:")
        migrator.verify_migration()
        
    else:
        print("\n❌ Миграция завершилась с ошибками!")
        print("Проверьте логи выше для диагностики проблем.")
    
    return success


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

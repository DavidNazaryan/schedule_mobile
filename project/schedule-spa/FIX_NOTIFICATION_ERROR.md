# 🔧 Исправление ошибки "no such table: notification_settings"

## ❌ Проблема
```
❌ Ошибка получения настроек уведомлений: no such table: notification_settings
```

## ✅ Решение

### Вариант 1: Автоматическое исправление (рекомендуется)

1. **Запустите скрипт исправления**:
```bash
python fix_notification_tables.py
```

2. **Перезапустите сервер**:
```bash
uvicorn app.main:app --reload --port 8000
```

### Вариант 2: Ручное исправление

1. **Остановите сервер** (Ctrl+C)

2. **Создайте таблицы вручную**:
```bash
python -c "
import sqlite3
conn = sqlite3.connect('data/users.db')
conn.execute('''
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
    language TEXT DEFAULT \"ru\",
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(telegram_id)
)
''')
conn.execute('''
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data TEXT,
    sent BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(telegram_id)
)
''')
conn.commit()
print('Таблицы созданы!')
conn.close()
"
```

3. **Запустите сервер**:
```bash
uvicorn app.main:app --reload --port 8000
```

### Вариант 3: Полная пересборка базы данных

1. **Удалите существующую базу данных**:
```bash
rm data/users.db
```

2. **Запустите сервер** (база создастся заново с новыми таблицами):
```bash
uvicorn app.main:app --reload --port 8000
```

## ✅ Проверка

После исправления проверьте:

1. **Запустите тест**:
```bash
python test_notifications.py
```

2. **В логах сервера должно быть**:
```
✅ Таблицы уведомлений инициализированы
```

3. **В Telegram боте**:
   - Откройте приложение
   - Зайдите в настройки
   - Должна появиться кнопка "🔔 Уведомления"

## 🎯 Ожидаемый результат

После исправления система уведомлений заработает и:
- ✅ Пользователи смогут настраивать уведомления
- ✅ Админы смогут отправлять сообщения
- ✅ Автоматические уведомления о ДЗ будут работать
- ✅ История уведомлений будет сохраняться

## 🆘 Если ошибка остается

1. Проверьте что файл `data/users.db` существует
2. Убедитесь что таблица `users` создана и содержит данные  
3. Проверьте права доступа к файлу базы данных
4. Используйте полную пересборку (Вариант 3)




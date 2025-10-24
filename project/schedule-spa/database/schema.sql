-- Схема базы данных для Telegram Mini App
-- Создана для системы расписания МГУ

-- Пользователи (Telegram-специфичные поля)
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id INTEGER UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT,
    username TEXT,
    photo_url TEXT,
    language_code TEXT,
    role TEXT DEFAULT 'student' CHECK (role IN ('student', 'monitor', 'admin')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    group_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Группы (упрощенная структура)
CREATE TABLE groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    faculty_id TEXT,
    course_id TEXT,
    monitor_telegram_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (monitor_telegram_id) REFERENCES users(telegram_id)
);

-- Связь пользователей с группами (многие ко многим)
CREATE TABLE user_groups (
    user_telegram_id INTEGER,
    group_id TEXT,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_telegram_id, group_id),
    FOREIGN KEY (user_telegram_id) REFERENCES users(telegram_id),
    FOREIGN KEY (group_id) REFERENCES groups(id)
);

-- Домашние задания
CREATE TABLE homework_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lesson_id TEXT NOT NULL,
    group_id TEXT NOT NULL,
    homework_text TEXT NOT NULL,
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(telegram_id)
);

-- Настройки уведомлений пользователей
CREATE TABLE notification_settings (
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
);

-- История уведомлений
CREATE TABLE notifications (
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
);

-- Аудит действий (упрощенный)
CREATE TABLE audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_telegram_id INTEGER,
    action TEXT NOT NULL,
    resource TEXT,
    details TEXT,
    ip_address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_telegram_id) REFERENCES users(telegram_id)
);

-- Индексы для оптимизации запросов
CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_users_group_id ON users(group_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_groups_monitor ON groups(monitor_telegram_id);
CREATE INDEX idx_homework_lesson_id ON homework_tasks(lesson_id);
CREATE INDEX idx_homework_group_id ON homework_tasks(group_id);
CREATE INDEX idx_homework_created_by ON homework_tasks(created_by);
CREATE INDEX idx_homework_created_at ON homework_tasks(created_at);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_sent ON notifications(sent);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_audit_log_user ON audit_log(user_telegram_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_created ON audit_log(created_at);

-- Триггеры для автоматического обновления updated_at
CREATE TRIGGER update_users_timestamp 
    AFTER UPDATE ON users
    FOR EACH ROW
    BEGIN
        UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER update_homework_timestamp 
    AFTER UPDATE ON homework_tasks
    FOR EACH ROW
    BEGIN
        UPDATE homework_tasks SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

-- Триггер для автоматического обновления last_seen при входе
CREATE TRIGGER update_last_seen 
    AFTER UPDATE OF last_seen ON users
    FOR EACH ROW
    BEGIN
        UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

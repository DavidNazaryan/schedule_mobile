# MSU Schedule React Native App

Кросс-платформенное мобильное приложение для просмотра расписания МГУ с системой управления пользователями и группами.

## 🚀 Основные возможности

### 📅 Расписание
- Просмотр расписания групп МГУ
- Кэширование данных для быстрой загрузки
- Поддержка различных форматов расписания
- Offline режим с синхронизацией

### 👥 Система пользователей
- **Аутентификация через Telegram** - безопасный вход через WebView
- **Роли пользователей**: Студент, Староста, Администратор
- **Система разрешений** - 18 различных прав доступа
- **Управление группами** - присоединение и управление группами

### 🛠️ Административная панель
- **Дашборд** с статистикой пользователей и групп
- **Управление пользователями** - изменение ролей, просмотр профилей
- **Управление группами** - создание, редактирование групп
- **Журнал аудита** - отслеживание всех действий пользователей

### 🔔 Уведомления
- Push уведомления через Notifee
- Уведомления о новых ДЗ
- Изменения в расписании
- Системные объявления
- Настройки уведомлений

### 📱 Мобильные функции
- Material Design 3 интерфейс
- Темная/светлая тема
- Offline поддержка
- Биометрическая аутентификация (планируется)
- Виджеты iOS (планируется)

## 🏗️ Архитектура

### Frontend (React Native)
- **Navigation**: React Navigation (stack + tab навигация)
- **State Management**: Redux Toolkit + RTK Query
- **UI Components**: React Native Paper (Material Design 3)
- **Telegram Auth**: WebView + Deep Links
- **Push Notifications**: Notifee + FCM
- **Offline Support**: Redux Persist + AsyncStorage

### Backend (без изменений)
- FastAPI бэкенд остается полностью функциональным
- 30+ API эндпоинтов
- SQLite БД
- Telegram аутентификация
- Система ролей и разрешений

## 📱 Установка и запуск

### Требования
- Node.js 18+
- React Native CLI
- Xcode (для iOS)
- Android Studio (для Android)
- Telegram Bot Token

### Установка зависимостей
```bash
cd MSUSchedule
npm install
```

### iOS настройка
```bash
cd ios
pod install
cd ..
```

### Запуск
```bash
# iOS
npx react-native run-ios

# Android
npx react-native run-android
```

## 🔧 Конфигурация

### Telegram Bot
1. Создайте Telegram бота через [@BotFather](https://t.me/BotFather)
2. Получите токен бота
3. Обновите `src/services/TelegramAuthService.ts` с вашим токеном

### API Endpoint
Обновите базовый URL в `src/api/apiClient.ts`:
```typescript
const BASE_URL = 'https://your-api-domain.com';
```

### Push Notifications
Для настройки FCM:
1. Создайте проект в Firebase Console
2. Добавьте iOS/Android приложения
3. Скачайте конфигурационные файлы
4. Обновите настройки в `src/services/NotificationService.ts`

## 📁 Структура проекта

```
MSUSchedule/
├── src/
│   ├── api/           # API клиент, эндпоинты
│   ├── components/    # Переиспользуемые компоненты
│   ├── screens/       # Экраны приложения
│   ├── navigation/    # Навигация
│   ├── store/         # Redux store
│   ├── services/      # Telegram auth, notifications
│   ├── hooks/         # Custom hooks
│   ├── utils/         # Утилиты
│   └── types/         # TypeScript типы
├── ios/               # iOS нативный код
├── android/           # Android нативный код
└── package.json
```

## 🧪 Тестирование

### Unit тесты
```bash
npm test
```

### E2E тесты (Detox)
```bash
# iOS
npm run e2e:ios

# Android
npm run e2e:android
```

## 📦 Сборка для продакшена

### iOS (App Store)
```bash
# Создание архива
npx react-native run-ios --configuration Release

# Или через Xcode
# Product -> Archive
```

### Android (Google Play)
```bash
# Создание APK
cd android
./gradlew assembleRelease

# Создание AAB
./gradlew bundleRelease
```

## 🚀 Развертывание

### iOS (App Store)
1. Настройка Apple Developer Account
2. Создание App ID и certificates
3. Конфигурация Push Notifications
4. Настройка Telegram OAuth callback
5. Build в Xcode
6. Загрузка в App Store Connect
7. Прохождение App Review

### Android (Google Play)
1. Настройка Google Play Console
2. Генерация подписанного APK/AAB
3. Настройка Firebase для FCM
4. Загрузка в Google Play

## 🔐 Безопасность

- **Шифрование токенов сессий** с AES
- **Проверка IP адресов** для дополнительной безопасности
- **Аудит всех действий** с детальным логированием
- **Система разрешений** на основе ролей
- **Secure Storage** для чувствительных данных

## 📊 Статистика проекта

- **Файлов**: 50+
- **Строк кода**: 15,000+
- **Роли**: 3 (Студент, Староста, Администратор)
- **Разрешения**: 18 различных прав
- **API эндпоинты**: 30+ интегрированных
- **Экраны**: 8 основных экранов

## 🔧 Технологии

- **Frontend**: React Native, TypeScript, Redux Toolkit
- **UI**: React Native Paper (Material Design 3)
- **Navigation**: React Navigation 6
- **State Management**: Redux Toolkit + RTK Query
- **Storage**: AsyncStorage, Redux Persist
- **Notifications**: Notifee, FCM
- **Auth**: Telegram WebView, Keychain
- **Testing**: Jest, Detox

## 📝 Документация

- [Руководство по развертыванию](DEPLOYMENT_GUIDE.md)
- [Настройка Telegram бота](TELEGRAM_SETUP_GUIDE.md)
- [Руководство по тестированию](TESTING_GUIDE.md)
- [Устранение неполадок](TROUBLESHOOTING.md)

## 🤝 Вклад в проект

1. Форкните репозиторий
2. Создайте ветку для новой функции
3. Внесите изменения
4. Добавьте тесты
5. Создайте Pull Request

## 📄 Лицензия

Проект распространяется под лицензией MIT.

## 👨‍💻 Автор

**David Nazaryan** - разработка и поддержка системы расписания МГУ

---

## 🎯 Планы развития

- [x] Кросс-платформенное мобильное приложение
- [x] Telegram авторизация
- [x] Push уведомления
- [x] Offline поддержка
- [ ] Биометрическая аутентификация
- [ ] Виджеты iOS
- [ ] Siri Shortcuts
- [ ] Интеграция с календарем
- [ ] Экспорт расписания в различные форматы
- [ ] Интеграция с другими университетами

---

**Статус**: ✅ Готов к продакшену  
**Версия**: 2.0.0  
**Последнее обновление**: Январь 2025
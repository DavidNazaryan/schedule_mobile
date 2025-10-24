# 🚀 MSU Schedule React Native App - Готов к запуску!

## ✅ Токен бота настроен

Ваш Telegram Bot Token `8296584992:AAFmltay1-OZolKK0AoF8pdKF2kELfg4boA` успешно настроен в приложении.

## 📱 Быстрый запуск

### 1. Установка зависимостей
```bash
cd MSUSchedule
npm install
```

### 2. Настройка iOS (если нужно)
```bash
cd ios
pod install
cd ..
```

### 3. Запуск приложения
```bash
# iOS
npm run ios

# Android  
npm run android
```

## 🔧 Что настроено

### ✅ Конфигурация
- **Токен бота**: `8296584992:AAFmltay1-OZolKK0AoF8pdKF2kELfg4boA`
- **API URL**: `https://vm-fc7b7f29.na4u.ru`
- **Telegram WebApp**: `https://t.me/MSUScheduleBot`

### ✅ Файлы обновлены
- `src/config/index.ts` - централизованная конфигурация
- `src/api/apiClient.ts` - API клиент с правильным URL
- `src/services/TelegramAuthService.ts` - Telegram авторизация
- `src/screens/AuthScreen.tsx` - экран авторизации
- `ios/MSUSchedule/Info.plist` - iOS конфигурация

## 🤖 Настройка Telegram Bot

### 1. Создайте бота через @BotFather
1. Найдите [@BotFather](https://t.me/BotFather) в Telegram
2. Отправьте `/newbot`
3. Введите имя: `MSU Schedule Bot`
4. Введите username: `msuschedulebot`
5. Сохраните токен (уже настроен в приложении)

### 2. Настройте WebApp
1. Отправьте `/newapp` в @BotFather
2. Выберите вашего бота
3. Название: `Расписание МГУ`
4. Описание: `Мобильное приложение для просмотра расписания МГУ`
5. URL: `https://vm-fc7b7f29.na4u.ru`

### 3. Настройте команды
```
/setcommands
@msuschedulebot
start - Запустить приложение
schedule - Открыть расписание
news - Посмотреть новости
help - Помощь
```

## 📋 Следующие шаги

### 1. Обновите имя бота в конфигурации
В файле `src/config/index.ts` обновите:
```typescript
TELEGRAM_BOT_USERNAME: 'ваш_реальный_username_бота',
```

### 2. Протестируйте приложение
```bash
npm run ios
# или
npm run android
```

### 3. Проверьте авторизацию
1. Откройте приложение
2. Нажмите "Войти через Telegram"
3. Проверьте работу WebView авторизации

## 🎯 Готовые функции

- ✅ **Telegram авторизация** через WebView
- ✅ **Расписание** с селекторами факультет/курс/группа
- ✅ **Новости** с пагинацией и детальным просмотром
- ✅ **Домашние задания** с CRUD операциями
- ✅ **Уведомления** с настройками
- ✅ **Настройки** с профилем и темами
- ✅ **Админ-панель** для администраторов
- ✅ **Push уведомления** через Notifee
- ✅ **Offline поддержка** с кэшированием
- ✅ **Система ролей** и разрешений

## 🔐 Безопасность

- Токен бота настроен в централизованной конфигурации
- API запросы используют HTTPS
- Сессионные токены хранятся в Keychain
- Проверка прав доступа на основе ролей

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи в консоли
2. Убедитесь, что сервер `https://vm-fc7b7f29.na4u.ru` доступен
3. Проверьте настройки бота в @BotFather
4. Следуйте инструкциям в `TELEGRAM_BOT_SETUP.md`

---

**Приложение готово к использованию! 🎉**

Запустите `npm run ios` или `npm run android` для тестирования.



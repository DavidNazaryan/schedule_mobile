# Настройка Telegram Bot для MSU Schedule App

## 🤖 Создание Telegram Bot

### 1. Создание бота через BotFather

1. Откройте Telegram и найдите [@BotFather](https://t.me/BotFather)
2. Отправьте команду `/newbot`
3. Введите имя бота: `MSU Schedule Bot`
4. Введите username бота: `msuschedulebot` (должен заканчиваться на 'bot')
5. Сохраните полученный токен: `8296584992:AAFmltay1-OZolKK0AoF8pdKF2kELfg4boA`

### 2. Настройка WebApp

1. Отправьте BotFather команду `/newapp`
2. Выберите вашего бота
3. Введите название приложения: `Расписание МГУ`
4. Введите описание: `Мобильное приложение для просмотра расписания МГУ`
5. Загрузите иконку приложения (512x512 PNG)
6. Введите URL приложения: `https://vm-fc7b7f29.na4u.ru`

### 3. Настройка команд бота

Отправьте BotFather следующие команды:

```
/setcommands
@msuschedulebot
start - Запустить приложение
schedule - Открыть расписание
news - Посмотреть новости
help - Помощь
```

### 4. Настройка меню бота

```
/setmenubutton
@msuschedulebot
Расписание МГУ
https://vm-fc7b7f29.na4u.ru
```

## 📱 Обновление конфигурации приложения

### 1. Обновите имя бота в конфигурации

В файле `src/config/index.ts` обновите:

```typescript
export const CONFIG = {
  // Telegram Bot Configuration
  TELEGRAM_BOT_TOKEN: '8296584992:AAFmltay1-OZolKK0AoF8pdKF2kELfg4boA',
  TELEGRAM_BOT_USERNAME: 'msuschedulebot', // Обновите на реальное имя бота
  
  // URLs
  TELEGRAM_WEBAPP_URL: 'https://t.me/msuschedulebot',
  TELEGRAM_APP_URL: 'tg://resolve?domain=msuschedulebot',
};
```

### 2. Обновите Info.plist для iOS

В файле `ios/MSUSchedule/Info.plist` обновите URL схемы:

```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLName</key>
        <string>msu-schedule</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>msu-schedule</string>
        </array>
    </dict>
    <dict>
        <key>CFBundleURLName</key>
        <string>telegram</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>tg</string>
        </array>
    </dict>
</array>
```

## 🔧 Настройка WebApp на сервере

### 1. Обновите telegram_config.py

В файле `telegram_config.py` обновите:

```python
TELEGRAM_BOT_TOKEN = "8296584992:AAFmltay1-OZolKK0AoF8pdKF2kELfg4boA"
TELEGRAM_WEBHOOK_URL = "https://vm-fc7b7f29.na4u.ru/webhook"
WEBAPP_URL = "https://vm-fc7b7f29.na4u.ru"
```

### 2. Настройка Webhook

Запустите скрипт настройки webhook:

```bash
python setup_webhook.py
```

## 🧪 Тестирование

### 1. Тест бота

1. Найдите вашего бота в Telegram: `@msuschedulebot`
2. Отправьте команду `/start`
3. Проверьте, что появляется кнопка "Расписание МГУ"

### 2. Тест WebApp

1. Нажмите на кнопку "Расписание МГУ" в боте
2. Проверьте, что открывается WebApp
3. Проверьте авторизацию через Telegram

### 3. Тест мобильного приложения

```bash
# Запуск приложения
npm run ios
# или
npm run android
```

## 🔐 Безопасность

### 1. Проверка токена

Убедитесь, что токен бота правильно настроен в:
- `src/config/index.ts`
- `telegram_config.py`
- `src/services/TelegramAuthService.ts`

### 2. Проверка домена

Убедитесь, что домен `vm-fc7b7f29.na4u.ru` правильно настроен в:
- `ios/MSUSchedule/Info.plist` (NSExceptionDomains)
- `src/api/apiClient.ts` (BASE_URL)

## 📋 Чек-лист настройки

- [ ] Bot создан через BotFather
- [ ] WebApp настроен через BotFather
- [ ] Команды бота настроены
- [ ] Меню бота настроено
- [ ] Токен обновлен в конфигурации
- [ ] URL схемы обновлены в Info.plist
- [ ] Webhook настроен на сервере
- [ ] Бот протестирован в Telegram
- [ ] WebApp протестирован
- [ ] Мобильное приложение протестировано

## 🚨 Устранение неполадок

### Проблема: WebApp не открывается

**Решение:**
1. Проверьте URL в BotFather
2. Проверьте настройки домена в Info.plist
3. Убедитесь, что сервер доступен

### Проблема: Ошибка авторизации

**Решение:**
1. Проверьте токен бота
2. Проверьте настройки webhook
3. Проверьте логи сервера

### Проблема: Deep Links не работают

**Решение:**
1. Проверьте URL схемы в Info.plist
2. Проверьте настройки в CONFIG
3. Перезапустите приложение

---

**Бот настроен и готов к использованию! 🚀**



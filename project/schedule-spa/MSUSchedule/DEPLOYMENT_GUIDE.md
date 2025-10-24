# Руководство по развертыванию MSU Schedule React Native App

## 📋 Предварительные требования

### Системные требования
- **Node.js**: 18+ 
- **npm**: 9+
- **React Native CLI**: 0.82+
- **Xcode**: 15+ (для iOS)
- **Android Studio**: 2023.1+ (для Android)
- **CocoaPods**: 1.15+ (для iOS)

### Аккаунты разработчика
- **Apple Developer Account** ($99/год)
- **Google Play Console** ($25 единоразово)
- **Telegram Bot Token** (бесплатно)

## 🚀 Быстрый старт

### 1. Клонирование и установка
```bash
git clone <repository-url>
cd MSUSchedule
npm install
```

### 2. Настройка iOS
```bash
cd ios
pod install
cd ..
```

### 3. Настройка конфигурации
```bash
# Скопируйте и отредактируйте конфигурационные файлы
cp src/config/example.ts src/config/index.ts
# Обновите API URL и Telegram Bot Token
```

### 4. Запуск в режиме разработки
```bash
# iOS
npm run ios

# Android
npm run android
```

## 🔧 Конфигурация

### API Endpoint
Обновите базовый URL в `src/api/apiClient.ts`:
```typescript
const BASE_URL = 'https://vm-fc7b7f29.na4u.ru'; // Ваш API сервер
```

### Telegram Bot
1. Создайте бота через [@BotFather](https://t.me/BotFather)
2. Получите токен
3. Обновите `src/services/TelegramAuthService.ts`:
```typescript
const TELEGRAM_BOT_USERNAME = 'YourBotUsername';
```

### Push Notifications (FCM)
1. Создайте проект в [Firebase Console](https://console.firebase.google.com)
2. Добавьте iOS/Android приложения
3. Скачайте `google-services.json` (Android) и `GoogleService-Info.plist` (iOS)
4. Разместите файлы в соответствующих папках:
   - `android/app/google-services.json`
   - `ios/GoogleService-Info.plist`

## 📱 iOS Развертывание

### 1. Настройка Apple Developer Account
```bash
# Войдите в Xcode с вашим Apple ID
# Xcode -> Preferences -> Accounts -> Add Apple ID
```

### 2. Настройка App ID
1. Откройте [Apple Developer Portal](https://developer.apple.com)
2. Создайте новый App ID:
   - **Bundle ID**: `com.yourcompany.msuschedule`
   - **Capabilities**: Push Notifications, Associated Domains

### 3. Создание Certificates
```bash
# В Xcode: Product -> Archive
# Следуйте инструкциям для создания Distribution Certificate
```

### 4. Настройка Provisioning Profile
1. Создайте Distribution Provisioning Profile
2. Скачайте и установите профиль
3. Обновите настройки в Xcode

### 5. Сборка для App Store
```bash
# Создание архива
npm run build:ios

# Или через Xcode
# Product -> Archive -> Distribute App -> App Store Connect
```

### 6. Загрузка в App Store Connect
1. Откройте [App Store Connect](https://appstoreconnect.apple.com)
2. Создайте новое приложение
3. Загрузите архив через Xcode или Transporter
4. Заполните метаданные приложения
5. Отправьте на ревью

## 🤖 Android Развертывание

### 1. Настройка Google Play Console
1. Откройте [Google Play Console](https://play.google.com/console)
2. Создайте новое приложение
3. Заполните основную информацию

### 2. Создание Keystore
```bash
# Создание keystore для подписи
keytool -genkey -v -keystore msuschedule-release-key.keystore -alias msuschedule -keyalg RSA -keysize 2048 -validity 10000
```

### 3. Настройка подписи
Создайте файл `android/gradle.properties`:
```properties
MSUSCHEDULE_UPLOAD_STORE_FILE=msuschedule-release-key.keystore
MSUSCHEDULE_UPLOAD_KEY_ALIAS=msuschedule
MSUSCHEDULE_UPLOAD_STORE_PASSWORD=your_store_password
MSUSCHEDULE_UPLOAD_KEY_PASSWORD=your_key_password
```

### 4. Сборка APK/AAB
```bash
# APK для тестирования
npm run build:android

# AAB для Google Play
npm run build:android-bundle
```

### 5. Загрузка в Google Play
1. В Google Play Console выберите ваше приложение
2. Перейдите в "Release" -> "Production"
3. Загрузите AAB файл
4. Заполните информацию о релизе
5. Отправьте на ревью

## 🧪 Тестирование

### Unit тесты
```bash
npm test
npm run test:coverage
```

### E2E тесты (Detox)
```bash
# Установка Detox
npm install -g detox-cli

# Сборка для тестирования
npm run e2e:build:ios
npm run e2e:build:android

# Запуск тестов
npm run e2e:ios
npm run e2e:android
```

### Тестирование на устройствах
```bash
# iOS Simulator
npm run ios

# Android Emulator
npm run android

# Физическое устройство
# Подключите устройство и запустите команды выше
```

## 🔐 Безопасность

### Код-подписание
- **iOS**: Автоматическое управление через Xcode
- **Android**: Keystore для подписи релизных сборок

### API Безопасность
- Все API запросы используют HTTPS
- Токены авторизации хранятся в Keychain (iOS) / Keystore (Android)
- Валидация данных на клиенте и сервере

### Telegram Безопасность
- Проверка подписи initData от Telegram
- Шифрование сессионных токенов
- Аудит всех действий пользователей

## 📊 Мониторинг и аналитика

### Crash Reporting
Рекомендуется интегрировать:
- **Firebase Crashlytics** (бесплатно)
- **Sentry** (бесплатный план)

### Аналитика
- **Firebase Analytics** (бесплатно)
- **Mixpanel** (бесплатный план)

### Performance Monitoring
- **Firebase Performance** (бесплатно)
- **Flipper** (для разработки)

## 🚨 Устранение неполадок

### Частые проблемы iOS
```bash
# Очистка кэша
npm run clean:ios
cd ios && pod install && cd ..

# Проблемы с подписями
# Xcode -> Product -> Clean Build Folder
```

### Частые проблемы Android
```bash
# Очистка кэша
npm run clean:android
cd android && ./gradlew clean && cd ..

# Проблемы с Gradle
# Удалите папку .gradle в android/
```

### Проблемы с зависимостями
```bash
# Очистка node_modules
rm -rf node_modules package-lock.json
npm install

# iOS pods
cd ios && pod deintegrate && pod install && cd ..
```

## 📈 Оптимизация производительности

### Bundle Size
```bash
# Анализ размера bundle
npx react-native-bundle-visualizer

# Оптимизация изображений
# Используйте WebP формат
# Оптимизируйте размеры изображений
```

### Memory Usage
- Используйте FlatList для больших списков
- Оптимизируйте изображения
- Избегайте утечек памяти в useEffect

### Network Optimization
- Кэширование данных
- Offline-first подход
- Сжатие API ответов

## 🔄 CI/CD Pipeline

### GitHub Actions (рекомендуется)
Создайте `.github/workflows/build.yml`:
```yaml
name: Build and Deploy
on:
  push:
    branches: [main]
jobs:
  build-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm install
      - name: Build iOS
        run: npm run build:ios
```

### Fastlane (опционально)
```bash
# Установка Fastlane
gem install fastlane

# Настройка для iOS
cd ios && fastlane init

# Настройка для Android
cd android && fastlane init
```

## 📋 Чек-лист перед релизом

### iOS
- [ ] App ID настроен
- [ ] Certificates созданы
- [ ] Provisioning Profile установлен
- [ ] Push Notifications настроены
- [ ] App Store Connect заполнен
- [ ] Тесты пройдены
- [ ] Privacy Policy добавлена

### Android
- [ ] Keystore создан
- [ ] Подпись настроена
- [ ] Google Play Console настроен
- [ ] Firebase подключен
- [ ] Тесты пройдены
- [ ] Privacy Policy добавлена

### Общее
- [ ] API endpoints настроены
- [ ] Telegram Bot настроен
- [ ] Push Notifications работают
- [ ] Offline режим протестирован
- [ ] Все экраны протестированы
- [ ] Производительность оптимизирована

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи в консоли
2. Обратитесь к документации React Native
3. Создайте issue в репозитории
4. Свяжитесь с командой разработки

---

**Удачного развертывания! 🚀**



# 🚀 Инструкции по сборке iOS приложения

## 📋 Предварительные требования

### 1. Установка необходимых инструментов

```bash
# Установка Expo CLI
npm install -g @expo/cli

# Установка EAS CLI
npm install -g eas-cli

# Проверка версий
expo --version
eas --version
```

### 2. Создание аккаунта Expo

1. Перейдите на [expo.dev](https://expo.dev)
2. Создайте аккаунт или войдите в существующий
3. Войдите через терминал:
```bash
expo login
```

### 3. Apple Developer Account

Для публикации в App Store вам понадобится:
- Apple Developer Account ($99/год)
- Уникальный Bundle Identifier
- Сертификаты разработчика

## 🔧 Настройка проекта

### 1. Инициализация EAS

```bash
cd schedule-app
eas build:configure
```

### 2. Настройка Bundle Identifier

В файле `app.json` уже настроен Bundle Identifier:
```json
"ios": {
  "bundleIdentifier": "com.scheduleapp.myschedule"
}
```

**Важно:** Измените Bundle Identifier на уникальный перед публикацией!

## 📱 Сборка приложения

### Вариант 1: Development Build (для тестирования)

```bash
# Сборка для симулятора iOS
eas build --profile development --platform ios --local

# Или облачная сборка
eas build --profile development --platform ios
```

### Вариант 2: Preview Build (для тестирования на устройстве)

```bash
eas build --profile preview --platform ios
```

### Вариант 3: Production Build (для App Store)

```bash
eas build --profile production --platform ios
```

## 📲 Установка на устройство

### Через Expo Go (только для development)

1. Установите Expo Go из App Store
2. Запустите проект: `npm start`
3. Отсканируйте QR-код

### Через TestFlight (для preview/production)

1. После сборки получите ссылку на .ipa файл
2. Загрузите в TestFlight через App Store Connect
3. Пригласите тестировщиков

## 🏪 Публикация в App Store

### 1. Подготовка к публикации

```bash
# Сборка production версии
eas build --profile production --platform ios

# Отправка в App Store
eas submit --platform ios
```

### 2. Требования App Store

- ✅ Уникальное название приложения
- ✅ Описание и ключевые слова
- ✅ Скриншоты для разных размеров экранов
- ✅ Иконка приложения (1024x1024)
- ✅ Политика конфиденциальности
- ✅ Тестирование на реальных устройствах

### 3. Процесс модерации

- Время рассмотрения: 1-7 дней
- Возможны запросы на изменения
- Подготовьте ответы на возможные вопросы

## 🛠 Отладка и решение проблем

### Частые ошибки

1. **"Bundle identifier already exists"**
   - Измените Bundle Identifier в `app.json`
   - Используйте уникальное имя: `com.yourname.scheduleapp`

2. **"Code signing failed"**
   - Проверьте Apple Developer Account
   - Убедитесь в правильности сертификатов

3. **"Build failed"**
   - Проверьте логи: `eas build:list`
   - Убедитесь в совместимости зависимостей

### Просмотр логов

```bash
# Список сборок
eas build:list

# Детали конкретной сборки
eas build:view [BUILD_ID]

# Логи сборки
eas build:logs [BUILD_ID]
```

## 📊 Мониторинг и аналитика

### После публикации

1. **App Store Connect**
   - Отслеживайте загрузки и рейтинги
   - Анализируйте отзывы пользователей
   - Обновляйте приложение при необходимости

2. **Crashlytics** (опционально)
   - Добавьте для отслеживания ошибок
   - Помогает улучшать стабильность

## 🔄 Обновления приложения

### Процесс обновления

1. Измените версию в `app.json`:
```json
"version": "1.0.1"
```

2. Соберите новую версию:
```bash
eas build --profile production --platform ios
```

3. Отправьте обновление:
```bash
eas submit --platform ios
```

## 💡 Советы по оптимизации

### Производительность

- Используйте `expo-optimize` для уменьшения размера
- Оптимизируйте изображения
- Минимизируйте количество зависимостей

### Пользовательский опыт

- Тестируйте на разных устройствах
- Проверяйте работу в разных ориентациях
- Учитывайте доступность (Accessibility)

## 📞 Поддержка

### Полезные ресурсы

- [Expo Documentation](https://docs.expo.dev/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Apple Developer Documentation](https://developer.apple.com/documentation/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)

### Сообщество

- [Expo Discord](https://chat.expo.dev/)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/expo)
- [GitHub Issues](https://github.com/expo/expo/issues)

---

**Удачи с публикацией вашего приложения! 🎉**


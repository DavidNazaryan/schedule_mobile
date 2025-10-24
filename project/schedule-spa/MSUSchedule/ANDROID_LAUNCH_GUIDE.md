# 🚀 Быстрый запуск React Native приложения

## Проблема с Java
Gradle требует Java 17+, а у вас установлена Java 8. Есть несколько решений:

## Решение 1: Установка Java 17 (Рекомендуется)

### Скачайте и установите OpenJDK 17:
1. Перейдите на https://adoptium.net/
2. Скачайте **OpenJDK 17 (LTS)** для Windows x64
3. Установите в стандартную папку: `C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot\`

### Установите переменные окружения:
```bash
# В PowerShell (временно)
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

# Постоянно через системные переменные:
# Панель управления → Система → Дополнительные параметры системы → Переменные среды
# Добавьте JAVA_HOME = C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot
# Добавьте в PATH: %JAVA_HOME%\bin
```

## Решение 2: Запуск через Android Studio

### Шаги:
1. **Откройте Android Studio**
2. **File → Open** → выберите папку `android/`
3. **Дождитесь синхронизации Gradle** (может занять несколько минут)
4. **Tools → AVD Manager** → **Create Virtual Device** (если нет эмулятора)
5. **Выберите устройство** (например, Pixel 6)
6. **Выберите API Level** (API 33 или 34)
7. **Запустите эмулятор**
8. **Run → Run 'app'**

## Решение 3: Использование физического устройства

### Подготовка телефона:
1. **Настройки → О телефоне → Номер сборки** (нажмите 7 раз)
2. **Настройки → Для разработчиков → USB отладка** (включить)
3. **Подключите телефон к компьютеру через USB**

### В Android Studio:
1. **Run → Run 'app'**
2. **Выберите ваше устройство** в списке
3. **Нажмите OK**

## Решение 4: Запуск Metro Bundler + браузер

### Для тестирования UI без эмулятора:
```bash
cd C:\Users\David\Desktop\schedule-spa\MSUSchedule
npm start
# Откройте http://localhost:8081 в браузере
```

## Проверка готовности

### Запустите диагностику:
```bash
cd C:\Users\David\Desktop\schedule-spa\MSUSchedule
npx react-native doctor
```

### Должно показать:
- ✅ Node.js
- ✅ npm  
- ✅ Android Studio
- ✅ Gradlew
- ✅ ANDROID_HOME (после установки Java 17)
- ✅ Android SDK
- ✅ JDK (после установки Java 17)
- ✅ Adb (после запуска эмулятора/подключения устройства)

## Быстрые команды

### После установки Java 17:
```bash
cd C:\Users\David\Desktop\schedule-spa\MSUSchedule

# Запуск Metro bundler
npm start

# В другом терминале - запуск Android
npm run android

# Или напрямую
npx react-native run-android
```

## Устранение проблем

### Проблема: "SDK location not found"
**Решение:** Файл `android/local.properties` уже создан с правильным путем

### Проблема: "Gradle sync failed"
**Решение:**
1. **File → Invalidate Caches and Restart** в Android Studio
2. Удалите папку `.gradle` в `android/`
3. **File → Sync Project with Gradle Files**

### Проблема: "Metro bundler not found"
**Решение:**
```bash
# Запустите Metro в отдельном терминале
cd C:\Users\David\Desktop\schedule-spa\MSUSchedule
npx react-native start
```

## Рекомендуемый порядок действий

1. **Установите Java 17** (самое важное!)
2. **Откройте Android Studio**
3. **Откройте проект** (папка android/)
4. **Создайте эмулятор** (если нет телефона)
5. **Запустите эмулятор**
6. **Run → Run 'app'**

---

**Готово!** После установки Java 17 приложение должно запуститься без проблем.


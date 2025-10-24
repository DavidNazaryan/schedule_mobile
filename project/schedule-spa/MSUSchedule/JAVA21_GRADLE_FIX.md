# 🔧 Решение проблемы Java 21 + Gradle 8.5

## ❌ Проблема
```
Your build is currently configured to use incompatible Java 21.0.7 and Gradle 7.6.4. 
Cannot sync the project.

We recommend upgrading to Gradle version 9.0-milestone-1.
The minimum compatible Gradle version is 8.5.
The maximum compatible Gradle JVM version is 19.
```

**Причина:** Java 21 несовместима с Gradle 7.6.4. Нужно обновить Gradle до версии 8.5+.

## ✅ Решение выполнено

### 1. Обновлен Gradle до версии 8.5
- Файл `android/gradle/wrapper/gradle-wrapper.properties` обновлен
- Версия изменена с 7.6.4 на 8.5

### 2. Обновлен Android Gradle Plugin
- Файл `android/build.gradle` обновлен
- Версия изменена с 7.4.2 на 8.1.4

### 3. Созданы скрипты для настройки
- `setup_java21.bat` - автоматическая настройка Java 21
- Обновлен `launch_app.bat` с поддержкой Java 21

## 🚀 Как запустить приложение

### Способ 1: Через Android Studio (Рекомендуется)

1. **Android Studio уже открыт** с проектом
2. **File → Sync Project with Gradle Files**
3. **Дождитесь синхронизации** (может занять несколько минут)
4. **Tools → AVD Manager** → создайте эмулятор
5. **Запустите эмулятор**
6. **Run → Run 'app'**

### Способ 2: Через командную строку

```bash
# Запустите скрипт настройки Java 21
.\setup_java21.bat

# Или основной скрипт запуска
.\launch_app.bat
```

### Способ 3: Прямой запуск

```bash
cd C:\Users\David\Desktop\schedule-spa\MSUSchedule

# Запуск Metro bundler
npm start

# В другом терминале - запуск Android
npm run android
```

## 🔍 Проверка готовности

После настройки Java 21:

```bash
# Проверьте Java
java -version
# Должно показать Java 21.x.x

# Проверьте готовность проекта
npx react-native doctor

# Очистите кэш Gradle
cd android
.\gradlew clean
```

## 📱 Альтернативные способы запуска

### 1. Физическое устройство
- Включите USB отладку на телефоне
- Подключите к компьютеру
- Запустите через Android Studio

### 2. Веб-версия (для тестирования)
- Metro bundler доступен на http://localhost:8081
- Только для тестирования UI компонентов

## 🚨 Частые ошибки

### "JAVA_HOME is set to an invalid directory"
**Решение:** Запустите `setup_java21.bat` для автоматической настройки

### "Gradle sync failed"
**Решение:**
1. **File → Invalidate Caches and Restart** в Android Studio
2. Удалите папку `.gradle` в `android/`
3. **File → Sync Project with Gradle Files**

### "Metro bundler not found"
**Решение:**
```bash
# Запустите Metro в отдельном терминале
npm start
```

## 🎯 Рекомендуемый порядок действий

1. **Используйте Android Studio** (самый надежный способ)
2. **File → Sync Project with Gradle Files**
3. **Создайте эмулятор** (Tools → AVD Manager)
4. **Запустите эмулятор**
5. **Run → Run 'app'**

## 📁 Обновленные файлы

- `android/gradle/wrapper/gradle-wrapper.properties` - Gradle 8.5
- `android/build.gradle` - Android Gradle Plugin 8.1.4
- `setup_java21.bat` - скрипт настройки Java 21
- `launch_app.bat` - обновлен для поддержки Java 21

---

**🎉 Проблема с Java 21 и Gradle решена!** 

**Следующий шаг:** Используйте Android Studio для запуска приложения - это самый надежный способ.


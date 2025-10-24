# 🔧 Решение проблемы с Java

## ❌ Проблема
```
Class org.gradle.jvm.toolchain.JvmVendorSpec does not have member field 'org.gradle.jvm.toolchain.JvmVendorSpec IBM_SEMERU'
```

**Причина:** Gradle 9.0 требует Java 17+, а у вас установлена Java 8.

## ✅ Решение

### Способ 1: Установка Java 17 (Рекомендуется)

1. **Скачайте OpenJDK 17:**
   - Перейдите на https://adoptium.net/
   - Выберите "Temurin 17 (LTS)"
   - Выберите "Windows x64"
   - Скачайте .msi файл

2. **Установите Java:**
   - Запустите скачанный .msi файл
   - Установите в стандартную папку: `C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot\`

3. **Настройте переменные окружения:**
   - Панель управления → Система → Дополнительные параметры системы
   - Переменные среды → Системные переменные
   - Создайте новую переменную: `JAVA_HOME = C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot`
   - Добавьте в PATH: `%JAVA_HOME%\bin`

4. **Перезапустите командную строку**

5. **Проверьте установку:**
   ```bash
   java -version
   # Должно показать Java 17.x.x
   ```

### Способ 2: Быстрый запуск через Android Studio

Если не хотите устанавливать Java 17:

1. **Откройте Android Studio**
2. **File → Open** → выберите папку `android/`
3. **Дождитесь синхронизации Gradle** (Android Studio использует встроенную Java)
4. **Tools → AVD Manager** → создайте эмулятор
5. **Запустите эмулятор**
6. **Run → Run 'app'**

### Способ 3: Использование скриптов

```bash
# Запустите скрипт для автоматической установки Java
.\fix_java.bat

# Или основной скрипт запуска
.\launch_app.bat
```

## 🔍 Проверка готовности

После установки Java 17:

```bash
cd C:\Users\David\Desktop\schedule-spa\MSUSchedule

# Проверьте Java
java -version

# Проверьте готовность проекта
npx react-native doctor

# Запустите приложение
npm run android
```

## 📱 Альтернативные способы запуска

### 1. Физическое устройство
- Включите USB отладку на телефоне
- Подключите к компьютеру
- Запустите через Android Studio

### 2. Веб-версия (для тестирования)
- Metro bundler доступен на http://localhost:8081
- Только для тестирования UI компонентов

### 3. Expo Go (требует настройки)
```bash
npx create-expo-app --template
# Требует дополнительной конфигурации
```

## 🚨 Частые ошибки

### "JAVA_HOME is set to an invalid directory"
**Решение:** Проверьте путь к Java в переменной JAVA_HOME

### "No Java compiler found"
**Решение:** Установите JDK (не JRE) - Gradle требует компилятор

### "Gradle requires JVM 17 or later"
**Решение:** Обновите Java до версии 17+

### "SDK location not found"
**Решение:** Файл `android/local.properties` уже создан с правильным путем

## 🎯 Рекомендуемый порядок действий

1. **Установите Java 17** (самое важное!)
2. **Перезапустите командную строку**
3. **Запустите `launch_app.bat`**
4. **Выберите "Запустить через Android Studio"**
5. **Создайте эмулятор в Android Studio**
6. **Run → Run 'app'**

---

**🎉 После установки Java 17 приложение запустится без проблем!**

**Следующий шаг:** Установите Java 17+ и запустите приложение.


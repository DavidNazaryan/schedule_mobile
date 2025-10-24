@echo off
title Настройка Java 21 для React Native
color 0A

echo.
echo ========================================
echo    Настройка Java 21 для React Native
echo ========================================
echo.

echo Проверка установленной Java...
java -version

echo.
echo Поиск Java 21...

REM Проверяем стандартные пути установки Java 21
set JAVA21_PATH=

if exist "C:\Program Files\Eclipse Adoptium\jdk-21.0.7.9-hotspot" (
    set JAVA21_PATH=C:\Program Files\Eclipse Adoptium\jdk-21.0.7.9-hotspot
    echo ✅ Java 21 найдена: %JAVA21_PATH%
) else if exist "C:\Program Files\Java\jdk-21" (
    set JAVA21_PATH=C:\Program Files\Java\jdk-21
    echo ✅ Java 21 найдена: %JAVA21_PATH%
) else (
    echo ❌ Java 21 не найдена в стандартных путях
    echo.
    echo Решение:
    echo 1. Установите Java 21 с https://adoptium.net/
    echo 2. Или используйте Android Studio (рекомендуется)
    echo.
    goto :android_studio
)

echo.
echo Настройка переменных окружения...
set JAVA_HOME=%JAVA21_PATH%
set PATH=%JAVA_HOME%\bin;%PATH%

echo JAVA_HOME=%JAVA_HOME%
echo.

echo Проверка Java 21...
"%JAVA_HOME%\bin\java.exe" -version

echo.
echo Очистка кэша Gradle...
cd /d "%~dp0\android"
set GRADLE_OPTS=-Dorg.gradle.java.home="%JAVA_HOME%"
.\gradlew clean

if %errorlevel% equ 0 (
    echo.
    echo ✅ Gradle очистка успешна!
    echo.
    echo Теперь можно запустить приложение:
    echo 1. npm run android
    echo 2. Или через Android Studio
) else (
    echo.
    echo ❌ Ошибка Gradle. Попробуйте через Android Studio.
)

goto :end

:android_studio
echo.
echo 🚀 Запуск Android Studio...
echo.
echo Android Studio имеет встроенную Java и должен работать без проблем.
echo.
echo Инструкции:
echo 1. Дождитесь открытия Android Studio
echo 2. File → Sync Project with Gradle Files
echo 3. Tools → AVD Manager → Create Virtual Device
echo 4. Запустите эмулятор
echo 5. Run → Run 'app'
echo.

start "" "C:\Program Files\Android\Android Studio\bin\studio64.exe" "%~dp0\android"

:end
echo.
echo Нажмите любую клавишу для выхода...
pause >nul


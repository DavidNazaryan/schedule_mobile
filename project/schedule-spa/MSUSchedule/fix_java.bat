@echo off
title Быстрое решение проблемы Java
color 0C

echo.
echo ========================================
echo    РЕШЕНИЕ ПРОБЛЕМЫ С JAVA
echo ========================================
echo.

echo ❌ ПРОБЛЕМА: Gradle требует Java 17+, у вас Java 8
echo.
echo ✅ РЕШЕНИЕ: Установите OpenJDK 17
echo.

echo 🚀 БЫСТРЫЙ СПОСОБ:
echo.
echo 1. Откройте браузер: https://adoptium.net/
echo 2. Скачайте "Temurin 17 (LTS)" для Windows x64
echo 3. Установите .msi файл
echo 4. Перезапустите командную строку
echo 5. Запустите: launch_app.bat
echo.

echo 🌐 Открываю страницу загрузки...
start "" "https://adoptium.net/temurin/releases/?version=17"

echo.
echo 📋 АЛЬТЕРНАТИВНЫЕ СПОСОБЫ ЗАПУСКА:
echo.
echo [1] Через Android Studio (рекомендуется)
echo     - Откройте Android Studio
echo     - File → Open → выберите папку android/
echo     - Дождитесь синхронизации
echo     - Run → Run 'app'
echo.
echo [2] Через командную строку (после установки Java 17)
echo     - npm run android
echo.
echo [3] Веб-версия для тестирования
echo     - Metro bundler: http://localhost:8081
echo.

echo ⚠️  ВАЖНО: Без Java 17+ приложение не запустится!
echo.

pause


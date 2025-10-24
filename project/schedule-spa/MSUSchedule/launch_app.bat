@echo off
title MSU Schedule - React Native App Launcher
color 0A

echo.
echo ========================================
echo    MSU Schedule - React Native App
echo ========================================
echo.

REM Проверка Java
echo [1/4] Проверка Java...
java -version 2>nul
if %errorlevel% neq 0 (
    echo ❌ Java не найдена
    goto :java_error
)

for /f "tokens=3" %%g in ('java -version 2^>^&1 ^| findstr /i "version"') do (
    set java_version=%%g
)
echo ✅ Java найдена: %java_version%

REM Проверка версии Java (нужна 17+)
echo %java_version% | findstr /r "1\.[0-9]\." >nul
if %errorlevel% equ 0 (
    echo ⚠️  ВНИМАНИЕ: Нужна Java 17+, у вас %java_version%
    echo    Запустите setup_java21.bat для настройки
    goto :java_error
)

REM Проверка совместимости Java 21 с Gradle
echo %java_version% | findstr "21" >nul
if %errorlevel% equ 0 (
    echo ✅ Java 21 найдена - совместима с Gradle 8.5
) else (
    echo ✅ Java версия совместима
)

echo.
echo [2/4] Проверка Android SDK...
set ANDROID_HOME=C:\Users\David\AppData\Local\Android\Sdk
if exist "%ANDROID_HOME%\platform-tools\adb.exe" (
    echo ✅ Android SDK найден
) else (
    echo ❌ Android SDK не найден
    goto :android_error
)

echo.
echo [3/4] Проверка Metro Bundler...
netstat -an | findstr :8081 >nul
if %errorlevel% equ 0 (
    echo ✅ Metro Bundler запущен на порту 8081
) else (
    echo ⚠️  Metro Bundler не запущен
    echo    Запускаю Metro Bundler...
    start "Metro Bundler" cmd /k "cd /d %~dp0 && npm start"
    timeout /t 3 /nobreak >nul
)

echo.
echo [4/4] Проверка эмуляторов...
"%ANDROID_HOME%\emulator\emulator.exe" -list-avds 2>nul
if %errorlevel% neq 0 (
    echo ⚠️  Эмуляторы не найдены
    goto :emulator_info
)

echo.
echo ========================================
echo           ГОТОВО К ЗАПУСКУ!
echo ========================================
echo.
echo Выберите действие:
echo.
echo [1] Запустить через Android Studio
echo [2] Запустить через командную строку
echo [3] Открыть Metro Bundler в браузере
echo [4] Показать инструкции
echo [5] Выход
echo.
set /p choice="Ваш выбор (1-5): "

if "%choice%"=="1" goto :android_studio
if "%choice%"=="2" goto :command_line
if "%choice%"=="3" goto :metro_browser
if "%choice%"=="4" goto :show_instructions
if "%choice%"=="5" goto :exit
goto :invalid_choice

:android_studio
echo.
echo 🚀 Запуск Android Studio...
echo.
echo Инструкции:
echo 1. File → Open → выберите папку android/
echo 2. Дождитесь синхронизации Gradle
echo 3. Tools → AVD Manager → Create Virtual Device
echo 4. Запустите эмулятор
echo 5. Run → Run 'app'
echo.
start "" "C:\Program Files\Android\Android Studio\bin\studio64.exe" "%~dp0android"
goto :end

:command_line
echo.
echo 🚀 Запуск через командную строку...
echo.
if exist "%ANDROID_HOME%\emulator\emulator.exe" (
    echo Запускаю эмулятор...
    "%ANDROID_HOME%\emulator\emulator.exe" -avd Medium_Phone_API_36.1
    timeout /t 5 /nobreak >nul
)
echo Запускаю приложение...
npm run android
goto :end

:metro_browser
echo.
echo 🌐 Открываю Metro Bundler в браузере...
start "" "http://localhost:8081"
goto :end

:show_instructions
echo.
echo 📖 Открываю инструкции...
start "" "%~dp0LAUNCH_INSTRUCTIONS.md"
goto :end

:invalid_choice
echo.
echo ❌ Неверный выбор. Попробуйте снова.
goto :end

:java_error
echo.
echo ❌ ОШИБКА: Java не найдена или версия слишком старая
echo.
echo Решение:
echo 1. Запустите setup_java21.bat для автоматической настройки
echo 2. Или установите Java 17+ с https://adoptium.net/
echo 3. Или используйте Android Studio (рекомендуется)
echo.
echo 🚀 БЫСТРОЕ РЕШЕНИЕ:
echo Запустите setup_java21.bat для автоматической настройки Java 21
echo.
echo 🌐 Открываю страницу загрузки...
start "" "https://adoptium.net/temurin/releases/?version=21"
echo.
goto :end

:android_error
echo.
echo ❌ ОШИБКА: Android SDK не найден
echo.
echo Решение:
echo 1. Установите Android Studio
echo 2. Установите Android SDK через SDK Manager
echo.
goto :end

:emulator_info
echo.
echo ⚠️  Информация об эмуляторах:
echo.
echo Для создания эмулятора:
echo 1. Откройте Android Studio
echo 2. Tools → AVD Manager
echo 3. Create Virtual Device
echo 4. Выберите Pixel 6 + API 33
echo.
goto :end

:end
echo.
echo Нажмите любую клавишу для выхода...
pause >nul
goto :exit

:exit
exit /b 0

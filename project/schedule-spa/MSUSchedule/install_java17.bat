@echo off
title Установка Java 17 для React Native
color 0E

echo.
echo ========================================
echo    Установка Java 17 для React Native
echo ========================================
echo.

echo Проблема: Gradle требует Java 17+ для работы с React Native
echo У вас установлена Java 8, которая не поддерживается.
echo.

echo Решение: Установка OpenJDK 17
echo.

echo Выберите действие:
echo.
echo [1] Скачать OpenJDK 17 автоматически
echo [2] Открыть страницу загрузки в браузере
echo [3] Показать инструкции по установке
echo [4] Попробовать запустить с Java 8 (может не работать)
echo [5] Выход
echo.

set /p choice="Ваш выбор (1-5): "

if "%choice%"=="1" goto :download_java
if "%choice%"=="2" goto :open_browser
if "%choice%"=="3" goto :show_instructions
if "%choice%"=="4" goto :try_java8
if "%choice%"=="5" goto :exit
goto :invalid_choice

:download_java
echo.
echo 🔽 Скачивание OpenJDK 17...
echo.
echo Это может занять несколько минут...
echo.

REM Создаем временную папку
if not exist "%TEMP%\java17" mkdir "%TEMP%\java17"

REM Скачиваем OpenJDK 17 (используем PowerShell)
powershell -Command "& {Invoke-WebRequest -Uri 'https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.9%2B9/OpenJDK17U-jdk_x64_windows_hotspot_17.0.9_9.msi' -OutFile '%TEMP%\java17\OpenJDK17.msi'}"

if exist "%TEMP%\java17\OpenJDK17.msi" (
    echo ✅ Скачивание завершено
    echo.
    echo 🚀 Запуск установщика...
    echo.
    echo ВНИМАНИЕ: Установите Java в стандартную папку:
    echo C:\Program Files\Eclipse Adoptium\jdk-17.0.9.9-hotspot\
    echo.
    start "" "%TEMP%\java17\OpenJDK17.msi"
    echo.
    echo После установки:
    echo 1. Перезапустите командную строку
    echo 2. Запустите launch_app.bat снова
    echo.
) else (
    echo ❌ Ошибка скачивания
    echo Попробуйте вариант [2] - открыть страницу в браузере
)
goto :end

:open_browser
echo.
echo 🌐 Открываю страницу загрузки...
start "" "https://adoptium.net/temurin/releases/?version=17"
echo.
echo Инструкции:
echo 1. Выберите "Windows x64" и скачайте .msi файл
echo 2. Запустите установщик
echo 3. Установите в стандартную папку
echo 4. Перезапустите командную строку
echo 5. Запустите launch_app.bat снова
goto :end

:show_instructions
echo.
echo 📖 Подробные инструкции:
echo.
echo 1. Перейдите на https://adoptium.net/
echo 2. Выберите "Temurin 17 (LTS)"
echo 3. Выберите "Windows x64"
echo 4. Скачайте .msi файл
echo 5. Запустите установщик
echo 6. Установите в стандартную папку:
echo    C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot\
echo 7. Установите переменную JAVA_HOME:
echo    - Панель управления → Система → Дополнительные параметры
echo    - Переменные среды → Системные переменные
echo    - Создать новую: JAVA_HOME = путь к установке
echo    - Добавить в PATH: %%JAVA_HOME%%\bin
echo 8. Перезапустите командную строку
echo 9. Проверьте: java -version
echo.
goto :end

:try_java8
echo.
echo ⚠️  Попытка запуска с Java 8...
echo.
echo ВНИМАНИЕ: Это может не работать из-за несовместимости версий
echo.

REM Попробуем найти JDK вместо JRE
set JAVA_HOME=
for /d %%i in ("C:\Program Files\Java\*") do (
    if exist "%%i\bin\javac.exe" (
        set JAVA_HOME=%%i
        echo Найден JDK: %%i
        goto :found_jdk
    )
)

for /d %%i in ("C:\Program Files (x86)\Java\*") do (
    if exist "%%i\bin\javac.exe" (
        set JAVA_HOME=%%i
        echo Найден JDK: %%i
        goto :found_jdk
    )
)

echo ❌ JDK не найден. Установлен только JRE.
echo Gradle требует JDK для компиляции.
echo Рекомендуется установить Java 17+.
goto :end

:found_jdk
echo ✅ JDK найден: %JAVA_HOME%
echo.
echo Попытка запуска Gradle...
cd /d "%~dp0\android"
set GRADLE_OPTS=-Dorg.gradle.java.home="%JAVA_HOME%"
.\gradlew clean
goto :end

:invalid_choice
echo.
echo ❌ Неверный выбор. Попробуйте снова.
goto :end

:end
echo.
echo Нажмите любую клавишу для выхода...
pause >nul
goto :exit

:exit
exit /b 0


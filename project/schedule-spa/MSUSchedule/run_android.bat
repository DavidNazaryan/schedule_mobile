@echo off
echo Запуск React Native приложения через Android Studio...
echo.

REM Установка переменных окружения
set ANDROID_HOME=C:\Users\David\AppData\Local\Android\Sdk
set PATH=%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools;%PATH%

echo Переменные окружения установлены:
echo ANDROID_HOME=%ANDROID_HOME%
echo.

echo Проверка Android SDK...
if exist "%ANDROID_HOME%\platform-tools\adb.exe" (
    echo ✓ ADB найден
) else (
    echo ✗ ADB не найден
)

echo.
echo Проверка эмуляторов...
"%ANDROID_HOME%\emulator\emulator.exe" -list-avds

echo.
echo Инструкции для запуска:
echo 1. Откройте Android Studio
echo 2. File → Open → выберите папку android/
echo 3. Дождитесь синхронизации Gradle
echo 4. Tools → AVD Manager → Create Virtual Device (если нет эмулятора)
echo 5. Запустите эмулятор
echo 6. Run → Run 'app'
echo.

echo Альтернативно, для установки Java 17:
echo 1. Скачайте OpenJDK 17 с https://adoptium.net/
echo 2. Установите в C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot\
echo 3. Установите JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot\
echo.

pause


#!/bin/bash
# Скрипт для перезапуска проекта schedule-spa
# Автор: AI Assistant
# Дата: $(date +%Y-%m-%d)

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Функция для логирования
log() {
    echo -e "${CYAN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

# Функция для вывода ошибок
error() {
    echo -e "${RED}[ОШИБКА]${NC} $1"
}

# Функция для вывода успеха
success() {
    echo -e "${GREEN}[УСПЕХ]${NC} $1"
}

# Функция для вывода предупреждений
warning() {
    echo -e "${YELLOW}[ПРЕДУПРЕЖДЕНИЕ]${NC} $1"
}

# Функция для вывода информации
info() {
    echo -e "${BLUE}[ИНФО]${NC} $1"
}

# Функция для проверки статуса сервера
check_server_status() {
    if pgrep -f "uvicorn.*app.main:app" > /dev/null; then
        SERVER_PID=$(pgrep -f "uvicorn.*app.main:app")
        echo "running"
        return 0
    else
        echo "stopped"
        return 1
    fi
}

# Функция для проверки доступности сервера
check_server_health() {
    local max_attempts=10
    local attempt=1
    
    info "Проверяем доступность сервера..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f http://localhost:8000/ > /dev/null 2>&1; then
            success "Сервер доступен и отвечает на запросы!"
            return 0
        fi
        
        info "Попытка $attempt/$max_attempts - сервер еще не готов, ждем..."
        sleep 2
        ((attempt++))
    done
    
    error "Сервер не отвечает после $max_attempts попыток"
    return 1
}

# Основная функция
main() {
    echo -e "${PURPLE}🔄 Перезапуск проекта schedule-spa${NC}"
    echo -e "${PURPLE}====================================${NC}"
    echo ""
    
    # Переходим в директорию проекта
    cd /var/www/schedule-spa || {
        error "Не удалось перейти в директорию /var/www/schedule-spa"
        exit 1
    }
    
    info "Текущая директория: $(pwd)"
    
    # Проверяем наличие основных файлов
    if [ ! -f "app/main.py" ]; then
        error "Файл app/main.py не найден!"
        exit 1
    fi
    
    if [ ! -f "requirements.txt" ]; then
        warning "Файл requirements.txt не найден!"
    fi
    
    # Проверяем текущий статус сервера
    SERVER_STATUS=$(check_server_status)
    
    if [ "$SERVER_STATUS" = "running" ]; then
        SERVER_PID=$(pgrep -f "uvicorn.*app.main:app")
        info "Сервер запущен (PID: $SERVER_PID), останавливаем..."
        
        # Останавливаем сервер
        kill $SERVER_PID
        
        # Ждем завершения процесса
        sleep 3
        
        # Проверяем, что процесс завершился
        if pgrep -f "uvicorn.*app.main:app" > /dev/null; then
            warning "Процесс не завершился, принудительная остановка..."
            kill -9 $SERVER_PID
            sleep 1
        fi
        
        # Проверяем результат
        if ! pgrep -f "uvicorn.*app.main:app" > /dev/null; then
            success "Сервер успешно остановлен!"
        else
            error "Не удалось остановить сервер!"
            exit 1
        fi
    else
        info "Сервер не запущен, пропускаем остановку"
    fi
    
    # Очищаем старые логи (опционально)
    if [ -f "logs/server.log" ]; then
        info "Архивируем старые логи..."
        mv logs/server.log "logs/server_$(date +%Y%m%d_%H%M%S).log" 2>/dev/null || true
    fi
    
    # Создаем директорию для логов
    mkdir -p logs
    
    # Проверяем зависимости (если есть requirements.txt)
    if [ -f "requirements.txt" ]; then
        info "Проверяем зависимости Python..."
        if command -v pip > /dev/null; then
            pip install -r requirements.txt --quiet
            success "Зависимости обновлены"
        else
            warning "pip не найден, пропускаем установку зависижений"
        fi
    fi
    
    # Ждем немного перед запуском
    info "Ждем 3 секунды перед запуском..."
    sleep 3
    
    # Запускаем сервер
    info "Запускаем сервер на порту 8000..."
    
    # Запуск в фоновом режиме с логированием
    nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > logs/server.log 2>&1 &
    
    # Получаем PID процесса
    SERVER_PID=$!
    success "Сервер запущен!"
    info "PID: $SERVER_PID"
    info "Логи: logs/server.log"
    
    # Сохраняем PID для остановки
    echo $SERVER_PID > logs/server.pid
    
    # Проверяем, что сервер запустился
    sleep 5
    
    if check_server_status > /dev/null; then
        success "Сервер успешно запущен и работает!"
        
        # Проверяем доступность сервера
        if check_server_health; then
            echo ""
            success "🎉 Перезапуск завершен успешно!"
            echo ""
            info "📋 Информация о сервере:"
            echo "   🌐 Локальный адрес: http://localhost:8000"
            echo "   🔗 Webhook: https://vm-fc7b7f29.na4u.ru/webhook"
            echo "   📊 PID: $SERVER_PID"
            echo "   📝 Логи: logs/server.log"
            echo ""
            info "📋 Полезные команды:"
            echo "   Просмотр логов: tail -f logs/server.log"
            echo "   Остановка: ./stop_server.sh"
            echo "   Статус: ./status_server.sh"
            echo "   Перезапуск: ./restart_schedule_spa.sh"
        else
            error "Сервер запущен, но не отвечает на запросы!"
            info "Проверьте логи: cat logs/server.log"
            exit 1
        fi
    else
        error "Ошибка запуска сервера!"
        info "Проверьте логи: cat logs/server.log"
        exit 1
    fi
}

# Обработка сигналов
trap 'echo -e "\n${YELLOW}Получен сигнал прерывания, завершаем...${NC}"; exit 1' INT TERM

# Запуск основной функции
main "$@"

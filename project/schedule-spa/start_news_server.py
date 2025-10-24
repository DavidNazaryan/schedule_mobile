#!/usr/bin/env python3
"""
Запуск сервера с новостной лентой
Автоматически находит свободный порт
"""
import socket
import uvicorn
from app.main import app

def find_free_port(start_port=8000, max_port=8100):
    """Находит свободный порт начиная с start_port"""
    for port in range(start_port, max_port):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('127.0.0.1', port))
                return port
        except OSError:
            continue
    raise RuntimeError(f"Не удалось найти свободный порт в диапазоне {start_port}-{max_port}")

if __name__ == "__main__":
    try:
        # Находим свободный порт
        port = find_free_port()
        
        print("=" * 60)
        print("🚀 Запуск сервера с новостной лентой")
        print("=" * 60)
        print(f"📡 Сервер: http://127.0.0.1:{port}")
        print(f"📰 API новостей: http://127.0.0.1:{port}/api/news/")
        print(f"📚 Документация: http://127.0.0.1:{port}/docs")
        print(f"🎯 Главная страница: http://127.0.0.1:{port}/")
        print("=" * 60)
        print("💡 Для остановки нажмите Ctrl+C")
        print("=" * 60)
        
        # Запускаем сервер
        uvicorn.run(
            app,
            host="127.0.0.1",
            port=port,
            log_level="info",
            reload=False,
            access_log=True
        )
        
    except KeyboardInterrupt:
        print("\n🛑 Сервер остановлен пользователем")
    except Exception as e:
        print(f"❌ Ошибка запуска сервера: {e}")
        print("💡 Попробуйте запустить скрипт от имени администратора")




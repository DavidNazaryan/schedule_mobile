#!/usr/bin/env python3
"""
Скрипт для принудительного перезапуска сервера с очисткой всех кешей
"""

import subprocess
import time
import os
import shutil

def clear_all_caches():
    """Очищает все кеши"""
    print("Очищаем все кеши...")
    
    # Очищаем __pycache__
    cache_dirs = [
        "app/__pycache__",
        "parser/__pycache__",
        "__pycache__"
    ]
    
    for cache_dir in cache_dirs:
        if os.path.exists(cache_dir):
            shutil.rmtree(cache_dir)
            print(f"Удален кеш: {cache_dir}")
    
    # Очищаем .pyc файлы
    for root, dirs, files in os.walk("."):
        for file in files:
            if file.endswith(".pyc"):
                os.remove(os.path.join(root, file))
                print(f"Удален .pyc файл: {os.path.join(root, file)}")

def kill_all_python_processes():
    """Останавливает все процессы Python"""
    print("Останавливаем все процессы Python...")
    try:
        # Используем taskkill для Windows
        subprocess.run(["taskkill", "/F", "/IM", "python.exe"], 
                      capture_output=True, check=False)
        subprocess.run(["taskkill", "/F", "/IM", "python3.exe"], 
                      capture_output=True, check=False)
        subprocess.run(["taskkill", "/F", "/IM", "python3.13.exe"], 
                      capture_output=True, check=False)
        print("Процессы Python остановлены")
    except Exception as e:
        print(f"Ошибка при остановке процессов: {e}")

def start_server():
    """Запускает сервер"""
    print("Запускаем сервер...")
    os.chdir(r"C:\Users\David\Desktop\schedule-spa")
    
    # Запускаем сервер в фоновом режиме
    process = subprocess.Popen([
        "python", "-m", "uvicorn", 
        "app.main:app", 
        "--host", "0.0.0.0", 
        "--port", "8000"
    ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    
    print(f"Сервер запущен с PID: {process.pid}")
    return process

def main():
    print("=== Принудительный перезапуск сервера с очисткой всех кешей ===")
    
    # Очищаем все кеши
    clear_all_caches()
    
    # Останавливаем все процессы Python
    kill_all_python_processes()
    
    # Ждем немного
    print("Ждем 10 секунд...")
    time.sleep(10)
    
    # Запускаем сервер
    server_process = start_server()
    
    # Ждем немного для запуска
    print("Ждем 15 секунд для запуска сервера...")
    time.sleep(15)
    
    print("Сервер должен быть запущен!")
    print("Проверьте логи: Get-Content logs/server.log -Tail 20")

if __name__ == "__main__":
    main()




#!/usr/bin/env python3
"""
Скрипт для принудительного перезапуска сервера
"""

import subprocess
import time
import os

def kill_python_processes():
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
    print("=== Принудительный перезапуск сервера ===")
    
    # Останавливаем все процессы Python
    kill_python_processes()
    
    # Ждем немного
    print("Ждем 3 секунды...")
    time.sleep(3)
    
    # Запускаем сервер
    server_process = start_server()
    
    # Ждем немного для запуска
    print("Ждем 5 секунд для запуска сервера...")
    time.sleep(5)
    
    print("Сервер должен быть запущен!")
    print("Проверьте логи: Get-Content logs/server.log -Tail 20")

if __name__ == "__main__":
    main()

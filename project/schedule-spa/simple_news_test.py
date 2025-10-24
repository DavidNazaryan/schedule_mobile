#!/usr/bin/env python3
"""
Простой тест парсера новостей без сервера
"""
import sys
from pathlib import Path

# Добавляем путь к проекту
sys.path.append(str(Path(__file__).parent))

from parser.news_parser import NewsParser

def test_news_parser():
    print("=== Тест парсера новостей ===")
    
    parser = NewsParser()
    
    try:
        print("1. Получаем список новостей...")
        news_list = parser.fetch_news_list()
        
        if news_list:
            print(f"   [OK] Найдено {len(news_list)} новостей")
            
            # Показываем первые 3 новости
            for i, news in enumerate(news_list[:3]):
                print(f"\n   Новость {i+1}:")
                print(f"   Заголовок: {news.title}")
                print(f"   URL: {news.url}")
                print(f"   Дата: {news.date}")
                print(f"   Автор: {news.author}")
                print(f"   Описание: {news.excerpt[:100]}...")
                if news.image_url:
                    print(f"   Изображение: {news.image_url}")
                if news.category:
                    print(f"   Категория: {news.category}")
            
            # Тестируем детальную информацию
            if news_list:
                print(f"\n2. Получаем детальную информацию о первой новости...")
                first_news = news_list[0]
                detail = parser.fetch_news_detail(first_news.url)
                
                if detail:
                    print(f"   [OK] Получена детальная информация")
                    print(f"   Заголовок: {detail.get('title', 'N/A')}")
                    print(f"   Автор: {detail.get('author', 'N/A')}")
                    print(f"   Дата: {detail.get('date', 'N/A')}")
                    print(f"   Содержимое: {len(detail.get('content', ''))} символов")
                    print(f"   Изображений: {len(detail.get('images', []))}")
                    
                    # Показываем начало содержимого
                    content = detail.get('content', '')
                    if content:
                        print(f"   Начало текста: {content[:200]}...")
                else:
                    print(f"   [ERROR] Не удалось получить детальную информацию")
            
            # Тестируем поиск
            print(f"\n3. Тестируем поиск новостей...")
            search_results = parser.search_news("студент", limit=5)
            
            if search_results:
                print(f"   [OK] Найдено {len(search_results)} новостей по запросу 'студент'")
                for i, news in enumerate(search_results[:2]):
                    print(f"   {i+1}. {news.title}")
            else:
                print(f"   [INFO] По запросу 'студент' ничего не найдено")
                
        else:
            print("   [ERROR] Новости не найдены")
            
    except Exception as e:
        print(f"   [ERROR] Ошибка при тестировании: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_news_parser()




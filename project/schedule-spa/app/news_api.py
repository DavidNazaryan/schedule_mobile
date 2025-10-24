"""
API эндпоинты для работы с новостями
"""
from __future__ import annotations

import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query, Depends
from fastapi.responses import Response
from pydantic import BaseModel
import requests as http_requests

import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from parser.news_parser import get_latest_news, get_news_detail, search_news
from .auth import TelegramUser, get_current_user


class NewsArticle(BaseModel):
    """Модель ответа для новости"""
    id: int
    title: str
    excerpt: str
    content: str
    image_url: Optional[str] = None
    published_at: str
    source: str


class NewsItemResponse(BaseModel):
    """Модель ответа для новости (старый формат)"""
    id: str
    title: str
    excerpt: str
    url: str
    date: str
    author: str = ""
    image_url: Optional[str] = None
    category: Optional[str] = None


class NewsDetailResponse(BaseModel):
    """Модель ответа для детальной информации о новости"""
    title: str
    content: str
    date: str
    author: str = ""
    images: List[str] = []
    url: str


class NewsPagination(BaseModel):
    """Модель пагинации"""
    page: int
    total: int
    hasMore: bool


class NewsListResponse(BaseModel):
    """Модель ответа для списка новостей (новый формат для мобильного приложения)"""
    articles: List[NewsArticle]
    pagination: NewsPagination


class NewsListResponseOld(BaseModel):
    """Модель ответа для списка новостей (старый формат)"""
    news: List[NewsItemResponse]
    total: int
    page: int
    per_page: int
    has_more: bool


class NewsSearchResponse(BaseModel):
    """Модель ответа для поиска новостей"""
    news: List[NewsItemResponse]
    query: str
    total: int


# Создаем роутер для новостей
news_router = APIRouter(prefix="/api/news", tags=["news"])

# Кэш для новостей
_news_cache: Dict[str, Any] = {}
_cache_expiry: Dict[str, datetime] = {}
CACHE_DURATION = timedelta(minutes=15)  # Кэшируем на 15 минут


def _is_cache_valid(cache_key: str) -> bool:
    """Проверяем, валиден ли кэш"""
    if cache_key not in _cache_expiry:
        return False
    return datetime.now() < _cache_expiry[cache_key]


def _set_cache(cache_key: str, data: Any) -> None:
    """Устанавливаем данные в кэш"""
    _news_cache[cache_key] = data
    _cache_expiry[cache_key] = datetime.now() + CACHE_DURATION


def _get_cache(cache_key: str) -> Optional[Any]:
    """Получаем данные из кэша"""
    if _is_cache_valid(cache_key):
        return _news_cache.get(cache_key)
    return None


@news_router.get("/", response_model=NewsListResponse)
async def get_news_list(
    page: int = Query(1, ge=1, description="Номер страницы"),
    limit: int = Query(20, ge=1, le=50, description="Количество новостей на странице"),
    current_user: Optional[TelegramUser] = Depends(get_current_user)
) -> NewsListResponse:
    """
    Получаем список новостей с пагинацией (новый формат для мобильного приложения)
    
    Args:
        page: Номер страницы (начиная с 1)
        limit: Количество новостей на странице (максимум 50)
        current_user: Текущий пользователь (опционально)
    
    Returns:
        Список новостей с метаинформацией в новом формате
    """
    try:
        # Проверяем кэш
        cache_key = f"news_mobile_page_{page}_limit_{limit}"
        cached_data = _get_cache(cache_key)
        
        if cached_data:
            return NewsListResponse(**cached_data)
        
        # Получаем новости с информацией о пагинации
        news_data, has_next_page = get_latest_news(limit=limit, page=page)
        
        # Преобразуем в новый формат для мобильного приложения
        articles = []
        for idx, item in enumerate(news_data):
            # Для списка новостей используем только excerpt, полный контент загружаем при просмотре детали
            article = NewsArticle(
                id=hash(item.get('url', '')) % 1000000,  # Генерируем числовой ID из URL
                title=item.get('title', ''),
                excerpt=item.get('excerpt', ''),
                content=item.get('excerpt', ''),  # В списке показываем excerpt
                image_url=item.get('image_url'),
                published_at=item.get('date', ''),
                source=item.get('category', 'МГУ')
            )
            articles.append(article)
        
        response_data = {
            "articles": articles,
            "pagination": {
                "page": page,
                "total": len(articles) * page + (1 if has_next_page else 0),
                "hasMore": has_next_page
            }
        }
        
        # Кэшируем результат
        _set_cache(cache_key, response_data)
        
        return NewsListResponse(**response_data)
        
    except Exception as e:
        print(f"Ошибка при получении списка новостей: {e}")
        raise HTTPException(
            status_code=500,
            detail="Ошибка при получении новостей"
        )


@news_router.get("/{news_id}", response_model=NewsArticle)
async def get_news_by_id(
    news_id: int,
    current_user: Optional[TelegramUser] = Depends(get_current_user)
) -> NewsArticle:
    """
    Получаем детальную информацию о новости по ID (для мобильного приложения)
    
    Args:
        news_id: ID новости
        current_user: Текущий пользователь (опционально)
    
    Returns:
        Детальная информация о новости
    """
    try:
        # Проверяем кэш
        cache_key = f"news_mobile_id_{news_id}"
        cached_data = _get_cache(cache_key)
        
        if cached_data:
            return NewsArticle(**cached_data)
        
        # Получаем новости для поиска нужной
        news_data, _ = get_latest_news(limit=50, page=1)
        
        # Ищем новость с нужным ID
        for item in news_data:
            item_id = hash(item.get('url', '')) % 1000000
            if item_id == news_id:
                # Получаем детальную информацию
                detail_data = get_news_detail(item.get('url', ''))
                
                article_data = {
                    "id": news_id,
                    "title": item.get('title', ''),
                    "excerpt": item.get('excerpt', ''),
                    "content": detail_data.get('content', '') if detail_data else item.get('excerpt', ''),
                    "image_url": item.get('image_url'),
                    "published_at": item.get('date', ''),
                    "source": item.get('category', 'МГУ')
                }
                
                # Кэшируем результат
                _set_cache(cache_key, article_data)
                
                return NewsArticle(**article_data)
        
        raise HTTPException(
            status_code=404,
            detail="Новость не найдена"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Ошибка при получении новости по ID: {e}")
        raise HTTPException(
            status_code=500,
            detail="Ошибка при получении новости"
        )


@news_router.get("/detail", response_model=NewsDetailResponse)
async def get_news_detail_by_url(
    url: str = Query(..., description="URL новости"),
    current_user: Optional[TelegramUser] = Depends(get_current_user)
) -> NewsDetailResponse:
    """
    Получаем детальную информацию о новости по URL
    
    Args:
        url: URL новости
        current_user: Текущий пользователь (опционально)
    
    Returns:
        Детальная информация о новости
    """
    try:
        # Проверяем кэш
        cache_key = f"news_detail_{url}"
        cached_data = _get_cache(cache_key)
        
        if cached_data:
            return NewsDetailResponse(**cached_data)
        
        # Получаем детальную информацию
        detail_data = get_news_detail(url)
        
        if not detail_data:
            raise HTTPException(
                status_code=404,
                detail="Новость не найдена"
            )
        
        # Кэшируем результат
        _set_cache(cache_key, detail_data)
        
        return NewsDetailResponse(**detail_data)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Ошибка при получении детальной информации о новости: {e}")
        raise HTTPException(
            status_code=500,
            detail="Ошибка при получении детальной информации о новости"
        )


@news_router.get("/search", response_model=NewsSearchResponse)
async def search_news_endpoint(
    q: str = Query(..., min_length=2, description="Поисковый запрос"),
    limit: int = Query(10, ge=1, le=50, description="Максимальное количество результатов"),
    current_user: Optional[TelegramUser] = Depends(get_current_user)
) -> NewsSearchResponse:
    """
    Поиск новостей по ключевым словам
    
    Args:
        q: Поисковый запрос (минимум 2 символа)
        limit: Максимальное количество результатов (максимум 50)
        current_user: Текущий пользователь (опционально)
    
    Returns:
        Результаты поиска
    """
    try:
        # Проверяем кэш
        cache_key = f"news_search_{q}_{limit}"
        cached_data = _get_cache(cache_key)
        
        if cached_data:
            return NewsSearchResponse(**cached_data)
        
        # Выполняем поиск
        search_results = search_news(q, limit)
        
        # Преобразуем в модели ответа
        news_items = []
        for news_data in search_results:
            news_items.append(NewsItemResponse(**news_data))
        
        response_data = {
            "news": news_items,
            "query": q,
            "total": len(news_items)
        }
        
        # Кэшируем результат
        _set_cache(cache_key, response_data)
        
        return NewsSearchResponse(**response_data)
        
    except Exception as e:
        print(f"Ошибка при поиске новостей: {e}")
        raise HTTPException(
            status_code=500,
            detail="Ошибка при поиске новостей"
        )


@news_router.get("/categories", response_model=List[str])
async def get_news_categories(
    current_user: Optional[TelegramUser] = Depends(get_current_user)
) -> List[str]:
    """
    Получаем список доступных категорий новостей
    
    Args:
        current_user: Текущий пользователь (опционально)
    
    Returns:
        Список категорий
    """
    try:
        # Проверяем кэш
        cache_key = "news_categories"
        cached_data = _get_cache(cache_key)
        
        if cached_data:
            return cached_data
        
        # Получаем новости и извлекаем уникальные категории
        all_news = get_latest_news(limit=100)  # Получаем больше новостей для анализа категорий
        
        categories = set()
        for news_data in all_news:
            if news_data.get('category'):
                categories.add(news_data['category'])
        
        categories_list = sorted(list(categories))
        
        # Кэшируем результат
        _set_cache(cache_key, categories_list)
        
        return categories_list
        
    except Exception as e:
        print(f"Ошибка при получении категорий новостей: {e}")
        return []


@news_router.post("/cache/clear")
async def clear_news_cache(
    current_user: TelegramUser = Depends(get_current_user)
) -> Dict[str, str]:
    """
    Очищаем кэш новостей (только для авторизованных пользователей)
    
    Args:
        current_user: Текущий пользователь
    
    Returns:
        Сообщение об успешной очистке
    """
    try:
        # Проверяем, что пользователь авторизован
        if not current_user:
            raise HTTPException(
                status_code=401,
                detail="Требуется авторизация"
            )
        
        # Очищаем кэш
        _news_cache.clear()
        _cache_expiry.clear()
        
        return {"message": "Кэш новостей успешно очищен"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Ошибка при очистке кэша новостей: {e}")
        raise HTTPException(
            status_code=500,
            detail="Ошибка при очистке кэша"
        )


@news_router.get("/stats")
async def get_news_stats(
    current_user: Optional[TelegramUser] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Получаем статистику по новостям
    
    Args:
        current_user: Текущий пользователь (опционально)
    
    Returns:
        Статистика по новостям
    """
    try:
        # Проверяем кэш
        cache_key = "news_stats"
        cached_data = _get_cache(cache_key)
        
        if cached_data:
            return cached_data
        
        # Получаем новости для анализа
        all_news = get_latest_news(limit=100)
        
        # Анализируем статистику
        total_news = len(all_news)
        
        # Подсчитываем новости по категориям
        categories_count = {}
        authors_count = {}
        
        for news_data in all_news:
            # Категории
            category = news_data.get('category', 'Без категории')
            categories_count[category] = categories_count.get(category, 0) + 1
            
            # Авторы
            author = news_data.get('author', 'Неизвестный автор')
            if author:
                authors_count[author] = authors_count.get(author, 0) + 1
        
        # Находим самые популярные категории и авторов
        top_categories = sorted(categories_count.items(), key=lambda x: x[1], reverse=True)[:5]
        top_authors = sorted(authors_count.items(), key=lambda x: x[1], reverse=True)[:5]
        
        stats = {
            "total_news": total_news,
            "total_categories": len(categories_count),
            "total_authors": len(authors_count),
            "top_categories": [{"name": name, "count": count} for name, count in top_categories],
            "top_authors": [{"name": name, "count": count} for name, count in top_authors],
            "cache_size": len(_news_cache),
            "last_updated": datetime.now().isoformat()
        }
        
        # Кэшируем результат
        _set_cache(cache_key, stats)
        
        return stats
        
    except Exception as e:
        print(f"Ошибка при получении статистики новостей: {e}")
        return {
            "total_news": 0,
            "total_categories": 0,
            "total_authors": 0,
            "top_categories": [],
            "top_authors": [],
            "cache_size": 0,
            "last_updated": datetime.now().isoformat(),
            "error": str(e)
        }


@news_router.get("/image-proxy")
async def proxy_image(
    url: str = Query(..., description="URL изображения для проксирования"),
    current_user: Optional[TelegramUser] = Depends(get_current_user)
) -> Response:
    """
    Проксирует изображения новостей для обхода CORS
    
    Args:
        url: URL изображения
        current_user: Текущий пользователь (опционально)
    
    Returns:
        Изображение в виде Response
    """
    try:
        # Проверяем, что URL принадлежит доверенному домену
        allowed_domains = [
            'stud.spa.msu.ru',
            'spa.msu.ru',
            'msu.ru'
        ]
        
        from urllib.parse import urlparse
        parsed_url = urlparse(url)
        
        if not any(domain in parsed_url.netloc for domain in allowed_domains):
            raise HTTPException(
                status_code=400,
                detail="Недопустимый домен изображения"
            )
        
        # Загружаем изображение
        response = http_requests.get(
            url,
            timeout=10,
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        )
        response.raise_for_status()
        
        # Определяем тип контента
        content_type = response.headers.get('content-type', 'image/jpeg')
        
        # Возвращаем изображение с правильными заголовками
        return Response(
            content=response.content,
            media_type=content_type,
            headers={
                "Cache-Control": "public, max-age=3600",  # Кэшируем на час
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET",
                "Access-Control-Allow-Headers": "*"
            }
        )
        
    except http_requests.RequestException as e:
        print(f"Ошибка при загрузке изображения {url}: {e}")
        raise HTTPException(
            status_code=404,
            detail="Изображение не найдено"
        )
    except Exception as e:
        print(f"Ошибка при проксировании изображения: {e}")
        raise HTTPException(
            status_code=500,
            detail="Ошибка сервера при загрузке изображения"
        )

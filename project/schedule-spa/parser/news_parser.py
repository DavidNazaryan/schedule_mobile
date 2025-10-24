"""
Парсер новостей с сайта stud.spa.msu.ru/blog/
"""
from __future__ import annotations

import hashlib
import json
import re
from datetime import datetime
from typing import Any, Dict, List, Optional
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup


class NewsItem:
    """Класс для представления новости"""
    
    def __init__(
        self,
        title: str,
        excerpt: str,
        url: str,
        date: str,
        author: str = "",
        image_url: Optional[str] = None,
        content: Optional[str] = None,
        category: Optional[str] = None
    ):
        self.title = title
        self.excerpt = excerpt
        self.url = url
        self.date = date
        self.author = author
        self.image_url = image_url
        self.content = content
        self.category = category
        self.id = self._generate_id()
    
    def _generate_id(self) -> str:
        """Генерируем уникальный ID на основе URL и заголовка"""
        content = f"{self.url}:{self.title}"
        return hashlib.md5(content.encode('utf-8')).hexdigest()
    
    def to_dict(self) -> Dict[str, Any]:
        """Преобразуем в словарь"""
        return {
            'id': self.id,
            'title': self.title,
            'excerpt': self.excerpt,
            'url': self.url,
            'date': self.date,
            'author': self.author,
            'image_url': self.image_url,
            'content': self.content,
            'category': self.category
        }


class NewsParser:
    """Парсер новостей с сайта ФГУ МГУ"""
    
    BASE_URL = "https://stud.spa.msu.ru"
    BLOG_URL = "https://stud.spa.msu.ru/blog/"
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
    
    def fetch_news_list(self, page: int = 1) -> tuple[List[NewsItem], bool]:
        """
        Получаем список новостей с главной страницы блога
        
        Args:
            page: Номер страницы (для пагинации)
            
        Returns:
            Кортеж: (список объектов NewsItem, есть ли ещё страницы)
        """
        try:
            # Формируем URL с учетом пагинации
            if page > 1:
                url = f"{self.BLOG_URL}page/{page}/"
            else:
                url = self.BLOG_URL
            
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            news_items = []
            
            # Ищем статьи на странице - пробуем разные селекторы
            articles = []
            
            # Стандартные селекторы для WordPress и других CMS
            selectors_to_try = [
                'article',
                '.post',
                '.entry',
                '.news-item',
                '.blog-post',
                '.content-item',
                '[class*="post"]',
                '[class*="entry"]',
                '[class*="article"]',
                'main .wp-block-post',
                '.site-main article',
                '.content article'
            ]
            
            for selector in selectors_to_try:
                try:
                    found_articles = soup.select(selector)
                    if found_articles:
                        articles = found_articles
                        print(f"Найдены статьи с селектором: {selector}")
                        break
                except Exception as e:
                    continue
            
            # Если ничего не найдено, пробуем найти ссылки на статьи
            if not articles:
                # Ищем ссылки, которые могут вести к статьям
                links = soup.find_all('a', href=re.compile(r'/\d{4}/\d{2}/|/blog/|/news/|/post/'))
                if links:
                    print(f"Найдено {len(links)} ссылок на статьи")
                    # Создаем псевдо-статьи из ссылок
                    for link in links[:10]:  # Ограничиваем количество
                        parent = link.find_parent(['div', 'li', 'section'])
                        if parent:
                            articles.append(parent)
            
            for article in articles:
                news_item = self._parse_news_card(article)
                if news_item:
                    news_items.append(news_item)
            
            # Проверяем, есть ли следующая страница
            has_next_page = self._check_has_next_page(soup)
            
            return news_items, has_next_page
            
        except Exception as e:
            print(f"Ошибка при получении списка новостей: {e}")
            return [], False
    
    def _check_has_next_page(self, soup: BeautifulSoup) -> bool:
        """
        Проверяем, есть ли следующая страница в пагинации
        
        Args:
            soup: BeautifulSoup объект страницы
            
        Returns:
            True если есть следующая страница, False иначе
        """
        try:
            # Ищем элементы пагинации
            pagination_selectors = [
                '.pagination',
                '.page-numbers',
                '.nav-links',
                '.pager',
                '.paging',
                '[class*="pagination"]',
                '[class*="paging"]',
                '[class*="nav"]'
            ]
            
            for selector in pagination_selectors:
                pagination = soup.select_one(selector)
                if pagination:
                    # Ищем ссылку "Следующая" или "Next"
                    next_links = pagination.find_all('a', href=True)
                    for link in next_links:
                        text = link.get_text(strip=True).lower()
                        href = link.get('href', '')
                        
                        # Проверяем текст ссылки
                        if any(word in text for word in ['следующая', 'next', 'далее', 'вперед', '>']):
                            # Проверяем, что это действительно ссылка на следующую страницу
                            if 'page' in href or 'next' in href.lower():
                                return True
                        
                        # Проверяем href на наличие номера страницы больше текущей
                        if '/page/' in href:
                            page_match = re.search(r'/page/(\d+)/', href)
                            if page_match:
                                page_num = int(page_match.group(1))
                                if page_num > 1:  # Если есть страница больше 1, значит есть следующая
                                    return True
            
            # Альтернативный способ - ищем ссылки с номерами страниц
            page_links = soup.find_all('a', href=re.compile(r'/page/\d+/'))
            if page_links:
                # Если найдены ссылки на страницы, значит есть пагинация
                return True
            
            return False
            
        except Exception as e:
            print(f"Ошибка при проверке пагинации: {e}")
            return False
    
    def _parse_news_card(self, article_element) -> Optional[NewsItem]:
        """
        Парсим карточку новости из элемента статьи
        
        Args:
            article_element: BeautifulSoup элемент статьи
            
        Returns:
            NewsItem или None если не удалось распарсить
        """
        try:
            # Ищем заголовок - пробуем разные варианты
            title_element = None
            title_selectors = [
                'h1', 'h2', 'h3', 'h4',
                '.title', '.heading', '.post-title', '.entry-title',
                '[class*="title"]', '[class*="heading"]',
                'a[title]'  # Ссылки с атрибутом title
            ]
            
            for selector in title_selectors:
                try:
                    found = article_element.select_one(selector)
                    if found and found.get_text(strip=True):
                        title_element = found
                        break
                except:
                    continue
            
            if not title_element:
                # Если заголовок не найден, пробуем найти любую ссылку с текстом
                links = article_element.find_all('a')
                for link in links:
                    text = link.get_text(strip=True)
                    if text and len(text) > 10:  # Минимальная длина заголовка
                        title_element = link
                        break
            
            if not title_element:
                return None
            
            title = title_element.get_text(strip=True)
            if not title or len(title) < 5:  # Слишком короткий заголовок
                return None
            
            # Ищем ссылку на полную статью
            link_element = title_element.find('a') if title_element.name != 'a' else title_element
            if not link_element:
                link_element = article_element.find('a')
            
            if not link_element:
                return None
            
            url = link_element.get('href', '')
            if url and not url.startswith('http'):
                url = urljoin(self.BASE_URL, url)
            
            # Ищем краткое описание
            excerpt = ""
            
            # Сначала ищем специальные элементы для excerpt
            excerpt_element = article_element.find('div', class_=re.compile(r'excerpt|summary|content'))
            
            if excerpt_element:
                excerpt = excerpt_element.get_text(strip=True)
            else:
                # Если специального элемента нет, ищем параграфы, исключая заголовки
                paragraphs = article_element.find_all('p')
                for p in paragraphs:
                    text = p.get_text(strip=True)
                    # Пропускаем параграфы, которые содержат заголовок или слишком короткие
                    if (text and 
                        len(text) > 20 and 
                        text != title and 
                        not text.startswith(title[:20]) and  # Не начинается с заголовка
                        len(text) > len(title)):  # Длиннее заголовка
                        excerpt = text
                        break
            
            # Очищаем excerpt от дублирования заголовка и служебных элементов
            if excerpt and title:
                # Убираем заголовок из начала excerpt
                if excerpt.startswith(title):
                    excerpt = excerpt[len(title):].strip()
                # Убираем повторяющиеся части
                excerpt = excerpt.replace(title, "").strip()
            
            # Очищаем от служебных элементов
            if excerpt:
                # Убираем элементы типа "[…]byМарышев НикитаonСен 16Подробнее"
                excerpt = re.sub(r'\[…\].*?Подробнее', '', excerpt)
                # Убираем элементы типа "byАвторonДата"
                excerpt = re.sub(r'by\w+on\w+\d+', '', excerpt)
                # Убираем элементы типа "byАвторonМесяц"
                excerpt = re.sub(r'by\w+on\w+', '', excerpt)
                # Убираем одиночные "by" и "on"
                excerpt = re.sub(r'\bby\b|\bon\b', '', excerpt)
                # Убираем лишние пробелы и знаки препинания
                excerpt = re.sub(r'\s+', ' ', excerpt).strip()
                # Убираем знаки препинания в конце, если они остались после очистки
                excerpt = re.sub(r'[.,;:!?]+$', '', excerpt).strip()
            
            # Обрезаем до разумной длины
            if excerpt and len(excerpt) > 200:
                excerpt = excerpt[:200] + "..."
            
            # Ищем дату и автора в metadata-item элементах
            date_str = ""
            author = ""
            
            # Ищем метаданные в .h-blog-meta
            meta_container = article_element.find('div', class_=re.compile(r'blog-meta|post-meta'))
            if meta_container:
                meta_items = meta_container.find_all('div', class_='metadata-item')
                for item in meta_items:
                    text = item.get_text(strip=True)
                    # Убираем префиксы
                    prefix = item.find('span', class_='metadata-prefix')
                    if prefix:
                        prefix_text = prefix.get_text(strip=True).lower()
                        # Получаем текст без префикса
                        item_copy = item.__copy__()
                        if item_copy.find('span', class_='metadata-prefix'):
                            item_copy.find('span', class_='metadata-prefix').decompose()
                        value = item_copy.get_text(strip=True)
                        
                        if prefix_text == 'by':
                            author = value
                        elif prefix_text == 'on':
                            date_str = value
            
            # Если не нашли через метаданные, пробуем старые методы
            if not date_str:
                date_element = (
                    article_element.find('time') or
                    article_element.find('span', class_=re.compile(r'date|time')) or
                    article_element.find('div', class_=re.compile(r'date|time'))
                )
                if date_element:
                    date_str = date_element.get('datetime') or date_element.get_text(strip=True)
                    # Убираем префикс "on" если есть
                    date_str = re.sub(r'^(on|дата:?)\s*', '', date_str, flags=re.IGNORECASE)
            
            if not author:
                author_element = (
                    article_element.find('span', class_=re.compile(r'author|by')) or
                    article_element.find('div', class_=re.compile(r'author|by'))
                )
                if author_element:
                    author = author_element.get_text(strip=True)
                    # Убираем префиксы типа "by", "автор:"
                    author = re.sub(r'^(by|автор:?)\s*', '', author, flags=re.IGNORECASE)
            
            # Ищем изображение
            img_element = article_element.find('img')
            image_url = None
            if img_element:
                image_url = img_element.get('src') or img_element.get('data-src')
                if image_url and not image_url.startswith('http'):
                    image_url = urljoin(self.BASE_URL, image_url)
            
            # Ищем категорию
            category = ""
            
            # Сначала пробуем извлечь из классов элемента (например, category-news)
            article_classes = article_element.get('class', [])
            for cls in article_classes:
                if cls.startswith('category-'):
                    # Извлекаем название категории из класса
                    cat_name = cls.replace('category-', '').replace('-', ' ').title()
                    if cat_name not in ['Uncategorized']:
                        category = cat_name
                        break
            
            # Если не нашли в классах, ищем в элементах
            if not category:
                category_element = (
                    article_element.find('span', class_=re.compile(r'category|tag')) or
                    article_element.find('div', class_=re.compile(r'category|tag'))
                )
                if category_element:
                    category = category_element.get_text(strip=True)
            
            # Если категория не найдена, используем значение по умолчанию
            if not category:
                category = "МГУ"
            
            # Валидация: проверяем, что есть обязательные поля
            if not title or len(title) < 5:
                print(f"Пропущена новость: заголовок слишком короткий или отсутствует")
                return None
            
            if not url:
                print(f"Пропущена новость '{title[:30]}...': отсутствует URL")
                return None
            
            # Если excerpt пустой, используем заголовок
            if not excerpt or len(excerpt) < 10:
                excerpt = title
            
            return NewsItem(
                title=title,
                excerpt=excerpt,
                url=url,
                date=date_str,
                author=author,
                image_url=image_url,
                category=category
            )
            
        except Exception as e:
            print(f"Ошибка при парсинге карточки новости: {e}")
            return None
    
    def fetch_news_detail(self, news_url: str) -> Optional[Dict[str, Any]]:
        """
        Получаем детальную информацию о новости по URL
        
        Args:
            news_url: URL новости
            
        Returns:
            Словарь с детальной информацией или None
        """
        try:
            response = self.session.get(news_url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Ищем основной контент статьи - пробуем разные селекторы
            content_element = None
            content_selectors = [
                'div[class*="entry"]',
                'div[class*="post"]', 
                'div[class*="content"]',
                'div[class*="article"]',
                'article',
                'main',
                '.entry-content',
                '.post-content',
                '.article-content',
                '.content-area',
                '.site-main'
            ]
            
            for selector in content_selectors:
                try:
                    elements = soup.select(selector)
                    for elem in elements:
                        # Проверяем, что элемент содержит достаточно текста
                        text = elem.get_text(strip=True)
                        if text and len(text) > 100:  # Минимум 100 символов
                            content_element = elem
                            print(f"Найден контент с селектором: {selector}")
                            break
                    if content_element:
                        break
                except:
                    continue
            
            if not content_element:
                print("Контент не найден, пробуем альтернативный подход")
                # Альтернативный подход - ищем все параграфы на странице
                all_p = soup.find_all('p')
                if all_p:
                    # Создаем виртуальный контейнер из всех параграфов
                    content_element = soup.new_tag('div')
                    for p in all_p:
                        text = p.get_text(strip=True)
                        if text and len(text) > 20:
                            content_element.append(p)
            
            if not content_element:
                return None
            
            # Извлекаем заголовок
            title_element = (
                content_element.find('h1') or
                soup.find('h1') or
                content_element.find('h2') or
                soup.find('h2')
            )
            
            title = title_element.get_text(strip=True) if title_element else ""
            
            # Извлекаем основной текст с сохранением форматирования
            # Удаляем навигационные элементы и мета-информацию
            for unwanted in content_element.find_all(['nav', 'aside', 'footer', 'header', 'script', 'style']):
                unwanted.decompose()
            
            # Удаляем мета-информацию (автор, дата, комментарии)
            for meta in content_element.find_all(['time', 'span', 'div'], class_=re.compile(r'date|author|meta|comment|published')):
                meta.decompose()
            
            # Удаляем служебные элементы (категории, теги, навигация)
            for unwanted in content_element.find_all(['h6'], string=re.compile(r'Category|Tags|Навигация|Comments')):
                unwanted.decompose()
            
            # Извлекаем контент с сохранением HTML-разметки
            content_html = ""
            
            # Получаем все параграфы и обрабатываем их
            paragraphs = content_element.find_all('p')
            
            for p in paragraphs:
                # Очищаем от служебных элементов
                p_text = p.get_text(strip=True)
                if p_text:
                    # Убираем элементы типа "[…]byМарышев НикитаonСен 16Подробнее"
                    p_text = re.sub(r'\[…\].*?Подробнее', '', p_text)
                    # Убираем элементы типа "byАвторonДата"
                    p_text = re.sub(r'by\w+on\w+\d+', '', p_text)
                    # Убираем элементы типа "byАвторonМесяц"
                    p_text = re.sub(r'by\w+on\w+', '', p_text)
                    # Убираем одиночные "by" и "on"
                    p_text = re.sub(r'\bby\b|\bon\b', '', p_text)
                    # Убираем мета-информацию (автор|дата|время|комментарии)
                    p_text = re.sub(r'[^|]*\|[^|]*\|[^|]*\|[^|]*comments?', '', p_text)
                    # Убираем лишние пробелы
                    p_text = re.sub(r'\s+', ' ', p_text).strip()
                
                if p_text and len(p_text) > 10:
                    # Пропускаем элементы, которые содержат только мета-информацию
                    if re.match(r'^[^|]*\|[^|]*\|[^|]*\|[^|]*$', p_text):
                        continue
                    
                    # Проверяем, содержит ли параграф жирный текст или изображения
                    if p.find(['strong', 'b', 'img']):
                        # Сохраняем внутреннюю HTML-разметку
                        inner_html = str(p)
                        # Очищаем от служебных элементов в HTML
                        inner_html = re.sub(r'\[…\].*?Подробнее', '', inner_html)
                        inner_html = re.sub(r'by\w+on\w+\d+', '', inner_html)
                        inner_html = re.sub(r'by\w+on\w+', '', inner_html)
                        inner_html = re.sub(r'\bby\b|\bon\b', '', inner_html)
                        inner_html = re.sub(r'[^|]*\|[^|]*\|[^|]*\|[^|]*comments?', '', inner_html)
                        content_html += f"{inner_html}\n\n"
                    else:
                        content_html += f"<p>{p_text}</p>\n\n"
            
            # Обрабатываем списки отдельно
            lists = content_element.find_all(['ul', 'ol'])
            for list_elem in lists:
                list_items = list_elem.find_all('li')
                if list_items:
                    list_tag = list_elem.name
                    content_html += f"<{list_tag}>\n"
                    for li in list_items:
                        li_text = li.get_text(strip=True)
                        if li_text and len(li_text) > 5:
                            content_html += f"<li>{li_text}</li>\n"
                    content_html += f"</{list_tag}>\n\n"
            
            # Обрабатываем заголовки
            headers = content_element.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
            for header in headers:
                header_text = header.get_text(strip=True)
                if header_text and len(header_text) > 5:
                    content_html += f"<{header.name}>{header_text}</{header.name}>\n\n"
            
            # Обрабатываем изображения, которые могут быть отдельными элементами
            images_in_content = content_element.find_all('img')
            for img in images_in_content:
                img_src = img.get('src') or img.get('data-src')
                if img_src:
                    if not img_src.startswith('http'):
                        img_src = urljoin(self.BASE_URL, img_src)
                    img_alt = img.get('alt', 'Изображение')
                    content_html += f'<div class="article-image"><img src="{img_src}" alt="{img_alt}" style="width: 100%; height: auto; border-radius: 12px; margin: 1rem 0;"></div>\n\n'
            
            # Если HTML-контент не найден, используем простой текст
            if not content_html:
                paragraphs = content_element.find_all('p')
                content_text = ""
                
                for p in paragraphs:
                    text = p.get_text(strip=True)
                    # Очищаем от служебных элементов
                    if text:
                        text = re.sub(r'\[…\].*?Подробнее', '', text)
                        text = re.sub(r'by\w+on\w+\d+', '', text)
                        text = re.sub(r'by\w+on\w+', '', text)
                        text = re.sub(r'\bby\b|\bon\b', '', text)
                        text = re.sub(r'\s+', ' ', text).strip()
                    
                    if text and len(text) > 15:
                        content_text += text + "\n\n"
                
                # Если параграфов нет, берем весь текст
                if not content_text:
                    content_text = content_element.get_text(strip=True)
                    content_text = re.sub(r'\[…\].*?Подробнее', '', content_text)
                    content_text = re.sub(r'by\w+on\w+\d+', '', content_text)
                    content_text = re.sub(r'by\w+on\w+', '', content_text)
                    content_text = re.sub(r'\bby\b|\bon\b', '', content_text)
                    content_text = re.sub(r'\s+', ' ', content_text).strip()
                
                content_html = content_text
            
            # Ищем дату публикации и автора в metadata-item элементах
            date_str = ""
            author = ""
            
            # Сначала ищем в метаданных
            # Use lambda to check if any class contains 'blog-meta' or 'post-meta'
            # Note: class_ can be a list when there are multiple classes
            def has_meta_class(classes):
                if not classes:
                    return False
                if isinstance(classes, list):
                    return any('blog-meta' in c or 'post-meta' in c for c in classes)
                return 'blog-meta' in classes or 'post-meta' in classes
            
            # Try to find meta container
            # Note: On detail pages, metadata might not be in the HTML due to server-side rendering
            # This is acceptable since the mobile app already has date/author from the list view
            meta_container = soup.find('div', class_=has_meta_class)
            if meta_container:
                meta_items = meta_container.find_all('div', class_='metadata-item')
                for i, item in enumerate(meta_items):
                    # Сначала пробуем метод с префиксом (для списка новостей)
                    prefix = item.find('span', class_='metadata-prefix')
                    if prefix:
                        prefix_text = prefix.get_text(strip=True).lower()
                        # Получаем текст без префикса
                        item_copy = item.__copy__()
                        if item_copy.find('span', class_='metadata-prefix'):
                            item_copy.find('span', class_='metadata-prefix').decompose()
                        value = item_copy.get_text(strip=True)
                        
                        if prefix_text == 'by':
                            author = value
                        elif prefix_text == 'on':
                            date_str = value
                    else:
                        # Для детальной страницы: текст без префиксов
                        text = item.get_text(strip=True).replace('|', '').strip()
                        
                        # Пропускаем пустые элементы
                        if not text or len(text) < 3:
                            continue
                        
                        # Проверяем, похоже ли на дату
                        is_date = re.search(r'\d{1,2}\s+\w+|[А-Яа-я]+\s+\d{1,2}|\d{4}', text)
                        
                        if is_date and not date_str:
                            date_str = text
                        elif not author and not is_date and not re.match(r'^\d+:?\d*$', text):
                            # Если не дата и не время, скорее всего автор
                            a_tag = item.find('a')
                            if a_tag:
                                author = a_tag.get_text(strip=True)
                            else:
                                author = text
            
            # Если не нашли, пробуем старые методы
            if not date_str:
                date_element = (
                    soup.find('time') or
                    soup.find('span', class_=re.compile(r'date|published')) or
                    soup.find('div', class_=re.compile(r'date|published'))
                )
                if date_element:
                    date_str = date_element.get('datetime') or date_element.get_text(strip=True)
                    # Убираем префикс "on" если есть
                    date_str = re.sub(r'^(on|дата:?)\s*', '', date_str, flags=re.IGNORECASE)
            
            if not author:
                author_element = (
                    soup.find('span', class_=re.compile(r'author|by')) or
                    soup.find('div', class_=re.compile(r'author|by'))
                )
                if author_element:
                    author = author_element.get_text(strip=True)
                    author = re.sub(r'^(by|автор:?)\s*', '', author, flags=re.IGNORECASE)
            
            # Ищем изображения в статье
            images = []
            for img in content_element.find_all('img'):
                img_src = img.get('src') or img.get('data-src')
                if img_src:
                    if not img_src.startswith('http'):
                        img_src = urljoin(self.BASE_URL, img_src)
                    images.append(img_src)
            
            return {
                'title': title,
                'content': content_html.strip(),
                'date': date_str,
                'author': author,
                'images': images,
                'url': news_url
            }
            
        except Exception as e:
            print(f"Ошибка при получении детальной информации о новости: {e}")
            return None
    
    def search_news(self, query: str, limit: int = 10) -> List[NewsItem]:
        """
        Поиск новостей по ключевым словам
        
        Args:
            query: Поисковый запрос
            limit: Максимальное количество результатов
            
        Returns:
            Список найденных новостей
        """
        try:
            # Получаем несколько страниц новостей для поиска
            all_news = []
            for page in range(1, 4):  # Ищем в первых 3 страницах
                news_list, has_next = self.fetch_news_list(page)
                all_news.extend(news_list)
                if len(news_list) == 0:  # Если страница пустая, прекращаем
                    break
            
            # Фильтруем по запросу
            query_lower = query.lower()
            filtered_news = []
            
            for news in all_news:
                if (query_lower in news.title.lower() or 
                    query_lower in news.excerpt.lower() or
                    (news.category and query_lower in news.category.lower())):
                    filtered_news.append(news)
            
            return filtered_news[:limit]
            
        except Exception as e:
            print(f"Ошибка при поиске новостей: {e}")
            return []


# Глобальный экземпляр парсера
news_parser = NewsParser()


def get_latest_news(limit: int = 10, page: int = 1) -> tuple[List[Dict[str, Any]], bool]:
    """
    Получаем последние новости
    
    Args:
        limit: Максимальное количество новостей
        page: Номер страницы
        
    Returns:
        Кортеж: (список словарей с информацией о новостях, есть ли ещё страницы)
    """
    news_items, has_next = news_parser.fetch_news_list(page)
    return [item.to_dict() for item in news_items[:limit]], has_next


def get_news_detail(news_url: str) -> Optional[Dict[str, Any]]:
    """
    Получаем детальную информацию о новости
    
    Args:
        news_url: URL новости
        
    Returns:
        Словарь с детальной информацией или None
    """
    return news_parser.fetch_news_detail(news_url)


def search_news(query: str, limit: int = 10) -> List[Dict[str, Any]]:
    """
    Поиск новостей
    
    Args:
        query: Поисковый запрос
        limit: Максимальное количество результатов
        
    Returns:
        Список найденных новостей
    """
    news_items = news_parser.search_news(query, limit)
    return [item.to_dict() for item in news_items]


if __name__ == "__main__":
    # Тестирование парсера
    parser = NewsParser()
    
    print("Получаем список новостей...")
    print(f"URL: {parser.BLOG_URL}")
    
    try:
        # Сначала просто загружаем страницу и смотрим её структуру
        response = parser.session.get(parser.BLOG_URL, timeout=10)
        response.raise_for_status()
        
        print(f"Статус ответа: {response.status_code}")
        print(f"Размер контента: {len(response.content)} байт")
        
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Ищем заголовок страницы
        title = soup.find('title')
        if title:
            print(f"Заголовок страницы: {title.get_text(strip=True)}")
        
        # Ищем все ссылки
        all_links = soup.find_all('a', href=True)
        print(f"Всего ссылок на странице: {len(all_links)}")
        
        # Ищем ссылки, которые могут быть статьями
        article_links = []
        for link in all_links:
            href = link.get('href', '')
            text = link.get_text(strip=True)
            if text and len(text) > 10 and ('blog' in href or '2024' in href or '2025' in href):
                article_links.append((text, href))
        
        print(f"Потенциальных ссылок на статьи: {len(article_links)}")
        for i, (text, href) in enumerate(article_links[:5]):
            print(f"  {i+1}. {text[:50]}... -> {href}")
        
        # Теперь пробуем парсер
        news_list, has_next = parser.fetch_news_list()
        
        print(f"\nНайдено {len(news_list)} новостей:")
        print(f"Есть следующая страница: {has_next}")
        for news in news_list[:3]:
            print(f"- {news.title}")
            print(f"  URL: {news.url}")
            print(f"  Дата: {news.date}")
            print(f"  Автор: {news.author}")
            print(f"  Категория: {news.category}")
            print(f"  Изображение: {news.image_url}")
            if news.excerpt:
                print(f"  Краткое описание: {news.excerpt[:100]}...")
            else:
                print(f"  Краткое описание: [нет]")
            print()
        
        # Тестируем получение детальной информации
        if news_list:
            print("Получаем детальную информацию о первой новости...")
            detail = parser.fetch_news_detail(news_list[0].url)
            if detail:
                print(f"Заголовок: {detail['title']}")
                print(f"Дата: {detail['date']}")
                print(f"Автор: {detail['author']}")
                print(f"Изображений: {len(detail['images'])}")
                print(f"Содержимое: {detail['content'][:200]}...")
            else:
                print("Не удалось получить детальную информацию")
        
    except Exception as e:
        print(f"Ошибка при тестировании: {e}")
        import traceback
        traceback.print_exc()

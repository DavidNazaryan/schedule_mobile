# Исправление соотношения сторон изображений в статьях

## Проблема

Изображения внутри статей теряли оригинальное соотношение сторон из-за фиксированного CSS правила `aspect-ratio: 1024 / 691`, которое принудительно устанавливало соотношение сторон для всех изображений.

**Проблемный CSS:**
```css
.news-detail-images img {
    width: 100%;
    height: auto;
    aspect-ratio: 1024 / 691; /* Проблема: фиксированное соотношение */
    border-radius: 12px;
    margin-bottom: 0.5rem;
    object-fit: cover; /* Обрезает изображение */
}
```

## Решение

### 1. Исправлен CSS для изображений в блоке изображений

```css
.news-detail-images img {
    width: 100%;
    height: auto;
    border-radius: 12px;
    margin-bottom: 0.5rem;
    object-fit: contain; /* Сохраняем оригинальное соотношение сторон */
}
```

**Изменения:**
- ❌ Удалено: `aspect-ratio: 1024 / 691`
- ✅ Изменено: `object-fit: cover` → `object-fit: contain`

### 2. Добавлены стили для изображений внутри контента

```css
.news-detail-text img {
    width: 100%;
    height: auto;
    border-radius: 12px;
    margin: 1rem 0;
    object-fit: contain; /* Сохраняем оригинальное соотношение сторон */
}

.article-image {
    margin: 1rem 0;
    text-align: center;
}

.article-image img {
    max-width: 100%;
    height: auto;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
```

### 3. Улучшен парсер для обработки изображений в контенте

```python
# Проверяем, содержит ли параграф жирный текст или изображения
if p.find(['strong', 'b', 'img']):
    # Сохраняем внутреннюю HTML-разметку
    inner_html = str(p)
    # Очищаем от служебных элементов в HTML
    inner_html = re.sub(r'[^|]*\|[^|]*\|[^|]*\|[^|]*comments?', '', inner_html)
    content_html += f"{inner_html}\n\n"

# Обрабатываем изображения, которые могут быть отдельными элементами
images_in_content = content_element.find_all('img')
for img in images_in_content:
    img_src = img.get('src') or img.get('data-src')
    if img_src:
        if not img_src.startswith('http'):
            img_src = urljoin(self.BASE_URL, img_src)
        img_alt = img.get('alt', 'Изображение')
        content_html += f'<div class="article-image"><img src="{img_src}" alt="{img_alt}" style="width: 100%; height: auto; border-radius: 12px; margin: 1rem 0;"></div>\n\n'
```

## Результат

### До исправления:
- ❌ Все изображения принудительно имели соотношение 1024:691
- ❌ Изображения обрезались (`object-fit: cover`)
- ❌ Искажались оригинальные пропорции

### После исправления:
- ✅ Изображения сохраняют оригинальное соотношение сторон
- ✅ Изображения не обрезаются (`object-fit: contain`)
- ✅ Пропорции остаются естественными
- ✅ Изображения внутри контента обрабатываются отдельно
- ✅ Добавлены стили для центрирования и теней

## Технические детали

### `object-fit: contain` vs `object-fit: cover`

- **`cover`** - масштабирует изображение для заполнения контейнера, может обрезать части изображения
- **`contain`** - масштабирует изображение для полного отображения в контейнере, сохраняет пропорции

### Адаптивность

```css
.article-image img {
    max-width: 100%; /* Не превышает ширину контейнера */
    height: auto;    /* Автоматическая высота для сохранения пропорций */
}
```

## Файлы

- `app/templates/index.html` - исправлены CSS стили для изображений
- `parser/news_parser.py` - улучшена обработка изображений в контенте

Теперь все изображения в статьях отображаются с правильным соотношением сторон!




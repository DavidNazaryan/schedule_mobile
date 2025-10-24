# Исправление дублирования заголовка в excerpt новостей

## Проблема

В карточках новостей поле `excerpt` дублировало текст заголовка, что приводило к избыточному отображению информации.

**Пример проблемы:**
- Заголовок: "II Международный симпозиум «Создавая будущее»"
- Excerpt: "II Международный симпозиум «Создавая будущее»Приглашаем вас принять участие..."

## Решение

Обновлена логика парсинга excerpt в `parser/news_parser.py`:

### 1. Улучшен поиск excerpt

```python
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
```

### 2. Очистка от дублирования

```python
# Очищаем excerpt от дублирования заголовка
if excerpt and title:
    # Убираем заголовок из начала excerpt
    if excerpt.startswith(title):
        excerpt = excerpt[len(title):].strip()
    # Убираем повторяющиеся части
    excerpt = excerpt.replace(title, "").strip()
```

### 3. Ограничение длины

```python
# Обрезаем до разумной длины
if excerpt and len(excerpt) > 200:
    excerpt = excerpt[:200] + "..."
```

## Результат

**После исправления:**
- Заголовок: "II Международный симпозиум «Создавая будущее»"
- Excerpt: "Приглашаем вас принять участие в Экспертной программе II Международного симпозиума..."

## Тестирование

Протестированы первые 5 новостей:
- ✅ Excerpt не дублирует заголовок
- ✅ Excerpt содержит только описание новости
- ✅ Excerpt имеет разумную длину (до 200 символов)
- ✅ Работает для всех страниц пагинации

## Файлы

- `parser/news_parser.py` - обновлена логика парсинга excerpt
- `app/news_api.py` - использует исправленный парсер
- `app/templates/index.html` - отображает исправленные excerpt




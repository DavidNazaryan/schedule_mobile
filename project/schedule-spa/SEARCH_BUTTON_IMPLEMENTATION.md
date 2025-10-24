# Изменение интерфейса поиска новостей

## Проблема

Поиск новостей был реализован как постоянное поле ввода в секции новостей, что занимало много места и не было интуитивно понятным.

**Старая реализация:**
```html
<div class="news-search-container">
    <div class="search-box">
        <input type="text" id="news-search-input" placeholder="Поиск новостей..." class="search-input">
        <button type="button" id="news-search-btn" class="search-btn">
            <span class="search-icon">🔍</span>
        </button>
    </div>
</div>
```

## Решение

Поиск новостей теперь реализован как кнопка в заголовке, которая раскрывается в поле поиска при нажатии.

### 1. Новая структура HTML

```html
<!-- Кнопка поиска для новостей -->
<div id="news-search-header" class="news-search-header" style="display: none;">
    <button type="button" id="news-search-toggle" class="news-search-toggle" aria-label="Поиск новостей">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
        </svg>
    </button>
    
    <!-- Раскрывающееся поле поиска -->
    <div id="news-search-dropdown" class="news-search-dropdown" style="display: none;">
        <div class="news-search-box">
            <input type="text" id="news-search-input" placeholder="Поиск новостей..." class="news-search-input">
            <button type="button" id="news-search-btn" class="news-search-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                </svg>
            </button>
        </div>
    </div>
</div>
```

### 2. CSS стили

```css
/* Стили для поиска новостей в заголовке */
.news-search-header {
    position: relative;
    display: flex;
    align-items: center;
}

.news-search-toggle {
    padding: 0.5rem;
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    backdrop-filter: blur(10px);
}

.news-search-toggle:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
}

.news-search-dropdown {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 0.5rem;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    min-width: 300px;
    animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.news-search-box {
    display: flex;
    gap: 0.5rem;
    padding: 1rem;
}

.news-search-input {
    flex: 1;
    padding: 0.75rem 1rem;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--bg);
    color: var(--text);
    font-size: 0.9rem;
    outline: none;
    transition: border-color 0.2s ease;
}

.news-search-input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(var(--accent-rgb), 0.1);
}

.news-search-btn {
    padding: 0.75rem;
    background: var(--accent);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 40px;
    transition: all 0.2s ease;
}

.news-search-btn:hover {
    background: var(--accent-dark);
    transform: translateY(-1px);
}
```

### 3. JavaScript логика

```javascript
initializeEventListeners() {
    // Поиск новостей в заголовке
    const searchToggle = document.getElementById('news-search-toggle');
    const searchDropdown = document.getElementById('news-search-dropdown');
    const searchInput = document.getElementById('news-search-input');
    const searchBtn = document.getElementById('news-search-btn');
    
    // Переключение видимости поля поиска
    if (searchToggle && searchDropdown) {
        searchToggle.addEventListener('click', () => {
            const isVisible = searchDropdown.style.display !== 'none';
            if (isVisible) {
                searchDropdown.style.display = 'none';
            } else {
                searchDropdown.style.display = 'block';
                // Фокусируемся на поле ввода
                setTimeout(() => {
                    if (searchInput) {
                        searchInput.focus();
                    }
                }, 100);
            }
        });
    }
    
    // Поиск по вводу
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.searchNews(e.target.value);
            }, 500);
        });
    }

    // Поиск по кнопке
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            const query = searchInput ? searchInput.value : '';
            this.searchNews(query);
        });
    }
    
    // Закрытие поля поиска при клике вне его
    document.addEventListener('click', (e) => {
        if (searchDropdown && searchToggle && 
            !searchDropdown.contains(e.target) && 
            !searchToggle.contains(e.target)) {
            searchDropdown.style.display = 'none';
        }
    });
}
```

### 4. Показ/скрытие кнопки поиска

```javascript
function updateHeader(target) {
    // Show/hide news search based on current tab
    const newsSearchHeader = document.getElementById('news-search-header');
    if (newsSearchHeader) {
        newsSearchHeader.style.display = target === 'news' ? 'flex' : 'none';
    }
    
    switch (target) {
        case 'news':
            headerTitle.textContent = 'Лента';
            setHeaderSubtitle('');
            break;
        // ... другие случаи
    }
}
```

## Результат

### До изменения:
- ❌ Постоянное поле поиска занимало место в секции новостей
- ❌ Не интуитивно понятный интерфейс
- ❌ Поиск был всегда виден, даже когда не нужен

### После изменения:
- ✅ Кнопка поиска в заголовке рядом с названием "Лента"
- ✅ Раскрывающееся поле поиска по клику
- ✅ Автоматический фокус на поле ввода
- ✅ Закрытие поля при клике вне его
- ✅ Плавная анимация появления
- ✅ Кнопка показывается только на вкладке "Лента"

## Улучшения UX

1. **Экономия места** - поле поиска не занимает постоянное место
2. **Интуитивность** - кнопка поиска в заголовке логична
3. **Фокус** - автоматический фокус на поле ввода при открытии
4. **Закрытие** - поле закрывается при клике вне его
5. **Анимация** - плавное появление поля поиска
6. **Контекстность** - кнопка показывается только на нужной вкладке

## Файлы

- `app/templates/index.html` - обновлена структура HTML, CSS стили и JavaScript логика

Теперь поиск новостей работает как современное раскрывающееся поле в заголовке!




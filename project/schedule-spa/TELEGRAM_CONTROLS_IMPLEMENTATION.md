# Учет кнопок управления Telegram мини-приложением

## Проблема

Модальное окно с полной статьей не учитывало кнопки управления Telegram мини-приложением, которые появляются в полноэкранном режиме. Это могло привести к перекрытию контента кнопками управления.

**Проблемные стили:**
```css
.news-modal {
    padding-top: calc(1rem + var(--safe-area-top)); /* Без учета кнопок управления */
}
```

## Решение

### 1. Добавлены CSS переменные для Telegram

```css
:root {
    --safe-area-top: var(--tg-safe-area-inset-top, env(safe-area-inset-top, 0px));
    --tg-header-height: var(--tg-viewport-height, 0px);
    --tg-controls-height: 44px; /* Высота кнопок управления Telegram */
}
```

### 2. Обновлены стили модального окна

```css
.news-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    padding-top: calc(1rem + var(--safe-area-top) + var(--tg-controls-height));
    backdrop-filter: blur(4px);
}
```

### 3. Обновлены мобильные стили

```css
@media (max-width: 768px) {
    .news-modal {
        padding: 0.5rem;
        padding-top: calc(0.5rem + var(--safe-area-top) + var(--tg-controls-height));
    }
}
```

### 4. Добавлен JavaScript для динамического определения высоты

```javascript
// Функция для определения высоты кнопок управления Telegram
updateTelegramControlsHeight() {
    try {
        const webApp = window.Telegram?.WebApp;
        if (!webApp) {
            console.log('📱 Telegram WebApp недоступен, используем стандартную высоту');
            return;
        }
        
        // Получаем информацию о viewport
        const viewportHeight = webApp.viewportHeight || window.innerHeight;
        const viewportStableHeight = webApp.viewportStableHeight || window.innerHeight;
        
        console.log('📱 Telegram viewport данные:', {
            viewportHeight,
            viewportStableHeight,
            difference: viewportHeight - viewportStableHeight
        });
        
        // Вычисляем высоту кнопок управления
        const controlsHeight = Math.max(0, viewportHeight - viewportStableHeight);
        
        // Обновляем CSS переменную
        document.documentElement.style.setProperty('--tg-controls-height', `${controlsHeight}px`);
        
        console.log(`📱 Высота кнопок управления Telegram: ${controlsHeight}px`);
        
    } catch (error) {
        console.warn('⚠️ Ошибка при определении высоты кнопок управления:', error);
        // Используем стандартную высоту
        document.documentElement.style.setProperty('--tg-controls-height', '44px');
    }
}
```

## Результат

### До исправления:
- ❌ Модальное окно могло перекрываться кнопками управления Telegram
- ❌ Контент мог быть скрыт под кнопками управления
- ❌ Неправильное отображение в полноэкранном режиме

### После исправления:
- ✅ Модальное окно учитывает кнопки управления Telegram
- ✅ Контент не перекрывается кнопками управления
- ✅ Правильное отображение в полноэкранном режиме
- ✅ Динамическое определение высоты кнопок
- ✅ Адаптивность для мобильных устройств

## Технические детали

### CSS Custom Properties
```css
:root {
    --tg-controls-height: 44px; /* Стандартная высота кнопок */
}
```

### Динамическое обновление
```css
.news-modal {
    padding-top: calc(1rem + var(--safe-area-top) + var(--tg-controls-height));
}
```

### Telegram WebApp API
```javascript
const webApp = window.Telegram.WebApp;
const viewportHeight = webApp.viewportHeight;
const viewportStableHeight = webApp.viewportStableHeight;
const controlsHeight = viewportHeight - viewportStableHeight;
```

### Структура элементов
- **`position: fixed`** - фиксированное позиционирование
- **`top: 0`** - прикрепление к верхнему краю
- **`padding-top: calc(1rem + var(--safe-area-top) + var(--tg-controls-height))`** - отступ с учетом safe area и кнопок управления
- **`backdrop-filter: blur(4px)`** - размытие фона

### Адаптивность
- Автоматическое определение высоты кнопок управления
- Разные отступы для десктопа и мобильных устройств
- Поддержка всех режимов Telegram WebApp
- Совместимость с iOS и Android устройствами

## Файлы

- `app/templates/index.html` - обновлены CSS стили и добавлен JavaScript код

Теперь модальное окно с полной статьей корректно отображается в Telegram мини-приложении с учетом кнопок управления!




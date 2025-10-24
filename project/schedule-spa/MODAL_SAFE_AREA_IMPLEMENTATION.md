# Добавление Safe Area для модального окна статьи

## Проблема

Модальное окно с полной статьей не учитывало безопасную зону (safe area) сверху, что могло привести к проблемам на устройствах с вырезами (notch) или динамическим островом.

**Проблемные стили:**
```css
.news-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 1rem; /* Без учета safe area */
    backdrop-filter: blur(4px);
}
```

## Решение

### 1. Обновлены CSS стили для модального окна

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
    padding-top: calc(1rem + var(--safe-area-top)); /* Safe area сверху */
    backdrop-filter: blur(4px);
}
```

### 2. Обновлены мобильные стили

```css
@media (max-width: 768px) {
    .news-modal {
        padding: 0.5rem;
        padding-top: calc(0.5rem + var(--safe-area-top)); /* Safe area для мобильных */
    }
}
```

## Результат

### До исправления:
- ❌ Модальное окно могло перекрывать вырез (notch)
- ❌ Контент мог быть скрыт под динамическим островом
- ❌ Неправильное отображение на устройствах с safe area

### После исправления:
- ✅ Модальное окно учитывает безопасную зону сверху
- ✅ Контент не перекрывается вырезами или динамическим островом
- ✅ Правильное отображение на всех устройствах
- ✅ Адаптивность для мобильных устройств

## Технические детали

### CSS Custom Properties
```css
:root {
    --safe-area-top: env(safe-area-inset-top, 0px);
}
```

### Safe Area Implementation
```css
.news-modal {
    padding-top: calc(1rem + var(--safe-area-top));
}
```

### Мобильная адаптация
```css
@media (max-width: 768px) {
    .news-modal {
        padding-top: calc(0.5rem + var(--safe-area-top));
    }
}
```

### Структура элементов
- **`position: fixed`** - фиксированное позиционирование
- **`top: 0`** - прикрепление к верхнему краю
- **`padding-top: calc(1rem + var(--safe-area-top))`** - отступ с учетом safe area
- **`backdrop-filter: blur(4px)`** - размытие фона

### Адаптивность
- Автоматическое определение safe area на разных устройствах
- Разные отступы для десктопа и мобильных устройств
- Поддержка всех современных браузеров
- Совместимость с iOS и Android устройствами

## Файлы

- `app/templates/index.html` - обновлены CSS стили для `.news-modal`

Теперь модальное окно с полной статьей корректно отображается на всех устройствах с учетом безопасной зоны!




# 📱 News Feature - Visual Guide

## User Interface Overview

This guide shows what users will see when using the News feature.

---

## 1. News Tab in Navigation

```
┌─────────────────────────────────────┐
│                                     │
│         [News Content Here]         │
│                                     │
│                                     │
│                                     │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  📅    📰    📚    🔔    ⚙️         │
│Schedule News  ДЗ  Notif Settings    │
│         ^^^^                        │
│      (Active Tab)                   │
└─────────────────────────────────────┘
```

**Icon:** `newspaper-variant-outline`
**Label:** "Новости"

---

## 2. News List Screen

```
┌─────────────────────────────────────┐
│  Новости                        [←] │
├─────────────────────────────────────┤
│  ▼ Pull to refresh...               │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ [Image]                       │ │
│  │                               │ │
│  │ 🏷️ МГУ        📅 20 окт 2025 │ │
│  │                               │ │
│  │ **Важное объявление...**      │ │
│  │                               │ │
│  │ Краткое описание новости      │ │
│  │ для предварительного...       │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ [Image]                       │ │
│  │                               │ │
│  │ 🏷️ Факультет  📅 19 окт 2025 │ │
│  │                               │ │
│  │ **Новости факультета**        │ │
│  │                               │ │
│  │ Еще одна интересная...        │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ ...more articles...           │ │
│  └───────────────────────────────┘ │
│                                     │
│  ⏳ Загрузка...                     │
│                                     │
└─────────────────────────────────────┘
```

### Components Visible:
- **Header:** "Новости"
- **Pull-to-refresh:** Drag down to refresh
- **News Cards:** Each showing:
  - Article image (if available)
  - Source badge (МГУ, Факультет, etc.)
  - Publication date
  - Title (bold)
  - Excerpt (preview text)
- **Footer:** Loading indicator when fetching more

---

## 3. News Card Detail

```
┌───────────────────────────────────────┐
│                                       │
│  [                                ]   │
│  [        Article Image           ]   │
│  [                                ]   │
│                                       │
│  ┌─────────────┐     📅 20 окт 2025  │
│  │  🏷️ МГУ    │                      │
│  └─────────────┘                      │
│                                       │
│  Заголовок новости                    │
│  на несколько строк                   │
│                                       │
│  Краткое описание статьи              │
│  показывается до 3 строк...           │
│                                       │
└───────────────────────────────────────┘
    ▲
    │
  Tap here to open detail view
```

**Visual Features:**
- **Image:** Full-width, 200px height
- **Source Chip:** Color-coded badge
  - МГУ → Primary color (blue)
  - Факультет → Secondary color (purple)
  - Университет → Tertiary color (orange)
  - Others → Outline color (gray)
- **Date:** Small, gray text
- **Title:** Bold, 16px, max 2 lines
- **Excerpt:** Regular, 14px, max 3 lines

---

## 4. Article Detail Screen

```
┌─────────────────────────────────────┐
│  ← Новость                      [⋮] │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐   │
│  │                             │   │
│  │      [Full Image]           │   │
│  │                             │   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
│  🏷️ МГУ          📅 20 октября     │
│                      2025, 14:30    │
│                                     │
│  Полный заголовок новости           │
│  может быть на несколько            │
│  строк                              │
│  ─────────────────────────────────  │
│                                     │
│  Полный текст новости со всеми      │
│  подробностями. Здесь отображается  │
│  весь контент статьи, который был   │
│  опубликован на сайте МГУ.          │
│                                     │
│  Текст может быть очень длинным     │
│  и содержать несколько абзацев.     │
│                                     │
│  Пользователь может скроллить       │
│  вниз, чтобы прочитать всю          │
│  статью полностью.                  │
│                                     │
│  [... more content ...]             │
│                                     │
│  ▼ Scroll to read more              │
│                                     │
└─────────────────────────────────────┘
```

**Visual Features:**
- **Back Button:** Top-left corner
- **Full Image:** 250px height, rounded corners
- **Source Chip:** Same color coding as list
- **Full Date:** Long format with time
- **Title:** Large, 20px, bold
- **Content:** Full article text, 16px
- **Scrollable:** Entire content is scrollable

---

## 5. Loading States

### Initial Load
```
┌─────────────────────────────────────┐
│  Новости                            │
├─────────────────────────────────────┤
│                                     │
│                                     │
│              ⏳                      │
│                                     │
│       Загрузка новостей...          │
│                                     │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

### Pull-to-Refresh
```
┌─────────────────────────────────────┐
│  Новости                            │
├─────────────────────────────────────┤
│           ⏳                         │
│      ▼ Обновление...                │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ [News Card]                   │ │
│  └───────────────────────────────┘ │
```

### Loading More (Footer)
```
│  ┌───────────────────────────────┐ │
│  │ [Last News Card]              │ │
│  └───────────────────────────────┘ │
│                                     │
│       ⏳  Загрузка...                │
│                                     │
└─────────────────────────────────────┘
```

---

## 6. Empty State

```
┌─────────────────────────────────────┐
│  Новости                            │
├─────────────────────────────────────┤
│                                     │
│                                     │
│              📰                      │
│                                     │
│      Новости не найдены             │
│                                     │
│    Потяните вниз, чтобы             │
│         обновить                    │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

---

## 7. Error State

```
┌─────────────────────────────────────┐
│  Новости                            │
├─────────────────────────────────────┤
│                                     │
│                                     │
│              ⚠️                      │
│                                     │
│    Ошибка загрузки новостей         │
│                                     │
│    Проверьте подключение к          │
│         интернету                   │
│                                     │
│    Потяните вниз, чтобы             │
│      попробовать снова              │
│                                     │
└─────────────────────────────────────┘
```

---

## 8. Color Coding System

### Source Badges

```
┌─────────────┐
│  🏷️ МГУ    │  ← Blue (Primary)
└─────────────┘

┌─────────────────┐
│  🏷️ Факультет  │  ← Purple (Secondary)
└─────────────────┘

┌────────────────────┐
│  🏷️ Университет   │  ← Orange (Tertiary)
└────────────────────┘

┌─────────────┐
│  🏷️ Другое │  ← Gray (Outline)
└─────────────┘
```

---

## 9. Interaction Flow

### Viewing News Article

```
Step 1: News List
┌─────────────────────┐
│  [News Card 1] ◄────┼── Tap here
│  [News Card 2]      │
│  [News Card 3]      │
└─────────────────────┘
         │
         ▼
Step 2: Navigation Animation
         │
         ▼
Step 3: Article Detail
┌─────────────────────┐
│  ← Back             │
│  [Full Article]     │
│  [Content...]       │
└─────────────────────┘
```

### Pagination Flow

```
Step 1: Scroll Down
┌─────────────────────┐
│  [News Card 1]      │
│  [News Card 2]      │
│  [News Card 3]      │ ◄── User scrolls
│  ▼ ▼ ▼             │     to bottom
└─────────────────────┘
         │
         ▼
Step 2: Trigger Load
         │
         ▼
Step 3: Loading State
┌─────────────────────┐
│  [News Card 3]      │
│  ⏳ Загрузка...     │
└─────────────────────┘
         │
         ▼
Step 4: New Content
┌─────────────────────┐
│  [News Card 3]      │
│  [News Card 4]      │ ◄── New cards
│  [News Card 5]      │     appended
└─────────────────────┘
```

---

## 10. Material Design Elements

### Card Elevation
```
┌─────────────────────────────────┐
│                                 │ ▒
│     News Card                   │ ▒  ← Shadow
│     (Elevated)                  │ ▒    Effect
│                                 │ ▒
└─────────────────────────────────┘ ▒
  ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒
```

### Rounded Corners
```
     ╭─────────────────────╮
     │                     │
     │   News Card         │
     │   (Rounded)         │
     │                     │
     ╰─────────────────────╯
```

### Touchable Feedback
```
Normal State:
┌─────────────────┐
│  News Card      │
└─────────────────┘

Pressed State:
┌─────────────────┐
│  News Card      │ ← Slightly darker
└─────────────────┘   (opacity: 0.7)
```

---

## 11. Typography

```
Title (List View):
  Font: System Bold
  Size: 16px
  Lines: Max 2
  Color: onSurface

Title (Detail View):
  Font: System Bold
  Size: 20px
  Lines: Unlimited
  Color: onSurface
  Line Height: 28px

Excerpt:
  Font: System Regular
  Size: 14px
  Lines: Max 3
  Color: onSurfaceVariant
  Line Height: 20px

Content:
  Font: System Regular
  Size: 16px
  Lines: Unlimited
  Color: onSurface
  Line Height: 24px

Date:
  Font: System Regular
  Size: 12px
  Color: onSurfaceVariant

Source Badge:
  Font: System Bold
  Size: 12px
  Color: onPrimary (white)
```

---

## 12. Animations

### Card Tap Animation
```
Frame 1 (0ms):
┌─────────────┐
│  Card       │ ← Normal
└─────────────┘

Frame 2 (50ms):
┌─────────────┐
│  Card       │ ← Scale: 0.98
└─────────────┘   Opacity: 0.7

Frame 3 (100ms):
┌─────────────┐
│  Card       │ ← Navigate to detail
└─────────────┘
```

### Pull-to-Refresh Animation
```
Pull Down:
  ↓ ↓ ↓
  ⏳ (Spinner appears)

Release:
  ⏳ (Spinner rotates)
  
Complete:
  ✓ (Brief check, then hide)
```

---

## 13. Accessibility Features

- **Large Touch Targets:** Cards are > 48px tall
- **Readable Text:** Minimum 14px font size
- **Color Contrast:** WCAG AA compliant
- **Screen Reader:** All images have alt text
- **Semantic HTML:** Proper heading hierarchy

---

## 14. Responsive Behavior

### Portrait Mode (Standard)
```
┌──────────────┐
│   [News]     │
│   [News]     │
│   [News]     │
└──────────────┘
```

### Landscape Mode
```
┌─────────────────────────────┐
│  [News]  [News]  [News]     │
└─────────────────────────────┘
```

---

This visual guide shows how the News feature appears to users. The UI follows Material Design principles for a beautiful, intuitive experience! 🎨📱





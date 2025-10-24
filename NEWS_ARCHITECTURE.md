# 🏗️ News Feature Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    MOBILE APP (React Native)                 │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐         ┌──────────────┐                  │
│  │  NewsScreen  │────────>│NewsDetailScreen│                │
│  │  (List View) │<────────│ (Detail View)  │                │
│  └──────┬───────┘         └───────────────┘                 │
│         │                                                     │
│         │ renders                                            │
│         ▼                                                     │
│  ┌──────────────┐                                            │
│  │  NewsCard    │  (Component)                               │
│  └──────────────┘                                            │
│         │                                                     │
│         │ dispatches actions                                 │
│         ▼                                                     │
│  ┌─────────────────────────────────────────┐                │
│  │         Redux Store (newsSlice)         │                │
│  ├─────────────────────────────────────────┤                │
│  │ • articles: NewsArticle[]               │                │
│  │ • pagination: {page, total, hasMore}    │                │
│  │ • loading: boolean                      │                │
│  │ • error: string | null                  │                │
│  └──────────────┬──────────────────────────┘                │
│                 │                                             │
│                 │ calls                                       │
│                 ▼                                             │
│  ┌─────────────────────────────────────────┐                │
│  │         API Client (newsApi.ts)         │                │
│  ├─────────────────────────────────────────┤                │
│  │ • getNews(page, limit)                  │                │
│  │ • getNewsDetail(id)                     │                │
│  └──────────────┬──────────────────────────┘                │
│                 │                                             │
└─────────────────┼─────────────────────────────────────────────┘
                  │
                  │ HTTP Request
                  │ GET /api/news?page=1&limit=20
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND (FastAPI)                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────────────┐                │
│  │      API Router (news_api.py)           │                │
│  ├─────────────────────────────────────────┤                │
│  │                                          │                │
│  │  GET /api/news/                         │                │
│  │  ├─ Returns: NewsListResponse           │                │
│  │  │  └─ {articles, pagination}           │                │
│  │                                          │                │
│  │  GET /api/news/{news_id}                │                │
│  │  ├─ Returns: NewsArticle                │                │
│  │  │  └─ {id, title, content, ...}        │                │
│  │                                          │                │
│  │  GET /api/news/detail?url=...           │                │
│  │  └─ Returns: NewsDetailResponse         │                │
│  │     └─ (Legacy web format)              │                │
│  └──────────────┬──────────────────────────┘                │
│                 │                                             │
│                 │ calls                                       │
│                 ▼                                             │
│  ┌─────────────────────────────────────────┐                │
│  │    News Parser (news_parser.py)         │                │
│  ├─────────────────────────────────────────┤                │
│  │ • get_latest_news(limit, page)          │                │
│  │ • get_news_detail(url)                  │                │
│  │ • search_news(query, limit)             │                │
│  └──────────────┬──────────────────────────┘                │
│                 │                                             │
│                 │ Cache (15 min TTL)                         │
│                 │                                             │
└─────────────────┼─────────────────────────────────────────────┘
                  │
                  │ HTTP Request
                  │ GET https://stud.spa.msu.ru/blog/
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│              MSU Blog Website (External)                     │
│         https://stud.spa.msu.ru/blog/                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

### 1. Loading News List

```
User                NewsScreen          Redux Store         API Client         Backend
  │                     │                    │                   │                 │
  │   Navigate to News  │                    │                   │                 │
  ├────────────────────>│                    │                   │                 │
  │                     │                    │                   │                 │
  │                     │  setLoading(true)  │                   │                 │
  │                     ├───────────────────>│                   │                 │
  │                     │                    │                   │                 │
  │                     │   getNews(1, 20)   │                   │                 │
  │                     ├────────────────────┼──────────────────>│                 │
  │                     │                    │                   │                 │
  │                     │                    │       GET /api/news?page=1&limit=20 │
  │                     │                    │                   ├────────────────>│
  │                     │                    │                   │                 │
  │                     │                    │                   │  {articles, ... }
  │                     │                    │                   │<────────────────┤
  │                     │                    │                   │                 │
  │                     │<───────────────────┴───────────────────┤                 │
  │                     │                    │                   │                 │
  │                     │  setArticles(...)  │                   │                 │
  │                     ├───────────────────>│                   │                 │
  │                     │                    │                   │                 │
  │                     │ setPagination(...) │                   │                 │
  │                     ├───────────────────>│                   │                 │
  │                     │                    │                   │                 │
  │                     │ setLoading(false)  │                   │                 │
  │                     ├───────────────────>│                   │                 │
  │                     │                    │                   │                 │
  │   Display Articles  │                    │                   │                 │
  │<────────────────────┤                    │                   │                 │
  │                     │                    │                   │                 │
```

### 2. Pagination (Infinite Scroll)

```
User                NewsScreen          Redux Store         API Client         Backend
  │                     │                    │                   │                 │
  │  Scroll to Bottom   │                    │                   │                 │
  ├────────────────────>│                    │                   │                 │
  │                     │                    │                   │                 │
  │                     │   getNews(2, 20)   │                   │                 │
  │                     ├────────────────────┼──────────────────>│                 │
  │                     │                    │                   │                 │
  │                     │                    │       GET /api/news?page=2&limit=20 │
  │                     │                    │                   ├────────────────>│
  │                     │                    │                   │                 │
  │                     │                    │                   │  {articles, ... }
  │                     │                    │                   │<────────────────┤
  │                     │                    │                   │                 │
  │                     │  addArticles(...)  │                   │                 │
  │                     ├───────────────────>│                   │                 │
  │                     │                    │                   │                 │
  │ Append New Articles │                    │                   │                 │
  │<────────────────────┤                    │                   │                 │
  │                     │                    │                   │                 │
```

### 3. View Article Detail

```
User                NewsScreen      NewsDetailScreen     Navigation
  │                     │                  │                 │
  │  Tap Article Card   │                  │                 │
  ├────────────────────>│                  │                 │
  │                     │                  │                 │
  │                     │  navigate('NewsDetail', {article}) │
  │                     ├──────────────────┼────────────────>│
  │                     │                  │                 │
  │                     │                  │<────────────────┤
  │                     │                  │                 │
  │                     │                  │ Display Article │
  │<────────────────────┴──────────────────┤                 │
  │                                        │                 │
```

---

## Component Hierarchy

```
App.tsx
  └─ AppProvider (Redux, Theme)
      └─ AppNavigator
          └─ TabNavigator
              ├─ ScheduleTab
              ├─ NewsTab ──────────────────┐
              ├─ HomeworkTab               │
              ├─ NotificationsTab          │
              └─ SettingsTab               │
                                           │
          RootNavigator                    │
              ├─ Main (Tabs)               │
              ├─ AdminDashboard            │
              ├─ NewsDetail ───────────┐   │
              └─ HomeworkDetail        │   │
                                       │   │
                                       │   │
              NewsScreen <─────────────┘   │
                │                          │
                ├─ FlatList                │
                │   └─ NewsCard (multiple) │
                │                          │
                └─ RefreshControl          │
                                           │
              NewsDetailScreen <───────────┘
                │
                └─ ScrollView
                    ├─ Image
                    ├─ Chip (source)
                    ├─ Text (title)
                    └─ Text (content)
```

---

## State Management Flow

```
┌─────────────────────────────────────────────────────────┐
│                    Redux Store                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  newsSlice:                                             │
│  {                                                      │
│    articles: [                                          │
│      {                                                  │
│        id: 123456,                                      │
│        title: "News Title",                             │
│        excerpt: "Brief...",                             │
│        content: "Full text...",                         │
│        image_url: "https://...",                        │
│        published_at: "2025-10-22",                      │
│        source: "МГУ"                                    │
│      },                                                 │
│      ...                                                │
│    ],                                                   │
│    pagination: {                                        │
│      page: 1,                                           │
│      total: 50,                                         │
│      hasMore: true                                      │
│    },                                                   │
│    loading: false,                                      │
│    error: null                                          │
│  }                                                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
         │
         │ useSelector
         ▼
┌─────────────────────────────────────────────────────────┐
│                  NewsScreen Component                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  const { articles, pagination, loading, error }         │
│    = useSelector((state) => state.news);                │
│                                                         │
│  useEffect(() => {                                      │
│    loadNews(true);  // Initial load                     │
│  }, []);                                                │
│                                                         │
│  const loadNews = async (isRefresh) => {                │
│    dispatch(setLoading(true));                          │
│    const response = await getNews(page, 20);            │
│    dispatch(setArticles(response.articles));            │
│    dispatch(setPagination(response.pagination));        │
│    dispatch(setLoading(false));                         │
│  }                                                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## API Contract

### Request Format

```http
GET /api/news?page=1&limit=20
Authorization: Bearer {token}
```

### Response Format

```json
{
  "articles": [
    {
      "id": 123456,
      "title": "Новость о МГУ",
      "excerpt": "Краткое описание новости для превью...",
      "content": "Полный текст новости со всеми деталями...",
      "image_url": "https://stud.spa.msu.ru/blog/image.jpg",
      "published_at": "2025-10-22T12:00:00",
      "source": "МГУ"
    }
  ],
  "pagination": {
    "page": 1,
    "total": 50,
    "hasMore": true
  }
}
```

---

## Caching Strategy

```
┌──────────────────────────────────────────────────────────┐
│                   Backend Cache                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  _news_cache = {                                         │
│    "news_mobile_page_1_limit_20": {                      │
│      "articles": [...],                                  │
│      "pagination": {...},                                │
│      "cached_at": "2025-10-22T12:00:00"                  │
│    },                                                    │
│    "news_mobile_page_2_limit_20": {...},                 │
│    ...                                                   │
│  }                                                       │
│                                                          │
│  CACHE_DURATION = 15 minutes                             │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Cache Benefits:**
- Reduces load on external MSU blog server
- Faster response times (< 500ms for cached)
- Handles burst traffic efficiently
- Automatic expiration after 15 minutes

---

## Error Handling Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Network   │────>│  API Error  │────>│   Redux     │
│   Request   │     │   Handler   │     │   State     │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                    │
                           │                    │
                           ▼                    ▼
                    ┌─────────────┐     ┌─────────────┐
                    │   Console   │     │  UI Error   │
                    │    Log      │     │   Message   │
                    └─────────────┘     └─────────────┘
```

**Error Types:**
1. **Network Error** - No internet connection
2. **404 Error** - News not found
3. **500 Error** - Server error
4. **Timeout** - Request took too long
5. **Parse Error** - Invalid response format

---

## Performance Optimizations

### Frontend:
- **FlatList** - Only renders visible items
- **Image lazy loading** - Images load on demand
- **Redux** - Centralized state prevents prop drilling
- **Pagination** - Load data in chunks
- **Pull-to-refresh** - Manual refresh control

### Backend:
- **Caching** - 15-minute TTL reduces external requests
- **Pagination** - Limit results per page
- **Async** - Non-blocking I/O operations
- **Connection pooling** - Reuse HTTP connections

---

## Security

### Backend:
- **Optional Auth** - `get_current_user` dependency
- **Input Validation** - Pydantic models validate requests
- **Rate Limiting** - (Can be added) Prevent abuse
- **CORS** - Configure allowed origins

### Frontend:
- **Token Storage** - Secure storage in AsyncStorage
- **HTTPS** - All API calls use HTTPS
- **Input Sanitization** - HTML tags stripped from content

---

This architecture provides a scalable, performant, and maintainable News feature for your MSU Schedule mobile app! 🚀





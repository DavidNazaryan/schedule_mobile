# 🧪 Testing the News Feature

## Quick Start

Follow these steps to test the restored News feature:

---

## 1️⃣ Start the Backend

```bash
cd schedule-app/project/schedule-spa
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Expected output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

---

## 2️⃣ Test Backend API (Optional)

### Test in browser or with curl:

**Get news list:**
```bash
curl http://localhost:8000/api/news?page=1&limit=5
```

**Expected response:**
```json
{
  "articles": [
    {
      "id": 123456,
      "title": "Sample News Title",
      "excerpt": "Brief description...",
      "content": "Full content...",
      "image_url": "https://...",
      "published_at": "2025-10-20",
      "source": "МГУ"
    }
  ],
  "pagination": {
    "page": 1,
    "total": 20,
    "hasMore": true
  }
}
```

**Get single article:**
```bash
curl http://localhost:8000/api/news/{news_id}
```

---

## 3️⃣ Start the Mobile App

```bash
cd schedule-app
npm start
```

Or for specific platforms:
```bash
npm run ios      # iOS
npm run android  # Android
npm run web      # Web
```

---

## 4️⃣ Test in the App

### ✅ Checklist:

- [ ] **Navigate to News Tab**
  - Tap "Новости" in the bottom navigation
  - News list should load

- [ ] **View News List**
  - See news cards with titles, excerpts, images
  - Source badges should be visible
  - Dates should be formatted in Russian

- [ ] **Pull to Refresh**
  - Pull down on the news list
  - Loading spinner should appear
  - News should refresh

- [ ] **Infinite Scroll**
  - Scroll to the bottom
  - More news should load automatically
  - "Загрузка..." should appear at bottom

- [ ] **View Article Detail**
  - Tap on any news card
  - Should navigate to detail screen
  - Full content, image, date, and source should display

- [ ] **Navigation**
  - Tap back button
  - Should return to news list
  - Scroll position should be maintained

- [ ] **Error Handling**
  - Stop backend server
  - Try refreshing news
  - Error message should display

---

## 5️⃣ Common Test Scenarios

### Scenario 1: First Time Load
1. Open app
2. Navigate to News tab
3. Verify: Loading spinner appears
4. Verify: News articles load
5. Verify: Images display correctly

### Scenario 2: Pagination
1. Go to News tab
2. Scroll to bottom
3. Verify: "Загрузка..." appears
4. Verify: More articles load
5. Scroll to bottom again
6. Repeat until no more articles

### Scenario 3: Refresh
1. Go to News tab
2. Pull down from top
3. Verify: Refresh spinner appears
4. Verify: News refreshes
5. Verify: New articles appear (if any)

### Scenario 4: Article Detail
1. Tap any news article
2. Verify: Navigation happens smoothly
3. Verify: Full content displays
4. Verify: Images load
5. Verify: Source badge shows correct category
6. Tap back
7. Verify: Returns to same position in list

### Scenario 5: Empty State
1. Modify backend to return empty array
2. Refresh news
3. Verify: "Новости не найдены" message displays

### Scenario 6: Network Error
1. Stop backend server
2. Pull to refresh
3. Verify: Error message displays
4. Start backend
5. Refresh again
6. Verify: News loads successfully

---

## 🔍 Debug Mode

### Check Redux State:
Install Redux DevTools in your app to inspect:
- `state.news.articles` - Array of news articles
- `state.news.pagination` - Pagination info
- `state.news.loading` - Loading state
- `state.news.error` - Error messages

### Backend Logs:
Watch backend console for:
```
Ошибка при получении списка новостей: ...
```

### Network Requests:
Use React Native Debugger to inspect:
- Request URL: `{API_BASE_URL}/api/news?page=1&limit=20`
- Response status: 200
- Response body structure

---

## 📊 Performance Checks

### Backend Performance:
- First load: Should complete in < 3 seconds
- Cached load: Should complete in < 500ms
- Cache duration: 15 minutes

### Frontend Performance:
- List rendering: Should be smooth (60fps)
- Image loading: Should use lazy loading
- Pagination: Should load seamlessly

---

## ✅ Success Criteria

The News feature is working correctly if:

1. ✅ News list loads on first visit
2. ✅ Pull-to-refresh updates the list
3. ✅ Infinite scroll loads more articles
4. ✅ Article details open when tapped
5. ✅ Images display correctly
6. ✅ No console errors
7. ✅ Smooth navigation
8. ✅ Proper error handling
9. ✅ Loading states work
10. ✅ Russian locale formatting

---

## 🐛 Known Issues & Solutions

### Issue: "Network Error"
**Cause:** Backend not running or wrong API URL
**Solution:** 
1. Start backend server
2. Check `src/config/index.ts` for correct `API_BASE_URL`

### Issue: "Новость не найдена"
**Cause:** News parser can't reach blog site
**Solution:** 
1. Check internet connection
2. Verify https://stud.spa.msu.ru/blog/ is accessible

### Issue: Images not loading
**Cause:** CORS or invalid image URLs
**Solution:** 
1. Check image URLs in API response
2. Verify images are accessible from mobile app

### Issue: Slow loading
**Cause:** Backend fetching from remote source
**Solution:** 
1. Wait for cache to populate (first load is slower)
2. Subsequent loads use 15-minute cache

---

## 📞 Need Help?

If issues persist:
1. Check `NEWS_FEATURE_RESTORATION.md` for detailed documentation
2. Review backend logs in terminal
3. Check mobile app console for errors
4. Verify API response format matches expected schema

---

**Happy Testing! 🎉**





# 🔧 Отладка авторизации в Telegram Mini App

## 🚨 Проблема
Приложение показывает окно "Войти через Telegram", но после входа не отображает пользователя и его роль.

## 🔍 Диагностика

### 1. **Откройте консоль браузера (F12)**
Проверьте логи инициализации:
```
Инициализация AuthManager...
window.Telegram: [object Object]
window.Telegram.WebApp: [object Object]
initData: user=%7B%22id%22%3A123456789...
isInTelegram: true
WebApp запущен в Telegram, выполняем аутентификацию...
```

### 2. **Проверьте процесс аутентификации**
```
authenticateWithTelegram вызвана
initData для отправки: user=%7B%22id%22%3A123456789...
Отправляем запрос на аутентификацию...
Ответ сервера: 200
Результат аутентификации: {success: true, user: {...}}
```

### 3. **Проверьте обновление UI**
```
Аутентификация успешна: {id: 123456789, first_name: "Иван", ...}
updateUI вызвана, currentUser: {id: 123456789, first_name: "Иван", ...}
userInfo элемент: <div id="user-info" class="user-info-settings">
Обновляем информацию о пользователе
Информация о пользователе обновлена
```

## 🛠️ Решения

### **Решение 1: Принудительный показ окна входа**
1. Перейдите в **Настройки**
2. Нажмите **"Показать окно входа"**
3. Выберите **"Тестовый режим студента"** или **"Режим администратора"**

### **Решение 2: Очистка localStorage**
```javascript
// В консоли браузера
localStorage.removeItem('test_user');
location.reload();
```

### **Решение 3: Проверка сервера**
Убедитесь, что сервер запущен:
```bash
python app/main.py
```

### **Решение 4: Проверка API эндпоинта**
Откройте в браузере:
```
http://localhost:8000/api/auth/telegram
```

## 🔧 Отладочные функции

### **В консоли браузера доступны:**
```javascript
// Проверить текущего пользователя
console.log(authManager.currentUser);

// Проверить права доступа
console.log(authManager.permissions);

// Принудительно показать окно входа
authManager.forceShowAuthModal();

// Переключиться в тестовый режим
authManager.testMode();
authManager.testAdminMode();

// Проверить данные Telegram
console.log(window.Telegram?.WebApp?.initData);
```

## 📊 Возможные причины проблемы

### **1. initData пустой или неверный**
- Проверьте: `window.Telegram?.WebApp?.initData`
- Должен содержать данные пользователя

### **2. Ошибка сервера**
- Проверьте статус ответа: `Ответ сервера: 200`
- Проверьте результат: `Результат аутентификации`

### **3. Проблема с обновлением UI**
- Проверьте: `updateUI вызвана`
- Проверьте: `userInfo элемент` не null

### **4. Проблема с правами доступа**
- Проверьте: `permissions` объект
- Проверьте: `updatePermissionBasedUI` вызвана

## 🎯 Пошаговая диагностика

### **Шаг 1: Проверка инициализации**
```javascript
console.log('AuthManager инициализирован:', !!authManager);
console.log('Текущий пользователь:', authManager.currentUser);
```

### **Шаг 2: Проверка Telegram данных**
```javascript
console.log('Telegram WebApp:', !!window.Telegram?.WebApp);
console.log('initData:', window.Telegram?.WebApp?.initData);
```

### **Шаг 3: Проверка API запроса**
```javascript
// В Network tab браузера проверьте запрос к /api/auth/telegram
// Должен быть POST запрос с initData
```

### **Шаг 4: Проверка ответа сервера**
```javascript
// Проверьте Response в Network tab
// Должен содержать: {"success": true, "user": {...}}
```

## 🚀 Быстрое решение

Если ничего не помогает:

1. **Очистите localStorage:**
   ```javascript
   localStorage.clear();
   ```

2. **Перезагрузите страницу:**
   ```javascript
   location.reload();
   ```

3. **Используйте тестовый режим:**
   - Перейдите в Настройки
   - Нажмите "Тестовый режим студента"

## 📞 Поддержка

Если проблема не решается:
1. Скопируйте логи из консоли
2. Проверьте Network tab на наличие ошибок
3. Убедитесь, что сервер запущен и доступен
4. Попробуйте тестовый режим как временное решение

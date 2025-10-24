// Конфигурация приложения MSU Schedule
export const CONFIG = {
  // Telegram Bot Configuration
  TELEGRAM_BOT_TOKEN: '8296584992:AAFmltay1-OZolKK0AoF8pdKF2kELfg4boA',
  TELEGRAM_BOT_USERNAME: 'MSUScheduleBot', // Обновите на реальное имя бота
  
  // API Configuration
  API_BASE_URL: 'https://vm-fc7b7f29.na4u.ru',
  
  // Deep Links Configuration
  DEEP_LINK_SCHEME: 'msu-schedule',
  
  // App Configuration
  APP_NAME: 'Расписание МГУ',
  APP_VERSION: '2.0.0',
  
  // Cache Configuration
  CACHE_TTL: {
    SCHEDULE: 300000, // 5 минут
    NEWS: 600000, // 10 минут
    HOMEWORK: 300000, // 5 минут
    NOTIFICATIONS: 180000, // 3 минуты
  },
  
  // Notification Configuration
  NOTIFICATION_CHANNEL_ID: 'msu-schedule',
  
  // Development Configuration
  IS_DEVELOPMENT: __DEV__,
  
  // URLs
  TELEGRAM_WEBAPP_URL: 'https://t.me/MSUScheduleBot',
  TELEGRAM_APP_URL: 'tg://resolve?domain=MSUScheduleBot',
  
  // API Endpoints
  ENDPOINTS: {
    AUTH_TELEGRAM: '/api/auth/telegram',
    USER_PROFILE: '/api/user/profile',
    SCHEDULE: '/api/schedule',
    NEWS: '/api/news',
    HOMEWORK: '/api/schedule/homework',
    NOTIFICATIONS: '/api/notifications',
    ADMIN_STATS: '/api/admin/stats',
  },
} as const;

// Типы для конфигурации
export type Config = typeof CONFIG;



const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL ?? 'https://vm-fc7b7f29.na4u.ru';
const telegramBotUsername =
  process.env.EXPO_PUBLIC_TELEGRAM_BOT_USERNAME ?? 'MSUScheduleBot';
const telegramWebAppUrl =
  process.env.EXPO_PUBLIC_TELEGRAM_WEBAPP_URL ?? 'https://t.me/MSUScheduleBot';

export const CONFIG = {
  TELEGRAM_BOT_TOKEN:
    process.env.EXPO_PUBLIC_TELEGRAM_BOT_TOKEN ?? '8296584992:AAFmltay1-OZolKK0AoF8pdKF2kELfg4boA',
  TELEGRAM_BOT_USERNAME: telegramBotUsername,
  API_BASE_URL: apiBaseUrl,
  DEEP_LINK_SCHEME: 'msu-schedule',
  APP_NAME: 'Расписание МГУ',
  APP_VERSION: '2.0.0',
  CACHE_TTL: {
    SCHEDULE: 300000,
    NEWS: 600000,
    HOMEWORK: 300000,
    NOTIFICATIONS: 180000,
  },
  NOTIFICATION_CHANNEL_ID: 'msu-schedule',
  IS_DEVELOPMENT: __DEV__,
  TELEGRAM_WEBAPP_URL: telegramWebAppUrl,
  TELEGRAM_APP_URL: `tg://resolve?domain=${telegramBotUsername}`,
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

export type Config = typeof CONFIG;

import apiClient from './apiClient';
import {
  NewsArticle,
  NotificationHistoryListResponse,
  NotificationSettings,
  NotificationSettingsRequest,
  SendNotificationRequest,
  SendNotificationResponse,
} from '@/types';
import NewsParser from '../services/NewsParser';

// Получение новостей с пагинацией (локальный парсинг)
export const getNews = async (page: number = 1, limit: number = 20): Promise<{
  articles: NewsArticle[];
  pagination: {
    page: number;
    total: number;
    hasMore: boolean;
  };
}> => {
  try {
    const result = await NewsParser.fetchNews(page, limit);
    
    return {
      articles: result.articles,
      pagination: {
        page,
        total: result.articles.length * page + (result.hasMore ? 1 : 0),
        hasMore: result.hasMore,
      },
    };
  } catch (error) {
    console.error('Error fetching news:', error);
    throw new Error('Не удалось загрузить новости');
  }
};

// Получение детальной новости
export const getNewsDetail = async (id: number): Promise<NewsArticle> => {
  // Note: For client-side parsing, we don't have a direct ID -> article mapping
  // The detail view should use the article data passed from the list view
  // This is kept for compatibility but should not be called in normal flow
  throw new Error('Use article data from list view instead of fetching by ID');
};

// Получение настроек уведомлений
export const getNotificationSettings = async (): Promise<NotificationSettings> => {
  return apiClient.get<NotificationSettings>('/api/notifications/settings');
};

// Обновление настроек уведомлений
export const updateNotificationSettings = async (
  settings: NotificationSettingsRequest
): Promise<NotificationSettings> => {
  return apiClient.put<NotificationSettings>('/api/notifications/settings', settings);
};

// Получение истории уведомлений
export const getNotificationHistory = async (
  limit: number = 50,
  offset: number = 0
): Promise<NotificationHistoryListResponse> => {
  return apiClient.get<NotificationHistoryListResponse>(
    `/api/notifications/history?limit=${limit}&offset=${offset}`
  );
};

// Отправка уведомления (для админов)
export const sendNotification = async (
  request: SendNotificationRequest
): Promise<SendNotificationResponse> => {
  return apiClient.post<SendNotificationResponse>('/api/admin/notifications/send', request);
};

// Отметить уведомление как прочитанное
export const markNotificationAsRead = async (notificationId: number): Promise<{ success: boolean }> => {
  return apiClient.patch<{ success: boolean }>(`/api/notifications/${notificationId}/read`);
};

// Отметить все уведомления как прочитанные
export const markAllNotificationsAsRead = async (): Promise<{ success: boolean }> => {
  return apiClient.patch<{ success: boolean }>('/api/notifications/read-all');
};



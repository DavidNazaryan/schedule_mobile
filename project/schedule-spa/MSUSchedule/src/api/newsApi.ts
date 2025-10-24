import apiClient from './apiClient';
import { 
  NewsArticle, 
  NotificationItem, 
  NotificationSettings,
  NotificationSettingsRequest,
  SendNotificationRequest,
  SendNotificationResponse
} from '../types';

// Получение новостей с пагинацией
export const getNews = async (page: number = 1, limit: number = 20): Promise<{
  articles: NewsArticle[];
  pagination: {
    page: number;
    total: number;
    hasMore: boolean;
  };
}> => {
  return apiClient.get<{
    articles: NewsArticle[];
    pagination: {
      page: number;
      total: number;
      hasMore: boolean;
    };
  }>(`/api/news?page=${page}&limit=${limit}`);
};

// Получение детальной новости
export const getNewsDetail = async (id: number): Promise<NewsArticle> => {
  return apiClient.get<NewsArticle>(`/api/news/${id}`);
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
): Promise<{
  notifications: NotificationItem[];
  total: number;
  unread_count: number;
}> => {
  return apiClient.get<{
    notifications: NotificationItem[];
    total: number;
    unread_count: number;
  }>(`/api/notifications/history?limit=${limit}&offset=${offset}`);
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



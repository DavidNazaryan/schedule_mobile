import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Настройка уведомлений
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface NotificationData {
  id: string;
  title: string;
  body: string;
  date: Date;
}

export class NotificationService {
  static async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Разрешение на уведомления не предоставлено');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Ошибка при запросе разрешений:', error);
      return false;
    }
  }

  static async scheduleNotification(
    title: string,
    body: string,
    date: Date,
    identifier?: string
  ): Promise<string> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: 'default',
        },
        trigger: {
          date,
        },
      });
      
      return notificationId;
    } catch (error) {
      console.error('Ошибка при создании уведомления:', error);
      throw error;
    }
  }

  static async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Ошибка при отмене уведомления:', error);
    }
  }

  static async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Ошибка при отмене всех уведомлений:', error);
    }
  }

  static async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Ошибка при получении уведомлений:', error);
      return [];
    }
  }

  static async createEventReminder(
    eventTitle: string,
    eventDate: string,
    eventTime: string,
    reminderMinutes: number = 15
  ): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      const eventDateTime = new Date(`${eventDate}T${eventTime || '09:00'}`);
      const reminderDate = new Date(eventDateTime.getTime() - reminderMinutes * 60 * 1000);
      
      // Проверяем, что напоминание в будущем
      if (reminderDate <= new Date()) {
        console.log('Напоминание должно быть в будущем');
        return null;
      }

      const notificationId = await this.scheduleNotification(
        `Напоминание: ${eventTitle}`,
        `Событие "${eventTitle}" начнется через ${reminderMinutes} минут`,
        reminderDate,
        `event_${eventTitle}_${eventDate}_${eventTime}`
      );

      return notificationId;
    } catch (error) {
      console.error('Ошибка при создании напоминания:', error);
      return null;
    }
  }
}


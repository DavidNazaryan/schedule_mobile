import notifee, { AndroidImportance, AndroidVisibility } from '@notifee/react-native';
import { Platform, Alert } from 'react-native';
import { NotificationType } from '../types';

class NotificationService {
  private static instance: NotificationService;
  private fcmToken: string | null = null;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Инициализация сервиса уведомлений
  async initialize(): Promise<void> {
    try {
      // Запрос разрешений
      await this.requestPermissions();
      
      // Создание канала уведомлений для Android
      if (Platform.OS === 'android') {
        await this.createNotificationChannel();
      }
      
      // Регистрация для получения токена FCM
      await this.registerForPushNotifications();
      
      console.log('NotificationService initialized successfully');
    } catch (error) {
      console.error('Error initializing NotificationService:', error);
    }
  }

  // Запрос разрешений на уведомления
  private async requestPermissions(): Promise<void> {
    try {
      const settings = await notifee.requestPermission();
      
      if (settings.authorizationStatus === 0) {
        Alert.alert(
          'Разрешения',
          'Для получения уведомлений необходимо разрешить их отправку в настройках приложения'
        );
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
    }
  }

  // Создание канала уведомлений для Android
  private async createNotificationChannel(): Promise<void> {
    try {
      await notifee.createChannel({
        id: 'msu-schedule',
        name: 'Расписание МГУ',
        importance: AndroidImportance.HIGH,
        visibility: AndroidVisibility.PUBLIC,
        sound: 'default',
        vibration: true,
      });
    } catch (error) {
      console.error('Error creating notification channel:', error);
    }
  }

  // Регистрация для push уведомлений
  private async registerForPushNotifications(): Promise<void> {
    try {
      // Здесь можно интегрировать с Firebase Cloud Messaging
      // Для простоты используем локальные уведомления
      console.log('Registered for push notifications');
    } catch (error) {
      console.error('Error registering for push notifications:', error);
    }
  }

  // Отправка локального уведомления
  async sendLocalNotification(
    title: string,
    body: string,
    data?: any,
    type?: NotificationType
  ): Promise<void> {
    try {
      const notificationId = Date.now().toString();
      
      await notifee.displayNotification({
        id: notificationId,
        title,
        body,
        data: {
          ...data,
          type: type || 'system_announcement',
        },
        android: {
          channelId: 'msu-schedule',
          importance: AndroidImportance.HIGH,
          visibility: AndroidVisibility.PUBLIC,
          pressAction: {
            id: 'default',
          },
        },
      });
      
      console.log('Local notification sent:', title);
    } catch (error) {
      console.error('Error sending local notification:', error);
    }
  }

  // Отправка уведомления о домашнем задании
  async sendHomeworkNotification(
    lessonTitle: string,
    homeworkText: string,
    groupName: string
  ): Promise<void> {
    await this.sendLocalNotification(
      'Новое домашнее задание',
      `${lessonTitle}: ${homeworkText}`,
      {
        lessonTitle,
        homeworkText,
        groupName,
      },
      NotificationType.HOMEWORK_ASSIGNED
    );
  }

  // Отправка уведомления об изменении расписания
  async sendScheduleChangeNotification(
    groupName: string,
    changes: string
  ): Promise<void> {
    await this.sendLocalNotification(
      'Изменения в расписании',
      `Группа ${groupName}: ${changes}`,
      {
        groupName,
        changes,
      },
      NotificationType.SCHEDULE_CHANGED
    );
  }

  // Отправка системного уведомления
  async sendSystemNotification(
    title: string,
    message: string
  ): Promise<void> {
    await this.sendLocalNotification(
      title,
      message,
      {},
      NotificationType.SYSTEM_ANNOUNCEMENT
    );
  }

  // Отправка напоминания
  async sendReminderNotification(
    title: string,
    message: string,
    reminderData?: any
  ): Promise<void> {
    await this.sendLocalNotification(
      title,
      message,
      reminderData,
      NotificationType.REMINDER
    );
  }

  // Планирование уведомления на определенное время
  async scheduleNotification(
    title: string,
    body: string,
    triggerDate: Date,
    data?: any
  ): Promise<void> {
    try {
      const notificationId = Date.now().toString();
      
      await notifee.createTriggerNotification(
        {
          id: notificationId,
          title,
          body,
          data,
          android: {
            channelId: 'msu-schedule',
            importance: AndroidImportance.HIGH,
          },
        },
        {
          type: 0, // TIMESTAMP
          timestamp: triggerDate.getTime(),
        }
      );
      
      console.log('Scheduled notification:', title, 'for', triggerDate);
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  }

  // Отмена всех уведомлений
  async cancelAllNotifications(): Promise<void> {
    try {
      await notifee.cancelAllNotifications();
      console.log('All notifications cancelled');
    } catch (error) {
      console.error('Error cancelling notifications:', error);
    }
  }

  // Отмена конкретного уведомления
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await notifee.cancelNotification(notificationId);
      console.log('Notification cancelled:', notificationId);
    } catch (error) {
      console.error('Error cancelling notification:', error);
    }
  }

  // Получение количества активных уведомлений
  async getActiveNotificationsCount(): Promise<number> {
    try {
      const notifications = await notifee.getDisplayedNotifications();
      return notifications.length;
    } catch (error) {
      console.error('Error getting notifications count:', error);
      return 0;
    }
  }

  // Обработка нажатия на уведомление
  async handleNotificationPress(notificationId: string, data?: any): Promise<void> {
    try {
      console.log('Notification pressed:', notificationId, data);
      
      // Здесь можно добавить логику навигации на основе данных уведомления
      if (data?.type === NotificationType.HOMEWORK_ASSIGNED) {
        // Навигация к экрану домашних заданий
      } else if (data?.type === NotificationType.SCHEDULE_CHANGED) {
        // Навигация к экрану расписания
      }
      
      // Отметить уведомление как прочитанное
      await this.cancelNotification(notificationId);
    } catch (error) {
      console.error('Error handling notification press:', error);
    }
  }

  // Получение FCM токена (для интеграции с сервером)
  getFCMToken(): string | null {
    return this.fcmToken;
  }

  // Установка FCM токена
  setFCMToken(token: string): void {
    this.fcmToken = token;
  }
}

export default NotificationService.getInstance();



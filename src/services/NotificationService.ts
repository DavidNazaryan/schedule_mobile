import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Alert, Platform } from 'react-native';
import Constants from 'expo-constants';

import { NotificationType } from '@/types';
import { CONFIG } from '@/config';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class NotificationService {
  private static instance: NotificationService;

  private expoPushToken: string | null = null;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize(): Promise<void> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.warn('Notification permissions not granted');
        return;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync(CONFIG.NOTIFICATION_CHANNEL_ID, {
          name: 'MSU Schedule',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#1d4ed8',
        });
      }

      await this.registerExpoPushToken();
    } catch (error) {
      console.error('Failed to initialize notifications', error);
    }
  }

  private async requestPermissions(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      Alert.alert(
        'Нет доступа к уведомлениям',
        'Разрешите отправку уведомлений в настройках, чтобы получать оповещения.'
      );
      return false;
    }

    return true;
  }

  private async registerExpoPushToken(): Promise<void> {
    try {
      if (!Device.isDevice) {
        console.log('Expo push token is available only on real devices');
        return;
      }

      const projectId = this.getExpoProjectId();

      if (!projectId) {
        console.warn(
          'Expo projectId is not configured. Skipping push token registration to avoid runtime errors.'
        );
        return;
      }

      const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
      this.expoPushToken = tokenResponse.data;
      console.log('Expo push token', this.expoPushToken);
    } catch (error) {
      console.error('Failed to register Expo push token', error);
    }
  }

  async sendLocalNotification(
    title: string,
    body: string,
    data?: Record<string, unknown>,
    type: NotificationType = NotificationType.SYSTEM_ANNOUNCEMENT
  ): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: {
            ...data,
            type,
          },
          sound: 'default',
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Failed to send local notification', error);
    }
  }

  async scheduleNotification(
    title: string,
    body: string,
    triggerDate: Date,
    data?: Record<string, unknown>
  ): Promise<void> {
    try {
      const secondsUntilTrigger = Math.max(
        1,
        Math.floor((triggerDate.getTime() - Date.now()) / 1000)
      );

      const trigger: Notifications.TimeIntervalTriggerInput = {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: secondsUntilTrigger,
      };

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
        },
        trigger,
      });
    } catch (error) {
      console.error('Failed to schedule notification', error);
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Failed to cancel notifications', error);
    }
  }

  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Failed to cancel notification', error);
    }
  }

  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Failed to fetch scheduled notifications', error);
      return [];
    }
  }

  getExpoPushToken(): string | null {
    return this.expoPushToken;
  }

  private getExpoProjectId(): string | undefined {
    const easProjectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId ??
      Constants.expoConfig?.extra?.expoGo?.projectId ??
      Constants.manifest2?.extra?.expoGo?.projectId ??
      Constants.manifest?.extra?.expoGo?.projectId;

    return (
      easProjectId ?? process.env.EXPO_PUBLIC_PROJECT_ID ?? process.env.EXPO_PUBLIC_EAS_PROJECT_ID
    );
  }
}

export const notificationService = NotificationService.getInstance();
export default notificationService;

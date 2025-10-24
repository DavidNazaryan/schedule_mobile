import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { store } from '../store';
import { ScheduleItem, NewsArticle, HomeworkTask, NotificationItem } from '../types';

class OfflineService {
  private static instance: OfflineService;
  private isOnline: boolean = true;
  private offlineQueue: Array<{
    id: string;
    action: string;
    data: any;
    timestamp: number;
  }> = [];

  static getInstance(): OfflineService {
    if (!OfflineService.instance) {
      OfflineService.instance = new OfflineService();
    }
    return OfflineService.instance;
  }

  // Инициализация сервиса
  async initialize(): Promise<void> {
    // Слушаем изменения состояния сети
    NetInfo.addEventListener(state => {
      this.isOnline = state.isConnected ?? false;
      console.log('Network status changed:', this.isOnline ? 'Online' : 'Offline');
      
      if (this.isOnline) {
        this.processOfflineQueue();
      }
    });

    // Загружаем очередь офлайн действий
    await this.loadOfflineQueue();
    
    console.log('OfflineService initialized');
  }

  // Проверка состояния сети
  isConnected(): boolean {
    return this.isOnline;
  }

  // Добавление действия в очередь офлайн
  addToOfflineQueue(action: string, data: any): void {
    const queueItem = {
      id: Date.now().toString(),
      action,
      data,
      timestamp: Date.now(),
    };
    
    this.offlineQueue.push(queueItem);
    this.saveOfflineQueue();
    
    console.log('Added to offline queue:', action);
  }

  // Обработка очереди офлайн действий при восстановлении сети
  private async processOfflineQueue(): Promise<void> {
    if (this.offlineQueue.length === 0) return;
    
    console.log('Processing offline queue:', this.offlineQueue.length, 'items');
    
    const queueCopy = [...this.offlineQueue];
    this.offlineQueue = [];
    
    for (const item of queueCopy) {
      try {
        await this.processOfflineAction(item);
      } catch (error) {
        console.error('Error processing offline action:', error);
        // Возвращаем в очередь при ошибке
        this.offlineQueue.push(item);
      }
    }
    
    await this.saveOfflineQueue();
  }

  // Обработка конкретного офлайн действия
  private async processOfflineAction(item: {
    id: string;
    action: string;
    data: any;
    timestamp: number;
  }): Promise<void> {
    switch (item.action) {
      case 'ADD_HOMEWORK':
        // Здесь можно отправить ДЗ на сервер
        console.log('Processing offline homework:', item.data);
        break;
        
      case 'UPDATE_HOMEWORK':
        // Обновление ДЗ
        console.log('Processing offline homework update:', item.data);
        break;
        
      case 'DELETE_HOMEWORK':
        // Удаление ДЗ
        console.log('Processing offline homework deletion:', item.data);
        break;
        
      default:
        console.log('Unknown offline action:', item.action);
    }
  }

  // Сохранение очереди в AsyncStorage
  private async saveOfflineQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem('offline_queue', JSON.stringify(this.offlineQueue));
    } catch (error) {
      console.error('Error saving offline queue:', error);
    }
  }

  // Загрузка очереди из AsyncStorage
  private async loadOfflineQueue(): Promise<void> {
    try {
      const queueData = await AsyncStorage.getItem('offline_queue');
      if (queueData) {
        this.offlineQueue = JSON.parse(queueData);
        console.log('Loaded offline queue:', this.offlineQueue.length, 'items');
      }
    } catch (error) {
      console.error('Error loading offline queue:', error);
    }
  }

  // Кэширование данных
  async cacheData(key: string, data: any, ttl: number = 300000): Promise<void> {
    try {
      const cacheItem = {
        data,
        timestamp: Date.now(),
        ttl,
      };
      
      await AsyncStorage.setItem(`cache_${key}`, JSON.stringify(cacheItem));
      console.log('Cached data:', key);
    } catch (error) {
      console.error('Error caching data:', error);
    }
  }

  // Получение кэшированных данных
  async getCachedData(key: string): Promise<any | null> {
    try {
      const cacheData = await AsyncStorage.getItem(`cache_${key}`);
      if (!cacheData) return null;
      
      const cacheItem = JSON.parse(cacheData);
      const now = Date.now();
      
      // Проверяем TTL
      if (now - cacheItem.timestamp > cacheItem.ttl) {
        await AsyncStorage.removeItem(`cache_${key}`);
        return null;
      }
      
      return cacheItem.data;
    } catch (error) {
      console.error('Error getting cached data:', error);
      return null;
    }
  }

  // Кэширование расписания
  async cacheSchedule(groupId: string, schedule: ScheduleItem[]): Promise<void> {
    await this.cacheData(`schedule_${groupId}`, schedule, 300000); // 5 минут
  }

  // Получение кэшированного расписания
  async getCachedSchedule(groupId: string): Promise<ScheduleItem[] | null> {
    return await this.getCachedData(`schedule_${groupId}`);
  }

  // Кэширование новостей
  async cacheNews(news: NewsArticle[]): Promise<void> {
    await this.cacheData('news', news, 600000); // 10 минут
  }

  // Получение кэшированных новостей
  async getCachedNews(): Promise<NewsArticle[] | null> {
    return await this.getCachedData('news');
  }

  // Кэширование домашних заданий
  async cacheHomework(groupId: string, homework: HomeworkTask[]): Promise<void> {
    await this.cacheData(`homework_${groupId}`, homework, 300000); // 5 минут
  }

  // Получение кэшированных домашних заданий
  async getCachedHomework(groupId: string): Promise<HomeworkTask[] | null> {
    return await this.getCachedData(`homework_${groupId}`);
  }

  // Кэширование уведомлений
  async cacheNotifications(notifications: NotificationItem[]): Promise<void> {
    await this.cacheData('notifications', notifications, 180000); // 3 минуты
  }

  // Получение кэшированных уведомлений
  async getCachedNotifications(): Promise<NotificationItem[] | null> {
    return await this.getCachedData('notifications');
  }

  // Очистка кэша
  async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      await AsyncStorage.multiRemove(cacheKeys);
      console.log('Cache cleared');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  // Получение размера кэша
  async getCacheSize(): Promise<number> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      let totalSize = 0;
      
      for (const key of cacheKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          totalSize += data.length;
        }
      }
      
      return totalSize;
    } catch (error) {
      console.error('Error getting cache size:', error);
      return 0;
    }
  }

  // Стратегия загрузки данных (cache-first)
  async loadWithCacheFirst<T>(
    cacheKey: string,
    networkLoader: () => Promise<T>,
    ttl: number = 300000
  ): Promise<T> {
    // Сначала пытаемся загрузить из кэша
    const cachedData = await this.getCachedData(cacheKey);
    if (cachedData) {
      console.log('Using cached data for:', cacheKey);
      return cachedData;
    }
    
    // Если нет кэша или нет сети, возвращаем null
    if (!this.isOnline) {
      console.log('No network, no cached data for:', cacheKey);
      throw new Error('No network connection and no cached data');
    }
    
    // Загружаем с сети и кэшируем
    try {
      const networkData = await networkLoader();
      await this.cacheData(cacheKey, networkData, ttl);
      console.log('Loaded and cached data for:', cacheKey);
      return networkData;
    } catch (error) {
      console.error('Error loading data from network:', error);
      throw error;
    }
  }

  // Стратегия загрузки данных (network-first)
  async loadWithNetworkFirst<T>(
    cacheKey: string,
    networkLoader: () => Promise<T>,
    ttl: number = 300000
  ): Promise<T> {
    // Если есть сеть, загружаем с сети
    if (this.isOnline) {
      try {
        const networkData = await networkLoader();
        await this.cacheData(cacheKey, networkData, ttl);
        return networkData;
      } catch (error) {
        console.error('Network error, trying cache:', error);
      }
    }
    
    // Если нет сети или ошибка сети, используем кэш
    const cachedData = await this.getCachedData(cacheKey);
    if (cachedData) {
      console.log('Using cached data due to network issues:', cacheKey);
      return cachedData;
    }
    
    throw new Error('No network connection and no cached data');
  }
}

export default OfflineService.getInstance();



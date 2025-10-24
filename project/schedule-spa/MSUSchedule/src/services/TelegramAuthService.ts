import { WebView } from 'react-native-webview';
import * as Keychain from 'react-native-keychain';
import { authenticateTelegram } from '../api/userApi';
import { TelegramUser } from '../types';
import { CONFIG } from '../config';

// Конфигурация Telegram WebApp из централизованной конфигурации
const TELEGRAM_BOT_TOKEN = CONFIG.TELEGRAM_BOT_TOKEN;
const TELEGRAM_BOT_USERNAME = CONFIG.TELEGRAM_BOT_USERNAME;
const TELEGRAM_WEBAPP_URL = CONFIG.TELEGRAM_WEBAPP_URL;

class TelegramAuthService {
  private static instance: TelegramAuthService;
  private authToken: string | null = null;
  private user: TelegramUser | null = null;

  static getInstance(): TelegramAuthService {
    if (!TelegramAuthService.instance) {
      TelegramAuthService.instance = new TelegramAuthService();
    }
    return TelegramAuthService.instance;
  }

  // Получение сохраненного токена из Keychain
  async getStoredToken(): Promise<string | null> {
    try {
      const credentials = await Keychain.getInternetCredentials('msu_schedule_token');
      if (credentials) {
        this.authToken = credentials.password;
        return credentials.password;
      }
      return null;
    } catch (error) {
      console.error('Ошибка получения токена:', error);
      return null;
    }
  }

  // Сохранение токена в Keychain
  async storeToken(token: string): Promise<void> {
    try {
      await Keychain.setInternetCredentials(
        'msu_schedule_token',
        'msu_schedule_user',
        token
      );
      this.authToken = token;
    } catch (error) {
      console.error('Ошибка сохранения токена:', error);
    }
  }

  // Удаление токена из Keychain
  async removeToken(): Promise<void> {
    try {
      await Keychain.resetInternetCredentials('msu_schedule_token');
      this.authToken = null;
      this.user = null;
    } catch (error) {
      console.error('Ошибка удаления токена:', error);
    }
  }

  // Авторизация через Telegram WebApp
  async authenticateWithTelegram(initData: string): Promise<{ user: TelegramUser; token: string }> {
    try {
      const response = await authenticateTelegram(initData);
      
      // Сохраняем токен
      await this.storeToken(response.token);
      
      // Сохраняем пользователя
      this.user = response.user;
      
      return response;
    } catch (error) {
      console.error('Ошибка авторизации через Telegram:', error);
      throw error;
    }
  }

  // Проверка валидности токена
  async validateToken(): Promise<boolean> {
    try {
      const token = await this.getStoredToken();
      if (!token) {
        return false;
      }

      // Здесь можно добавить проверку токена на сервере
      // Пока просто проверяем наличие токена
      return true;
    } catch (error) {
      console.error('Ошибка валидации токена:', error);
      return false;
    }
  }

  // Получение текущего пользователя
  getCurrentUser(): TelegramUser | null {
    return this.user;
  }

  // Получение текущего токена
  getCurrentToken(): string | null {
    return this.authToken;
  }

  // Выход из системы
  async logout(): Promise<void> {
    await this.removeToken();
  }

  // Проверка авторизации при запуске приложения
  async checkAuthOnStartup(): Promise<{ isAuthenticated: boolean; user?: TelegramUser; token?: string }> {
    try {
      const token = await this.getStoredToken();
      if (!token) {
        return { isAuthenticated: false };
      }

      const isValid = await this.validateToken();
      if (!isValid) {
        await this.removeToken();
        return { isAuthenticated: false };
      }

      return {
        isAuthenticated: true,
        user: this.user || undefined,
        token,
      };
    } catch (error) {
      console.error('Ошибка проверки авторизации:', error);
      return { isAuthenticated: false };
    }
  }
}

export default TelegramAuthService.getInstance();

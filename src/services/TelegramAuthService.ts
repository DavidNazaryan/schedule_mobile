import * as SecureStore from 'expo-secure-store';

import { authenticateTelegram } from '@/api/userApi';
import { CONFIG } from '@/config';
import { TelegramUser } from '@/types';

const TOKEN_KEY = 'msu_schedule_token';

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

  async getStoredToken(): Promise<string | null> {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) {
        this.authToken = token;
      }
      return token;
    } catch (error) {
      console.error('Ошибка чтения токена:', error);
      return null;
    }
  }

  async storeToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      this.authToken = token;
    } catch (error) {
      console.error('Ошибка сохранения токена:', error);
    }
  }

  async removeToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch (error) {
      console.error('Ошибка удаления токена:', error);
    } finally {
      this.authToken = null;
      this.user = null;
    }
  }

  async authenticateWithTelegram(
    initData: string
  ): Promise<{ user: TelegramUser; token: string }> {
    try {
      const response = await authenticateTelegram(initData);
      await this.storeToken(response.token);
      this.user = response.user;
      return response;
    } catch (error) {
      console.error('Ошибка авторизации через Telegram:', error);
      throw error;
    }
  }

  async validateToken(): Promise<boolean> {
    try {
      const token = await this.getStoredToken();
      return Boolean(token);
    } catch (error) {
      console.error('Ошибка проверки токена:', error);
      return false;
    }
  }

  getCurrentUser(): TelegramUser | null {
    return this.user;
  }

  getCurrentToken(): string | null {
    return this.authToken;
  }

  async logout(): Promise<void> {
    await this.removeToken();
  }

  async checkAuthOnStartup(): Promise<{
    isAuthenticated: boolean;
    user?: TelegramUser;
    token?: string;
  }> {
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
        user: this.user ?? undefined,
        token,
      };
    } catch (error) {
      console.error('Ошибка проверки авторизации при запуске:', error);
      return { isAuthenticated: false };
    }
  }

  getTelegramWebAppUrl(): string {
    return CONFIG.TELEGRAM_WEBAPP_URL;
  }

  getTelegramBotUsername(): string {
    return CONFIG.TELEGRAM_BOT_USERNAME;
  }
}

export default TelegramAuthService.getInstance();

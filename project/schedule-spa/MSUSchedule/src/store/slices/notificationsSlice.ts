import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { NotificationItem, NotificationSettings } from '../types';

interface NotificationsState {
  items: NotificationItem[];
  settings: NotificationSettings;
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

const initialSettings: NotificationSettings = {
  notifications_enabled: true,
  homework_notifications: true,
  schedule_notifications: true,
  group_notifications: true,
  system_notifications: true,
  reminder_notifications: true,
  language: 'ru',
};

const initialState: NotificationsState = {
  items: [],
  settings: initialSettings,
  unreadCount: 0,
  loading: false,
  error: null,
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setNotifications: (state, action: PayloadAction<NotificationItem[]>) => {
      state.items = action.payload;
      state.unreadCount = action.payload.filter(item => !item.sent).length;
    },
    addNotification: (state, action: PayloadAction<NotificationItem>) => {
      state.items.unshift(action.payload);
      if (!action.payload.sent) {
        state.unreadCount += 1;
      }
    },
    markAsRead: (state, action: PayloadAction<number>) => {
      const notification = state.items.find(item => item.id === action.payload);
      if (notification && !notification.sent) {
        notification.sent = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllAsRead: (state) => {
      state.items.forEach(item => {
        item.sent = true;
      });
      state.unreadCount = 0;
    },
    updateSettings: (state, action: PayloadAction<Partial<NotificationSettings>>) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearNotifications: (state) => {
      state.items = [];
      state.unreadCount = 0;
    },
  },
});

export const {
  setLoading,
  setNotifications,
  addNotification,
  markAsRead,
  markAllAsRead,
  updateSettings,
  setError,
  clearNotifications,
} = notificationsSlice.actions;

export default notificationsSlice.reducer;



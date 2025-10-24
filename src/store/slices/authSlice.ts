import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TelegramUser, UserRole } from '@/types';

interface AuthState {
  user: TelegramUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  authMode: 'telegram' | 'guest' | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  authMode: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<{ user: TelegramUser; token: string }>) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.error = null;
      state.authMode = 'telegram';
    },
    loginGuest: (
      state,
      action: PayloadAction<{
        firstName: string;
        lastName?: string;
        username?: string;
        groupId?: string;
      }>
    ) => {
      const now = new Date().toISOString();
      state.isLoading = false;
      state.isAuthenticated = true;
      state.token = null;
      state.error = null;
      state.authMode = 'guest';
      state.user = {
        id: Date.now(),
        first_name: action.payload.firstName.trim() || 'Гость',
        last_name: action.payload.lastName?.trim() || '',
        username: action.payload.username?.trim() || '',
        photo_url: undefined,
        language_code: 'ru',
        role: UserRole.GUEST,
        group_id: action.payload.groupId?.trim() || undefined,
        status: 'guest',
        created_at: now,
        last_seen: now,
      };
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.error = action.payload;
      state.authMode = null;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.error = null;
      state.authMode = null;
    },
    updateUser: (state, action: PayloadAction<TelegramUser>) => {
      state.user = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginGuest,
  loginFailure,
  logout,
  updateUser,
  clearError,
} = authSlice.actions;

export default authSlice.reducer;



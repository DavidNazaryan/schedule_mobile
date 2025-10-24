import apiClient from './apiClient';
import {
  AuditLogListResponse,
  GroupJoinRequest,
  GroupJoinResponse,
  GroupListResponse,
  PermissionCheck,
  RoleUpdateRequest,
  RoleUpdateResponse,
  SystemInfoResponse,
  TelegramUser,
  UserListResponse,
  UserProfile,
  UserStatsResponse,
} from '@/types';

// Аутентификация через Telegram
export const authenticateTelegram = async (initData: string) => {
  const data = {
    init_data: initData,
  };
  
  return apiClient.post<{ user: TelegramUser; token: string }>('/api/auth/telegram', data);
};

// Получение информации о сессии
export const getSessionInfo = async () => {
  return apiClient.get<{ user: TelegramUser; token: string }>('/api/auth/session');
};

// Получение профиля пользователя
export const getUserProfile = async (): Promise<UserProfile> => {
  return apiClient.get<UserProfile>('/api/user/profile');
};

// Получение текущего пользователя
export const getCurrentUser = async (): Promise<TelegramUser> => {
  return apiClient.get<TelegramUser>('/api/user/current');
};

// Получение списка пользователей
export const getUsersList = async (page: number = 1, perPage: number = 20): Promise<UserListResponse> => {
  return apiClient.get<UserListResponse>(`/api/users?page=${page}&per_page=${perPage}`);
};

// Обновление роли пользователя
export const updateUserRole = async (request: RoleUpdateRequest): Promise<RoleUpdateResponse> => {
  return apiClient.post<RoleUpdateResponse>('/api/users/role', request);
};

// Получение пользователей группы
export const getGroupUsers = async (groupId: string): Promise<TelegramUser[]> => {
  return apiClient.get<TelegramUser[]>(`/api/groups/${groupId}/users`);
};

// Получение списка групп
export const getGroupsList = async (): Promise<GroupListResponse> => {
  return apiClient.get<GroupListResponse>('/api/groups');
};

// Присоединение к группе
export const joinGroup = async (request: GroupJoinRequest): Promise<GroupJoinResponse> => {
  return apiClient.post<GroupJoinResponse>('/api/groups/join', request);
};

// Получение разрешений пользователя
export const getUserPermissions = async (): Promise<PermissionCheck> => {
  return apiClient.get<PermissionCheck>('/api/user/permissions');
};

// Получение статистики (для админов)
export const getUserStatistics = async (): Promise<UserStatsResponse> => {
  return apiClient.get<UserStatsResponse>('/api/admin/stats');
};

// Получение журнала аудита (для админов)
export const getAuditLogs = async (page: number = 1, perPage: number = 50): Promise<AuditLogListResponse> => {
  return apiClient.get<AuditLogListResponse>(`/api/admin/audit?page=${page}&per_page=${perPage}`);
};

// Получение информации о системе (для админов)
export const getSystemInfo = async (): Promise<SystemInfoResponse> => {
  return apiClient.get<SystemInfoResponse>('/api/system/info');
};

// Сброс данных пользователей (для админов)
export const resetUsersData = async (): Promise<{ success: boolean; message: string }> => {
  return apiClient.post<{ success: boolean; message: string }>('/api/admin/reset-users');
};

// Тест авторизации
export const testAuth = async (): Promise<{ authenticated: boolean; user?: TelegramUser }> => {
  return apiClient.get<{ authenticated: boolean; user?: TelegramUser }>('/api/test-auth');
};



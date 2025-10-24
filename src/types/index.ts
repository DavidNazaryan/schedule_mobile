// Типы для MSU Schedule React Native App

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
  role: UserRole;
  group_id?: string;
  status: string;
  created_at?: string;
  last_seen?: string;
}

export enum UserRole {
  GUEST = 'guest',
  STUDENT = 'student',
  MONITOR = 'monitor',
  ADMIN = 'admin'
}

export interface AuthState {
  user: TelegramUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authMode: 'telegram' | 'guest' | null;
}

export interface ScheduleState {
  faculties: OptionItem[];
  courses: OptionItem[];
  groups: OptionItem[];
  currentSchedule: ScheduleItem[];
  selectedFaculty: string | null;
  selectedCourse: string | null;
  selectedGroup: string | null;
  isLoading: boolean;
}

export interface OptionItem {
  id: string;
  name: string;
  children?: OptionItem[];
}

export interface ScheduleItem {
  id: string;
  title: string;
  time: string;
  room: string;
  teacher: string;
  type: string;
  date: string;
  group_id: string;
  startsAt?: string | null;
  endsAt?: string | null;
  pairNumber?: number | null;
  notes?: string | null;
  created_at?: string | null;
  added_at?: string | null;
}

export interface HomeworkTask {
  id: number;
  lesson_id: string;
  group_id: string;
  homework_text: string;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface NewsArticle {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  url: string;
  image_url?: string;
  published_at: string;
  source: string;
}

export interface NotificationItem {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  sent: boolean;
  created_at: string;
  sent_at?: string;
}

export enum NotificationType {
  HOMEWORK_ASSIGNED = 'homework_assigned',
  HOMEWORK_UPDATED = 'homework_updated',
  HOMEWORK_DELETED = 'homework_deleted',
  SCHEDULE_CHANGED = 'schedule_changed',
  NEW_GROUP_MEMBER = 'new_group_member',
  ROLE_CHANGED = 'role_changed',
  SYSTEM_ANNOUNCEMENT = 'system_announcement',
  REMINDER = 'reminder'
}

export interface NotificationSettings {
  notifications_enabled: boolean;
  homework_notifications: boolean;
  schedule_notifications: boolean;
  group_notifications: boolean;
  system_notifications: boolean;
  reminder_notifications: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  language: string;
}

export interface NotificationSettingsRequest {
  notifications_enabled: boolean;
  homework_notifications: boolean;
  schedule_notifications: boolean;
  group_notifications: boolean;
  system_notifications: boolean;
  reminder_notifications: boolean;
  quiet_hours_start?: string | null;
  quiet_hours_end?: string | null;
  language: string;
}

export interface NotificationSettingsResponse extends NotificationSettings {
  user_id: number;
  updated_at?: string;
}

export interface NotificationHistoryListResponse {
  notifications: NotificationItem[];
  total: number;
  unread_count: number;
}

export interface SendNotificationRequest {
  user_id?: number;
  group_id?: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface SendNotificationResponse {
  success: boolean;
  message: string;
  sent_count: number;
  failed_count: number;
}

export interface GroupInfo {
  id: string;
  name: string;
  faculty_id?: string;
  course_id?: string;
  monitor_id?: number;
  monitor_name?: string;
  student_count: number;
  created_at?: string;
}

export interface UserProfile {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
  role: string;
  role_display: string;
  status: string;
  group_id?: string;
  group_name?: string;
  created_at?: string;
  last_seen?: string;
  permissions: Record<string, boolean>;
}

export interface PermissionCheck {
  can_view: boolean;
  can_edit: boolean;
  can_manage_users: boolean;
  can_manage_group: boolean;
  can_view_statistics: boolean;
  can_manage_system: boolean;
  user_role: string;
  user_group?: string;
}

export interface GroupJoinRequest {
  group_id: string;
}

export interface GroupJoinResponse {
  success: boolean;
  message: string;
  group_id: string;
  group_name?: string;
}

export interface UIState {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  activeTab: string;
  isLoading: boolean;
}

export interface RootState {
  auth: AuthState;
  schedule: ScheduleState;
  homework: {
    tasks: HomeworkTask[];
    loading: boolean;
  };
  news: {
    articles: NewsArticle[];
    pagination: {
      page: number;
      total: number;
      hasMore: boolean;
    };
    loading: boolean;
  };
  notifications: {
    items: NotificationItem[];
    settings: NotificationSettings;
    unreadCount: number;
    loading: boolean;
  };
  ui: UIState;
}

// Navigation types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Schedule: undefined;
  News: undefined;
  Settings: undefined;
  AdminDashboard: undefined;
  NewsDetail: { article: NewsArticle };
  HomeworkDetail: { task: HomeworkTask };
};

export type TabParamList = {
  ScheduleTab: undefined;
  NewsTab: undefined;
  SettingsTab: undefined;
};

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// Error types
export interface ApiError {
  message: string;
  code: number;
  details?: any;
}

export interface UserListResponse {
  users: UserProfile[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface GroupListResponse {
  groups: GroupInfo[];
  total: number;
}

export interface UserStatsResponse {
  total_users: number;
  total_groups: number;
  active_users_week: number;
  roles: Record<string, number>;
  statuses: Record<string, number>;
}

export interface RoleUpdateRequest {
  user_id: number;
  role: string;
  group_id?: string | null;
}

export interface RoleUpdateResponse {
  success: boolean;
  message: string;
  user_id: number;
  new_role: string;
  group_id?: string | null;
}

export interface AuditLogResponse {
  id: number;
  user_id: number;
  user_name: string;
  action: string;
  resource?: string | null;
  details?: string | null;
  created_at: string;
}

export interface AuditLogListResponse {
  logs: AuditLogResponse[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface SystemInfoResponse {
  version: string;
  database_status: string;
  total_users: number;
  total_groups: number;
  uptime: string;
  last_backup?: string | null;
}



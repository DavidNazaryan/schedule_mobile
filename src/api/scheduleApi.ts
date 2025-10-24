import apiClient from './apiClient';
import {
  OptionItem,
  ScheduleItem,
  HomeworkTask,
  PermissionCheck,
} from '@/types';

interface ScheduleGroupResponse {
  id: string;
  name?: string | null;
}

interface ScheduleLessonResponse {
  id: string;
  date: string;
  pair_number?: number | null;
  starts_at?: string | null;
  ends_at?: string | null;
  subject?: string | null;
  type?: string | null;
  teacher?: string | null;
  room?: string | null;
  group_id?: string | null;
  notes?: string | null;
}

interface ScheduleApiResponse {
  group: ScheduleGroupResponse;
  lessons: ScheduleLessonResponse[];
}

const normalizeDate = (value?: string | null): string => {
  if (!value) {
    return '';
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const match = value.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (match) {
    const [, day, month, year] = match;
    return `${year}-${month}-${day}`;
  }

  return value;
};

const formatLessonTime = (start?: string | null, end?: string | null): string => {
  if (start && end) {
    return `${start} - ${end}`;
  }

  if (start) {
    return start;
  }

  if (end) {
    return end;
  }

  return 'Время не указано';
};

const mapLessonToScheduleItem = (
  lesson: ScheduleLessonResponse,
  fallbackGroupId: string,
): ScheduleItem => ({
  id: lesson.id,
  title: lesson.subject ?? 'Без названия',
  time: formatLessonTime(lesson.starts_at, lesson.ends_at),
  room: lesson.room ?? 'Аудитория не указана',
  teacher: lesson.teacher ?? 'Преподаватель не указан',
  type: lesson.type ?? 'Занятие',
  date: normalizeDate(lesson.date),
  group_id: lesson.group_id ?? fallbackGroupId,
  startsAt: lesson.starts_at ?? null,
  endsAt: lesson.ends_at ?? null,
  pairNumber: lesson.pair_number ?? null,
  notes: lesson.notes ?? null,
});

// Получение дерева опций (факультеты, курсы, группы)
export const getOptionsTree = async (): Promise<{ faculties: OptionItem[]; courses: OptionItem[]; groups: OptionItem[] }> => {
  return apiClient.get<{ faculties: OptionItem[]; courses: OptionItem[]; groups: OptionItem[] }>('/api/options/tree');
};

// Получение списка факультетов
export const getFaculties = async (): Promise<OptionItem[]> => {
  return apiClient.get<OptionItem[]>('/api/options/faculties');
};

// Получение списка курсов по факультету
export const getCourses = async (facultyId: string): Promise<OptionItem[]> => {
  return apiClient.get<OptionItem[]>(`/api/options/courses?faculty=${facultyId}`);
};

// Получение списка групп по факультету и курсу
export const getGroups = async (facultyId: string, courseId: string): Promise<OptionItem[]> => {
  return apiClient.get<OptionItem[]>(`/api/options/groups?faculty=${facultyId}&course=${courseId}`);
};

// Получение расписания
export const getSchedule = async (
  facultyId: string,
  courseId: string,
  groupId: string,
  dateFrom?: string,
  dateTo?: string,
): Promise<ScheduleItem[]> => {
  const params = new URLSearchParams({
    faculty: facultyId,
    course: courseId,
    group: groupId,
  });

  if (dateFrom) {
    params.append('from', dateFrom);
  }

  if (dateTo) {
    params.append('to', dateTo);
  }

  const response = await apiClient.get<ScheduleApiResponse>(`/api/schedule?${params.toString()}`);

  const fallbackGroupId = response.group?.id ?? groupId;
  const lessons = response.lessons ?? [];

  const normalized = lessons.map((lesson) => mapLessonToScheduleItem(lesson, fallbackGroupId));

  const getSortValue = (item: ScheduleItem): number => {
    const fallbackStart = item.time.includes('-') ? item.time.split('-')[0]?.trim() : null;
    const timePart = item.startsAt ?? fallbackStart ?? '00:00';
    const dateTimeString = `${item.date}T${timePart}`;
    return new Date(dateTimeString).getTime();
  };

  return normalized.sort((a, b) => getSortValue(a) - getSortValue(b));
};

// Получение разрешений для расписания группы
export const getSchedulePermissions = async (groupId: string): Promise<PermissionCheck> => {
  return apiClient.get<PermissionCheck>(`/api/schedule/${groupId}/permissions`);
};

// Добавление домашнего задания
export const addHomework = async (
  lessonId: string,
  groupId: string,
  homeworkText: string,
): Promise<{ success: boolean; message: string; homework?: HomeworkTask }> => {
  const data = {
    lesson_id: lessonId,
    group_id: groupId,
    homework_text: homeworkText,
  };

  return apiClient.post<{ success: boolean; message: string; homework?: HomeworkTask }>(
    '/api/schedule/homework',
    data,
  );
};

// Обновление домашнего задания
export const updateHomework = async (
  lessonId: string,
  groupId: string,
  homeworkText: string,
): Promise<{ success: boolean; message: string; homework?: HomeworkTask }> => {
  const data = {
    lesson_id: lessonId,
    group_id: groupId,
    homework_text: homeworkText,
  };

  return apiClient.put<{ success: boolean; message: string; homework?: HomeworkTask }>(
    '/api/schedule/homework',
    data,
  );
};

// Удаление домашнего задания
export const deleteHomework = async (
  lessonId: string,
  groupId: string,
): Promise<{ success: boolean; message: string }> => {
  const data = {
    lesson_id: lessonId,
    group_id: groupId,
  };

  return apiClient.delete<{ success: boolean; message: string }>(
    '/api/schedule/homework',
    {
      data,
    },
  );
};

// Получение домашних заданий группы
export const getGroupHomework = async (groupId: string): Promise<{ homework: HomeworkTask[] }> => {
  return apiClient.get<{ homework: HomeworkTask[] }>(`/api/schedule/homework/${groupId}`);
};

// Получение всех групп (для админа)
export const getAllGroups = async (): Promise<{ groups: Array<{ id: string; name: string; faculty_id?: string; course_id?: string }> }> => {
  return apiClient.get<{ groups: Array<{ id: string; name: string; faculty_id?: string; course_id?: string }> }>('/api/admin/groups');
};


import apiClient from './apiClient';
import { 
  OptionItem, 
  ScheduleItem, 
  HomeworkTask,
  PermissionCheck
} from '../types';

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
  groupId: string
): Promise<{ schedule: ScheduleItem[] }> => {
  return apiClient.get<{ schedule: ScheduleItem[] }>(
    `/api/schedule?faculty=${facultyId}&course=${courseId}&group=${groupId}`
  );
};

// Получение разрешений для расписания группы
export const getSchedulePermissions = async (groupId: string): Promise<PermissionCheck> => {
  return apiClient.get<PermissionCheck>(`/api/schedule/${groupId}/permissions`);
};

// Добавление домашнего задания
export const addHomework = async (
  lessonId: string,
  groupId: string,
  homeworkText: string
): Promise<{ success: boolean; message: string; homework?: HomeworkTask }> => {
  const formData = new FormData();
  formData.append('lesson_id', lessonId);
  formData.append('group_id', groupId);
  formData.append('homework_text', homeworkText);
  
  return apiClient.post<{ success: boolean; message: string; homework?: HomeworkTask }>(
    '/api/schedule/homework',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
};

// Обновление домашнего задания
export const updateHomework = async (
  lessonId: string,
  groupId: string,
  homeworkText: string
): Promise<{ success: boolean; message: string; homework?: HomeworkTask }> => {
  const formData = new FormData();
  formData.append('lesson_id', lessonId);
  formData.append('group_id', groupId);
  formData.append('homework_text', homeworkText);
  
  return apiClient.put<{ success: boolean; message: string; homework?: HomeworkTask }>(
    '/api/schedule/homework',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
};

// Удаление домашнего задания
export const deleteHomework = async (
  lessonId: string,
  groupId: string
): Promise<{ success: boolean; message: string }> => {
  const formData = new FormData();
  formData.append('lesson_id', lessonId);
  formData.append('group_id', groupId);
  
  return apiClient.delete<{ success: boolean; message: string }>(
    '/api/schedule/homework',
    {
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
};

// Получение домашних заданий группы
export const getGroupHomework = async (groupId: string): Promise<{ homework: HomeworkTask[] }> => {
  return apiClient.get<{ homework: HomeworkTask[] }>(`/api/schedule/homework/${groupId}`);
};

// Получение всех групп (для админов)
export const getAllGroups = async (): Promise<{ groups: Array<{ id: string; name: string; faculty_id?: string; course_id?: string }> }> => {
  return apiClient.get<{ groups: Array<{ id: string; name: string; faculty_id?: string; course_id?: string }> }>('/api/admin/groups');
};



import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { OptionItem, ScheduleItem } from '@/types';

interface ScheduleState {
  faculties: OptionItem[];
  courses: OptionItem[];
  groups: OptionItem[];
  currentSchedule: ScheduleItem[];
  fullSchedule: ScheduleItem[];
  selectedFaculty: string | null;
  selectedCourse: string | null;
  selectedGroup: string | null;
  isLoading: boolean;
  error: string | null;
  isOffline: boolean;
  lastUpdated: string | null;
}

const initialState: ScheduleState = {
  faculties: [],
  courses: [],
  groups: [],
  currentSchedule: [],
  fullSchedule: [],
  selectedFaculty: null,
  selectedCourse: null,
  selectedGroup: null,
  isLoading: false,
  error: null,
  isOffline: false,
  lastUpdated: null,
};

const scheduleSlice = createSlice({
  name: 'schedule',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setFaculties: (state, action: PayloadAction<OptionItem[]>) => {
      state.faculties = action.payload;
    },
    setCourses: (state, action: PayloadAction<OptionItem[]>) => {
      state.courses = action.payload;
    },
    setGroups: (state, action: PayloadAction<OptionItem[]>) => {
      state.groups = action.payload;
    },
    setCurrentSchedule: (state, action: PayloadAction<ScheduleItem[]>) => {
      state.currentSchedule = action.payload;
    },
    setSelectedFaculty: (state, action: PayloadAction<string | null>) => {
      const nextFaculty = action.payload;
      if (state.selectedFaculty === nextFaculty) {
        state.selectedFaculty = nextFaculty;
        return;
      }

      state.selectedFaculty = nextFaculty;
      // Сбрасываем курсы и группы при смене факультета
      state.courses = [];
      state.groups = [];
      state.selectedCourse = null;
      state.selectedGroup = null;
    },
    setSelectedCourse: (state, action: PayloadAction<string | null>) => {
      const nextCourse = action.payload;
      if (state.selectedCourse === nextCourse) {
        state.selectedCourse = nextCourse;
        return;
      }

      state.selectedCourse = nextCourse;
      // Сбрасываем группы при смене курса
      state.groups = [];
      state.selectedGroup = null;
    },
    setSelectedGroup: (state, action: PayloadAction<string | null>) => {
      const nextGroup = action.payload;
      if (state.selectedGroup === nextGroup) {
        state.selectedGroup = nextGroup;
        return;
      }

      state.selectedGroup = nextGroup;
      state.fullSchedule = [];
      state.currentSchedule = [];
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setOfflineMode: (state, action: PayloadAction<boolean>) => {
      state.isOffline = action.payload;
    },
    setLastUpdated: (state, action: PayloadAction<string | null>) => {
      state.lastUpdated = action.payload;
    },
    setFullSchedule: (state, action: PayloadAction<ScheduleItem[]>) => {
      state.fullSchedule = action.payload;
    },
    clearSchedule: (state) => {
      state.currentSchedule = [];
      state.fullSchedule = [];
      state.selectedFaculty = null;
      state.selectedCourse = null;
      state.selectedGroup = null;
      state.isOffline = false;
      state.lastUpdated = null;
    },
  },
});

export const {
  setLoading,
  setFaculties,
  setCourses,
  setGroups,
  setCurrentSchedule,
  setSelectedFaculty,
  setSelectedCourse,
  setSelectedGroup,
  setError,
  setOfflineMode,
  setLastUpdated,
  setFullSchedule,
  clearSchedule,
} = scheduleSlice.actions;

export default scheduleSlice.reducer;



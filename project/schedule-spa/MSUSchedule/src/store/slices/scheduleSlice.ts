import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { OptionItem, ScheduleItem } from '../types';

interface ScheduleState {
  faculties: OptionItem[];
  courses: OptionItem[];
  groups: OptionItem[];
  currentSchedule: ScheduleItem[];
  selectedFaculty: string | null;
  selectedCourse: string | null;
  selectedGroup: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ScheduleState = {
  faculties: [],
  courses: [],
  groups: [],
  currentSchedule: [],
  selectedFaculty: null,
  selectedCourse: null,
  selectedGroup: null,
  isLoading: false,
  error: null,
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
      state.selectedFaculty = action.payload;
      // Сбрасываем курсы и группы при смене факультета
      state.courses = [];
      state.groups = [];
      state.selectedCourse = null;
      state.selectedGroup = null;
    },
    setSelectedCourse: (state, action: PayloadAction<string | null>) => {
      state.selectedCourse = action.payload;
      // Сбрасываем группы при смене курса
      state.groups = [];
      state.selectedGroup = null;
    },
    setSelectedGroup: (state, action: PayloadAction<string | null>) => {
      state.selectedGroup = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearSchedule: (state) => {
      state.currentSchedule = [];
      state.selectedFaculty = null;
      state.selectedCourse = null;
      state.selectedGroup = null;
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
  clearSchedule,
} = scheduleSlice.actions;

export default scheduleSlice.reducer;



import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { HomeworkTask } from '../types';

interface HomeworkState {
  tasks: HomeworkTask[];
  loading: boolean;
  error: string | null;
}

const initialState: HomeworkState = {
  tasks: [],
  loading: false,
  error: null,
};

const homeworkSlice = createSlice({
  name: 'homework',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setTasks: (state, action: PayloadAction<HomeworkTask[]>) => {
      state.tasks = action.payload;
    },
    addTask: (state, action: PayloadAction<HomeworkTask>) => {
      state.tasks.push(action.payload);
    },
    updateTask: (state, action: PayloadAction<HomeworkTask>) => {
      const index = state.tasks.findIndex(task => task.id === action.payload.id);
      if (index !== -1) {
        state.tasks[index] = action.payload;
      }
    },
    removeTask: (state, action: PayloadAction<number>) => {
      state.tasks = state.tasks.filter(task => task.id !== action.payload);
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearTasks: (state) => {
      state.tasks = [];
    },
  },
});

export const {
  setLoading,
  setTasks,
  addTask,
  updateTask,
  removeTask,
  setError,
  clearTasks,
} = homeworkSlice.actions;

export default homeworkSlice.reducer;



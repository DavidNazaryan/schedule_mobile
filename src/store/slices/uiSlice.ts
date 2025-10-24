import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  activeTab: string;
  isLoading: boolean;
  weekViewMode: 'calendar' | 'range'; // 'calendar' = new daily view, 'range' = old week range view
}

const initialState: UIState = {
  theme: 'auto',
  language: 'ru',
  activeTab: 'ScheduleTab',
  isLoading: false,
  weekViewMode: 'calendar',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'auto'>) => {
      state.theme = action.payload;
    },
    setLanguage: (state, action: PayloadAction<string>) => {
      state.language = action.payload;
    },
    setActiveTab: (state, action: PayloadAction<string>) => {
      state.activeTab = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setWeekViewMode: (state, action: PayloadAction<'calendar' | 'range'>) => {
      state.weekViewMode = action.payload;
    },
  },
});

export const {
  setTheme,
  setLanguage,
  setActiveTab,
  setLoading,
  setWeekViewMode,
} = uiSlice.actions;

export default uiSlice.reducer;



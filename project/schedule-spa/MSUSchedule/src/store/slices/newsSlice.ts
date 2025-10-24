import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { NewsArticle } from '../types';

interface NewsState {
  articles: NewsArticle[];
  pagination: {
    page: number;
    total: number;
    hasMore: boolean;
  };
  loading: boolean;
  error: string | null;
}

const initialState: NewsState = {
  articles: [],
  pagination: {
    page: 1,
    total: 0,
    hasMore: true,
  },
  loading: false,
  error: null,
};

const newsSlice = createSlice({
  name: 'news',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setArticles: (state, action: PayloadAction<NewsArticle[]>) => {
      state.articles = action.payload;
    },
    addArticles: (state, action: PayloadAction<NewsArticle[]>) => {
      state.articles = [...state.articles, ...action.payload];
    },
    setPagination: (state, action: PayloadAction<{ page: number; total: number; hasMore: boolean }>) => {
      state.pagination = action.payload;
    },
    incrementPage: (state) => {
      state.pagination.page += 1;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearArticles: (state) => {
      state.articles = [];
      state.pagination = {
        page: 1,
        total: 0,
        hasMore: true,
      };
    },
  },
});

export const {
  setLoading,
  setArticles,
  addArticles,
  setPagination,
  incrementPage,
  setError,
  clearArticles,
} = newsSlice.actions;

export default newsSlice.reducer;



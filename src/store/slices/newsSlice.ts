import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NewsArticle } from '@/types';

const NEWS_CACHE_KEY = '@news_cache';
const CACHE_EXPIRY_TIME = 10 * 60 * 1000; // 10 minutes

interface NewsState {
  articles: NewsArticle[];
  pagination: {
    page: number;
    total: number;
    hasMore: boolean;
  };
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
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
  lastUpdated: null,
};

// Async thunk to load cached news from AsyncStorage
export const loadCachedNews = createAsyncThunk(
  'news/loadCached',
  async () => {
    try {
      const cached = await AsyncStorage.getItem(NEWS_CACHE_KEY);
      if (cached) {
        const data = JSON.parse(cached);
        // Check if cache is still valid
        if (Date.now() - data.lastUpdated < CACHE_EXPIRY_TIME) {
          return data;
        }
      }
      return null;
    } catch (error) {
      console.error('Error loading cached news:', error);
      return null;
    }
  }
);

// Async thunk to save news to AsyncStorage
export const saveNewsToCache = createAsyncThunk(
  'news/saveCache',
  async (state: { articles: NewsArticle[]; pagination: any; lastUpdated: number }) => {
    try {
      await AsyncStorage.setItem(NEWS_CACHE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Error saving news cache:', error);
    }
  }
);

const newsSlice = createSlice({
  name: 'news',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setArticles: (state, action: PayloadAction<NewsArticle[]>) => {
      state.articles = action.payload;
      state.lastUpdated = Date.now();
    },
    addArticles: (state, action: PayloadAction<NewsArticle[]>) => {
      state.articles = [...state.articles, ...action.payload];
      state.lastUpdated = Date.now();
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
      state.lastUpdated = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(loadCachedNews.fulfilled, (state, action) => {
      if (action.payload) {
        state.articles = action.payload.articles;
        state.pagination = action.payload.pagination;
        state.lastUpdated = action.payload.lastUpdated;
      }
    });
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



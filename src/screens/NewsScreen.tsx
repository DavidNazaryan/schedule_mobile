import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, ActivityIndicator, useTheme } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootState, AppDispatch } from '@/store';
import { RootStackParamList, NewsArticle } from '@/types';
import { 
  setLoading, 
  setArticles, 
  addArticles, 
  setPagination, 
  incrementPage,
  setError,
  clearArticles,
  loadCachedNews,
  saveNewsToCache,
} from '@/store/slices/newsSlice';
import { getNews } from '../api/newsApi';
import NewsCard from '../components/NewsCard';

type NewsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'News'>;

const NewsScreen: React.FC = () => {
  const theme = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<NewsScreenNavigationProp>();
  
  const {
    articles,
    pagination,
    loading,
    error,
    lastUpdated,
  } = useSelector((state: RootState) => state.news);

  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    // Load cached news first, then fetch fresh data
    const initializeNews = async () => {
      await dispatch(loadCachedNews());
      
      // If no cached data or cache is old, fetch fresh
      if (!articles.length || !lastUpdated || Date.now() - lastUpdated > 10 * 60 * 1000) {
        loadNews(true);
      }
    };
    
    initializeNews();
  }, []);

  const loadNews = async (isRefresh: boolean = false) => {
    try {
      if (isRefresh) {
        dispatch(setLoading(true));
      } else {
        setLoadingMore(true);
      }

      const page = isRefresh ? 1 : pagination.page + 1;
      const response = await getNews(page, 20);
      
      if (isRefresh) {
        dispatch(setArticles(response.articles));
        dispatch(setPagination({
          page: response.pagination.page,
          total: response.pagination.total,
          hasMore: response.pagination.hasMore,
        }));
        
        // Save to cache
        dispatch(saveNewsToCache({
          articles: response.articles,
          pagination: response.pagination,
          lastUpdated: Date.now(),
        }));
      } else {
        dispatch(addArticles(response.articles));
        dispatch(setPagination({
          page: response.pagination.page,
          total: response.pagination.total,
          hasMore: response.pagination.hasMore,
        }));
      }
    } catch (error) {
      dispatch(setError('Ошибка загрузки новостей'));
    } finally {
      dispatch(setLoading(false));
      setLoadingMore(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNews(true);
    setRefreshing(false);
  };

  const onEndReached = async () => {
    if (!loadingMore && pagination.hasMore) {
      await loadNews(false);
    }
  };

  const handleNewsPress = (article: NewsArticle) => {
    navigation.navigate('NewsDetail', { article });
  };

  const renderNewsItem = ({ item }: { item: NewsArticle }) => (
    <NewsCard
      article={item}
      onPress={handleNewsPress}
    />
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" />
        <Text style={styles.footerText}>Загрузка...</Text>
      </View>
    );
  };

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        {error || 'Новости не найдены'}
      </Text>
    </View>
  );

  if (loading && articles.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Загрузка новостей...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={articles}
        renderItem={renderNewsItem}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmptyComponent}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  listContainer: {
    paddingVertical: 8,
    paddingBottom: 92, // Account for transparent tab bar (60px height + 16px margin + 16px extra spacing)
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  footerText: {
    marginLeft: 8,
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
});

export default NewsScreen;



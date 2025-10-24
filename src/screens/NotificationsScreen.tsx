import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, ActivityIndicator, SegmentedButtons } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';

import { RootState } from '@/store';
import { NotificationItem, NotificationType } from '@/types';
import { 
  setLoading, 
  setNotifications, 
  markAsRead, 
  markAllAsRead,
  setError,
  clearNotifications
} from '@/store/slices/notificationsSlice';
import { getNotificationHistory, markNotificationAsRead, markAllNotificationsAsRead } from '../api/newsApi';
import NotificationItemComponent from '../components/NotificationItem';
import { theme } from '@/utils/theme';

const NotificationsScreen: React.FC = () => {
  const dispatch = useDispatch();
  
  const {
    items,
    unreadCount,
    loading,
    error,
  } = useSelector((state: RootState) => state.notifications);

  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      dispatch(setLoading(true));
      const response = await getNotificationHistory(50, 0);
      dispatch(setNotifications(response.notifications));
    } catch (error) {
      dispatch(setError('Ошибка загрузки уведомлений'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = async (notification: NotificationItem) => {
    if (!notification.sent) {
      try {
        await markNotificationAsRead(notification.id);
        dispatch(markAsRead(notification.id));
      } catch (error) {
        console.error('Ошибка отметки уведомления как прочитанного:', error);
      }
    }
  };

  const handleMarkAsRead = async (notification: NotificationItem) => {
    try {
      await markNotificationAsRead(notification.id);
      dispatch(markAsRead(notification.id));
    } catch (error) {
      console.error('Ошибка отметки уведомления как прочитанного:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      dispatch(markAllAsRead());
    } catch (error) {
      console.error('Ошибка отметки всех уведомлений как прочитанных:', error);
    }
  };

  const filteredNotifications = items.filter(notification => {
    if (filter === 'unread') {
      return !notification.sent;
    }
    return true;
  });

  const renderNotificationItem = ({ item }: { item: NotificationItem }) => (
    <NotificationItemComponent
      notification={item}
      onPress={handleNotificationPress}
      onMarkAsRead={handleMarkAsRead}
    />
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        {error || (filter === 'unread' ? 'Непрочитанных уведомлений нет' : 'Уведомлений нет')}
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={styles.headerTitle}>Уведомления</Text>
        {unreadCount > 0 && (
          <Text style={styles.unreadCount}>{unreadCount} непрочитанных</Text>
        )}
      </View>
      
      <View style={styles.filterContainer}>
        <SegmentedButtons
          value={filter}
          onValueChange={(value) => setFilter(value as 'all' | 'unread')}
          buttons={[
            { value: 'all', label: 'Все' },
            { value: 'unread', label: 'Непрочитанные' },
          ]}
          style={styles.segmentedButtons}
        />
        
        {unreadCount > 0 && (
          <Text style={styles.markAllText} onPress={handleMarkAllAsRead}>
            Отметить все как прочитанные
          </Text>
        )}
      </View>
    </View>
  );

  if (loading && items.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Загрузка уведомлений...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredNotifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyComponent}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  listContainer: {
    paddingVertical: 8,
  },
  header: {
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outlineVariant,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  unreadCount: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  filterContainer: {
    gap: 12,
  },
  segmentedButtons: {
    backgroundColor: theme.colors.surfaceVariant,
  },
  markAllText: {
    fontSize: 14,
    color: theme.colors.primary,
    textAlign: 'center',
    textDecorationLine: 'underline',
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
});

export default NotificationsScreen;



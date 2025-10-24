import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, ActivityIndicator, FAB } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootState } from '../store';
import { RootStackParamList, HomeworkTask } from '../types';
import { 
  setLoading, 
  setTasks, 
  addTask, 
  updateTask, 
  removeTask,
  setError,
  clearTasks
} from '../store/slices/homeworkSlice';
import { getGroupHomework } from '../api/scheduleApi';
import HomeworkItem from '../components/HomeworkItem';
import { theme } from '../utils/theme';

type HomeworkScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Homework'>;

const HomeworkScreen: React.FC = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation<HomeworkScreenNavigationProp>();
  
  const {
    tasks,
    loading,
    error,
  } = useSelector((state: RootState) => state.homework);

  const { user } = useSelector((state: RootState) => state.auth);
  const { selectedGroup } = useSelector((state: RootState) => state.schedule);

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (selectedGroup) {
      loadHomework();
    }
  }, [selectedGroup]);

  const loadHomework = async () => {
    if (!selectedGroup) return;

    try {
      dispatch(setLoading(true));
      const response = await getGroupHomework(selectedGroup);
      dispatch(setTasks(response.homework));
    } catch (error) {
      dispatch(setError('Ошибка загрузки домашних заданий'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHomework();
    setRefreshing(false);
  };

  const handleAddHomework = () => {
    // Навигация к экрану добавления ДЗ
    navigation.navigate('HomeworkDetail', { 
      task: {
        id: 0,
        lesson_id: '',
        group_id: selectedGroup || '',
        homework_text: '',
        created_by: user?.id || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    });
  };

  const handleEditHomework = (task: HomeworkTask) => {
    navigation.navigate('HomeworkDetail', { task });
  };

  const handleDeleteHomework = async (task: HomeworkTask) => {
    // Здесь можно добавить подтверждение удаления
    dispatch(removeTask(task.id));
  };

  const renderHomeworkItem = ({ item }: { item: HomeworkTask }) => (
    <HomeworkItem
      task={item}
      onEdit={handleEditHomework}
      onDelete={handleDeleteHomework}
      canEdit={user?.role === 'monitor' || user?.role === 'admin'}
    />
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        {error || (selectedGroup ? 'Домашних заданий нет' : 'Выберите группу для просмотра ДЗ')}
      </Text>
    </View>
  );

  const canEditHomework = user?.role === 'monitor' || user?.role === 'admin';

  if (loading && tasks.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Загрузка домашних заданий...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={tasks}
        renderItem={renderHomeworkItem}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyComponent}
        contentContainerStyle={styles.listContainer}
      />
      
      {canEditHomework && selectedGroup && (
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={handleAddHomework}
        />
      )}
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
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
});

export default HomeworkScreen;



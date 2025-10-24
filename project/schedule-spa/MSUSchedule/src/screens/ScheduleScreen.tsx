import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, Button, Menu, Divider, ActivityIndicator } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootState } from '../store';
import { RootStackParamList, ScheduleItem } from '../types';
import { 
  setLoading, 
  setFaculties, 
  setCourses, 
  setGroups, 
  setCurrentSchedule,
  setSelectedFaculty,
  setSelectedCourse,
  setSelectedGroup,
  setError,
  clearSchedule
} from '../store/slices/scheduleSlice';
import { getFaculties, getCourses, getGroups, getSchedule } from '../api/scheduleApi';
import ScheduleCard from '../components/ScheduleCard';
import { theme } from '../utils/theme';

type ScheduleScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Schedule'>;

const ScheduleScreen: React.FC = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation<ScheduleScreenNavigationProp>();
  
  const {
    faculties,
    courses,
    groups,
    currentSchedule,
    selectedFaculty,
    selectedCourse,
    selectedGroup,
    isLoading,
    error,
  } = useSelector((state: RootState) => state.schedule);

  const { user } = useSelector((state: RootState) => state.auth);

  const [facultyMenuVisible, setFacultyMenuVisible] = useState(false);
  const [courseMenuVisible, setCourseMenuVisible] = useState(false);
  const [groupMenuVisible, setGroupMenuVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadFaculties();
  }, []);

  useEffect(() => {
    if (selectedFaculty) {
      loadCourses(selectedFaculty);
    }
  }, [selectedFaculty]);

  useEffect(() => {
    if (selectedFaculty && selectedCourse) {
      loadGroups(selectedFaculty, selectedCourse);
    }
  }, [selectedFaculty, selectedCourse]);

  useEffect(() => {
    if (selectedFaculty && selectedCourse && selectedGroup) {
      loadSchedule(selectedFaculty, selectedCourse, selectedGroup);
    }
  }, [selectedFaculty, selectedCourse, selectedGroup]);

  const loadFaculties = async () => {
    try {
      dispatch(setLoading(true));
      const facultiesData = await getFaculties();
      dispatch(setFaculties(facultiesData));
    } catch (error) {
      dispatch(setError('Ошибка загрузки факультетов'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const loadCourses = async (facultyId: string) => {
    try {
      dispatch(setLoading(true));
      const coursesData = await getCourses(facultyId);
      dispatch(setCourses(coursesData));
    } catch (error) {
      dispatch(setError('Ошибка загрузки курсов'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const loadGroups = async (facultyId: string, courseId: string) => {
    try {
      dispatch(setLoading(true));
      const groupsData = await getGroups(facultyId, courseId);
      dispatch(setGroups(groupsData));
    } catch (error) {
      dispatch(setError('Ошибка загрузки групп'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const loadSchedule = async (facultyId: string, courseId: string, groupId: string) => {
    try {
      dispatch(setLoading(true));
      const scheduleData = await getSchedule(facultyId, courseId, groupId);
      dispatch(setCurrentSchedule(scheduleData.schedule));
    } catch (error) {
      dispatch(setError('Ошибка загрузки расписания'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (selectedFaculty && selectedCourse && selectedGroup) {
      await loadSchedule(selectedFaculty, selectedCourse, selectedGroup);
    }
    setRefreshing(false);
  };

  const handleFacultySelect = (facultyId: string) => {
    dispatch(setSelectedFaculty(facultyId));
    setFacultyMenuVisible(false);
  };

  const handleCourseSelect = (courseId: string) => {
    dispatch(setSelectedCourse(courseId));
    setCourseMenuVisible(false);
  };

  const handleGroupSelect = (groupId: string) => {
    dispatch(setSelectedGroup(groupId));
    setGroupMenuVisible(false);
  };

  const handleHomeworkPress = (item: ScheduleItem) => {
    // Навигация к экрану добавления ДЗ
    navigation.navigate('HomeworkDetail', { 
      task: {
        id: 0,
        lesson_id: item.id,
        group_id: selectedGroup || '',
        homework_text: '',
        created_by: user?.id || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    });
  };

  const canEditHomework = user?.role === 'monitor' || user?.role === 'admin';

  const getSelectedFacultyName = () => {
    const faculty = faculties.find(f => f.id === selectedFaculty);
    return faculty?.name || 'Выберите факультет';
  };

  const getSelectedCourseName = () => {
    const course = courses.find(c => c.id === selectedCourse);
    return course?.name || 'Выберите курс';
  };

  const getSelectedGroupName = () => {
    const group = groups.find(g => g.id === selectedGroup);
    return group?.name || 'Выберите группу';
  };

  const renderScheduleItem = ({ item }: { item: ScheduleItem }) => (
    <ScheduleCard
      item={item}
      onHomeworkPress={handleHomeworkPress}
      canEditHomework={canEditHomework}
    />
  );

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={loadFaculties}>
          Попробовать снова
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.selectorContainer}>
        <Card style={styles.selectorCard}>
          <Card.Content>
            <Text style={styles.selectorTitle}>Выберите группу</Text>
            
            <Menu
              visible={facultyMenuVisible}
              onDismiss={() => setFacultyMenuVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setFacultyMenuVisible(true)}
                  style={styles.selectorButton}
                >
                  {getSelectedFacultyName()}
                </Button>
              }
            >
              {faculties.map((faculty) => (
                <Menu.Item
                  key={faculty.id}
                  onPress={() => handleFacultySelect(faculty.id)}
                  title={faculty.name}
                />
              ))}
            </Menu>

            {selectedFaculty && (
              <>
                <Divider style={styles.divider} />
                <Menu
                  visible={courseMenuVisible}
                  onDismiss={() => setCourseMenuVisible(false)}
                  anchor={
                    <Button
                      mode="outlined"
                      onPress={() => setCourseMenuVisible(true)}
                      style={styles.selectorButton}
                    >
                      {getSelectedCourseName()}
                    </Button>
                  }
                >
                  {courses.map((course) => (
                    <Menu.Item
                      key={course.id}
                      onPress={() => handleCourseSelect(course.id)}
                      title={course.name}
                    />
                  ))}
                </Menu>
              </>
            )}

            {selectedFaculty && selectedCourse && (
              <>
                <Divider style={styles.divider} />
                <Menu
                  visible={groupMenuVisible}
                  onDismiss={() => setGroupMenuVisible(false)}
                  anchor={
                    <Button
                      mode="outlined"
                      onPress={() => setGroupMenuVisible(true)}
                      style={styles.selectorButton}
                    >
                      {getSelectedGroupName()}
                    </Button>
                  }
                >
                  {groups.map((group) => (
                    <Menu.Item
                      key={group.id}
                      onPress={() => handleGroupSelect(group.id)}
                      title={group.name}
                    />
                  ))}
                </Menu>
              </>
            )}
          </Card.Content>
        </Card>
      </View>

      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Загрузка расписания...</Text>
        </View>
      ) : (
        <FlatList
          data={currentSchedule}
          renderItem={renderScheduleItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {selectedGroup ? 'Расписание не найдено' : 'Выберите группу для просмотра расписания'}
              </Text>
            </View>
          }
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
  selectorContainer: {
    padding: 16,
  },
  selectorCard: {
    elevation: 2,
  },
  selectorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: 16,
  },
  selectorButton: {
    marginBottom: 8,
  },
  divider: {
    marginVertical: 8,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: 20,
  },
});

export default ScheduleScreen;



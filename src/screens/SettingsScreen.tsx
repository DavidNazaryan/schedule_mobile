import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, Switch, List, Avatar, Divider, Menu, useTheme } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootState } from '@/store';
import { RootStackParamList, UserRole } from '@/types';
import { logout } from '@/store/slices/authSlice';
import { setTheme, setLanguage, setWeekViewMode } from '@/store/slices/uiSlice';
import { updateSettings } from '@/store/slices/notificationsSlice';
import { 
  setLoading, 
  setFaculties, 
  setCourses, 
  setGroups,
  setSelectedFaculty,
  setSelectedCourse,
  setSelectedGroup,
  setError
} from '@/store/slices/scheduleSlice';
import { updateNotificationSettings } from '@/api/newsApi';
import { getFaculties, getCourses, getGroups } from '@/api/scheduleApi';
import UserRoleChip from '@/components/UserRoleChip';
import telegramAuthService from '@/services/TelegramAuthService';

type SettingsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Settings'>;

const SettingsScreen: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  
  const { user } = useSelector((state: RootState) => state.auth);
  const { theme: currentTheme, language, weekViewMode } = useSelector((state: RootState) => state.ui);
  const { settings: notificationSettings } = useSelector((state: RootState) => state.notifications);
  const {
    faculties,
    courses,
    groups,
    selectedFaculty,
    selectedCourse,
    selectedGroup,
  } = useSelector((state: RootState) => state.schedule);

  const [darkMode, setDarkMode] = useState(currentTheme === 'dark');
  const [calendarViewMode, setCalendarViewMode] = useState(weekViewMode === 'calendar');
  const [notificationsEnabled, setNotificationsEnabled] = useState(notificationSettings.notifications_enabled);
  const [homeworkNotifications, setHomeworkNotifications] = useState(notificationSettings.homework_notifications);
  const [scheduleNotifications, setScheduleNotifications] = useState(notificationSettings.schedule_notifications);
  const [groupNotifications, setGroupNotifications] = useState(notificationSettings.group_notifications);
  const [systemNotifications, setSystemNotifications] = useState(notificationSettings.system_notifications);
  const [openMenu, setOpenMenu] = useState<'faculty' | 'course' | 'group' | null>(null);

  useEffect(() => {
    setDarkMode(currentTheme === 'dark');
  }, [currentTheme]);

  useEffect(() => {
    setCalendarViewMode(weekViewMode === 'calendar');
  }, [weekViewMode]);

  useEffect(() => {
    setNotificationsEnabled(notificationSettings.notifications_enabled);
    setHomeworkNotifications(notificationSettings.homework_notifications);
    setScheduleNotifications(notificationSettings.schedule_notifications);
    setGroupNotifications(notificationSettings.group_notifications);
    setSystemNotifications(notificationSettings.system_notifications);
  }, [notificationSettings]);

  const loadFaculties = useCallback(async () => {
    try {
      dispatch(setLoading(true));
      const facultiesData = await getFaculties();
      dispatch(setFaculties(facultiesData));
    } catch (error) {
      console.error('Failed to load faculties', error);
      dispatch(setError('Ошибка загрузки факультетов'));
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const loadCourses = useCallback(async (facultyId: string) => {
    try {
      dispatch(setLoading(true));
      const coursesData = await getCourses(facultyId);
      dispatch(setCourses(coursesData));
    } catch (error) {
      console.error('Failed to load courses', error);
      dispatch(setError('Ошибка загрузки курсов'));
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const loadGroups = useCallback(async (facultyId: string, courseId: string) => {
    try {
      dispatch(setLoading(true));
      const groupsData = await getGroups(facultyId, courseId);
      dispatch(setGroups(groupsData));
    } catch (error) {
      console.error('Failed to load groups', error);
      dispatch(setError('Ошибка загрузки групп'));
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  useEffect(() => {
    loadFaculties();
  }, [loadFaculties]);

  useEffect(() => {
    if (selectedFaculty) {
      loadCourses(selectedFaculty);
    }
  }, [selectedFaculty, loadCourses]);

  useEffect(() => {
    if (selectedFaculty && selectedCourse) {
      loadGroups(selectedFaculty, selectedCourse);
    }
  }, [selectedFaculty, selectedCourse, loadGroups]);

  const handleFacultySelect = (facultyId: string) => {
    dispatch(setSelectedFaculty(facultyId));
    setOpenMenu(null);
  };

  const handleCourseSelect = (courseId: string) => {
    dispatch(setSelectedCourse(courseId));
    setOpenMenu(null);
  };

  const handleGroupSelect = (groupId: string) => {
    dispatch(setSelectedGroup(groupId));
    setOpenMenu(null);
  };

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

  const toggleMenu = useCallback((menu: 'faculty' | 'course' | 'group') => {
    setOpenMenu((current) => current === menu ? null : menu);
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Выход из системы',
      'Вы уверены, что хотите выйти?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Выйти',
          style: 'destructive',
          onPress: async () => {
            await telegramAuthService.logout();
            dispatch(logout());
            navigation.navigate('Auth');
          },
        },
      ]
    );
  };

  const handleThemeToggle = (value: boolean) => {
    setDarkMode(value);
    dispatch(setTheme(value ? 'dark' : 'light'));
  };

  const handleWeekViewModeToggle = (value: boolean) => {
    setCalendarViewMode(value);
    dispatch(setWeekViewMode(value ? 'calendar' : 'range'));
  };

  const handleNotificationToggle = async (type: string, value: boolean) => {
    try {
      const newSettings = {
        ...notificationSettings,
        [type]: value,
      };
      
      await updateNotificationSettings(newSettings);
      dispatch(updateSettings(newSettings));
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось обновить настройки уведомлений');
    }
  };

  const handleAdminPanel = () => {
    if (user?.role === 'admin') {
      navigation.navigate('AdminDashboard');
    }
  };

  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Профиль пользователя */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.profileContainer}>
            <Avatar.Text 
              size={64} 
              label={user?.first_name?.[0] || 'U'} 
              style={styles.avatar}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>
                {user?.first_name} {user?.last_name}
              </Text>
              <Text style={styles.userUsername}>
                @{user?.username || 'без_username'}
              </Text>
              <UserRoleChip role={user?.role ?? UserRole.STUDENT} size="small" />
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Выбор группы */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Выбор группы</Text>
          
          <Menu
            visible={openMenu === 'faculty'}
            onDismiss={() => setOpenMenu(null)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => toggleMenu('faculty')}
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
              <Divider style={styles.selectorDivider} />
              <Menu
                visible={openMenu === 'course'}
                onDismiss={() => setOpenMenu(null)}
                anchor={
                  <Button
                    mode="outlined"
                    onPress={() => toggleMenu('course')}
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
              <Divider style={styles.selectorDivider} />
              <Menu
                visible={openMenu === 'group'}
                onDismiss={() => setOpenMenu(null)}
                anchor={
                  <Button
                    mode="outlined"
                    onPress={() => toggleMenu('group')}
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

      {/* Настройки темы */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Внешний вид</Text>
          
          <List.Item
            title="Темная тема"
            description="Переключить на темную тему"
            left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
            right={() => (
              <Switch
                value={darkMode}
                onValueChange={handleThemeToggle}
              />
            )}
          />
          
          <Divider />
          
          <List.Item
            title="Календарный вид расписания"
            description="Показывать дни недели с выбором дня"
            left={(props) => <List.Icon {...props} icon="calendar-week" />}
            right={() => (
              <Switch
                value={calendarViewMode}
                onValueChange={handleWeekViewModeToggle}
              />
            )}
          />
        </Card.Content>
      </Card>

      {/* Настройки уведомлений */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Уведомления</Text>
          
          <List.Item
            title="Включить уведомления"
            description="Получать push-уведомления"
            left={(props) => <List.Icon {...props} icon="bell" />}
            right={() => (
              <Switch
                value={notificationsEnabled}
                onValueChange={(value) => handleNotificationToggle('notifications_enabled', value)}
              />
            )}
          />
          
          <Divider />
          
          <List.Item
            title="Домашние задания"
            description="Уведомления о новых ДЗ"
            left={(props) => <List.Icon {...props} icon="book" />}
            right={() => (
              <Switch
                value={homeworkNotifications}
                onValueChange={(value) => handleNotificationToggle('homework_notifications', value)}
                disabled={!notificationsEnabled}
              />
            )}
          />
          
          <List.Item
            title="Изменения расписания"
            description="Уведомления об изменениях"
            left={(props) => <List.Icon {...props} icon="calendar" />}
            right={() => (
              <Switch
                value={scheduleNotifications}
                onValueChange={(value) => handleNotificationToggle('schedule_notifications', value)}
                disabled={!notificationsEnabled}
              />
            )}
          />
          
          <List.Item
            title="Групповые события"
            description="Новые участники, изменения ролей"
            left={(props) => <List.Icon {...props} icon="account-group" />}
            right={() => (
              <Switch
                value={groupNotifications}
                onValueChange={(value) => handleNotificationToggle('group_notifications', value)}
                disabled={!notificationsEnabled}
              />
            )}
          />
          
          <List.Item
            title="Системные объявления"
            description="Важные объявления от администрации"
            left={(props) => <List.Icon {...props} icon="bullhorn" />}
            right={() => (
              <Switch
                value={systemNotifications}
                onValueChange={(value) => handleNotificationToggle('system_notifications', value)}
                disabled={!notificationsEnabled}
              />
            )}
          />
        </Card.Content>
      </Card>

      {/* Админ-панель */}
      {user?.role === 'admin' && (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Администрирование</Text>
            
            <List.Item
              title="Админ-панель"
              description="Управление пользователями и системой"
              left={(props) => <List.Icon {...props} icon="cog" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={handleAdminPanel}
            />
          </Card.Content>
        </Card>
      )}

      {/* Выход */}
      <Card style={styles.card}>
        <Card.Content>
          <Button
            mode="outlined"
            onPress={handleLogout}
            style={styles.logoutButton}
            buttonColor={theme.colors.errorContainer}
            textColor={theme.colors.onErrorContainer}
            icon="logout"
          >
            Выйти из системы
          </Button>
        </Card.Content>
      </Card>

      {/* Информация о приложении */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>О приложении</Text>
          <Text style={styles.appInfo}>
            Расписание МГУ v2.0.0{'\n'}
            Приложение для студентов МГУ{'\n'}
            Разработано: David Nazaryan
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingBottom: 92, // Account for transparent tab bar (60px height + 16px margin + 16px extra spacing)
  },
  card: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: theme.colors.primary,
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: 4,
  },
  userUsername: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: 16,
  },
  logoutButton: {
    marginTop: 8,
  },
  appInfo: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 20,
  },
  selectorButton: {
    marginBottom: 8,
  },
  selectorDivider: {
    marginVertical: 8,
  },
});

export default SettingsScreen;



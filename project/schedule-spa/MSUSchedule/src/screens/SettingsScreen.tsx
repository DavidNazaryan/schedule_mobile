import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, Switch, List, Avatar, Divider } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootState } from '../store';
import { RootStackParamList } from '../types';
import { logout } from '../store/slices/authSlice';
import { setTheme, setLanguage } from '../store/slices/uiSlice';
import { updateSettings } from '../store/slices/notificationsSlice';
import { updateNotificationSettings } from '../api/newsApi';
import UserRoleChip from '../components/UserRoleChip';
import telegramAuthService from '../services/TelegramAuthService';
import { theme } from '../utils/theme';

type SettingsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Settings'>;

const SettingsScreen: React.FC = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  
  const { user } = useSelector((state: RootState) => state.auth);
  const { theme: currentTheme, language } = useSelector((state: RootState) => state.ui);
  const { settings: notificationSettings } = useSelector((state: RootState) => state.notifications);

  const [darkMode, setDarkMode] = useState(currentTheme === 'dark');
  const [notificationsEnabled, setNotificationsEnabled] = useState(notificationSettings.notifications_enabled);
  const [homeworkNotifications, setHomeworkNotifications] = useState(notificationSettings.homework_notifications);
  const [scheduleNotifications, setScheduleNotifications] = useState(notificationSettings.schedule_notifications);
  const [groupNotifications, setGroupNotifications] = useState(notificationSettings.group_notifications);
  const [systemNotifications, setSystemNotifications] = useState(notificationSettings.system_notifications);

  useEffect(() => {
    setDarkMode(currentTheme === 'dark');
  }, [currentTheme]);

  useEffect(() => {
    setNotificationsEnabled(notificationSettings.notifications_enabled);
    setHomeworkNotifications(notificationSettings.homework_notifications);
    setScheduleNotifications(notificationSettings.schedule_notifications);
    setGroupNotifications(notificationSettings.group_notifications);
    setSystemNotifications(notificationSettings.system_notifications);
  }, [notificationSettings]);

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

  return (
    <ScrollView style={styles.container}>
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
              <UserRoleChip role={user?.role || 'student'} size="small" />
            </View>
          </View>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  card: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
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
});

export default SettingsScreen;



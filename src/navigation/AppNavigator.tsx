import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';
import { useTheme } from 'react-native-paper';

import { RootStackParamList, TabParamList } from '@/types';
import { RootState } from '@/store';

import AuthScreen from '@/screens/AuthScreen';
import ScheduleScreen from '@/screens/ScheduleScreen';
import NewsScreen from '@/screens/NewsScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import AdminDashboardScreen from '@/screens/admin/AdminDashboardScreen';
import NewsDetailScreen from '@/screens/NewsDetailScreen';
import HomeworkDetailScreen from '@/screens/HomeworkDetailScreen';

import TabBarIcon from '@/components/TabBarIcon';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

export const TabNavigator: React.FC = () => {
  const theme = useTheme();
  
  return (
    <Tab.Navigator
      initialRouteName="ScheduleTab"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => (
          <TabBarIcon route={route.name} focused={focused} color={color} size={size} />
        ),
        tabBarShowLabel: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: theme.dark ? 'rgba(30, 40, 60, 0.85)' : 'rgba(235, 245, 255, 0.85)',
          borderTopWidth: 0,
          borderRadius: 25,
          marginHorizontal: 16,
          marginBottom: 16,
          paddingBottom: 6,
          paddingTop: 6,
          height: 60,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 4,
          },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        },
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.onSurface,
      })}
    >
      <Tab.Screen 
        name="NewsTab" 
        component={NewsScreen} 
        options={{ 
          title: 'Новости',
          headerTitleAlign: 'left',
          headerTitleStyle: {
            fontSize: 28,
            fontWeight: '700',
          },
          headerTitleContainerStyle: {
            paddingTop: 12,
            paddingBottom: 10,
          },
          headerStyle: {
            backgroundColor: theme.colors.background,
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0,
            height: 100,
          },
        }} 
      />
      <Tab.Screen 
        name="ScheduleTab" 
        component={ScheduleScreen} 
        options={{ 
          title: 'Расписание',
          headerTitleAlign: 'left',
          headerTitleStyle: {
            fontSize: 28,
            fontWeight: '700',
          },
          headerTitleContainerStyle: {
            paddingTop: 12,
            paddingBottom: 10,
          },
          headerStyle: {
            backgroundColor: theme.colors.background,
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0,
            height: 100,
          },
        }} 
      />
      <Tab.Screen 
        name="SettingsTab" 
        component={SettingsScreen} 
        options={{ 
          title: 'Настройки',
          headerTitleAlign: 'left',
          headerTitleStyle: {
            fontSize: 28,
            fontWeight: '700',
          },
          headerTitleContainerStyle: {
            paddingTop: 12,
            paddingBottom: 10,
          },
          headerStyle: {
            backgroundColor: theme.colors.background,
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0,
            height: 100,
          },
        }} 
      />
    </Tab.Navigator>
  );
};

export const RootNavigator: React.FC = () => {
  const theme = useTheme();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  return (
    <Stack.Navigator
      key={isAuthenticated ? 'app-authenticated' : 'app-guest'}
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.onSurface,
      }}
    >
      {!isAuthenticated && (
        <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} />
      )}
      <Stack.Screen name="Main" component={TabNavigator} options={{ headerShown: false }} />
      <Stack.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={{ title: 'Админ-панель' }}
      />
      <Stack.Screen
        name="NewsDetail"
        component={NewsDetailScreen}
        options={{ title: 'Новость' }}
      />
      <Stack.Screen
        name="HomeworkDetail"
        component={HomeworkDetailScreen}
        options={{ title: 'Домашнее задание' }}
      />
    </Stack.Navigator>
  );
};

export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
};

export default AppNavigator;

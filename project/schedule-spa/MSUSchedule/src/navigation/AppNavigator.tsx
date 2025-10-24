import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider } from 'react-native-paper';
import { Provider as ReduxProvider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

import { RootStackParamList, TabParamList } from '../types';
import { store, persistor } from '../store';
import { theme } from '../utils/theme';

// Screens
import AuthScreen from '../screens/AuthScreen';
import ScheduleScreen from '../screens/ScheduleScreen';
import NewsScreen from '../screens/NewsScreen';
import HomeworkScreen from '../screens/HomeworkScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import NewsDetailScreen from '../screens/NewsDetailScreen';
import HomeworkDetailScreen from '../screens/HomeworkDetailScreen';

// Components
import TabBarIcon from '../components/TabBarIcon';
import LoadingScreen from '../components/LoadingScreen';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => (
          <TabBarIcon route={route.name} focused={focused} color={color} size={size} />
        ),
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outline,
        },
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.onSurface,
      })}
    >
      <Tab.Screen 
        name="ScheduleTab" 
        component={ScheduleScreen} 
        options={{ title: 'Расписание' }} 
      />
      <Tab.Screen 
        name="NewsTab" 
        component={NewsScreen} 
        options={{ title: 'Новости' }} 
      />
      <Tab.Screen 
        name="HomeworkTab" 
        component={HomeworkScreen} 
        options={{ title: 'ДЗ' }} 
      />
      <Tab.Screen 
        name="NotificationsTab" 
        component={NotificationsScreen} 
        options={{ title: 'Уведомления' }} 
      />
      <Tab.Screen 
        name="SettingsTab" 
        component={SettingsScreen} 
        options={{ title: 'Настройки' }} 
      />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.onSurface,
      }}
    >
      <Stack.Screen 
        name="Auth" 
        component={AuthScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="Main" 
        component={TabNavigator} 
        options={{ headerShown: false }} 
      />
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
}

export default function App() {
  return (
    <ReduxProvider store={store}>
      <PersistGate loading={<LoadingScreen />} persistor={persistor}>
        <PaperProvider theme={theme}>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </PaperProvider>
      </PersistGate>
    </ReduxProvider>
  );
}



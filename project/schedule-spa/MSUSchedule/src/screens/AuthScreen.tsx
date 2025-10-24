import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Linking } from 'react-native';
import { Text, Button, Card, ActivityIndicator } from 'react-native-paper';
import { WebView } from 'react-native-webview';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootState } from '../store';
import { RootStackParamList } from '../types';
import { loginStart, loginSuccess, loginFailure } from '../store/slices/authSlice';
import telegramAuthService from '../services/TelegramAuthService';
import { theme } from '../utils/theme';
import { CONFIG } from '../config';

type AuthScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Auth'>;

const AuthScreen: React.FC = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation<AuthScreenNavigationProp>();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);
  
  const [showWebView, setShowWebView] = useState(false);
  const [webViewUrl, setWebViewUrl] = useState('');

  useEffect(() => {
    checkExistingAuth();
  }, []);

  const checkExistingAuth = async () => {
    try {
      const authResult = await telegramAuthService.checkAuthOnStartup();
      if (authResult.isAuthenticated && authResult.user && authResult.token) {
        dispatch(loginSuccess({ user: authResult.user, token: authResult.token }));
        navigation.replace('Main');
      }
    } catch (error) {
      console.error('Ошибка проверки авторизации:', error);
    }
  };

  const handleTelegramAuth = () => {
    // Открываем Telegram WebApp для авторизации
    const telegramUrl = CONFIG.TELEGRAM_WEBAPP_URL;
    setWebViewUrl(telegramUrl);
    setShowWebView(true);
  };

  const handleWebViewMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'telegram_auth' && data.initData) {
        dispatch(loginStart());
        
        try {
          const authResult = await telegramAuthService.authenticateWithTelegram(data.initData);
          dispatch(loginSuccess(authResult));
          setShowWebView(false);
          navigation.replace('Main');
        } catch (error) {
          dispatch(loginFailure('Ошибка авторизации через Telegram'));
        }
      }
    } catch (error) {
      console.error('Ошибка обработки сообщения WebView:', error);
    }
  };

  const handleOpenTelegramApp = () => {
    const telegramAppUrl = CONFIG.TELEGRAM_APP_URL;
    const telegramWebUrl = CONFIG.TELEGRAM_WEBAPP_URL;
    
    Linking.canOpenURL(telegramAppUrl).then((supported) => {
      if (supported) {
        Linking.openURL(telegramAppUrl);
      } else {
        Linking.openURL(telegramWebUrl);
      }
    });
  };

  if (showWebView) {
    return (
      <View style={styles.container}>
        <WebView
          source={{ uri: webViewUrl }}
          onMessage={handleWebViewMessage}
          style={styles.webView}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" />
              <Text style={styles.loadingText}>Загрузка Telegram...</Text>
            </View>
          )}
        />
        <Button
          mode="outlined"
          onPress={() => setShowWebView(false)}
          style={styles.cancelButton}
        >
          Отмена
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Расписание МГУ</Text>
        <Text style={styles.subtitle}>Войдите через Telegram для доступа к расписанию</Text>
        
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>Авторизация</Text>
            <Text style={styles.cardText}>
              Для использования приложения необходимо войти через Telegram.
              Это обеспечивает безопасность и персонализацию.
            </Text>
            
            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}
            
            <View style={styles.buttonContainer}>
              <Button
                mode="contained"
                onPress={handleTelegramAuth}
                loading={isLoading}
                disabled={isLoading}
                style={styles.authButton}
                icon="telegram"
              >
                Войти через Telegram
              </Button>
              
              <Button
                mode="outlined"
                onPress={handleOpenTelegramApp}
                style={styles.telegramButton}
                icon="open-in-app"
              >
                Открыть в Telegram
              </Button>
            </View>
          </Card.Content>
        </Card>
        
        <Text style={styles.footerText}>
          Приложение для студентов МГУ
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 40,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    marginBottom: 40,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: 12,
  },
  cardText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 20,
    lineHeight: 20,
  },
  errorText: {
    fontSize: 14,
    color: theme.colors.error,
    marginBottom: 16,
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 12,
  },
  authButton: {
    marginBottom: 8,
  },
  telegramButton: {
    marginBottom: 8,
  },
  footerText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
  },
  cancelButton: {
    margin: 20,
  },
});

export default AuthScreen;

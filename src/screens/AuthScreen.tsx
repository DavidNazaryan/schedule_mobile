import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Linking,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Text, Button, Card, ActivityIndicator, TextInput, HelperText } from 'react-native-paper';
import { FontAwesome5 } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RootState } from '@/store';
import { RootStackParamList } from '@/types';
import { loginStart, loginSuccess, loginFailure, loginGuest } from '@/store/slices/authSlice';
import telegramAuthService from '@/services/TelegramAuthService';
import { theme } from '@/utils/theme';
import { CONFIG } from '@/config';

type AuthScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Auth'>;

const AuthScreen: React.FC = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation<AuthScreenNavigationProp>();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const [showWebView, setShowWebView] = useState(false);
  const [webViewUrl, setWebViewUrl] = useState('');

  const [showGuestForm, setShowGuestForm] = useState(false);
  const [guestFirstName, setGuestFirstName] = useState('');
  const [guestLastName, setGuestLastName] = useState('');
  const [guestGroup, setGuestGroup] = useState('');
  const [guestError, setGuestError] = useState<string | null>(null);

  const renderTelegramIcon = useCallback(
    ({ size, color }: { size: number; color: string }) => (
      <FontAwesome5 name="telegram-plane" size={size} color={color} />
    ),
    []
  );

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
    } catch (err) {
      console.error('Ошибка проверки авторизации:', err);
    }
  };

  const handleTelegramAuth = () => {
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
        } catch (authError) {
          dispatch(loginFailure('Ошибка авторизации через Telegram'));
        }
      }
    } catch (err) {
      console.error('Ошибка обработки сообщения из WebView:', err);
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

  const handleGuestContinue = () => {
    if (!guestFirstName.trim()) {
      setGuestError('Пожалуйста, введите имя');
      return;
    }

    dispatch(
      loginGuest({
        firstName: guestFirstName.trim(),
        lastName: guestLastName.trim(),
        username: '',
        groupId: guestGroup.trim(),
      })
    );

    setGuestFirstName('');
    setGuestLastName('');
    setGuestGroup('');
    setGuestError(null);
    setShowGuestForm(false);
    navigation.replace('Main');
  };

  const handleGuestCancel = () => {
    setShowGuestForm(false);
    setGuestFirstName('');
    setGuestLastName('');
    setGuestGroup('');
    setGuestError(null);
  };

  const renderGuestForm = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={styles.cardTitle}>Войти без Telegram</Text>
        <Text style={styles.cardText}>
          Вы сможете просматривать офлайн-данные. Для доступа к актуальному расписанию и уведомлениям
          понадобится авторизация через Telegram.
        </Text>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.guestForm}
        >
          <TextInput
            label="Имя"
            value={guestFirstName}
            onChangeText={(value) => {
              setGuestError(null);
              setGuestFirstName(value);
            }}
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="Фамилия (необязательно)"
            value={guestLastName}
            onChangeText={setGuestLastName}
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="Группа (необязательно)"
            value={guestGroup}
            onChangeText={setGuestGroup}
            mode="outlined"
            style={styles.input}
          />
          {guestError && <HelperText type="error">{guestError}</HelperText>}

          <View style={styles.guestButtons}>
            <Button mode="contained" onPress={handleGuestContinue} style={styles.guestSubmitButton}>
              Продолжить
            </Button>
            <Button mode="text" onPress={handleGuestCancel}>
              Отмена
            </Button>
              </View>
        </KeyboardAvoidingView>
      </Card.Content>
    </Card>
  );

  if (showWebView) {
    return (
      <View style={styles.webViewContainer}>
        <WebView
          source={{ uri: webViewUrl }}
          onMessage={handleWebViewMessage}
          style={styles.webView}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" />
              <Text style={styles.loadingText}>Загрузка Telegram...</Text>
                </View>
          )}
        />
        <Button mode="outlined" onPress={() => setShowWebView(false)} style={styles.cancelButton}>
          Закрыть
        </Button>
          </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.select({ ios: 'padding', android: 'height' })}
        keyboardVerticalOffset={Platform.select({ ios: 24, android: 0 })}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
          <Text style={styles.title}>Расписание МГУ</Text>
          <Text style={styles.subtitle}>
            Войдите через Telegram, чтобы получить актуальное расписание, домашку и уведомления
          </Text>

          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.cardTitle}>Авторизация</Text>
              <Text style={styles.cardText}>
                Для использования приложения рекомендуется войти через Telegram. Так вы сохраните свои данные онлайн и
                получите доступ к группам.
              </Text>

              {error && <Text style={styles.errorText}>{error}</Text>}

              <View style={styles.buttonContainer}>
                <Button
                  mode="contained"
                  onPress={handleTelegramAuth}
                  loading={isLoading}
                  disabled={isLoading}
                  style={styles.authButton}
                  icon={renderTelegramIcon}
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

          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.cardTitle}>Нет Telegram?</Text>
              <Text style={styles.cardText}>
                Вы можете продолжить без него. Некоторые функции (актуальное расписание, уведомления) будут недоступны.
              </Text>
              <Button mode="text" onPress={() => setShowGuestForm((prev) => !prev)}>
                {showGuestForm ? 'Скрыть форму' : 'Войти без Telegram'}
              </Button>
            </Card.Content>
          </Card>

          {showGuestForm && renderGuestForm()}

          <Text style={styles.footerText}>Приложение для студентов МГУ</Text>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
  },
  content: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
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
    marginBottom: 24,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    marginBottom: 20,
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
  webViewContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
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
  guestForm: {
    marginTop: 8,
    gap: 12,
  },
  input: {
    backgroundColor: theme.colors.surface,
  },
  guestButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  guestSubmitButton: {
    flex: 1,
    marginRight: 8,
  },
});

export default AuthScreen;

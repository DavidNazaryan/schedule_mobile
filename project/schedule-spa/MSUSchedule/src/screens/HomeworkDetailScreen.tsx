import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, Card, ActivityIndicator } from 'react-native-paper';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';

import { RootState } from '../store';
import { RootStackParamList, HomeworkTask } from '../types';
import { addTask, updateTask } from '../store/slices/homeworkSlice';
import { addHomework, updateHomework, deleteHomework } from '../api/scheduleApi';
import { theme } from '../utils/theme';

type HomeworkDetailScreenRouteProp = RouteProp<RootStackParamList, 'HomeworkDetail'>;
type HomeworkDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'HomeworkDetail'>;

interface HomeworkDetailScreenProps {
  route: HomeworkDetailScreenRouteProp;
  navigation: HomeworkDetailScreenNavigationProp;
}

const HomeworkDetailScreen: React.FC<HomeworkDetailScreenProps> = ({ route, navigation }) => {
  const dispatch = useDispatch();
  const { task } = route.params;
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [homeworkText, setHomeworkText] = useState(task.homework_text);
  const [lessonId, setLessonId] = useState(task.lesson_id);
  const [loading, setLoading] = useState(false);
  const [isEditing] = useState(task.id > 0);

  const canEdit = user?.role === 'monitor' || user?.role === 'admin';

  useEffect(() => {
    navigation.setOptions({
      title: isEditing ? 'Редактировать ДЗ' : 'Добавить ДЗ',
    });
  }, [isEditing, navigation]);

  const handleSave = async () => {
    if (!homeworkText.trim()) {
      Alert.alert('Ошибка', 'Введите текст домашнего задания');
      return;
    }

    if (!lessonId.trim()) {
      Alert.alert('Ошибка', 'Введите ID занятия');
      return;
    }

    setLoading(true);

    try {
      if (isEditing) {
        const response = await updateHomework(lessonId, task.group_id, homeworkText);
        if (response.success && response.homework) {
          dispatch(updateTask(response.homework));
          navigation.goBack();
        } else {
          Alert.alert('Ошибка', response.message);
        }
      } else {
        const response = await addHomework(lessonId, task.group_id, homeworkText);
        if (response.success && response.homework) {
          dispatch(addTask(response.homework));
          navigation.goBack();
        } else {
          Alert.alert('Ошибка', response.message);
        }
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось сохранить домашнее задание');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditing) return;

    Alert.alert(
      'Удалить домашнее задание',
      'Вы уверены, что хотите удалить это домашнее задание?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const response = await deleteHomework(lessonId, task.group_id);
              if (response.success) {
                navigation.goBack();
              } else {
                Alert.alert('Ошибка', response.message);
              }
            } catch (error) {
              Alert.alert('Ошибка', 'Не удалось удалить домашнее задание');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.label}>ID занятия</Text>
          <TextInput
            value={lessonId}
            onChangeText={setLessonId}
            placeholder="Введите ID занятия"
            style={styles.input}
            editable={canEdit}
          />
          
          <Text style={styles.label}>Группа</Text>
          <TextInput
            value={task.group_id}
            editable={false}
            style={[styles.input, styles.disabledInput]}
          />
          
          <Text style={styles.label}>Домашнее задание</Text>
          <TextInput
            value={homeworkText}
            onChangeText={setHomeworkText}
            placeholder="Введите текст домашнего задания"
            multiline
            numberOfLines={6}
            style={styles.textArea}
            editable={canEdit}
          />
          
          <View style={styles.buttonContainer}>
            {canEdit && (
              <>
                <Button
                  mode="contained"
                  onPress={handleSave}
                  loading={loading}
                  disabled={loading}
                  style={styles.saveButton}
                >
                  {isEditing ? 'Сохранить' : 'Добавить'}
                </Button>
                
                {isEditing && (
                  <Button
                    mode="outlined"
                    onPress={handleDelete}
                    loading={loading}
                    disabled={loading}
                    style={styles.deleteButton}
                    buttonColor={theme.colors.errorContainer}
                    textColor={theme.colors.onErrorContainer}
                  >
                    Удалить
                  </Button>
                )}
              </>
            )}
          </View>
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
    elevation: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: theme.colors.surface,
    marginBottom: 8,
  },
  disabledInput: {
    backgroundColor: theme.colors.surfaceVariant,
  },
  textArea: {
    backgroundColor: theme.colors.surface,
    marginBottom: 16,
    minHeight: 120,
  },
  buttonContainer: {
    gap: 12,
    marginTop: 16,
  },
  saveButton: {
    marginBottom: 8,
  },
  deleteButton: {
    marginBottom: 8,
  },
});

export default HomeworkDetailScreen;



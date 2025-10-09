import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Dimensions,
  Platform,
  Switch,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationService } from './services/NotificationService';

const { width, height } = Dimensions.get('window');

interface ScheduleEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  color: string;
  reminder: boolean;
  notificationId?: string;
}

const colors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
];

export default function App() {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    color: colors[0],
    reminder: false,
  });

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const savedEvents = await AsyncStorage.getItem('scheduleEvents');
      if (savedEvents) {
        setEvents(JSON.parse(savedEvents));
      }
    } catch (error) {
      console.error('Ошибка загрузки событий:', error);
    }
  };

  const saveEvents = async (newEvents: ScheduleEvent[]) => {
    try {
      await AsyncStorage.setItem('scheduleEvents', JSON.stringify(newEvents));
      setEvents(newEvents);
    } catch (error) {
      console.error('Ошибка сохранения событий:', error);
    }
  };

  const addEvent = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Ошибка', 'Пожалуйста, введите название события');
      return;
    }

    let notificationId: string | null = null;
    
    // Создаем уведомление если включено напоминание
    if (formData.reminder && formData.date && formData.time) {
      notificationId = await NotificationService.createEventReminder(
        formData.title,
        formData.date,
        formData.time,
        15 // напоминание за 15 минут
      );
    }

    const newEvent: ScheduleEvent = {
      id: Date.now().toString(),
      ...formData,
      notificationId: notificationId || undefined,
    };

    const updatedEvents = [...events, newEvent];
    saveEvents(updatedEvents);
    resetForm();
    setModalVisible(false);
  };

  const editEvent = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Ошибка', 'Пожалуйста, введите название события');
      return;
    }

    // Отменяем старое уведомление если оно было
    if (editingEvent?.notificationId) {
      await NotificationService.cancelNotification(editingEvent.notificationId);
    }

    let notificationId: string | null = null;
    
    // Создаем новое уведомление если включено напоминание
    if (formData.reminder && formData.date && formData.time) {
      notificationId = await NotificationService.createEventReminder(
        formData.title,
        formData.date,
        formData.time,
        15 // напоминание за 15 минут
      );
    }

    const updatedEvents = events.map(event =>
      event.id === editingEvent?.id 
        ? { ...event, ...formData, notificationId: notificationId || undefined }
        : event
    );
    saveEvents(updatedEvents);
    resetForm();
    setModalVisible(false);
    setEditingEvent(null);
  };

  const deleteEvent = async (id: string) => {
    Alert.alert(
      'Удалить событие',
      'Вы уверены, что хотите удалить это событие?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            const eventToDelete = events.find(event => event.id === id);
            
            // Отменяем уведомление если оно было
            if (eventToDelete?.notificationId) {
              await NotificationService.cancelNotification(eventToDelete.notificationId);
            }
            
            const updatedEvents = events.filter(event => event.id !== id);
            saveEvents(updatedEvents);
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      date: '',
      time: '',
      color: colors[0],
      reminder: false,
    });
  };

  const openEditModal = (event: ScheduleEvent) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      color: event.color,
      reminder: event.reminder,
    });
    setModalVisible(true);
  };

  const getTodayEvents = () => {
    const today = new Date().toISOString().split('T')[0];
    return events.filter(event => event.date === today);
  };

  const getUpcomingEvents = () => {
    const today = new Date().toISOString().split('T')[0];
    return events.filter(event => event.date >= today).slice(0, 5);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    return timeString || 'Без времени';
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header с градиентом */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Мое Расписание</Text>
        <Text style={styles.headerSubtitle}>
          {new Date().toLocaleDateString('ru-RU', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Статистика */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{getTodayEvents().length}</Text>
            <Text style={styles.statLabel}>Сегодня</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{events.length}</Text>
            <Text style={styles.statLabel}>Всего событий</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{getUpcomingEvents().length}</Text>
            <Text style={styles.statLabel}>Предстоящие</Text>
          </View>
        </View>

        {/* События на сегодня */}
        {getTodayEvents().length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Сегодня</Text>
            {getTodayEvents().map((event) => (
              <TouchableOpacity
                key={event.id}
                style={[styles.eventCard, { borderLeftColor: event.color }]}
                onPress={() => openEditModal(event)}
                onLongPress={() => deleteEvent(event.id)}
              >
                <View style={styles.eventContent}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  {event.description && (
                    <Text style={styles.eventDescription}>{event.description}</Text>
                  )}
                  <Text style={styles.eventTime}>{formatTime(event.time)}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Предстоящие события */}
        {getUpcomingEvents().length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Предстоящие события</Text>
            {getUpcomingEvents().map((event) => (
              <TouchableOpacity
                key={event.id}
                style={[styles.eventCard, { borderLeftColor: event.color }]}
                onPress={() => openEditModal(event)}
                onLongPress={() => deleteEvent(event.id)}
              >
                <View style={styles.eventContent}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  {event.description && (
                    <Text style={styles.eventDescription}>{event.description}</Text>
                  )}
                  <Text style={styles.eventDate}>{formatDate(event.date)}</Text>
                  <Text style={styles.eventTime}>{formatTime(event.time)}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Пустое состояние */}
        {events.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={80} color="#ccc" />
            <Text style={styles.emptyStateTitle}>Нет событий</Text>
            <Text style={styles.emptyStateSubtitle}>
              Нажмите кнопку "+" чтобы добавить первое событие
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Кнопка добавления */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          resetForm();
          setEditingEvent(null);
          setModalVisible(true);
        }}
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>

      {/* Модальное окно для добавления/редактирования */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingEvent ? 'Редактировать событие' : 'Новое событие'}
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form}>
              <Text style={styles.inputLabel}>Название *</Text>
              <TextInput
                style={styles.input}
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
                placeholder="Введите название события"
                placeholderTextColor="#999"
              />

              <Text style={styles.inputLabel}>Описание</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Добавьте описание (необязательно)"
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
              />

              <Text style={styles.inputLabel}>Дата</Text>
              <TextInput
                style={styles.input}
                value={formData.date}
                onChangeText={(text) => setFormData({ ...formData, date: text })}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#999"
              />

              <Text style={styles.inputLabel}>Время</Text>
              <TextInput
                style={styles.input}
                value={formData.time}
                onChangeText={(text) => setFormData({ ...formData, time: text })}
                placeholder="HH:MM"
                placeholderTextColor="#999"
              />

              <Text style={styles.inputLabel}>Цвет</Text>
              <View style={styles.colorPicker}>
                {colors.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      formData.color === color && styles.selectedColor,
                    ]}
                    onPress={() => setFormData({ ...formData, color })}
                  />
                ))}
              </View>

              <View style={styles.switchContainer}>
                <Text style={styles.inputLabel}>Напоминание</Text>
                <Switch
                  value={formData.reminder}
                  onValueChange={(value) => setFormData({ ...formData, reminder: value })}
                  trackColor={{ false: '#ddd', true: '#667eea' }}
                  thumbColor={formData.reminder ? '#fff' : '#f4f3f4'}
                />
              </View>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={editingEvent ? editEvent : addEvent}
              >
                <Text style={styles.saveButtonText}>
                  {editingEvent ? 'Сохранить изменения' : 'Добавить событие'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  eventCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  eventDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  eventDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  eventTime: {
    fontSize: 12,
    color: '#999',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  addButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: height * 0.8,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  form: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    margin: 5,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: '#333',
    borderWidth: 3,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 10,
  },
  saveButton: {
    backgroundColor: '#667eea',
    borderRadius: 15,
    padding: 18,
    alignItems: 'center',
    marginTop: 30,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
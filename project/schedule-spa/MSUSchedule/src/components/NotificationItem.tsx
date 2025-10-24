import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Chip, IconButton } from 'react-native-paper';
import { NotificationItem, NotificationType } from '../types';
import { theme } from '../utils/theme';

interface NotificationItemProps {
  notification: NotificationItem;
  onPress?: (notification: NotificationItem) => void;
  onMarkAsRead?: (notification: NotificationItem) => void;
}

const NotificationItemComponent: React.FC<NotificationItemProps> = ({
  notification,
  onPress,
  onMarkAsRead,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeInfo = (type: NotificationType) => {
    switch (type) {
      case NotificationType.HOMEWORK_ASSIGNED:
        return { icon: 'book-plus', color: theme.colors.primary, label: 'ДЗ' };
      case NotificationType.HOMEWORK_UPDATED:
        return { icon: 'book-edit', color: theme.colors.secondary, label: 'ДЗ' };
      case NotificationType.HOMEWORK_DELETED:
        return { icon: 'book-remove', color: theme.colors.error, label: 'ДЗ' };
      case NotificationType.SCHEDULE_CHANGED:
        return { icon: 'calendar-edit', color: theme.colors.tertiary, label: 'Расписание' };
      case NotificationType.NEW_GROUP_MEMBER:
        return { icon: 'account-plus', color: theme.colors.primary, label: 'Группа' };
      case NotificationType.ROLE_CHANGED:
        return { icon: 'account-cog', color: theme.colors.secondary, label: 'Роль' };
      case NotificationType.SYSTEM_ANNOUNCEMENT:
        return { icon: 'bullhorn', color: theme.colors.tertiary, label: 'Система' };
      case NotificationType.REMINDER:
        return { icon: 'bell', color: theme.colors.outline, label: 'Напоминание' };
      default:
        return { icon: 'bell', color: theme.colors.outline, label: 'Уведомление' };
    }
  };

  const typeInfo = getTypeInfo(notification.type);

  return (
    <Card 
      style={[
        styles.card,
        !notification.sent && styles.unreadCard
      ]} 
      onPress={() => onPress?.(notification)}
      mode="outlined"
    >
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.typeContainer}>
            <Chip
              icon={typeInfo.icon}
              style={[styles.typeChip, { backgroundColor: typeInfo.color }]}
              textStyle={styles.typeText}
            >
              {typeInfo.label}
            </Chip>
            {!notification.sent && (
              <View style={styles.unreadDot} />
            )}
          </View>
          
          <View style={styles.actions}>
            <Text style={styles.date}>{formatDate(notification.created_at)}</Text>
            {!notification.sent && (
              <IconButton
                icon="check"
                size={16}
                onPress={() => onMarkAsRead?.(notification)}
                style={styles.markButton}
              />
            )}
          </View>
        </View>
        
        <Text style={styles.title}>{notification.title}</Text>
        <Text style={styles.message}>{notification.message}</Text>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 2,
    marginHorizontal: 16,
    elevation: 1,
  },
  unreadCard: {
    backgroundColor: theme.colors.primaryContainer,
    borderColor: theme.colors.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeChip: {
    borderRadius: 12,
  },
  typeText: {
    color: theme.colors.onPrimary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    marginLeft: 8,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  markButton: {
    margin: 0,
    marginLeft: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: 4,
  },
  message: {
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 18,
  },
});

export default NotificationItemComponent;



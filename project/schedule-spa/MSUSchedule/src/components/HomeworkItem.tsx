import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Chip, IconButton } from 'react-native-paper';
import { HomeworkTask } from '../types';
import { theme } from '../utils/theme';

interface HomeworkItemProps {
  task: HomeworkTask;
  onEdit?: (task: HomeworkTask) => void;
  onDelete?: (task: HomeworkTask) => void;
  canEdit?: boolean;
}

const HomeworkItem: React.FC<HomeworkItemProps> = ({
  task,
  onEdit,
  onDelete,
  canEdit = false,
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

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'лекция':
        return theme.colors.primary;
      case 'семинар':
        return theme.colors.secondary;
      case 'лабораторная':
        return theme.colors.tertiary;
      default:
        return theme.colors.outline;
    }
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.lessonInfo}>
            <Text style={styles.lessonId}>Занятие {task.lesson_id}</Text>
            <Text style={styles.groupId}>Группа {task.group_id}</Text>
          </View>
          
          <View style={styles.actions}>
            {canEdit && (
              <>
                <IconButton
                  icon="pencil"
                  size={20}
                  onPress={() => onEdit?.(task)}
                  style={styles.actionButton}
                />
                <IconButton
                  icon="delete"
                  size={20}
                  onPress={() => onDelete?.(task)}
                  style={styles.actionButton}
                />
              </>
            )}
          </View>
        </View>
        
        <Text style={styles.homeworkText}>{task.homework_text}</Text>
        
        <View style={styles.footer}>
          <Text style={styles.date}>
            Создано: {formatDate(task.created_at)}
          </Text>
          {task.updated_at !== task.created_at && (
            <Text style={styles.date}>
              Обновлено: {formatDate(task.updated_at)}
            </Text>
          )}
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 4,
    marginHorizontal: 16,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  lessonInfo: {
    flex: 1,
  },
  lessonId: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  groupId: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    margin: 0,
    marginLeft: 4,
  },
  homeworkText: {
    fontSize: 14,
    color: theme.colors.onSurface,
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outlineVariant,
  },
  date: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
});

export default HomeworkItem;



import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Chip, IconButton } from 'react-native-paper';
import { ScheduleItem } from '../types';
import { theme } from '../utils/theme';

interface ScheduleCardProps {
  item: ScheduleItem;
  onHomeworkPress?: (item: ScheduleItem) => void;
  canEditHomework?: boolean;
}

const ScheduleCard: React.FC<ScheduleCardProps> = ({
  item,
  onHomeworkPress,
  canEditHomework = false,
}) => {
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

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'лекция':
        return 'presentation';
      case 'семинар':
        return 'account-group';
      case 'лабораторная':
        return 'flask';
      default:
        return 'book';
    }
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.timeContainer}>
            <Text style={styles.time}>{item.time}</Text>
          </View>
          <Chip
            icon={getTypeIcon(item.type)}
            style={[styles.typeChip, { backgroundColor: getTypeColor(item.type) }]}
            textStyle={styles.typeText}
          >
            {item.type}
          </Chip>
        </View>
        
        <Text style={styles.title}>{item.title}</Text>
        
        <View style={styles.details}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Преподаватель:</Text>
            <Text style={styles.detailValue}>{item.teacher}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Аудитория:</Text>
            <Text style={styles.detailValue}>{item.room}</Text>
          </View>
        </View>
        
        {canEditHomework && (
          <View style={styles.homeworkContainer}>
            <IconButton
              icon="plus"
              size={20}
              onPress={() => onHomeworkPress?.(item)}
              style={styles.homeworkButton}
            />
            <Text style={styles.homeworkText}>Добавить ДЗ</Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 4,
    marginHorizontal: 16,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeContainer: {
    backgroundColor: theme.colors.primaryContainer,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  time: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.onPrimaryContainer,
  },
  typeChip: {
    borderRadius: 16,
  },
  typeText: {
    color: theme.colors.onPrimary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: 12,
  },
  details: {
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginRight: 8,
    minWidth: 100,
  },
  detailValue: {
    fontSize: 14,
    color: theme.colors.onSurface,
    flex: 1,
  },
  homeworkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outlineVariant,
  },
  homeworkButton: {
    margin: 0,
    marginRight: 8,
  },
  homeworkText: {
    fontSize: 14,
    color: theme.colors.primary,
  },
});

export default ScheduleCard;



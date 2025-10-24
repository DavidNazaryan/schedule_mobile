import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Card, Text, IconButton, useTheme } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { ScheduleItem } from '@/types';

interface ScheduleCardProps {
  item: ScheduleItem;
  onHomeworkPress?: (item: ScheduleItem) => void;
  canEditHomework?: boolean;
  showDateLabel?: boolean;
}

const formatLessonDate = (date: string): string => {
  try {
    const dateObject = new Date(`${date}T00:00:00`);
    const formatter = new Intl.DateTimeFormat('ru-RU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    const formatted = formatter.format(dateObject);
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  } catch {
    return date;
  }
};

const cleanRoomName = (room: string): string => {
  if (!room) return room;
  // Remove "Аудитория" and "Ауд." prefixes, keeping only the room name
  return room
    .replace(/^Аудитория\s*/i, '')
    .replace(/^Ауд\.\s*/i, '')
    .trim();
};

const isClassInProgress = (item: ScheduleItem): boolean => {
  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    
    // Check if the class is today
    if (item.date !== today) {
      return false;
    }
    
    // Try to parse startsAt and endsAt if available
    if (item.startsAt && item.endsAt) {
      const startTime = new Date(item.startsAt);
      const endTime = new Date(item.endsAt);
      return now >= startTime && now <= endTime;
    }
    
    // Fallback to parsing the time string (format: "10:00 - 11:30")
    if (item.time) {
      const timeMatch = item.time.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
      if (timeMatch) {
        const [, startHour, startMin, endHour, endMin] = timeMatch;
        
        const startTime = new Date(item.date);
        startTime.setHours(parseInt(startHour, 10), parseInt(startMin, 10), 0, 0);
        
        const endTime = new Date(item.date);
        endTime.setHours(parseInt(endHour, 10), parseInt(endMin, 10), 0, 0);
        
        return now >= startTime && now <= endTime;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking if class is in progress:', error);
    return false;
  }
};

const ScheduleCard: React.FC<ScheduleCardProps> = ({
  item,
  onHomeworkPress,
  canEditHomework = false,
  showDateLabel = true,
}) => {
  const theme = useTheme();
  const blinkAnim = useRef(new Animated.Value(1)).current;
  const inProgress = isClassInProgress(item);
  
  // Setup blinking animation
  useEffect(() => {
    if (inProgress) {
      const blinkAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(blinkAnim, {
            toValue: 0.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(blinkAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      blinkAnimation.start();
      return () => blinkAnimation.stop();
    } else {
      blinkAnim.setValue(1);
    }
  }, [inProgress, blinkAnim]);
  
  const getTypeGradient = (type: string): [string, string] => {
    const normalized = type?.trim().toLowerCase();

    // Check for lectures (лекция, лек, лк)
    if (normalized === 'лекция' || normalized === 'лек' || normalized === 'лк' || normalized.includes('лекц')) {
      return ['#f97316', '#fb923c']; // Orange gradient for lectures
    }

    // Check for seminars (семинар, сем, см)
    if (normalized === 'семинар' || normalized === 'сем' || normalized === 'см' || normalized.includes('семинар')) {
      return ['#3b82f6', '#60a5fa']; // Blue gradient for seminars
    }

    // Check for practice (практика, прак, пр)
    if (normalized === 'практика' || normalized === 'прак' || normalized === 'пр' || normalized.includes('практик')) {
      return ['#3b82f6', '#60a5fa']; // Blue gradient for practice (same as seminar)
    }

    // Check for lab (лабораторная, лаб, лб)
    if (normalized === 'лабораторная' || normalized === 'лабораторная работа' || normalized === 'лаб' || normalized === 'лб' || normalized.includes('лаборатор')) {
      return ['#8b5cf6', '#a78bfa']; // Purple gradient for labs
    }

    // Default gray gradient for unknown types
    console.warn('Unknown lesson type:', type);
    return ['#6b7280', '#9ca3af']; // Gray gradient for unknown types
  };

  const getTypeColor = (type: string) => {
    const gradient = getTypeGradient(type);
    return gradient[0]; // Return the first color for backward compatibility
  };

  const getTypeLabel = (type: string) => {
    const normalized = type?.trim().toLowerCase();

    // Check for lectures
    if (normalized === 'лекция' || normalized === 'лек' || normalized === 'лк' || normalized.includes('лекц')) {
      return 'Лек';
    }

    // Check for seminars
    if (normalized === 'семинар' || normalized === 'сем' || normalized === 'см' || normalized.includes('семинар')) {
      return 'Сем';
    }

    // Check for practice
    if (normalized === 'практика' || normalized === 'прак' || normalized === 'пр' || normalized.includes('практик')) {
      return 'Прак';
    }

    // Check for lab
    if (normalized === 'лабораторная' || normalized === 'лабораторная работа' || normalized === 'лаб' || normalized === 'лб' || normalized.includes('лаборатор')) {
      return 'Лаб';
    }

    // Return original type if not recognized
    return type;
  };

  const dateLabel = React.useMemo(() => formatLessonDate(item.date), [item.date]);
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const cardGradientColors = theme.dark 
    ? ['#1e293b', '#0f172a'] as const
    : ['#ffffff', '#f8fafc'] as const;

  return (
    <Card style={styles.card}>
      <LinearGradient
        colors={cardGradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        {showDateLabel && <Text style={styles.date}>{dateLabel}</Text>}

        <View style={styles.header}>
          {typeof item.pairNumber === 'number' && (
            <View style={styles.periodNumberContainer}>
              <Text style={[styles.periodNumber, inProgress && styles.periodNumberActive]}>
                {item.pairNumber} пара
              </Text>
              {inProgress && (
                <Animated.View 
                  style={[
                    styles.activeIndicator,
                    { opacity: blinkAnim }
                  ]} 
                />
              )}
            </View>
          )}
          <Text style={styles.time}>{item.time}</Text>
        </View>

        <Text style={styles.title}>{item.title}</Text>

        <View style={styles.details}>
          <Text style={styles.teacherName}>{item.teacher}</Text>
        </View>

        <View style={styles.footer}>
          {item.room && (
            <View style={styles.roomChip}>
              <Text style={styles.roomText}>{cleanRoomName(item.room)}</Text>
            </View>
          )}
          <LinearGradient
            colors={getTypeGradient(item.type)}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.typeChip}
          >
            <Text style={styles.typeText}>{getTypeLabel(item.type)}</Text>
          </LinearGradient>
        </View>

        {canEditHomework && (
          <View style={styles.homeworkContainer}>
            <IconButton
              icon='plus'
              size={20}
              onPress={() => onHomeworkPress?.(item)}
              style={styles.homeworkButton}
            />
            <Text style={styles.homeworkText}>Добавить ДЗ</Text>
          </View>
        )}
      </LinearGradient>
    </Card>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  card: {
    marginVertical: 4,
    marginHorizontal: 16,
    elevation: 4,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  cardGradient: {
    padding: 16,
    borderRadius: 12,
  },
  date: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  periodNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  periodNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  periodNumberActive: {
    color: '#ef4444', // Red color for active class
  },
  activeIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ef4444',
  },
  time: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  typeChip: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 50,
    minHeight: 26,
  },
  typeText: {
    color: '#ffffff',
    fontSize: 11,
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
  teacherName: {
    fontSize: 14,
    color: theme.colors.onSurface,
  },
  roomChip: {
    backgroundColor: theme.dark ? '#374151' : '#e5e7eb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.outline,
    minWidth: 50,
    minHeight: 26,
  },
  roomText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: theme.dark ? '#e5e7eb' : '#374151',
  },
  notes: {
    marginTop: 12,
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
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

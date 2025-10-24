import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Text, Card, IconButton, useTheme } from 'react-native-paper';

interface WeeklyCalendarProps {
  weekStart: Date;
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onCurrentWeek: () => void;
  isLoading?: boolean;
}

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({
  weekStart,
  selectedDate,
  onDateSelect,
  onPreviousWeek,
  onNextWeek,
  onCurrentWeek,
  isLoading = false,
}) => {
  const theme = useTheme();
  const addDays = (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    result.setHours(0, 0, 0, 0); // Ensure normalized to midnight
    return result;
  };

  const isSameDay = (date1: Date | null, date2: Date): boolean => {
    if (!date1) return false;
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return isSameDay(today, date);
  };

  const formatMonthYear = (start: Date, end: Date): string => {
    const startMonth = new Intl.DateTimeFormat('ru-RU', { month: 'long' }).format(start);
    const endMonth = new Intl.DateTimeFormat('ru-RU', { month: 'long' }).format(end);
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();

    const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

    if (startMonth === endMonth && startYear === endYear) {
      return `${capitalize(startMonth)} ${startYear}`;
    }

    if (startYear === endYear) {
      return `${capitalize(startMonth)} - ${capitalize(endMonth)} ${startYear}`;
    }

    return `${capitalize(startMonth)} ${startYear} - ${capitalize(endMonth)} ${endYear}`;
  };

  const weekEnd = addDays(weekStart, 5); // Saturday (6 days from Monday)
  const monthYearLabel = formatMonthYear(weekStart, weekEnd);
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const renderDayCell = (dayIndex: number) => {
    const date = addDays(weekStart, dayIndex);
    const isSelected = isSameDay(selectedDate, date);
    const isTodayDate = isToday(date);

    const handlePress = () => {
      const normalizedDate = new Date(date);
      normalizedDate.setHours(0, 0, 0, 0);
      onDateSelect(normalizedDate);
    };

    return (
      <TouchableOpacity
        key={dayIndex}
        style={[
          styles.dayCell,
          isSelected && styles.dayCellSelected,
          isTodayDate && !isSelected && styles.dayCellToday,
        ]}
        onPress={handlePress}
        disabled={isLoading}
      >
        <Text
          style={[
            styles.weekdayLabel,
            isSelected && styles.weekdayLabelSelected,
            isTodayDate && !isSelected && styles.weekdayLabelToday,
          ]}
        >
          {WEEKDAYS[dayIndex]}
        </Text>
        <Text
          style={[
            styles.dayNumber,
            isSelected && styles.dayNumberSelected,
            isTodayDate && !isSelected && styles.dayNumberToday,
          ]}
        >
          {date.getDate()}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Card style={styles.card}>
      <Card.Content style={styles.cardContent}>
        {/* Header with navigation */}
        <View style={styles.header}>
          <IconButton
            icon="chevron-left"
            size={24}
            onPress={onPreviousWeek}
            disabled={isLoading}
          />
          <View style={styles.headerCenter}>
            <Text style={styles.monthYearLabel}>{monthYearLabel}</Text>
            <TouchableOpacity onPress={onCurrentWeek} disabled={isLoading}>
              <Text style={styles.todayButton}>Сегодня</Text>
            </TouchableOpacity>
          </View>
          <IconButton
            icon="chevron-right"
            size={24}
            onPress={onNextWeek}
            disabled={isLoading}
          />
        </View>

        {/* Days grid */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.daysContainer}
        >
          {WEEKDAYS.map((_, index) => renderDayCell(index))}
        </ScrollView>
      </Card.Content>
    </Card>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    elevation: 2,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  cardContent: {
    paddingVertical: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  monthYearLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: 4,
  },
  todayButton: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 4,
  },
  dayCell: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    minWidth: 52,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceVariant,
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dayCellSelected: {
    backgroundColor: theme.colors.primary,
  },
  dayCellToday: {
    backgroundColor: theme.colors.primaryContainer,
    borderColor: theme.colors.primary,
  },
  weekdayLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.onSurfaceVariant,
    marginBottom: 4,
  },
  weekdayLabelSelected: {
    color: theme.colors.onPrimary,
  },
  weekdayLabelToday: {
    color: theme.colors.primary,
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  dayNumberSelected: {
    color: theme.colors.onPrimary,
  },
  dayNumberToday: {
    color: theme.colors.primary,
  },
});

export default WeeklyCalendar;


import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { View, StyleSheet, RefreshControl, SectionList, AppState, AppStateStatus } from 'react-native';
import { Text, Card, Button, ActivityIndicator, IconButton, useTheme } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import { StackNavigationProp } from '@react-navigation/stack';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  runOnJS,
  interpolate,
  Extrapolate,
  withDelay,
  useAnimatedReaction
} from 'react-native-reanimated';

import { RootState } from '../store';
import { RootStackParamList, ScheduleItem } from '../types';
import { 
  setLoading, 
  setCurrentSchedule,
  setError,
  setOfflineMode,
  setLastUpdated,
  setFullSchedule,
} from '../store/slices/scheduleSlice';
import { getSchedule } from '../api/scheduleApi';
import ScheduleCard from '../components/ScheduleCard';
import WeeklyCalendar from '../components/WeeklyCalendar';
import offlineService from '../services/OfflineService';

type ScheduleScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Schedule'>;

const getStartOfWeek = (baseDate: Date): Date => {
  const date = new Date(baseDate);
  date.setHours(0, 0, 0, 0); // Normalize first
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date;
};

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  result.setHours(0, 0, 0, 0); // Ensure normalized
  return result;
};

const capitalize = (value: string): string => {
  if (!value) {
    return value;
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const formatDateForApi = (value: Date): string => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatWeekRange = (start: Date, end: Date): string => {
  const startMonth = new Intl.DateTimeFormat('ru-RU', { month: 'long' }).format(start);
  const endMonth = new Intl.DateTimeFormat('ru-RU', { month: 'long' }).format(end);
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();

  if (startMonth === endMonth && startYear === endYear) {
    return capitalize(`${start.getDate()}-${end.getDate()} ${startMonth} ${startYear}`);
  }

  const startLabel = `${start.getDate()} ${startMonth} ${startYear}`;
  const endLabel = `${end.getDate()} ${endMonth} ${endYear}`;
  return `${capitalize(startLabel)} - ${capitalize(endLabel)}`;
};

const formatDaySectionLabel = (date: string): string => {
  try {
    const dateObject = new Date(`${date}T00:00:00`);
    const weekday = new Intl.DateTimeFormat('ru-RU', { weekday: 'long' }).format(dateObject);
    const dateLabel = new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
    }).format(dateObject);
    return capitalize(`${dateLabel}, ${weekday}`);
  } catch {
    return date;
  }
};

const getLessonSortValue = (lesson: ScheduleItem): number => {
  const extractTime = (value?: string | null): string | null => {
    if (!value) {
      return null;
    }

    if (value.includes('T')) {
      return value;
    }

    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      return value;
    }

    const match = value.match(/(\d{1,2}):(\d{2})/);
    if (match) {
      const hours = match[1].padStart(2, '0');
      const minutes = match[2];
      return `${hours}:${minutes}`;
    }

    return null;
  };

  const candidate =
    extractTime(lesson.startsAt) ??
    extractTime(lesson.time?.split('-')[0]?.trim() ?? null);

  if (candidate) {
    if (candidate.includes('T') || /^\d{4}-\d{2}-\d{2}/.test(candidate)) {
      return new Date(candidate).getTime();
    }

    return new Date(`${lesson.date}T${candidate}`).getTime();
  }

  return new Date(`${lesson.date}T00:00:00`).getTime();
};

type ScheduleSection = {
  title: string;
  date: string;
  data: (ScheduleItem | GapItem)[];
};

type GapItem = {
  isGap: true;
  id: string;
  pairNumber: number;
  date: string;
};

const ScheduleScreen: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigation = useNavigation<ScheduleScreenNavigationProp>();
  
  const {
    currentSchedule,
    fullSchedule,
    selectedFaculty,
    selectedCourse,
    selectedGroup,
    isLoading,
    error,
    isOffline,
  } = useSelector((state: RootState) => state.schedule);

  const { user } = useSelector((state: RootState) => state.auth);
  const { weekViewMode } = useSelector((state: RootState) => state.ui);
  const isFocused = useIsFocused();
  const hasUpdatedOnceRef = useRef(false);
  const preloadingRef = useRef(false);

  const [refreshing, setRefreshing] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return getStartOfWeek(today);
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
    // Initialize with today's date if it's a weekday (Mon-Sat), otherwise null
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to midnight
    const dayOfWeek = today.getDay();
    return (dayOfWeek >= 1 && dayOfWeek <= 6) ? today : null;
  });

  const currentWeekEnd = useMemo(() => addDays(currentWeekStart, 6), [currentWeekStart]);
  const weekRangeLabel = useMemo(
    () => formatWeekRange(currentWeekStart, currentWeekEnd),
    [currentWeekStart, currentWeekEnd]
  );

  const loadSchedule = useCallback(
    async (
      facultyId: string,
      courseId: string,
      groupId: string,
      weekStart: Date,
      weekEnd: Date,
      options: { showLoading?: boolean; forceRefresh?: boolean } = {}
    ) => {
      const { showLoading = true, forceRefresh = false } = options;
      console.log('[ScheduleScreen] loadSchedule called', {
        facultyId,
        courseId,
        groupId,
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        showLoading,
        forceRefresh,
      });

      const weekStartBoundary = new Date(weekStart);
      weekStartBoundary.setHours(0, 0, 0, 0);
      const weekEndBoundary = new Date(weekEnd);
      weekEndBoundary.setHours(23, 59, 59, 999);

      const filterByRange = (source: ScheduleItem[]): ScheduleItem[] =>
        source.filter((lesson) => {
          try {
            const lessonTime = new Date(`${lesson.date}T00:00:00`).getTime();
            return (
              lessonTime >= weekStartBoundary.getTime() &&
              lessonTime <= weekEndBoundary.getTime()
            );
          } catch {
            return false;
          }
        });

      // Check if we have data for the requested week range
      const hasDataForWeek = (schedule: ScheduleItem[]): boolean => {
        if (!schedule.length) return false;
        const filtered = filterByRange(schedule);
        // Consider having data if we have at least one lesson in the range
        return filtered.length > 0;
      };

      let workingSchedule = fullSchedule;

      if (!workingSchedule.length) {
        try {
          const cachedFull = await offlineService.getFullSchedule(groupId);
          if (cachedFull && cachedFull.length) {
            workingSchedule = cachedFull;
            dispatch(setFullSchedule(cachedFull));
          }
        } catch (cacheError) {
          console.error('Failed to read full cached schedule', cacheError);
        }
      }

      // Determine if we need to fetch from network
      // We should fetch if: forced refresh, first time, or we don't have data for this week
      const hasDataForThisWeek = hasDataForWeek(workingSchedule);
      const needsNetworkFetch = forceRefresh || !hasUpdatedOnceRef.current || !hasDataForThisWeek;

      console.log('[ScheduleScreen] Load decision:', {
        hasDataForThisWeek,
        needsNetworkFetch,
        forceRefresh,
        hasUpdatedOnce: hasUpdatedOnceRef.current,
        workingScheduleLength: workingSchedule.length,
        requestedRange: `${formatDateForApi(weekStartBoundary)} to ${formatDateForApi(weekEndBoundary)}`,
      });

      // Only update currentSchedule if showLoading is true (i.e., not a background preload)
      if (showLoading) {
        if (workingSchedule.length && hasDataForThisWeek) {
          const filtered = filterByRange(workingSchedule);
          dispatch(setCurrentSchedule(filtered));
          dispatch(setError(null));
          console.log('[ScheduleScreen] Applied cached schedule slice', {
            totalCached: workingSchedule.length,
            filteredCount: filtered.length,
            rangeStart: formatDateForApi(weekStartBoundary),
            rangeEnd: formatDateForApi(weekEndBoundary),
          });
        } else if (!needsNetworkFetch) {
          // No data and not fetching - clear the schedule
          console.log('[ScheduleScreen] No data for week and not fetching');
          dispatch(setCurrentSchedule([]));
        }
      } else {
        console.log('[ScheduleScreen] Background load - not updating currentSchedule');
      }

      let shouldHideSpinner = false;

      if (needsNetworkFetch && showLoading) {
        dispatch(setLoading(true));
        shouldHideSpinner = true;
      } else if (showLoading) {
        dispatch(setLoading(false));
      }

      if (needsNetworkFetch) {
        console.log('[ScheduleScreen] Starting network fetch for range:', {
          from: formatDateForApi(weekStartBoundary),
          to: formatDateForApi(weekEndBoundary),
        });
        
        try {
          const scheduleItems = await getSchedule(
            facultyId,
            courseId,
            groupId,
            formatDateForApi(weekStartBoundary),
            formatDateForApi(weekEndBoundary)
          );
          console.log('[ScheduleScreen] Fetched schedule from API:', {
            itemsCount: scheduleItems.length,
            dates: Array.from(new Set(scheduleItems.map(item => item.date))).sort(),
          });
          
          // Merge with existing schedule to preserve other weeks' data
          const mergedSchedule = [...workingSchedule];
          let addedCount = 0;
          let updatedCount = 0;
          
          scheduleItems.forEach(newItem => {
            const existingIndex = mergedSchedule.findIndex(item => item.id === newItem.id);
            if (existingIndex >= 0) {
              mergedSchedule[existingIndex] = newItem;
              updatedCount++;
            } else {
              mergedSchedule.push(newItem);
              addedCount++;
            }
          });
          
          console.log('[ScheduleScreen] Merge complete:', {
            added: addedCount,
            updated: updatedCount,
            totalSchedule: mergedSchedule.length,
          });
          
          workingSchedule = mergedSchedule;
          dispatch(setFullSchedule(mergedSchedule));
          
          // Only update currentSchedule if this is not a background load
          if (showLoading) {
            const filtered = filterByRange(mergedSchedule);
            dispatch(setCurrentSchedule(filtered));
            console.log('[ScheduleScreen] Updated currentSchedule with filtered data:', filtered.length);
          } else {
            console.log('[ScheduleScreen] Background load - fullSchedule updated but currentSchedule preserved');
          }
          
          dispatch(setError(null));
          dispatch(setOfflineMode(false));
          dispatch(setLastUpdated(new Date().toISOString()));
          await offlineService.cacheFullSchedule(groupId, mergedSchedule);
          hasUpdatedOnceRef.current = true;
          console.log('[ScheduleScreen] Network schedule applied successfully');
        } catch (error) {
          console.error('[ScheduleScreen] Failed to load schedule from API', {
            facultyId,
            courseId,
            groupId,
            error,
          });
          const filtered = filterByRange(workingSchedule);
          if (!filtered.length) {
            dispatch(setError('Ошибка загрузки расписания'));
          }
          if (!offlineService.isConnected()) {
            dispatch(setOfflineMode(true));
          }
        } finally {
          if (showLoading && shouldHideSpinner) {
            dispatch(setLoading(false));
            console.log('[ScheduleScreen] Spinner hidden after network request');
          }
        }
      } else if (!filterByRange(workingSchedule).length) {
        console.log('[ScheduleScreen] No data for this week range');
        dispatch(setError('Нет локальных данных расписания'));
      }
    },
    [dispatch, fullSchedule]
  );

  const preloadAdjacentWeeks = useCallback(
    async (
      facultyId: string,
      courseId: string,
      groupId: string,
      currentWeek: Date,
      weeksAhead: number = 3,
      weeksBehind: number = 2
    ) => {
      // Prevent multiple simultaneous preloads
      if (preloadingRef.current) {
        console.log('[ScheduleScreen] Preloading already in progress, skipping');
        return;
      }

      // Don't preload if offline
      if (isOffline) {
        console.log('[ScheduleScreen] Offline mode, skipping preload');
        return;
      }

      preloadingRef.current = true;
      console.log('[ScheduleScreen] Starting background preload', { weeksAhead, weeksBehind });

      try {
        const preloadPromises: Promise<void>[] = [];

        // Preload weeks ahead
        for (let i = 1; i <= weeksAhead; i++) {
          const weekStart = addDays(currentWeek, i * 7);
          const weekEnd = addDays(weekStart, 6);
          
          preloadPromises.push(
            loadSchedule(facultyId, courseId, groupId, weekStart, weekEnd, {
              showLoading: false,
              forceRefresh: false,
            }).catch(error => {
              console.error(`[ScheduleScreen] Failed to preload week +${i}`, error);
            })
          );
        }

        // Preload weeks behind
        for (let i = 1; i <= weeksBehind; i++) {
          const weekStart = addDays(currentWeek, -i * 7);
          const weekEnd = addDays(weekStart, 6);
          
          preloadPromises.push(
            loadSchedule(facultyId, courseId, groupId, weekStart, weekEnd, {
              showLoading: false,
              forceRefresh: false,
            }).catch(error => {
              console.error(`[ScheduleScreen] Failed to preload week -${i}`, error);
            })
          );
        }

        // Load all weeks in parallel
        await Promise.allSettled(preloadPromises);
        console.log('[ScheduleScreen] Background preload completed');
      } finally {
        preloadingRef.current = false;
      }
    },
    [loadSchedule, isOffline]
  );

  useEffect(() => {
    const updateOfflineStatus = (connected: boolean, reachable: boolean | null | undefined) => {
      const isOfflineStatus = !(connected && (reachable === null || reachable === undefined || reachable));
      dispatch(setOfflineMode(isOfflineStatus));
    };

    NetInfo.fetch().then((state) => {
      updateOfflineStatus(state.isConnected ?? false, state.isInternetReachable);
    });

    const unsubscribe = NetInfo.addEventListener((state) => {
      updateOfflineStatus(state.isConnected ?? false, state.isInternetReachable);
    });

    return () => {
      unsubscribe();
    };
  }, [dispatch]);

  // Effect to update currentSchedule when week changes or fullSchedule updates
  useEffect(() => {
    if (fullSchedule.length && currentWeekStart) {
      const weekStartBoundary = new Date(currentWeekStart);
      weekStartBoundary.setHours(0, 0, 0, 0);
      const weekEndBoundary = new Date(currentWeekEnd);
      weekEndBoundary.setHours(23, 59, 59, 999);

      const filtered = fullSchedule.filter((lesson) => {
        try {
          const lessonTime = new Date(`${lesson.date}T00:00:00`).getTime();
          return (
            lessonTime >= weekStartBoundary.getTime() &&
            lessonTime <= weekEndBoundary.getTime()
          );
        } catch {
          return false;
        }
      });

      console.log('[ScheduleScreen] Week/fullSchedule changed, updating currentSchedule:', {
        weekStart: formatDateForApi(weekStartBoundary),
        weekEnd: formatDateForApi(weekEndBoundary),
        availableCount: filtered.length,
        totalInFull: fullSchedule.length,
      });

      dispatch(setCurrentSchedule(filtered));
      if (filtered.length === 0) {
        dispatch(setError(null)); // Clear error when filtering from fullSchedule
      }
    }
  }, [fullSchedule, currentWeekStart, currentWeekEnd, dispatch]);

  useEffect(() => {
    if (selectedFaculty && selectedCourse && selectedGroup) {
      const weekStartFormatted = formatDateForApi(currentWeekStart);
      const weekEndFormatted = formatDateForApi(currentWeekEnd);
      
      console.log('[ScheduleScreen] Week changed, loading schedule for:', {
        weekStart: weekStartFormatted,
        weekEnd: weekEndFormatted,
      });
      
      // Always load schedule for the current week
      loadSchedule(selectedFaculty, selectedCourse, selectedGroup, currentWeekStart, currentWeekEnd, {
        showLoading: true,
        forceRefresh: false, // Let it check cache first, but will load if not available
      }).then(() => {
        // After the main schedule loads, preload adjacent weeks in the background
        preloadAdjacentWeeks(selectedFaculty, selectedCourse, selectedGroup, currentWeekStart);
      });
    }
  }, [selectedFaculty, selectedCourse, selectedGroup, currentWeekStart, currentWeekEnd, loadSchedule, preloadAdjacentWeeks]);

  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (
        nextState === 'active' &&
        isFocused &&
        selectedFaculty &&
        selectedCourse &&
        selectedGroup
      ) {
        loadSchedule(
          selectedFaculty,
          selectedCourse,
          selectedGroup,
          currentWeekStart,
          currentWeekEnd,
          { showLoading: false }
        );
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [
    currentWeekEnd,
    currentWeekStart,
    isFocused,
    loadSchedule,
    selectedCourse,
    selectedFaculty,
    selectedGroup,
  ]);

  const onRefresh = useCallback(async () => {
    console.log('[ScheduleScreen] Pull-to-refresh');
    setRefreshing(true);
    if (selectedFaculty && selectedCourse && selectedGroup) {
      await loadSchedule(
        selectedFaculty,
        selectedCourse,
        selectedGroup,
        currentWeekStart,
        currentWeekEnd,
        { showLoading: false, forceRefresh: true }
      );
      // Trigger preload after refresh
      preloadAdjacentWeeks(selectedFaculty, selectedCourse, selectedGroup, currentWeekStart);
    }
    setRefreshing(false);
  }, [selectedFaculty, selectedCourse, selectedGroup, currentWeekStart, currentWeekEnd, loadSchedule, preloadAdjacentWeeks]);

  const handleHomeworkPress = (item: ScheduleItem) => {
    // Навигация к экрану добавления ДЗ
    navigation.navigate('HomeworkDetail', { 
      task: {
        id: 0,
        lesson_id: item.id,
        group_id: selectedGroup || '',
        homework_text: '',
        created_by: user?.id || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    });
  };

  const canEditHomework = user?.role === 'monitor' || user?.role === 'admin';

  const handlePreviousWeek = () => {
    setCurrentWeekStart(prev => {
      const newWeekStart = addDays(prev, -7);
      console.log('[ScheduleScreen] Previous week clicked:', {
        prev: formatDateForApi(prev),
        new: formatDateForApi(newWeekStart),
      });
      
      // If in calendar mode and a date is selected, update it to the same day in the new week
      if (weekViewMode === 'calendar' && selectedDate) {
        const prevNormalized = new Date(prev);
        prevNormalized.setHours(0, 0, 0, 0);
        const selectedNormalized = new Date(selectedDate);
        selectedNormalized.setHours(0, 0, 0, 0);
        const dayOffset = Math.floor((selectedNormalized.getTime() - prevNormalized.getTime()) / (1000 * 60 * 60 * 24));
        const newSelectedDate = addDays(newWeekStart, dayOffset);
        newSelectedDate.setHours(0, 0, 0, 0);
        console.log('[ScheduleScreen] Updating selected date:', formatDateForApi(newSelectedDate));
        setSelectedDate(newSelectedDate);
      }
      return newWeekStart;
    });
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(prev => {
      const newWeekStart = addDays(prev, 7);
      console.log('[ScheduleScreen] Next week clicked:', {
        prev: formatDateForApi(prev),
        new: formatDateForApi(newWeekStart),
      });
      
      // If in calendar mode and a date is selected, update it to the same day in the new week
      if (weekViewMode === 'calendar' && selectedDate) {
        const prevNormalized = new Date(prev);
        prevNormalized.setHours(0, 0, 0, 0);
        const selectedNormalized = new Date(selectedDate);
        selectedNormalized.setHours(0, 0, 0, 0);
        const dayOffset = Math.floor((selectedNormalized.getTime() - prevNormalized.getTime()) / (1000 * 60 * 60 * 24));
        const newSelectedDate = addDays(newWeekStart, dayOffset);
        newSelectedDate.setHours(0, 0, 0, 0);
        console.log('[ScheduleScreen] Updating selected date:', formatDateForApi(newSelectedDate));
        setSelectedDate(newSelectedDate);
      }
      return newWeekStart;
    });
  };

  const handleCurrentWeek = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayWeekStart = getStartOfWeek(today);
    setCurrentWeekStart(todayWeekStart);
    
    // If in calendar mode, select today if it's a weekday
    if (weekViewMode === 'calendar') {
      const dayOfWeek = today.getDay();
      if (dayOfWeek >= 1 && dayOfWeek <= 6) {
        setSelectedDate(today);
      } else {
        // If today is Sunday, select Monday
        const monday = addDays(today, 1);
        monday.setHours(0, 0, 0, 0);
        setSelectedDate(monday);
      }
    }
  };

  const handleDateSelect = (date: Date) => {
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);
    console.log('[ScheduleScreen] Date selected:', formatDateForApi(normalizedDate));
    setSelectedDate(normalizedDate);
  };

  // Swipe gesture handling for day navigation
  const translateX = useSharedValue(0);
  const triggerNext = useSharedValue(0);
  const triggerPrev = useSharedValue(0);

  const handleSwipeToNextDay = useCallback(() => {
    if (!selectedDate) return;
    
    const nextDate = addDays(selectedDate, 1);
    const nextDateWeekday = nextDate.getDay();
    
    // Skip Sunday (0), go to Monday instead
    if (nextDateWeekday === 0) {
      const monday = addDays(nextDate, 1);
      monday.setHours(0, 0, 0, 0);
      
      // Check if we need to move to the next week
      const mondayWeekStart = getStartOfWeek(monday);
      
      // Batch state updates to prevent jitter
      if (mondayWeekStart.getTime() !== currentWeekStart.getTime()) {
        setCurrentWeekStart(mondayWeekStart);
      }
      setSelectedDate(monday);
    } else {
      nextDate.setHours(0, 0, 0, 0);
      
      // Check if we need to move to the next week
      const nextWeekStart = getStartOfWeek(nextDate);
      
      // Batch state updates to prevent jitter
      if (nextWeekStart.getTime() !== currentWeekStart.getTime()) {
        setCurrentWeekStart(nextWeekStart);
      }
      setSelectedDate(nextDate);
    }
  }, [selectedDate, currentWeekStart]);

  const handleSwipeToPreviousDay = useCallback(() => {
    if (!selectedDate) return;
    
    const prevDate = addDays(selectedDate, -1);
    const prevDateWeekday = prevDate.getDay();
    
    // Skip Sunday (0), go to Saturday instead
    if (prevDateWeekday === 0) {
      const saturday = addDays(prevDate, -1);
      saturday.setHours(0, 0, 0, 0);
      
      // Check if we need to move to the previous week
      const saturdayWeekStart = getStartOfWeek(saturday);
      
      // Batch state updates to prevent jitter
      if (saturdayWeekStart.getTime() !== currentWeekStart.getTime()) {
        setCurrentWeekStart(saturdayWeekStart);
      }
      setSelectedDate(saturday);
    } else {
      prevDate.setHours(0, 0, 0, 0);
      
      // Check if we need to move to the previous week
      const prevWeekStart = getStartOfWeek(prevDate);
      
      // Batch state updates to prevent jitter
      if (prevWeekStart.getTime() !== currentWeekStart.getTime()) {
        setCurrentWeekStart(prevWeekStart);
      }
      setSelectedDate(prevDate);
    }
  }, [selectedDate, currentWeekStart]);

  // Watch for trigger changes to execute date changes with delay
  useAnimatedReaction(
    () => triggerNext.value,
    (current, previous) => {
      if (current !== previous && current > 0) {
        runOnJS(handleSwipeToNextDay)();
        // Reset position off-screen right so new content slides in from right
        translateX.value = 400;
        translateX.value = withTiming(0, { duration: 120 });
        triggerNext.value = 0;
      }
    },
    [handleSwipeToNextDay]
  );

  useAnimatedReaction(
    () => triggerPrev.value,
    (current, previous) => {
      if (current !== previous && current > 0) {
        runOnJS(handleSwipeToPreviousDay)();
        // Reset position off-screen left so new content slides in from left
        translateX.value = -400;
        translateX.value = withTiming(0, { duration: 120 });
        triggerPrev.value = 0;
      }
    },
    [handleSwipeToPreviousDay]
  );

  const panGesture = Gesture.Pan()
    .enabled(weekViewMode === 'calendar' && selectedDate !== null && !isLoading)
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      const threshold = 50; // Minimum swipe distance to trigger navigation
      const velocityThreshold = 500; // Velocity threshold for quick swipes

      if (event.translationX > threshold || event.velocityX > velocityThreshold) {
        // Swipe right - go to previous day
        // Animate out to the right
        translateX.value = withTiming(400, { duration: 150 });
        
        // Schedule date change to happen before animation completes (overlap effect)
        triggerPrev.value = withDelay(70, withTiming(1, { duration: 0 }));
      } else if (event.translationX < -threshold || event.velocityX < -velocityThreshold) {
        // Swipe left - go to next day
        // Animate out to the left
        translateX.value = withTiming(-400, { duration: 150 });
        
        // Schedule date change to happen before animation completes (overlap effect)
        triggerNext.value = withDelay(70, withTiming(1, { duration: 0 }));
      } else {
        // Reset to original position if swipe wasn't far enough
        translateX.value = withTiming(0, { duration: 150 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const groupedSchedule = useMemo<ScheduleSection[]>(() => {
    if (!currentSchedule.length) {
      return [];
    }

    let filteredSchedule = currentSchedule;

    // If in calendar mode and a date is selected, filter to show only that day
    if (weekViewMode === 'calendar' && selectedDate) {
      const normalizedSelectedDate = new Date(selectedDate);
      normalizedSelectedDate.setHours(0, 0, 0, 0);
      const selectedDateStr = formatDateForApi(normalizedSelectedDate);
      
      console.log('[ScheduleScreen] Filtering schedule for date:', selectedDateStr);
      console.log('[ScheduleScreen] Available dates in schedule:', 
        Array.from(new Set(currentSchedule.map(l => l.date))).sort());
      
      filteredSchedule = currentSchedule.filter(lesson => {
        const match = lesson.date === selectedDateStr;
        if (match) {
          console.log('[ScheduleScreen] Match found:', lesson.title, lesson.date);
        }
        return match;
      });
      
      console.log('[ScheduleScreen] Filtered schedule count:', filteredSchedule.length);
    }

    const lessonsByDate = filteredSchedule.reduce<Record<string, ScheduleItem[]>>((acc, lesson) => {
      const existing = acc[lesson.date] ?? [];
      existing.push(lesson);
      acc[lesson.date] = existing;
      return acc;
    }, {});

    return Object.entries(lessonsByDate)
      .map(([date, lessons]) => {
        // Sort lessons by time
        const sortedLessons = lessons.slice().sort((a, b) => getLessonSortValue(a) - getLessonSortValue(b));
        
        // Find lessons with pair numbers
        const lessonsWithPairs = sortedLessons.filter(l => typeof l.pairNumber === 'number');
        
        if (lessonsWithPairs.length === 0) {
          // No pair numbers, return as is
          return {
            title: formatDaySectionLabel(date),
            date,
            data: sortedLessons,
          };
        }
        
        // Find min and max pair numbers
        const pairNumbers = lessonsWithPairs.map(l => l.pairNumber as number);
        const minPair = Math.min(...pairNumbers);
        const maxPair = Math.max(...pairNumbers);
        
        // Create a map of pair number to lessons
        const pairMap = new Map<number, ScheduleItem[]>();
        lessonsWithPairs.forEach(lesson => {
          const pairNum = lesson.pairNumber as number;
          if (!pairMap.has(pairNum)) {
            pairMap.set(pairNum, []);
          }
          pairMap.get(pairNum)!.push(lesson);
        });
        
        // Build final data array with gaps
        const dataWithGaps: (ScheduleItem | GapItem)[] = [];
        
        // Add lessons without pair numbers at the beginning
        const lessonsWithoutPairs = sortedLessons.filter(l => typeof l.pairNumber !== 'number');
        dataWithGaps.push(...lessonsWithoutPairs);
        
        // Fill in all periods from min to max, inserting gaps where needed
        for (let pairNum = minPair; pairNum <= maxPair; pairNum++) {
          if (pairMap.has(pairNum)) {
            // Add all lessons for this pair
            dataWithGaps.push(...pairMap.get(pairNum)!);
          } else {
            // Add a gap
            dataWithGaps.push({
              isGap: true,
              id: `gap-${date}-${pairNum}`,
              pairNumber: pairNum,
              date,
            });
          }
        }
        
        return {
          title: formatDaySectionLabel(date),
          date,
          data: dataWithGaps,
        };
      })
      .sort(
        (a, b) =>
          new Date(`${a.date}T00:00:00`).getTime() - new Date(`${b.date}T00:00:00`).getTime(),
      );
  }, [currentSchedule, weekViewMode, selectedDate]);

  const isGapItem = (item: ScheduleItem | GapItem): item is GapItem => {
    return 'isGap' in item && item.isGap === true;
  };

  const styles = useMemo(() => createStyles(theme), [theme]);

  const renderScheduleItem = ({ item }: { item: ScheduleItem | GapItem }) => {
    if (isGapItem(item)) {
      // Render gap item with gradient
      const gapGradientColors = theme.dark 
        ? ['#374151', '#1f2937'] as const
        : ['#f3f4f6', '#e5e7eb'] as const;
      
      return (
        <Card style={styles.gapCard}>
          <LinearGradient
            colors={gapGradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gapContent}
          >
            <Text style={[styles.gapText, { color: theme.colors.onSurfaceVariant }]}>Пара {item.pairNumber} - Окно</Text>
          </LinearGradient>
        </Card>
      );
    }
    
    return (
      <ScheduleCard
        item={item}
        onHomeworkPress={handleHomeworkPress}
        canEditHomework={canEditHomework}
        showDateLabel={false}
      />
    );
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={onRefresh}>
          Попробовать снова
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isOffline && (
        <View style={styles.offlineBadge}>
          <Text style={styles.offlineBadgeText}>Офлайн</Text>
        </View>
      )}
      {selectedGroup && weekViewMode === 'calendar' && (
        <WeeklyCalendar
          weekStart={currentWeekStart}
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          onPreviousWeek={handlePreviousWeek}
          onNextWeek={handleNextWeek}
          onCurrentWeek={handleCurrentWeek}
          isLoading={isLoading}
        />
      )}

      {selectedGroup && weekViewMode === 'range' && (
        <View style={styles.selectorContainer}>
          <Card style={styles.selectorCard}>
            <Card.Content>
              <View style={styles.weekSelector}>
                <IconButton
                  icon="chevron-left"
                  size={24}
                  onPress={handlePreviousWeek}
                  disabled={isLoading}
                />
                <View style={styles.weekInfo}>
                  <Text style={styles.weekTitle}>Неделя</Text>
                  <Text style={styles.weekRange}>{weekRangeLabel}</Text>
                </View>
                <IconButton
                  icon="chevron-right"
                  size={24}
                  onPress={handleNextWeek}
                  disabled={isLoading}
                />
              </View>
            </Card.Content>
          </Card>
        </View>
      )}

      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Загрузка расписания...</Text>
        </View>
      ) : (
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[{ flex: 1 }, animatedStyle]}>
            <SectionList
              sections={groupedSchedule}
              renderItem={renderScheduleItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={groupedSchedule.length === 0 ? styles.listEmptyContent : styles.listContent}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              renderSectionHeader={({ section }: { section: ScheduleSection }) => (
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionHeaderText}>{section.title}</Text>
                </View>
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    {selectedGroup 
                      ? (weekViewMode === 'calendar' && selectedDate 
                          ? 'Нет занятий в этот день' 
                          : 'Расписание не найдено')
                      : 'Выберите группу, чтобы увидеть расписание'}
                  </Text>
                </View>
              }
            />
          </Animated.View>
        </GestureDetector>
      )}
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  offlineBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: theme.colors.error,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
  },
  offlineBadgeText: {
    color: theme.colors.onError,
    fontWeight: '600',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  selectorContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  selectorCard: {
    elevation: 2,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  weekSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weekInfo: {
    flex: 1,
    alignItems: 'center',
  },
  weekTitle: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  weekRange: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  listEmptyContent: {
    flexGrow: 1,
  },
  listContent: {
    paddingBottom: 92, // Account for transparent tab bar (60px height + 16px margin + 16px extra spacing)
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: theme.colors.background,
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    textTransform: 'capitalize',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: 20,
  },
  gapCard: {
    marginVertical: 4,
    marginHorizontal: 16,
    elevation: 3,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 7,
    overflow: 'hidden',
  },
  gapContent: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderRadius: 12,
  },
  gapText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
});

export default ScheduleScreen;



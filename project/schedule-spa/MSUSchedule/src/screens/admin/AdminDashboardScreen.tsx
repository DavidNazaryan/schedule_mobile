import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, FlatList } from 'react-native';
import { Text, Card, Button, Chip, ActivityIndicator, DataTable } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';

import { RootState } from '../store';
import { UserProfile, UserStatsResponse, AuditLogResponse } from '../types';
import { getUserStatistics, getAuditLogs, getUsersList } from '../api/userApi';
import UserRoleChip from '../components/UserRoleChip';
import { theme } from '../utils/theme';

const AdminDashboardScreen: React.FC = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [stats, setStats] = useState<UserStatsResponse | null>(null);
  const [recentUsers, setRecentUsers] = useState<UserProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const [statsData, usersData, auditData] = await Promise.all([
        getUserStatistics(),
        getUsersList(1, 10),
        getAuditLogs(1, 20),
      ]);
      
      setStats(statsData);
      setRecentUsers(usersData.users);
      setAuditLogs(auditData.logs);
    } catch (error) {
      console.error('Ошибка загрузки данных админ-панели:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderUserItem = ({ item }: { item: UserProfile }) => (
    <DataTable.Row>
      <DataTable.Cell>
        <View style={styles.userCell}>
          <Text style={styles.userName}>{item.first_name} {item.last_name}</Text>
          <Text style={styles.userUsername}>@{item.username || 'без_username'}</Text>
        </View>
      </DataTable.Cell>
      <DataTable.Cell>
        <UserRoleChip role={item.role as any} size="small" />
      </DataTable.Cell>
      <DataTable.Cell>
        <Text style={styles.userDate}>{formatDate(item.created_at || '')}</Text>
      </DataTable.Cell>
    </DataTable.Row>
  );

  const renderAuditItem = ({ item }: { item: AuditLogResponse }) => (
    <DataTable.Row>
      <DataTable.Cell>
        <Text style={styles.auditUser}>{item.user_name}</Text>
      </DataTable.Cell>
      <DataTable.Cell>
        <Text style={styles.auditAction}>{item.action}</Text>
      </DataTable.Cell>
      <DataTable.Cell>
        <Text style={styles.auditDate}>{formatDate(item.created_at)}</Text>
      </DataTable.Cell>
    </DataTable.Row>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Загрузка админ-панели...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Статистика */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Статистика системы</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats?.total_users || 0}</Text>
              <Text style={styles.statLabel}>Пользователей</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats?.total_groups || 0}</Text>
              <Text style={styles.statLabel}>Групп</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats?.active_users_week || 0}</Text>
              <Text style={styles.statLabel}>Активных за неделю</Text>
            </View>
          </View>
          
          <View style={styles.rolesStats}>
            <Text style={styles.rolesTitle}>По ролям:</Text>
            <View style={styles.rolesContainer}>
              {stats?.roles && Object.entries(stats.roles).map(([role, count]) => (
                <Chip key={role} style={styles.roleChip}>
                  {role}: {count}
                </Chip>
              ))}
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Последние пользователи */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Последние пользователи</Text>
          
          <DataTable>
            <DataTable.Header>
              <DataTable.Title>Пользователь</DataTable.Title>
              <DataTable.Title>Роль</DataTable.Title>
              <DataTable.Title>Дата регистрации</DataTable.Title>
            </DataTable.Header>
            
            <FlatList
              data={recentUsers}
              renderItem={renderUserItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
          </DataTable>
        </Card.Content>
      </Card>

      {/* Журнал аудита */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Журнал аудита</Text>
          
          <DataTable>
            <DataTable.Header>
              <DataTable.Title>Пользователь</DataTable.Title>
              <DataTable.Title>Действие</DataTable.Title>
              <DataTable.Title>Дата</DataTable.Title>
            </DataTable.Header>
            
            <FlatList
              data={auditLogs}
              renderItem={renderAuditItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
          </DataTable>
        </Card.Content>
      </Card>

      {/* Действия администратора */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Действия</Text>
          
          <View style={styles.actionsContainer}>
            <Button
              mode="outlined"
              onPress={loadDashboardData}
              style={styles.actionButton}
              icon="refresh"
            >
              Обновить данные
            </Button>
            
            <Button
              mode="outlined"
              style={styles.actionButton}
              icon="download"
            >
              Экспорт данных
            </Button>
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
    marginBottom: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: 16,
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
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  rolesStats: {
    marginTop: 16,
  },
  rolesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: 8,
  },
  rolesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleChip: {
    marginRight: 8,
    marginBottom: 4,
  },
  userCell: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  userUsername: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  userDate: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  auditUser: {
    fontSize: 14,
    color: theme.colors.onSurface,
  },
  auditAction: {
    fontSize: 14,
    color: theme.colors.onSurface,
  },
  auditDate: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
});

export default AdminDashboardScreen;



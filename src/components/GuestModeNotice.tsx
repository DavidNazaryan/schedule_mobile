import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Button, useTheme } from 'react-native-paper';

interface GuestModeNoticeProps {
  title?: string;
  description: string;
  actionLabel?: string;
  onActionPress?: () => void;
}

const GuestModeNotice: React.FC<GuestModeNoticeProps> = ({
  title = 'Доступ ограничен',
  description,
  actionLabel,
  onActionPress,
}) => {
  const theme = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
          {actionLabel && onActionPress && (
            <Button mode="contained-tonal" onPress={onActionPress} style={styles.button}>
              {actionLabel}
            </Button>
          )}
        </Card.Content>
      </Card>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: theme.colors.background,
  },
  card: {
    width: '100%',
    maxWidth: 420,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 20,
  },
  button: {
    marginTop: 16,
    borderRadius: 12,
  },
});

export default GuestModeNotice;

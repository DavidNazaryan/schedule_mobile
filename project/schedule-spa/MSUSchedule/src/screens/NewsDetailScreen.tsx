import React from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { Text, Card, Chip } from 'react-native-paper';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootStackParamList } from '../types';
import { theme } from '../utils/theme';

type NewsDetailScreenRouteProp = RouteProp<RootStackParamList, 'NewsDetail'>;
type NewsDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'NewsDetail'>;

interface NewsDetailScreenProps {
  route: NewsDetailScreenRouteProp;
  navigation: NewsDetailScreenNavigationProp;
}

const NewsDetailScreen: React.FC<NewsDetailScreenProps> = ({ route, navigation }) => {
  const { article } = route.params;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSourceColor = (source: string) => {
    switch (source.toLowerCase()) {
      case 'мгу':
        return theme.colors.primary;
      case 'факультет':
        return theme.colors.secondary;
      case 'университет':
        return theme.colors.tertiary;
      default:
        return theme.colors.outline;
    }
  };

  // Простая функция для очистки HTML тегов
  const stripHtmlTags = (html: string) => {
    return html.replace(/<[^>]*>/g, '');
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        {article.image_url && (
          <Image source={{ uri: article.image_url }} style={styles.image} />
        )}
        
        <Card.Content>
          <View style={styles.header}>
            <Chip
              style={[styles.sourceChip, { backgroundColor: getSourceColor(article.source) }]}
              textStyle={styles.sourceText}
            >
              {article.source}
            </Chip>
            <Text style={styles.date}>{formatDate(article.published_at)}</Text>
          </View>
          
          <Text style={styles.title}>{article.title}</Text>
          
          <Text style={styles.content}>
            {stripHtmlTags(article.content)}
          </Text>
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
  image: {
    width: '100%',
    height: 250,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sourceChip: {
    borderRadius: 12,
  },
  sourceText: {
    color: theme.colors.onPrimary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  date: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: 16,
    lineHeight: 28,
  },
  content: {
    fontSize: 16,
    color: theme.colors.onSurface,
    lineHeight: 24,
  },
});

export default NewsDetailScreen;



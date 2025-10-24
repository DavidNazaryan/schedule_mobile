import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Card, Text, Chip } from 'react-native-paper';
import { NewsArticle } from '../types';
import { theme } from '../utils/theme';

interface NewsCardProps {
  article: NewsArticle;
  onPress?: (article: NewsArticle) => void;
}

const NewsCard: React.FC<NewsCardProps> = ({ article, onPress }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
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

  return (
    <Card 
      style={styles.card} 
      onPress={() => onPress?.(article)}
      mode="outlined"
    >
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
        
        <Text style={styles.title} numberOfLines={2}>
          {article.title}
        </Text>
        
        <Text style={styles.excerpt} numberOfLines={3}>
          {article.excerpt}
        </Text>
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
  image: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: 8,
    lineHeight: 22,
  },
  excerpt: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 20,
  },
});

export default NewsCard;



import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Card, Text, Chip, useTheme } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { NewsArticle } from '@/types';

interface NewsCardProps {
  article: NewsArticle;
  onPress?: (article: NewsArticle) => void;
}

const NewsCard: React.FC<NewsCardProps> = ({ article, onPress }) => {
  const theme = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        // If parsing failed, return the original string
        return dateString;
      }
      
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch (error) {
      return dateString;
    }
  };

  const getSourceGradient = (source: string): [string, string] => {
    const sourceLower = source.toLowerCase();
    
    // Primary color categories (blue gradient)
    if (sourceLower.includes('новости') || sourceLower === 'news' ||
        sourceLower === 'мгу' || sourceLower.includes('информация') ||
        sourceLower.includes('образование') || sourceLower.includes('наука')) {
      return ['#3b82f6', '#60a5fa']; // Blue gradient
    }
    
    // Secondary color categories (purple/teal gradient)
    if (sourceLower.includes('объявления') || sourceLower === 'announcements' ||
        sourceLower === 'факультет' || sourceLower.includes('студентам') ||
        sourceLower.includes('важное') || sourceLower.includes('поступление')) {
      return ['#8b5cf6', '#a78bfa']; // Purple gradient
    }
    
    // Tertiary color categories (orange/accent gradient)
    if (sourceLower.includes('события') || sourceLower === 'events' ||
        sourceLower === 'университет' || sourceLower.includes('конкурс') ||
        sourceLower.includes('достижения') || sourceLower.includes('конференц')) {
      return ['#f97316', '#fb923c']; // Orange gradient
    }
    
    // Default gray gradient
    return ['#6b7280', '#9ca3af'];
  };

  const getSourceColor = (source: string) => {
    const gradient = getSourceGradient(source);
    return gradient[0]; // Return the first color for backward compatibility
  };

  const cardGradientColors = theme.dark 
    ? ['#1e293b', '#0f172a'] as const
    : ['#ffffff', '#f8fafc'] as const;

  return (
    <Card 
      style={styles.card} 
      onPress={() => onPress?.(article)}
      mode="outlined"
    >
      {article.image_url && (
        <Image source={{ uri: article.image_url }} style={styles.image} />
      )}
      
      <LinearGradient
        colors={cardGradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.cardGradient, !article.image_url && styles.contentWithoutImage]}
      >
        <View style={styles.header}>
          <LinearGradient
            colors={getSourceGradient(article.source)}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.sourceChip}
          >
            <Text style={styles.sourceText}>
              {article.source}
            </Text>
          </LinearGradient>
          <Text style={styles.date}>{formatDate(article.published_at)}</Text>
        </View>
        
        <Text style={styles.title} numberOfLines={2} selectable={true}>
          {article.title}
        </Text>
        
        <Text style={styles.excerpt} numberOfLines={3} selectable={true}>
          {article.excerpt}
        </Text>
      </LinearGradient>
    </Card>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  card: {
    marginVertical: 4,
    marginHorizontal: 16,
    elevation: 2,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    overflow: 'hidden',
  },
  cardGradient: {
    padding: 16,
    borderRadius: 12,
  },
  image: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  contentWithoutImage: {
    paddingTop: 16, // Add top spacing when there's no image
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sourceChip: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceText: {
    color: '#ffffff',
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

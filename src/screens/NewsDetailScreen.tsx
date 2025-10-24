import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, useWindowDimensions, Linking } from 'react-native';
import { Text, Card, Chip, ActivityIndicator, useTheme } from 'react-native-paper';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import RenderHTML from 'react-native-render-html';
import { LinearGradient } from 'expo-linear-gradient';

import { RootStackParamList } from '@/types';
import NewsParser from '../services/NewsParser';

type NewsDetailScreenRouteProp = RouteProp<RootStackParamList, 'NewsDetail'>;
type NewsDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'NewsDetail'>;

interface NewsDetailScreenProps {
  route: NewsDetailScreenRouteProp;
  navigation: NewsDetailScreenNavigationProp;
}

const NewsDetailScreen: React.FC<NewsDetailScreenProps> = ({ route, navigation }) => {
  const { article } = route.params;
  const { width } = useWindowDimensions();
  const theme = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const [fullContent, setFullContent] = useState<string>(article.content);
  const [isLoadingContent, setIsLoadingContent] = useState<boolean>(false);

  useEffect(() => {
    // Fetch full content if we only have excerpt
    const fetchFullContent = async () => {
      if (!article.url) return;
      
      // If content is same as excerpt, we need to fetch full content
      if (article.content === article.excerpt) {
        setIsLoadingContent(true);
        try {
          const detailData = await NewsParser.fetchArticleDetail(article.url);
          if (detailData && detailData.content) {
            setFullContent(detailData.content);
          }
        } catch (error) {
          console.error('Error fetching full content:', error);
        } finally {
          setIsLoadingContent(false);
        }
      }
    };

    fetchFullContent();
  }, [article.url, article.content, article.excerpt]);

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

  // Prepare HTML content for rendering
  const prepareHtmlContent = (content: string) => {
    // Wrap plain text in paragraphs if not already HTML
    if (!content.includes('<')) {
      return `<p>${content.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>')}</p>`;
    }
    return content;
  };

  // Custom renderer for links
  const renderersProps = {
    a: {
      onPress: (event: any, url: string) => {
        Linking.openURL(url).catch(err => console.error('Failed to open URL:', err));
      },
    },
  };

  // HTML styles with proper dark mode link colors
  const htmlStyles = React.useMemo(() => ({
    body: {
      color: theme.colors.onSurface,
      fontSize: 16,
      lineHeight: 24,
    },
    p: {
      marginBottom: 12,
      color: theme.colors.onSurface,
    },
    a: {
      color: theme.colors.primary,
      textDecorationLine: 'underline',
    },
    strong: {
      fontWeight: 'bold',
      color: theme.colors.onSurface,
    },
    em: {
      fontStyle: 'italic',
      color: theme.colors.onSurface,
    },
    h1: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 12,
      color: theme.colors.onSurface,
    },
    h2: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 10,
      color: theme.colors.onSurface,
    },
    h3: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 8,
      color: theme.colors.onSurface,
    },
    ul: {
      marginBottom: 12,
    },
    ol: {
      marginBottom: 12,
    },
    li: {
      marginBottom: 4,
      color: theme.colors.onSurface,
    },
  }), [theme]);

  const cardGradientColors = theme.dark 
    ? ['#1e293b', '#0f172a'] as const
    : ['#ffffff', '#f8fafc'] as const;

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
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
          
          <Text style={styles.title}>{article.title}</Text>
          
          {isLoadingContent ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" />
              <Text style={styles.loadingText}>Загрузка полного текста...</Text>
            </View>
          ) : (
            <View style={styles.htmlContainer}>
              <RenderHTML
                contentWidth={width - 64}
                source={{ html: prepareHtmlContent(fullContent) }}
                tagsStyles={htmlStyles}
                renderersProps={renderersProps}
                enableExperimentalMarginCollapsing={true}
                defaultTextProps={{
                  selectable: true,
                }}
              />
            </View>
          )}
        </LinearGradient>
      </Card>
    </ScrollView>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  card: {
    margin: 16,
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
    height: 250,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  contentWithoutImage: {
    paddingTop: 20, // Add top spacing when there's no image (slightly more for detail view)
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: 16,
    lineHeight: 28,
  },
  htmlContainer: {
    marginTop: 8,
  },
  loadingContainer: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
});

export default NewsDetailScreen;



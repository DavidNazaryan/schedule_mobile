/**
 * Client-side News Parser for MSU Blog
 * Parses news from https://stud.spa.msu.ru/blog/ directly in the mobile app
 */

import * as cheerio from 'cheerio-without-node-native';
import { NewsArticle } from '../types';

const BASE_URL = 'https://stud.spa.msu.ru';
const BLOG_URL = 'https://stud.spa.msu.ru/blog/';

interface ParsedNews {
  articles: NewsArticle[];
  hasMore: boolean;
}

class NewsParser {
  /**
   * Fetch and parse news from MSU blog
   */
  async fetchNews(page: number = 1, limit: number = 20): Promise<ParsedNews> {
    try {
      // Construct URL with pagination
      const url = page > 1 ? `${BLOG_URL}page/${page}/` : BLOG_URL;

      // Fetch HTML
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // Find articles using .post selector
      const articles: NewsArticle[] = [];
      const articleElements = $('.post');

      articleElements.each((index, element) => {
        if (articles.length >= limit) return;

        const article = this.parseArticle($, element);
        if (article) {
          articles.push(article);
        }
      });

      // Check for next page
      const hasMore = this.checkHasNextPage($, page);

      return { articles, hasMore };
    } catch (error) {
      console.error('Error fetching news:', error);
      throw error;
    }
  }

  /**
   * Parse individual article element
   */
  private parseArticle($: cheerio.CheerioAPI, element: cheerio.Element): NewsArticle | null {
    try {
      const $article = $(element);

      // Extract title
      const titleElement = $article.find('h1, h2, h3, h4, .title, .heading, .post-title, .entry-title').first();
      const title = titleElement.text().trim();

      if (!title || title.length < 5) {
        return null;
      }

      // Extract URL
      const linkElement = titleElement.find('a').length > 0 
        ? titleElement.find('a')
        : $article.find('a').first();
      let url = linkElement.attr('href') || '';

      if (url && !url.startsWith('http')) {
        url = `${BASE_URL}${url}`;
      }

      if (!url) {
        return null;
      }

      // Generate ID from URL
      const id = this.generateId(url);

      // Extract excerpt
      let excerpt = '';
      const excerptElement = $article.find('[class*="excerpt"], [class*="summary"], [class*="content"]').first();
      
      if (excerptElement.length > 0) {
        excerpt = excerptElement.text().trim();
      } else {
        const paragraphs = $article.find('p');
        paragraphs.each((_, p) => {
          const text = $(p).text().trim();
          if (text && text.length > 20 && text !== title) {
            excerpt = text;
            return false; // break
          }
        });
      }

      // Clean excerpt
      excerpt = this.cleanExcerpt(excerpt, title);

      // Extract date and author from metadata
      const { date, author } = this.extractMetadata($, $article);

      // Extract image
      const imgElement = $article.find('img').first();
      let imageUrl: string | undefined;
      if (imgElement.length > 0) {
        imageUrl = imgElement.attr('src') || imgElement.attr('data-src');
        if (imageUrl && !imageUrl.startsWith('http')) {
          imageUrl = `${BASE_URL}${imageUrl}`;
        }
      }

      // Extract category from classes
      const category = this.extractCategory($article);

      return {
        id,
        title,
        excerpt: excerpt || title,
        content: excerpt || title, // For list view, use excerpt as content
        url,
        image_url: imageUrl,
        published_at: date,
        source: category,
      };
    } catch (error) {
      console.error('Error parsing article:', error);
      return null;
    }
  }

  /**
   * Extract metadata (date and author) from article
   */
  private extractMetadata($: cheerio.CheerioAPI, $article: cheerio.Cheerio<cheerio.Element>): { date: string; author: string } {
    let date = '';
    let author = '';

    // Look for metadata container
    const metaContainer = $article.find('[class*="blog-meta"], [class*="post-meta"]').first();
    
    if (metaContainer.length > 0) {
      const metaItems = metaContainer.find('.metadata-item');
      
      metaItems.each((_, item) => {
        const $item = $(item);
        const prefix = $item.find('.metadata-prefix').text().trim().toLowerCase();
        
        if (prefix === 'by' && !author) {
          // Remove prefix to get author name
          const itemCopy = $item.clone();
          itemCopy.find('.metadata-prefix').remove();
          author = itemCopy.text().trim();
        } else if (prefix === 'on' && !date) {
          // Remove prefix to get date
          const itemCopy = $item.clone();
          itemCopy.find('.metadata-prefix').remove();
          date = itemCopy.text().trim();
        }
      });
    }

    // Fallback methods if metadata not found
    if (!date) {
      const timeElement = $article.find('time').first();
      if (timeElement.length > 0) {
        date = timeElement.attr('datetime') || timeElement.text().trim();
      }
    }

    if (!author) {
      const authorElement = $article.find('[class*="author"], [class*="by"]').first();
      if (authorElement.length > 0) {
        author = authorElement.text().trim().replace(/^(by|автор:?)\s*/i, '');
      }
    }

    // Convert Russian date format to ISO format if possible
    if (date) {
      date = this.normalizeDate(date);
    }

    return { date, author };
  }

  /**
   * Normalize date string to a consistent format
   * Converts Russian dates like "Сен 29" to a more standard format
   */
  private normalizeDate(dateStr: string): string {
    if (!dateStr) return '';

    // If already looks like ISO date, return as is
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
      return dateStr;
    }

    // Russian month mapping
    const russianMonths: { [key: string]: number } = {
      'янв': 0, 'января': 0, 'январь': 0,
      'фев': 1, 'февраля': 1, 'февраль': 1,
      'мар': 2, 'марта': 2, 'март': 2,
      'апр': 3, 'апреля': 3, 'апрель': 3,
      'май': 4, 'мая': 4,
      'июн': 5, 'июня': 5, 'июнь': 5,
      'июл': 6, 'июля': 6, 'июль': 6,
      'авг': 7, 'августа': 7, 'август': 7,
      'сен': 8, 'сентября': 8, 'сентябрь': 8,
      'окт': 9, 'октября': 9, 'октябрь': 9,
      'ноя': 10, 'ноября': 10, 'ноябрь': 10,
      'дек': 11, 'декабря': 11, 'декабрь': 11,
    };

    // Try to parse Russian date format like "Сен 29" or "29 Сентября"
    const parts = dateStr.toLowerCase().split(/[\s,]+/);
    let day: number | null = null;
    let month: number | null = null;
    let year: number | null = null;

    for (const part of parts) {
      // Check if it's a day (1-31)
      const dayNum = parseInt(part, 10);
      if (!isNaN(dayNum) && dayNum >= 1 && dayNum <= 31 && day === null) {
        day = dayNum;
        continue;
      }

      // Check if it's a year (2000+)
      const yearNum = parseInt(part, 10);
      if (!isNaN(yearNum) && yearNum >= 2000 && yearNum <= 2100) {
        year = yearNum;
        continue;
      }

      // Check if it's a Russian month
      for (const [monthName, monthIndex] of Object.entries(russianMonths)) {
        if (part.startsWith(monthName)) {
          month = monthIndex;
          break;
        }
      }
    }

    // If we found at least month and day, create a date
    if (month !== null && day !== null) {
      const currentYear = new Date().getFullYear();
      year = year || currentYear;
      
      const date = new Date(year, month, day);
      return date.toISOString();
    }

    // Return original if we couldn't parse
    return dateStr;
  }

  /**
   * Extract category from article classes
   */
  private extractCategory($article: cheerio.Cheerio<cheerio.Element>): string {
    const classes = $article.attr('class')?.split(' ') || [];
    
    // Category translation map from English to Russian
    const categoryTranslations: { [key: string]: string } = {
      // Main categories
      'announcements': 'Объявления',
      'news': 'Новости',
      'events': 'События',
      'information': 'Информация',
      
      // Additional categories
      'education': 'Образование',
      'science': 'Наука',
      'students': 'Студентам',
      'research': 'Исследования',
      'conference': 'Конференции',
      'competitions': 'Конкурсы',
      'achievements': 'Достижения',
      'international': 'Международное',
      'admissions': 'Поступление',
      'schedule': 'Расписание',
      'exams': 'Экзамены',
      'library': 'Библиотека',
      'sports': 'Спорт',
      'culture': 'Культура',
      'social': 'Социальное',
      'alumni': 'Выпускники',
      'faculty': 'Факультет',
      'university': 'Университет',
      'department': 'Кафедра',
      'general': 'Общее',
      'important': 'Важное',
      
      // Fallbacks
      'uncategorized': 'МГУ',
      'default': 'МГУ',
    };
    
    for (const cls of classes) {
      if (cls.startsWith('category-')) {
        const categorySlug = cls
          .replace('category-', '')
          .toLowerCase()
          .trim();
        
        // Return Russian translation if available
        if (categoryTranslations[categorySlug]) {
          return categoryTranslations[categorySlug];
        }
        
        // If no translation, return title-cased version
        const categoryName = categorySlug
          .replace(/-/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
        
        if (categoryName && categoryName.toLowerCase() !== 'uncategorized') {
          return categoryName;
        }
      }
    }

    return 'МГУ'; // Default
  }

  /**
   * Clean excerpt by removing metadata artifacts
   */
  private cleanExcerpt(excerpt: string, title: string): string {
    if (!excerpt) return '';

    // Remove title if it appears at the start
    if (excerpt.startsWith(title)) {
      excerpt = excerpt.substring(title.length).trim();
    }

    // Remove metadata patterns
    excerpt = excerpt
      .replace(/\[…\].*?Подробнее/g, '')
      .replace(/by\w+on\w+\d+/g, '')
      .replace(/by\w+on\w+/g, '')
      .replace(/\bby\b|\bon\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Limit length
    if (excerpt.length > 200) {
      excerpt = excerpt.substring(0, 200) + '...';
    }

    return excerpt;
  }

  /**
   * Check if there's a next page
   */
  private checkHasNextPage($: cheerio.CheerioAPI, currentPage: number): boolean {
    // Look for pagination links
    const paginationSelectors = [
      '.pagination',
      '.page-numbers',
      '.nav-links',
      '[class*="pagination"]',
    ];

    for (const selector of paginationSelectors) {
      const pagination = $(selector);
      if (pagination.length > 0) {
        // Check for "next" link or page number greater than current
        const links = pagination.find('a[href]');
        for (let i = 0; i < links.length; i++) {
          const link = links.eq(i);
          const text = link.text().toLowerCase();
          const href = link.attr('href') || '';

          if (text.includes('next') || text.includes('следующая') || text === '>') {
            return true;
          }

          // Check for page number links
          const pageMatch = href.match(/\/page\/(\d+)\//);
          if (pageMatch) {
            const pageNum = parseInt(pageMatch[1], 10);
            if (pageNum > currentPage) {
              return true;
            }
          }
        }
      }
    }

    return false;
  }

  /**
   * Generate numeric ID from URL
   */
  private generateId(url: string): number {
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash) % 1000000;
  }

  /**
   * Fetch detailed article content
   */
  async fetchArticleDetail(articleUrl: string): Promise<Partial<NewsArticle> | null> {
    try {
      const response = await fetch(articleUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // Find main content
      const contentSelectors = [
        '[class*="entry"]',
        '[class*="post"]',
        '[class*="content"]',
        '[class*="article"]',
        'article',
        'main',
      ];

      let contentElement: cheerio.Cheerio<cheerio.Element> | null = null;
      for (const selector of contentSelectors) {
        const elements = $(selector);
        for (let i = 0; i < elements.length; i++) {
          const elem = elements.eq(i);
          const text = elem.text().trim();
          if (text.length > 100) {
            contentElement = elem;
            break;
          }
        }
        if (contentElement) break;
      }

      if (!contentElement) {
        return null;
      }

      // Remove unwanted elements
      contentElement.find('nav, aside, footer, header, script, style').remove();

      // Extract content
      let content = '';
      const paragraphs = contentElement.find('p');
      paragraphs.each((_, p) => {
        const text = $(p).text().trim();
        if (text && text.length > 10) {
          content += text + '\n\n';
        }
      });

      // Extract images
      const images: string[] = [];
      contentElement.find('img').each((_, img) => {
        let src = $(img).attr('src') || $(img).attr('data-src');
        if (src) {
          if (!src.startsWith('http')) {
            src = `${BASE_URL}${src}`;
          }
          images.push(src);
        }
      });

      return {
        content: content.trim() || contentElement.text().trim(),
      };
    } catch (error) {
      console.error('Error fetching article detail:', error);
      return null;
    }
  }
}

export default new NewsParser();


import axios from 'axios';
import Parser from 'rss-parser';
import { env } from '~/env';
import type { NewsArticle, NewsSource } from '~/types';

interface NewsAPIResponse {
  status: string;
  totalResults: number;
  articles: Array<{
    source: { id: string | null; name: string };
    author: string | null;
    title: string;
    description: string;
    url: string;
    urlToImage: string | null;
    publishedAt: string;
    content: string;
  }>;
}

export class NewsFetcher {
  private newsApiKey: string;
  private rssParser: Parser;

  constructor() {
    this.newsApiKey = env.NEWS_API_KEY;
    this.rssParser = new Parser();
  }

  async fetchFromNewsAPI(
    query?: string,
    sources?: string[],
    category?: string,
    pageSize: number = 100
  ): Promise<NewsArticle[]> {
    try {
      const params = new URLSearchParams({
        apiKey: this.newsApiKey,
        pageSize: pageSize.toString(),
        sortBy: 'publishedAt',
        language: 'en',
      });

      if (query) params.append('q', query);
      if (sources && sources.length > 0) params.append('sources', sources.join(','));
      if (category) params.append('category', category);

      const url = `https://newsapi.org/v2/${query ? 'everything' : 'top-headlines'}?${params}`;
      
      const response = await axios.get<NewsAPIResponse>(url);
      
      if (response.data.status !== 'ok') {
        throw new Error(`News API error: ${response.data.status}`);
      }

      return response.data.articles.map(article => this.transformNewsAPIArticle(article));
    } catch (error) {
      console.error('Error fetching from News API:', error);
      throw new Error(`Failed to fetch from News API: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async fetchFromRSS(rssUrl: string, sourceName: string): Promise<NewsArticle[]> {
    try {
      const feed = await this.rssParser.parseURL(rssUrl);
      
      return feed.items.map(item => this.transformRSSItem(item, sourceName));
    } catch (error) {
      console.error(`Error fetching RSS from ${rssUrl}:`, error);
      throw new Error(`Failed to fetch RSS: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async fetchFromMultipleSources(
    sources: NewsSource[],
    query?: string,
    limit: number = 200
  ): Promise<NewsArticle[]> {
    const fetchPromises = sources
      .filter(source => source.isActive)
      .map(async (source) => {
        try {
          switch (source.name.toLowerCase()) {
            case 'newsapi':
              return await this.fetchFromNewsAPI(query, undefined, undefined, Math.floor(limit / sources.length));
            default:
              // Try as RSS feed
              return await this.fetchFromRSS(source.url, source.name);
          }
        } catch (error) {
          console.error(`Error fetching from ${source.name}:`, error);
          return [];
        }
      });

    const results = await Promise.allSettled(fetchPromises);
    
    return results
      .filter((result): result is PromiseFulfilledResult<NewsArticle[]> => result.status === 'fulfilled')
      .flatMap(result => result.value)
      .slice(0, limit);
  }

  private transformNewsAPIArticle(article: NewsAPIResponse['articles'][0]): NewsArticle {
    return {
      id: this.generateArticleId(article.url),
      title: article.title,
      content: article.content || article.description || '',
      summary: article.description || '',
      url: article.url,
      source: article.source.name,
      author: article.author || undefined,
      publishedAt: new Date(article.publishedAt),
      category: 'general',
      tags: this.extractTags(article.title + ' ' + (article.description || '')),
      credibilityScore: this.calculateSourceCredibility(article.source.name),
      imageUrl: article.urlToImage || undefined,
      language: 'en',
    };
  }

  private transformRSSItem(item: any, sourceName: string): NewsArticle {
    return {
      id: this.generateArticleId(item.link || item.guid || ''),
      title: item.title || '',
      content: item.content || item.contentSnippet || item.summary || '',
      summary: item.contentSnippet || item.summary || '',
      url: item.link || '',
      source: sourceName,
      author: item.creator || item.author || undefined,
      publishedAt: new Date(item.pubDate || item.isoDate || Date.now()),
      category: item.categories?.[0] || 'general',
      tags: this.extractTags((item.title || '') + ' ' + (item.contentSnippet || '')),
      credibilityScore: this.calculateSourceCredibility(sourceName),
      imageUrl: item.enclosure?.url || undefined,
      language: 'en',
    };
  }

  private generateArticleId(url: string): string {
    // Create a simple hash from URL
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private extractTags(text: string): string[] {
    // Simple tag extraction - in production, use NLP libraries
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    // Return unique words as tags (simplified)
    return [...new Set(words)].slice(0, 10);
  }

  private calculateSourceCredibility(sourceName: string): number {
    // Simple credibility scoring - in production, use a proper database
    const credibilityMap: Record<string, number> = {
      'BBC News': 0.9,
      'Reuters': 0.9,
      'Associated Press': 0.9,
      'The Guardian': 0.85,
      'The New York Times': 0.85,
      'The Washington Post': 0.85,
      'NPR': 0.8,
      'CNN': 0.75,
      'Fox News': 0.6,
      'Breitbart': 0.3,
    };

    return credibilityMap[sourceName] || 0.5; // Default moderate credibility
  }

  async healthCheck(): Promise<{
    newsapi: boolean;
  }> {
    const checks = await Promise.allSettled([
      // Test News API
      axios.get(`https://newsapi.org/v2/top-headlines?country=in&pageSize=100&apiKey=${this.newsApiKey}`),
      // Test RSS parsing with BBC
    //   this.rssParser.parseURL('http://feeds.bbci.co.uk/news/rss.xml'),
    ]);

    return {
      newsapi: checks[0]?.status === 'fulfilled',
    };
  }
}

// Singleton instance
let newsFetcher: NewsFetcher | null = null;

export function getNewsFetcher(): NewsFetcher {
  if (!newsFetcher) {
    newsFetcher = new NewsFetcher();
  }
  return newsFetcher;
}

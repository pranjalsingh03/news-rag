import { useState, useEffect } from 'react';
import type { NewsArticle } from '~/types';

interface UseNewsOptions {
  sources?: string[];
  category?: string;
  keywords?: string[];
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseNewsReturn {
  articles: NewsArticle[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  hasMore: boolean;
  loadMore: () => Promise<void>;
}

export function useNews(options: UseNewsOptions = {}): UseNewsReturn {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const {
    sources,
    category,
    keywords,
    limit = 100,
    autoRefresh = false,
    refreshInterval = 30000, // 30 seconds
  } = options;

  const fetchNews = async (isLoadMore = false) => {
    if (loading) return;
    
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (sources && sources.length > 0) params.append('sources', sources.join(','));
      if (category) params.append('category', category);
      if (keywords && keywords.length > 0) params.append('keywords', keywords.join(','));
      params.append('limit', limit.toString());

      const response = await fetch(`/api/news/fetch?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message ?? 'Failed to fetch news');
      }

      const newArticles = (data.data ?? []).map((article: NewsArticle) => ({
        ...article,
        publishedAt: new Date(article.publishedAt),
      }));
      
      if (isLoadMore) {
        setArticles(prev => [...prev, ...newArticles]);
      } else {
        setArticles(newArticles);
      }

      setHasMore(newArticles.length === limit);
      setOffset(prev => isLoadMore ? prev + newArticles.length : newArticles.length);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching news:', err);
    } finally {
      setLoading(false);
    }
  };

  const refetch = async () => {
    setOffset(0);
    await fetchNews(false);
  };

  const loadMore = async () => {
    if (hasMore && !loading) {
      await fetchNews(true);
    }
  };

  useEffect(() => {
    // Only fetch on mount if autoRefresh is enabled, otherwise wait for manual trigger
    if (autoRefresh) {
      void fetchNews();
    }
  }, [autoRefresh, fetchNews, sources?.join(','), category, keywords?.join(','), limit]);

  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(() => {
        void refetch();
      }, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, refetch]);

  return {
    articles,
    loading,
    error,
    refetch,
    hasMore,
    loadMore,
  };
}

// Hook for fetching news from specific sources
export function useNewsBySource(source: string, limit = 100) {
  return useNews({
    sources: [source],
    limit,
  });
}

// Hook for fetching news by category
export function useNewsByCategory(category: string, limit = 100) {
  return useNews({
    category,
    limit,
  });
}

// Hook for fetching latest news with auto-refresh
export function useLatestNews(limit = 100, autoRefresh = false) {
  return useNews({
    limit,
    autoRefresh,
    refreshInterval: 60000, // 1 minute
  });
}

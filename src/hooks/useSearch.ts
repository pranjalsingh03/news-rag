import { useState, useCallback } from 'react';
import type { SearchResult, NewsArticle } from '~/types';

interface UseSearchOptions {
  debounceMs?: number;
  minQueryLength?: number;
}

interface UseSearchReturn {
  results: SearchResult | null;
  loading: boolean;
  error: string | null;
  search: (query: string, filters?: SearchFilters) => Promise<void>;
  clearResults: () => void;
}

interface SearchFilters {
  sources?: string[];
  categories?: string[];
  dateFrom?: string;
  dateTo?: string;
  minCredibility?: number;
}

export function useSearch(options: UseSearchOptions = {}): UseSearchReturn {
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { debounceMs = 300, minQueryLength = 2 } = options;

  const search = useCallback(async (query: string, filters?: SearchFilters) => {
    if (!query || query.length < minQueryLength) {
      setResults(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const requestBody = {
        query,
        filters,
        limit: 20,
      };

      const response = await fetch('/api/news/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json() as { success: boolean; data: SearchResult; error?: { message: string } };

      if (!data.success) {
        throw new Error(data.error?.message ?? 'Search failed');
      }

      // Transform publishedAt strings to Date objects
      const transformedData = {
        ...data.data,
        articles: data.data.articles.map((article: NewsArticle) => ({
          ...article,
          publishedAt: new Date(article.publishedAt),
        })),
      };

      setResults(transformedData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  }, [minQueryLength]);

  const clearResults = useCallback(() => {
    setResults(null);
    setError(null);
  }, []);

  // Remove the unused debouncedSearch
  // const debouncedSearch = useCallback(
  //   debounce(search, debounceMs),
  //   [search, debounceMs]
  // );

  return {
    results,
    loading,
    error,
    search,
    clearResults,
  };
}

// Hook for instant search (no debouncing)
export function useInstantSearch() {
  return useSearch({ debounceMs: 0 });
}

// Hook for advanced search with filters
export function useAdvancedSearch() {
  const searchHook = useSearch();
  
  const advancedSearch = useCallback(async (
    query: string,
    sources?: string[],
    categories?: string[],
    dateRange?: { from: Date; to: Date },
    minCredibility?: number
  ) => {
    const filters: SearchFilters = {};
    
    if (sources && sources.length > 0) filters.sources = sources;
    if (categories && categories.length > 0) filters.categories = categories;
    if (dateRange) {
      filters.dateFrom = dateRange.from.toISOString();
      filters.dateTo = dateRange.to.toISOString();
    }
    if (minCredibility !== undefined) filters.minCredibility = minCredibility;

    await searchHook.search(query, filters);
  }, [searchHook]);

  return {
    ...searchHook,
    advancedSearch,
  };
}

// Simple debounce utility
function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

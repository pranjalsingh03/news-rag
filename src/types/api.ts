import type { NewsArticle, SearchResult, FactCheckResult, EmbeddingResponse } from './news';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId: string;
    processingTime: number;
  };
}

// News API Routes
export interface FetchNewsRequest {
  sources?: string[];
  category?: string;
  keywords?: string[];
  limit?: number;
  since?: string;
}

export interface FetchNewsResponse extends ApiResponse<NewsArticle[]> {}

export interface SearchNewsRequest {
  query: string;
  filters?: {
    sources?: string[];
    dateFrom?: string;
    dateTo?: string;
    categories?: string[];
    minCredibility?: number;
  };
  limit?: number;
}

export interface SearchNewsResponse extends ApiResponse<SearchResult> {}

export interface FactCheckRequest {
  articleId?: string;
  claim?: string;
  text?: string;
}

export interface FactCheckResponse extends ApiResponse<FactCheckResult> {}

// Embeddings API
export interface CreateEmbeddingRequest {
  text: string;
  model?: string;
}

export interface CreateEmbeddingResponse extends ApiResponse<EmbeddingResponse> {}

// Health Check
export interface HealthCheckResponse extends ApiResponse<{
  status: 'healthy' | 'unhealthy';
  services: {
    database: boolean;
    vectorStore: boolean;
    newsAPIs: boolean;
    embeddings: boolean;
  };
  timestamp: string;
  uptime: number;
}> {}

// Analytics
export interface AnalyticsData {
  totalArticles: number;
  articlesProcessedToday: number;
  averageCredibilityScore: number;
  topSources: Array<{
    name: string;
    count: number;
    avgCredibility: number;
  }>;
  searchStats: {
    totalSearches: number;
    avgResponseTime: number;
    popularQueries: string[];
  };
  factCheckStats: {
    totalChecks: number;
    verdictDistribution: Record<string, number>;
    avgConfidence: number;
  };
}

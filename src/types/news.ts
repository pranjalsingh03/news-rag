export interface NewsArticle {
  id: string;
  title: string;
  content: string;
  summary: string;
  url: string;
  source: string;
  author?: string;
  publishedAt: Date | string;
  category: string;
  tags: string[];
  credibilityScore: number;
  embedding?: number[];
  imageUrl?: string;
  language: string;
}

export interface NewsSource {
  id: string;
  name: string;
  url: string;
  apiKey?: string;
  isActive: boolean;
  credibilityRating: number;
  lastFetched?: Date;
  articlesCount: number;
}

export interface SearchQuery {
  query: string;
  filters?: {
    sources?: string[];
    dateFrom?: Date;
    dateTo?: Date;
    categories?: string[];
    minCredibility?: number;
  };
  limit?: number;
  embedding?: number[];
}

export interface SearchResult {
  articles: NewsArticle[];
  totalCount: number;
  query: string;
  processingTime: number;
  relevanceScores: number[];
}

export interface FactCheckResult {
  articleId: string;
  claim: string;
  verdict: 'TRUE' | 'FALSE' | 'PARTIALLY_TRUE' | 'UNVERIFIED' | 'MISLEADING';
  confidence: number;
  supportingEvidence: {
    articleId: string;
    relevantText: string;
    source: string;
    credibilityScore: number;
  }[];
  explanation: string;
  checkedAt: Date;
}

export interface EmbeddingRequest {
  text: string;
  model?: string;
}

export interface EmbeddingResponse {
  embedding: number[];
  model: string;
  usage: {
    promptTokens: number;
    totalTokens: number;
  };
}

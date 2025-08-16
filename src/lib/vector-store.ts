import type { NewsArticle } from '~/types';
import { ChromaVectorStore, getChromaVectorStore } from './chroma-vector-store';

// Interface that vector stores implement
interface IVectorStore {
  upsertArticle(article: NewsArticle, embedding: number[]): Promise<void>;
  upsertArticles(articles: Array<{ article: NewsArticle; embedding: number[] }>): Promise<void>;
  searchSimilar(queryEmbedding: number[], topK?: number, filter?: Record<string, unknown>): Promise<Array<{ id: string; score: number; metadata: unknown }>>;
  deleteArticle(articleId: string): Promise<void>;
  deleteArticles(articleIds: string[]): Promise<void>;
  getArticle(articleId: string): Promise<{ id: string; metadata: unknown } | null>;
  getIndexStats(): Promise<{ totalVectors: number; dimension: number; indexFullness: number }>;
  searchByDateRange(queryEmbedding: number[], startDate: Date, endDate: Date, topK?: number): Promise<Array<{ id: string; score: number; metadata: unknown }>>;
  searchBySource(queryEmbedding: number[], sources: string[], topK?: number): Promise<Array<{ id: string; score: number; metadata: unknown }>>;
  searchByCredibility(queryEmbedding: number[], minCredibility: number, topK?: number): Promise<Array<{ id: string; score: number; metadata: unknown }>>;
}

// Factory function to create the vector store
function createVectorStore(): IVectorStore {
  console.log('Using ChromaDB for vector storage');
  return getChromaVectorStore();
}

// Singleton instance
let vectorStore: IVectorStore | null = null;

export function getVectorStore(): IVectorStore {
  vectorStore ??= createVectorStore();
  return vectorStore;
}

// Export ChromaDB as the default vector store
export { ChromaVectorStore as VectorStore };
export type { IVectorStore as VectorStoreInterface };

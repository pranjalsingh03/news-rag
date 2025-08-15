import { CloudClient } from 'chromadb';
import type { Collection } from 'chromadb';
import type { NewsArticle } from '~/types';
import { env } from '~/env';

export class ChromaVectorStore {
  private client: CloudClient;
  private collection: Collection | null = null;
  private collectionName: string = 'news_articles';

  constructor() {
    // Use ChromaDB Cloud Client configuration
    this.client = new CloudClient({
      tenant: env.CHROMADB_TENANT,
      database: env.CHROMADB_DATABASE,
      apiKey: env.CHROMADB_API_KEY,
    });
    
    console.log('Using ChromaDB Cloud for vector storage');
  }

  private async ensureCollection(): Promise<Collection> {
    if (this.collection) return this.collection;

    try {
      // Try to get existing collection first
      this.collection = await this.client.getCollection({
        name: this.collectionName,
      });
      console.log('Using existing ChromaDB collection');
    } catch (error) {
      try {
        // Collection doesn't exist, create it
        this.collection = await this.client.createCollection({
          name: this.collectionName,
          metadata: { description: 'News articles for RAG system' },
        });
        console.log('Created new ChromaDB collection');
      } catch (createError: any) {
        if (createError.message && createError.message.includes('already exists')) {
          // Collection was created between our check and creation attempt
          this.collection = await this.client.getCollection({
            name: this.collectionName,
          });
          console.log('Retrieved existing ChromaDB collection after race condition');
        } else {
          throw createError;
        }
      }
    }

    return this.collection!;
  }

  async upsertArticle(article: NewsArticle, embedding: number[]): Promise<void> {
    try {
      const collection = await this.ensureCollection();
      
      const publishedAt = article.publishedAt instanceof Date 
        ? article.publishedAt.toISOString() 
        : new Date(article.publishedAt).toISOString();

      await collection.upsert({
        ids: [article.id],
        embeddings: [embedding],
        metadatas: [{
          title: article.title,
          source: article.source,
          url: article.url,
          publishedAt,
          category: article.category,
          tags: JSON.stringify(article.tags),
          credibilityScore: article.credibilityScore,
          author: article.author || '',
          summary: article.summary,
          imageUrl: article.imageUrl || '',
          language: article.language,
        }],
        documents: [article.content || article.summary],
      });
    } catch (error: any) {
      console.error(`Error upserting article ${article.id}:`, error.message || error);
      throw error;
    }
  }

  async upsertArticles(articles: Array<{ article: NewsArticle; embedding: number[] }>): Promise<void> {
    const collection = await this.ensureCollection();
    
    const ids = articles.map(({ article }) => article.id);
    const embeddings = articles.map(({ embedding }) => embedding);
    const documents = articles.map(({ article }) => article.content || article.summary);
    const metadatas = articles.map(({ article }) => {
      const publishedAt = article.publishedAt instanceof Date 
        ? article.publishedAt.toISOString() 
        : new Date(article.publishedAt).toISOString();

      return {
        title: article.title,
        source: article.source,
        url: article.url,
        publishedAt,
        category: article.category,
        tags: JSON.stringify(article.tags),
        credibilityScore: article.credibilityScore,
        author: article.author || '',
        summary: article.summary,
        imageUrl: article.imageUrl || '',
        language: article.language,
      };
    });

    // ChromaDB can handle batch operations efficiently
    await collection.upsert({
      ids,
      embeddings,
      metadatas,
      documents,
    });
  }

  async searchSimilar(
    queryEmbedding: number[],
    topK: number = 10,
    filter?: Record<string, any>
  ): Promise<Array<{ id: string; score: number; metadata: any }>> {
    const collection = await this.ensureCollection();
    
    // Convert filters to ChromaDB where clause format
    let whereClause: any = undefined;
    if (filter) {
      whereClause = this.convertFilterToWhere(filter);
    }

    const results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: topK,
      where: whereClause,
      include: ['metadatas', 'distances'],
    });

    // Convert ChromaDB results to our format
    const formattedResults: Array<{ id: string; score: number; metadata: any }> = [];
    
    if (results.ids && results.ids[0] && results.metadatas && results.metadatas[0] && results.distances && results.distances[0]) {
      for (let i = 0; i < results.ids[0].length; i++) {
        const metadata = results.metadatas[0][i];
        if (metadata) {
          // Parse tags back to array
          if (metadata.tags && typeof metadata.tags === 'string') {
            try {
              (metadata as any).tags = JSON.parse(metadata.tags);
            } catch (e) {
              (metadata as any).tags = [];
            }
          }

          formattedResults.push({
            id: results.ids[0][i] as string,
            score: 1 - (results.distances[0][i] || 0), // Convert distance to similarity score
            metadata,
          });
        }
      }
    }

    return formattedResults;
  }

  private convertFilterToWhere(filter: Record<string, any>): any {
    const conditions: any[] = [];

    for (const [key, value] of Object.entries(filter)) {
      if (key === 'publishedAt' && typeof value === 'object') {
        // Handle date range filters - need to create separate conditions for each operator
        if (value.$gte) {
          conditions.push({ [key]: { $gte: value.$gte } });
        }
        if (value.$lte) {
          conditions.push({ [key]: { $lte: value.$lte } });
        }
      } else if (key === 'source' && value.$in) {
        // Handle source array filters
        conditions.push({ [key]: { $in: value.$in } });
      } else if (key === 'category' && value.$in) {
        // Handle category array filters
        conditions.push({ [key]: { $in: value.$in } });
      } else if (key === 'credibilityScore' && typeof value === 'object') {
        // Handle credibility score filters
        if (value.$gte !== undefined) {
          conditions.push({ [key]: { $gte: value.$gte } });
        }
      } else {
        // Direct equality
        conditions.push({ [key]: value });
      }
    }

    // Return appropriate structure based on number of conditions
    if (conditions.length === 0) {
      return undefined;
    } else if (conditions.length === 1) {
      return conditions[0];
    } else {
      // Multiple conditions need to be wrapped in $and
      return { $and: conditions };
    }
  }

  async deleteArticle(articleId: string): Promise<void> {
    const collection = await this.ensureCollection();
    await collection.delete({
      ids: [articleId],
    });
  }

  async deleteArticles(articleIds: string[]): Promise<void> {
    const collection = await this.ensureCollection();
    await collection.delete({
      ids: articleIds,
    });
  }

  async getArticle(articleId: string): Promise<{ id: string; metadata: any } | null> {
    const collection = await this.ensureCollection();
    
    const results = await collection.get({
      ids: [articleId],
      include: ['metadatas'],
    });

    if (results.ids && results.ids.length > 0 && results.metadatas && results.metadatas[0]) {
      const metadata = results.metadatas[0];
      
      // Parse tags back to array
      if (metadata.tags && typeof metadata.tags === 'string') {
        try {
          (metadata as any).tags = JSON.parse(metadata.tags);
        } catch (e) {
          (metadata as any).tags = [];
        }
      }

      return {
        id: results.ids[0]!,
        metadata,
      };
    }

    return null;
  }

  async getIndexStats(): Promise<{
    totalVectors: number;
    dimension: number;
    indexFullness: number;
  }> {
    const collection = await this.ensureCollection();
    
    const count = await collection.count();
    
    return {
      totalVectors: count,
      dimension: 1536, // Default OpenAI embedding dimension
      indexFullness: 0, // ChromaDB doesn't have a fullness concept
    };
  }

  async searchByDateRange(
    queryEmbedding: number[],
    startDate: Date,
    endDate: Date,
    topK: number = 10
  ): Promise<Array<{ id: string; score: number; metadata: any }>> {
    const filter = {
      publishedAt: {
        $gte: startDate.toISOString(),
        $lte: endDate.toISOString(),
      },
    };

    return this.searchSimilar(queryEmbedding, topK, filter);
  }

  async searchBySource(
    queryEmbedding: number[],
    sources: string[],
    topK: number = 10
  ): Promise<Array<{ id: string; score: number; metadata: any }>> {
    const filter = {
      source: { $in: sources },
    };

    return this.searchSimilar(queryEmbedding, topK, filter);
  }

  async searchByCredibility(
    queryEmbedding: number[],
    minCredibility: number,
    topK: number = 10
  ): Promise<Array<{ id: string; score: number; metadata: any }>> {
    const filter = {
      credibilityScore: { $gte: minCredibility },
    };

    return this.searchSimilar(queryEmbedding, topK, filter);
  }

  async clearCollection(): Promise<void> {
    try {
      await this.client.deleteCollection({ name: this.collectionName });
      this.collection = null;
    } catch (error) {
      // Collection might not exist, which is fine
    }
  }
}

// Singleton instance
let chromaVectorStore: ChromaVectorStore | null = null;

export function getChromaVectorStore(): ChromaVectorStore {
  if (!chromaVectorStore) {
    chromaVectorStore = new ChromaVectorStore();
  }
  return chromaVectorStore;
}

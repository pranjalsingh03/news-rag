import { getAIService } from './ai-service';
import type { EmbeddingRequest, EmbeddingResponse } from '~/types';

export class EmbeddingsService {
  private aiService: ReturnType<typeof getAIService>;

  constructor() {
    this.aiService = getAIService();
  }

  async createEmbedding(text: string, model?: string): Promise<EmbeddingResponse> {
    return await this.aiService.createEmbedding(text, model);
  }

  async createEmbeddings(texts: string[], model?: string): Promise<EmbeddingResponse[]> {
    return await this.aiService.createEmbeddings(texts, model);
  }

  async createArticleEmbedding(title: string, content: string, summary?: string): Promise<number[]> {
    // Combine title, summary, and content for better semantic representation
    const combinedText = [
      title,
      summary ?? '',
      content.substring(0, 8000), // Limit content to avoid token limits
    ].filter(Boolean).join('\n\n');

    const response = await this.createEmbedding(combinedText);
    return response.embedding;
  }

  async createQueryEmbedding(query: string): Promise<number[]> {
    const response = await this.createEmbedding(query);
    return response.embedding;
  }

  // Calculate cosine similarity between two embeddings
  calculateSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have the same dimension');
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i]! * embedding2[i]!;
      norm1 += embedding1[i]! * embedding1[i]!;
      norm2 += embedding2[i]! * embedding2[i]!;
    }

    norm1 = Math.sqrt(norm1);
    norm2 = Math.sqrt(norm2);

    if (norm1 === 0 || norm2 === 0) {
      return 0;
    }

    return dotProduct / (norm1 * norm2);
  }

  // Preprocess text for better embeddings
  preprocessText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\s.,!?-]/g, '') // Remove special characters
      .trim()
      .toLowerCase();
  }

  // Check if text is suitable for embedding (not too short/long, has meaningful content)
  isTextSuitableForEmbedding(text: string): boolean {
    const cleaned = this.preprocessText(text);
    
    // Must be at least 10 characters and at most 8000 characters
    if (cleaned.length < 10 || cleaned.length > 8000) {
      return false;
    }

    // Must contain at least 3 words
    const wordCount = cleaned.split(/\s+/).length;
    if (wordCount < 3) {
      return false;
    }

    // Should not be mostly numbers or special characters
    const alphaRatio = (cleaned.match(/[a-z]/g) ?? []).length / cleaned.length;
    if (alphaRatio < 0.5) {
      return false;
    }

    return true;
  }
}

// Singleton instance
let embeddingsService: EmbeddingsService | null = null;

export function getEmbeddingsService(): EmbeddingsService {
  embeddingsService ??= new EmbeddingsService();
  return embeddingsService;
}

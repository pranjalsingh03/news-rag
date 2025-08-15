import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { env } from '~/env';
import type { EmbeddingRequest, EmbeddingResponse } from '~/types';

export interface AIProvider {
  createEmbedding(text: string, model?: string): Promise<EmbeddingResponse>;
  createEmbeddings(texts: string[], model?: string): Promise<EmbeddingResponse[]>;
  generateText(prompt: string, model?: string): Promise<string>;
  isAvailable(): boolean;
}

class OpenAIProvider implements AIProvider {
  private client: OpenAI;
  private model: string;
  private embeddingModel: string;

  constructor() {
    if (!env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is required');
    }
    
    this.client = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });
    this.model = env.OPENAI_MODEL;
    this.embeddingModel = env.OPENAI_EMBEDDING_MODEL;
  }

  async createEmbedding(text: string, model?: string): Promise<EmbeddingResponse> {
    try {
      const response = await this.client.embeddings.create({
        model: model || this.embeddingModel,
        input: text,
      });

      const embedding = response.data[0]?.embedding;
      if (!embedding) {
        throw new Error('No embedding returned from OpenAI');
      }

      return {
        embedding,
        model: response.model,
        usage: {
          promptTokens: response.usage.prompt_tokens,
          totalTokens: response.usage.total_tokens,
        },
      };
    } catch (error) {
      console.error('Error creating OpenAI embedding:', error);
      throw new Error(`Failed to create embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createEmbeddings(texts: string[], model?: string): Promise<EmbeddingResponse[]> {
    try {
      const batchSize = 100;
      const results: EmbeddingResponse[] = [];

      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        
        const response = await this.client.embeddings.create({
          model: model || this.embeddingModel,
          input: batch,
        });

        const batchResults = response.data.map((item: any) => ({
          embedding: item.embedding,
          model: response.model,
          usage: {
            promptTokens: Math.floor(response.usage.prompt_tokens / batch.length),
            totalTokens: Math.floor(response.usage.total_tokens / batch.length),
          },
        }));

        results.push(...batchResults);
      }

      return results;
    } catch (error) {
      console.error('Error creating OpenAI embeddings:', error);
      throw new Error(`Failed to create embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateText(prompt: string, model?: string): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: model || this.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 500,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      return content;
    } catch (error) {
      console.error('Error generating OpenAI text:', error);
      throw new Error(`Failed to generate text: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  isAvailable(): boolean {
    return !!env.OPENAI_API_KEY;
  }
}

class GeminiProvider implements AIProvider {
  private client: GoogleGenerativeAI;
  private model: string;
  private embeddingModel: string;

  constructor() {
    if (!env.GEMINI_API_KEY) {
      throw new Error('Gemini API key is required');
    }
    
    this.client = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    this.model = env.GEMINI_MODEL;
    this.embeddingModel = env.GEMINI_EMBEDDING_MODEL;
  }

  async createEmbedding(text: string, model?: string): Promise<EmbeddingResponse> {
    try {
      const embeddingModel = this.client.getGenerativeModel({ 
        model: model || this.embeddingModel 
      });
      
      const result = await embeddingModel.embedContent(text);
      const embedding = result.embedding.values;

      if (!embedding || embedding.length === 0) {
        throw new Error('No embedding returned from Gemini');
      }

      return {
        embedding: Array.from(embedding),
        model: model || this.embeddingModel,
        usage: {
          promptTokens: text.length / 4, // Rough estimation
          totalTokens: text.length / 4,
        },
      };
    } catch (error) {
      console.error('Error creating Gemini embedding:', error);
      throw new Error(`Failed to create embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createEmbeddings(texts: string[], model?: string): Promise<EmbeddingResponse[]> {
    try {
      const results: EmbeddingResponse[] = [];
      
      // Process one by one for now (Gemini has different batch API)
      for (const text of texts) {
        const result = await this.createEmbedding(text, model);
        results.push(result);
      }

      return results;
    } catch (error) {
      console.error('Error creating Gemini embeddings:', error);
      throw new Error(`Failed to create embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateText(prompt: string, model?: string): Promise<string> {
    try {
      const generativeModel = this.client.getGenerativeModel({ 
        model: model || this.model 
      });
      
      const result = await generativeModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      if (!text) {
        throw new Error('No response from Gemini');
      }

      return text;
    } catch (error) {
      console.error('Error generating Gemini text:', error);
      throw new Error(`Failed to generate text: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  isAvailable(): boolean {
    return !!env.GEMINI_API_KEY;
  }
}

// AI Service Factory
export class AIService {
  private static instance: AIProvider | null = null;

  static getInstance(): AIProvider {
    if (!AIService.instance) {
      const provider = env.AI_PROVIDER;
      
      switch (provider) {
        case 'gemini':
          if (env.GEMINI_API_KEY) {
            AIService.instance = new GeminiProvider();
          } else if (env.OPENAI_API_KEY) {
            console.warn('Gemini API key not found, falling back to OpenAI');
            AIService.instance = new OpenAIProvider();
          } else {
            throw new Error('No AI provider available');
          }
          break;
          
        case 'openai':
          if (env.OPENAI_API_KEY) {
            AIService.instance = new OpenAIProvider();
          } else if (env.GEMINI_API_KEY) {
            console.warn('OpenAI API key not found, falling back to Gemini');
            AIService.instance = new GeminiProvider();
          } else {
            throw new Error('No AI provider available');
          }
          break;
          
        default:
          // Auto-detect available provider
          if (env.GEMINI_API_KEY) {
            AIService.instance = new GeminiProvider();
          } else if (env.OPENAI_API_KEY) {
            AIService.instance = new OpenAIProvider();
          } else {
            throw new Error('No AI provider available');
          }
      }
    }
    
    return AIService.instance;
  }

  static reset(): void {
    AIService.instance = null;
  }
}

// Export the service instance
export function getAIService(): AIProvider {
  return AIService.getInstance();
}

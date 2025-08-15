import { NextRequest, NextResponse } from 'next/server';
import { getChromaVectorStore } from '~/lib/chroma-vector-store';
import { getNewsFetcher } from '~/lib/news-fetcher';
import { getEmbeddingsService } from '~/lib/embeddings';
import type { HealthCheckResponse } from '~/types/api';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Check all services
    const [vectorStoreStatus, newsApiStatus, embeddingsStatus] = await Promise.allSettled([
      checkVectorStore(),
      checkNewsAPIs(),
      checkEmbeddings(),
    ]);

    const services = {
      database: true, // Assume database is healthy for now
      vectorStore: vectorStoreStatus.status === 'fulfilled' && vectorStoreStatus.value,
      newsAPIs: newsApiStatus.status === 'fulfilled' && newsApiStatus.value,
      embeddings: embeddingsStatus.status === 'fulfilled' && embeddingsStatus.value,
    };

    const allHealthy = Object.values(services).every(Boolean);
    const processingTime = Date.now() - startTime;

    const response: HealthCheckResponse = {
      success: true,
      data: {
        status: allHealthy ? 'healthy' : 'unhealthy',
        services,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: generateRequestId(),
        processingTime,
      },
    };

    return NextResponse.json(response, {
      status: allHealthy ? 200 : 503,
    });
  } catch (error) {
    console.error('Health check error:', error);

    const response: HealthCheckResponse = {
      success: false,
      error: {
        message: 'Health check failed',
        code: 'HEALTH_CHECK_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: generateRequestId(),
        processingTime: Date.now() - startTime,
      },
    };

    return NextResponse.json(response, { status: 500 });
  }
}

async function checkVectorStore(): Promise<boolean> {
  try {
    // Test vector store connection
    const vectorStore = getChromaVectorStore();
    await vectorStore.getIndexStats();
    return true;
  } catch (error) {
    console.error('Vector store health check failed:', error);
    return false;
  }
}

async function checkNewsAPIs(): Promise<boolean> {
  try {
    const newsFetcher = getNewsFetcher();
    const status = await newsFetcher.healthCheck();
    return status.newsapi ;
  } catch (error) {
    console.error('News APIs health check failed:', error);
    return false;
  }
}

async function checkEmbeddings(): Promise<boolean> {
  try {
    const embeddingsService = getEmbeddingsService();
    const testEmbedding = await embeddingsService.createEmbedding('test');
    return testEmbedding.embedding.length > 0;
  } catch (error) {
    console.error('Embeddings health check failed:', error);
    return false;
  }
}

function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

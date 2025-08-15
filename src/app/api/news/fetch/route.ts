import { NextRequest, NextResponse } from 'next/server';
import { getNewsFetcher } from '~/lib/news-fetcher';
import { getEmbeddingsService } from '~/lib/embeddings';
import { getChromaVectorStore } from '~/lib/chroma-vector-store';
import type { FetchNewsRequest, FetchNewsResponse } from '~/types/api';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body: FetchNewsRequest = await request.json();
    
    const newsFetcher = getNewsFetcher();
    const embeddingsService = getEmbeddingsService();
    const vectorStore = getChromaVectorStore();

    // Fetch articles based on request parameters
    let articles;
    
    if (body.sources && body.sources.length > 0) {
      // Fetch from specific sources
      const sources = body.sources.map(source => ({
        id: source,
        name: source,
        url: '',
        isActive: true,
        credibilityRating: 0.7,
        articlesCount: 0,
      }));
      
      articles = await newsFetcher.fetchFromMultipleSources(
        sources,
        body.keywords?.join(' '),
        body.limit
      );
    } else if (body.keywords && body.keywords.length > 0) {
      // Fetch by keywords from News API
      articles = await newsFetcher.fetchFromNewsAPI(
        body.keywords.join(' '),
        undefined,
        body.category,
        body.limit
      );
    } else if (body.category) {
      // Fetch by category
      articles = await newsFetcher.fetchFromNewsAPI(
        undefined,
        undefined,
        body.category,
        body.limit
      );
    } else {
      // Fetch latest news
      articles = await newsFetcher.fetchFromNewsAPI(
        undefined,
        undefined,
        undefined,
        body.limit
      );
    }

    // Filter by date if specified
    if (body.since) {
      const sinceDate = new Date(body.since);
      articles = articles.filter(article => {
        const articleDate = article.publishedAt instanceof Date ? article.publishedAt : new Date(article.publishedAt);
        return articleDate >= sinceDate;
      });
    }

    // Generate embeddings and store in vector database (if configured)
    let processedArticles = articles;
    
    try {
      const embeddingPromises = articles.map(async (article) => {
        try {
          // Only try to create embeddings if AI service is configured
          if (embeddingsService) {
            const embedding = await embeddingsService.createArticleEmbedding(
              article.title,
              article.content,
              article.summary
            );
            
            // Only try to store in vector DB if it's configured
            try {
              await vectorStore.upsertArticle(article, embedding);
            } catch (vectorError) {
              const errorMsg = vectorError instanceof Error ? vectorError.message : 'Unknown vector store error';
              console.warn(`Vector store not available for article ${article.id}:`, errorMsg);
            }
            
            return { ...article, embedding };
          }
          return article;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown processing error';
          console.warn(`Failed to process article ${article.id}:`, errorMsg);
          return article;
        }
      });

      processedArticles = await Promise.all(embeddingPromises);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown embedding service error';
      console.warn('Embedding service not available, returning articles without embeddings:', errorMsg);
      processedArticles = articles;
    }

    const response: FetchNewsResponse = {
      success: true,
      data: processedArticles,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: generateRequestId(),
        processingTime: Date.now() - startTime,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Fetch news API error:', error);

    const errorResponse: FetchNewsResponse = {
      success: false,
      error: {
        message: 'Failed to fetch news',
        code: 'FETCH_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: generateRequestId(),
        processingTime: Date.now() - startTime,
      },
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    
    const fetchRequest: FetchNewsRequest = {
      sources: searchParams.get('sources')?.split(','),
      category: searchParams.get('category') || undefined,
      keywords: searchParams.get('keywords')?.split(','),
      limit: parseInt(searchParams.get('limit') || '100'),
      since: searchParams.get('since') || undefined,
    };

    // Reuse the POST logic
    return await POST(new NextRequest(request.url, {
      method: 'POST',
      body: JSON.stringify(fetchRequest),
      headers: { 'content-type': 'application/json' },
    }));
  } catch (error) {
    console.error('Fetch news GET API error:', error);

    const errorResponse: FetchNewsResponse = {
      success: false,
      error: {
        message: 'Failed to fetch news',
        code: 'FETCH_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: generateRequestId(),
        processingTime: Date.now() - startTime,
      },
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

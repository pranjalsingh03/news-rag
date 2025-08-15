import { NextRequest, NextResponse } from 'next/server';
import { getChromaVectorStore } from '~/lib/chroma-vector-store';
import { getEmbeddingsService } from '~/lib/embeddings';
import type { SearchNewsRequest, SearchNewsResponse } from '~/types/api';
import type { SearchResult } from '~/types';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body: SearchNewsRequest = await request.json();
    
    if (!body.query || typeof body.query !== 'string') {
      const errorResponse: SearchNewsResponse = {
        success: false,
        error: {
          message: 'Query is required and must be a string',
          code: 'INVALID_INPUT',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: generateRequestId(),
          processingTime: Date.now() - startTime,
        },
      };
      
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const embeddingsService = getEmbeddingsService();
    const vectorStore = getChromaVectorStore();

    // Generate embedding for the search query
    const queryEmbedding = await embeddingsService.createQueryEmbedding(body.query);

    // Build filters for vector search
    const filters: Record<string, any> = {};
    
    if (body.filters) {
      if (body.filters.sources && body.filters.sources.length > 0) {
        filters.source = { $in: body.filters.sources };
      }
      
      if (body.filters.categories && body.filters.categories.length > 0) {
        filters.category = { $in: body.filters.categories };
      }
      
      if (body.filters.minCredibility !== undefined) {
        filters.credibilityScore = { $gte: body.filters.minCredibility };
      }
      
      if (body.filters.dateFrom || body.filters.dateTo) {
        const dateFilter: Record<string, string> = {};
        if (body.filters.dateFrom) {
          dateFilter.$gte = new Date(body.filters.dateFrom).toISOString();
        }
        if (body.filters.dateTo) {
          dateFilter.$lte = new Date(body.filters.dateTo).toISOString();
        }
        filters.publishedAt = dateFilter;
      }
    }

    // Search for similar articles
    const searchResults = await vectorStore.searchSimilar(
      queryEmbedding,
      body.limit || 20,
      Object.keys(filters).length > 0 ? filters : undefined
    );

    // Transform results to articles
    const articles = searchResults.map(result => ({
      id: result.id,
      title: result.metadata.title,
      content: '', // Content not stored in metadata due to size
      summary: result.metadata.summary,
      url: result.metadata.url,
      source: result.metadata.source,
      author: result.metadata.author || undefined,
      publishedAt: new Date(result.metadata.publishedAt),
      category: result.metadata.category,
      tags: result.metadata.tags || [],
      credibilityScore: result.metadata.credibilityScore,
      imageUrl: result.metadata.imageUrl || undefined,
      language: 'en',
    }));

    const relevanceScores = searchResults.map(result => result.score);

    const searchResult: SearchResult = {
      articles,
      totalCount: articles.length,
      query: body.query,
      processingTime: Date.now() - startTime,
      relevanceScores,
    };

    const response: SearchNewsResponse = {
      success: true,
      data: searchResult,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: generateRequestId(),
        processingTime: Date.now() - startTime,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Search news API error:', error);

    const errorResponse: SearchNewsResponse = {
      success: false,
      error: {
        message: 'Failed to search news',
        code: 'SEARCH_ERROR',
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
    
    const query = searchParams.get('q') || searchParams.get('query');
    if (!query) {
      const errorResponse: SearchNewsResponse = {
        success: false,
        error: {
          message: 'Query parameter is required',
          code: 'MISSING_QUERY',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: generateRequestId(),
          processingTime: Date.now() - startTime,
        },
      };
      
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const searchRequest: SearchNewsRequest = {
      query,
      filters: {
        sources: searchParams.get('sources')?.split(','),
        categories: searchParams.get('categories')?.split(','),
        dateFrom: searchParams.get('dateFrom') || undefined,
        dateTo: searchParams.get('dateTo') || undefined,
        minCredibility: searchParams.get('minCredibility') 
          ? parseFloat(searchParams.get('minCredibility')!) 
          : undefined,
      },
      limit: parseInt(searchParams.get('limit') || '20'),
    };

    // Reuse the POST logic
    return await POST(new NextRequest(request.url, {
      method: 'POST',
      body: JSON.stringify(searchRequest),
      headers: { 'content-type': 'application/json' },
    }));
  } catch (error) {
    console.error('Search news GET API error:', error);

    const errorResponse: SearchNewsResponse = {
      success: false,
      error: {
        message: 'Failed to search news',
        code: 'SEARCH_ERROR',
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

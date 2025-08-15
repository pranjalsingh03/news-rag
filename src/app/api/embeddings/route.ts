import { NextRequest, NextResponse } from 'next/server';
import { getEmbeddingsService } from '~/lib/embeddings';
import type { CreateEmbeddingRequest, CreateEmbeddingResponse } from '~/types/api';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body: CreateEmbeddingRequest = await request.json();
    
    if (!body.text || typeof body.text !== 'string') {
      const errorResponse: CreateEmbeddingResponse = {
        success: false,
        error: {
          message: 'Text is required and must be a string',
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
    
    // Check if text is suitable for embedding
    if (!embeddingsService.isTextSuitableForEmbedding(body.text)) {
      const errorResponse: CreateEmbeddingResponse = {
        success: false,
        error: {
          message: 'Text is not suitable for embedding (too short, too long, or invalid content)',
          code: 'INVALID_TEXT',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: generateRequestId(),
          processingTime: Date.now() - startTime,
        },
      };
      
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const embedding = await embeddingsService.createEmbedding(body.text, body.model);
    
    const response: CreateEmbeddingResponse = {
      success: true,
      data: embedding,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: generateRequestId(),
        processingTime: Date.now() - startTime,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Embeddings API error:', error);

    const errorResponse: CreateEmbeddingResponse = {
      success: false,
      error: {
        message: 'Failed to create embedding',
        code: 'EMBEDDING_ERROR',
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

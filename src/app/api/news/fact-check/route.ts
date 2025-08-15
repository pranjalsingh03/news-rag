import { NextRequest, NextResponse } from 'next/server';
import { getFactChecker } from '~/lib/fact-checker';
import type { FactCheckRequest, FactCheckResponse } from '~/types/api';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body: FactCheckRequest = await request.json();
    
    if (!body.claim && !body.text && !body.articleId) {
      const errorResponse: FactCheckResponse = {
        success: false,
        error: {
          message: 'Either claim, text, or articleId is required',
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

    const factChecker = getFactChecker();
    let result;

    if (body.claim) {
      // Check a specific claim
      result = await factChecker.checkClaim(body.claim, body.articleId);
    } else if (body.text) {
      // Extract claims from text and check the first one
      const claim = body.text.length > 200 ? body.text.substring(0, 200) + '...' : body.text;
      result = await factChecker.checkClaim(claim, body.articleId);
    } else {
      // This would require fetching the article by ID first
      // For now, return an error
      const errorResponse: FactCheckResponse = {
        success: false,
        error: {
          message: 'Article-based fact-checking not yet implemented',
          code: 'NOT_IMPLEMENTED',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: generateRequestId(),
          processingTime: Date.now() - startTime,
        },
      };
      
      return NextResponse.json(errorResponse, { status: 501 });
    }

    const response: FactCheckResponse = {
      success: true,
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: generateRequestId(),
        processingTime: Date.now() - startTime,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Fact-check API error:', error);

    const errorResponse: FactCheckResponse = {
      success: false,
      error: {
        message: 'Failed to perform fact-check',
        code: 'FACT_CHECK_ERROR',
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
    
    const claim = searchParams.get('claim');
    const text = searchParams.get('text');
    const articleId = searchParams.get('articleId');

    if (!claim && !text && !articleId) {
      const errorResponse: FactCheckResponse = {
        success: false,
        error: {
          message: 'Either claim, text, or articleId parameter is required',
          code: 'MISSING_PARAMS',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: generateRequestId(),
          processingTime: Date.now() - startTime,
        },
      };
      
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const factCheckRequest: FactCheckRequest = {
      claim: claim || undefined,
      text: text || undefined,
      articleId: articleId || undefined,
    };

    // Reuse the POST logic
    return await POST(new NextRequest(request.url, {
      method: 'POST',
      body: JSON.stringify(factCheckRequest),
      headers: { 'content-type': 'application/json' },
    }));
  } catch (error) {
    console.error('Fact-check GET API error:', error);

    const errorResponse: FactCheckResponse = {
      success: false,
      error: {
        message: 'Failed to perform fact-check',
        code: 'FACT_CHECK_ERROR',
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

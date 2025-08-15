import { getAIService } from './ai-service';
import { getChromaVectorStore } from './chroma-vector-store';
import { getEmbeddingsService } from './embeddings';
import type { FactCheckResult, NewsArticle } from '~/types';

export class FactChecker {
  private aiService: ReturnType<typeof getAIService>;
  private vectorStore: ReturnType<typeof getChromaVectorStore>;
  private embeddingsService: ReturnType<typeof getEmbeddingsService>;

  constructor() {
    this.aiService = getAIService();
    this.vectorStore = getChromaVectorStore();
    this.embeddingsService = getEmbeddingsService();
  }

  async checkClaim(
    claim: string,
    articleId?: string,
    contextArticles?: NewsArticle[]
  ): Promise<FactCheckResult> {
    try {
      // Get embedding for the claim
      const claimEmbedding = await this.embeddingsService.createQueryEmbedding(claim);
      
      // Find relevant evidence articles
      const evidenceResults = await this.vectorStore.searchSimilar(
        claimEmbedding,
        10,
        { credibilityScore: { $gte: 0.6 } } // Only high-credibility sources
      );

      // Extract supporting evidence
      const supportingEvidence = evidenceResults.map(result => ({
        articleId: result.id,
        relevantText: this.extractRelevantText(claim, result.metadata.summary || result.metadata.title),
        source: result.metadata.source,
        credibilityScore: result.metadata.credibilityScore,
      }));

      // Generate fact-check analysis using LLM
      const analysis = await this.generateFactCheckAnalysis(claim, supportingEvidence);

      return {
        articleId: articleId || '',
        claim,
        verdict: analysis.verdict,
        confidence: analysis.confidence,
        supportingEvidence,
        explanation: analysis.explanation,
        checkedAt: new Date(),
      };
    } catch (error) {
      console.error('Error checking claim:', error);
      throw new Error(`Failed to check claim: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async checkArticle(article: NewsArticle): Promise<FactCheckResult[]> {
    try {
      // Extract key claims from the article
      const claims = await this.extractClaims(article.content);
      
      // Check each claim
      const results = await Promise.all(
        claims.map(claim => this.checkClaim(claim, article.id))
      );

      return results;
    } catch (error) {
      console.error('Error checking article:', error);
      throw new Error(`Failed to check article: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async generateFactCheckAnalysis(
    claim: string,
    evidence: Array<{ articleId: string; relevantText: string; source: string; credibilityScore: number }>
  ): Promise<{
    verdict: 'TRUE' | 'FALSE' | 'PARTIALLY_TRUE' | 'UNVERIFIED' | 'MISLEADING';
    confidence: number;
    explanation: string;
  }> {
    const evidenceTexts = evidence.map(e => 
      `Source: ${e.source} (Credibility: ${e.credibilityScore})\nText: ${e.relevantText}`
    ).join('\n\n');

    const prompt = `
You are a professional fact-checker. Analyze the following claim against the provided evidence and determine its accuracy.

CLAIM TO VERIFY:
"${claim}"

AVAILABLE EVIDENCE:
${evidenceTexts}

Please analyze the claim and provide:
1. A verdict: TRUE, FALSE, PARTIALLY_TRUE, UNVERIFIED, or MISLEADING
2. A confidence score between 0 and 1
3. A clear explanation of your reasoning

Consider:
- The credibility of sources
- The quality and relevance of evidence
- Whether the evidence supports, contradicts, or is insufficient for the claim
- Any nuances or context that might affect the verdict

Format your response as JSON:
{
  "verdict": "TRUE|FALSE|PARTIALLY_TRUE|UNVERIFIED|MISLEADING",
  "confidence": 0.0-1.0,
  "explanation": "Your detailed explanation here"
}
`;

    try {
      const prompt = `
You are a professional fact-checker. Analyze the following claim against the provided evidence and determine its accuracy.

CLAIM TO VERIFY:
"${claim}"

AVAILABLE EVIDENCE:
${evidenceTexts}

Please analyze the claim and provide:
1. A verdict: TRUE, FALSE, PARTIALLY_TRUE, UNVERIFIED, or MISLEADING
2. A confidence score between 0 and 1
3. A clear explanation of your reasoning

Consider:
- The credibility of sources
- The quality and relevance of evidence
- Whether the evidence supports, contradicts, or is insufficient for the claim
- Any nuances or context that might affect the verdict

Format your response as JSON:
{
  "verdict": "TRUE|FALSE|PARTIALLY_TRUE|UNVERIFIED|MISLEADING",
  "confidence": 0.0-1.0,
  "explanation": "Your detailed explanation here"
}
`;

      const response = await this.aiService.generateText(prompt);
      const analysis = JSON.parse(response);
      
      // Validate the response
      if (!this.isValidVerdict(analysis.verdict)) {
        throw new Error('Invalid verdict from analysis');
      }

      return {
        verdict: analysis.verdict,
        confidence: Math.max(0, Math.min(1, analysis.confidence)),
        explanation: analysis.explanation,
      };
    } catch (error) {
      console.error('Error generating fact-check analysis:', error);
      
      // Fallback analysis
      return {
        verdict: 'UNVERIFIED',
        confidence: 0.1,
        explanation: 'Unable to verify claim due to analysis error. Please review manually.',
      };
    }
  }

  private async extractClaims(content: string): Promise<string[]> {
    try {
      const prompt = `
Extract the key factual claims from the following news article content. Focus on specific, verifiable statements rather than opinions or general statements.

ARTICLE CONTENT:
${content.substring(0, 2000)} ${content.length > 2000 ? '...' : ''}

Please identify 3-5 key factual claims that can be fact-checked. Return them as a JSON array of strings.

Example format:
["The unemployment rate increased to 5.2% in March", "The company reported $2.1 billion in quarterly revenue"]
`;

      const response = await this.aiService.generateText(prompt);
      const claims = JSON.parse(response);
      return Array.isArray(claims) ? claims.slice(0, 5) : [];
    } catch (error) {
      console.error('Error extracting claims:', error);
      return [];
    }
  }

  private extractRelevantText(claim: string, text: string, maxLength: number = 200): string {
    // Simple relevance extraction - in production, use more sophisticated methods
    const claimWords = claim.toLowerCase().split(/\s+/);
    const sentences = text.split(/[.!?]+/);
    
    // Find sentence with most claim words
    let bestSentence = '';
    let maxMatches = 0;
    
    for (const sentence of sentences) {
      const sentenceLower = sentence.toLowerCase();
      const matches = claimWords.filter(word => sentenceLower.includes(word)).length;
      
      if (matches > maxMatches) {
        maxMatches = matches;
        bestSentence = sentence.trim();
      }
    }

    if (bestSentence.length > maxLength) {
      return bestSentence.substring(0, maxLength) + '...';
    }

    return bestSentence || text.substring(0, maxLength);
  }

  private isValidVerdict(verdict: string): verdict is 'TRUE' | 'FALSE' | 'PARTIALLY_TRUE' | 'UNVERIFIED' | 'MISLEADING' {
    return ['TRUE', 'FALSE', 'PARTIALLY_TRUE', 'UNVERIFIED', 'MISLEADING'].includes(verdict);
  }

  async getFactCheckHistory(articleId: string): Promise<FactCheckResult[]> {
    // This would typically query a database
    // For now, return empty array - implement database integration later
    return [];
  }

  async getCredibilityAnalysis(source: string): Promise<{
    overallScore: number;
    factCheckHistory: {
      total: number;
      accurate: number;
      inaccurate: number;
      mixed: number;
    };
    biasAnalysis: {
      political: 'left' | 'center' | 'right';
      factual: 'high' | 'medium' | 'low';
    };
  }> {
    // This would typically query a database of source credibility data
    // For now, return a placeholder
    return {
      overallScore: 0.7,
      factCheckHistory: {
        total: 0,
        accurate: 0,
        inaccurate: 0,
        mixed: 0,
      },
      biasAnalysis: {
        political: 'center',
        factual: 'medium',
      },
    };
  }
}

// Singleton instance
let factChecker: FactChecker | null = null;

export function getFactChecker(): FactChecker {
  if (!factChecker) {
    factChecker = new FactChecker();
  }
  return factChecker;
}

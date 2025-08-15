import { useState, useCallback } from 'react';
import type { FactCheckResult } from '~/types';

interface UseFactCheckReturn {
  result: FactCheckResult | null;
  loading: boolean;
  error: string | null;
  checkClaim: (claim: string, articleId?: string) => Promise<void>;
  checkText: (text: string, articleId?: string) => Promise<void>;
  clearResult: () => void;
}

export function useFactCheck(): UseFactCheckReturn {
  const [result, setResult] = useState<FactCheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performFactCheck = useCallback(async (
    requestBody: { claim?: string; text?: string; articleId?: string }
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/news/fact-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Fact-check failed');
      }

      setResult(data.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Fact-check error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkClaim = useCallback(async (claim: string, articleId?: string) => {
    await performFactCheck({ claim, articleId });
  }, [performFactCheck]);

  const checkText = useCallback(async (text: string, articleId?: string) => {
    await performFactCheck({ text, articleId });
  }, [performFactCheck]);

  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    result,
    loading,
    error,
    checkClaim,
    checkText,
    clearResult,
  };
}

// Hook for batch fact-checking multiple claims
export function useBatchFactCheck() {
  const [results, setResults] = useState<FactCheckResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkClaims = useCallback(async (claims: string[], articleId?: string) => {
    setLoading(true);
    setError(null);

    try {
      const promises = claims.map(async (claim) => {
        const response = await fetch('/api/news/fact-check', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ claim, articleId }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error?.message || 'Fact-check failed');
        }

        return data.data;
      });

      const allResults = await Promise.all(promises);
      setResults(allResults);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Batch fact-check error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return {
    results,
    loading,
    error,
    checkClaims,
    clearResults,
  };
}

// Hook for real-time fact-checking as user types
export function useRealTimeFactCheck(debounceMs = 1000) {
  const [currentClaim, setCurrentClaim] = useState('');
  const factCheck = useFactCheck();

  const updateClaim = useCallback((claim: string) => {
    setCurrentClaim(claim);
    
    // Debounce the fact-check call
    const timeoutId = setTimeout(() => {
      if (claim.length > 10) { // Only check claims longer than 10 characters
        factCheck.checkClaim(claim);
      } else {
        factCheck.clearResult();
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [factCheck, debounceMs]);

  return {
    ...factCheck,
    currentClaim,
    updateClaim,
  };
}

import React from 'react';
import type { FactCheckResult } from '~/types';

interface FactCheckResultsProps {
  result: FactCheckResult;
  onClose?: () => void;
  showSources?: boolean;
}

export function FactCheckResults({
  result,
  onClose,
  showSources = true,
}: FactCheckResultsProps) {
  const getVerdictColor = (verdict: FactCheckResult['verdict']) => {
    switch (verdict) {
      case 'TRUE':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'FALSE':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'PARTIALLY_TRUE':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'MISLEADING':
        return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'UNVERIFIED':
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getVerdictIcon = (verdict: FactCheckResult['verdict']) => {
    switch (verdict) {
      case 'TRUE':
        return (
          <svg className="h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'FALSE':
        return (
          <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'PARTIALLY_TRUE':
        return (
          <svg className="h-6 w-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'MISLEADING':
        return (
          <svg className="h-6 w-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'UNVERIFIED':
      default:
        return (
          <svg className="h-6 w-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getVerdictLabel = (verdict: FactCheckResult['verdict']) => {
    switch (verdict) {
      case 'TRUE':
        return 'True';
      case 'FALSE':
        return 'False';
      case 'PARTIALLY_TRUE':
        return 'Partially True';
      case 'MISLEADING':
        return 'Misleading';
      case 'UNVERIFIED':
      default:
        return 'Unverified';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    if (confidence >= 0.4) return 'text-orange-600';
    return 'text-red-600';
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-semibold text-gray-900">Fact Check Result</h3>
          <span className="text-sm text-gray-500">
            Checked on {formatDate(result.checkedAt)}
          </span>
        </div>
        
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="p-6">
        {/* Claim */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Claim</h4>
          <p className="text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-200">
            &ldquo;{result.claim}&rdquo;
          </p>
        </div>

        {/* Verdict */}
        <div className={`border rounded-lg p-4 mb-6 ${getVerdictColor(result.verdict)}`}>
          <div className="flex items-center space-x-3 mb-3">
            {getVerdictIcon(result.verdict)}
            <span className="text-xl font-semibold">
              {getVerdictLabel(result.verdict)}
            </span>
          </div>
          
          <div className="flex items-center space-x-4 text-sm">
            <div>
              <span className="font-medium">Confidence: </span>
              <span className={`font-semibold ${getConfidenceColor(result.confidence)}`}>
                {(result.confidence * 100).toFixed(1)}%
              </span>
            </div>
            
            {/* Confidence Bar */}
            <div className="flex-1 max-w-xs">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    result.confidence >= 0.8 ? 'bg-green-500' :
                    result.confidence >= 0.6 ? 'bg-yellow-500' :
                    result.confidence >= 0.4 ? 'bg-orange-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${result.confidence * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Explanation */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Explanation</h4>
          <p className="text-gray-900 leading-relaxed">
            {result.explanation}
          </p>
        </div>

        {/* Supporting Evidence */}
        {showSources && result.supportingEvidence.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Supporting Evidence ({result.supportingEvidence.length} source{result.supportingEvidence.length !== 1 ? 's' : ''})
            </h4>
            
            <div className="space-y-3">
              {result.supportingEvidence.map((evidence, index) => (
                <div
                  key={index}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">
                        {evidence.source}
                      </span>
                      <div className="flex items-center space-x-1">
                        <span className="text-xs text-gray-500">Credibility:</span>
                        <span className={`text-xs font-medium ${getConfidenceColor(evidence.credibilityScore)}`}>
                          {(evidence.credibilityScore * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="w-16 bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${
                          evidence.credibilityScore >= 0.8 ? 'bg-green-500' :
                          evidence.credibilityScore >= 0.6 ? 'bg-yellow-500' :
                          evidence.credibilityScore >= 0.4 ? 'bg-orange-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${evidence.credibilityScore * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-700">
                    {evidence.relevantText}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Loading skeleton for fact check results
export function FactCheckResultsSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden animate-pulse">
      {/* Header skeleton */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-6 bg-gray-200 rounded w-32"></div>
          <div className="h-4 bg-gray-200 rounded w-40"></div>
        </div>
      </div>

      <div className="p-6">
        {/* Claim skeleton */}
        <div className="mb-6">
          <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>

        {/* Verdict skeleton */}
        <div className="border rounded-lg p-4 mb-6 bg-gray-50">
          <div className="flex items-center space-x-3 mb-3">
            <div className="h-6 w-6 bg-gray-200 rounded"></div>
            <div className="h-6 bg-gray-200 rounded w-24"></div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="h-4 bg-gray-200 rounded w-20"></div>
            <div className="flex-1 max-w-xs h-2 bg-gray-200 rounded-full"></div>
          </div>
        </div>

        {/* Explanation skeleton */}
        <div className="mb-6">
          <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>

        {/* Evidence skeleton */}
        <div>
          <div className="h-4 bg-gray-200 rounded w-32 mb-3"></div>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-start justify-between mb-2">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="w-16 h-1.5 bg-gray-200 rounded-full"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

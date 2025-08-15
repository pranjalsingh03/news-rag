import React from 'react';
import type { NewsArticle } from '~/types';

interface NewsCardProps {
  article: NewsArticle;
  onFactCheck?: (article: NewsArticle) => void;
  onViewDetails?: (article: NewsArticle) => void;
  showCredibilityScore?: boolean;
  compact?: boolean;
}

export function NewsCard({
  article,
  onFactCheck,
  onViewDetails,
  showCredibilityScore = true,
  compact = false,
}: NewsCardProps) {
  const formatDate = (date: Date | string) => {
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCredibilityColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-50';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-50';
    if (score >= 0.4) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getCredibilityLabel = (score: number) => {
    if (score >= 0.8) return 'High';
    if (score >= 0.6) return 'Medium';
    if (score >= 0.4) return 'Low';
    return 'Very Low';
  };

  return (
    <div className={`bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow ${compact ? 'p-4' : 'p-6'}`}>
      {/* Article Image */}
      {!compact && article.imageUrl && (
        <div className="mb-4">
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-full h-48 object-cover rounded-lg"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Article Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className={`font-semibold text-gray-900 line-clamp-2 ${compact ? 'text-lg' : 'text-xl'}`}>
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-600 transition-colors"
            >
              {article.title}
            </a>
          </h3>
          
          <div className="flex items-center space-x-2 mt-2 text-sm text-gray-600">
            <span className="font-medium">{article.source}</span>
            {article.author && (
              <>
                <span>•</span>
                <span>{article.author}</span>
              </>
            )}
            <span>•</span>
            <time dateTime={article.publishedAt instanceof Date ? article.publishedAt.toISOString() : new Date(article.publishedAt).toISOString()}>
              {formatDate(article.publishedAt)}
            </time>
          </div>
        </div>

        {showCredibilityScore && (
          <div className={`ml-4 px-3 py-1 rounded-full text-xs font-medium ${getCredibilityColor(article.credibilityScore)}`}>
            {getCredibilityLabel(article.credibilityScore)} Credibility
          </div>
        )}
      </div>

      {/* Article Summary */}
      <p className={`text-gray-700 mb-4 ${compact ? 'line-clamp-2' : 'line-clamp-3'}`}>
        {article.summary}
      </p>

      {/* Article Tags */}
      {!compact && article.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {article.tags.slice(0, 5).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs"
            >
              {tag}
            </span>
          ))}
          {article.tags.length > 5 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs">
              +{article.tags.length - 5} more
            </span>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex space-x-2">
          <button
            onClick={() => onViewDetails?.(article)}
            className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
          >
            Read More
          </button>
          
          {onFactCheck && (
            <button
              onClick={() => onFactCheck(article)}
              className="px-3 py-1.5 text-sm text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-md transition-colors"
            >
              Fact Check
            </button>
          )}
        </div>

        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <span className="px-2 py-1 bg-gray-100 rounded">
            {article.category}
          </span>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-700"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}

// Skeleton loader for news cards
export function NewsCardSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`bg-white rounded-lg shadow-md border border-gray-200 animate-pulse ${compact ? 'p-4' : 'p-6'}`}>
      {/* Image skeleton */}
      {!compact && (
        <div className="w-full h-48 bg-gray-200 rounded-lg mb-4"></div>
      )}
      
      {/* Header skeleton */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="ml-4 h-6 w-20 bg-gray-200 rounded-full"></div>
      </div>
      
      {/* Content skeleton */}
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        {!compact && <div className="h-4 bg-gray-200 rounded w-4/6"></div>}
      </div>
      
      {/* Tags skeleton */}
      {!compact && (
        <div className="flex space-x-2 mb-4">
          <div className="h-6 w-16 bg-gray-200 rounded"></div>
          <div className="h-6 w-20 bg-gray-200 rounded"></div>
          <div className="h-6 w-14 bg-gray-200 rounded"></div>
        </div>
      )}
      
      {/* Footer skeleton */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex space-x-2">
          <div className="h-8 w-20 bg-gray-200 rounded"></div>
          <div className="h-8 w-24 bg-gray-200 rounded"></div>
        </div>
        <div className="h-6 w-16 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}

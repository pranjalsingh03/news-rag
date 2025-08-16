'use client';

import React, { useState } from 'react';
import { SearchInterface } from '~/components/SearchInterface';
import { NewsCard, NewsCardSkeleton } from '~/components/NewsCard';
import { FactCheckResults, FactCheckResultsSkeleton } from '~/components/FactCheckResults';
import { useNews } from '~/hooks/useNews';
import { useSearch } from '~/hooks/useSearch';
import { useFactCheck } from '~/hooks/useFactCheck';
import type { NewsArticle } from '~/types';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'latest' | 'search'>('latest');
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [showFactCheck, setShowFactCheck] = useState(false);

  // Latest news hook
  const { 
    articles: latestArticles, 
    loading: latestLoading, 
    error: latestError,
    refetch: refetchLatest 
  } = useNews({ 
    limit: 100,
    autoRefresh: false 
  });

  // Search hook
  const { 
    results: searchResults, 
    loading: searchLoading, 
    error: searchError 
  } = useSearch();

  // Fact check hook
  const { 
    result: factCheckResult, 
    loading: factCheckLoading, 
    error: factCheckError,
    checkClaim,
    clearResult: clearFactCheck 
  } = useFactCheck();

  const handleFactCheck = async (article: NewsArticle) => {
    setSelectedArticle(article);
    setShowFactCheck(true);
    
    // Extract a claim from the article title and summary
    const claim = `${article.title}. ${article.summary}`.substring(0, 200);
    await checkClaim(claim, article.id);
  };

  const handleViewDetails = (article: NewsArticle) => {
    window.open(article.url, '_blank', 'noopener,noreferrer');
  };

  const handleSearchResults = (hasResults: boolean) => {
    if (hasResults) {
      setActiveTab('search');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">
                News RAG System
              </h1>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium">
                Beta
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={refetchLatest}
                disabled={latestLoading}
                className="px-6 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {latestLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Refresh News</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Section */}
        <div className="mb-8">
          <SearchInterface
            onResultsChange={handleSearchResults}
            placeholder="Search for news articles, claims, or topics..."
            showFilters={true}
          />
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 mb-6">
          <button
            onClick={() => setActiveTab('latest')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'latest'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Latest News
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'search'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Search Results
            {searchResults && (
              <span className="ml-2 px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded-full">
                {searchResults.totalCount}
              </span>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Latest News Tab */}
            {activeTab === 'latest' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Latest News
                  </h2>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-500">
                      {latestArticles.length} articles loaded (up to 100)
                    </span>
                  </div>
                </div>

                {latestError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <div className="flex">
                      <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Error Loading News</h3>
                        <p className="mt-1 text-sm text-red-700">{latestError}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  {latestLoading ? (
                    // Loading skeletons
                    Array.from({ length: 5 }).map((_, index) => (
                      <NewsCardSkeleton key={index} />
                    ))
                  ) : (
                    // News articles
                    latestArticles.map((article) => (
                      <NewsCard
                        key={article.id}
                        article={article}
                        onFactCheck={handleFactCheck}
                        onViewDetails={handleViewDetails}
                        showCredibilityScore={true}
                      />
                    ))
                  )}

                  {!latestLoading && latestArticles.length === 0 && !latestError && (
                    <div className="text-center py-12">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No articles loaded</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Click the &ldquo;Refresh&rdquo; button above to load the latest news articles.
                      </p>
                      <button
                        onClick={refetchLatest}
                        className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        Load Latest News
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Search Results Tab */}
            {activeTab === 'search' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Search Results
                  </h2>
                  {searchResults && (
                    <span className="text-sm text-gray-500">
                      {searchResults.totalCount} results in {searchResults.processingTime}ms
                    </span>
                  )}
                </div>

                {searchError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <div className="flex">
                      <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Search Error</h3>
                        <p className="mt-1 text-sm text-red-700">{searchError}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  {searchLoading ? (
                    // Loading skeletons
                    Array.from({ length: 3 }).map((_, index) => (
                      <NewsCardSkeleton key={index} />
                    ))
                  ) : searchResults ? (
                    // Search results
                    searchResults.articles.map((article, index) => (
                      <NewsCard
                        key={article.id}
                        article={article}
                        onFactCheck={handleFactCheck}
                        onViewDetails={handleViewDetails}
                        showCredibilityScore={true}
                      />
                    ))
                  ) : (
                    // No search performed yet
                    <div className="text-center py-12">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Start searching</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Enter a search query above to find relevant news articles.
                      </p>
                    </div>
                  )}

                  {searchResults && searchResults.articles.length === 0 && !searchLoading && (
                    <div className="text-center py-12">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.467.901-6.024 2.377M15 17.24c1.155-.423 2.211-1.093 3.072-1.945L21 18.24M3 18.24l2.928-2.945c.861.852 1.917 1.522 3.072 1.945" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No results found</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Try adjusting your search terms or filters.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Fact Check Panel */}
            {showFactCheck && (
              <div className="mb-8">
                {factCheckLoading ? (
                  <FactCheckResultsSkeleton />
                ) : factCheckResult ? (
                  <FactCheckResults
                    result={factCheckResult}
                    onClose={() => {
                      setShowFactCheck(false);
                      setSelectedArticle(null);
                      clearFactCheck();
                    }}
                    showSources={true}
                  />
                ) : factCheckError ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex">
                      <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Fact Check Error</h3>
                        <p className="mt-1 text-sm text-red-700">{factCheckError}</p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {/* System Status */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">System Status</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">News Sources</span>
                  <span className="flex items-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-900">Active</span>
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Vector Database</span>
                  <span className="flex items-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-900">Connected</span>
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Fact Checking</span>
                  <span className="flex items-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-900">Ready</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

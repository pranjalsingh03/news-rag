import React, { useState } from 'react';
import { useSearch } from '~/hooks/useSearch';

interface SearchInterfaceProps {
  onResultsChange?: (hasResults: boolean) => void;
  placeholder?: string;
  showFilters?: boolean;
}

export function SearchInterface({
  onResultsChange,
  placeholder = "Search news articles...",
  showFilters = true,
}: SearchInterfaceProps) {
  const [query, setQuery] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filters, setFilters] = useState({
    sources: [] as string[],
    categories: [] as string[],
    dateFrom: '',
    dateTo: '',
    minCredibility: 0,
  });

  const { results, loading, error, search, clearResults } = useSearch();

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      clearResults();
      onResultsChange?.(false);
      return;
    }

    const searchFilters = {
      sources: filters.sources.length > 0 ? filters.sources : undefined,
      categories: filters.categories.length > 0 ? filters.categories : undefined,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
      minCredibility: filters.minCredibility > 0 ? filters.minCredibility : undefined,
    };

    await search(searchQuery, searchFilters);
    onResultsChange?.(true);
  };

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    handleSearch(newQuery);
  };

  const handleFilterChange = (filterType: keyof typeof filters, value: any) => {
    const newFilters = { ...filters, [filterType]: value };
    setFilters(newFilters);
    
    if (query.trim()) {
      handleSearch(query);
    }
  };

  const clearAllFilters = () => {
    setFilters({
      sources: [],
      categories: [],
      dateFrom: '',
      dateTo: '',
      minCredibility: 0,
    });
    
    if (query.trim()) {
      handleSearch(query);
    }
  };

  const popularSources = [
    'BBC News', 'Reuters', 'Associated Press', 'The Guardian',
    'The New York Times', 'CNN', 'NPR', 'The Washington Post'
  ];

  const categories = [
    'general', 'business', 'technology', 'science',
    'health', 'sports', 'entertainment', 'politics'
  ];

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Main Search Bar */}
      <div className="relative mb-4">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={handleQueryChange}
            placeholder={placeholder}
            className="w-full px-4 py-3 pr-12 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
          
          {/* Search Icon */}
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {loading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            ) : (
              <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </div>
        </div>

        {/* Clear Button */}
        {query && (
          <button
            onClick={() => {
              setQuery('');
              clearResults();
              onResultsChange?.(false);
            }}
            className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Advanced Filters Toggle */}
      {showFilters && (
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
          >
            <svg className={`h-4 w-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            <span>Advanced Filters</span>
          </button>

          {(filters.sources.length > 0 || filters.categories.length > 0 || filters.dateFrom || filters.dateTo || filters.minCredibility > 0) && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Advanced Filters Panel */}
      {showFilters && showAdvancedFilters && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-4">
          {/* Sources Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sources</label>
            <div className="flex flex-wrap gap-2">
              {popularSources.map((source) => (
                <button
                  key={source}
                  onClick={() => {
                    const newSources = filters.sources.includes(source)
                      ? filters.sources.filter(s => s !== source)
                      : [...filters.sources, source];
                    handleFilterChange('sources', newSources);
                  }}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    filters.sources.includes(source)
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  {source}
                </button>
              ))}
            </div>
          </div>

          {/* Categories Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Categories</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => {
                    const newCategories = filters.categories.includes(category)
                      ? filters.categories.filter(c => c !== category)
                      : [...filters.categories, category];
                    handleFilterChange('categories', newCategories);
                  }}
                  className={`px-3 py-1 rounded-full text-sm capitalize transition-colors ${
                    filters.categories.includes(category)
                      ? 'bg-green-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Credibility Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Credibility Score: {filters.minCredibility.toFixed(1)}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={filters.minCredibility}
              onChange={(e) => handleFilterChange('minCredibility', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Low</span>
              <span>Medium</span>
              <span>High</span>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Search Error</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Results Summary */}
      {results && (
        <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
          <span>
            Found {results.totalCount} article{results.totalCount !== 1 ? 's' : ''} 
            {results.processingTime && ` in ${results.processingTime}ms`}
          </span>
          <span>Showing results for &ldquo;{results.query}&rdquo;</span>
        </div>
      )}
    </div>
  );
}

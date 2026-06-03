import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Search, Filter, X, Clock, TrendingUp, Users, BookOpen, 
  Calendar, FileText, MessageSquare, Bell, Award, Target,
  ChevronRight, Star, StarOff, Trash2, RefreshCw,
  Eye, Download, Share2, Copy, CheckCircle, AlertCircle
} from 'lucide-react';
import { api } from '../../../services/api';
import { useDebounce } from '../../../hooks/useDebounce';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';
import { Modal } from '../../ui/Modal';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

interface SearchResult {
  type: string;
  id: string;
  title: string;
  detail?: string;
  href?: string;
  icon?: string;
  createdAt?: string;
  updatedAt?: string;
  score?: number;
  tags?: string[];
  preview?: string;
  author?: string;
  isStarred?: boolean;
}

interface SearchFilter {
  types: string[];
  dateRange: {
    start: string;
    end: string;
  };
  sortBy: 'relevance' | 'date' | 'title';
  sortOrder: 'asc' | 'desc';
}

interface RecentSearch {
  id: string;
  query: string;
  timestamp: string;
  resultCount: number;
}

interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: SearchFilter;
  createdAt: string;
}

const typeIcons: Record<string, any> = {
  student: Users,
  teacher: Users,
  class: BookOpen,
  subject: Target,
  lesson: FileText,
  assignment: FileText,
  grade: Award,
  attendance: Calendar,
  message: MessageSquare,
  notification: Bell,
  parent: Users,
  meeting: Calendar,
  default: Search,
};

const typeColors: Record<string, string> = {
  student: 'bg-blue-100 text-blue-800',
  teacher: 'bg-green-100 text-green-800',
  class: 'bg-purple-100 text-purple-800',
  subject: 'bg-yellow-100 text-yellow-800',
  lesson: 'bg-indigo-100 text-indigo-800',
  assignment: 'bg-orange-100 text-orange-800',
  grade: 'bg-pink-100 text-pink-800',
  attendance: 'bg-cyan-100 text-cyan-800',
  message: 'bg-teal-100 text-teal-800',
  default: 'bg-gray-100 text-gray-800',
};

export default function DashboardSearchPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const query = params.get('q') || '';
  const debouncedQuery = useDebounce(query, 300);
  
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showSaveSearchModal, setShowSaveSearchModal] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState('');
  const [totalResults, setTotalResults] = useState(0);
  const [searchTime, setSearchTime] = useState(0);
  
  const [filters, setFilters] = useState<SearchFilter>({
    types: [],
    dateRange: {
      start: '',
      end: '',
    },
    sortBy: 'relevance',
    sortOrder: 'desc',
  });
  
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load recent and saved searches
  useEffect(() => {
    loadRecentSearches();
    loadSavedSearches();
  }, []);

  const loadRecentSearches = async () => {
    try {
      const response = await api.get('/search/recent');
      setRecentSearches(response.data.data || []);
    } catch (error) {
      console.error('Failed to load recent searches:', error);
    }
  };

  const loadSavedSearches = async () => {
    try {
      const response = await api.get('/search/saved');
      setSavedSearches(response.data.data || []);
    } catch (error) {
      console.error('Failed to load saved searches:', error);
    }
  };

  const saveRecentSearch = useCallback(async (searchQuery: string, count: number) => {
    if (!searchQuery.trim()) return;
    
    try {
      await api.post('/search/recent', { query: searchQuery, resultCount: count });
      loadRecentSearches();
    } catch (error) {
      console.error('Failed to save recent search:', error);
    }
  }, []);

  const saveCurrentSearch = async () => {
    if (!saveSearchName.trim()) {
      toast.error('Please enter a name for this search');
      return;
    }
    
    try {
      await api.post('/search/save', {
        name: saveSearchName,
        query,
        filters,
      });
      toast.success('Search saved successfully');
      setShowSaveSearchModal(false);
      setSaveSearchName('');
      loadSavedSearches();
    } catch (error) {
      console.error('Failed to save search:', error);
      toast.error('Failed to save search');
    }
  };

  const deleteSavedSearch = async (searchId: string) => {
    try {
      await api.delete(`/search/saved/${searchId}`);
      toast.success('Search deleted');
      loadSavedSearches();
    } catch (error) {
      console.error('Failed to delete search:', error);
      toast.error('Failed to delete search');
    }
  };

  const clearRecentSearches = async () => {
    try {
      await api.delete('/search/recent/all');
      setRecentSearches([]);
      toast.success('Recent searches cleared');
    } catch (error) {
      console.error('Failed to clear recent searches:', error);
      toast.error('Failed to clear recent searches');
    }
  };

  const toggleStarResult = async (resultId: string, isStarred: boolean) => {
    try {
      await api.post(`/search/star/${resultId}`, { isStarred: !isStarred });
      setResults(prev => prev.map(r => 
        r.id === resultId ? { ...r, isStarred: !isStarred } : r
      ));
      toast.success(isStarred ? 'Removed from starred' : 'Added to starred');
    } catch (error) {
      console.error('Failed to toggle star:', error);
      toast.error('Failed to update');
    }
  };

  const performSearch = useCallback(async () => {
    if (debouncedQuery.trim().length < 2) {
      setResults([]);
      setTotalResults(0);
      return;
    }

    const startTime = performance.now();
    setLoading(true);
    
    try {
      const response = await api.get('/search', {
        params: {
          q: debouncedQuery,
          types: filters.types.join(','),
          startDate: filters.dateRange.start,
          endDate: filters.dateRange.end,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
        },
        silentErrorToast: true,
      });
      
      const data = response.data.data || [];
      setResults(data.results || data);
      setTotalResults(data.total || data.length);
      setAvailableTypes(data.availableTypes || []);
      
      // Save to recent searches
      if (data.results?.length || data.length) {
        await saveRecentSearch(debouncedQuery, data.total || data.length);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
      const endTime = performance.now();
      setSearchTime(endTime - startTime);
    }
  }, [debouncedQuery, filters, saveRecentSearch]);

  useEffect(() => {
    performSearch();
  }, [performSearch]);

  const handleTypeToggle = (type: string) => {
    setFilters(prev => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter(t => t !== type)
        : [...prev.types, type],
    }));
  };

  const clearFilters = () => {
    setFilters({
      types: [],
      dateRange: { start: '', end: '' },
      sortBy: 'relevance',
      sortOrder: 'desc',
    });
  };

  const applySavedSearch = (savedSearch: SavedSearch) => {
    setParams({ q: savedSearch.query });
    setFilters(savedSearch.filters);
    setShowFilters(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getResultIcon = (type: string) => {
    const Icon = typeIcons[type] || typeIcons.default;
    return <Icon className="w-5 h-5" />;
  };

  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm) return text;
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) => 
      regex.test(part) ? <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">{part}</mark> : part
    );
  };

  return (
    <div className="dashboard-search-page p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
            <Search size={24} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Search Results</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {query ? (
                <>
                  Found {totalResults} result{totalResults !== 1 ? 's' : ''} for "{query}"
                  {searchTime > 0 && ` in ${searchTime.toFixed(0)}ms`}
                </>
              ) : (
                'Type in the search bar above to find records'
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-1" />
            Filters
            {filters.types.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                {filters.types.length}
              </span>
            )}
          </Button>
          {query && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSaveSearchModal(true)}
            >
              <Star className="w-4 h-4 mr-1" />
              Save Search
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={performSearch}
            disabled={loading}
          >
            <RefreshCw className={clsx('w-4 h-4 mr-1', loading && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Search Filters</h3>
              <button onClick={clearFilters} className="text-sm text-blue-600 hover:underline">
                Clear all
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Type Filters */}
              <div>
                <label className="block text-sm font-medium mb-2">Content Types</label>
                <div className="flex flex-wrap gap-2">
                  {availableTypes.map(type => (
                    <button
                      key={type}
                      onClick={() => handleTypeToggle(type)}
                      className={clsx(
                        'px-3 py-1.5 rounded-full text-sm transition',
                        filters.types.includes(type)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                      )}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium mb-2">Date Range</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={filters.dateRange.start}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, start: e.target.value }
                    }))}
                    className="px-3 py-2 border rounded-lg dark:bg-gray-800 text-sm"
                  />
                  <input
                    type="date"
                    value={filters.dateRange.end}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, end: e.target.value }
                    }))}
                    className="px-3 py-2 border rounded-lg dark:bg-gray-800 text-sm"
                  />
                </div>
              </div>
              
              {/* Sort Options */}
              <div>
                <label className="block text-sm font-medium mb-2">Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
                >
                  <option value="relevance">Relevance</option>
                  <option value="date">Date</option>
                  <option value="title">Title</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Sort Order</label>
                <select
                  value={filters.sortOrder}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortOrder: e.target.value as any }))}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Recent Searches */}
      {!query && recentSearches.length > 0 && (
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Recent Searches
              </h3>
              <button onClick={clearRecentSearches} className="text-xs text-red-600 hover:underline">
                Clear all
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map(search => (
                <button
                  key={search.id}
                  onClick={() => setParams({ q: search.query })}
                  className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full text-sm hover:bg-gray-200 transition flex items-center gap-2"
                >
                  <Search size={12} />
                  {search.query}
                  <span className="text-xs text-gray-500">({search.resultCount})</span>
                </button>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Saved Searches */}
      {!query && savedSearches.length > 0 && (
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Star className="w-4 h-4" />
                Saved Searches
              </h3>
            </div>
            <div className="space-y-2">
              {savedSearches.map(search => (
                <div key={search.id} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
                  <button
                    onClick={() => applySavedSearch(search)}
                    className="flex-1 text-left"
                  >
                    <p className="font-medium">{search.name}</p>
                    <p className="text-sm text-gray-500">{search.query}</p>
                  </button>
                  <button
                    onClick={() => deleteSavedSearch(search.id)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" showLabel label="Searching..." />
        </div>
      ) : results.length === 0 && query ? (
        <Card className="text-center py-12">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No results found for "{query}"</p>
          <p className="text-sm text-gray-400 mt-1">Try different keywords or check your spelling</p>
        </Card>
      ) : results.length > 0 ? (
        <div className="space-y-3">
          {results.map((result) => (
            <Link
              key={`${result.type}-${result.id}`}
              to={result.href || '#'}
              className="block group"
            >
              <Card className="hover:shadow-md transition">
                <div className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Type Icon */}
                    <div className={clsx(
                      'p-2 rounded-lg flex-shrink-0',
                      typeColors[result.type] || typeColors.default
                    )}>
                      {getResultIcon(result.type)}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium text-gray-500 uppercase">
                          {result.type}
                        </span>
                        {result.createdAt && (
                          <span className="text-xs text-gray-400">
                            {formatDate(result.createdAt)}
                          </span>
                        )}
                        {result.author && (
                          <span className="text-xs text-gray-400">
                            By {result.author}
                          </span>
                        )}
                      </div>
                      
                      <h3 className="font-semibold text-lg mt-1 group-hover:text-blue-600 transition">
                        {highlightText(result.title, query)}
                      </h3>
                      
                      {result.detail && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {highlightText(result.detail, query)}
                        </p>
                      )}
                      
                      {result.preview && (
                        <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                          {highlightText(result.preview, query)}
                        </p>
                      )}
                      
                      {result.tags && result.tags.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {result.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Actions */}
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          toggleStarResult(result.id, result.isStarred || false);
                        }}
                        className="p-1.5 hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition"
                      >
                        {result.isStarred ? (
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        ) : (
                          <Star className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition" />
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
          
          {/* Result count summary */}
          <div className="text-center text-sm text-gray-500 py-4">
            Showing {results.length} of {totalResults} results
          </div>
        </div>
      ) : null}

      {/* Save Search Modal */}
      <Modal isOpen={showSaveSearchModal} onClose={() => setShowSaveSearchModal(false)} title="Save Search" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Search Name</label>
            <input
              type="text"
              value={saveSearchName}
              onChange={(e) => setSaveSearchName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              placeholder="e.g., My Math Lesson Plans"
              autoFocus
            />
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
            <p className="text-sm text-gray-600">Search query: "{query}"</p>
            {filters.types.length > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                Filters: {filters.types.join(', ')}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowSaveSearchModal(false)}>Cancel</Button>
            <Button onClick={saveCurrentSearch}>Save Search</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
import React, { useState, useCallback, useMemo } from 'react';
import { clsx } from 'clsx';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Search, Filter, X } from 'lucide-react';

export interface Column<T extends Record<string, unknown> = Record<string, unknown>> {
  key: string;
  title: string;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  className?: string;
  responsive?: boolean;
}

interface TableProps<T extends Record<string, unknown> = Record<string, unknown>> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (record: T, index: number) => string | number;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  tableClassName?: string;
  headerClassName?: string;
  rowClassName?: string | ((record: T, index: number) => string);
  onRowClick?: (record: T, index: number) => void;
  sortable?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  pagination?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  showPageSizeSelector?: boolean;
  striped?: boolean;
  hoverable?: boolean;
  bordered?: boolean;
  compact?: boolean;
  stickyHeader?: boolean;
  maxHeight?: string | number;
}

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

export default function Table<T extends Record<string, unknown> = Record<string, unknown>>({
  columns,
  data,
  keyExtractor,
  loading = false,
  emptyMessage = 'No data available',
  className,
  tableClassName,
  headerClassName,
  rowClassName,
  onRowClick,
  sortable = false,
  searchable = false,
  searchPlaceholder = 'Search...',
  pagination = false,
  pageSize: defaultPageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  showPageSizeSelector = true,
  striped = true,
  hoverable = true,
  bordered = false,
  compact = false,
  stickyHeader = false,
  maxHeight,
}: TableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});

  // Filter data
  const filteredData = useMemo(() => {
    let result = [...data];

    // Apply search
    if (searchTerm) {
      result = result.filter(record =>
        Object.values(record).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply column filters
    Object.entries(filters).forEach(([key, filterValue]) => {
      if (filterValue) {
        result = result.filter(record =>
          String(record[key]).toLowerCase().includes(filterValue.toLowerCase())
        );
      }
    });

    return result;
  }, [data, searchTerm, filters]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === bValue) return 0;
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      const comparison = aValue < bValue ? -1 : 1;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortConfig]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, pagination, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const handleSort = (key: string) => {
    if (!sortable) return;
    
    setSortConfig(current => ({
      key,
      direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
  };

  const hasActiveFilters = searchTerm || Object.keys(filters).some(key => filters[key]);

  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  const RowTag = onRowClick ? 'div' : 'div';

  return (
    <div className={clsx('w-full', className)}>
      {/* Toolbar */}
      {(searchable || sortable || hasActiveFilters) && (
        <div className="mb-4 flex flex-wrap gap-3 items-center justify-between">
          {searchable && (
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
            >
              <X className="h-4 w-4" />
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Table container */}
      <div
        className={clsx(
          'overflow-auto rounded-lg',
          bordered && 'border border-gray-200 dark:border-gray-700',
          maxHeight && 'overflow-y-auto',
          className
        )}
        style={{ maxHeight }}
      >
        <table className={clsx(
          'w-full',
          compact ? 'text-sm' : 'text-base',
          tableClassName
        )}>
          {/* Header */}
          <thead className={clsx(
            'bg-gray-50 dark:bg-gray-800',
            stickyHeader && 'sticky top-0 z-10',
            headerClassName
          )}>
            <tr className={bordered ? 'border-b border-gray-200 dark:border-gray-700' : ''}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={clsx(
                    'px-4 py-3 font-semibold text-gray-900 dark:text-white',
                    alignClasses[col.align || 'left'],
                    col.sortable && sortable && 'cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700',
                    col.className,
                    !col.responsive && 'hidden sm:table-cell'
                  )}
                  style={{ width: col.width }}
                  onClick={() => col.sortable && sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-2 justify-between">
                    <span>{col.title}</span>
                    {col.sortable && sortable && sortConfig?.key === col.key && (
                      <span className="inline-flex">
                        {sortConfig.direction === 'asc' ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
                    <p className="text-gray-500 dark:text-gray-400">Loading...</p>
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              paginatedData.map((record, idx) => {
                const rowKey = keyExtractor(record, idx);
                const isStriped = striped && idx % 2 === 1;
                
                return (
                  <tr
                    key={rowKey}
                    onClick={() => onRowClick?.(record, idx)}
                    className={clsx(
                      'transition-colors',
                      isStriped && 'bg-gray-50 dark:bg-gray-900/50',
                      hoverable && 'hover:bg-gray-100 dark:hover:bg-gray-800',
                      onRowClick && 'cursor-pointer',
                      bordered && 'border-b border-gray-200 dark:border-gray-700',
                      typeof rowClassName === 'function' ? rowClassName(record, idx) : rowClassName
                    )}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={clsx(
                          'px-4 py-3 text-gray-600 dark:text-gray-300',
                          alignClasses[col.align || 'left'],
                          col.className,
                          !col.responsive && 'hidden sm:table-cell'
                        )}
                      >
                        {col.render
                          ? col.render(record[col.key], record, idx)
                          : String(record[col.key] ?? '-')}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="mt-4 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-2">
            {showPageSizeSelector && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 dark:text-gray-400">Show</label>
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                >
                  {pageSizeOptions.map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>
            )}
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Showing {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length}
            </span>
          </div>

          <div className="flex gap-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 py-2 text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
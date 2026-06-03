import React, { useMemo, useCallback } from 'react';
import { clsx } from 'clsx';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MoreHorizontal } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  siblingCount?: number;
  showFirstLast?: boolean;
  showPrevNext?: boolean;
  showPageNumbers?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'minimal';
  disabled?: boolean;
  totalItems?: number;
  itemsPerPage?: number;
  showTotal?: boolean;
  pageLabel?: (page: number) => string;
}

const DOTS = '...';

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className,
  siblingCount = 1,
  showFirstLast = true,
  showPrevNext = true,
  showPageNumbers = true,
  size = 'md',
  variant = 'default',
  disabled = false,
  totalItems,
  itemsPerPage,
  showTotal = false,
  pageLabel,
}) => {
  const range = useCallback((start: number, end: number) => {
    const length = end - start + 1;
    return Array.from({ length }, (_, i) => start + i);
  }, []);

  const paginationRange = useMemo(() => {
    if (!showPageNumbers) return [];

    const totalPageNumbers = siblingCount * 2 + 3; // siblings + current + first + last
    if (totalPageNumbers >= totalPages) {
      return range(1, totalPages);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);
    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 2;
    const firstPageIndex = 1;
    const lastPageIndex = totalPages;

    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblingCount;
      const leftRange = range(1, leftItemCount);
      return [...leftRange, DOTS, totalPages];
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblingCount;
      const rightRange = range(totalPages - rightItemCount + 1, totalPages);
      return [firstPageIndex, DOTS, ...rightRange];
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
      const middleRange = range(leftSiblingIndex, rightSiblingIndex);
      return [firstPageIndex, DOTS, ...middleRange, DOTS, lastPageIndex];
    }

    return [];
  }, [currentPage, totalPages, siblingCount, range, showPageNumbers]);

  const handlePageChange = useCallback((page: number) => {
    if (disabled) return;
    if (page < 1 || page > totalPages) return;
    if (page === currentPage) return;
    onPageChange(page);
  }, [disabled, currentPage, totalPages, onPageChange]);

  const sizeClasses = {
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-12 w-12 text-lg',
  };

  const iconSizeClasses = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const variantClasses = {
    default: 'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700',
    outline: 'border-2 border-gray-300 dark:border-gray-600 bg-transparent text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500',
    minimal: 'border-0 bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800',
  };

  const activeClasses = {
    default: 'bg-blue-600 text-white hover:bg-blue-700 border-blue-600',
    outline: 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50',
    minimal: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
  };

  const baseButtonClasses = clsx(
    'flex items-center justify-center rounded-lg transition-all duration-200 font-medium',
    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900',
    'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent',
    sizeClasses[size]
  );

  const renderPageButton = (page: number, isActive: boolean) => {
    const buttonContent = pageLabel ? pageLabel(page) : page.toString();
    
    return (
      <button
        key={page}
        onClick={() => handlePageChange(page)}
        className={clsx(
          baseButtonClasses,
          isActive ? activeClasses[variant] : variantClasses[variant]
        )}
        aria-label={`Go to page ${page}`}
        aria-current={isActive ? 'page' : undefined}
        disabled={disabled}
      >
        {buttonContent}
      </button>
    );
  };

  const renderDots = (key: string) => (
    <div
      key={key}
      className={clsx(
        'flex items-center justify-center',
        sizeClasses[size],
        'text-gray-400 dark:text-gray-600'
      )}
    >
      <MoreHorizontal className={iconSizeClasses[size]} />
    </div>
  );

  const startItem = totalItems ? (currentPage - 1) * (itemsPerPage || 0) + 1 : 0;
  const endItem = totalItems ? Math.min(currentPage * (itemsPerPage || 0), totalItems) : 0;

  return (
    <div className={clsx('flex flex-col sm:flex-row items-center justify-between gap-4', className)}>
      {/* Total items display */}
      {showTotal && totalItems !== undefined && itemsPerPage !== undefined && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing <span className="font-semibold text-gray-900 dark:text-white">{startItem}</span> to{' '}
          <span className="font-semibold text-gray-900 dark:text-white">{endItem}</span> of{' '}
          <span className="font-semibold text-gray-900 dark:text-white">{totalItems}</span> results
        </div>
      )}

      <div className="flex items-center gap-1 flex-wrap justify-center">
        {/* First page button */}
        {showFirstLast && (
          <button
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1 || disabled}
            className={clsx(baseButtonClasses, variantClasses[variant])}
            aria-label="Go to first page"
          >
            <ChevronsLeft className={iconSizeClasses[size]} />
          </button>
        )}

        {/* Previous page button */}
        {showPrevNext && (
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || disabled}
            className={clsx(baseButtonClasses, variantClasses[variant])}
            aria-label="Go to previous page"
          >
            <ChevronLeft className={iconSizeClasses[size]} />
          </button>
        )}

        {/* Page numbers */}
        {showPageNumbers && paginationRange.map((page, index) => {
          if (page === DOTS) {
            return renderDots(`dots-${index}`);
          }
          return renderPageButton(page as number, page === currentPage);
        })}

        {/* Next page button */}
        {showPrevNext && (
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || disabled}
            className={clsx(baseButtonClasses, variantClasses[variant])}
            aria-label="Go to next page"
          >
            <ChevronRight className={iconSizeClasses[size]} />
          </button>
        )}

        {/* Last page button */}
        {showFirstLast && (
          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages || disabled}
            className={clsx(baseButtonClasses, variantClasses[variant])}
            aria-label="Go to last page"
          >
            <ChevronsRight className={iconSizeClasses[size]} />
          </button>
        )}
      </div>

      {/* Page info for mobile */}
      <div className="text-sm text-gray-500 dark:text-gray-400 sm:hidden">
        Page {currentPage} of {totalPages}
      </div>
    </div>
  );
};

// Compact pagination for tables
export const CompactPagination: React.FC<PaginationProps> = (props) => (
  <Pagination {...props} showFirstLast={false} siblingCount={0} size="sm" variant="minimal" />
);

// Pagination with page size selector
interface PaginationWithSizeProps extends PaginationProps {
  pageSize: number;
  pageSizeOptions?: number[];
  onPageSizeChange: (pageSize: number) => void;
}

export const PaginationWithSize: React.FC<PaginationWithSizeProps> = ({
  pageSize,
  pageSizeOptions = [10, 25, 50, 100],
  onPageSizeChange,
  ...paginationProps
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <span>Show</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Items per page"
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
        <span>per page</span>
      </div>
      <Pagination {...paginationProps} />
    </div>
  );
};
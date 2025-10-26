type PaginationControlsProps = {
  page: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
};

/**
 * PaginationControls Component
 * 
 * Purpose: Manages server-driven pagination with next/prev buttons and page info.
 * 
 * Features:
 * - Previous/Next navigation buttons
 * - Page number display with total count
 * - Disabled states for boundary conditions
 * - Accessible labels for screen readers
 * - Keyboard accessible
 */
const PaginationControls = ({
  page,
  pageSize,
  totalCount,
  onPageChange,
  isLoading,
}: PaginationControlsProps) => {
  const maxPage = Math.ceil(totalCount / pageSize);
  const hasNextPage = page < maxPage;
  const hasPrevPage = page > 1;
  
  const startItem = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalCount);

  const handlePrevious = () => {
    if (hasPrevPage && !isLoading) {
      onPageChange(page - 1);
    }
  };

  const handleNext = () => {
    if (hasNextPage && !isLoading) {
      onPageChange(page + 1);
    }
  };

  // Don't render if there's only one page or no items
  if (totalCount <= pageSize) {
    return null;
  }

  return (
    <nav
      className="flex items-center justify-between bg-brand-secondary border-2 border-brand-accent rounded-lg shadow-md px-4 py-3 sm:px-6"
      aria-label="Pagination"
    >
      {/* Results info */}
      <div className="flex-1 flex justify-between sm:hidden">
        <span className="text-sm text-brand-dark">
          Page {page} of {maxPage}
        </span>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-brand-dark">
            Showing <span className="font-semibold">{startItem}</span> to{' '}
            <span className="font-semibold">{endItem}</span> of{' '}
            <span className="font-semibold">{totalCount}</span> results
          </p>
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handlePrevious}
          disabled={!hasPrevPage || isLoading}
          className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 ${
            hasPrevPage && !isLoading
              ? 'border border-brand-primary bg-white text-brand-primary hover:bg-brand-primary hover:text-white'
              : 'border border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
          aria-label="Go to previous page"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span className="hidden sm:inline">Previous</span>
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={!hasNextPage || isLoading}
          className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 ${
            hasNextPage && !isLoading
              ? 'border border-brand-primary bg-white text-brand-primary hover:bg-brand-primary hover:text-white'
              : 'border border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
          aria-label="Go to next page"
        >
          <span className="hidden sm:inline">Next</span>
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </nav>
  );
};

export default PaginationControls;


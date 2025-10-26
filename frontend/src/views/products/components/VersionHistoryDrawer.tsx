import { useEffect, useRef } from 'react';
import type { VersionHistoryEntry } from '../../../types/products';
import { formatAnalysisDate } from '../../../utils/resultsMappers';
import RecommendationPill from './RecommendationPill';
import ReanalyzeButton from './ReanalyzeButton';

type VersionHistoryDrawerProps = {
  isOpen: boolean;
  productName: string;
  versions: VersionHistoryEntry[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  onClose: () => void;
  onLoadMore: () => void;
  onRetry?: () => void;
};

/**
 * VersionHistoryDrawer Component
 * 
 * Purpose: Slide-in panel showing paginated list of historical analyses for selected product.
 * 
 * Features:
 * - Overlay with click-outside to close
 * - Header with product name and close button
 * - List of version entries with timestamp and recommendation
 * - Load more button for pagination
 * - Focus trapping
 * - ESC key to close
 * - Accessible drawer semantics
 */
const VersionHistoryDrawer = ({
  isOpen,
  productName,
  versions,
  isLoading,
  error,
  hasMore,
  onClose,
  onLoadMore,
  onRetry,
}: VersionHistoryDrawerProps) => {
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus close button when drawer opens
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when drawer is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Handle click outside
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      aria-labelledby="drawer-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleOverlayClick}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div
          ref={drawerRef}
          className="w-screen max-w-md transform transition-transform"
        >
          <div className="flex h-full flex-col bg-brand-secondary shadow-xl border-l-4 border-brand-accent">
            {/* Header */}
            <div className="bg-brand-secondary border-b-2 border-brand-accent px-4 py-5 sm:px-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h2
                    id="drawer-title"
                    className="text-xl font-semibold text-brand-dark"
                  >
                    Version History
                  </h2>
                  <p className="mt-1 text-sm text-gray-600 truncate">
                    {productName}
                  </p>
                </div>
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={onClose}
                  className="ml-3 rounded-md text-brand-dark hover:text-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
                  aria-label="Close drawer"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
              {/* Error state */}
              {error && (
                <div className="bg-red-50 border-2 border-red-700 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <svg
                      className="h-5 w-5 text-red-700 flex-shrink-0 mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-red-900">{error}</p>
                      {onRetry && (
                        <button
                          type="button"
                          onClick={onRetry}
                          className="mt-2 text-sm font-medium text-red-700 hover:text-red-800 underline"
                        >
                          Try Again
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Version list */}
              {versions.length > 0 && (
                <ul className="space-y-3" role="list">
                  {versions.map((version) => (
                    <li
                      key={version.analysisId}
                      className="bg-white border-2 border-gray-300 rounded-lg p-4 hover:border-brand-primary transition-colors"
                    >
                      <div className="flex flex-col gap-3">
                        {/* Date and recommendation */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-brand-dark">
                              {formatAnalysisDate(version.createdAt)}
                            </p>
                          </div>
                          <RecommendationPill recommendation={version.recommendation} />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <ReanalyzeButton
                            payload={{
                              analysisId: version.analysisId,
                              productName: version.productName,
                            }}
                            variant="secondary"
                            size="small"
                          />
                          <a
                            href={`/results/${version.analysisId}`}
                            className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-brand-dark hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
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
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                            <span>View</span>
                          </a>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {/* Loading state */}
              {isLoading && versions.length === 0 && (
                <div className="flex items-center justify-center py-8">
                  <div className="flex flex-col items-center gap-3">
                    <div
                      className="h-8 w-8 animate-spin rounded-full border-4 border-brand-secondary border-t-brand-primary"
                      role="status"
                      aria-label="Loading version history"
                    >
                      <span className="sr-only">Loading...</span>
                    </div>
                    <p className="text-sm text-gray-600">Loading history...</p>
                  </div>
                </div>
              )}

              {/* Empty state */}
              {!isLoading && versions.length === 0 && !error && (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-600">No version history found.</p>
                </div>
              )}

              {/* Load more button */}
              {hasMore && !isLoading && (
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={onLoadMore}
                    className="inline-flex items-center gap-2 rounded-md border border-brand-primary bg-white px-4 py-2 text-sm font-medium text-brand-primary hover:bg-brand-primary hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
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
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                    <span>Load More</span>
                  </button>
                </div>
              )}

              {/* Loading more indicator */}
              {isLoading && versions.length > 0 && (
                <div className="mt-4 flex justify-center">
                  <div
                    className="h-6 w-6 animate-spin rounded-full border-4 border-brand-secondary border-t-brand-primary"
                    role="status"
                    aria-label="Loading more versions"
                  >
                    <span className="sr-only">Loading more...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VersionHistoryDrawer;


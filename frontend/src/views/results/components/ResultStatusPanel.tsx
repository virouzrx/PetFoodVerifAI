import type { PageStatus, PageErrorState } from '../../../types/results';

type ResultStatusPanelProps = {
  status: PageStatus;
  error: PageErrorState | null;
  onRetry: () => void;
};

/**
 * ResultStatusPanel Component
 * 
 * Purpose: Display loading, error, and not found states for the results page
 * Features: Loading spinner with skeleton, error messaging with retry, 404 guidance
 * Accessibility: aria-live regions, semantic roles, keyboard-accessible retry button
 */
const ResultStatusPanel = ({
  status,
  error,
  onRetry,
}: ResultStatusPanelProps) => {
  // Loading state
  if (status === 'loading') {
    return (
      <div
        className="flex flex-col items-center justify-center py-16 px-4"
        role="status"
        aria-live="polite"
        aria-label="Loading analysis"
      >
        {/* Loading Spinner */}
        <svg
          className="h-12 w-12 animate-spin text-brand-primary"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <p className="mt-4 text-lg font-medium text-gray-700">
          Loading analysis...
        </p>

        {/* Loading Skeleton */}
        <div className="mt-8 w-full max-w-2xl space-y-4 animate-pulse">
          <div className="h-16 bg-gray-200 rounded-lg" />
          <div className="h-32 bg-gray-200 rounded-lg" />
          <div className="h-24 bg-gray-200 rounded-lg" />
        </div>
      </div>
    );
  }

  // Not Found state
  if (status === 'notFound') {
    return (
      <div
        className="flex flex-col items-center justify-center py-16 px-4 text-center"
        role="alert"
        aria-live="assertive"
      >
        {/* 404 Icon */}
        <svg
          className="h-20 w-20 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h2 className="mt-4 text-2xl font-bold text-gray-900">
          Analysis Not Found
        </h2>
        <p className="mt-2 text-base text-gray-600 max-w-md">
          {error?.message ||
            'The analysis you are looking for could not be found. It may have been deleted or you may not have access to it.'}
        </p>
        <div className="mt-6 flex gap-3">
          <a
            href="/analyze"
            className="rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-primary/90 focus:outline-none focus:ring-2 focus:ring-brand-secondary/50 focus:ring-offset-2"
          >
            Analyze New Product
          </a>
          <a
            href="/history"
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-secondary/50 focus:ring-offset-2"
          >
            View History
          </a>
        </div>
      </div>
    );
  }

  // Error state
  if (status === 'error' && error) {
    const getErrorIcon = () => {
      switch (error.type) {
        case 'unauthorized':
          return (
            <svg
              className="h-20 w-20 text-amber-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          );
        case 'server':
          return (
            <svg
              className="h-20 w-20 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          );
        case 'network':
        default:
          return (
            <svg
              className="h-20 w-20 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
              />
            </svg>
          );
      }
    };

    const getErrorTitle = () => {
      switch (error.type) {
        case 'unauthorized':
          return 'Authentication Required';
        case 'server':
          return 'Server Error';
        case 'network':
        default:
          return 'Connection Error';
      }
    };

    return (
      <div
        className="flex flex-col items-center justify-center py-16 px-4 text-center"
        role="alert"
        aria-live="assertive"
      >
        {/* Error Icon */}
        {getErrorIcon()}
        <h2 className="mt-4 text-2xl font-bold text-gray-900">
          {getErrorTitle()}
        </h2>
        <p className="mt-2 text-base text-gray-600 max-w-md">
          {error.message}
        </p>
        <div className="mt-6">
          {error.type === 'unauthorized' ? (
            <a
              href="/login"
              className="rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-primary/90 focus:outline-none focus:ring-2 focus:ring-brand-secondary/50 focus:ring-offset-2"
            >
              Log In
            </a>
          ) : (
            <button
              type="button"
              onClick={onRetry}
              className="rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-primary/90 focus:outline-none focus:ring-2 focus:ring-brand-secondary/50 focus:ring-offset-2"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  // Default: don't render anything if status is 'ready'
  return null;
};

export default ResultStatusPanel;


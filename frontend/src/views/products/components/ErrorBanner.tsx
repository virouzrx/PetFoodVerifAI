type ErrorBannerProps = {
  message: string;
  onRetry?: () => void;
};

/**
 * ErrorBanner Component
 * 
 * Purpose: Displays inline error messages with optional retry action.
 * 
 * Features:
 * - Error icon for visual clarity
 * - Red color scheme following design system (red-50 bg, red-900 text)
 * - Optional retry button
 * - Accessible error role
 */
const ErrorBanner = ({ message, onRetry }: ErrorBannerProps) => {
  return (
    <div
      className="bg-red-50 border-2 border-red-700 rounded-lg p-4 sm:p-5"
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        {/* Error icon */}
        <svg
          className="h-6 w-6 text-red-700 flex-shrink-0"
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

        {/* Message and retry button */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-red-900">{message}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-2 rounded-md bg-red-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-700 focus:ring-offset-2 transition-colors"
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
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>Try Again</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorBanner;


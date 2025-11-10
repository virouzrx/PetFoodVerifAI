import type { ScrapeState } from '../../../types/analyze';

type ScrapeStatusProps = {
  state: ScrapeState;
  message: string;
  onRetry?: () => void;
  onEnableManual?: () => void;
  isManualVisible: boolean;
};

/**
 * ScrapeStatus Component
 * 
 * Purpose: Display real-time scraping/analysis progress and fallback guidance.
 * Features: Status badge, descriptive text, retry button, manual entry CTA
 * Accessibility: aria-live="polite" for screen reader announcements
 */
const ScrapeStatus = ({
  state,
  message,
  onRetry,
  onEnableManual,
  isManualVisible,
}: ScrapeStatusProps) => {
  // Don't show anything in idle state
  if (state === 'idle') {
    return null;
  }

  const getStatusStyles = () => {
    switch (state) {
      case 'scraping':
      case 'submitting':
        return 'bg-brand-secondary/10 border-brand-secondary/30 text-brand-dark';
      case 'awaitingManual':
        return 'bg-amber-50 border-amber-200 text-amber-900';
      case 'manualReady':
        return 'bg-emerald-50 border-emerald-200 text-emerald-900';
      default:
        return 'bg-gray-50 border-gray-200 text-brand-dark';
    }
  };

  const getStatusLabel = () => {
    switch (state) {
      case 'scraping':
        return 'Loading';
      case 'submitting':
        return 'Analyzing';
      case 'awaitingManual':
        return 'Manual Entry Available';
      case 'manualReady':
        return 'Ready';
      default:
        return 'Status';
    }
  };

  const showSpinner = state === 'scraping' || state === 'submitting';

  return (
    <div
      className={`rounded-md border-2 p-4 ${getStatusStyles()}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex items-start gap-3">
        {/* Status Indicator */}
        <div className="flex-shrink-0">
          {showSpinner ? (
            <svg
              className="h-5 w-5 animate-spin"
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
          ) : (
            <div className="h-5 w-5 flex items-center justify-center">
              {state === 'manualReady' ? (
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide">
            {getStatusLabel()}
          </p>
          <p className="mt-1 text-sm">{message}</p>

          {/* Action Buttons */}
          {(state === 'awaitingManual' && !isManualVisible) && (
            <div className="mt-3 flex gap-2">
              {onEnableManual && (
                <button
                  type="button"
                  onClick={onEnableManual}
                  className="rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                >
                  Enter Ingredients Manually
                </button>
              )}
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="rounded-md border border-amber-600 bg-white px-3 py-1.5 text-sm font-medium text-amber-900 hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                >
                  Try Again
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScrapeStatus;


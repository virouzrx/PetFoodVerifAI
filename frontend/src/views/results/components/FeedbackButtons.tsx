import type { FeedbackState, FeedbackDirection } from '../../../types/results';

type FeedbackButtonsProps = {
  feedbackState: FeedbackState;
  onSubmit: (direction: FeedbackDirection) => Promise<void>;
  isDisabled?: boolean;
};

/**
 * FeedbackButtons Component
 * 
 * Purpose: Two icon buttons (thumbs up/down) for submitting feedback on the analysis
 * 
 * Features:
 * - Thumbs up and thumbs down buttons with icons
 * - Loading state while feedback is being submitted
 * - Disabled state after successful submission or during submission
 * - Visual indication of which button was clicked
 * - Accessible labels and keyboard navigation
 */
const FeedbackButtons = ({
  feedbackState,
  onSubmit,
  isDisabled = false,
}: FeedbackButtonsProps) => {
  const { status, lastSubmitted } = feedbackState;

  const isSubmitting = status === 'submitting';
  const isSuccess = status === 'success';
  const isButtonDisabled = isDisabled || isSubmitting || isSuccess;

  const handleClick = (direction: FeedbackDirection) => {
    if (isButtonDisabled) return;
    onSubmit(direction);
  };

  const getButtonClass = (direction: FeedbackDirection) => {
    const baseClass =
      'inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

    const isThisButtonSuccess = isSuccess && lastSubmitted === direction;

    if (isButtonDisabled) {
      if (isThisButtonSuccess) {
        // Highlight the successful button
        return direction === 'up'
          ? `${baseClass} bg-green-100 border-green-300 text-green-800 cursor-not-allowed`
          : `${baseClass} bg-red-100 border-red-300 text-red-800 cursor-not-allowed`;
      }
      return `${baseClass} bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed`;
    }

    // Default active state
    return direction === 'up'
      ? `${baseClass} border-gray-300 bg-white text-gray-700 hover:bg-green-50 hover:border-green-400 focus:ring-green-500`
      : `${baseClass} border-gray-300 bg-white text-gray-700 hover:bg-red-50 hover:border-red-400 focus:ring-red-500`;
  };

  return (
    <div className="flex gap-3" role="group" aria-label="Feedback buttons">
      {/* Thumbs Up Button */}
      <button
        type="button"
        onClick={() => handleClick('up')}
        disabled={isButtonDisabled}
        className={getButtonClass('up')}
        aria-label="This analysis was helpful"
        data-state={
          isSubmitting && lastSubmitted === 'up'
            ? 'loading'
            : isSuccess && lastSubmitted === 'up'
            ? 'success'
            : 'idle'
        }
      >
        {isSubmitting && lastSubmitted === 'up' ? (
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
          <svg
            className="h-5 w-5"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
          </svg>
        )}
        <span>Helpful</span>
      </button>

      {/* Thumbs Down Button */}
      <button
        type="button"
        onClick={() => handleClick('down')}
        disabled={isButtonDisabled}
        className={getButtonClass('down')}
        aria-label="This analysis was not helpful"
        data-state={
          isSubmitting && lastSubmitted === 'down'
            ? 'loading'
            : isSuccess && lastSubmitted === 'down'
            ? 'success'
            : 'idle'
        }
      >
        {isSubmitting && lastSubmitted === 'down' ? (
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
          <svg
            className="h-5 w-5"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.105-1.79l-.05-.025A4 4 0 0011.055 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z" />
          </svg>
        )}
        <span>Not Helpful</span>
      </button>
    </div>
  );
};

export default FeedbackButtons;


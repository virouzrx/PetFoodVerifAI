import type { SubmitStatus } from '../../../types/analyze';

type SubmitAnalysisButtonProps = {
  status: SubmitStatus;
  disabled?: boolean;
  loadingLabel?: string;
};

/**
 * SubmitAnalysisButton Component
 * 
 * Purpose: Submit form while showing loading state and preventing duplicates.
 * Features: Dynamic label, spinner, disabled states
 */
const SubmitAnalysisButton = ({
  status,
  disabled = false,
  loadingLabel = 'Analyzing...',
}: SubmitAnalysisButtonProps) => {
  const isLoading = status === 'submitting';
  const isDisabled = disabled || isLoading;

  return (
    <button
      type="submit"
      disabled={isDisabled}
      className={`w-full rounded-md px-4 py-3 text-sm font-semibold text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
        isDisabled
          ? 'cursor-not-allowed bg-slate-400'
          : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
      } transition-colors duration-150`}
      aria-busy={isLoading}
    >
      <span className="flex items-center justify-center gap-2">
        {isLoading && (
          <svg
            className="h-4 w-4 animate-spin"
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
        )}
        <span>{isLoading ? loadingLabel : 'Analyze Product'}</span>
      </span>
    </button>
  );
};

export default SubmitAnalysisButton;


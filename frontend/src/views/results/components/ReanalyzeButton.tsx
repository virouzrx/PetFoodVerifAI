import type { AnalysisResultViewModel } from '../../../types/results';
import { mapToReanalyzePayload } from '../../../utils/resultsMappers';

type ReanalyzeButtonProps = {
  analysis: AnalysisResultViewModel;
  onReanalyze: () => void;
};

/**
 * ReanalyzeButton Component
 * 
 * Purpose: Button to navigate back to the analysis form with prefilled data
 * from the current analysis
 * 
 * Features:
 * - Validates that required fields exist before enabling
 * - Visual icon for clarity
 * - Accessible label and disabled state
 * - Tooltip or disabled state if data is insufficient
 * - Triggers navigation via parent callback
 */
const ReanalyzeButton = ({
  analysis,
  onReanalyze,
}: ReanalyzeButtonProps) => {
  // Check if we have the required data to reanalyze
  const reanalyzePayload = mapToReanalyzePayload(analysis);
  const canReanalyze = reanalyzePayload !== null;

  const handleClick = () => {
    if (!canReanalyze) return;
    onReanalyze();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!canReanalyze}
      className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
        canReanalyze
          ? 'border border-brand-primary bg-brand-primary text-white hover:bg-brand-primary/90 focus:ring-brand-primary/30'
          : 'border border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed'
      }`}
      aria-label={
        canReanalyze
          ? 'Re-analyze this product with updated information'
          : 'Re-analyze unavailable due to missing data'
      }
      title={
        canReanalyze
          ? 'Re-analyze this product with updated information'
          : 'Missing required data for re-analysis'
      }
    >
      <svg
        className="h-5 w-5"
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
      <span>Re-analyze Product</span>
    </button>
  );
};

export default ReanalyzeButton;


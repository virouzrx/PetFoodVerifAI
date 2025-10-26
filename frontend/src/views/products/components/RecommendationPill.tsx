import type { RecommendationKind } from '../../../types/results';
import {
  getRecommendationLabel,
} from '../../../utils/resultsMappers';

type RecommendationPillProps = {
  recommendation: RecommendationKind;
};

/**
 * RecommendationPill Component
 * 
 * Purpose: Visual badge representing recommendation status with color semantics.
 * Smaller and more compact than AnalysisBadge for use in list views.
 * 
 * Features:
 * - Color-coded background (green for Recommended, red for Not Recommended)
 * - Accessible label for screen readers
 * - Compact design suitable for list items
 */
const RecommendationPill = ({ recommendation }: RecommendationPillProps) => {
  const label = getRecommendationLabel(recommendation);
  const isRecommended = recommendation === 'Recommended';

  const pillClass = isRecommended
    ? 'bg-green-700 text-white border-green-900'
    : 'bg-red-700 text-white border-red-900';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${pillClass}`}
      role="status"
      aria-label={`Recommendation: ${label}`}
    >
      {/* Icon */}
      {isRecommended ? (
        <svg
          className="h-3.5 w-3.5"
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
          className="h-3.5 w-3.5"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      )}
      <span>{label}</span>
    </span>
  );
};

export default RecommendationPill;


import type { RecommendationKind } from '../../../types/results';
import {
  getRecommendationBadgeClass,
  getRecommendationLabel,
} from '../../../utils/resultsMappers';

type AnalysisBadgeProps = {
  recommendation: RecommendationKind;
};

/**
 * AnalysisBadge Component
 * 
 * Purpose: Renders a prominent badge displaying the analysis recommendation
 * with appropriate color coding and icon.
 * 
 * Features:
 * - Visual badge with color-coded background and border
 * - Icon indicating positive (check) or negative (X) recommendation
 * - Accessible label for screen readers
 * - Semantic color choices (green for recommended, red for not recommended)
 */
const AnalysisBadge = ({ recommendation }: AnalysisBadgeProps) => {
  const badgeClass = getRecommendationBadgeClass(recommendation);
  const label = getRecommendationLabel(recommendation);
  const isRecommended = recommendation === 'Recommended';

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-lg border-2 px-4 py-3 font-semibold ${badgeClass}`}
      role="status"
      aria-label={`Analysis result: ${label}`}
    >
      {/* Icon */}
      {isRecommended ? (
        <svg
          className="h-6 w-6"
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
          className="h-6 w-6"
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

      {/* Label */}
      <span className="text-lg">{label}</span>
    </div>
  );
};

export default AnalysisBadge;


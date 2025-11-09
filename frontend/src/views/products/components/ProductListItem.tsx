import { Link } from 'react-router-dom';
import type { ProductAnalysisSummary, ReanalyzeNavigationPayload } from '../../../types/products';
import { formatAnalysisDate } from '../../../utils/resultsMappers';
import RecommendationPill from './RecommendationPill';
import ReanalyzeButton from './ReanalyzeButton';

type ProductListItemProps = {
  item: ProductAnalysisSummary;
  onOpenVersionHistory?: (productId: string, productName: string) => void;
};

/**
 * ProductListItem Component
 * 
 * Purpose: Displays a single product entry with meta data and actions.
 * 
 * Features:
 * - Product name with link to analysis detail
 * - Formatted date of last analysis
 * - Recommendation pill with visual status
 * - Version history trigger button (optional)
 * - Accessible keyboard navigation
 */
const ProductListItem = ({ item, onOpenVersionHistory }: ProductListItemProps) => {
  const formattedDate = formatAnalysisDate(item.createdAt);
  // Hide version history for manual entries
  const hasVersionHistory = !!onOpenVersionHistory && !!item.productId && !item.isManualEntry;

  const handleVersionHistoryClick = () => {
    if (hasVersionHistory && item.productId) {
      onOpenVersionHistory(item.productId, item.productName);
    }
  };

  // Build reanalyze payload
  const reanalyzePayload: ReanalyzeNavigationPayload = {
    analysisId: item.analysisId,
    productName: item.productName,
    productUrl: item.productUrl,
    isManualEntry: item.isManualEntry,
    species: item.species,
    breed: item.breed,
    age: item.age,
    additionalInfo: item.additionalInfo,
  };

  return (
    <li className="bg-brand-secondary border-2 border-brand-accent rounded-lg shadow-md hover:shadow-lg transition-shadow">
      <div className="p-4 sm:p-5">
        {/* Main content */}
        <div className="flex flex-col gap-3">
          {/* Top row: Product info and recommendation */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            {/* Left section: Product info */}
            <div className="flex-1 min-w-0">
              {/* Product name with manual entry badge */}
              <div className="flex items-center gap-2">
                <Link
                  to={`/results/${item.analysisId}`}
                  className="text-lg font-semibold text-brand-dark hover:text-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 rounded"
                >
                  {item.productName}
                </Link>

                {/* Manual entry badge */}
                {item.isManualEntry && (
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200"
                    title="This product was entered manually"
                  >
                    <svg
                      className="h-3 w-3 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    Manual
                  </span>
                )}
              </div>
              
              {/* Date */}
              <p className="mt-1 text-sm text-gray-600">
                Analyzed {formattedDate}
              </p>

              {/* Show URL if available */}
              {item.productUrl && (
                <a
                  href={item.productUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 text-xs text-gray-500 hover:text-brand-primary truncate block"
                >
                  {item.productUrl}
                </a>
              )}
            </div>

            {/* Right section: Recommendation pill */}
            <div className="flex items-center">
              <RecommendationPill recommendation={item.recommendation} />
            </div>
          </div>

          {/* Action buttons row */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Reanalyze button */}
            <ReanalyzeButton
              payload={reanalyzePayload}
              variant="secondary"
              size="small"
            />

            {/* Version history button */}
            {hasVersionHistory && (
              <button
                type="button"
                onClick={handleVersionHistoryClick}
                className="inline-flex items-center gap-1.5 rounded-md border border-brand-primary bg-white px-3 py-1.5 text-sm font-medium text-brand-primary hover:bg-brand-primary hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
                aria-label={`View version history for ${item.productName}`}
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="hidden sm:inline">History</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </li>
  );
};

export default ProductListItem;


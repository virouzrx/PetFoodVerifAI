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
  const hasVersionHistory = !!onOpenVersionHistory && !!item.productId;

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
              {/* Product name */}
              <Link
                to={`/results/${item.analysisId}`}
                className="text-lg font-semibold text-brand-dark hover:text-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 rounded"
              >
                {item.productName}
              </Link>
              
              {/* Date */}
              <p className="mt-1 text-sm text-gray-600">
                Analyzed {formattedDate}
              </p>
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


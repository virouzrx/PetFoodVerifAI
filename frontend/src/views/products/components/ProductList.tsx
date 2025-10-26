import type { ProductAnalysisSummary } from '../../../types/products';
import ProductListItem from './ProductListItem';

type ProductListProps = {
  items: ProductAnalysisSummary[];
  onSelectVersionHistory?: (productId: string, productName: string) => void;
  isLoading?: boolean;
};

/**
 * ProductList Component
 * 
 * Purpose: Renders a collection of product analysis summaries.
 * 
 * Features:
 * - Accessible list structure with semantic HTML
 * - Keyboard navigation support
 * - Empty state handling
 * - Screen reader friendly headings
 */
const ProductList = ({ items, onSelectVersionHistory, isLoading }: ProductListProps) => {
  // Guard against rendering when items undefined
  if (!items && !isLoading) {
    return null;
  }

  // Show skeleton loading state
  if (isLoading) {
    return (
      <section aria-label="Product list" aria-busy="true">
        <ul className="space-y-4" role="list">
          {[1, 2, 3].map((i) => (
            <li
              key={i}
              className="bg-brand-secondary border-2 border-brand-accent rounded-lg shadow-md animate-pulse"
            >
              <div className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-6 bg-gray-300 rounded-full w-24"></div>
                    <div className="h-8 bg-gray-300 rounded w-20"></div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  // Validate items have mandatory keys
  const validItems = items.filter(
    (item) =>
      item.analysisId &&
      item.productName &&
      item.recommendation &&
      item.createdAt
  );

  if (validItems.length === 0) {
    return null;
  }

  return (
    <section aria-label="Product list">
      <h2 className="sr-only">Your analyzed products</h2>
      <ul className="space-y-4" role="list">
        {validItems.map((item) => (
          <ProductListItem
            key={item.analysisId}
            item={item}
            onOpenVersionHistory={onSelectVersionHistory}
          />
        ))}
      </ul>
    </section>
  );
};

export default ProductList;


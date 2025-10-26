import { useState } from 'react';
import { usePaginatedAnalyses } from '../../hooks/usePaginatedAnalyses';
import { useVersionHistory } from '../../hooks/useVersionHistory';
import ProductList from './components/ProductList';
import PaginationControls from './components/PaginationControls';
import EmptyState from './components/EmptyState';
import ErrorBanner from './components/ErrorBanner';
import VersionHistoryDrawer from './components/VersionHistoryDrawer';

/**
 * MyProductsPage Component
 * 
 * Purpose: Top-level view orchestrating data fetch, loading/error states, and layout.
 * 
 * Features:
 * - Fetches paginated list of user's analyzed products
 * - Renders loading spinner, error banner, empty state, or product list
 * - Manages pagination state
 * - Handles version history drawer (to be implemented)
 * - Enforces authentication (handled by parent route)
 */
const MyProductsPage = () => {
  // State for version history drawer
  const [selectedProduct, setSelectedProduct] = useState<{
    productId: string;
    productName: string;
  } | null>(null);

  // Fetch paginated analyses
  const { status, data, error, refetch, setPage } = usePaginatedAnalyses(1, 10);

  // Fetch version history for selected product
  const versionHistory = useVersionHistory(
    selectedProduct?.productId || null,
    5
  );

  // Handle version history trigger
  const handleOpenVersionHistory = (productId: string, productName: string) => {
    setSelectedProduct({ productId, productName });
  };

  // Handle close version history drawer
  const handleCloseVersionHistory = () => {
    setSelectedProduct(null);
    versionHistory.reset();
  };

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen">
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">My Products</h1>
            <p className="mt-2 text-base text-white">
              View and manage your analyzed pet food products
            </p>
          </div>

          {/* Loading spinner */}
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-4">
              <div
                className="h-12 w-12 animate-spin rounded-full border-4 border-brand-secondary border-t-brand-primary"
                role="status"
                aria-label="Loading products"
              >
                <span className="sr-only">Loading products...</span>
              </div>
              <p className="text-sm text-white">Loading your products...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">My Products</h1>
          <p className="mt-2 text-base text-white">
            View and manage your analyzed pet food products
          </p>
        </div>

        {/* Error state */}
        {status === 'error' && (
          <ErrorBanner
            message={error || 'Failed to load products. Please try again.'}
            onRetry={refetch}
          />
        )}

        {/* Empty state */}
        {status === 'ready' && data && data.isEmpty && (
          <EmptyState />
        )}

        {/* Products list */}
        {status === 'ready' && data && !data.isEmpty && (
          <div className="space-y-6">
            <ProductList
              items={data.items}
              onSelectVersionHistory={handleOpenVersionHistory}
            />

            {/* Pagination controls */}
            <PaginationControls
              page={data.page}
              pageSize={data.pageSize}
              totalCount={data.totalCount}
              onPageChange={setPage}
              isLoading={false}
            />
          </div>
        )}

        {/* Version History Drawer */}
        <VersionHistoryDrawer
          isOpen={!!selectedProduct}
          productName={selectedProduct?.productName || ''}
          versions={versionHistory.data}
          isLoading={versionHistory.status === 'loading'}
          error={versionHistory.error}
          hasMore={versionHistory.hasMore}
          onClose={handleCloseVersionHistory}
          onLoadMore={versionHistory.fetchNextPage}
          onRetry={() => {
            if (selectedProduct) {
              versionHistory.reset();
            }
          }}
        />
      </main>
    </div>
  );
};

export default MyProductsPage;


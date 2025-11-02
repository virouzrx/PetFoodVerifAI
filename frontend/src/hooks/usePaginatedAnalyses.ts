import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../state/auth/AuthContext';
import type {
  PaginatedAnalysesViewModel,
  UsePaginatedAnalysesResult,
  ProductAnalysisSummary,
} from '../types/products';
import { fetchPaginatedAnalyses } from '../services/analysisService';
import type { ApiErrorShape } from '../types/analyze';

const isApiErrorShape = (error: unknown): error is ApiErrorShape => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const maybeRecord = error as Record<string, unknown>;
  return typeof maybeRecord.status === 'number';
};

/**
 * Custom hook to fetch and manage paginated analyses
 * @param initialPage - Initial page number (default: 1)
 * @param initialPageSize - Initial page size (default: 10)
 * @returns Object containing status, data, error, refetch, and pagination controls
 */
export const usePaginatedAnalyses = (
  initialPage: number = 1,
  initialPageSize: number = 10
): UsePaginatedAnalysesResult => {
  const { state: authState, logout } = useAuth();
  const [page, setPageInternal] = useState(initialPage);
  const [pageSize, setPageSizeInternal] = useState(initialPageSize);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [data, setData] = useState<PaginatedAnalysesViewModel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Validate pagination parameters
  const validateParams = useCallback((p: number, ps: number): { page: number; pageSize: number } => {
    const validatedPage = Math.max(1, Math.floor(p));
    const allowedPageSizes = [10, 20, 50];
    const validatedPageSize = allowedPageSizes.includes(ps) ? ps : 10;
    return { page: validatedPage, pageSize: validatedPageSize };
  }, []);

  const fetchAnalyses = useCallback(async () => {
    // Ensure user is authenticated
    if (!authState.token) {
      setStatus('error');
      setError('You must be logged in to view your products.');
      setData(null);
      return;
    }

    // Validate parameters
    const validated = validateParams(page, pageSize);

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    setStatus('loading');
    setError(null);

    try {
      const response = await fetchPaginatedAnalyses(
        validated.page,
        validated.pageSize,
        authState.token,
        true // Group by product to show unique products only
      );

      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      // Map API response to view model
      const maxPage = Math.ceil(response.totalCount / response.pageSize);
      const viewModel: PaginatedAnalysesViewModel = {
        page: response.page,
        pageSize: response.pageSize,
        totalCount: response.totalCount,
        items: response.items.map((item): ProductAnalysisSummary => ({
          analysisId: item.analysisId,
          productId: item.productId,
          productName: item.productName,
          recommendation: item.recommendation,
          createdAt: item.createdAt,
        })),
        isEmpty: response.items.length === 0,
        hasMore: response.page < maxPage,
        maxPage,
      };

      setData(viewModel);
      setStatus('ready');
      setError(null);
    } catch (err: unknown) {
      // Handle abort - don't update state
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }

      console.error('Failed to fetch analyses:', err);

      // Handle 401 - trigger logout
      if (isApiErrorShape(err) && err.status === 401) {
        logout();
        setStatus('error');
        setError('Your session has expired. Please log in again.');
        setData(null);
        return;
      }

      // Handle other errors
      setStatus('error');
      const fallbackMessage = 'Unable to load your products. Please try again later.';
      if (isApiErrorShape(err)) {
        setError(err.message || fallbackMessage);
      } else if (err instanceof Error) {
        setError(err.message || fallbackMessage);
      } else {
        setError(fallbackMessage);
      }
      setData(null);
    }
  }, [page, pageSize, authState.token, logout, validateParams]);

  // Fetch on mount and when dependencies change
  useEffect(() => {
    fetchAnalyses();

    // Cleanup: abort pending request on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchAnalyses]);

  // Refetch function for retry
  const refetch = useCallback(() => {
    fetchAnalyses();
  }, [fetchAnalyses]);

  // Page setter with validation
  const setPage = useCallback((newPage: number) => {
    const validated = validateParams(newPage, pageSize);
    setPageInternal(validated.page);
  }, [pageSize, validateParams]);

  // Page size setter with validation
  const setPageSize = useCallback((newPageSize: number) => {
    const validated = validateParams(page, newPageSize);
    setPageSizeInternal(validated.pageSize);
    // Reset to page 1 when changing page size
    setPageInternal(1);
  }, [page, validateParams]);

  return {
    status,
    data,
    error,
    refetch,
    setPage,
    setPageSize,
  };
};


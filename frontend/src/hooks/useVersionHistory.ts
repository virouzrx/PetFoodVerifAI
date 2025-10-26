import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../state/auth/AuthContext';
import type {
  VersionHistoryEntry,
  UseVersionHistoryResult,
} from '../types/products';
import { fetchProductVersionHistory } from '../services/analysisService';

/**
 * Custom hook to fetch and manage version history for a specific product
 * @param productId - Product UUID (null when drawer closed)
 * @param pageSize - Number of items per page (default: 5)
 * @returns Object containing status, data, error, and pagination controls
 */
export const useVersionHistory = (
  productId: string | null,
  pageSize: number = 5
): UseVersionHistoryResult => {
  const { state: authState, logout } = useAuth();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [data, setData] = useState<VersionHistoryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchVersions = useCallback(async (productIdToFetch: string, pageToFetch: number) => {
    // Ensure user is authenticated
    if (!authState.token) {
      setStatus('error');
      setError('You must be logged in to view version history.');
      setData([]);
      return;
    }

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    setStatus('loading');
    setError(null);

    try {
      const response = await fetchProductVersionHistory(
        productIdToFetch,
        pageToFetch,
        pageSize,
        authState.token
      );

      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      // Map response to version history entries
      const versions: VersionHistoryEntry[] = response.items.map((item) => ({
        analysisId: item.analysisId,
        productId: item.productId,
        productName: item.productName,
        recommendation: item.recommendation,
        createdAt: item.createdAt,
      }));

      // Append to existing data if fetching next page
      if (pageToFetch > 1) {
        setData((prev) => [...prev, ...versions]);
      } else {
        setData(versions);
      }

      // Check if there are more pages
      const maxPage = Math.ceil(response.totalCount / response.pageSize);
      setHasMore(pageToFetch < maxPage);
      
      setStatus('ready');
      setError(null);
    } catch (err: any) {
      // Handle abort - don't update state
      if (err.name === 'AbortError') {
        return;
      }

      console.error('Failed to fetch version history:', err);

      // Handle 401 - trigger logout
      if (err.status === 401) {
        logout();
        setStatus('error');
        setError('Your session has expired. Please log in again.');
        setData([]);
        return;
      }

      // Handle other errors
      setStatus('error');
      setError(
        err.message || 'Unable to load version history. Please try again later.'
      );
    }
  }, [authState.token, logout, pageSize]);

  // Fetch when productId or page changes
  useEffect(() => {
    if (productId) {
      fetchVersions(productId, page);
    } else {
      // Reset when drawer closes
      setStatus('idle');
      setData([]);
      setError(null);
      setPage(1);
      setHasMore(false);
    }

    // Cleanup: abort pending request on unmount or when productId changes
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [productId, page, fetchVersions]);

  // Fetch next page
  const fetchNextPage = useCallback(() => {
    if (hasMore && status !== 'loading' && productId) {
      setPage((prev) => prev + 1);
    }
  }, [hasMore, status, productId]);

  // Reset state
  const reset = useCallback(() => {
    setPage(1);
    setData([]);
    setError(null);
    setHasMore(false);
    setStatus('idle');
  }, []);

  return {
    status,
    data,
    error,
    hasMore,
    fetchNextPage,
    reset,
  };
};


import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../state/auth/AuthContext';
import type {
  AnalysisDetailDto,
  AnalysisResultViewModel,
  PageStatus,
  PageErrorState,
  UseAnalysisDetailResult,
} from '../types/results';
import {
  mapAnalysisDetailToViewModel,
  classifyApiError,
  isValidUuid,
} from '../utils/resultsMappers';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5135/api';

/**
 * Custom hook to fetch and manage analysis detail data
 * @param analysisId - The UUID of the analysis to fetch
 * @returns Object containing status, data, error, and refetch function
 */
export const useAnalysisDetail = (
  analysisId: string | undefined
): UseAnalysisDetailResult => {
  const { state: authState, logout } = useAuth();
  const [status, setStatus] = useState<PageStatus>('loading');
  const [data, setData] = useState<AnalysisResultViewModel | null>(null);
  const [error, setError] = useState<PageErrorState | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchAnalysis = useCallback(async () => {
    // Validate analysisId before attempting fetch
    if (!isValidUuid(analysisId)) {
      setStatus('error');
      setError({
        type: 'network',
        message:
          'Invalid analysis ID format. Please check the URL and try again.',
      });
      setData(null);
      return;
    }

    // Ensure user is authenticated
    if (!authState.token) {
      setStatus('error');
      setError({
        type: 'unauthorized',
        message: 'You must be logged in to view this analysis.',
      });
      setData(null);
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
      const response = await fetch(`${API_BASE_URL}/analyses/${analysisId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authState.token}`,
        },
        credentials: 'include',
        signal: abortControllerRef.current.signal,
      });

      // Handle successful response
      if (response.ok) {
        const dto: AnalysisDetailDto = await response.json();
        const viewModel = mapAnalysisDetailToViewModel(dto);
        setData(viewModel);
        setStatus('ready');
        setError(null);
        return;
      }

      // Handle 401 - trigger logout
      if (response.status === 401) {
        logout();
        setStatus('error');
        setError(classifyApiError(401));
        setData(null);
        return;
      }

      // Handle 404 - not found
      if (response.status === 404) {
        setStatus('notFound');
        setError(classifyApiError(404));
        setData(null);
        return;
      }

      // Handle other error responses
      let errorMessage: string | undefined;
      try {
        const errorBody = await response.json();
        errorMessage = errorBody?.message;
      } catch {
        // Unable to parse error body, use default message
      }

      const errorState = classifyApiError(response.status, errorMessage);
      setStatus('error');
      setError(errorState);
      setData(null);
    } catch (err: unknown) {
      // Handle abort - don't update state
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }

      // Handle network errors
      console.error('Failed to fetch analysis:', err);
      setStatus('error');
      setError({
        type: 'network',
        message:
          'Unable to load analysis. Please check your connection and try again.',
      });
      setData(null);
    }
  }, [analysisId, authState.token, logout]);

  // Fetch on mount and when analysisId or token changes
  useEffect(() => {
    fetchAnalysis();

    // Cleanup: abort pending request on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchAnalysis]);

  // Refetch function for retry
  const refetch = useCallback(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  return {
    status,
    data,
    error,
    refetch,
  };
};


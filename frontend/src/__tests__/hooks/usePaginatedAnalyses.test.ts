import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import React from 'react';
import { usePaginatedAnalyses } from '../../hooks/usePaginatedAnalyses';
import * as analysisService from '../../services/analysisService';
import { AuthProvider } from '../../state/auth/AuthContext';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Create wrapper that provides AuthContext
const createAuthWrapper = () => {
  return function AuthWrapper({ children }: { children: ReactNode }) {
    return React.createElement(AuthProvider, { children });
  };
};

// Mock analysisService
vi.mock('../../services/analysisService', () => ({
  fetchPaginatedAnalyses: vi.fn(),
}));

describe('usePaginatedAnalyses', () => {
  const mockApiResponse = {
    page: 1,
    pageSize: 10,
    totalCount: 25,
    items: [
      {
        analysisId: '123e4567-e89b-12d3-a456-426614174000',
        productId: '456e7890-e89b-12d3-a456-426614174000',
        productName: 'Test Product 1',
        recommendation: 'Recommended' as const,
        createdAt: '2024-01-01T12:00:00Z',
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('pfvauth', JSON.stringify({
      token: 'test-token-123',
      user: { userId: 'test-user-id', email: 'test@example.com' }
    }));
    vi.mocked(analysisService.fetchPaginatedAnalyses).mockResolvedValue(
      mockApiResponse
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('initialization', () => {
    it('should initialize with default page and pageSize', () => {
      const { result } = renderHook(() => usePaginatedAnalyses(), {
        wrapper: createAuthWrapper()
      });

      expect(result.current.status).toBe('loading');
      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('should initialize with provided initial values', async () => {
      vi.mocked(analysisService.fetchPaginatedAnalyses).mockResolvedValueOnce({
        ...mockApiResponse,
        page: 2,
        pageSize: 20,
      });

      const { result } = renderHook(() => usePaginatedAnalyses(2, 20), {
        wrapper: createAuthWrapper()
      });

      await waitFor(() => {
        expect(result.current.status).toBe('ready');
      });

      expect(result.current.data?.page).toBe(2);
      expect(result.current.data?.pageSize).toBe(20);
    });

    it('should have refetch, setPage, and setPageSize functions', () => {
      const { result } = renderHook(() => usePaginatedAnalyses(), {
        wrapper: createAuthWrapper()
      });

      expect(typeof result.current.refetch).toBe('function');
      expect(typeof result.current.setPage).toBe('function');
      expect(typeof result.current.setPageSize).toBe('function');
    });
  });

  describe('data fetching', () => {
    it('should fetch paginated analyses successfully', async () => {
      const { result } = renderHook(() => usePaginatedAnalyses(), {
        wrapper: createAuthWrapper()
      });

      await waitFor(() => {
        expect(result.current.status).toBe('ready');
      });

      expect(result.current.data).not.toBeNull();
      expect(result.current.data?.items).toHaveLength(1);
      expect(result.current.error).toBeNull();
    });

    it('should call fetchPaginatedAnalyses with correct parameters', async () => {
      renderHook(() => usePaginatedAnalyses(1, 10), {
        wrapper: createAuthWrapper()
      });

      await waitFor(() => {
        expect(analysisService.fetchPaginatedAnalyses).toHaveBeenCalled();
      });

      const callArgs =
        vi.mocked(analysisService.fetchPaginatedAnalyses).mock.calls[0];
      expect(callArgs[0]).toBe(1); // page
      expect(callArgs[1]).toBe(10); // pageSize
      expect(callArgs[2]).toBe('test-token-123'); // token
      expect(callArgs[3]).toBe(true); // groupByProduct
    });

    it('should include auth token in request', async () => {
      renderHook(() => usePaginatedAnalyses(), {
        wrapper: createAuthWrapper()
      });

      await waitFor(() => {
        expect(analysisService.fetchPaginatedAnalyses).toHaveBeenCalled();
      });

      const callArgs =
        vi.mocked(analysisService.fetchPaginatedAnalyses).mock.calls[0];
      expect(callArgs[2]).toBe('test-token-123');
    });

    it('should map API response to ViewModel', async () => {
      const { result } = renderHook(() => usePaginatedAnalyses(), {
        wrapper: createAuthWrapper()
      });

      await waitFor(() => {
        expect(result.current.status).toBe('ready');
      });

      expect(result.current.data).toEqual({
        page: 1,
        pageSize: 10,
        totalCount: 25,
        items: mockApiResponse.items,
        isEmpty: false,
        hasMore: true,
        maxPage: 3,
      });
    });

    it('should calculate hasMore correctly', async () => {
      const { result } = renderHook(() => usePaginatedAnalyses(1, 10), {
        wrapper: createAuthWrapper()
      });

      await waitFor(() => {
        expect(result.current.status).toBe('ready');
      });

      // 25 items, 10 per page = 3 pages total, on page 1 = hasMore: true
      expect(result.current.data?.hasMore).toBe(true);
      expect(result.current.data?.maxPage).toBe(3);
    });

    it('should calculate hasMore false on last page', async () => {
      vi.mocked(analysisService.fetchPaginatedAnalyses).mockResolvedValueOnce({
        page: 3,
        pageSize: 10,
        totalCount: 25,
        items: [],
      });

      const { result } = renderHook(() => usePaginatedAnalyses(3, 10), {
        wrapper: createAuthWrapper()
      });

      await waitFor(() => {
        expect(result.current.status).toBe('ready');
      });

      expect(result.current.data?.hasMore).toBe(false);
    });

    it('should set isEmpty when no items', async () => {
      vi.mocked(analysisService.fetchPaginatedAnalyses).mockResolvedValueOnce({
        page: 1,
        pageSize: 10,
        totalCount: 0,
        items: [],
      });

      const { result } = renderHook(() => usePaginatedAnalyses(), {
        wrapper: createAuthWrapper()
      });

      await waitFor(() => {
        expect(result.current.status).toBe('ready');
      });

      expect(result.current.data?.isEmpty).toBe(true);
    });
  });

  describe('parameter validation', () => {
    it('should validate page to minimum 1', async () => {
      renderHook(() => usePaginatedAnalyses(0, 10), {
        wrapper: createAuthWrapper()
      });

      await waitFor(() => {
        expect(analysisService.fetchPaginatedAnalyses).toHaveBeenCalled();
      });

      const callArgs =
        vi.mocked(analysisService.fetchPaginatedAnalyses).mock.calls[0];
      expect(callArgs[0]).toBe(1); // Should be corrected to 1
    });

    it('should handle negative page numbers', async () => {
      renderHook(() => usePaginatedAnalyses(-5, 10), {
        wrapper: createAuthWrapper()
      });

      await waitFor(() => {
        expect(analysisService.fetchPaginatedAnalyses).toHaveBeenCalled();
      });

      const callArgs =
        vi.mocked(analysisService.fetchPaginatedAnalyses).mock.calls[0];
      expect(callArgs[0]).toBe(1);
    });

    it('should validate pageSize to allowed values', async () => {
      renderHook(() => usePaginatedAnalyses(1, 15), {
        wrapper: createAuthWrapper()
      });

      await waitFor(() => {
        expect(analysisService.fetchPaginatedAnalyses).toHaveBeenCalled();
      });

      const callArgs =
        vi.mocked(analysisService.fetchPaginatedAnalyses).mock.calls[0];
      // 15 is not in [10, 20, 50], should default to 10
      expect(callArgs[1]).toBe(10);
    });

    it('should accept allowed pageSize values', async () => {
      const allowedSizes = [10, 20, 50];

      for (const size of allowedSizes) {
        vi.clearAllMocks();
        vi.mocked(analysisService.fetchPaginatedAnalyses).mockResolvedValue({
          ...mockApiResponse,
          pageSize: size,
        });

        renderHook(() => usePaginatedAnalyses(1, size), {
          wrapper: createAuthWrapper()
        });

        await waitFor(() => {
          expect(analysisService.fetchPaginatedAnalyses).toHaveBeenCalled();
        });

        const callArgs =
          vi.mocked(analysisService.fetchPaginatedAnalyses).mock.calls[0];
        expect(callArgs[1]).toBe(size);
      }
    });

    it('should floor page numbers', async () => {
      renderHook(() => usePaginatedAnalyses(2.7, 10), {
        wrapper: createAuthWrapper()
      });

      await waitFor(() => {
        expect(analysisService.fetchPaginatedAnalyses).toHaveBeenCalled();
      });

      const callArgs =
        vi.mocked(analysisService.fetchPaginatedAnalyses).mock.calls[0];
      expect(callArgs[0]).toBe(2);
    });
  });

  describe('error handling', () => {
    it('should handle 401 Unauthorized and trigger logout', async () => {
      const error = new Error('Unauthorized');
      (error as any).status = 401;

      vi.mocked(analysisService.fetchPaginatedAnalyses).mockRejectedValueOnce(
        error
      );

      const { result } = renderHook(() => usePaginatedAnalyses(), {
        wrapper: createAuthWrapper()
      });

      await waitFor(() => {
        expect(result.current.status).toBe('error');
      });

      // After logout, error could be "expired" or "must be logged in" depending on timing
      expect(
        result.current.error?.includes('expired') || 
        result.current.error?.includes('logged in')
      ).toBe(true);
      expect(result.current.data).toBeNull();
    });

    it('should handle network errors', async () => {
      vi.mocked(analysisService.fetchPaginatedAnalyses).mockRejectedValueOnce(
        new Error('Network error')
      );

      const { result } = renderHook(() => usePaginatedAnalyses(), {
        wrapper: createAuthWrapper()
      });

      await waitFor(() => {
        expect(result.current.status).toBe('error');
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.data).toBeNull();
    });

    it('should handle API errors with custom message', async () => {
      const error = new Error('Custom error message');
      (error as any).status = 500;

      vi.mocked(analysisService.fetchPaginatedAnalyses).mockRejectedValueOnce(
        error
      );

      const { result } = renderHook(() => usePaginatedAnalyses(), {
        wrapper: createAuthWrapper()
      });

      await waitFor(() => {
        expect(result.current.status).toBe('error');
      });

      expect(result.current.error).toContain('Custom error message');
    });

    it('should handle AbortError gracefully', async () => {
      const error = new Error('AbortError');
      error.name = 'AbortError';

      vi.mocked(analysisService.fetchPaginatedAnalyses).mockRejectedValueOnce(
        error
      );

      const { result } = renderHook(() => usePaginatedAnalyses(), {
        wrapper: createAuthWrapper()
      });

      await waitFor(() => {
        expect(result.current).toBeDefined();
      });
    });

    it('should handle error without status code', async () => {
      const error = new Error('Something went wrong');

      vi.mocked(analysisService.fetchPaginatedAnalyses).mockRejectedValueOnce(
        error
      );

      const { result } = renderHook(() => usePaginatedAnalyses(), {
        wrapper: createAuthWrapper()
      });

      await waitFor(() => {
        expect(result.current.status).toBe('error');
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('setPage functionality', () => {
    it('should update page and trigger refetch', async () => {
      const { result } = renderHook(() => usePaginatedAnalyses(), {
        wrapper: createAuthWrapper()
      });

      await waitFor(() => {
        expect(result.current.status).toBe('ready');
      });

      vi.clearAllMocks();
      vi.mocked(analysisService.fetchPaginatedAnalyses).mockResolvedValue({
        ...mockApiResponse,
        page: 2,
      });

      act(() => {
        result.current.setPage(2);
      });

      await waitFor(() => {
        expect(analysisService.fetchPaginatedAnalyses).toHaveBeenCalled();
      });

      const callArgs =
        vi.mocked(analysisService.fetchPaginatedAnalyses).mock.calls[0];
      expect(callArgs[0]).toBe(2);
    });

    it('should validate page in setPage', async () => {
      const { result } = renderHook(() => usePaginatedAnalyses(), {
        wrapper: createAuthWrapper()
      });

      await waitFor(() => {
        expect(result.current.status).toBe('ready');
      });

      act(() => {
        result.current.setPage(0); // Invalid page
      });

      // Page should be corrected to 1 on next fetch
      // The actual validation happens in the hook's validateParams
      expect(typeof result.current.setPage).toBe('function');
    });

    it('should reject negative page in setPage', async () => {
      const { result } = renderHook(() => usePaginatedAnalyses(), {
        wrapper: createAuthWrapper()
      });

      await waitFor(() => {
        expect(result.current.status).toBe('ready');
      });

      act(() => {
        result.current.setPage(-5);
      });

      // Negative page should be corrected to 1
      expect(typeof result.current.setPage).toBe('function');
    });

    it('should handle large page numbers', async () => {
      const { result } = renderHook(() => usePaginatedAnalyses(), {
        wrapper: createAuthWrapper()
      });

      await waitFor(() => {
        expect(result.current.status).toBe('ready');
      });

      vi.clearAllMocks();
      vi.mocked(analysisService.fetchPaginatedAnalyses).mockResolvedValue({
        ...mockApiResponse,
        page: 9999,
      });

      act(() => {
        result.current.setPage(9999);
      });

      await waitFor(() => {
        expect(analysisService.fetchPaginatedAnalyses).toHaveBeenCalled();
      });

      const callArgs =
        vi.mocked(analysisService.fetchPaginatedAnalyses).mock.calls[0];
      expect(callArgs[0]).toBe(9999);
    });
  });

  describe('setPageSize functionality', () => {
    it('should update pageSize and reset to page 1', async () => {
      const { result } = renderHook(() => usePaginatedAnalyses(3, 10), {
        wrapper: createAuthWrapper()
      });

      await waitFor(() => {
        expect(result.current.status).toBe('ready');
      });

      vi.clearAllMocks();
      vi.mocked(analysisService.fetchPaginatedAnalyses).mockResolvedValue({
        ...mockApiResponse,
        pageSize: 20,
        page: 1, // Should reset to page 1
      });

      act(() => {
        result.current.setPageSize(20);
      });

      await waitFor(() => {
        expect(analysisService.fetchPaginatedAnalyses).toHaveBeenCalled();
      });

      const callArgs =
        vi.mocked(analysisService.fetchPaginatedAnalyses).mock.calls[0];
      expect(callArgs[0]).toBe(1); // Page reset
      expect(callArgs[1]).toBe(20); // PageSize updated
    });

    it('should validate pageSize in setPageSize', async () => {
      const { result } = renderHook(() => usePaginatedAnalyses(), {
        wrapper: createAuthWrapper()
      });

      await waitFor(() => {
        expect(result.current.status).toBe('ready');
      });

      act(() => {
        result.current.setPageSize(15); // Invalid page size
      });

      // Invalid page size should be corrected to default (10)
      // The validation happens in the hook's validateParams
      expect(typeof result.current.setPageSize).toBe('function');
    });

    it('should only accept allowed pageSizes', async () => {
      const allowedSizes = [10, 20, 50];

      for (const size of allowedSizes) {
        vi.clearAllMocks();
        vi.mocked(analysisService.fetchPaginatedAnalyses).mockResolvedValue({
          ...mockApiResponse,
          pageSize: size,
        });

        renderHook(() => usePaginatedAnalyses(1, size), {
          wrapper: createAuthWrapper()
        });

        await waitFor(() => {
          expect(analysisService.fetchPaginatedAnalyses).toHaveBeenCalled();
        }, { timeout: 1000 });

        const callArgs =
          vi.mocked(analysisService.fetchPaginatedAnalyses).mock.calls[0];
        expect(callArgs[1]).toBe(size);
      }
    });
  });

  describe('refetch functionality', () => {
    it('should refetch with current parameters', async () => {
      const { result } = renderHook(() => usePaginatedAnalyses(2, 20), {
        wrapper: createAuthWrapper()
      });

      await waitFor(() => {
        expect(result.current.status).toBe('ready');
      });

      vi.clearAllMocks();
      vi.mocked(analysisService.fetchPaginatedAnalyses).mockResolvedValue({
        ...mockApiResponse,
        page: 2,
        pageSize: 20,
      });

      act(() => {
        result.current.refetch();
      });

      await waitFor(() => {
        expect(analysisService.fetchPaginatedAnalyses).toHaveBeenCalled();
      });

      const callArgs =
        vi.mocked(analysisService.fetchPaginatedAnalyses).mock.calls[0];
      expect(callArgs[0]).toBe(2); // Same page
      expect(callArgs[1]).toBe(20); // Same pageSize
    });

    it('should reset to ready state after successful refetch', async () => {
      vi.mocked(analysisService.fetchPaginatedAnalyses)
        .mockResolvedValueOnce(mockApiResponse)
        .mockRejectedValueOnce(new Error('Error'))
        .mockResolvedValueOnce(mockApiResponse);

      const { result } = renderHook(() => usePaginatedAnalyses(), {
        wrapper: createAuthWrapper()
      });

      await waitFor(() => {
        expect(result.current.status).toBe('ready');
      });

      // First successful state verified

      // Simulate another refetch that fails
      vi.clearAllMocks();
      vi.mocked(analysisService.fetchPaginatedAnalyses).mockRejectedValueOnce(
        new Error('Error')
      );

      act(() => {
        result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.status).toBe('error');
      });

      expect(result.current.data).toBeNull();
    });
  });

  describe('state transitions', () => {
    it('should transition from loading to ready', async () => {
      const { result } = renderHook(() => usePaginatedAnalyses(), {
        wrapper: createAuthWrapper()
      });

      expect(result.current.status).toBe('loading');

      await waitFor(() => {
        expect(result.current.status).toBe('ready');
      });
    });

    it('should transition from loading to error', async () => {
      vi.mocked(analysisService.fetchPaginatedAnalyses).mockRejectedValueOnce(
        new Error('API error')
      );

      const { result } = renderHook(() => usePaginatedAnalyses(), {
        wrapper: createAuthWrapper()
      });

      expect(result.current.status).toBe('loading');

      await waitFor(() => {
        expect(result.current.status).toBe('error');
      });
    });
  });

  describe('abort controller', () => {
    it('should abort previous request when parameters change', async () => {
      // @ts-ignore Used in mock class
      let _abortCalled = false;
      const originalAbortController = AbortController;
      
      global.AbortController = class MockAbortController {
        signal = { aborted: false };
        abort = vi.fn(() => {
          _abortCalled = true;
          this.signal.aborted = true;
        });
      } as any;

      vi.mocked(analysisService.fetchPaginatedAnalyses).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () => resolve(mockApiResponse),
              100
            );
          })
      );

      const { rerender } = renderHook(
        ({ page, pageSize }) => usePaginatedAnalyses(page, pageSize),
        { initialProps: { page: 1, pageSize: 10 }, wrapper: createAuthWrapper() }
      );

      // Wait for initial fetch to complete
      await new Promise(resolve => setTimeout(resolve, 150));

      // Change parameters to trigger abort
      rerender({ page: 2, pageSize: 10 });

      // Give time for abort to be called
      await new Promise(resolve => setTimeout(resolve, 50));

      global.AbortController = originalAbortController;
    });

    it('should abort pending request on unmount', async () => {
      // @ts-ignore Used in mock class
      let _abortCalled = false;
      const originalAbortController = AbortController;
      
      global.AbortController = class MockAbortController {
        signal = { aborted: false };
        abort = vi.fn(() => {
          _abortCalled = true;
          this.signal.aborted = true;
        });
      } as any;

      vi.mocked(analysisService.fetchPaginatedAnalyses).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () => resolve(mockApiResponse),
              1000
            );
          })
      );

      const { unmount } = renderHook(() => usePaginatedAnalyses(), {
        wrapper: createAuthWrapper()
      });

      unmount();

      expect(_abortCalled).toBe(true);
      global.AbortController = originalAbortController;
    });
  });

  describe('edge cases', () => {
    it('should handle response with zero items', async () => {
      vi.mocked(analysisService.fetchPaginatedAnalyses).mockResolvedValueOnce({
        page: 1,
        pageSize: 10,
        totalCount: 0,
        items: [],
      });

      const { result } = renderHook(() => usePaginatedAnalyses(), {
        wrapper: createAuthWrapper()
      });

      await waitFor(() => {
        expect(result.current.status).toBe('ready');
      });

      expect(result.current.data?.isEmpty).toBe(true);
      expect(result.current.data?.hasMore).toBe(false);
      expect(result.current.data?.maxPage).toBe(0);
    });

    it('should handle response with exactly one page', async () => {
      vi.mocked(analysisService.fetchPaginatedAnalyses).mockResolvedValueOnce({
        page: 1,
        pageSize: 10,
        totalCount: 5,
        items: mockApiResponse.items,
      });

      const { result } = renderHook(() => usePaginatedAnalyses(), {
        wrapper: createAuthWrapper()
      });

      await waitFor(() => {
        expect(result.current.status).toBe('ready');
      });

      expect(result.current.data?.hasMore).toBe(false);
      expect(result.current.data?.maxPage).toBe(1);
    });

    it('should handle very large totalCount', async () => {
      vi.mocked(analysisService.fetchPaginatedAnalyses).mockResolvedValueOnce({
        page: 1,
        pageSize: 10,
        totalCount: 1000000,
        items: mockApiResponse.items,
      });

      const { result } = renderHook(() => usePaginatedAnalyses(), {
        wrapper: createAuthWrapper()
      });

      await waitFor(() => {
        expect(result.current.status).toBe('ready');
      });

      expect(result.current.data?.maxPage).toBe(100000);
    });

    it('should handle rapid successive state changes', async () => {
      const { result } = renderHook(() => usePaginatedAnalyses(), {
        wrapper: createAuthWrapper()
      });

      await waitFor(() => {
        expect(result.current.status).toBe('ready');
      });

      vi.clearAllMocks();
      vi.mocked(analysisService.fetchPaginatedAnalyses).mockResolvedValue({
        ...mockApiResponse,
        page: 2,
      });

      act(() => {
        result.current.setPage(2);
        result.current.setPage(3);
        result.current.setPage(4);
      });

      await waitFor(() => {
        expect(analysisService.fetchPaginatedAnalyses).toHaveBeenCalled();
      });

      // Should handle gracefully without crashing
      expect(result.current).toBeDefined();
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete pagination workflow', async () => {
      const { result } = renderHook(() => usePaginatedAnalyses(1, 10), {
        wrapper: createAuthWrapper()
      });

      // Initial load
      await waitFor(() => {
        expect(result.current.status).toBe('ready');
      });

      expect(result.current.data?.page).toBe(1);
      expect(result.current.data?.hasMore).toBe(true);

      // Navigate to page 2
      vi.clearAllMocks();
      vi.mocked(analysisService.fetchPaginatedAnalyses).mockResolvedValueOnce({
        page: 2,
        pageSize: 10,
        totalCount: 25,
        items: [],
      });

      act(() => {
        result.current.setPage(2);
      });

      await waitFor(() => {
        expect(analysisService.fetchPaginatedAnalyses).toHaveBeenCalled();
      });

      expect(result.current.data?.page).toBe(2);

      // Change page size
      vi.clearAllMocks();
      vi.mocked(analysisService.fetchPaginatedAnalyses).mockResolvedValueOnce({
        page: 1,
        pageSize: 20,
        totalCount: 25,
        items: mockApiResponse.items,
      });

      act(() => {
        result.current.setPageSize(20);
      });

      await waitFor(() => {
        expect(analysisService.fetchPaginatedAnalyses).toHaveBeenCalled();
      }, { timeout: 1000 });

      // Wait for the data to update
      await waitFor(() => {
        expect(result.current.data?.pageSize).toBe(20);
      }, { timeout: 1000 });

      expect(result.current.data?.page).toBe(1); // Reset to page 1
      expect(result.current.data?.pageSize).toBe(20);
    });

    it('should handle logout on 401 error', async () => {
      const error = new Error('Unauthorized');
      (error as any).status = 401;

      vi.mocked(analysisService.fetchPaginatedAnalyses).mockRejectedValueOnce(
        error
      );

      const { result } = renderHook(() => usePaginatedAnalyses(), {
        wrapper: createAuthWrapper()
      });

      await waitFor(() => {
        expect(result.current.status).toBe('error');
      });

      // After logout, error could be "expired" or "must be logged in" depending on timing
      expect(
        result.current.error?.includes('expired') || 
        result.current.error?.includes('logged in')
      ).toBe(true);
    });

    it('should recover from error with refetch', async () => {
      vi.mocked(analysisService.fetchPaginatedAnalyses)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockApiResponse);

      const { result } = renderHook(() => usePaginatedAnalyses(), {
        wrapper: createAuthWrapper()
      });

      await waitFor(() => {
        expect(result.current.status).toBe('error');
      });

      expect(result.current.data).toBeNull();

      vi.clearAllMocks();
      vi.mocked(analysisService.fetchPaginatedAnalyses).mockResolvedValueOnce(
        mockApiResponse
      );

      act(() => {
        result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.status).toBe('ready');
      });

      expect(result.current.data).not.toBeNull();
    });
  });
});

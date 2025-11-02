import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import React from 'react';
import { useFeedbackSubmission } from '../../hooks/useFeedbackSubmission';
import { AuthProvider } from '../../state/auth/AuthContext';

// Mock localStorage globally
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

// Create a wrapper that provides AuthContext with a logged-in user
const createAuthWrapper = () => {
  return function AuthWrapper({ children }: { children: ReactNode }) {
    return React.createElement(AuthProvider, { children });
  };
};

describe('useFeedbackSubmission', () => {
  const mockAnalysisId = '123e4567-e89b-12d3-a456-426614174000';

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    localStorage.clear();
    // Set up localStorage with a test token
    localStorage.setItem('pfvauth', JSON.stringify({
      token: 'test-token-123',
      user: { userId: 'test-user-id', email: 'test@example.com' }
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('initialization', () => {
    it('should initialize with idle status', () => {
      const { result } = renderHook(() =>
        useFeedbackSubmission(mockAnalysisId),
        { wrapper: createAuthWrapper() }
      );

      expect(result.current.feedbackState.status).toBe('idle');
      expect(result.current.feedbackState.message).toBeUndefined();
      expect(result.current.feedbackState.lastSubmitted).toBeUndefined();
    });

    it('should have submitFeedback function', () => {
      const { result } = renderHook(() =>
        useFeedbackSubmission(mockAnalysisId),
        { wrapper: createAuthWrapper() }
      );

      expect(typeof result.current.submitFeedback).toBe('function');
    });

    it('should handle undefined analysisId gracefully', async () => {
      const { result } = renderHook(() => useFeedbackSubmission(undefined), {
        wrapper: createAuthWrapper(),
      });

      act(() => {
        result.current.submitFeedback('up');
      });

      await waitFor(() => {
        expect(result.current.feedbackState.status).toBe('error');
      });

      expect(result.current.feedbackState.message).toContain('missing');
    });
  });

  describe('feedback submission - happy path', () => {
    it('should successfully submit positive feedback (201 Created)', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        status: 201,
      } as Response);

      const { result } = renderHook(() =>
        useFeedbackSubmission(mockAnalysisId),
        { wrapper: createAuthWrapper() }
      );

      act(() => {
        result.current.submitFeedback('up');
      });

      await waitFor(() => {
        expect(result.current.feedbackState.status).toBe('success');
      });

      expect(result.current.feedbackState.lastSubmitted).toBe('up');
      expect(result.current.feedbackState.message).toContain('Thank you');
    });

    it('should successfully submit negative feedback (201 Created)', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        status: 201,
      } as Response);

      const { result } = renderHook(() =>
        useFeedbackSubmission(mockAnalysisId),
        { wrapper: createAuthWrapper() }
      );

      act(() => {
        result.current.submitFeedback('down');
      });

      await waitFor(() => {
        expect(result.current.feedbackState.status).toBe('success');
      });

      expect(result.current.feedbackState.lastSubmitted).toBe('down');
    });

    it('should make POST request to correct endpoint', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        status: 201,
      } as Response);

      const { result } = renderHook(() =>
        useFeedbackSubmission(mockAnalysisId),
        { wrapper: createAuthWrapper() }
      );

      act(() => {
        result.current.submitFeedback('up');
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      const callArgs = vi.mocked(global.fetch).mock.calls[0];
      expect(callArgs[0]).toContain(`/analyses/${mockAnalysisId}/feedback`);
      expect(callArgs[1]?.method).toBe('POST');
    });

    it('should include authorization token in headers', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        status: 201,
      } as Response);

      const { result } = renderHook(() =>
        useFeedbackSubmission(mockAnalysisId),
        { wrapper: createAuthWrapper() }
      );

      act(() => {
        result.current.submitFeedback('up');
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      const callArgs = vi.mocked(global.fetch).mock.calls[0];
      expect(callArgs[1]?.headers).toHaveProperty(
        'Authorization',
        'Bearer test-token-123'
      );
    });

    it('should map direction to isPositive boolean', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        status: 201,
      } as Response);

      const { result } = renderHook(() =>
        useFeedbackSubmission(mockAnalysisId),
        { wrapper: createAuthWrapper() }
      );

      act(() => {
        result.current.submitFeedback('up');
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      const callArgs = vi.mocked(global.fetch).mock.calls[0];
      const body = JSON.parse(callArgs[1]?.body as string);

      expect(body.isPositive).toBe(true);
    });

    it('should map down direction to false', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        status: 201,
      } as Response);

      const { result } = renderHook(() =>
        useFeedbackSubmission(mockAnalysisId),
        { wrapper: createAuthWrapper() }
      );

      act(() => {
        result.current.submitFeedback('down');
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      const callArgs = vi.mocked(global.fetch).mock.calls[0];
      const body = JSON.parse(callArgs[1]?.body as string);

      expect(body.isPositive).toBe(false);
    });

    it('should include credentials in request', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        status: 201,
      } as Response);

      const { result } = renderHook(() =>
        useFeedbackSubmission(mockAnalysisId),
        { wrapper: createAuthWrapper() }
      );

      act(() => {
        result.current.submitFeedback('up');
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      const callArgs = vi.mocked(global.fetch).mock.calls[0];
      expect(callArgs[1]?.credentials).toBe('include');
    });
  });

  describe('state machine transitions', () => {
    it('should transition idle → submitting → success', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        status: 201,
      } as Response);

      const { result } = renderHook(() =>
        useFeedbackSubmission(mockAnalysisId),
        { wrapper: createAuthWrapper() }
      );

      expect(result.current.feedbackState.status).toBe('idle');

      act(() => {
        result.current.submitFeedback('up');
      });

      // Should be submitting during the call
      expect(result.current.feedbackState.status).toBe('submitting');

      await waitFor(() => {
        expect(result.current.feedbackState.status).toBe('success');
      });
    });

    it('should transition idle → submitting → error on failure', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        status: 500,
        json: async () => ({ message: 'Server error' }),
      } as unknown as Response);

      const { result } = renderHook(() =>
        useFeedbackSubmission(mockAnalysisId),
        { wrapper: createAuthWrapper() }
      );

      expect(result.current.feedbackState.status).toBe('idle');

      act(() => {
        result.current.submitFeedback('up');
      });

      expect(result.current.feedbackState.status).toBe('submitting');

      await waitFor(() => {
        expect(result.current.feedbackState.status).toBe('error');
      });

      expect(result.current.feedbackState.message).toContain('Server error');
    });
  });

  describe('409 Conflict - duplicate feedback', () => {
    it('should handle 409 Conflict gracefully as success', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        status: 409,
        json: async () => ({}),
      } as unknown as Response);

      const { result } = renderHook(() =>
        useFeedbackSubmission(mockAnalysisId),
        { wrapper: createAuthWrapper() }
      );

      act(() => {
        result.current.submitFeedback('up');
      });

      await waitFor(() => {
        expect(result.current.feedbackState.status).toBe('success');
      });

      expect(result.current.feedbackState.message).toContain('already recorded');
      expect(result.current.feedbackState.lastSubmitted).toBe('up');
    });

    it('should track lastSubmitted even on 409', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        status: 409,
        json: async () => ({}),
      } as unknown as Response);

      const { result } = renderHook(() =>
        useFeedbackSubmission(mockAnalysisId),
        { wrapper: createAuthWrapper() }
      );

      act(() => {
        result.current.submitFeedback('down');
      });

      await waitFor(() => {
        expect(result.current.feedbackState.lastSubmitted).toBe('down');
      });
    });
  });

  describe('error handling - HTTP status codes', () => {
    it('should handle 401 Unauthorized and trigger logout', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      } as unknown as Response);

      const { result } = renderHook(() =>
        useFeedbackSubmission(mockAnalysisId),
        { wrapper: createAuthWrapper() }
      );

      act(() => {
        result.current.submitFeedback('up');
      });

      await waitFor(() => {
        expect(result.current.feedbackState.status).toBe('error');
      });

      expect(result.current.feedbackState.message).toContain('expired');
    });

    it('should handle 404 Not Found', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        status: 404,
        json: async () => ({ message: 'Analysis not found' }),
      } as unknown as Response);

      const { result } = renderHook(() =>
        useFeedbackSubmission(mockAnalysisId),
        { wrapper: createAuthWrapper() }
      );

      act(() => {
        result.current.submitFeedback('up');
      });

      await waitFor(() => {
        expect(result.current.feedbackState.status).toBe('error');
      });

      expect(result.current.feedbackState.message).toContain('not found');
    });

    it('should handle 500 Server Error', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        status: 500,
        json: async () => ({ message: 'Server error' }),
      } as unknown as Response);

      const { result } = renderHook(() =>
        useFeedbackSubmission(mockAnalysisId),
        { wrapper: createAuthWrapper() }
      );

      act(() => {
        result.current.submitFeedback('up');
      });

      await waitFor(() => {
        expect(result.current.feedbackState.status).toBe('error');
      });

      expect(result.current.feedbackState.message).toContain('Server error');
    });
  });

  describe('error message parsing', () => {
    it('should use custom error message from response', async () => {
      const customMessage = 'Custom error message from server';

      vi.mocked(global.fetch).mockResolvedValueOnce({
        status: 400,
        json: async () => ({ message: customMessage }),
      } as unknown as Response);

      const { result } = renderHook(() =>
        useFeedbackSubmission(mockAnalysisId),
        { wrapper: createAuthWrapper() }
      );

      act(() => {
        result.current.submitFeedback('up');
      });

      await waitFor(() => {
        expect(result.current.feedbackState.message).toBe(customMessage);
      });
    });

    it('should handle error response without message', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        status: 400,
        json: async () => ({}),
      } as unknown as Response);

      const { result } = renderHook(() =>
        useFeedbackSubmission(mockAnalysisId),
        { wrapper: createAuthWrapper() }
      );

      act(() => {
        result.current.submitFeedback('up');
      });

      await waitFor(() => {
        expect(result.current.feedbackState.status).toBe('error');
      });

      expect(result.current.feedbackState.message).toContain('Unable to submit');
    });

    it('should handle unparseable JSON in error response', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        status: 400,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      } as unknown as Response);

      const { result } = renderHook(() =>
        useFeedbackSubmission(mockAnalysisId),
        { wrapper: createAuthWrapper() }
      );

      act(() => {
        result.current.submitFeedback('up');
      });

      await waitFor(() => {
        expect(result.current.feedbackState.status).toBe('error');
      });

      expect(result.current.feedbackState.message).toContain('Unable to submit');
    });
  });

  describe('double submission prevention', () => {
    it('should prevent double submission while submitting', async () => {
      let _resolveFirstFetch: any;
      const firstFetchPromise = new Promise<Response>((resolve) => {
        _resolveFirstFetch = resolve;
      });

      vi.mocked(global.fetch).mockImplementation(
        () => firstFetchPromise as Promise<Response>
      );

      const { result } = renderHook(() =>
        useFeedbackSubmission(mockAnalysisId),
        { wrapper: createAuthWrapper() }
      );

      // First submission
      act(() => {
        result.current.submitFeedback('up');
      });

      expect(result.current.feedbackState.status).toBe('submitting');

      // Try second submission while first is pending
      act(() => {
        result.current.submitFeedback('down');
      });

      // Should still be submitting (not double submitted)
      expect(result.current.feedbackState.status).toBe('submitting');
      expect(result.current.feedbackState.lastSubmitted).toBe('up'); // First one

      // Complete first submission
      act(() => {
        _resolveFirstFetch({
          status: 201,
          json: async () => ({}),
        });
      });

      await waitFor(() => {
        expect(result.current.feedbackState.status).toBe('success');
      });

      // Verify only one fetch was made
      expect(vi.mocked(global.fetch).mock.calls.length).toBe(1);
    });

    it('should allow new submission after first completes', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        status: 201,
      } as Response);

      const { result } = renderHook(() =>
        useFeedbackSubmission(mockAnalysisId),
        { wrapper: createAuthWrapper() }
      );

      // First submission
      act(() => {
        result.current.submitFeedback('up');
      });

      await waitFor(() => {
        expect(result.current.feedbackState.status).toBe('success');
      });

      vi.clearAllMocks();
      vi.mocked(global.fetch).mockResolvedValueOnce({
        status: 201,
      } as Response);

      // Second submission after first completes
      act(() => {
        result.current.submitFeedback('down');
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      expect(vi.mocked(global.fetch).mock.calls.length).toBe(1);
    });
  });

  describe('network error handling', () => {
    it('should handle fetch network errors', async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() =>
        useFeedbackSubmission(mockAnalysisId),
        { wrapper: createAuthWrapper() }
      );

      act(() => {
        result.current.submitFeedback('up');
      });

      await waitFor(() => {
        expect(result.current.feedbackState.status).toBe('error');
      });

      expect(result.current.feedbackState.message).toContain('Network error');
    });
  });

  describe('lastSubmitted tracking', () => {
    it('should track successful feedback direction', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        status: 201,
      } as Response);

      const { result } = renderHook(() =>
        useFeedbackSubmission(mockAnalysisId),
        { wrapper: createAuthWrapper() }
      );

      expect(result.current.feedbackState.lastSubmitted).toBeUndefined();

      act(() => {
        result.current.submitFeedback('up');
      });

      await waitFor(() => {
        expect(result.current.feedbackState.lastSubmitted).toBe('up');
      });
    });

    it('should track 409 conflict with lastSubmitted', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        status: 409,
      } as Response);

      const { result } = renderHook(() =>
        useFeedbackSubmission(mockAnalysisId),
        { wrapper: createAuthWrapper() }
      );

      act(() => {
        result.current.submitFeedback('down');
      });

      await waitFor(() => {
        expect(result.current.feedbackState.lastSubmitted).toBe('down');
      });
    });

    it('should update lastSubmitted on submitting state', () => {
      vi.mocked(global.fetch).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const { result } = renderHook(() =>
        useFeedbackSubmission(mockAnalysisId),
        { wrapper: createAuthWrapper() }
      );

      act(() => {
        result.current.submitFeedback('up');
      });

      // lastSubmitted should be set during submitting state
      expect(result.current.feedbackState.lastSubmitted).toBe('up');
    });
  });

  describe('edge cases', () => {
    it('should handle very long analysis IDs', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        status: 201,
      } as Response);

      const longId = 'a'.repeat(500);
      const { result } = renderHook(() => useFeedbackSubmission(longId), {
        wrapper: createAuthWrapper(),
      });

      act(() => {
        result.current.submitFeedback('up');
      });

      await waitFor(() => {
        expect(result.current.feedbackState.status).toBe('success');
      });
    });

    it('should handle special characters in analysis ID', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        status: 201,
      } as Response);

      const specialId = 'test-id@#$%^&*()';
      const { result } = renderHook(() => useFeedbackSubmission(specialId), {
        wrapper: createAuthWrapper(),
      });

      act(() => {
        result.current.submitFeedback('up');
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      const callArgs = vi.mocked(global.fetch).mock.calls[0];
      expect(callArgs[0]).toContain(specialId);
    });

    it('should handle rapid direction changes after success', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        status: 201,
      } as Response);

      const { result } = renderHook(() =>
        useFeedbackSubmission(mockAnalysisId),
        { wrapper: createAuthWrapper() }
      );

      // First feedback
      act(() => {
        result.current.submitFeedback('up');
      });

      await waitFor(() => {
        expect(result.current.feedbackState.status).toBe('success');
      });

      // Try to submit again immediately
      vi.clearAllMocks();
      vi.mocked(global.fetch).mockResolvedValueOnce({
        status: 201,
      } as Response);

      act(() => {
        result.current.submitFeedback('down');
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
        expect(result.current.feedbackState.status).toBe('success');
      });
    });

    it('should handle multiple rapid feedback submissions (should be throttled)', async () => {
      const firstFetchPromise = new Promise<Response>((_resolve) => {
        // Never resolve - testing throttling behavior
      });

      vi.mocked(global.fetch).mockImplementation(
        () => firstFetchPromise as Promise<Response>
      );

      const { result } = renderHook(() =>
        useFeedbackSubmission(mockAnalysisId),
        { wrapper: createAuthWrapper() }
      );

      // First submission
      act(() => {
        result.current.submitFeedback('up');
      });

      // Should only submit once
      expect(result.current.feedbackState.status).toBe('submitting');
      expect(result.current.feedbackState.lastSubmitted).toBe('up');
      expect(vi.mocked(global.fetch).mock.calls.length).toBe(1);
    });

    it('should handle analysis ID changes', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        status: 201,
      } as Response);

      const { result, rerender } = renderHook(
        ({ id }) => useFeedbackSubmission(id),
        {
          initialProps: { id: mockAnalysisId },
          wrapper: createAuthWrapper(),
        }
      );

      act(() => {
        result.current.submitFeedback('up');
      });

      await waitFor(() => {
        expect(result.current.feedbackState.status).toBe('success');
      });

      vi.clearAllMocks();
      vi.mocked(global.fetch).mockResolvedValueOnce({
        status: 201,
      } as Response);

      // Change the analysis ID
      rerender({ id: 'new-analysis-id' });

      act(() => {
        result.current.submitFeedback('down');
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      const callArgs = vi.mocked(global.fetch).mock.calls[0];
      expect(callArgs[0]).toContain('new-analysis-id');
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete feedback submission workflow', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        status: 201,
      } as Response);

      const { result } = renderHook(() =>
        useFeedbackSubmission(mockAnalysisId),
        { wrapper: createAuthWrapper() }
      );

      act(() => {
        result.current.submitFeedback('up');
      });

      // Should be submitting
      expect(result.current.feedbackState.status).toBe('submitting');
      expect(result.current.feedbackState.lastSubmitted).toBe('up');

      await waitFor(() => {
        expect(result.current.feedbackState.status).toBe('success');
      });

      expect(result.current.feedbackState.message).toContain('Thank you');
    });

    it('should handle error recovery', async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() =>
        useFeedbackSubmission(mockAnalysisId),
        { wrapper: createAuthWrapper() }
      );

      act(() => {
        result.current.submitFeedback('up');
      });

      await waitFor(() => {
        expect(result.current.feedbackState.status).toBe('error');
      });

      expect(result.current.feedbackState.message).toContain('Network');

      // Retry succeeds
      vi.clearAllMocks();
      vi.mocked(global.fetch).mockResolvedValueOnce({
        status: 201,
      } as Response);

      act(() => {
        result.current.submitFeedback('up');
      });

      await waitFor(() => {
        expect(result.current.feedbackState.status).toBe('success');
      });
    });

    it('should handle 401 logout flow', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        status: 401,
      } as Response);

      const { result } = renderHook(() =>
        useFeedbackSubmission(mockAnalysisId),
        { wrapper: createAuthWrapper() }
      );

      act(() => {
        result.current.submitFeedback('up');
      });

      await waitFor(() => {
        expect(result.current.feedbackState.status).toBe('error');
      });

      expect(result.current.feedbackState.message).toContain('session has expired');
    });

    it('should handle duplicate submission (409) without error', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        status: 409,
      } as Response);

      const { result } = renderHook(() =>
        useFeedbackSubmission(mockAnalysisId),
        { wrapper: createAuthWrapper() }
      );

      act(() => {
        result.current.submitFeedback('up');
      });

      await waitFor(() => {
        expect(result.current.feedbackState.status).toBe('success');
      });

      expect(result.current.feedbackState.message).toContain('already recorded');
    });
  });
});

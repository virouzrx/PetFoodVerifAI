import { useState, useCallback } from 'react';
import { useAuth } from '../state/auth/AuthContext';
import type {
  FeedbackState,
  FeedbackDirection,
  FeedbackRequestDto,
  UseFeedbackSubmissionResult,
} from '../types/results';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5135/api';

/**
 * Custom hook to manage feedback submission for an analysis
 * @param analysisId - The UUID of the analysis to submit feedback for
 * @returns Object containing feedbackState and submitFeedback function
 */
export const useFeedbackSubmission = (
  analysisId: string | undefined
): UseFeedbackSubmissionResult => {
  const { state: authState, logout } = useAuth();
  const [feedbackState, setFeedbackState] = useState<FeedbackState>({
    status: 'idle',
  });

  const submitFeedback = useCallback(
    async (direction: FeedbackDirection) => {
      // Ensure analysisId is defined
      if (!analysisId) {
        setFeedbackState({
          status: 'error',
          message: 'Unable to submit feedback: Analysis ID is missing.',
        });
        return;
      }

      // Ensure user is authenticated
      if (!authState.token) {
        setFeedbackState({
          status: 'error',
          message: 'You must be logged in to submit feedback.',
        });
        return;
      }

      // Prevent double submission while pending
      if (feedbackState.status === 'submitting') {
        return;
      }

      // Map direction to boolean
      const isPositive = direction === 'up';

      setFeedbackState({
        status: 'submitting',
        lastSubmitted: direction,
      });

      try {
        const payload: FeedbackRequestDto = { isPositive };

        const response = await fetch(
          `${API_BASE_URL}/analyses/${analysisId}/feedback`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authState.token}`,
            },
            credentials: 'include',
            body: JSON.stringify(payload),
          }
        );

        // Handle success (201 Created)
        if (response.status === 201) {
          setFeedbackState({
            status: 'success',
            lastSubmitted: direction,
            message: 'Thank you for your feedback!',
          });
          return;
        }

        // Handle 409 Conflict - feedback already submitted
        if (response.status === 409) {
          setFeedbackState({
            status: 'success',
            lastSubmitted: direction,
            message: 'Feedback already recorded for this analysis.',
          });
          return;
        }

        // Handle 401 Unauthorized - trigger logout
        if (response.status === 401) {
          logout();
          setFeedbackState({
            status: 'error',
            message: 'Your session has expired. Please log in again.',
          });
          return;
        }

        // Handle 404 Not Found
        if (response.status === 404) {
          setFeedbackState({
            status: 'error',
            message: 'Analysis not found. Unable to submit feedback.',
          });
          return;
        }

        // Handle other error responses
        let errorMessage = 'Unable to submit feedback. Please try again.';
        try {
          const errorBody = await response.json();
          if (errorBody?.message) {
            errorMessage = errorBody.message;
          }
        } catch {
          // Unable to parse error body, use default message
        }

        setFeedbackState({
          status: 'error',
          message: errorMessage,
        });
      } catch (err: any) {
        console.error('Failed to submit feedback:', err);
        setFeedbackState({
          status: 'error',
          message:
            'Network error. Please check your connection and try again.',
        });
      }
    },
    [analysisId, authState.token, feedbackState.status, logout]
  );

  return {
    feedbackState,
    submitFeedback,
  };
};


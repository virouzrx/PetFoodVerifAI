import type { FeedbackState, FeedbackDirection } from '../../../types/results';
import FeedbackButtons from './FeedbackButtons';

type FeedbackSectionProps = {
  feedbackState: FeedbackState;
  onSubmitFeedback: (direction: FeedbackDirection) => Promise<void>;
};

/**
 * FeedbackSection Component
 * 
 * Purpose: Groups feedback heading, helper text, buttons, and status messages
 * 
 * Features:
 * - Section heading and descriptive text
 * - FeedbackButtons component integration
 * - Success/error message display with aria-live announcements
 * - Conditional rendering based on feedback status
 * - Accessible structure with proper labeling
 */
const FeedbackSection = ({
  feedbackState,
  onSubmitFeedback,
}: FeedbackSectionProps) => {
  const { status, message } = feedbackState;

  const showStatusMessage = status === 'success' || status === 'error';

  return (
    <section
      className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      aria-labelledby="feedback-heading"
    >
      {/* Heading */}
      <h2
        id="feedback-heading"
        className="text-lg font-semibold text-slate-900 mb-2"
      >
        Was this analysis helpful?
      </h2>

      {/* Description */}
      <p className="text-sm text-slate-600 mb-4">
        Your feedback helps us improve our recommendations and better serve the
        pet community.
      </p>

      {/* Feedback Buttons */}
      <FeedbackButtons
        feedbackState={feedbackState}
        onSubmit={onSubmitFeedback}
      />

      {/* Status Message */}
      {showStatusMessage && message && (
        <div
          className="mt-4"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {status === 'success' ? (
            <div className="rounded-md bg-green-50 border border-green-200 p-3">
              <div className="flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-green-600 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm font-medium text-green-800">{message}</p>
              </div>
            </div>
          ) : (
            <div className="rounded-md bg-red-50 border border-red-200 p-3">
              <div className="flex items-start gap-2">
                <svg
                  className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">{message}</p>
                  {status === 'error' && (
                    <button
                      type="button"
                      onClick={() => {
                        // User can try again by clicking the feedback buttons
                      }}
                      className="mt-2 text-sm font-medium text-red-700 hover:text-red-900 underline"
                    >
                      Please try again
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default FeedbackSection;


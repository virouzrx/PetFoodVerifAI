import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../../state/auth/AuthContext';
import { fetchAnalysisDetail } from '../../../services/analysisService';
import type { ReanalyzeNavigationPayload } from '../../../types/products';

type ReanalyzeButtonProps = {
  payload: ReanalyzeNavigationPayload;
  onClick?: (payload: ReanalyzeNavigationPayload) => void;
  variant?: 'primary' | 'secondary';
  size?: 'small' | 'medium';
  className?: string;
};

/**
 * ReanalyzeButton Component
 * 
 * Purpose: Action button forwarding user to analysis form with prefilled context.
 * Can appear in list items and drawer entries.
 * 
 * Features:
 * - Navigates to /analyze with state payload
 * - Shows spinner while navigation pending
 * - Validates payload completeness
 * - Keyboard accessible
 * - Multiple size and variant options
 */
const ReanalyzeButton = ({
  payload,
  onClick,
  variant = 'primary',
  size = 'medium',
  className = '',
}: ReanalyzeButtonProps) => {
  const navigate = useNavigate();
  const { state: authState } = useAuth();
  const [isNavigating, setIsNavigating] = useState(false);

  // Check if product is manual entry (from backend data)
  const isManualEntry = payload.isManualEntry ?? false; // Use explicit flag from backend

  // Don't render button for manual entries
  if (isManualEntry) {
    return null;
  }

  // Validate payload has required fields
  const isValid = !!(
    payload.analysisId &&
    payload.productName &&
    payload.productUrl // NEW: require URL for re-analysis
  );

  const handleClick = async () => {
    if (!isValid || isNavigating || !authState.token) return;

    setIsNavigating(true);

    // Call optional custom handler
    if (onClick) {
      onClick(payload);
    }

    try {
      // If payload is missing URL or other details, fetch full analysis
      if (!payload.productUrl || !payload.species) {
        const analysisDetails = await fetchAnalysisDetail(
          payload.analysisId,
          authState.token
        );

        // Navigate with full details from API
        navigate('/analyze', {
          state: {
            fromReanalysis: true,
            analysisId: analysisDetails.analysisId,
            productName: analysisDetails.productName,
            productUrl: analysisDetails.productUrl || '',
            species: analysisDetails.species || '',
            breed: analysisDetails.breed || '',
            age: analysisDetails.age || '',
            additionalInfo: analysisDetails.additionalInfo || '',
          },
        });
      } else {
        // Navigate with payload data
        navigate('/analyze', {
          state: {
            fromReanalysis: true,
            analysisId: payload.analysisId,
            productName: payload.productName,
            productUrl: payload.productUrl || '',
            species: payload.species || '',
            breed: payload.breed || '',
            age: payload.age || '',
            additionalInfo: payload.additionalInfo || '',
          },
        });
      }
    } catch (error) {
      console.error('Failed to fetch analysis details:', error);
      setIsNavigating(false);
      // Could show a toast/error message here
    }
  };

  // Variant styles
  const variantStyles = {
    primary: isValid
      ? 'bg-brand-primary text-white hover:bg-brand-primary/90 border border-brand-primary focus:ring-brand-primary'
      : 'bg-gray-100 text-gray-400 border border-gray-300 cursor-not-allowed',
    secondary: isValid
      ? 'bg-white text-brand-primary hover:bg-brand-primary hover:text-white border border-brand-primary focus:ring-brand-primary'
      : 'bg-gray-100 text-gray-400 border border-gray-300 cursor-not-allowed',
  };

  // Size styles
  const sizeStyles = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-sm',
  };

  const baseStyles = 'inline-flex items-center gap-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!isValid || isNavigating}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      aria-label={
        isValid
          ? `Re-analyze ${payload.productName}`
          : 'Re-analyze unavailable due to missing data'
      }
      title={
        isValid
          ? `Re-analyze ${payload.productName}`
          : 'Missing required data for re-analysis'
      }
    >
      {/* Icon or spinner */}
      {isNavigating ? (
        <svg
          className="h-4 w-4 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
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
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      )}
      <span>Re-analyze</span>
    </button>
  );
};

export default ReanalyzeButton;


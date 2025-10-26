import { useNavigate } from 'react-router-dom';

type EmptyStateProps = {
  onAnalyzeNow?: () => void;
};

/**
 * EmptyState Component
 * 
 * Purpose: Rendered when no analyses exist; encourages user to analyze first product.
 * 
 * Features:
 * - Friendly illustration and message
 * - Clear call-to-action button
 * - Accessible focus order
 */
const EmptyState = ({ onAnalyzeNow }: EmptyStateProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onAnalyzeNow) {
      onAnalyzeNow();
    } else {
      navigate('/analyze');
    }
  };

  return (
    <div className="bg-brand-secondary border-2 border-brand-accent rounded-lg shadow-md p-8 sm:p-12 text-center">
      {/* Icon */}
      <div className="flex justify-center mb-6">
        <svg
          className="h-24 w-24 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>

      {/* Heading */}
      <h2 className="text-2xl font-bold text-brand-dark mb-3">
        No Products Yet
      </h2>

      {/* Message */}
      <p className="text-base text-gray-600 mb-6 max-w-md mx-auto">
        You haven't analyzed any pet food products yet. Start by analyzing your first product to see it appear here.
      </p>

      {/* CTA Button */}
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center gap-2 rounded-md bg-brand-primary px-6 py-3 text-base font-medium text-white hover:bg-brand-primary/90 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 shadow-sm transition-colors"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
        <span>Analyze Your First Product</span>
      </button>
    </div>
  );
};

export default EmptyState;


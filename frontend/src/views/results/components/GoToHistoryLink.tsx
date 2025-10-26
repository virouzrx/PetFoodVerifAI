import { Link } from 'react-router-dom';

type GoToHistoryLinkProps = {
  productId: string;
};

/**
 * GoToHistoryLink Component
 * 
 * Purpose: CTA button linking to the history view filtered by the current product
 * 
 * Features:
 * - Styled as a button for visual prominence
 * - Uses React Router Link for client-side navigation
 * - Includes query parameter to filter history by product
 * - Icon for visual clarity
 * - Hidden/disabled if productId is missing
 */
const GoToHistoryLink = ({ productId }: GoToHistoryLinkProps) => {
  // Don't render if productId is missing
  if (!productId) {
    return null;
  }

  return (
    <Link
      to={`/history?productId=${productId}`}
      className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
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
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span>View History for this Product</span>
    </Link>
  );
};

export default GoToHistoryLink;


import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../../state/auth/AuthContext';
import { useAnalysisDetail } from '../../hooks/useAnalysisDetail';
import { useFeedbackSubmission } from '../../hooks/useFeedbackSubmission';
import ResultStatusPanel from './components/ResultStatusPanel';
import ResultsContent from './components/ResultsContent';

/**
 * ResultsViewPage Component
 * 
 * Purpose: Orchestrates routing, data fetching, error handling, and layout for the
 * analysis results page.
 * 
 * Features:
 * - Extracts analysisId from route params
 * - Fetches analysis data via useAnalysisDetail hook
 * - Manages feedback submission via useFeedbackSubmission hook
 * - Renders loading, error, not found, and success states
 * - Navigates to /404 when analysis is not found
 * - Provides navigation actions (reanalyze, go to history)
 * - Integrates with authentication context
 */
const ResultsViewPage = () => {
  const { analysisId } = useParams<{ analysisId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  // Fetch analysis data
  const { status, data, error, refetch } = useAnalysisDetail(analysisId);

  // Navigate to 404 page when analysis is not found
  useEffect(() => {
    if (status === 'notFound') {
      navigate('/404', {
        replace: true,
        state: {
          from: location.pathname,
          reason: 'analysis-missing',
        },
      });
    }
  }, [status, navigate, location.pathname]);

  // Feedback submission
  const { feedbackState, submitFeedback } = useFeedbackSubmission(analysisId);

  // Handle reanalyze action
  const handleReanalyze = () => {
    if (!data) return;

    // Navigate to analyze page with prefilled state
    navigate('/analyze', {
      state: {
        productName: data.productName,
        productUrl: data.productUrl || '',
        species: data.species,
        breed: data.breed || '',
        age: data.age || '',
        additionalInfo: data.additionalInfo || '',
        ingredientsText: data.ingredientsText || '',
      },
    });
  };

  // If not authenticated, redirect is handled by parent ProtectedRoute
  // But we can add extra guard here if needed
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen">
      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            Analysis Results
          </h1>
          <p className="mt-2 text-base text-white">
            Review your pet food analysis and recommendation
          </p>
        </div>

        {/* Status Panel - handles loading, error, and not found states */}
        {status !== 'ready' && (
          <ResultStatusPanel status={status} error={error} onRetry={refetch} />
        )}

        {/* Results Content - displays when data is ready */}
        {status === 'ready' && data && (
          <ResultsContent
            analysis={data}
            feedbackState={feedbackState}
            onSubmitFeedback={submitFeedback}
            onReanalyze={handleReanalyze}
          />
        )}
      </main>
    </div>
  );
};

export default ResultsViewPage;


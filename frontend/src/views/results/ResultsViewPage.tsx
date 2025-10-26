import { useParams, useNavigate } from 'react-router-dom';
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
 * - Provides navigation actions (reanalyze, go to history)
 * - Integrates with authentication context
 */
const ResultsViewPage = () => {
  const { analysisId } = useParams<{ analysisId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Fetch analysis data
  const { status, data, error, refetch } = useAnalysisDetail(analysisId);

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
      {/* Header */}
      <header className="border-b-2 border-brand-accent bg-brand-secondary shadow-md">
        <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-brand-dark">
            Analysis Results
          </h1>
          <p className="mt-1 text-sm text-gray-700">
            Review your pet food analysis and recommendation
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
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


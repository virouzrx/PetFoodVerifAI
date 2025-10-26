import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../state/auth/AuthContext';
import InlineHelp from './components/InlineHelp';
import AnalyzeForm from './components/AnalyzeForm';
import GlobalAlert from '../components/GlobalAlert';
import { createAnalysis } from '../../services/analysisService';
import type {
  AnalyzeFormValues,
  SubmitStatus,
  ApiErrorShape,
  CreateAnalysisRequest,
  ScrapeState,
} from '../../types/analyze';
import { speciesStringToEnum } from '../../types/analyze';

/**
 * AnalyzePage Component
 * 
 * Purpose: Layout shell that wires authentication guard, orchestrates form submission,
 * and handles navigation after success.
 * 
 * Features:
 * - Responsive container layout
 * - Global alert/toast for error messages
 * - aria-live status announcements
 * - Navigation to results page on successful analysis
 * - Authentication integration
 */
const AnalyzePage = () => {
  const navigate = useNavigate();
  const { state: authState } = useAuth();
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('idle');
  const [apiError, setApiError] = useState<ApiErrorShape | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [scrapeState, setScrapeState] = useState<ScrapeState>('idle');

  const handleSubmit = useCallback(
    async (formValues: AnalyzeFormValues) => {
      // Clear previous errors and set scraping state
      setApiError(null);
      setSubmitStatus('submitting');
      
      // Determine if we're scraping or submitting with manual ingredients
      if (!formValues.hasManualIngredients) {
        setScrapeState('scraping');
        setStatusMessage('Attempting to retrieve ingredients from product page...');
      } else {
        setScrapeState('submitting');
        setStatusMessage('Submitting your analysis request...');
      }

      try {
        // Build the API request payload
        const payload: CreateAnalysisRequest = {
          productName: formValues.productName.trim(),
          productUrl: formValues.productUrl.trim(),
          species: speciesStringToEnum(formValues.species as 'Cat' | 'Dog'),
          breed: formValues.breed.trim(),
          age: formValues.age as number,
          additionalInfo: formValues.additionalInfo.trim() || null,
          ingredientsText:
            formValues.hasManualIngredients
              ? formValues.noIngredientsAvailable
                ? ''
                : formValues.ingredientsText.trim()
              : null,
        };

        // Call the API
        const response = await createAnalysis(payload, authState.token!);

        // Success
        setSubmitStatus('succeeded');
        setScrapeState('idle');
        setStatusMessage('Analysis completed successfully. Redirecting...');

        // Navigate to results page
        setTimeout(() => {
          navigate(`/results/${response.analysisId}`);
        }, 500);
      } catch (error) {
        setSubmitStatus('failed');
        
        if (error && typeof error === 'object' && 'status' in error) {
          const apiError = error as ApiErrorShape;
          setApiError(apiError);

          // Handle specific error cases
          if (apiError.status === 401) {
            setScrapeState('idle');
            setStatusMessage('Your session has expired. Please log in again.');
            setTimeout(() => {
              navigate('/login');
            }, 2000);
          } else if (apiError.status === 503) {
            // Service unavailable - likely scraping failed, offer manual entry
            setScrapeState('awaitingManual');
            setStatusMessage('Unable to automatically retrieve ingredients. Please use manual entry.');
          } else if (apiError.status === 400) {
            // Validation error - reset states so user can correct
            setScrapeState('idle');
            setStatusMessage('Please correct the validation errors and try again.');
          } else {
            // Other errors - reset state
            setScrapeState('idle');
            setStatusMessage('Analysis submission failed.');
          }
        } else {
          setScrapeState('idle');
          setStatusMessage('An unexpected error occurred. Please try again.');
          setApiError({
            status: 500,
            message: 'An unexpected error occurred. Please try again.',
          });
        }
      }
    },
    [authState.token, navigate],
  );

  const handleDismissError = useCallback(() => {
    setApiError(null);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-slate-900">
            Analyze Pet Food Product
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Enter product details to get a personalized recommendation for your pet
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Status announcements for screen readers */}
        <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {statusMessage}
        </div>

        {/* Global Error Alert */}
        {apiError && (
          <div className="mb-6">
            <GlobalAlert
              variant="error"
              message={apiError.message}
              onDismiss={handleDismissError}
            />
            {apiError.details && (
              <p className="mt-2 text-sm text-slate-600">{apiError.details}</p>
            )}
          </div>
        )}

        {/* Inline Help Section */}
        <InlineHelp className="mb-6" />

        {/* Analysis Form */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <AnalyzeForm
            onSubmit={handleSubmit}
            submissionStatus={submitStatus}
            scrapeStateFromParent={scrapeState}
            apiErrors={apiError?.errors}
          />
        </div>
      </main>
    </div>
  );
};

export default AnalyzePage;


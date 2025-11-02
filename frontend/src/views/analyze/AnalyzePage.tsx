import { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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

type AnalyzeNavigationState = {
  fromReanalysis?: boolean;
  productName?: string;
  productUrl?: string;
  species?: AnalyzeFormValues['species'];
  breed?: string;
  age?: AnalyzeFormValues['age'];
  additionalInfo?: string;
};

const isAnalyzeNavigationState = (value: unknown): value is AnalyzeNavigationState => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;

  const optionalString = (key: keyof AnalyzeNavigationState) =>
    record[key] === undefined || typeof record[key] === 'string';

  const speciesValid =
    record.species === undefined ||
    record.species === '' ||
    record.species === 'Cat' ||
    record.species === 'Dog';

  const ageValue = record.age;
  const ageValid =
    ageValue === undefined ||
    typeof ageValue === 'number' ||
    ageValue === '';

  const fromReanalysisValid =
    record.fromReanalysis === undefined || typeof record.fromReanalysis === 'boolean';

  return (
    fromReanalysisValid &&
    optionalString('productName') &&
    optionalString('productUrl') &&
    optionalString('breed') &&
    optionalString('additionalInfo') &&
    speciesValid &&
    ageValid
  );
};

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
  const location = useLocation();
  const { state: authState } = useAuth();
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('idle');
  const [apiError, setApiError] = useState<ApiErrorShape | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [scrapeState, setScrapeState] = useState<ScrapeState>('idle');

  // Check if this is a reanalysis (from My Products view)
  const navigationState = isAnalyzeNavigationState(location.state)
    ? location.state
    : null;
  const isReanalysis = navigationState?.fromReanalysis === true;
  
  // Prepare initial values and locked fields for reanalysis
  const initialValues = isReanalysis ? {
    productName: navigationState?.productName || '',
    productUrl: navigationState?.productUrl || '',
    species: navigationState?.species || '',
    breed: navigationState?.breed || '',
    age: navigationState?.age || '',
    additionalInfo: navigationState?.additionalInfo || '',
  } : undefined;
  
  const lockedFields: ('productName' | 'productUrl')[] = isReanalysis ? ['productName', 'productUrl'] : [];

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
    <div className="min-h-screen">
      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            {isReanalysis ? 'Re-analyze Pet Food Product' : 'Analyze Pet Food Product'}
          </h1>
          <p className="mt-2 text-base text-white">
            {isReanalysis 
              ? 'Update your pet details or ingredient information for a fresh analysis'
              : 'Enter product details to get a personalized recommendation for your pet'
            }
          </p>
        </div>

        {/* Reanalysis notice */}
        {isReanalysis && (
          <div className="mb-6 bg-brand-secondary/80 border-l-4 border-brand-accent rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg
                className="h-5 w-5 text-brand-primary flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm text-brand-dark">
                <strong>Re-analysis Mode:</strong> Product name and URL are locked to ensure you're analyzing the same product. You can update your pet's details or ingredient information below.
              </p>
            </div>
          </div>
        )}

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
              <p className="mt-2 text-sm text-brand-dark">{apiError.details}</p>
            )}
          </div>
        )}

        {/* Inline Help Section */}
        <InlineHelp className="mb-6" />

        {/* Analysis Form */}
        <div className="rounded-lg border-2 border-brand-accent bg-brand-secondary p-6 shadow-md">
          <AnalyzeForm
            onSubmit={handleSubmit}
            submissionStatus={submitStatus}
            scrapeStateFromParent={scrapeState}
            apiErrors={apiError?.errors}
            initialValues={initialValues}
            lockedFields={lockedFields}
          />
        </div>
      </main>
    </div>
  );
};

export default AnalyzePage;


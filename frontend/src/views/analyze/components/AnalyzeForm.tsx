import { useCallback, useMemo } from 'react';
import type { AnalyzeFormValues, SubmitStatus } from '../../../types/analyze';
import { useAnalyzeForm } from '../hooks/useAnalyzeForm';
import ProductNameInput from './ProductNameInput';
import ProductUrlInput from './ProductUrlInput';
import SpeciesRadioGroup from './SpeciesRadioGroup';
import BreedTextInput from './BreedTextInput';
import AgeNumberInput from './AgeNumberInput';
import AdditionalInfoTextarea from './AdditionalInfoTextarea';
import ScrapeStatus from './ScrapeStatus';
import ManualIngredientsTextarea from './ManualIngredientsTextarea';
import FormValidationSummary from './FormValidationSummary';
import SubmitAnalysisButton from './SubmitAnalysisButton';
import InputModeSelector from './InputModeSelector';

import type { ScrapeState } from '../../../types/analyze';

type AnalyzeFormProps = {
  onSubmit: (formValues: AnalyzeFormValues) => void;
  submissionStatus: SubmitStatus;
  scrapeStateFromParent?: ScrapeState;
  apiErrors?: Record<string, string[]>;
  initialValues?: Partial<AnalyzeFormValues>;
  lockedFields?: ('productName' | 'productUrl')[];
};

/**
 * AnalyzeForm Component
 * 
 * Purpose: Collect all form inputs, expose manual fallback controls, 
 * and surface validation errors inline and in summary.
 * 
 * Features:
 * - Full form validation with accessible error handling
 * - Manual ingredient entry fallback
 * - Scraping status display
 * - Grid layout for inputs
 */
const AnalyzeForm = ({ onSubmit, submissionStatus, scrapeStateFromParent, apiErrors, initialValues, lockedFields = [] }: AnalyzeFormProps) => {
  const {
    formValues,
    formErrors,
    scrapeState: localScrapeState,
    showValidationSummary,
    manualIngredientsState,
    updateField,
    handleBlur,
    validateForm,
    enableManualIngredients,
    resetManualIngredients,
    updateManualIngredients,
    setScrapeState,
    setInputMode,
  } = useAnalyzeForm(initialValues);

  // Use parent scrape state if provided (for API-driven state changes)
  const scrapeState = scrapeStateFromParent || localScrapeState;

  // Map API errors to form errors when they arrive
  const mergedErrors = useMemo(() => {
    const combined = { ...formErrors };

    if (apiErrors) {
      Object.entries(apiErrors).forEach(([field, messages]) => {
        const fieldKey = field.charAt(0).toLowerCase() + field.slice(1);
        if (messages && messages.length > 0) {
          combined[fieldKey as keyof typeof combined] = messages[0];
        }
      });
    }

    return combined;
  }, [apiErrors, formErrors]);

  const handleFormSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      // Validate the form first
      if (!validateForm()) {
        // Focus first error field
        const firstErrorField = Object.keys(mergedErrors)[0];
        if (firstErrorField) {
          const fieldIdMap: Record<string, string> = {
            productName: 'product-name',
            productUrl: 'product-url',
            breed: 'breed',
            age: 'age',
            ingredientsText: 'ingredients-text',
          };
          const elementId = fieldIdMap[firstErrorField] || firstErrorField;
          const element = document.getElementById(elementId);
          element?.focus();
        }
        return;
      }

      // Submit the form - parent will handle scrape state
      onSubmit(formValues);
    },
    [formValues, validateForm, mergedErrors, onSubmit],
  );

  const handleFocusField = useCallback((fieldId: string) => {
    const element = document.getElementById(fieldId);
    if (element) {
      element.focus();
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  const handleRetry = useCallback(() => {
    resetManualIngredients();
    setScrapeState('idle');
  }, [resetManualIngredients, setScrapeState]);

  const isSubmitting = submissionStatus === 'submitting';

  return (
    <form
      onSubmit={handleFormSubmit}
      aria-describedby="form-description"
      className="space-y-6"
    >
      {/* Form Description for screen readers */}
      <div id="form-description" className="sr-only">
        Analysis form for pet food products. Fill in all required fields marked with asterisk.
      </div>

      {/* Validation Summary */}
      {showValidationSummary && (
        <FormValidationSummary
          errors={mergedErrors}
          onFocusField={handleFocusField}
          show={showValidationSummary}
        />
      )}

      {/* Product Information Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Product Information</h2>

        {/* Input Mode Selector - only show for new analyses, not reanalysis */}
        {!lockedFields.includes('productUrl') && !lockedFields.includes('productName') && (
          <InputModeSelector
            value={formValues.inputMode}
            onChange={setInputMode}
            disabled={isSubmitting}
            hasFormData={
              !!formValues.productUrl ||
              !!formValues.productName ||
              !!formValues.ingredientsText
            }
          />
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Conditionally render fields based on input mode */}
          {formValues.inputMode === 'url' ? (
            <>
              {/* URL Mode: Show URL input */}
              <div className="sm:col-span-2">
                <ProductUrlInput
                  value={formValues.productUrl}
                  error={mergedErrors.productUrl}
                  onChange={(value) => updateField('productUrl', value)}
                  onBlur={() => handleBlur('productUrl')}
                  disabled={isSubmitting || lockedFields.includes('productUrl')}
                />
              </div>

              {/* Show scrape status if scraping */}
              {scrapeState !== 'idle' && (
                <div className="sm:col-span-2">
                  <ScrapeStatus
                    state={scrapeState}
                    message={
                      scrapeState === 'scraping'
                        ? 'Attempting to retrieve ingredients from product page...'
                        : scrapeState === 'submitting'
                        ? 'Submitting your analysis request...'
                        : scrapeState === 'awaitingManual'
                        ? 'Unable to automatically retrieve ingredients. You can enter them manually or try a different URL.'
                        : 'Manual ingredients ready. Complete the form to continue.'
                    }
                    onRetry={handleRetry}
                    onEnableManual={enableManualIngredients}
                    isManualVisible={manualIngredientsState.isVisible}
                  />
                </div>
              )}

              {/* Manual ingredients fallback if scraping fails */}
              {(scrapeState === 'awaitingManual' || manualIngredientsState.isVisible) && (
                <div className="sm:col-span-2">
                  <ManualIngredientsTextarea
                    value={formValues.ingredientsText}
                    error={mergedErrors.ingredientsText}
                    onChange={updateManualIngredients}
                    disabled={isSubmitting}
                  />

                  {!manualIngredientsState.isVisible && scrapeState !== 'awaitingManual' && (
                    <button
                      type="button"
                      onClick={enableManualIngredients}
                      disabled={isSubmitting}
                      className="mt-2 text-sm text-brand-primary hover:underline focus:outline-none focus:ring-2 focus:ring-brand-primary rounded"
                    >
                      Enter ingredients manually
                    </button>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Manual Mode: Show product name and ingredients inputs */}
              <div className="sm:col-span-2">
                <ProductNameInput
                  value={formValues.productName}
                  error={mergedErrors.productName}
                  onChange={(value) => updateField('productName', value)}
                  onBlur={() => handleBlur('productName')}
                  disabled={isSubmitting || lockedFields.includes('productName')}
                />
              </div>

              <div className="sm:col-span-2">
                <ManualIngredientsTextarea
                  value={formValues.ingredientsText}
                  error={mergedErrors.ingredientsText}
                  onChange={(value) => updateField('ingredientsText', value)}
                  disabled={isSubmitting}
                />
                <p className="mt-1 text-xs text-slate-500">
                  Paste the full ingredients list from the product packaging or website
                </p>
              </div>
            </>
          )}
        </div>
      </div>


      {/* Pet Information Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Pet Information</h2>
        
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <SpeciesRadioGroup
              value={formValues.species}
              error={mergedErrors.species}
              onChange={(value) => updateField('species', value)}
              disabled={isSubmitting}
            />
          </div>

          <BreedTextInput
            value={formValues.breed}
            error={mergedErrors.breed}
            onChange={(value) => updateField('breed', value)}
            onBlur={() => handleBlur('breed')}
            disabled={isSubmitting}
          />

          <AgeNumberInput
            value={formValues.age}
            error={mergedErrors.age}
            onChange={(value) => updateField('age', value)}
            onBlur={() => handleBlur('age')}
            disabled={isSubmitting}
          />

          <div className="sm:col-span-2">
            <AdditionalInfoTextarea
              value={formValues.additionalInfo}
              onChange={(value) => updateField('additionalInfo', value)}
              onBlur={() => handleBlur('additionalInfo')}
              disabled={isSubmitting}
            />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <SubmitAnalysisButton
          status={submissionStatus}
          disabled={isSubmitting}
          loadingLabel="Analyzing your product..."
        />
      </div>
    </form>
  );
};

export default AnalyzeForm;


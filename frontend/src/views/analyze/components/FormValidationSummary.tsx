import type { AnalyzeFormErrors } from '../../../types/analyze';

type FormValidationSummaryProps = {
  errors: AnalyzeFormErrors;
  onFocusField: (fieldId: string) => void;
  show: boolean;
};

/**
 * FormValidationSummary Component
 * 
 * Purpose: Aggregate field errors for accessibility at top of form.
 * Accessibility: role="alert" container, list of anchor links to fields
 */
const FormValidationSummary = ({
  errors,
  onFocusField,
  show,
}: FormValidationSummaryProps) => {
  const errorEntries = Object.entries(errors).filter(([_, value]) => value);

  if (!show || errorEntries.length === 0) {
    return null;
  }

  const fieldIdMap: Record<string, string> = {
    productName: 'product-name',
    productUrl: 'product-url',
    species: 'species',
    breed: 'breed',
    age: 'age',
    ingredientsText: 'ingredients-text',
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="rounded-md border-2 border-rose-200 bg-rose-50 p-4"
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-rose-600"
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
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-rose-900">
            Please correct the following errors:
          </h3>
          <ul className="mt-2 space-y-1">
            {errorEntries.map(([field, message]) => {
              const fieldId = fieldIdMap[field] || field;
              return (
                <li key={field}>
                  <button
                    type="button"
                    onClick={() => onFocusField(fieldId)}
                    className="text-sm text-rose-700 underline hover:text-rose-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
                  >
                    {message}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FormValidationSummary;


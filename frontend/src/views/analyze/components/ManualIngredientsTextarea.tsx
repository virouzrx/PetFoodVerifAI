type ManualIngredientsTextareaProps = {
  value: string;
  error?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

/**
 * ManualIngredientsTextarea Component
 *
 * Purpose: Allow user to paste ingredients manually.
 * Validation: Required when visible.
 */
const ManualIngredientsTextarea = ({
  value,
  error,
  onChange,
  disabled = false,
}: ManualIngredientsTextareaProps) => {
  const textareaId = 'ingredients-text';
  const errorId = `${textareaId}-error`;
  const helperId = `${textareaId}-helper`;

  return (
    <div className="rounded-md border-2 border-amber-200 bg-amber-50 p-4">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-amber-900">
          Manual Ingredient Entry
        </h3>
      </div>

      {/* Textarea */}
      <div className="mb-3">
        <label htmlFor={textareaId} className="block text-sm font-medium text-brand-dark mb-1">
          Ingredients List
        </label>
        <textarea
          id={textareaId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          rows={6}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : helperId}
          className={`block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 ${
            error
              ? 'border-red-600 focus:border-red-700 focus:ring-red-700'
              : 'border-gray-300 focus:border-brand-primary focus:ring-brand-primary/30'
          } disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500`}
          placeholder="Paste the complete ingredient list from the product packaging here..."
        />
        {error ? (
          <p id={errorId} className="mt-1 text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : (
          <p id={helperId} className="mt-1 text-xs text-slate-600">
            Copy ingredients exactly as they appear on the package. Include all ingredients in order. If possible, also include vitamins, minerals, and supplements (such as taurine).
          </p>
        )}
      </div>
    </div>
  );
};

export default ManualIngredientsTextarea;


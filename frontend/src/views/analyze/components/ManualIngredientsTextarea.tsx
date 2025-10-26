type ManualIngredientsTextareaProps = {
  value: string;
  noIngredientsAvailable: boolean;
  error?: string;
  onChange: (value: string) => void;
  onNoIngredientsToggle: (checked: boolean) => void;
  disabled?: boolean;
};

/**
 * ManualIngredientsTextarea Component
 * 
 * Purpose: Allow user to paste ingredients or declare none available.
 * Validation: Required when visible unless noIngredientsAvailable is true.
 */
const ManualIngredientsTextarea = ({
  value,
  noIngredientsAvailable,
  error,
  onChange,
  onNoIngredientsToggle,
  disabled = false,
}: ManualIngredientsTextareaProps) => {
  const textareaId = 'ingredients-text';
  const checkboxId = 'no-ingredients-checkbox';
  const errorId = `${textareaId}-error`;
  const helperId = `${textareaId}-helper`;

  return (
    <div className="rounded-md border-2 border-amber-200 bg-amber-50 p-4">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-amber-900">
          Manual Ingredient Entry
        </h3>
        <p className="mt-1 text-xs text-amber-800">
          Since automatic scraping wasn't successful, please provide the ingredient list manually.
        </p>
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
          disabled={disabled || noIngredientsAvailable}
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
            Copy ingredients exactly as they appear on the package. Include all ingredients in order.
          </p>
        )}
      </div>

      {/* No Ingredients Checkbox */}
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          id={checkboxId}
          checked={noIngredientsAvailable}
          onChange={(e) => onNoIngredientsToggle(e.target.checked)}
          disabled={disabled}
          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        />
        <label htmlFor={checkboxId} className="text-sm text-slate-700">
          <span className="font-medium">No ingredient list available</span>
          <span className="block text-xs text-slate-600 mt-0.5">
            Check this if the product page doesn't display ingredients. 
            Note: Without ingredients, the product will automatically receive a "Not Recommended" rating.
          </span>
        </label>
      </div>
    </div>
  );
};

export default ManualIngredientsTextarea;


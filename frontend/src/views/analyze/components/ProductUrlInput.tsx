type ProductUrlInputProps = {
  value: string;
  error?: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  disabled?: boolean;
};

/**
 * ProductUrlInput Component
 * 
 * Purpose: Collect the product URL for scraping.
 * Validation: Required, passes URL constructor, ensures valid format.
 */
const ProductUrlInput = ({
  value,
  error,
  onChange,
  onBlur,
  disabled = false,
}: ProductUrlInputProps) => {
  const inputId = 'product-url';
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
        Product URL <span className="text-rose-600" aria-label="required">*</span>
      </label>
      <input
        type="url"
        id={inputId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : helperId}
        className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 ${
          error
            ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500'
            : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500'
        } disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500`}
        placeholder="https://www.chewy.com/product-name/..."
      />
      {error ? (
        <p id={errorId} className="mt-1 text-sm text-rose-600" role="alert">
          {error}
        </p>
      ) : (
        <p id={helperId} className="mt-1 text-xs text-slate-500">
          Link to the specific product page on a supported retailer
        </p>
      )}
    </div>
  );
};

export default ProductUrlInput;


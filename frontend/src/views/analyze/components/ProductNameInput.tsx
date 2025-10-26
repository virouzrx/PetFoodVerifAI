type ProductNameInputProps = {
  value: string;
  error?: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  disabled?: boolean;
};

/**
 * ProductNameInput Component
 * 
 * Purpose: Capture the product name exactly as on the store listing.
 * Validation: Required, trimmed length ≥ 2, block leading/trailing whitespace on blur.
 */
const ProductNameInput = ({
  value,
  error,
  onChange,
  onBlur,
  disabled = false,
}: ProductNameInputProps) => {
  const inputId = 'product-name';
  const errorId = `${inputId}-error`;

  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-medium text-brand-dark">
        Product Name <span className="text-red-700" aria-label="required">*</span>
      </label>
      <input
        type="text"
        id={inputId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 ${
          error
            ? 'border-red-600 focus:border-red-700 focus:ring-red-700'
            : 'border-gray-300 focus:border-brand-primary focus:ring-brand-primary/30'
        } disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500`}
        placeholder="e.g., Blue Buffalo Life Protection Formula"
      />
      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default ProductNameInput;


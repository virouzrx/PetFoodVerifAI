type BreedTextInputProps = {
  value: string;
  error?: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  disabled?: boolean;
};

/**
 * BreedTextInput Component
 * 
 * Purpose: Capture free-text breed information.
 * Validation: Required, trimmed length ≥ 2, avoid numbers-only strings.
 */
const BreedTextInput = ({
  value,
  error,
  onChange,
  onBlur,
  disabled = false,
}: BreedTextInputProps) => {
  const inputId = 'breed';
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-medium text-brand-dark">
        Breed <span className="text-rose-600" aria-label="required">*</span>
      </label>
      <input
        type="text"
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
            : 'border-gray-300 focus:border-brand-primary focus:ring-brand-secondary/50'
        } disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500`}
        placeholder="e.g., Golden Retriever, Mixed Breed, Siamese"
      />
      {error ? (
        <p id={errorId} className="mt-1 text-sm text-rose-600" role="alert">
          {error}
        </p>
      ) : (
        <p id={helperId} className="mt-1 text-xs text-gray-600">
          Enter your pet's breed or "Mixed Breed" if unknown
        </p>
      )}
    </div>
  );
};

export default BreedTextInput;


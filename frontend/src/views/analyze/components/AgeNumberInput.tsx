type AgeNumberInputProps = {
  value: number | '';
  error?: string;
  onChange: (value: number | '') => void;
  onBlur: () => void;
  disabled?: boolean;
};

/**
 * AgeNumberInput Component
 * 
 * Purpose: Collect pet age in years for LLM context.
 * Validation: Required, integer ≥ 1, provide inline warning for improbable values (> 30).
 */
const AgeNumberInput = ({
  value,
  error,
  onChange,
  onBlur,
  disabled = false,
}: AgeNumberInputProps) => {
  const inputId = 'age';
  const errorId = `${inputId}-error`;
  const warningId = `${inputId}-warning`;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      onChange('');
    } else {
      const numVal = parseInt(val, 10);
      if (!isNaN(numVal)) {
        onChange(numVal);
      }
    }
  };

  const showWarning = typeof value === 'number' && value > 30;

  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-medium text-brand-dark">
        Age <span className="text-rose-600" aria-label="required">*</span>
      </label>
      <div className="relative mt-1">
        <input
          type="number"
          id={inputId}
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          disabled={disabled}
          min="1"
          step="1"
          aria-invalid={!!error}
          aria-describedby={error ? errorId : showWarning ? warningId : undefined}
          className={`block w-full rounded-md border px-3 py-2 pr-16 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 ${
            error
              ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500'
              : 'border-gray-300 focus:border-brand-primary focus:ring-brand-secondary/50'
          } disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500`}
          placeholder="e.g., 3"
        />
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <span className="text-sm text-gray-600">years</span>
        </div>
      </div>
      {error ? (
        <p id={errorId} className="mt-1 text-sm text-rose-600" role="alert">
          {error}
        </p>
      ) : showWarning ? (
        <p id={warningId} className="mt-1 text-sm text-amber-600" role="status">
          This age seems unusually high. Please verify it's correct.
        </p>
      ) : null}
    </div>
  );
};

export default AgeNumberInput;


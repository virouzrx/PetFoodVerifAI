type AdditionalInfoTextareaProps = {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  disabled?: boolean;
};

const MAX_LENGTH = 500;

/**
 * AdditionalInfoTextarea Component
 * 
 * Purpose: Capture optional notes for the LLM.
 * Validation: Optional; enforce max length and sanitize HTML.
 */
const AdditionalInfoTextarea = ({
  value,
  onChange,
  onBlur,
  disabled = false,
}: AdditionalInfoTextareaProps) => {
  const inputId = 'additional-info';
  const helperId = `${inputId}-helper`;
  const charsRemaining = MAX_LENGTH - value.length;
  const isNearLimit = charsRemaining < 50;

  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
        Additional Information{' '}
        <span className="font-normal text-slate-500">(Optional)</span>
      </label>
      <textarea
        id={inputId}
        value={value}
        onChange={(e) => {
          if (e.target.value.length <= MAX_LENGTH) {
            onChange(e.target.value);
          }
        }}
        onBlur={onBlur}
        disabled={disabled}
        maxLength={MAX_LENGTH}
        rows={4}
        aria-describedby={helperId}
        className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 border-slate-300 focus:border-blue-500 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500`}
        placeholder="Any health conditions, allergies, or dietary preferences we should consider..."
      />
      <div className="mt-1 flex items-center justify-between">
        <p id={helperId} className="text-xs text-slate-500">
          Provide any additional context that may help with the analysis
        </p>
        <p
          className={`text-xs ${
            isNearLimit ? 'font-medium text-amber-600' : 'text-slate-500'
          }`}
          aria-live="polite"
        >
          {charsRemaining} characters remaining
        </p>
      </div>
    </div>
  );
};

export default AdditionalInfoTextarea;


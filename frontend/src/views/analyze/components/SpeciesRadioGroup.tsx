import type { SpeciesOption } from '../../../types/analyze';

type SpeciesRadioGroupProps = {
  value: SpeciesOption;
  error?: string;
  onChange: (value: 'Cat' | 'Dog') => void;
  disabled?: boolean;
};

/**
 * SpeciesRadioGroup Component
 * 
 * Purpose: Let user pick Cat or Dog with accessible radios.
 * Validation: Required; default to none to force explicit choice.
 */
const SpeciesRadioGroup = ({
  value,
  error,
  onChange,
  disabled = false,
}: SpeciesRadioGroupProps) => {
  const fieldsetId = 'species';
  const errorId = `${fieldsetId}-error`;

  return (
    <fieldset aria-invalid={!!error} aria-describedby={error ? errorId : undefined}>
      <legend className="block text-sm font-medium text-brand-dark mb-2">
        Pet Species <span className="text-rose-600" aria-label="required">*</span>
      </legend>
      <div className="flex gap-4">
        {/* Cat Option */}
        <label
          className={`flex flex-1 items-center gap-3 rounded-md border-2 px-4 py-3 cursor-pointer transition-colors ${
            value === 'Cat'
              ? 'border-brand-primary bg-brand-primary/10'
              : 'border-gray-300 bg-white hover:border-gray-400'
          } ${
            disabled ? 'cursor-not-allowed opacity-60' : ''
          }`}
        >
          <input
            type="radio"
            name="species"
            value="Cat"
            checked={value === 'Cat'}
            onChange={(e) => onChange(e.target.value as 'Cat')}
            disabled={disabled}
            className="h-4 w-4 border-gray-300 text-brand-primary focus:ring-2 focus:ring-brand-secondary/50 focus:ring-offset-2"
          />
          <div className="flex items-center gap-2">
            <span className="text-2xl" role="img" aria-label="cat">
              🐱
            </span>
            <span className="text-sm font-medium text-brand-dark">Cat</span>
          </div>
        </label>

        {/* Dog Option */}
        <label
          className={`flex flex-1 items-center gap-3 rounded-md border-2 px-4 py-3 cursor-pointer transition-colors ${
            value === 'Dog'
              ? 'border-brand-primary bg-brand-primary/10'
              : 'border-gray-300 bg-white hover:border-gray-400'
          } ${
            disabled ? 'cursor-not-allowed opacity-60' : ''
          }`}
        >
          <input
            type="radio"
            name="species"
            value="Dog"
            checked={value === 'Dog'}
            onChange={(e) => onChange(e.target.value as 'Dog')}
            disabled={disabled}
            className="h-4 w-4 border-gray-300 text-brand-primary focus:ring-2 focus:ring-brand-secondary/50 focus:ring-offset-2"
          />
          <div className="flex items-center gap-2">
            <span className="text-2xl" role="img" aria-label="dog">
              🐶
            </span>
            <span className="text-sm font-medium text-brand-dark">Dog</span>
          </div>
        </label>
      </div>
      {error && (
        <p id={errorId} className="mt-2 text-sm text-rose-600" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
};

export default SpeciesRadioGroup;


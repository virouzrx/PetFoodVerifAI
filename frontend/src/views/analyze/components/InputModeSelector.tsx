import { useState } from 'react';
import type { InputMode } from '../../../types/analyze';

type InputModeSelectorProps = {
  value: InputMode;
  onChange: (mode: InputMode) => void;
  disabled?: boolean;
  hasFormData?: boolean;
};

const InputModeSelector = ({
  value,
  onChange,
  disabled = false,
  hasFormData = false,
}: InputModeSelectorProps) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingMode, setPendingMode] = useState<InputMode | null>(null);

  const handleModeClick = (newMode: InputMode) => {
    if (disabled || newMode === value) return;

    if (hasFormData) {
      setPendingMode(newMode);
      setShowConfirmation(true);
    } else {
      onChange(newMode);
    }
  };

  const handleConfirm = () => {
    if (pendingMode) {
      onChange(pendingMode);
    }
    setShowConfirmation(false);
    setPendingMode(null);
  };

  const handleCancel = () => {
    setShowConfirmation(false);
    setPendingMode(null);
  };

  const getModeDescription = (mode: InputMode) => {
    return mode === 'url'
      ? 'Automatically retrieve product details from a website'
      : 'Manually enter product name and ingredients';
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <label className="text-sm font-medium text-brand-dark">
          Input Method
        </label>
        
        <div
          role="radiogroup"
          aria-label="Select input method"
          className="inline-flex rounded-lg border-2 border-brand-primary bg-brand-secondary p-1 shadow-sm gap-2"
        >
          <button
            type="button"
            role="radio"
            aria-checked={value === 'url'}
            onClick={() => handleModeClick('url')}
            disabled={disabled}
            className={`
              flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all
              focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2
              ${
                value === 'url'
                  ? 'bg-brand-primary text-white shadow-md border border-brand-primary'
                  : 'bg-white text-brand-dark hover:bg-slate-50 border border-transparent'
              }
              ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
            `}
          >
            <div className="flex items-center justify-center gap-2">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
              <span>Get from URL</span>
            </div>
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={value === 'manual'}
            onClick={() => handleModeClick('manual')}
            disabled={disabled}
            className={`
              flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all
              focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2
              ${
                value === 'manual'
                  ? 'bg-brand-primary text-white shadow-md border border-brand-primary'
                  : 'bg-white text-brand-dark hover:bg-slate-50 border border-transparent'
              }
              ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
            `}
          >
            <div className="flex items-center justify-center gap-2">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              <span>Enter Manually</span>
            </div>
          </button>
        </div>

        <p className="text-xs text-brand-dark">
          {getModeDescription(value)}
        </p>
      </div>

      {showConfirmation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mode-switch-title"
        >
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3
              id="mode-switch-title"
              className="text-lg font-semibold text-slate-900 mb-2"
            >
              Switch Input Mode?
            </h3>
            <p className="text-sm text-slate-600 mb-6">
              Switching to {pendingMode === 'url' ? 'URL mode' : 'manual mode'} will
              clear your current entries. Are you sure you want to continue?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-brand-primary rounded-md hover:bg-brand-primary/90 focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                Switch Mode
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InputModeSelector;


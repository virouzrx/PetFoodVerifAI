import { useReducer, useCallback, useState, useEffect } from 'react';
import type {
  AnalyzeFormValues,
  AnalyzeFormErrors,
  ScrapeState,
  ManualIngredientsState,
} from '../../../types/analyze';

type AnalyzeFieldValue = AnalyzeFormValues[keyof AnalyzeFormValues];

type FormAction =
  | { type: 'SET_FIELD'; field: keyof AnalyzeFormValues; value: AnalyzeFieldValue }
  | { type: 'SET_MANUAL_INGREDIENTS'; value: string }
  | { type: 'ENABLE_MANUAL' }
  | { type: 'RESET_MANUAL' }
  | { type: 'RESET_FORM' }
  | { type: 'INIT_FORM'; values: Partial<AnalyzeFormValues> }
  | { type: 'SET_INPUT_MODE'; mode: import('../../../types/analyze').InputMode };

const initialFormValues: AnalyzeFormValues = {
  inputMode: 'url',
  productName: '',
  productUrl: '',
  species: '',
  breed: '',
  age: '',
  additionalInfo: '',
  ingredientsText: '',
  hasManualIngredients: false,
};

const formReducer = (state: AnalyzeFormValues, action: FormAction): AnalyzeFormValues => {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'SET_MANUAL_INGREDIENTS':
      return { ...state, ingredientsText: action.value };
    case 'ENABLE_MANUAL':
      return { ...state, hasManualIngredients: true };
    case 'RESET_MANUAL':
      return {
        ...state,
        hasManualIngredients: false,
        ingredientsText: '',
      };
    case 'RESET_FORM':
      return initialFormValues;
    case 'INIT_FORM':
      return { ...state, ...action.values };
    case 'SET_INPUT_MODE':
      if (action.mode === 'url') {
        return {
          ...state,
          inputMode: action.mode,
          productName: '',
          ingredientsText: '',
          hasManualIngredients: false,
        };
      } else {
        return {
          ...state,
          inputMode: action.mode,
          productUrl: '',
          ingredientsText: '',
          hasManualIngredients: true,
        };
      }
    default:
      return state;
  }
};

/**
 * useAnalyzeForm Hook
 * 
 * Purpose: Manage form state, validation, and manual ingredient fallback
 * Returns: Form values, errors, handlers, and manual ingredient state
 */
export const useAnalyzeForm = (initialValues?: Partial<AnalyzeFormValues>) => {
  const [formValues, dispatch] = useReducer(formReducer, initialFormValues);
  const [formErrors, setFormErrors] = useState<AnalyzeFormErrors>({});
  const [scrapeState, setScrapeState] = useState<ScrapeState>('idle');
  const [showValidationSummary, setShowValidationSummary] = useState(false);

  // Initialize form with provided values
  const initializeForm = useCallback((values: Partial<AnalyzeFormValues>) => {
    dispatch({ type: 'INIT_FORM', values });
  }, []);

  // Initialize on mount if initial values provided
  useEffect(() => {
    if (initialValues) {
      initializeForm(initialValues);
    }
  }, [initialValues, initializeForm]);

  // Field update handler
  const updateField = useCallback(<K extends keyof AnalyzeFormValues>(
    field: K,
    value: AnalyzeFormValues[K],
  ) => {
    dispatch({ type: 'SET_FIELD', field, value: value as AnalyzeFieldValue });
    // Clear error for this field when user updates it
    setFormErrors((prev) => {
      const updated = { ...prev };
      delete updated[field as keyof AnalyzeFormErrors];
      return updated;
    });
  }, []);

  // Individual field validators
  const validateProductName = (value: string): string | undefined => {
    const trimmed = value.trim();
    if (!trimmed) return 'Product name is required';
    if (trimmed.length < 2) return 'Product name must be at least 2 characters';
    return undefined;
  };

  const validateProductUrl = (value: string): string | undefined => {
    const trimmed = value.trim();
    if (!trimmed) return 'Product URL is required';
    try {
      new URL(trimmed);
      return undefined;
    } catch {
      return 'Please enter a valid URL';
    }
  };

  const validateSpecies = (value: string): string | undefined => {
    if (!value || (value !== 'Cat' && value !== 'Dog')) {
      return 'Please select a species';
    }
    return undefined;
  };

  const validateBreed = (value: string): string | undefined => {
    const trimmed = value.trim();
    if (!trimmed) return 'Breed is required';
    if (trimmed.length < 2) return 'Breed must be at least 2 characters';
    if (/^\d+$/.test(trimmed)) return 'Breed cannot be only numbers';
    return undefined;
  };

  const validateAge = (value: number | ''): string | undefined => {
    if (value === '' || value === null || value === undefined) {
      return 'Age is required';
    }
    if (typeof value !== 'number' || value < 1) {
      return 'Age must be at least 1 year';
    }
    if (!Number.isInteger(value)) {
      return 'Age must be a whole number';
    }
    return undefined;
  };

  const validateIngredientsText = (
    value: string,
    hasManual: boolean,
  ): string | undefined => {
    if (!hasManual) return undefined; // Not required if not in manual mode
    const trimmed = value.trim();
    if (!trimmed) return 'Please enter the ingredients list';
    if (trimmed.length < 10) return 'Ingredients list seems too short. Please provide more detail.';
    return undefined;
  };

  // Field blur handlers
  const handleBlur = useCallback(
    (field: keyof AnalyzeFormValues) => {
      let error: string | undefined;

      switch (field) {
        case 'productName':
          error = validateProductName(formValues.productName);
          // Also trim on blur
          if (formValues.productName !== formValues.productName.trim()) {
            dispatch({
              type: 'SET_FIELD',
              field: 'productName',
              value: formValues.productName.trim(),
            });
          }
          break;
        case 'productUrl':
          error = validateProductUrl(formValues.productUrl);
          if (formValues.productUrl !== formValues.productUrl.trim()) {
            dispatch({
              type: 'SET_FIELD',
              field: 'productUrl',
              value: formValues.productUrl.trim(),
            });
          }
          break;
        case 'species':
          error = validateSpecies(formValues.species);
          break;
        case 'breed':
          error = validateBreed(formValues.breed);
          if (formValues.breed !== formValues.breed.trim()) {
            dispatch({ type: 'SET_FIELD', field: 'breed', value: formValues.breed.trim() });
          }
          break;
        case 'age':
          error = validateAge(formValues.age);
          break;
        case 'ingredientsText':
          error = validateIngredientsText(
            formValues.ingredientsText,
            formValues.hasManualIngredients,
          );
          break;
      }

      if (error) {
        setFormErrors((prev) => ({ ...prev, [field]: error }));
      }
    },
    [formValues],
  );

  // Validate entire form
  const validateForm = useCallback((): boolean => {
    const errors: AnalyzeFormErrors = {};

    if (formValues.inputMode === 'url') {
      const productUrlError = validateProductUrl(formValues.productUrl);
      if (productUrlError) errors.productUrl = productUrlError;
      
      if (formValues.hasManualIngredients) {
        const ingredientsError = validateIngredientsText(
          formValues.ingredientsText,
          true,
        );
        if (ingredientsError) errors.ingredientsText = ingredientsError;
      }
    } else {
      const productNameError = validateProductName(formValues.productName);
      if (productNameError) errors.productName = productNameError;

      const ingredientsError = validateIngredientsText(
        formValues.ingredientsText,
        true,
      );
      if (ingredientsError) errors.ingredientsText = ingredientsError;
    }

    const speciesError = validateSpecies(formValues.species);
    if (speciesError) errors.species = speciesError;

    const breedError = validateBreed(formValues.breed);
    if (breedError) errors.breed = breedError;

    const ageError = validateAge(formValues.age);
    if (ageError) errors.age = ageError;

    setFormErrors(errors);
    setShowValidationSummary(Object.keys(errors).length > 0);

    return Object.keys(errors).length === 0;
  }, [formValues]);

  // Manual ingredient handlers
  const enableManualIngredients = useCallback(() => {
    dispatch({ type: 'ENABLE_MANUAL' });
    setScrapeState('manualReady');
  }, []);

  const resetManualIngredients = useCallback(() => {
    dispatch({ type: 'RESET_MANUAL' });
    setScrapeState('idle');
  }, []);

  const updateManualIngredients = useCallback((value: string) => {
    dispatch({ type: 'SET_MANUAL_INGREDIENTS', value });
    setFormErrors((prev) => {
      const updated = { ...prev };
      delete updated.ingredientsText;
      return updated;
    });
  }, []);


  const setInputMode = useCallback((mode: import('../../../types/analyze').InputMode) => {
    dispatch({ type: 'SET_INPUT_MODE', mode });
    setFormErrors({});
    setShowValidationSummary(false);
  }, []);

  const manualIngredientsState: ManualIngredientsState = {
    isVisible: formValues.hasManualIngredients,
    value: formValues.ingredientsText,
  };

  return {
    formValues,
    formErrors,
    scrapeState,
    showValidationSummary,
    manualIngredientsState,
    updateField,
    handleBlur,
    validateForm,
    enableManualIngredients,
    resetManualIngredients,
    updateManualIngredients,
    setScrapeState,
    setFormErrors,
    initializeForm,
    setInputMode,
  };
};


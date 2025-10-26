import { useReducer, useCallback, useState, useEffect } from 'react';
import type {
  AnalyzeFormValues,
  AnalyzeFormErrors,
  ScrapeState,
  ManualIngredientsState,
} from '../../../types/analyze';

type FormAction =
  | { type: 'SET_FIELD'; field: keyof AnalyzeFormValues; value: any }
  | { type: 'SET_MANUAL_INGREDIENTS'; value: string }
  | { type: 'SET_NO_INGREDIENTS'; value: boolean }
  | { type: 'ENABLE_MANUAL' }
  | { type: 'RESET_MANUAL' }
  | { type: 'RESET_FORM' }
  | { type: 'INIT_FORM'; values: Partial<AnalyzeFormValues> };

const initialFormValues: AnalyzeFormValues = {
  productName: '',
  productUrl: '',
  species: '',
  breed: '',
  age: '',
  additionalInfo: '',
  ingredientsText: '',
  hasManualIngredients: false,
  noIngredientsAvailable: false,
};

const formReducer = (state: AnalyzeFormValues, action: FormAction): AnalyzeFormValues => {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'SET_MANUAL_INGREDIENTS':
      return { ...state, ingredientsText: action.value };
    case 'SET_NO_INGREDIENTS':
      return { ...state, noIngredientsAvailable: action.value };
    case 'ENABLE_MANUAL':
      return { ...state, hasManualIngredients: true };
    case 'RESET_MANUAL':
      return {
        ...state,
        hasManualIngredients: false,
        ingredientsText: '',
        noIngredientsAvailable: false,
      };
    case 'RESET_FORM':
      return initialFormValues;
    case 'INIT_FORM':
      return { ...state, ...action.values };
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
  }, []); // Only run once on mount

  // Field update handler
  const updateField = useCallback((field: keyof AnalyzeFormValues, value: any) => {
    dispatch({ type: 'SET_FIELD', field, value });
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
    noIngredients: boolean,
  ): string | undefined => {
    if (!hasManual) return undefined; // Not required if not in manual mode
    if (noIngredients) return undefined; // OK if user acknowledged no ingredients
    const trimmed = value.trim();
    if (!trimmed) return 'Please enter ingredients or check "No ingredient list available"';
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
            formValues.noIngredientsAvailable,
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

    const productNameError = validateProductName(formValues.productName);
    if (productNameError) errors.productName = productNameError;

    const productUrlError = validateProductUrl(formValues.productUrl);
    if (productUrlError) errors.productUrl = productUrlError;

    const speciesError = validateSpecies(formValues.species);
    if (speciesError) errors.species = speciesError;

    const breedError = validateBreed(formValues.breed);
    if (breedError) errors.breed = breedError;

    const ageError = validateAge(formValues.age);
    if (ageError) errors.age = ageError;

    const ingredientsError = validateIngredientsText(
      formValues.ingredientsText,
      formValues.hasManualIngredients,
      formValues.noIngredientsAvailable,
    );
    if (ingredientsError) errors.ingredientsText = ingredientsError;

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

  const toggleNoIngredients = useCallback((checked: boolean) => {
    dispatch({ type: 'SET_NO_INGREDIENTS', value: checked });
    if (checked) {
      // Clear ingredients text error when user checks the box
      setFormErrors((prev) => {
        const updated = { ...prev };
        delete updated.ingredientsText;
        return updated;
      });
    }
  }, []);

  const manualIngredientsState: ManualIngredientsState = {
    isVisible: formValues.hasManualIngredients,
    value: formValues.ingredientsText,
    noIngredientsAvailable: formValues.noIngredientsAvailable,
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
    toggleNoIngredients,
    setScrapeState,
    setFormErrors,
    initializeForm,
  };
};


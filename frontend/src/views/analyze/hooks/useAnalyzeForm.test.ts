import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAnalyzeForm } from './useAnalyzeForm'
import type { AnalyzeFormValues } from '../../../types/analyze'

describe('useAnalyzeForm', () => {
  describe('initialization', () => {
    it('should initialize with default empty values', () => {
      const { result } = renderHook(() => useAnalyzeForm())

      expect(result.current.formValues).toEqual({
        productName: '',
        productUrl: '',
        species: '',
        breed: '',
        age: '',
        additionalInfo: '',
        ingredientsText: '',
        hasManualIngredients: false,
        noIngredientsAvailable: false,
      })
    })

    it('should initialize with provided initial values', () => {
      const initialValues: Partial<AnalyzeFormValues> = {
        productName: 'Test Product',
        productUrl: 'https://example.com',
        species: 'Dog',
        breed: 'Labrador',
        age: 5,
      }

      const { result } = renderHook(() => useAnalyzeForm(initialValues))

      expect(result.current.formValues.productName).toBe('Test Product')
      expect(result.current.formValues.productUrl).toBe('https://example.com')
      expect(result.current.formValues.species).toBe('Dog')
      expect(result.current.formValues.breed).toBe('Labrador')
      expect(result.current.formValues.age).toBe(5)
    })

    it('should handle partial initial values', () => {
      const initialValues = {
        productName: 'Test',
      }

      const { result } = renderHook(() => useAnalyzeForm(initialValues))

      expect(result.current.formValues.productName).toBe('Test')
      expect(result.current.formValues.productUrl).toBe('')
      expect(result.current.formValues.species).toBe('')
    })

    it('should initialize formErrors as empty object', () => {
      const { result } = renderHook(() => useAnalyzeForm())

      expect(result.current.formErrors).toEqual({})
    })

    it('should initialize scrapeState as idle', () => {
      const { result } = renderHook(() => useAnalyzeForm())

      expect(result.current.scrapeState).toBe('idle')
    })

    it('should initialize showValidationSummary as false', () => {
      const { result } = renderHook(() => useAnalyzeForm())

      expect(result.current.showValidationSummary).toBe(false)
    })
  })

  describe('updateField function', () => {
    it('should update productName field', () => {
      const { result } = renderHook(() => useAnalyzeForm())

      act(() => {
        result.current.updateField('productName', 'New Product')
      })

      expect(result.current.formValues.productName).toBe('New Product')
    })

    it('should update productUrl field', () => {
      const { result } = renderHook(() => useAnalyzeForm())

      act(() => {
        result.current.updateField('productUrl', 'https://test.com')
      })

      expect(result.current.formValues.productUrl).toBe('https://test.com')
    })

    it('should update species field', () => {
      const { result } = renderHook(() => useAnalyzeForm())

      act(() => {
        result.current.updateField('species', 'Cat')
      })

      expect(result.current.formValues.species).toBe('Cat')
    })

    it('should update breed field', () => {
      const { result } = renderHook(() => useAnalyzeForm())

      act(() => {
        result.current.updateField('breed', 'Persian')
      })

      expect(result.current.formValues.breed).toBe('Persian')
    })

    it('should update age field', () => {
      const { result } = renderHook(() => useAnalyzeForm())

      act(() => {
        result.current.updateField('age', 7)
      })

      expect(result.current.formValues.age).toBe(7)
    })

    it('should update additionalInfo field', () => {
      const { result } = renderHook(() => useAnalyzeForm())

      act(() => {
        result.current.updateField('additionalInfo', 'Senior dog')
      })

      expect(result.current.formValues.additionalInfo).toBe('Senior dog')
    })

    it('should clear field error when field is updated', () => {
      const { result } = renderHook(() => useAnalyzeForm())

      // Set an error first
      act(() => {
        result.current.updateField('productName', '')
        result.current.handleBlur('productName')
      })

      expect(result.current.formErrors.productName).toBeTruthy()

      // Update field should clear error
      act(() => {
        result.current.updateField('productName', 'Valid Name')
      })

      expect(result.current.formErrors.productName).toBeUndefined()
    })

    it('should not affect other fields', () => {
      const { result } = renderHook(() => useAnalyzeForm())

      act(() => {
        result.current.updateField('productName', 'Product')
        result.current.updateField('breed', 'Breed')
      })

      act(() => {
        result.current.updateField('productName', 'Updated Product')
      })

      expect(result.current.formValues.breed).toBe('Breed')
    })
  })

  describe('validateProductName', () => {
    it('should pass valid product name', () => {
      const { result } = renderHook(() => useAnalyzeForm())

      act(() => {
        result.current.updateField('productName', 'Valid Product Name')
      })

      act(() => {
        result.current.handleBlur('productName')
      })

      expect(result.current.formErrors.productName).toBeUndefined()
    })

    it('should fail when empty', () => {
      const { result } = renderHook(() => useAnalyzeForm())

      act(() => {
        result.current.updateField('productName', '')
        result.current.handleBlur('productName')
      })

      expect(result.current.formErrors.productName).toBe('Product name is required')
    })

    it('should fail when only whitespace', () => {
      const { result } = renderHook(() => useAnalyzeForm())

      act(() => {
        result.current.updateField('productName', '   ')
        result.current.handleBlur('productName')
      })

      expect(result.current.formErrors.productName).toBe('Product name is required')
    })

    it('should fail when < 2 characters', () => {
      const { result } = renderHook(() => useAnalyzeForm())

      act(() => {
        result.current.updateField('productName', 'A')
      })

      act(() => {
        result.current.handleBlur('productName')
      })

      expect(result.current.formErrors.productName).toBe('Product name must be at least 2 characters')
    })

    it('should trim whitespace on blur', () => {
      const { result } = renderHook(() => useAnalyzeForm())

      act(() => {
        result.current.updateField('productName', '  Valid  ')
      })

      act(() => {
        result.current.handleBlur('productName')
      })

      expect(result.current.formValues.productName).toBe('Valid')
    })
  })

  describe('validateProductUrl', () => {
    it('should pass valid HTTP URL', () => {
      const { result } = renderHook(() => useAnalyzeForm())

      act(() => {
        result.current.updateField('productUrl', 'http://example.com')
      })

      act(() => {
        result.current.handleBlur('productUrl')
      })

      expect(result.current.formErrors.productUrl).toBeUndefined()
    })

    it('should pass valid HTTPS URL', () => {
      const { result } = renderHook(() => useAnalyzeForm())

      act(() => {
        result.current.updateField('productUrl', 'https://example.com/product')
      })

      act(() => {
        result.current.handleBlur('productUrl')
      })

      expect(result.current.formErrors.productUrl).toBeUndefined()
    })

    it('should fail when empty', () => {
      const { result } = renderHook(() => useAnalyzeForm())

      act(() => {
        result.current.updateField('productUrl', '')
        result.current.handleBlur('productUrl')
      })

      expect(result.current.formErrors.productUrl).toBe('Product URL is required')
    })

    it('should fail when invalid URL format', () => {
      const { result } = renderHook(() => useAnalyzeForm())

      act(() => {
        result.current.updateField('productUrl', 'not-a-url')
      })

      act(() => {
        result.current.handleBlur('productUrl')
      })

      expect(result.current.formErrors.productUrl).toBe('Please enter a valid URL')
    })

    it('should fail when malformed URL', () => {
      const { result } = renderHook(() => useAnalyzeForm())

      act(() => {
        result.current.updateField('productUrl', 'not a url at all')
      })

      act(() => {
        result.current.handleBlur('productUrl')
      })

      expect(result.current.formErrors.productUrl).toBe('Please enter a valid URL')
    })

    it('should trim whitespace on blur', () => {
      const { result } = renderHook(() => useAnalyzeForm())

      act(() => {
        result.current.updateField('productUrl', '  https://example.com  ')
      })

      act(() => {
        result.current.handleBlur('productUrl')
      })

      expect(result.current.formValues.productUrl).toBe('https://example.com')
    })
  })

  describe('validateSpecies', () => {
    it('should pass "Cat"', () => {
      const { result } = renderHook(() => useAnalyzeForm())

      act(() => {
        result.current.updateField('species', 'Cat')
      })

      act(() => {
        result.current.handleBlur('species')
      })

      expect(result.current.formErrors.species).toBeUndefined()
    })

    it('should pass "Dog"', () => {
      const { result } = renderHook(() => useAnalyzeForm())

      act(() => {
        result.current.updateField('species', 'Dog')
      })

      act(() => {
        result.current.handleBlur('species')
      })

      expect(result.current.formErrors.species).toBeUndefined()
    })

    it('should fail when empty', () => {
      const { result } = renderHook(() => useAnalyzeForm())

      act(() => {
        result.current.updateField('species', '')
        result.current.handleBlur('species')
      })

      expect(result.current.formErrors.species).toBe('Please select a species')
    })

    it('should fail for invalid species', () => {
      const { result } = renderHook(() => useAnalyzeForm())

      act(() => {
        // @ts-ignore - testing invalid input
        result.current.updateField('species', 'Bird')
        result.current.handleBlur('species')
      })

      expect(result.current.formErrors.species).toBe('Please select a species')
    })
  })

  describe('validateBreed', () => {
    it('should pass valid breed name', () => {
      const { result } = renderHook(() => useAnalyzeForm())

      act(() => {
        result.current.updateField('breed', 'Golden Retriever')
      })

      act(() => {
        result.current.handleBlur('breed')
      })

      expect(result.current.formErrors.breed).toBeUndefined()
    })

    it('should fail when empty', () => {
      const { result } = renderHook(() => useAnalyzeForm())

      act(() => {
        result.current.updateField('breed', '')
        result.current.handleBlur('breed')
      })

      expect(result.current.formErrors.breed).toBe('Breed is required')
    })

    it('should fail when only whitespace', () => {
      const { result } = renderHook(() => useAnalyzeForm())

      act(() => {
        result.current.updateField('breed', '   ')
        result.current.handleBlur('breed')
      })

      expect(result.current.formErrors.breed).toBe('Breed is required')
    })

    it('should fail when < 2 characters', () => {
      const { result } = renderHook(() => useAnalyzeForm())

      act(() => {
        result.current.updateField('breed', 'A')
      })

      act(() => {
        result.current.handleBlur('breed')
      })

      expect(result.current.formErrors.breed).toBe('Breed must be at least 2 characters')
    })

    it('should fail when only numbers', () => {
      const { result } = renderHook(() => useAnalyzeForm())

      act(() => {
        result.current.updateField('breed', '12345')
      })

      act(() => {
        result.current.handleBlur('breed')
      })

      expect(result.current.formErrors.breed).toBe('Breed cannot be only numbers')
    })

    it('should allow alphanumeric breeds', () => {
      const { result } = renderHook(() => useAnalyzeForm())

      act(() => {
        result.current.updateField('breed', 'Mix123')
      })

      act(() => {
        result.current.handleBlur('breed')
      })

      expect(result.current.formErrors.breed).toBeUndefined()
    })

    it('should trim whitespace on blur', () => {
      const { result } = renderHook(() => useAnalyzeForm())

      act(() => {
        result.current.updateField('breed', '  Labrador  ')
      })

      act(() => {
        result.current.handleBlur('breed')
      })

      expect(result.current.formValues.breed).toBe('Labrador')
    })
  })

  describe('validateAge', () => {
    it('should pass valid age (1-20)', () => {
      const { result } = renderHook(() => useAnalyzeForm())

      act(() => {
        result.current.updateField('age', 5)
      })

      act(() => {
        result.current.handleBlur('age')
      })

      expect(result.current.formErrors.age).toBeUndefined()
    })

    it('should fail when empty', () => {
      const { result } = renderHook(() => useAnalyzeForm())

      act(() => {
        result.current.updateField('age', '')
        result.current.handleBlur('age')
      })

      expect(result.current.formErrors.age).toBe('Age is required')
    })

    it('should fail when null', () => {
      const { result } = renderHook(() => useAnalyzeForm())

      act(() => {
        // @ts-ignore - testing edge case
        result.current.updateField('age', null)
        result.current.handleBlur('age')
      })

      expect(result.current.formErrors.age).toBe('Age is required')
    })

    it('should fail when < 1', () => {
      const { result } = renderHook(() => useAnalyzeForm())

      act(() => {
        result.current.updateField('age', 0)
      })

      act(() => {
        result.current.handleBlur('age')
      })

      expect(result.current.formErrors.age).toBe('Age must be at least 1 year')
    })

    it('should fail when negative', () => {
      const { result } = renderHook(() => useAnalyzeForm())

      act(() => {
        result.current.updateField('age', -5)
      })

      act(() => {
        result.current.handleBlur('age')
      })

      expect(result.current.formErrors.age).toBe('Age must be at least 1 year')
    })

    it('should fail for decimal numbers', () => {
      const { result } = renderHook(() => useAnalyzeForm())

      act(() => {
        result.current.updateField('age', 5.5)
      })

      act(() => {
        result.current.handleBlur('age')
      })

      expect(result.current.formErrors.age).toBe('Age must be a whole number')
    })

    it('should require whole numbers only', () => {
      const { result } = renderHook(() => useAnalyzeForm())

      act(() => {
        result.current.updateField('age', 10)
      })

      act(() => {
        result.current.handleBlur('age')
      })

      expect(result.current.formErrors.age).toBeUndefined()
    })
  })

  describe('validateIngredientsText', () => {
    it('should pass when not in manual mode', () => {
      const { result } = renderHook(() => useAnalyzeForm())

      act(() => {
        result.current.updateField('ingredientsText', '')
        result.current.handleBlur('ingredientsText')
      })

      expect(result.current.formErrors.ingredientsText).toBeUndefined()
    })

    it('should pass when noIngredientsAvailable is checked', () => {
      const { result } = renderHook(() => useAnalyzeForm())

      act(() => {
        result.current.enableManualIngredients()
        result.current.toggleNoIngredients(true)
        result.current.handleBlur('ingredientsText')
      })

      expect(result.current.formErrors.ingredientsText).toBeUndefined()
    })

    it('should fail when manual mode and empty', () => {
      const { result } = renderHook(() => useAnalyzeForm())

      act(() => {
        result.current.enableManualIngredients()
        result.current.updateManualIngredients('')
      })

      act(() => {
        result.current.handleBlur('ingredientsText')
      })

      expect(result.current.formErrors.ingredientsText).toBe(
        'Please enter ingredients or check "No ingredient list available"'
      )
    })

    it('should fail when < 10 characters in manual mode', () => {
      const { result } = renderHook(() => useAnalyzeForm())

      act(() => {
        result.current.enableManualIngredients()
        result.current.updateManualIngredients('Short')
      })

      act(() => {
        result.current.handleBlur('ingredientsText')
      })

      expect(result.current.formErrors.ingredientsText).toBe(
        'Ingredients list seems too short. Please provide more detail.'
      )
    })

    it('should pass valid ingredients text', () => {
      const { result } = renderHook(() => useAnalyzeForm())

      act(() => {
        result.current.enableManualIngredients()
        result.current.updateManualIngredients('Chicken, rice, vegetables, vitamins')
        result.current.handleBlur('ingredientsText')
      })

      expect(result.current.formErrors.ingredientsText).toBeUndefined()
    })

    it('should trim whitespace before validation', () => {
      const { result } = renderHook(() => useAnalyzeForm())

      act(() => {
        result.current.enableManualIngredients()
        result.current.updateManualIngredients('   Short   ')
      })

      act(() => {
        result.current.handleBlur('ingredientsText')
      })

      // "Short" is 5 chars, less than 10
      expect(result.current.formErrors.ingredientsText).toBeTruthy()
    })
  })

  describe('handleBlur function', () => {
    it('should validate productName on blur', () => {
      const { result } = renderHook(() => useAnalyzeForm())

      act(() => {
        result.current.updateField('productName', '')
        result.current.handleBlur('productName')
      })

      expect(result.current.formErrors.productName).toBe('Product name is required')
    })

    it('should validate productUrl on blur', () => {
      const { result } = renderHook(() => useAnalyzeForm())

      act(() => {
        result.current.updateField('productUrl', 'invalid')
      })

      act(() => {
        result.current.handleBlur('productUrl')
      })

      expect(result.current.formErrors.productUrl).toBe('Please enter a valid URL')
    })

    it('should validate species on blur', () => {
      const { result } = renderHook(() => useAnalyzeForm())

      act(() => {
        result.current.handleBlur('species')
      })

      expect(result.current.formErrors.species).toBe('Please select a species')
    })

    it('should validate breed on blur', () => {
      const { result } = renderHook(() => useAnalyzeForm())

      act(() => {
        result.current.updateField('breed', '1')
        result.current.handleBlur('breed')
      })

      expect(result.current.formErrors.breed).toBeTruthy()
    })

    it('should validate age on blur', () => {
      const { result } = renderHook(() => useAnalyzeForm())

      act(() => {
        result.current.handleBlur('age')
      })

      expect(result.current.formErrors.age).toBe('Age is required')
    })

    it('should validate ingredientsText on blur', () => {
      const { result } = renderHook(() => useAnalyzeForm())

      act(() => {
        result.current.enableManualIngredients()
      })

      act(() => {
        result.current.handleBlur('ingredientsText')
      })

      expect(result.current.formErrors.ingredientsText).toBeTruthy()
    })

    it('should not set error when validation passes', () => {
      const { result } = renderHook(() => useAnalyzeForm())

      act(() => {
        result.current.updateField('productName', 'Valid Product')
      })

      act(() => {
        result.current.handleBlur('productName')
      })

      expect(result.current.formErrors.productName).toBeUndefined()
    })
  })

  describe('validateForm function', () => {
    it('should return true when all fields valid', () => {
      const { result } = renderHook(() => useAnalyzeForm())

      act(() => {
        result.current.updateField('productName', 'Test Product')
        result.current.updateField('productUrl', 'https://example.com')
        result.current.updateField('species', 'Dog')
        result.current.updateField('breed', 'Labrador')
        result.current.updateField('age', 5)
      })

      let isValid = false
      act(() => {
        isValid = result.current.validateForm()
      })

      expect(isValid).toBe(true)
    })

    it('should return false when any field invalid', () => {
      const { result } = renderHook(() => useAnalyzeForm())

      act(() => {
        result.current.updateField('productName', '') // Invalid
        result.current.updateField('productUrl', 'https://example.com')
        result.current.updateField('species', 'Dog')
        result.current.updateField('breed', 'Labrador')
        result.current.updateField('age', 5)
      })

      let isValid = true
      act(() => {
        isValid = result.current.validateForm()
      })

      expect(isValid).toBe(false)
    })

    it('should collect all validation errors', () => {
      const { result } = renderHook(() => useAnalyzeForm())

      act(() => {
        result.current.validateForm()
      })

      expect(result.current.formErrors.productName).toBeTruthy()
      expect(result.current.formErrors.productUrl).toBeTruthy()
      expect(result.current.formErrors.species).toBeTruthy()
      expect(result.current.formErrors.breed).toBeTruthy()
      expect(result.current.formErrors.age).toBeTruthy()
    })

    it('should validate all required fields', () => {
      const { result } = renderHook(() => useAnalyzeForm())

      act(() => {
        result.current.validateForm()
      })

      // All required fields should have errors
      expect(Object.keys(result.current.formErrors).length).toBeGreaterThan(0)
    })

    it('should skip optional fields', () => {
      const { result } = renderHook(() => useAnalyzeForm())

      act(() => {
        result.current.updateField('productName', 'Test')
        result.current.updateField('productUrl', 'https://example.com')
        result.current.updateField('species', 'Dog')
        result.current.updateField('breed', 'Lab')
        result.current.updateField('age', 5)
        // additionalInfo is optional, left empty
        result.current.validateForm()
      })

      expect(result.current.formErrors.additionalInfo).toBeUndefined()
    })

    it('should set showValidationSummary when errors exist', () => {
      const { result } = renderHook(() => useAnalyzeForm())

      act(() => {
        result.current.validateForm()
      })

      expect(result.current.showValidationSummary).toBe(true)
    })

    it('should clear showValidationSummary when no errors', () => {
      const { result } = renderHook(() => useAnalyzeForm())

      // First validate with errors
      act(() => {
        result.current.validateForm()
      })

      expect(result.current.showValidationSummary).toBe(true)

      // Fix all errors
      act(() => {
        result.current.updateField('productName', 'Test Product')
        result.current.updateField('productUrl', 'https://example.com')
        result.current.updateField('species', 'Dog')
        result.current.updateField('breed', 'Labrador')
        result.current.updateField('age', 5)
      })

      // Validate again
      act(() => {
        result.current.validateForm()
      })

      expect(result.current.showValidationSummary).toBe(false)
    })

    it('should validate conditionally based on manual ingredients mode', () => {
      const { result } = renderHook(() => useAnalyzeForm())

      // Set up valid form
      act(() => {
        result.current.updateField('productName', 'Test')
        result.current.updateField('productUrl', 'https://example.com')
        result.current.updateField('species', 'Dog')
        result.current.updateField('breed', 'Lab')
        result.current.updateField('age', 5)
      })

      // Without manual mode - should pass without ingredients
      act(() => {
        result.current.validateForm()
      })

      expect(result.current.formErrors.ingredientsText).toBeUndefined()

      // With manual mode - should fail without ingredients
      act(() => {
        result.current.enableManualIngredients()
      })

      act(() => {
        result.current.validateForm()
      })

      expect(result.current.formErrors.ingredientsText).toBeTruthy()
    })
  })

  describe('manual ingredients logic', () => {
    describe('enableManualIngredients', () => {
      it('should set hasManualIngredients to true', () => {
        const { result } = renderHook(() => useAnalyzeForm())

        act(() => {
          result.current.enableManualIngredients()
        })

        expect(result.current.formValues.hasManualIngredients).toBe(true)
      })

      it('should set scrapeState to "manualReady"', () => {
        const { result } = renderHook(() => useAnalyzeForm())

        act(() => {
          result.current.enableManualIngredients()
        })

        expect(result.current.scrapeState).toBe('manualReady')
      })

      it('should make manual ingredients visible', () => {
        const { result } = renderHook(() => useAnalyzeForm())

        act(() => {
          result.current.enableManualIngredients()
        })

        expect(result.current.manualIngredientsState.isVisible).toBe(true)
      })
    })

    describe('resetManualIngredients', () => {
      it('should set hasManualIngredients to false', () => {
        const { result } = renderHook(() => useAnalyzeForm())

        act(() => {
          result.current.enableManualIngredients()
          result.current.resetManualIngredients()
        })

        expect(result.current.formValues.hasManualIngredients).toBe(false)
      })

      it('should clear ingredientsText', () => {
        const { result } = renderHook(() => useAnalyzeForm())

        act(() => {
          result.current.enableManualIngredients()
          result.current.updateManualIngredients('Some ingredients')
          result.current.resetManualIngredients()
        })

        expect(result.current.formValues.ingredientsText).toBe('')
      })

      it('should clear noIngredientsAvailable', () => {
        const { result } = renderHook(() => useAnalyzeForm())

        act(() => {
          result.current.enableManualIngredients()
          result.current.toggleNoIngredients(true)
          result.current.resetManualIngredients()
        })

        expect(result.current.formValues.noIngredientsAvailable).toBe(false)
      })

      it('should reset scrapeState to "idle"', () => {
        const { result } = renderHook(() => useAnalyzeForm())

        act(() => {
          result.current.enableManualIngredients()
          result.current.resetManualIngredients()
        })

        expect(result.current.scrapeState).toBe('idle')
      })
    })

    describe('updateManualIngredients', () => {
      it('should update ingredientsText value', () => {
        const { result } = renderHook(() => useAnalyzeForm())

        act(() => {
          result.current.enableManualIngredients()
          result.current.updateManualIngredients('Chicken, rice, vegetables')
        })

        expect(result.current.formValues.ingredientsText).toBe('Chicken, rice, vegetables')
      })

      it('should clear ingredientsText error', () => {
        const { result } = renderHook(() => useAnalyzeForm())

        act(() => {
          result.current.enableManualIngredients()
        })

        act(() => {
          result.current.handleBlur('ingredientsText') // Creates error
        })

        expect(result.current.formErrors.ingredientsText).toBeTruthy()

        act(() => {
          result.current.updateManualIngredients('New ingredients')
        })

        expect(result.current.formErrors.ingredientsText).toBeUndefined()
      })

      it('should not affect other form values', () => {
        const { result } = renderHook(() => useAnalyzeForm())

        act(() => {
          result.current.updateField('productName', 'Test Product')
          result.current.enableManualIngredients()
          result.current.updateManualIngredients('Ingredients')
        })

        expect(result.current.formValues.productName).toBe('Test Product')
      })
    })

    describe('toggleNoIngredients', () => {
      it('should set noIngredientsAvailable when checked', () => {
        const { result } = renderHook(() => useAnalyzeForm())

        act(() => {
          result.current.enableManualIngredients()
          result.current.toggleNoIngredients(true)
        })

        expect(result.current.formValues.noIngredientsAvailable).toBe(true)
      })

      it('should clear ingredientsText error when checked', () => {
        const { result } = renderHook(() => useAnalyzeForm())

        act(() => {
          result.current.enableManualIngredients()
        })

        act(() => {
          result.current.handleBlur('ingredientsText') // Creates error
        })

        expect(result.current.formErrors.ingredientsText).toBeTruthy()

        act(() => {
          result.current.toggleNoIngredients(true)
        })

        expect(result.current.formErrors.ingredientsText).toBeUndefined()
      })

      it('should unset noIngredientsAvailable when unchecked', () => {
        const { result } = renderHook(() => useAnalyzeForm())

        act(() => {
          result.current.enableManualIngredients()
          result.current.toggleNoIngredients(true)
          result.current.toggleNoIngredients(false)
        })

        expect(result.current.formValues.noIngredientsAvailable).toBe(false)
      })
    })

    describe('manualIngredientsState', () => {
      it('should reflect isVisible based on hasManualIngredients', () => {
        const { result } = renderHook(() => useAnalyzeForm())

        expect(result.current.manualIngredientsState.isVisible).toBe(false)

        act(() => {
          result.current.enableManualIngredients()
        })

        expect(result.current.manualIngredientsState.isVisible).toBe(true)
      })

      it('should reflect ingredientsText value', () => {
        const { result } = renderHook(() => useAnalyzeForm())

        act(() => {
          result.current.enableManualIngredients()
          result.current.updateManualIngredients('Test ingredients')
        })

        expect(result.current.manualIngredientsState.value).toBe('Test ingredients')
      })

      it('should reflect noIngredientsAvailable', () => {
        const { result } = renderHook(() => useAnalyzeForm())

        act(() => {
          result.current.enableManualIngredients()
          result.current.toggleNoIngredients(true)
        })

        expect(result.current.manualIngredientsState.noIngredientsAvailable).toBe(true)
      })
    })
  })

  describe('integration scenarios', () => {
    it('should handle complete form fill and validation', () => {
      const { result } = renderHook(() => useAnalyzeForm())

      act(() => {
        result.current.updateField('productName', 'Premium Dog Food')
        result.current.updateField('productUrl', 'https://example.com/product')
        result.current.updateField('species', 'Dog')
        result.current.updateField('breed', 'Golden Retriever')
        result.current.updateField('age', 5)
        result.current.updateField('additionalInfo', 'Very active')
      })

      let isValid = false
      act(() => {
        isValid = result.current.validateForm()
      })

      expect(isValid).toBe(true)
      expect(result.current.formErrors).toEqual({})
    })

    it('should handle switching between auto and manual ingredients', () => {
      const { result } = renderHook(() => useAnalyzeForm())

      // Start without manual
      expect(result.current.formValues.hasManualIngredients).toBe(false)

      // Enable manual
      act(() => {
        result.current.enableManualIngredients()
        result.current.updateManualIngredients('Chicken, rice')
      })

      expect(result.current.formValues.hasManualIngredients).toBe(true)
      expect(result.current.formValues.ingredientsText).toBe('Chicken, rice')

      // Reset to auto
      act(() => {
        result.current.resetManualIngredients()
      })

      expect(result.current.formValues.hasManualIngredients).toBe(false)
      expect(result.current.formValues.ingredientsText).toBe('')
    })

    it('should preserve form state when toggling manual mode', () => {
      const { result } = renderHook(() => useAnalyzeForm())

      act(() => {
        result.current.updateField('productName', 'Test Product')
        result.current.updateField('breed', 'Labrador')
        result.current.enableManualIngredients()
      })

      expect(result.current.formValues.productName).toBe('Test Product')
      expect(result.current.formValues.breed).toBe('Labrador')

      act(() => {
        result.current.resetManualIngredients()
      })

      expect(result.current.formValues.productName).toBe('Test Product')
      expect(result.current.formValues.breed).toBe('Labrador')
    })

    it('should handle validation errors across multiple fields', () => {
      const { result } = renderHook(() => useAnalyzeForm())

      act(() => {
        result.current.updateField('productName', 'A') // Too short
        result.current.updateField('productUrl', 'invalid') // Invalid URL
        result.current.updateField('breed', '123') // Only numbers
        result.current.updateField('age', 0.5) // Decimal
        result.current.validateForm()
      })

      expect(result.current.formErrors.productName).toBeTruthy()
      expect(result.current.formErrors.productUrl).toBeTruthy()
      expect(result.current.formErrors.breed).toBeTruthy()
      expect(result.current.formErrors.age).toBeTruthy()
    })

    it('should clear errors as user fixes them', () => {
      const { result } = renderHook(() => useAnalyzeForm())

      // Create errors
      act(() => {
        result.current.validateForm()
      })

      expect(Object.keys(result.current.formErrors).length).toBeGreaterThan(0)

      // Fix fields one by one
      act(() => {
        result.current.updateField('productName', 'Valid Product')
      })
      expect(result.current.formErrors.productName).toBeUndefined()

      act(() => {
        result.current.updateField('productUrl', 'https://example.com')
      })
      expect(result.current.formErrors.productUrl).toBeUndefined()

      act(() => {
        result.current.updateField('species', 'Dog')
      })
      expect(result.current.formErrors.species).toBeUndefined()

      act(() => {
        result.current.updateField('breed', 'Labrador')
      })
      expect(result.current.formErrors.breed).toBeUndefined()

      act(() => {
        result.current.updateField('age', 5)
      })
      expect(result.current.formErrors.age).toBeUndefined()
    })
  })
})


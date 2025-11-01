import { describe, it, expect } from 'vitest'
import { normalizeApiErrors } from '../../utils/normalizeApiErrors'
import type { ApiErrorResponse } from '../../types/auth'

describe('normalizeApiErrors', () => {
  describe('field error mapping', () => {
    it('should map array of field errors correctly', () => {
      const error: ApiErrorResponse = {
        status: 400,
        errors: [
          { field: 'email', message: 'Email is required' },
          { field: 'password', message: 'Password is too short' },
        ],
      }

      const result = normalizeApiErrors(error)

      expect(result).toEqual({
        email: 'Email is required',
        password: 'Password is too short',
      })
    })

    it('should use first error when multiple errors for same field', () => {
      const error: ApiErrorResponse = {
        status: 400,
        errors: [
          { field: 'email', message: 'First error' },
          { field: 'email', message: 'Second error' },
        ],
      }

      const result = normalizeApiErrors(error)

      expect(result.email).toBe('First error')
    })

    it('should use "form" as default field when field is null', () => {
      const error: ApiErrorResponse = {
        status: 400,
        errors: [{ message: 'General error' }],
      }

      const result = normalizeApiErrors(error)

      expect(result.form).toBe('General error')
    })

    it('should use "form" as default field when field is undefined', () => {
      const error: ApiErrorResponse = {
        status: 400,
        errors: [{ field: undefined, message: 'General error' }],
      }

      const result = normalizeApiErrors(error)

      expect(result.form).toBe('General error')
    })

    it('should map multiple different field errors', () => {
      const error: ApiErrorResponse = {
        status: 400,
        errors: [
          { field: 'email', message: 'Invalid email' },
          { field: 'password', message: 'Weak password' },
          { field: 'form', message: 'Form error' },
        ],
      }

      const result = normalizeApiErrors(error)

      expect(result).toEqual({
        email: 'Invalid email',
        password: 'Weak password',
        form: 'Form error',
      })
    })

    it('should preserve field names exactly as provided', () => {
      const error: ApiErrorResponse = {
        status: 400,
        errors: [
          { field: 'email', message: 'Email error' },
          { field: 'password', message: 'Password error' },
        ],
      }

      const result = normalizeApiErrors(error)

      expect(Object.keys(result)).toEqual(['email', 'password'])
    })
  })

  describe('top-level message handling', () => {
    it('should use top-level message as form error when no field errors exist', () => {
      const error: ApiErrorResponse = {
        status: 500,
        message: 'Server error occurred',
      }

      const result = normalizeApiErrors(error)

      expect(result.form).toBe('Server error occurred')
    })

    it('should NOT override existing form field error with top-level message', () => {
      const error: ApiErrorResponse = {
        status: 400,
        message: 'Top-level message',
        errors: [{ field: 'form', message: 'Form field error' }],
      }

      const result = normalizeApiErrors(error)

      expect(result.form).toBe('Form field error')
    })

    it('should add form error when field errors exist but no form error yet', () => {
      const error: ApiErrorResponse = {
        status: 400,
        message: 'General message',
        errors: [{ field: 'email', message: 'Email error' }],
      }

      const result = normalizeApiErrors(error)

      expect(result.form).toBe('General message')
      expect(result.email).toBe('Email error')
    })

    it('should handle message with only whitespace', () => {
      const error: ApiErrorResponse = {
        status: 500,
        message: '   ',
      }

      const result = normalizeApiErrors(error)

      // Whitespace message should still be set (function doesn't trim)
      expect(result.form).toBe('   ')
    })
  })

  describe('fallback error handling', () => {
    it('should provide default error when no errors or message provided', () => {
      const error: ApiErrorResponse = {
        status: 500,
      }

      const result = normalizeApiErrors(error)

      expect(result.form).toBe('Something went wrong. Please try again.')
    })

    it('should provide default error when errors array is empty', () => {
      const error: ApiErrorResponse = {
        status: 400,
        errors: [],
      }

      const result = normalizeApiErrors(error)

      expect(result.form).toBe('Something went wrong. Please try again.')
    })

    it('should not provide default error when field errors exist', () => {
      const error: ApiErrorResponse = {
        status: 400,
        errors: [{ field: 'email', message: 'Email error' }],
      }

      const result = normalizeApiErrors(error)

      expect(result).not.toEqual({
        email: 'Email error',
        form: 'Something went wrong. Please try again.',
      })
      // Should only have email error, no default form error
      expect(Object.keys(result)).toEqual(['email'])
    })

    it('should not provide default error when top-level message exists', () => {
      const error: ApiErrorResponse = {
        status: 500,
        message: 'Custom error',
      }

      const result = normalizeApiErrors(error)

      expect(result.form).toBe('Custom error')
      expect(result.form).not.toBe('Something went wrong. Please try again.')
    })
  })

  describe('edge cases', () => {
    it('should handle empty object input', () => {
      const error = {} as ApiErrorResponse

      const result = normalizeApiErrors(error)

      expect(result.form).toBe('Something went wrong. Please try again.')
    })

    it('should handle errors with empty message strings', () => {
      const error: ApiErrorResponse = {
        status: 400,
        errors: [{ field: 'email', message: '' }],
      }

      const result = normalizeApiErrors(error)

      // Empty message should still be set
      expect(result.email).toBe('')
    })

    it('should handle null errors array', () => {
      const error: ApiErrorResponse = {
        status: 500,
        errors: null as any,
      }

      const result = normalizeApiErrors(error)

      expect(result.form).toBe('Something went wrong. Please try again.')
    })

    it('should handle undefined errors array', () => {
      const error: ApiErrorResponse = {
        status: 500,
        errors: undefined,
      }

      const result = normalizeApiErrors(error)

      expect(result.form).toBe('Something went wrong. Please try again.')
    })

    it('should handle errors array that is not an array', () => {
      const error: ApiErrorResponse = {
        status: 500,
        errors: 'not an array' as any,
      }

      const result = normalizeApiErrors(error)

      // Should not crash, should provide default
      expect(result.form).toBe('Something went wrong. Please try again.')
    })

    it('should throw error when encountering null error object in array', () => {
      const error: ApiErrorResponse = {
        status: 400,
        errors: [
          null as any,
          { field: 'email', message: 'Valid error' },
        ],
      }

      // Current implementation doesn't handle null error objects
      // This documents actual behavior - would need defensive code to fix
      expect(() => normalizeApiErrors(error)).toThrow()
    })

    it('should return an object with at least one key', () => {
      const error: ApiErrorResponse = {
        status: 500,
      }

      const result = normalizeApiErrors(error)

      expect(Object.keys(result).length).toBeGreaterThan(0)
    })
  })
})


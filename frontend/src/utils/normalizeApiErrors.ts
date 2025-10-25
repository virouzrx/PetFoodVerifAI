import type { ApiErrorResponse, FieldErrorMap } from '../types/auth'

export const normalizeApiErrors = (error: ApiErrorResponse): FieldErrorMap => {
  const fieldErrors: FieldErrorMap = {}

  if (Array.isArray(error.errors)) {
    for (const err of error.errors) {
      const key = err.field ?? 'form'
      if (!fieldErrors[key]) {
        fieldErrors[key] = err.message
      }
    }
  }

  if (!fieldErrors.form && error.message) {
    fieldErrors.form = error.message
  }

  if (Object.keys(fieldErrors).length === 0) {
    fieldErrors.form = 'Something went wrong. Please try again.'
  }

  return fieldErrors
}

export default normalizeApiErrors


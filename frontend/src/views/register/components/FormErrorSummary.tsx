import { useEffect, useRef } from 'react'
import type { FieldErrorMap } from '../../../types/auth'

type FocusableField = keyof FieldErrorMap & 'email' | 'password'

type FormErrorSummaryProps = {
  errors: FieldErrorMap
  onFocusField?: (field: FocusableField) => void
}

const FormErrorSummary = ({ errors, onFocusField }: FormErrorSummaryProps) => {
  const alertRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (errors.form || errors.email || errors.password) {
      alertRef.current?.focus()
    }
  }, [errors])

  const focusableItems: Array<{ field: FocusableField; message: string }> = []
  if (errors.email) focusableItems.push({ field: 'email', message: errors.email })
  if (errors.password)
    focusableItems.push({ field: 'password', message: errors.password })

  const messages = [errors.form, ...focusableItems.map((item) => item.message)].filter(Boolean)

  if (messages.length === 0) {
    return null
  }

  return (
    <div
      role="alert"
      ref={alertRef}
      tabIndex={-1}
      className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 shadow-sm"
    >
      <p className="font-semibold">Please review the following:</p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {errors.form ? <li>{errors.form}</li> : null}
        {focusableItems.map((item) => (
          <li key={item.field}>
            <button
              type="button"
              className="underline decoration-dotted underline-offset-2 hover:text-indigo-600"
              onClick={() => onFocusField?.(item.field)}
            >
              {item.message}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default FormErrorSummary


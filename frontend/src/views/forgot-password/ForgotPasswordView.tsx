import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import useForgotPassword from '../../hooks/useForgotPassword'
import GlobalAlert from '../components/GlobalAlert'
import SubmitButton from '../register/components/SubmitButton'
import type { FieldErrorMap, ForgotPasswordRequestDto } from '../../types/auth'

type ForgotPasswordFormValues = ForgotPasswordRequestDto

const initialValues: ForgotPasswordFormValues = {
  email: '',
}

const validateEmail = (value: string) => {
  if (!value.trim()) {
    return 'Email is required.'
  }
  const normalized = value.trim().toLowerCase()
  const emailRegex = /^(?:[a-zA-Z0-9_'^&/+{}=!?$*%#`~.-]+)@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/
  if (!emailRegex.test(normalized)) {
    return 'Enter a valid email address.'
  }
  return undefined
}

const ForgotPasswordView = () => {
  const { submitForgotPassword, isLoading, error, clearError, isSuccess } = useForgotPassword()
  const [values, setValues] = useState<ForgotPasswordFormValues>(initialValues)
  const [fieldErrors, setFieldErrors] = useState<FieldErrorMap>({})
  const [touched, setTouched] = useState<Record<keyof ForgotPasswordFormValues, boolean>>({
    email: false,
  })
  const alertRef = useRef<HTMLDivElement>(null)

  const validationErrors = useMemo<FieldErrorMap>(() => {
    return {
      email: validateEmail(values.email),
    }
  }, [values])

  useEffect(() => {
    if (error.form && alertRef.current) {
      alertRef.current.focus()
    }
  }, [error.form])

  const updateValue = (field: keyof ForgotPasswordFormValues, value: string) => {
    clearError()
    setFieldErrors((prev) => ({ ...prev, form: undefined }))
    setValues((prev) => ({ ...prev, [field]: value }))
  }

  const handleBlur = (field: keyof ForgotPasswordFormValues) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    setFieldErrors((prev) => ({ ...prev, [field]: validationErrors[field] }))
  }

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      const newErrors: FieldErrorMap = {
        email: validateEmail(values.email),
      }

      if (newErrors.email) {
        setFieldErrors(newErrors)
        setTouched({ email: true })
        const focusElement = document.getElementById('email')
        focusElement?.focus()
        return
      }

      try {
        await submitForgotPassword(values)
      } catch (error) {
        console.error('Unhandled forgot password error', error)
      }
    },
    [submitForgotPassword, values],
  )

  const hasFormError = Boolean(error.form || fieldErrors.form)

  // Success state - show success message
  if (isSuccess) {
    return (
      <div className="min-h-screen">
        <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
          <main className="w-full max-w-md space-y-8 rounded-lg bg-brand-secondary px-5 py-8 shadow-xl border-2 border-brand-primary sm:px-8">
            <header className="space-y-2 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <svg
                  className="h-6 w-6 text-green-700"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h1 className="text-3xl font-semibold text-brand-dark">Check your email</h1>
            </header>

            <div className="space-y-4">
              <p className="text-sm text-gray-700 text-center">
                If an account with that email exists, we&apos;ve sent a password reset link. Please check your email and follow the instructions to reset your password.
              </p>
              <p className="text-xs text-gray-600 text-center">
                If you don&apos;t receive an email within a few minutes, please check your spam folder.
              </p>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <Link
                to="/login"
                className="block w-full rounded-lg bg-brand-primary px-4 py-3 text-center font-semibold text-white shadow-md hover:bg-brand-primary/90 transition-colors"
              >
                Back to sign in
              </Link>
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Form state - show form
  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <main className="w-full max-w-md space-y-8 rounded-lg bg-brand-secondary px-5 py-8 shadow-xl border-2 border-brand-primary sm:px-8">
          <header className="space-y-2 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-brand-primary">
              Password Reset
            </p>
            <h1 className="text-3xl font-semibold text-brand-dark">Forgot your password?</h1>
            <p className="text-sm text-gray-600">
              Enter your email address and we&apos;ll send you a link to reset your password.
            </p>
          </header>

          {hasFormError ? (
            <div tabIndex={-1} ref={alertRef} className="focus:outline-none">
              <GlobalAlert
                variant="error"
                message={error.form ?? fieldErrors.form ?? ''}
                onDismiss={() => {
                  clearError()
                  setFieldErrors((prev) => ({ ...prev, form: undefined }))
                }}
              />
            </div>
          ) : null}

          <form className="space-y-5" noValidate onSubmit={handleSubmit}>
            <div className="space-y-1">
              <label htmlFor="email" className="block text-sm font-semibold text-brand-dark">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={values.email}
                onChange={(event) => updateValue('email', event.target.value)}
                onBlur={() => handleBlur('email')}
                aria-invalid={Boolean((touched.email && fieldErrors.email) || error.email)}
                aria-describedby={
                  touched.email && (fieldErrors.email || error.email)
                    ? 'email-error'
                    : undefined
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm transition focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                disabled={isLoading}
              />
              {touched.email && (fieldErrors.email || error.email) ? (
                <p id="email-error" className="text-xs text-red-700">
                  {fieldErrors.email ?? error.email}
                </p>
              ) : null}
            </div>

            <SubmitButton
              isSubmitting={isLoading}
              label="Send reset link"
              loadingLabel="Sending..."
            />
          </form>

          <div className="border-t border-gray-200 pt-6">
            <Link
              to="/login"
              className="block text-center text-sm font-medium text-brand-primary hover:text-brand-primary/80 transition-colors"
            >
              Back to sign in
            </Link>
          </div>
        </main>
      </div>
    </div>
  )
}

export default ForgotPasswordView



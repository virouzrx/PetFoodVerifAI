import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import useResetPassword from '../../hooks/useResetPassword'
import usePasswordStrength from '../../hooks/usePasswordStrength'
import GlobalAlert from '../components/GlobalAlert'
import PasswordStrengthHint from '../register/components/PasswordStrengthHint'
import SubmitButton from '../register/components/SubmitButton'
import type { FieldErrorMap, ResetPasswordRequestDto } from '../../types/auth'

type ResetPasswordFormValues = ResetPasswordRequestDto

const validateEmail = (value: string) => {
  if (!value.trim()) {
    return 'Email is required.'
  }
  const normalized = value.trim().toLowerCase()
  const emailRegex =
    // eslint-disable-next-line no-control-regex
    /^(?:[a-zA-Z0-9_'^&\/+{}=!?$*%#`~.-]+)@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/
  if (!emailRegex.test(normalized)) {
    return 'Enter a valid email address.'
  }
  return undefined
}

const validatePassword = (value: string) => {
  if (!value) {
    return 'Password is required.'
  }
  if (value.length < 8) {
    return 'Password must be at least 8 characters long.'
  }
  if (!/[A-Z]/.test(value)) {
    return 'Password must contain an uppercase letter.'
  }
  if (!/[a-z]/.test(value)) {
    return 'Password must contain a lowercase letter.'
  }
  if (!/\d/.test(value)) {
    return 'Password must contain a digit.'
  }
  if (!/[^A-Za-z0-9]/.test(value)) {
    return 'Password must contain a special character.'
  }
  return undefined
}

const ResetPasswordView = () => {
  const [searchParams] = useSearchParams()
  const emailFromUrl = searchParams.get('email') ?? ''
  const tokenFromUrl = searchParams.get('token') ?? ''

  const { submitResetPassword, isLoading, error, clearError, isSuccess } = useResetPassword()
  const [values, setValues] = useState<ResetPasswordFormValues>({
    email: emailFromUrl,
    token: tokenFromUrl,
    newPassword: '',
  })
  const [fieldErrors, setFieldErrors] = useState<FieldErrorMap>({})
  const [touched, setTouched] = useState<Record<keyof ResetPasswordFormValues, boolean>>({
    email: false,
    token: false,
    newPassword: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const alertRef = useRef<HTMLDivElement>(null)

  const passwordStrength = usePasswordStrength(values.newPassword)

  useEffect(() => {
    if (emailFromUrl) {
      setValues((prev) => ({ ...prev, email: emailFromUrl }))
    }
    if (tokenFromUrl) {
      setValues((prev) => ({ ...prev, token: tokenFromUrl }))
    }
  }, [emailFromUrl, tokenFromUrl])

  const validationErrors = useMemo<FieldErrorMap>(() => {
    return {
      email: validateEmail(values.email),
      newPassword: validatePassword(values.newPassword),
      token: !values.token ? 'Reset token is missing.' : undefined,
    }
  }, [values])

  useEffect(() => {
    if (error.form && alertRef.current) {
      alertRef.current.focus()
    }
  }, [error.form])

  const updateValue = (field: keyof ResetPasswordFormValues, value: string) => {
    clearError()
    setFieldErrors((prev) => ({ ...prev, form: undefined }))
    setValues((prev) => ({ ...prev, [field]: value }))
  }

  const handleBlur = (field: keyof ResetPasswordFormValues) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    setFieldErrors((prev) => ({ ...prev, [field]: validationErrors[field] }))
  }

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      const newErrors: FieldErrorMap = {
        email: validateEmail(values.email),
        newPassword: validatePassword(values.newPassword),
        token: !values.token ? 'Reset token is missing.' : undefined,
      }

      if (newErrors.email || newErrors.newPassword || newErrors.token) {
        setFieldErrors(newErrors)
        setTouched({ email: true, token: true, newPassword: true })
        
        // Focus first field with error
        if (newErrors.email) {
          document.getElementById('email')?.focus()
        } else if (newErrors.newPassword) {
          document.getElementById('newPassword')?.focus()
        }
        return
      }

      try {
        await submitResetPassword(values)
      } catch (error) {
        console.error('Unhandled reset password error', error)
      }
    },
    [submitResetPassword, values],
  )

  const hasFormError = Boolean(error.form || fieldErrors.form)

  // Error state - missing token or email from URL
  if (!tokenFromUrl || !emailFromUrl) {
    return (
      <div className="min-h-screen">
        <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
          <main className="w-full max-w-md space-y-8 rounded-lg bg-brand-secondary px-5 py-8 shadow-xl border-2 border-brand-primary sm:px-8">
            <header className="space-y-2 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <svg
                  className="h-6 w-6 text-red-700"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h1 className="text-3xl font-semibold text-brand-dark">Invalid reset link</h1>
            </header>

            <div className="space-y-4">
              <p className="text-sm text-gray-700 text-center">
                The password reset link is invalid or incomplete. Please request a new password reset link.
              </p>
            </div>

            <div className="space-y-3">
              <Link
                to="/forgot-password"
                className="block w-full rounded-lg bg-brand-primary px-4 py-3 text-center font-semibold text-white shadow-md hover:bg-brand-primary/90 transition-colors"
              >
                Request new reset link
              </Link>
              <Link
                to="/login"
                className="block w-full text-center text-sm font-medium text-brand-primary hover:text-brand-primary/80 transition-colors"
              >
                Back to sign in
              </Link>
            </div>
          </main>
        </div>
      </div>
    )
  }

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
              <h1 className="text-3xl font-semibold text-brand-dark">Password reset successful</h1>
            </header>

            <div className="space-y-4">
              <p className="text-sm text-gray-700 text-center">
                Your password has been successfully reset. You can now sign in with your new password.
              </p>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <Link
                to="/login"
                className="block w-full rounded-lg bg-brand-primary px-4 py-3 text-center font-semibold text-white shadow-md hover:bg-brand-primary/90 transition-colors"
              >
                Sign in
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
            <h1 className="text-3xl font-semibold text-brand-dark">Create new password</h1>
            <p className="text-sm text-gray-600">
              Enter a strong password for your account.
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
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm transition focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30 bg-gray-50"
                disabled={isLoading}
                readOnly
              />
              {touched.email && (fieldErrors.email || error.email) ? (
                <p id="email-error" className="text-xs text-red-700">
                  {fieldErrors.email ?? error.email}
                </p>
              ) : null}
            </div>

            <div className="space-y-1">
              <label htmlFor="newPassword" className="block text-sm font-semibold text-brand-dark">
                New Password
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={values.newPassword}
                  onChange={(event) => updateValue('newPassword', event.target.value)}
                  onBlur={() => handleBlur('newPassword')}
                  aria-invalid={Boolean((touched.newPassword && fieldErrors.newPassword) || error.newPassword)}
                  aria-describedby={
                    (touched.newPassword && (fieldErrors.newPassword || error.newPassword))
                      ? 'newPassword-error'
                      : 'password-hint'
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm transition focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-brand-primary hover:text-brand-primary/80 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {touched.newPassword && (fieldErrors.newPassword || error.newPassword) ? (
                <p id="newPassword-error" className="text-xs text-red-700">
                  {fieldErrors.newPassword ?? error.newPassword}
                </p>
              ) : null}
              <div id="password-hint" className="mt-2 rounded-md border-2 border-brand-accent bg-brand-accent/20 p-3">
                <PasswordStrengthHint result={passwordStrength} />
              </div>
            </div>

            <SubmitButton
              isSubmitting={isLoading}
              label="Reset password"
              loadingLabel="Resetting..."
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

export default ResetPasswordView


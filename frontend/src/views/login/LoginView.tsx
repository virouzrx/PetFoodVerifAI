import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useLogin from '../../hooks/useLogin'
import GlobalAlert from '../components/GlobalAlert'
import AuthSwitchLink from '../register/components/AuthSwitchLink'
import SubmitButton from '../register/components/SubmitButton'
import type { FieldErrorMap, LoginRequestDto } from '../../types/auth'

type LoginFormValues = LoginRequestDto

const initialValues: LoginFormValues = {
  email: '',
  password: '',
}

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
    return 'Password must be at least 8 characters.'
  }
  return undefined
}

const LoginView = () => {
  const navigate = useNavigate()
  const { login, isLoading, error, clearError } = useLogin()
  const [values, setValues] = useState<LoginFormValues>(initialValues)
  const [fieldErrors, setFieldErrors] = useState<FieldErrorMap>({})
  const [touched, setTouched] = useState<Record<keyof LoginFormValues, boolean>>({
    email: false,
    password: false,
  })
  const alertRef = useRef<HTMLDivElement>(null)

  const validationErrors = useMemo<FieldErrorMap>(() => {
    return {
      email: validateEmail(values.email),
      password: validatePassword(values.password),
    }
  }, [values])

  useEffect(() => {
    if (error.form && alertRef.current) {
      alertRef.current.focus()
    }
  }, [error.form])

  const updateValue = (field: keyof LoginFormValues, value: string) => {
    clearError()
    setFieldErrors((prev) => ({ ...prev, form: undefined }))
    setValues((prev) => ({ ...prev, [field]: value }))
  }

  const handleBlur = (field: keyof LoginFormValues) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    setFieldErrors((prev) => ({ ...prev, [field]: validationErrors[field] }))
  }

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      const newErrors: FieldErrorMap = {
        email: validateEmail(values.email),
        password: validatePassword(values.password),
      }

      if (newErrors.email || newErrors.password) {
        setFieldErrors(newErrors)
        setTouched({ email: true, password: true })
        const focusField = newErrors.email ? 'email' : 'password'
        const focusElement = document.getElementById(focusField)
        focusElement?.focus()
        return
      }

      try {
        await login(values)
        setValues(initialValues)
        navigate('/analyze', { replace: true })
      } catch (error) {
        console.error('Unhandled login error', error)
      }
    },
    [login, navigate, values],
  )

  useEffect(() => {
    if (!isLoading) {
      setValues((prev) => ({ ...prev, password: '' }))
    }
  }, [isLoading])

  const hasFormError = Boolean(error.form || fieldErrors.form)

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <main className="w-full max-w-md space-y-8 rounded-lg bg-white px-5 py-8 shadow-sm ring-1 ring-slate-200 sm:px-8">
          <header className="space-y-2 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">
              Welcome back
            </p>
            <h1 className="text-3xl font-semibold text-slate-900">Sign in to continue</h1>
            <p className="text-sm text-slate-600">
              Access your saved analyses and manage your pet&apos;s nutrition insights.
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
              <label htmlFor="email" className="block text-sm font-semibold text-slate-800">
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
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                disabled={isLoading}
              />
              {touched.email && (fieldErrors.email || error.email) ? (
                <p id="email-error" className="text-xs text-rose-600">
                  {fieldErrors.email ?? error.email}
                </p>
              ) : null}
            </div>

            <div className="space-y-1">
              <label htmlFor="password" className="block text-sm font-semibold text-slate-800">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={values.password}
                onChange={(event) => updateValue('password', event.target.value)}
                onBlur={() => handleBlur('password')}
                aria-invalid={Boolean((touched.password && fieldErrors.password) || error.password)}
                aria-describedby={
                  touched.password && (fieldErrors.password || error.password)
                    ? 'password-error'
                    : undefined
                }
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                disabled={isLoading}
              />
              {touched.password && (fieldErrors.password || error.password) ? (
                <p id="password-error" className="text-xs text-rose-600">
                  {fieldErrors.password ?? error.password}
                </p>
              ) : null}
              <p className="text-xs text-slate-500">Password must be at least 8 characters.</p>
            </div>

            <SubmitButton
              isSubmitting={isLoading}
              label="Sign in"
              loadingLabel="Signing in..."
            />
          </form>

          <div className="border-t border-slate-200 pt-6">
            <AuthSwitchLink
              prompt="Don’t have an account?"
              label="Create one"
              to="/register"
            />
          </div>
        </main>
      </div>
    </div>
  )
}

export default LoginView



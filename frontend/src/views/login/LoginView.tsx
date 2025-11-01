import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useLogin from '../../hooks/useLogin'
import { useAuth } from '../../state/auth/AuthContext'
import GlobalAlert from '../components/GlobalAlert'
import AuthSwitchLink from '../register/components/AuthSwitchLink'
import SubmitButton from '../register/components/SubmitButton'
import type { FieldErrorMap, LoginRequestDto } from '../../types/auth'
import { googleLogin } from '../../services/authService'
import { useGoogleLogin } from '@react-oauth/google'

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
  const { login: setAuth } = useAuth()
  const { login, isLoading, error, clearError } = useLogin()
  const [values, setValues] = useState<LoginFormValues>(initialValues)
  const [fieldErrors, setFieldErrors] = useState<FieldErrorMap>({})
  const [touched, setTouched] = useState<Record<keyof LoginFormValues, boolean>>({
    email: false,
    password: false,
  })
  const alertRef = useRef<HTMLDivElement>(null)

  const [googleLoading, setGoogleLoading] = useState(false)
  const hasGoogleClient = !!import.meta.env.VITE_GOOGLE_CLIENT_ID

  const googleLoginHandler = useGoogleLogin({
    onSuccess: async (codeResponse) => {
      setGoogleLoading(true)
      try {
        console.log('Google response received:', codeResponse)
        console.log('Access token:', codeResponse.access_token?.substring(0, 20) + '...')
        const response = await googleLogin(codeResponse.access_token)
        console.log('Backend response:', response)
        setAuth(response.token, response.userId, response.email)
        console.log('Logged in, navigating to analyze...')
        navigate('/analyze', { replace: true })
      } catch (err: any) {
        console.error('Google login error:', err)
        const errorMsg = err?.message || 'Google login failed'
        clearError()
        setFieldErrors({ form: errorMsg })
      } finally {
        setGoogleLoading(false)
      }
    },
    onError: () => {
      console.error('Google popup error')
      clearError()
      setFieldErrors({ form: 'Google login failed. Please try again.' })
    },
    flow: 'implicit',
  })

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
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <main className="w-full max-w-md space-y-8 rounded-lg bg-brand-secondary px-5 py-8 shadow-xl border-2 border-brand-primary sm:px-8">
          <header className="space-y-2 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-brand-primary">
              Welcome back
            </p>
            <h1 className="text-3xl font-semibold text-brand-dark">Sign in to continue</h1>
            <p className="text-sm text-gray-600">
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

            <div className="space-y-1">
              <label htmlFor="password" className="block text-sm font-semibold text-brand-dark">
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
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm transition focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                disabled={isLoading}
              />
              {touched.password && (fieldErrors.password || error.password) ? (
                <p id="password-error" className="text-xs text-red-700">
                  {fieldErrors.password ?? error.password}
                </p>
              ) : null}
              <p className="text-xs text-gray-500">Password must be at least 8 characters.</p>
            </div>

            <SubmitButton
              isSubmitting={isLoading}
              label="Sign in"
              loadingLabel="Signing in..."
            />
          </form>

          <div className="border-t border-gray-200 pt-6 space-y-4">
            <button
              type="button"
              onClick={() => googleLoginHandler()}
              disabled={googleLoading || isLoading}
              className="w-full flex items-center justify-center gap-2 rounded-lg border-2 border-gray-300 px-4 py-3 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {googleLoading ? 'Signing in...' : 'Sign in with Google'}
            </button>

            <AuthSwitchLink
              prompt="Don't have an account?"
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



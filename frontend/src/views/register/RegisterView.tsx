import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthForm from './components/AuthForm'
import FormErrorSummary from './components/FormErrorSummary'
import AuthSwitchLink from './components/AuthSwitchLink'
import { registerUser, googleLogin } from '../../services/authService'
import normalizeApiErrors from '../../utils/normalizeApiErrors'
import type {
  ApiErrorResponse,
  FieldErrorMap,
  RegisterFormValues,
  RegisterRequestDto,
} from '../../types/auth'
import { useAuth } from '../../state/auth/AuthContext'
import { useGoogleLogin } from '@react-oauth/google'

const initialFormValues: RegisterFormValues = {
  email: '',
  password: '',
}

const isApiErrorResponse = (value: unknown): value is ApiErrorResponse => {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const record = value as Record<string, unknown>
  return typeof record.status === 'number'
}

const RegisterView = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [isSubmitting, setSubmitting] = useState(false)
  const [values, setValues] = useState<RegisterFormValues>(initialFormValues)
  const [errors, setErrors] = useState<FieldErrorMap>({})
  const [googleLoading, setGoogleLoading] = useState(false)
  // Commented: hasGoogleClient check

  const googleLoginHandler = useGoogleLogin({
    onSuccess: async (codeResponse) => {
      setGoogleLoading(true)
      try {
        console.log('Google response received:', codeResponse)
        console.log('Access token:', codeResponse.access_token?.substring(0, 20) + '...')
        const response = await googleLogin(codeResponse.access_token)
        console.log('Backend response:', response)
        login(response.token, response.userId, response.email)
        console.log('Logged in, navigating to analyze...')
        navigate('/analyze', { replace: true })
      } catch (err: unknown) {
        console.error('Google login error:', err)
        const errorMsg = err instanceof Error ? err.message : 'Google sign-up failed'
        setErrors({ form: errorMsg })
      } finally {
        setGoogleLoading(false)
      }
    },
    onError: () => {
      console.error('Google popup error')
      setErrors({ form: 'Google sign-up failed. Please try again.' })
    },
    flow: 'implicit',
  })

  const focusField = useCallback((field: keyof RegisterFormValues) => {
    requestAnimationFrame(() => {
      const element = document.getElementById(field)
      element?.focus()
    })
  }, [])

  const handleSubmit = async (formValues: RegisterFormValues) => {
    const payload: RegisterRequestDto = {
      email: formValues.email.trim().toLowerCase(),
      password: formValues.password,
    }

    setSubmitting(true)
    setErrors({})

    try {
      const response = await registerUser(payload)
      setValues(initialFormValues)
      
      // Redirect to email verification page with state
      navigate('/verify-email', {
        replace: true,
        state: {
          email: response.email,
          userId: response.userId,
          expiresAt: response.expiresAt.toISOString(),
        },
      })
    } catch (error) {
      if (isApiErrorResponse(error) && error.status === 409) {
        setErrors({ email: 'An account with this email already exists.' })
      } else if (isApiErrorResponse(error) && error.status === 429) {
        setErrors({ form: 'Too many attempts. Please wait and try again.' })
      } else {
        const normalized = normalizeApiErrors(
          isApiErrorResponse(error) ? error : undefined,
        )
        setErrors(normalized)
      }
    } finally {
      setSubmitting(false)
      setValues((prev) => ({ ...prev, password: '' }))
    }
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <main className="w-full max-w-md space-y-8 rounded-lg bg-brand-secondary px-5 py-8 shadow-xl border-2 border-brand-primary sm:px-8">
          <header className="space-y-2 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-brand-primary">Welcome</p>
            <h1 className="text-3xl font-semibold text-brand-dark">Create your account</h1>
            <p className="text-sm text-gray-600">
              Join PetFoodVerifAI to analyze pet food ingredients with confidence.
            </p>
          </header>

          <FormErrorSummary errors={errors} onFocusField={focusField} />

          <AuthForm
            initialValues={values}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            errors={errors}
            onChange={setValues}
          />

          <div className="space-y-4 border-t border-gray-200 pt-6">
            <button
              type="button"
              onClick={() => googleLoginHandler()}
              disabled={googleLoading || isSubmitting}
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
              {googleLoading ? 'Signing up...' : 'Sign up with Google'}
            </button>

            <AuthSwitchLink />
          </div>
        </main>
      </div>
    </div>
  )
}

export default RegisterView

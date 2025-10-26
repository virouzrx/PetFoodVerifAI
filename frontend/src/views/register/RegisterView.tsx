import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../state/auth/AuthContext'
import AuthForm from './components/AuthForm'
import FormErrorSummary from './components/FormErrorSummary'
import AuthSwitchLink from './components/AuthSwitchLink'
import { registerUser } from '../../services/authService'
import normalizeApiErrors from '../../utils/normalizeApiErrors'
import type {
  ApiErrorResponse,
  FieldErrorMap,
  RegisterFormValues,
  RegisterRequestDto,
} from '../../types/auth'

const initialFormValues: RegisterFormValues = {
  email: '',
  password: '',
}

const RegisterView = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [isSubmitting, setSubmitting] = useState(false)
  const [values, setValues] = useState<RegisterFormValues>(initialFormValues)
  const [errors, setErrors] = useState<FieldErrorMap>({})

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
      login(response.token, response.userId, payload.email)
      setValues(initialFormValues)
      navigate('/analyze', { replace: true })
    } catch (error) {
      const apiError = error as ApiErrorResponse
      if (apiError?.status === 409) {
        setErrors({ email: 'An account with this email already exists.' })
      } else if (apiError?.status === 429) {
        setErrors({ form: 'Too many attempts. Please wait and try again.' })
      } else {
        const normalized = normalizeApiErrors(apiError)
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
            onFocusField={focusField}
          />

          <AuthSwitchLink />
        </main>
      </div>
    </div>
  )
}

export default RegisterView


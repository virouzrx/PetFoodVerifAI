import { useEffect, useMemo, useState } from 'react'
import usePasswordStrength from '../../../hooks/usePasswordStrength'
import type { FieldErrorMap, RegisterFormValues } from '../../../types/auth'
import PasswordStrengthHint from './PasswordStrengthHint'
import SubmitButton from './SubmitButton'

type AuthFormProps = {
  initialValues?: RegisterFormValues
  onSubmit: (values: RegisterFormValues) => void
  onChange: (values: RegisterFormValues) => void
  isSubmitting: boolean
  errors: FieldErrorMap
  onFocusField?: (field: keyof RegisterFormValues) => void
}

const defaultValues: RegisterFormValues = {
  email: '',
  password: '',
}

const AuthForm = ({
  initialValues = defaultValues,
  onSubmit,
  onChange,
  isSubmitting,
  errors,
  onFocusField,
}: AuthFormProps) => {
  const [values, setValues] = useState<RegisterFormValues>(initialValues)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    setValues(initialValues)
  }, [initialValues])

  useEffect(() => {
    onChange(values)
  }, [onChange, values])

  const passwordStrength = usePasswordStrength(values.password)

  const isSubmitDisabled = useMemo(() => {
    return isSubmitting || !values.email.trim() || !values.password
  }, [isSubmitting, values.email, values.password])

  const handleBlur = (field: keyof RegisterFormValues) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  const handleChange = (field: keyof RegisterFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit(values)
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
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
          onChange={(event) => handleChange('email', event.target.value)}
          onBlur={() => handleBlur('email')}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? 'email-error' : undefined}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm transition focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-secondary/30"
        />
        {touched.email && errors.email && (
          <p id="email-error" className="text-xs text-rose-600">
            {errors.email}
          </p>
        )}
      </div>

      <div className="space-y-1">
        <label htmlFor="password" className="block text-sm font-semibold text-brand-dark">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            required
            value={values.password}
            onChange={(event) => handleChange('password', event.target.value)}
            onBlur={() => handleBlur('password')}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? 'password-error' : 'password-hint'}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm transition focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-secondary/30"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-brand-primary hover:text-brand-primary/80 focus:outline-none focus:ring-2 focus:ring-brand-secondary/30"
            onClick={() => setShowPassword((prev) => !prev)}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
        {errors.password && (
          <p id="password-error" className="text-xs text-rose-600">
            {errors.password}
          </p>
        )}
        <div id="password-hint" className="mt-2 rounded-md border border-brand-secondary/30 bg-brand-secondary/5 p-3">
          <PasswordStrengthHint result={passwordStrength} />
        </div>
      </div>

      <SubmitButton isSubmitting={isSubmitting} />
    </form>
  )
}

export default AuthForm


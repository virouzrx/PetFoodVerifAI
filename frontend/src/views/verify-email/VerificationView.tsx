import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../state/auth/AuthContext'
import { verifyEmail, resendVerificationEmail } from '../../services/authService'
import normalizeApiErrors from '../../utils/normalizeApiErrors'
import type { ApiErrorResponse, FieldErrorMap } from '../../types/auth'
import VerificationForm from './components/VerificationForm'
import FormErrorSummary from '../register/components/FormErrorSummary'

interface LocationState {
  email?: string
  userId?: string
  expiresAt?: string
}

const isLocationState = (value: unknown): value is LocationState => {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const record = value as Record<string, unknown>
  const emailValid = record.email === undefined || typeof record.email === 'string'
  const userIdValid = record.userId === undefined || typeof record.userId === 'string'
  const expiresAtValid = record.expiresAt === undefined || typeof record.expiresAt === 'string'

  return emailValid && userIdValid && expiresAtValid
}

const isApiErrorResponse = (value: unknown): value is ApiErrorResponse => {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const record = value as Record<string, unknown>
  return typeof record.status === 'number'
}

const VerificationView = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { login } = useAuth()
  const [searchParams] = useSearchParams()

  // Try to get email from state first, then use placeholder
  const state = isLocationState(location.state) ? location.state : null
  const email = state?.email || 'your email'
  
  // Get userId and token from query parameters
  const userId = searchParams.get('userId') || state?.userId || ''
  const tokenFromParams = searchParams.get('token') || ''
  
  const expiresAtIso = typeof state?.expiresAt === 'string' ? state.expiresAt : null

  const [isSubmitting, setSubmitting] = useState(false)
  const [isResending, setResending] = useState(false)
  const [verificationCode, setVerificationCode] = useState(tokenFromParams)
  const [errors, setErrors] = useState<FieldErrorMap>({})
  const [successMessage, setSuccessMessage] = useState('')
  const [timeRemaining, setTimeRemaining] = useState<string>('')
  const [emailForResend, setEmailForResend] = useState(email)

  // Redirect if no userId - but allow token from query params
  useEffect(() => {
    if (!userId) {
      navigate('/register', { replace: true })
    }
  }, [userId, navigate])

  // Countdown timer for token expiration
  useEffect(() => {
    if (!expiresAtIso) {
      setTimeRemaining('')
      return
    }

    const expiresAt = new Date(expiresAtIso)
    const updateCountdown = () => {
      const now = new Date()
      const diff = expiresAt.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeRemaining('Expired')
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`)
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [expiresAtIso])

  // Auto-submit if token is already present from URL query params
  useEffect(() => {
    if (tokenFromParams && !isSubmitting) {
      // Create a synthetic form event and submit
      const submitForm = async () => {
        setSubmitting(true)
        setErrors({})
        setSuccessMessage('')

        try {
          const response = await verifyEmail(userId, tokenFromParams)

          if (response.token) {
            setSuccessMessage('Email verified successfully!')
            login(response.token, response.userId, response.email)
            setTimeout(() => {
              navigate('/analyze', { replace: true })
            }, 1000)
          }
        } catch (error) {
          if (isApiErrorResponse(error) && error.status === 400) {
            setErrors({ form: 'Invalid or expired verification token. Please try again or request a new email.' })
          } else {
            const normalized = normalizeApiErrors(
              isApiErrorResponse(error) ? error : undefined,
            )
            setErrors(normalized)
          }
        } finally {
          setSubmitting(false)
        }
      }

      submitForm()
    }
  }, [tokenFromParams, userId, login, navigate, isSubmitting])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setErrors({})
    setSuccessMessage('')

    try {
      const response = await verifyEmail(userId, verificationCode)

      if (response.token) {
        setSuccessMessage('Email verified successfully!')
        login(response.token, response.userId, response.email)
        setTimeout(() => {
          navigate('/analyze', { replace: true })
        }, 1000)
      }
    } catch (error) {
      if (isApiErrorResponse(error) && error.status === 400) {
        setErrors({ form: 'Invalid or expired verification token. Please try again or request a new email.' })
      } else {
        const normalized = normalizeApiErrors(
          isApiErrorResponse(error) ? error : undefined,
        )
        setErrors(normalized)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleResendEmail = async () => {
    setResending(true)
    setErrors({})
    setSuccessMessage('')

    try {
      await resendVerificationEmail(emailForResend)
      setSuccessMessage('Verification email sent! Check your inbox.')
      setVerificationCode('')
    } catch (error) {
      if (isApiErrorResponse(error)) {
        setErrors({ form: error.message || 'Failed to resend verification email. Please try again.' })
      } else if (error instanceof Error) {
        setErrors({ form: error.message })
      } else {
        setErrors({ form: 'Failed to resend verification email. Please try again.' })
      }
    } finally {
      setResending(false)
    }
  }

  const focusField = (field: string) => {
    requestAnimationFrame(() => {
      const element = document.getElementById(field)
      element?.focus()
    })
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <main className="w-full max-w-md space-y-8 rounded-lg bg-brand-secondary px-5 py-8 shadow-xl border-2 border-brand-primary sm:px-8">
          <header className="space-y-2 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-brand-primary">Step 2 of 2</p>
            <h1 className="text-3xl font-semibold text-brand-dark">Verify your email</h1>
            <p className="text-sm text-gray-600">
              We sent a verification code to <span className="font-semibold">{email}</span>
            </p>
          </header>

          {timeRemaining && (
            <div className="rounded-lg bg-blue-50 p-4 text-center border border-blue-200">
              <p className="text-sm text-gray-700">
                Token expires in: <span className="font-semibold text-blue-600">{timeRemaining}</span>
              </p>
            </div>
          )}

          {successMessage && (
            <div className="rounded-lg bg-green-50 p-4 text-center border border-green-200">
              <p className="text-sm font-medium text-green-800">{successMessage}</p>
            </div>
          )}

          <FormErrorSummary errors={errors} onFocusField={focusField} />

          <VerificationForm
            verificationCode={verificationCode}
            onChange={setVerificationCode}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            errors={errors}
          />

          <div className="space-y-4 border-t border-gray-200 pt-6">
            <p className="text-center text-sm text-gray-600">Didn't receive the email?</p>
            {email === 'your email' ? (
              <>
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={emailForResend}
                  onChange={(e) => setEmailForResend(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
                <button
                  onClick={handleResendEmail}
                  disabled={isResending || !emailForResend}
                  className="w-full rounded-lg bg-gray-200 px-4 py-2 font-medium text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isResending ? 'Sending...' : 'Resend verification email'}
                </button>
              </>
            ) : (
              <button
                onClick={handleResendEmail}
                disabled={isResending}
                className="w-full rounded-lg bg-gray-200 px-4 py-2 font-medium text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isResending ? 'Sending...' : 'Resend verification email'}
              </button>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default VerificationView

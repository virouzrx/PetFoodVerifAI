import { useCallback, useMemo, useRef, useState } from 'react'
import { forgotPassword } from '../services/authService'
import normalizeApiErrors from '../utils/normalizeApiErrors'
import type {
  FieldErrorMap,
  ForgotPasswordRequestDto,
  ApiErrorResponse,
} from '../types/auth'

const MIN_LOADING_DURATION_MS = 600

export type UseForgotPasswordResult = {
  submitForgotPassword: (values: ForgotPasswordRequestDto) => Promise<void>
  isLoading: boolean
  error: FieldErrorMap
  clearError: () => void
  isSuccess: boolean
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const useForgotPassword = (): UseForgotPasswordResult => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<FieldErrorMap>({})
  const [isSuccess, setIsSuccess] = useState(false)
  const latestRequest = useRef(0)

  const submitForgotPassword = useCallback(
    async (values: ForgotPasswordRequestDto) => {
      const startedAt = Date.now()
      const requestId = startedAt
      latestRequest.current = requestId
      setIsLoading(true)
      setError({})
      setIsSuccess(false)

      try {
        await forgotPassword({
          email: values.email.trim().toLowerCase(),
        })

        if (latestRequest.current !== requestId) {
          return
        }

        await sleep(Math.max(0, MIN_LOADING_DURATION_MS - (Date.now() - startedAt)))
        setIsSuccess(true)
      } catch (error) {
        if (latestRequest.current !== requestId) {
          return
        }

        let fieldErrors: FieldErrorMap = {}
        const apiError = error as ApiErrorResponse
        
        if (apiError?.status === 400) {
          fieldErrors = normalizeApiErrors(apiError)
        } else if (apiError?.status === 429) {
          fieldErrors.form = 'Too many attempts. Please wait and try again.'
        } else {
          fieldErrors.form = 'Unable to process your request. Please try again later.'
        }

        await sleep(Math.max(0, MIN_LOADING_DURATION_MS - (Date.now() - startedAt)))
        setError(fieldErrors)
      } finally {
        if (latestRequest.current === requestId) {
          setIsLoading(false)
        }
      }
    },
    [],
  )

  const clearError = useCallback(() => {
    setError({})
  }, [])

  return useMemo(
    () => ({
      submitForgotPassword,
      isLoading,
      error,
      clearError,
      isSuccess,
    }),
    [submitForgotPassword, isLoading, error, clearError, isSuccess],
  )
}

export default useForgotPassword


import { useCallback, useMemo, useRef, useState } from 'react'
import { resetPassword } from '../services/authService'
import normalizeApiErrors from '../utils/normalizeApiErrors'
import type {
  FieldErrorMap,
  ResetPasswordRequestDto,
  ApiErrorResponse,
} from '../types/auth'

const MIN_LOADING_DURATION_MS = 600

export type UseResetPasswordResult = {
  submitResetPassword: (values: ResetPasswordRequestDto) => Promise<void>
  isLoading: boolean
  error: FieldErrorMap
  clearError: () => void
  isSuccess: boolean
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const useResetPassword = (): UseResetPasswordResult => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<FieldErrorMap>({})
  const [isSuccess, setIsSuccess] = useState(false)
  const latestRequest = useRef(0)

  const submitResetPassword = useCallback(
    async (values: ResetPasswordRequestDto) => {
      const startedAt = Date.now()
      const requestId = startedAt
      latestRequest.current = requestId
      setIsLoading(true)
      setError({})
      setIsSuccess(false)

      try {
        await resetPassword({
          email: values.email.trim().toLowerCase(),
          token: values.token.trim(),
          newPassword: values.newPassword,
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
      submitResetPassword,
      isLoading,
      error,
      clearError,
      isSuccess,
    }),
    [submitResetPassword, isLoading, error, clearError, isSuccess],
  )
}

export default useResetPassword


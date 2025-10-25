import { useCallback, useMemo, useRef, useState } from 'react'
import { loginUser } from '../services/authService'
import normalizeApiErrors from '../utils/normalizeApiErrors'
import { useAuth } from '../state/auth/AuthContext'
import type {
  FieldErrorMap,
  LoginRequestDto,
  ApiErrorResponse,
} from '../types/auth'

const MIN_LOADING_DURATION_MS = 600

export type UseLoginResult = {
  login: (values: LoginRequestDto) => Promise<void>
  isLoading: boolean
  error: FieldErrorMap
  clearError: () => void
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const useLogin = (): UseLoginResult => {
  const { login: setAuth } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<FieldErrorMap>({})
  const latestRequest = useRef(0)

  const login = useCallback(
    async (values: LoginRequestDto) => {
      const startedAt = Date.now()
      const requestId = startedAt
      latestRequest.current = requestId
      setIsLoading(true)
      setError({})

      try {
        const response = await loginUser({
          email: values.email.trim().toLowerCase(),
          password: values.password,
        })

        if (latestRequest.current !== requestId) {
          return
        }

        await sleep(Math.max(0, MIN_LOADING_DURATION_MS - (Date.now() - startedAt)))
        setAuth(response.token, response.userId)
      } catch (error) {
        if (latestRequest.current !== requestId) {
          return
        }

        let fieldErrors: FieldErrorMap = {}
        const apiError = error as ApiErrorResponse
        if (apiError?.status === 400 || apiError?.status === 401) {
          fieldErrors.form = 'We couldn\'t sign you in. Check your credentials and try again.'
        } else if (apiError?.status === 429) {
          fieldErrors.form = 'Too many attempts. Please wait and try again.'
        } else {
          fieldErrors = normalizeApiErrors(apiError)
        }

        await sleep(Math.max(0, MIN_LOADING_DURATION_MS - (Date.now() - startedAt)))
        setError(fieldErrors)
      } finally {
        if (latestRequest.current === requestId) {
          setIsLoading(false)
        }
      }
    },
    [setAuth],
  )

  const clearError = useCallback(() => {
    setError({})
  }, [])

  return useMemo(
    () => ({
      login,
      isLoading,
      error,
      clearError,
    }),
    [login, isLoading, error, clearError],
  )
}

export default useLogin


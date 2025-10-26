import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

// ============================================================================
// Types
// ============================================================================

export type SessionExpiredState = {
  isExpired: boolean
  message: string
  triggeredAt: number
  returnPath?: string
  sourceRequest?: string
}

export type SessionExpiredContextValue = {
  state: SessionExpiredState
  triggerExpiry: (payload?: Partial<SessionExpiredState>) => void
  clearExpiry: () => void
  setReturnPath: (path: string) => void
}

export type UnauthorizedInterceptorOptions = {
  ignorePaths?: string[]
  navigate?: (path: string) => void
}

// ============================================================================
// Context
// ============================================================================

const SessionExpiredContext = createContext<SessionExpiredContextValue | undefined>(
  undefined,
)

// ============================================================================
// Initial State
// ============================================================================

const initialState: SessionExpiredState = {
  isExpired: false,
  message: '',
  triggeredAt: 0,
  returnPath: undefined,
  sourceRequest: undefined,
}

const DEFAULT_EXPIRY_MESSAGE = 'Your session has expired. Please log in again.'

// ============================================================================
// Storage Key
// ============================================================================

const SESSION_EXPIRY_KEY = 'pfv_session_expired'

// ============================================================================
// Utility: Load/Persist Minimal Flag
// ============================================================================

const loadPersistedExpiry = (): boolean => {
  if (typeof window === 'undefined') return false
  try {
    const raw = window.sessionStorage.getItem(SESSION_EXPIRY_KEY)
    return raw === 'true'
  } catch (error) {
    console.warn('Failed to load session expiry flag', error)
    return false
  }
}

const persistExpiry = (isExpired: boolean) => {
  if (typeof window === 'undefined') return
  try {
    if (isExpired) {
      window.sessionStorage.setItem(SESSION_EXPIRY_KEY, 'true')
    } else {
      window.sessionStorage.removeItem(SESSION_EXPIRY_KEY)
    }
  } catch (error) {
    console.warn('Failed to persist session expiry flag', error)
  }
}

// ============================================================================
// Utility: Sanitize Return Path
// ============================================================================

const sanitizeReturnPath = (path?: string): string | undefined => {
  if (!path) return undefined
  // Ensure same-origin path: starts with '/' but not '//'
  if (path.startsWith('/') && !path.startsWith('//')) {
    return path
  }
  return undefined
}

// ============================================================================
// Provider Component
// ============================================================================

export const SessionExpiredProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<SessionExpiredState>(() => {
    const wasExpired = loadPersistedExpiry()
    return wasExpired
      ? {
          ...initialState,
          isExpired: true,
          message: DEFAULT_EXPIRY_MESSAGE,
          triggeredAt: Date.now(),
        }
      : initialState
  })

  // Persist expiry flag to sessionStorage whenever it changes
  useEffect(() => {
    persistExpiry(state.isExpired)
  }, [state.isExpired])

  const triggerExpiry = useCallback(
    (payload?: Partial<SessionExpiredState>) => {
      setState((prev) => {
        // Prevent re-trigger if already expired unless message changes
        if (prev.isExpired && payload?.message === prev.message) {
          return prev
        }

        return {
          isExpired: true,
          message: payload?.message || DEFAULT_EXPIRY_MESSAGE,
          triggeredAt: Date.now(),
          returnPath: sanitizeReturnPath(payload?.returnPath) ?? prev.returnPath,
          sourceRequest: payload?.sourceRequest ?? prev.sourceRequest,
        }
      })
    },
    [],
  )

  const clearExpiry = useCallback(() => {
    setState(initialState)
  }, [])

  const setReturnPath = useCallback((path: string) => {
    const sanitized = sanitizeReturnPath(path)
    if (sanitized) {
      setState((prev) => ({ ...prev, returnPath: sanitized }))
    }
  }, [])

  const value = useMemo(
    () => ({
      state,
      triggerExpiry,
      clearExpiry,
      setReturnPath,
    }),
    [state, triggerExpiry, clearExpiry, setReturnPath],
  )

  return (
    <SessionExpiredContext.Provider value={value}>
      {children}
    </SessionExpiredContext.Provider>
  )
}

// ============================================================================
// Hook: useSessionExpiredContext
// ============================================================================

export const useSessionExpiredContext = () => {
  const context = useContext(SessionExpiredContext)
  if (!context) {
    throw new Error(
      'useSessionExpiredContext must be used within a SessionExpiredProvider',
    )
  }
  return context
}

// ============================================================================
// Hook: useSessionExpiry (with interceptor logic)
// ============================================================================

export type UseSessionExpiryResult = {
  isExpired: boolean
  message: string
  returnPath?: string
  clearExpiry: () => void
  handleLoginRedirect: () => void
}

export const useSessionExpiry = (
  options?: UnauthorizedInterceptorOptions,
): UseSessionExpiryResult => {
  const { state, triggerExpiry, clearExpiry, setReturnPath } =
    useSessionExpiredContext()
  const location = useLocation()
  const navigate = useNavigate()
  const interceptorRegisteredRef = useRef(false)

  // Update return path when location changes and session is expired
  useEffect(() => {
    if (state.isExpired && location.pathname) {
      const publicPaths = ['/login', '/register', '/']
      if (!publicPaths.includes(location.pathname)) {
        setReturnPath(location.pathname)
      }
    }
  }, [location.pathname, state.isExpired, setReturnPath])

  // Register fetch interceptor once
  useEffect(() => {
    if (interceptorRegisteredRef.current) return

    const originalFetch = window.fetch
    const ignorePaths = options?.ignorePaths ?? []

    // Wrap fetch to intercept 401 responses
    window.fetch = async (...args: Parameters<typeof fetch>) => {
      const response = await originalFetch(...args)

      // Check if this is a 401 response from API
      if (response.status === 401) {
        const requestInput = args[0]
        const url =
          typeof requestInput === 'string'
            ? requestInput
            : requestInput instanceof Request
              ? requestInput.url
              : requestInput.toString()
        const isApiRequest = url.includes('/api/')
        const isIgnoredPath = ignorePaths.some((path) => url.includes(path))

        // Only trigger expiry for API requests that aren't explicitly ignored
        if (isApiRequest && !isIgnoredPath) {
          // Avoid triggering on login/register endpoints
          if (!url.includes('/auth/login') && !url.includes('/auth/register')) {
            triggerExpiry({
              message: DEFAULT_EXPIRY_MESSAGE,
              sourceRequest: url,
              returnPath: location.pathname,
            })
          }
        }
      }

      return response
    }

    interceptorRegisteredRef.current = true

    // Cleanup: restore original fetch on unmount
    return () => {
      window.fetch = originalFetch
      interceptorRegisteredRef.current = false
    }
  }, [triggerExpiry, location.pathname, options?.ignorePaths])

  // Handle login redirect with return URL
  const handleLoginRedirect = useCallback(() => {
    try {
      // Clear auth tokens from localStorage
      window.localStorage.removeItem('pfvauth')
    } catch (error) {
      console.warn('Failed to clear auth storage', error)
    }

    const returnUrl = state.returnPath || location.pathname
    const publicPaths = ['/login', '/register', '/']
    const shouldPreserveReturn = !publicPaths.includes(returnUrl)

    if (shouldPreserveReturn && returnUrl !== '/login') {
      navigate(`/login?returnUrl=${encodeURIComponent(returnUrl)}`)
    } else {
      navigate('/login')
    }
  }, [state.returnPath, location.pathname, navigate])

  return {
    isExpired: state.isExpired,
    message: state.message,
    returnPath: state.returnPath,
    clearExpiry,
    handleLoginRedirect,
  }
}


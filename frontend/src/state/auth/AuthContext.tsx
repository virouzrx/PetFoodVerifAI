import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
} from 'react'
import type { AuthState } from '../../types/auth'

type AuthContextValue = {
  state: AuthState
  login: (token: string, userId: string) => void
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const STORAGE_KEY = 'pfvauth'

const loadPersistedState = (): AuthState => {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw)
  } catch (error) {
    console.warn('Failed to parse auth state from storage', error)
    return {}
  }
}

const persistState = (state: AuthState) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (error) {
    console.warn('Failed to persist auth state', error)
  }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<AuthState>(() => loadPersistedState())

  useEffect(() => {
    persistState(state)
  }, [state])

  const login = useCallback((token: string, userId: string) => {
    setState({ token, user: { userId } })
  }, [])

  const logout = useCallback(() => {
    setState({})
  }, [])

  const value = useMemo(
    () => ({
      state,
      login,
      logout,
      isAuthenticated: Boolean(state.token),
    }),
    [state, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}


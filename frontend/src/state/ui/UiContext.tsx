import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type AlertSeverity = 'info' | 'success' | 'warning' | 'error'

export type AlertMessage = {
  id: string
  severity: AlertSeverity
  title?: string
  message: string
  autoDismiss?: boolean
  dismissAfter?: number
}

export type LoadingState = {
  isGlobalLoading: boolean
  label?: string
}

export type GlobalUiState = {
  alerts: AlertMessage[]
  loading: LoadingState
}

type UiContextValue = {
  alerts: AlertMessage[]
  addAlert: (alert: Omit<AlertMessage, 'id'>) => void
  removeAlert: (id: string) => void
  loading: LoadingState
  setLoading: (loading: LoadingState) => void
}

const UiContext = createContext<UiContextValue | undefined>(undefined)

export const UiProvider = ({ children }: { children: ReactNode }) => {
  const [alerts, setAlerts] = useState<AlertMessage[]>([])
  const [loading, setLoadingState] = useState<LoadingState>({
    isGlobalLoading: false,
  })

  const addAlert = useCallback(
    (alert: Omit<AlertMessage, 'id'>) => {
      const id = `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const newAlert: AlertMessage = { ...alert, id }

      setAlerts((prev) => [...prev, newAlert])

      // Auto-dismiss if configured
      if (alert.autoDismiss !== false) {
        const timeout = alert.dismissAfter ?? 5000
        setTimeout(() => {
          setAlerts((prev) => prev.filter((a) => a.id !== id))
        }, timeout)
      }
    },
    [],
  )

  const removeAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id))
  }, [])

  const setLoading = useCallback((newLoading: LoadingState) => {
    setLoadingState(newLoading)
  }, [])

  const value = useMemo(
    () => ({
      alerts,
      addAlert,
      removeAlert,
      loading,
      setLoading,
    }),
    [alerts, addAlert, removeAlert, loading, setLoading],
  )

  return <UiContext.Provider value={value}>{children}</UiContext.Provider>
}

export const useUiState = () => {
  const context = useContext(UiContext)
  if (!context) {
    throw new Error('useUiState must be used within a UiProvider')
  }
  return context
}


import { useEffect, type ReactNode } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../state/auth/AuthContext'
import { useUiState } from '../state/ui/UiContext'
import SkipToContentLink from './components/SkipToContentLink'
import AppHeader from './components/AppHeader'
import GlobalAlertArea from './components/GlobalAlertArea'
import LoadingBar from './components/LoadingBar'

export type AuthenticatedShellProps = {
  children?: ReactNode
}

const AuthenticatedShell = ({ children }: AuthenticatedShellProps) => {
  const { isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { alerts, removeAlert, loading } = useUiState()

  // Auth guard: redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true })
    }
  }, [isAuthenticated, navigate])

  // Focus management: move focus to main content when location changes
  useEffect(() => {
    const mainElement = document.getElementById('main-content')
    if (mainElement && document.activeElement?.id === 'skip-to-content') {
      mainElement.focus()
    }
  }, [location.pathname])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Don't render shell if not authenticated (during redirect)
  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col bg-brand-tertiary">
      <SkipToContentLink targetId="main-content" />
      
      <AppHeader
        currentPath={location.pathname}
        onLogout={handleLogout}
      />
      
      <LoadingBar
        isActive={loading.isGlobalLoading}
        label={loading.label}
      />
      
      <GlobalAlertArea
        alerts={alerts}
        onDismiss={removeAlert}
      />
      
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 focus:outline-none"
      >
        <Outlet />
        {children}
      </main>
    </div>
  )
}

export default AuthenticatedShell


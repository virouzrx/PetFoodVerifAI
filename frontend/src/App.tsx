import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './state/auth/AuthContext'
import { lazy, Suspense, type ReactNode } from 'react'
import LandingView from './views/LandingView'
import LoginView from './views/login/LoginView'
import RegisterView from './views/register/RegisterView'

const AnalyzeView = lazy(() => import('./views/AnalyzeView'))

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}

const RedirectIfAuthenticated = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth()
  if (isAuthenticated) {
    return <Navigate to="/analyze" replace />
  }
  return <>{children}</>
}

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingView />} />
        <Route
          path="/register"
          element={
            <RedirectIfAuthenticated>
              <RegisterView />
            </RedirectIfAuthenticated>
          }
        />
        <Route
          path="/login"
          element={
            <RedirectIfAuthenticated>
              <LoginView />
            </RedirectIfAuthenticated>
          }
        />
        <Route
          path="/analyze"
          element={
            <ProtectedRoute>
              <Suspense fallback={<div className="p-6">Loading...</div>}>
                <AnalyzeView />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

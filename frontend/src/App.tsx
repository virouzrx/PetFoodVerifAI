import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './state/auth/AuthContext'
import { lazy, Suspense, type ReactNode } from 'react'
import LandingView from './views/LandingView'
import LoginView from './views/login/LoginView'
import RegisterView from './views/register/RegisterView'
import AuthenticatedShell from './layouts/AuthenticatedShell'
import NotFoundRoute from './views/not-found/NotFoundRoute'

const AnalyzeView = lazy(() => import('./views/AnalyzeView'))
const ResultsView = lazy(() => import('./views/ResultsView'))

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
        
        {/* Authenticated routes wrapped in shell */}
        <Route element={<AuthenticatedShell />}>
          <Route
            path="/analyze"
            element={
              <Suspense fallback={<div className="p-6">Loading...</div>}>
                <AnalyzeView />
              </Suspense>
            }
          />
          <Route
            path="/results/:analysisId"
            element={
              <Suspense fallback={<div className="p-6">Loading...</div>}>
                <ResultsView />
              </Suspense>
            }
          />
          <Route
            path="/products"
            element={
              <Suspense fallback={<div className="p-6">Loading...</div>}>
                <div className="p-8">
                  <h1 className="text-2xl font-bold">My Products</h1>
                  <p className="mt-4 text-gray-600">Product listing coming soon...</p>
                </div>
              </Suspense>
            }
          />
        </Route>
        
        {/* 404 Not Found route */}
        <Route path="/404" element={<NotFoundRoute />} />
        
        {/* Catch-all redirect to 404 */}
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

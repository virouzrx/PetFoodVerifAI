import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { PrimaryCTAButtonsProps } from '../../types/landing'

const PrimaryCTAButtons = ({
  loginPath,
  registerPath,
  onLogin,
  onRegister,
}: PrimaryCTAButtonsProps) => {
  const navigate = useNavigate()

  const handleRegister = useCallback(() => {
    onRegister?.()
    navigate(registerPath)
  }, [navigate, onRegister, registerPath])

  const handleLogin = useCallback(() => {
    onLogin?.()
    navigate(loginPath)
  }, [loginPath, navigate, onLogin])

  return (
    <nav aria-label="Primary call to action" className="flex flex-col gap-4 text-center sm:flex-row sm:justify-center">
      <button
        className="inline-flex items-center justify-center rounded-full bg-brand-primary px-8 py-3 text-base font-semibold text-white shadow-md transition hover:bg-brand-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
        onClick={handleRegister}
        type="button"
      >
        Create account
      </button>
      <button
        className="inline-flex items-center justify-center rounded-full border-2 border-white bg-white px-8 py-3 text-base font-semibold text-brand-primary shadow-md transition hover:bg-brand-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        onClick={handleLogin}
        type="button"
      >
        Sign in
      </button>
    </nav>
  )
}

export default PrimaryCTAButtons


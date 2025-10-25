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
        className="inline-flex items-center justify-center rounded-full bg-brand-primary px-8 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-brand-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-secondary"
        onClick={handleRegister}
        type="button"
      >
        Create account
      </button>
      <button
        className="inline-flex items-center justify-center rounded-full border border-brand-primary px-8 py-3 text-base font-semibold text-brand-primary transition hover:bg-white/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
        onClick={handleLogin}
        type="button"
      >
        Sign in
      </button>
    </nav>
  )
}

export default PrimaryCTAButtons


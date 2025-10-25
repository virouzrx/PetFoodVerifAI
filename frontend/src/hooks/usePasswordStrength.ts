import { useMemo } from 'react'
import type { PasswordStrengthResult } from '../types/auth'

const hasUppercase = (value: string) => /[A-Z]/.test(value)
const hasLowercase = (value: string) => /[a-z]/.test(value)
const hasDigit = (value: string) => /\d/.test(value)
const hasSpecial = (value: string) => /[^A-Za-z0-9]/.test(value)

const scoreChecks = (checks: PasswordStrengthResult['checks']): PasswordStrengthResult['score'] => {
  const fulfilled = Object.values(checks).filter(Boolean).length
  if (fulfilled >= 5) return 4
  if (fulfilled === 4) return 3
  if (fulfilled === 3) return 2
  if (fulfilled === 2) return 1
  return 0
}

export const usePasswordStrength = (password: string): PasswordStrengthResult => {
  return useMemo(() => {
    const trimmed = password ?? ''
    const checks: PasswordStrengthResult['checks'] = {
      minLength8: trimmed.length >= 8,
      hasUpper: hasUppercase(trimmed),
      hasLower: hasLowercase(trimmed),
      hasDigit: hasDigit(trimmed),
      hasSpecial: hasSpecial(trimmed),
    }

    const score = scoreChecks(checks)

    return {
      score,
      checks,
    }
  }, [password])
}

export default usePasswordStrength


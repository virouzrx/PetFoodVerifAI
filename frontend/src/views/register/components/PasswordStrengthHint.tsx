import type { PasswordStrengthResult } from '../../../types/auth'

type PasswordStrengthHintProps = {
  result: PasswordStrengthResult
}

const strengthLabels: Record<PasswordStrengthResult['score'], string> = {
  0: 'Very weak',
  1: 'Weak',
  2: 'Fair',
  3: 'Strong',
  4: 'Very strong',
}

const PasswordStrengthHint = ({ result }: PasswordStrengthHintProps) => {
  const { checks, score } = result
  const fulfilledCount = Object.values(checks).filter(Boolean).length
  const percentage = (fulfilledCount / 5) * 100

  return (
    <div className="space-y-2" aria-live="polite">
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full bg-indigo-500 transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs font-medium text-slate-600">Password strength: {strengthLabels[score]}</p>
      <ul className="space-y-1 text-xs">
        <li className={checks.minLength8 ? 'text-green-600' : 'text-slate-500'}>At least 8 characters</li>
        <li className={checks.hasUpper ? 'text-green-600' : 'text-slate-500'}>Contains uppercase letter</li>
        <li className={checks.hasLower ? 'text-green-600' : 'text-slate-500'}>Contains lowercase letter</li>
        <li className={checks.hasDigit ? 'text-green-600' : 'text-slate-500'}>Contains a digit</li>
        <li className={checks.hasSpecial ? 'text-green-600' : 'text-slate-500'}>Contains a special character</li>
      </ul>
    </div>
  )
}

export default PasswordStrengthHint


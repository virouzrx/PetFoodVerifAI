import type { FieldErrorMap } from '../../../types/auth'

interface VerificationFormProps {
  verificationCode: string
  onChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
  isSubmitting: boolean
  errors: FieldErrorMap
}

const VerificationForm = ({
  verificationCode,
  onChange,
  onSubmit,
  isSubmitting,
  errors,
}: VerificationFormProps) => {
  const isValid = verificationCode.trim().length > 0
  const borderClass = errors.form ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-brand-primary'

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700">
          Verification Code
        </label>
        <input
          id="verificationCode"
          type="text"
          placeholder="Paste the verification code from your email"
          value={verificationCode}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full rounded-lg border px-4 py-3 font-mono text-center text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary ${borderClass}`}
          disabled={isSubmitting}
          autoComplete="off"
        />
        {errors.form && (
          <p className="text-sm text-red-600">{errors.form}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !isValid}
        className="w-full rounded-lg bg-brand-primary px-4 py-3 font-medium text-white hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? 'Verifying...' : 'Verify Email'}
      </button>
    </form>
  )
}

export default VerificationForm

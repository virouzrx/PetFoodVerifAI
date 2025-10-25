type GlobalAlertProps = {
  variant: 'error' | 'success'
  message: string
  onDismiss?: () => void
}

const variantStyles: Record<GlobalAlertProps['variant'], string> = {
  error: 'bg-rose-50 text-rose-900 ring-rose-200',
  success: 'bg-emerald-50 text-emerald-900 ring-emerald-200',
}

const GlobalAlert = ({ variant, message, onDismiss }: GlobalAlertProps) => {
  return (
    <div
      role="alert"
      className={`flex items-start justify-between gap-3 rounded-md px-4 py-3 text-sm ring-1 ${variantStyles[variant]}`}
      aria-live="assertive"
    >
      <p className="font-medium">{message}</p>
      {onDismiss ? (
        <button
          type="button"
          className="text-xs font-semibold uppercase tracking-wide text-inherit underline decoration-1 underline-offset-2"
          onClick={onDismiss}
        >
          Dismiss
        </button>
      ) : null}
    </div>
  )
}

export default GlobalAlert



import type { AlertMessage } from '../../state/ui/UiContext'

type GlobalAlertAreaProps = {
  alerts: AlertMessage[]
  onDismiss: (id: string) => void
}

const severityStyles: Record<AlertMessage['severity'], string> = {
  info: 'bg-blue-50 text-blue-900 ring-blue-700',
  success: 'bg-green-50 text-green-900 ring-green-700',
  warning: 'bg-yellow-50 text-yellow-900 ring-yellow-700',
  error: 'bg-red-50 text-red-900 ring-red-700',
}

const GlobalAlertArea = ({ alerts, onDismiss }: GlobalAlertAreaProps) => {
  if (alerts.length === 0) {
    return null
  }

  return (
    <section
      role="status"
      aria-live="polite"
      className="space-y-2 px-4 py-3"
    >
      {alerts.map((alert) => (
        <div
          key={alert.id}
          role="alert"
          className={`flex items-start justify-between gap-3 rounded-md px-4 py-3 text-sm ring-1 ${severityStyles[alert.severity]}`}
        >
          <div className="flex-1">
            {alert.title && (
              <p className="font-semibold">{alert.title}</p>
            )}
            <p className={alert.title ? 'mt-1' : 'font-medium'}>
              {alert.message}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onDismiss(alert.id)}
            className="text-xs font-semibold uppercase tracking-wide text-inherit underline decoration-1 underline-offset-2 hover:decoration-2"
            aria-label={`Dismiss ${alert.title || 'alert'}`}
          >
            Dismiss
          </button>
        </div>
      ))}
    </section>
  )
}

export default GlobalAlertArea


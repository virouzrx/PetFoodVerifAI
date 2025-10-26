type LoadingBarProps = {
  isActive: boolean
  label?: string
}

const LoadingBar = ({ isActive, label = 'Loading' }: LoadingBarProps) => {
  if (!isActive) {
    return null
  }

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-busy={isActive}
      className="h-1 w-full overflow-hidden bg-gray-200"
    >
      <div
        className="h-full w-full origin-left animate-pulse bg-brand-primary"
        style={{
          animation: 'loading-bar 1.5s ease-in-out infinite',
        }}
      />
    </div>
  )
}

export default LoadingBar


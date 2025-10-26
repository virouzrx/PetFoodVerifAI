import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

type BackLinkProps = {
  fromPath?: string | null
  fallbackTo?: string
  label: string
}

/**
 * BackLink
 * Secondary action offering a "Go back" button that tries history navigation
 * then falls back to a defined safe route. Only renders when there's a valid fromPath.
 */
const BackLink = ({ fromPath, fallbackTo = '/analyze', label }: BackLinkProps) => {
  const navigate = useNavigate()
  const [hasNavigated, setHasNavigated] = useState(false)

  // Don't render if fromPath is invalid or is /404 (avoid loops)
  if (!fromPath || fromPath === '/404' || hasNavigated) {
    return null
  }

  const handleGoBack = () => {
    // Prevent double-tap
    if (hasNavigated) return
    setHasNavigated(true)

    try {
      // Attempt to navigate back in history
      navigate(-1)
    } catch (error) {
      // If history navigation fails, use fallback
      console.warn('[BackLink] History navigation failed, using fallback:', error)
      navigate(fallbackTo, { replace: true })
    }
  }

  return (
    <button
      type="button"
      onClick={handleGoBack}
      className="text-brand-primary underline hover:text-brand-primary/80 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
    >
      {label}
    </button>
  )
}

export default BackLink


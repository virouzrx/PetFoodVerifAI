import { forwardRef } from 'react'

type NotFoundMessageProps = {
  title: string
  description: string
  detail?: string
}

/**
 * NotFoundMessage
 * Pure presentational component rendering the headline, descriptive copy,
 * and optional contextual detail about the missing resource.
 * Validates inputs and ensures heading text remains readable.
 */
const NotFoundMessage = forwardRef<HTMLHeadingElement, NotFoundMessageProps>(
  ({ title, description, detail }, ref) => {
    // Fallback to default copy if empty
    const displayTitle = title.trim() || 'Page Not Found'
    const displayDescription =
      description.trim() ||
      'The page you are looking for does not exist or has been moved.'

    // Ensure heading text is under 120 characters for readability
    const truncatedTitle =
      displayTitle.length > 120 ? displayTitle.substring(0, 117) + '...' : displayTitle

    return (
      <div>
        <h1
          id="not-found-title"
          ref={ref}
          tabIndex={-1}
          className="text-3xl font-bold text-brand-dark focus:outline-none md:text-4xl"
        >
          {truncatedTitle}
        </h1>
        <p className="mt-4 text-lg text-brand-dark">{displayDescription}</p>
        {detail && detail.trim() && (
          <p className="mt-2 text-base text-brand-dark/80">{detail}</p>
        )}
      </div>
    )
  }
)

NotFoundMessage.displayName = 'NotFoundMessage'

export default NotFoundMessage


import { Link } from 'react-router-dom'
import { useAuth } from '../../../state/auth/AuthContext'
import type { NotFoundLink } from '../types'

type PrimaryLinksProps = {
  links: NotFoundLink[]
  onLinkClick?: (link: NotFoundLink) => void
}

/**
 * PrimaryLinks
 * Renders primary recovery actions as accessible navigation buttons.
 * Filters out auth-required links when user is unauthenticated.
 * Prevents duplicate `to` targets and validates paths.
 */
const PrimaryLinks = ({ links, onLinkClick }: PrimaryLinksProps) => {
  const { isAuthenticated } = useAuth()

  // Filter and validate links
  const validLinks = links.filter((link) => {
    // Remove auth-required links if not authenticated
    if (link.requiresAuth && !isAuthenticated) {
      return false
    }
    // Ensure `to` starts with `/`
    if (!link.to.startsWith('/')) {
      console.warn('[PrimaryLinks] Invalid link path (must start with /):', link.to)
      return false
    }
    return true
  })

  // Remove duplicates based on `to` path
  const uniqueLinks = validLinks.filter(
    (link, index, self) => self.findIndex((l) => l.to === link.to) === index
  )

  const handleClick = (link: NotFoundLink) => {
    if (onLinkClick) {
      onLinkClick(link)
    }
  }

  return (
    <nav aria-label="Primary actions">
      <div className="flex flex-col gap-4 sm:flex-row">
        {uniqueLinks.map((link) => {
          const isPrimary = link.variant === 'primary'

          return (
            <Link
              key={link.id}
              to={link.to}
              onClick={() => handleClick(link)}
              className={`
                inline-flex items-center justify-center gap-2 rounded-md px-6 py-3 text-base font-semibold
                transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2
                ${
                  isPrimary
                    ? 'bg-brand-primary text-white hover:bg-brand-primary/90 focus:ring-brand-primary'
                    : 'border-2 border-brand-primary bg-transparent text-brand-primary hover:bg-brand-primary/10 focus:ring-brand-primary'
                }
              `}
            >
              {link.icon && <span aria-hidden="true">{link.icon}</span>}
              <span>{link.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export default PrimaryLinks


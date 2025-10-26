import { useState, useEffect, useRef } from 'react'

export type AccountMenuProps = {
  email: string
  onLogout: () => void
  isProcessing: boolean
}

const AccountMenu = ({ email, onLogout, isProcessing }: AccountMenuProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const handleLogoutClick = () => {
    setIsOpen(false)
    onLogout()
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-brand-dark hover:bg-brand-primary hover:text-white transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
      >
        <span className="hidden sm:inline">{email}</span>
        <svg
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-brand-secondary py-1 shadow-lg border-2 border-brand-accent focus:outline-none"
        >
          <div className="border-b-2 border-brand-accent px-4 py-2 text-xs text-brand-dark">
            Signed in as
            <div className="mt-1 truncate font-medium text-brand-dark">{email}</div>
          </div>
          
          <button
            type="button"
            role="menuitem"
            onClick={handleLogoutClick}
            disabled={isProcessing}
            className="block w-full px-4 py-2 text-left text-sm text-brand-dark hover:bg-white focus:bg-white focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isProcessing ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      )}
    </div>
  )
}

export default AccountMenu


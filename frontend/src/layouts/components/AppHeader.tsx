import { useAuth } from '../../state/auth/AuthContext'
import NavLinks from './NavLinks'
import AccountMenu from './AccountMenu'
import { useState } from 'react'

export type NavLinkItem = {
  id: string
  label: string
  path: string
  exact?: boolean
  matchPattern?: RegExp | string
}

type AppHeaderProps = {
  currentPath: string
  onLogout: () => void
}

export const navItems: NavLinkItem[] = [
  {
    id: 'analyze',
    label: 'Analyze',
    path: '/analyze',
    exact: true,
  },
  {
    id: 'products',
    label: 'My Products',
    path: '/products',
    exact: false,
  },
]

const AppHeader = ({ currentPath, onLogout }: AppHeaderProps) => {
  const { state } = useAuth()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleLogout = async () => {
    setIsProcessing(true)
    try {
      await onLogout()
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b-2 border-brand-primary bg-brand-secondary shadow-md">
      <div className="mx-auto flex w-full items-center justify-between px-4 py-4 sm:px-6 lg:max-w-7xl lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-4 sm:gap-8">
          <a
            href="/analyze"
            className="flex items-center gap-2 text-xl font-bold text-brand-primary hover:text-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 rounded-md"
          >
            <span className="text-2xl">🐾</span>
            <span>
              PetFoodVerif<span className="text-brand-tertiary font-semibold">AI</span>
            </span>
          </a>
          
          {/* Navigation - show only "Analyze" on mobile, all items on tablet+ */}
          <div className="hidden md:block">
            <NavLinks items={navItems} currentPath={currentPath} />
          </div>
          <div className="md:hidden">
            <NavLinks items={navItems.filter(item => item.id === 'analyze')} currentPath={currentPath} />
          </div>
        </div>
        
        {/* Account Menu */}
        <AccountMenu
          email={state.user?.email || 'User'}
          onLogout={handleLogout}
          isProcessing={isProcessing}
          currentPath={currentPath}
          mobileNavItems={navItems.filter(item => item.id === 'products')}
        />
      </div>
    </header>
  )
}

export default AppHeader


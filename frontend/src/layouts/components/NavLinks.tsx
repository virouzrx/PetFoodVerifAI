import { NavLink } from 'react-router-dom'
import type { NavLinkItem } from './AppHeader'

type NavLinksProps = {
  items: NavLinkItem[]
  currentPath: string
  onNavigate?: (path: string) => void
}

const NavLinks = ({ items, currentPath, onNavigate }: NavLinksProps) => {
  const isActive = (item: NavLinkItem) => {
    if (item.exact) {
      return currentPath === item.path
    }
    return currentPath.startsWith(item.path)
  }

  return (
    <nav role="navigation" aria-label="Main navigation">
      <ul className="flex items-center gap-1">
        {items.map((item) => {
          const active = isActive(item)
          return (
            <li key={item.id}>
              <NavLink
                to={item.path}
                onClick={() => onNavigate?.(item.path)}
                aria-current={active ? 'page' : undefined}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 ${
                  active
                    ? 'bg-brand-primary text-white shadow-sm'
                    : 'text-brand-dark hover:bg-white hover:text-brand-primary hover:shadow-sm'
                }`}
              >
                {item.label}
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export default NavLinks


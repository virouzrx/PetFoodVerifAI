import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import PrimaryLinks from '../components/PrimaryLinks'
import { AuthProvider } from '../../../state/auth/AuthContext'
import type { NotFoundLink } from '../types'

const mockLinks: NotFoundLink[] = [
  {
    id: 'analyze',
    label: 'Analyze a Product',
    to: '/analyze',
    variant: 'primary',
    requiresAuth: true,
  },
  {
    id: 'products',
    label: 'View My Products',
    to: '/products',
    variant: 'secondary',
    requiresAuth: true,
  },
]

const renderWithProviders = (
  links: NotFoundLink[],
  onLinkClick?: (link: NotFoundLink) => void,
  isAuthenticated = true
) => {
  // Mock localStorage for auth
  const mockAuthState = isAuthenticated
    ? { token: 'mock-token', user: { userId: '1', email: 'test@example.com' } }
    : {}
  
  window.localStorage.setItem('pfvauth', JSON.stringify(mockAuthState))

  return render(
    <MemoryRouter>
      <AuthProvider>
        <PrimaryLinks links={links} onLinkClick={onLinkClick} />
      </AuthProvider>
    </MemoryRouter>
  )
}

describe('PrimaryLinks', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('renders all valid links for authenticated users', () => {
    renderWithProviders(mockLinks, undefined, true)

    expect(screen.getByText('Analyze a Product')).toBeInTheDocument()
    expect(screen.getByText('View My Products')).toBeInTheDocument()
  })

  it('filters out auth-required links when user is unauthenticated', () => {
    renderWithProviders(mockLinks, undefined, false)

    expect(screen.queryByText('Analyze a Product')).not.toBeInTheDocument()
    expect(screen.queryByText('View My Products')).not.toBeInTheDocument()
  })

  it('renders links with correct href attributes', () => {
    renderWithProviders(mockLinks, undefined, true)

    const analyzeLink = screen.getByText('Analyze a Product').closest('a')
    const productsLink = screen.getByText('View My Products').closest('a')

    expect(analyzeLink).toHaveAttribute('href', '/analyze')
    expect(productsLink).toHaveAttribute('href', '/products')
  })

  it('applies primary variant styling correctly', () => {
    renderWithProviders(mockLinks, undefined, true)

    const analyzeLink = screen.getByText('Analyze a Product').closest('a')
    expect(analyzeLink).toHaveClass('bg-brand-primary')
    expect(analyzeLink).toHaveClass('text-white')
  })

  it('applies secondary variant styling correctly', () => {
    renderWithProviders(mockLinks, undefined, true)

    const productsLink = screen.getByText('View My Products').closest('a')
    expect(productsLink).toHaveClass('border-2')
    expect(productsLink).toHaveClass('border-brand-primary')
    expect(productsLink).toHaveClass('text-brand-primary')
  })

  it('calls onLinkClick callback when link is clicked', () => {
    const onLinkClick = vi.fn()
    renderWithProviders(mockLinks, onLinkClick, true)

    const analyzeLink = screen.getByText('Analyze a Product')
    fireEvent.click(analyzeLink)

    expect(onLinkClick).toHaveBeenCalledWith(mockLinks[0])
    expect(onLinkClick).toHaveBeenCalledTimes(1)
  })

  it('filters out links with invalid paths (not starting with /)', () => {
    const invalidLinks: NotFoundLink[] = [
      {
        id: 'analyze',
        label: 'Invalid Link',
        to: 'analyze', // Missing leading slash
        variant: 'primary',
      },
    ]

    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    renderWithProviders(invalidLinks, undefined, true)

    expect(screen.queryByText('Invalid Link')).not.toBeInTheDocument()
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[PrimaryLinks] Invalid link path (must start with /):',
      'analyze'
    )

    consoleWarnSpy.mockRestore()
  })

  it('removes duplicate links based on "to" path', () => {
    const duplicateLinks: NotFoundLink[] = [
      {
        id: 'analyze',
        label: 'First Analyze',
        to: '/analyze',
        variant: 'primary',
      },
      {
        id: 'products',
        label: 'Second Analyze',
        to: '/analyze', // Duplicate path
        variant: 'secondary',
      },
    ]

    renderWithProviders(duplicateLinks, undefined, true)

    expect(screen.getByText('First Analyze')).toBeInTheDocument()
    expect(screen.queryByText('Second Analyze')).not.toBeInTheDocument()
  })

  it('renders icon when provided', () => {
    const linksWithIcon: NotFoundLink[] = [
      {
        id: 'analyze',
        label: 'Analyze',
        to: '/analyze',
        variant: 'primary',
        icon: <span data-testid="test-icon">🔍</span>,
      },
    ]

    renderWithProviders(linksWithIcon, undefined, true)

    expect(screen.getByTestId('test-icon')).toBeInTheDocument()
  })

  it('has correct accessibility navigation role', () => {
    renderWithProviders(mockLinks, undefined, true)

    const nav = screen.getByRole('navigation', { name: 'Primary actions' })
    expect(nav).toBeInTheDocument()
  })

  it('renders non-auth-required links for unauthenticated users', () => {
    const publicLinks: NotFoundLink[] = [
      {
        id: 'analyze',
        label: 'Public Link',
        to: '/public',
        variant: 'primary',
        requiresAuth: false,
      },
    ]

    renderWithProviders(publicLinks, undefined, false)

    expect(screen.getByText('Public Link')).toBeInTheDocument()
  })
})


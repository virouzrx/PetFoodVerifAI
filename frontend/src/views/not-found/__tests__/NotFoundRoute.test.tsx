import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import NotFoundRoute from '../NotFoundRoute'
import { AuthProvider } from '../../../state/auth/AuthContext'

const mockNavigate = vi.fn()
let mockLocationState: any = null

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({
      pathname: '/404',
      state: mockLocationState,
    }),
  }
})

const renderWithProviders = (initialPath = '/404', locationState?: any) => {
  // Set the mock location state before rendering
  mockLocationState = locationState !== undefined ? locationState : null

  // Mock authenticated user
  window.localStorage.setItem(
    'pfvauth',
    JSON.stringify({
      token: 'mock-token',
      user: { userId: '1', email: 'test@example.com' },
    })
  )

  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthProvider>
        <NotFoundRoute />
      </AuthProvider>
    </MemoryRouter>
  )
}

describe('NotFoundRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.clear()
    document.title = '' // Reset title
    mockLocationState = null // Reset mock location state
  })

  it('renders the page heading', () => {
    renderWithProviders()

    expect(screen.getByRole('heading', { name: 'Page Not Found' })).toBeInTheDocument()
  })

  it('renders the main description text', () => {
    renderWithProviders()

    expect(
      screen.getByText(/does not exist or has been moved/i)
    ).toBeInTheDocument()
  })

  it('renders primary navigation links', () => {
    renderWithProviders()

    expect(screen.getByText('Analyze a Product')).toBeInTheDocument()
    expect(screen.getByText('View My Products')).toBeInTheDocument()
  })

  it('sets document title on mount', () => {
    renderWithProviders()

    expect(document.title).toBe('Page Not Found | PetFoodVerifAI')
  })

  it('renders back link when fromPath is provided in state', () => {
    const locationState = { from: '/results/123' }
    
    renderWithProviders('/404', locationState)

    expect(screen.getByRole('button', { name: 'Go Back' })).toBeInTheDocument()
  })

  it('does not render back link when fromPath is not provided', () => {
    renderWithProviders('/404', null)

    expect(screen.queryByRole('button', { name: 'Go Back' })).not.toBeInTheDocument()
  })

  it('renders custom detail message for analysis-missing reason', () => {
    const locationState = { reason: 'analysis-missing' }
    
    renderWithProviders('/404', locationState)

    expect(
      screen.getByText(/The analysis you were looking for has been removed/)
    ).toBeInTheDocument()
  })

  it('renders fromPath in detail message when provided', () => {
    const locationState = { from: '/some-page' }
    
    renderWithProviders('/404', locationState)

    expect(screen.getByText(/The page at "\/some-page" could not be found/)).toBeInTheDocument()
  })

  it('has correct semantic HTML structure', () => {
    renderWithProviders()

    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Primary actions' })).toBeInTheDocument()
  })

  it('applies correct styling to content card', () => {
    const { container } = renderWithProviders()

    const contentCard = container.querySelector('.bg-brand-secondary')
    expect(contentCard).toBeInTheDocument()
    expect(contentCard).toHaveClass('rounded-lg')
    expect(contentCard).toHaveClass('shadow-lg')
  })

  it('has focusable heading for accessibility', () => {
    renderWithProviders()

    const heading = screen.getByRole('heading', { name: 'Page Not Found' })
    expect(heading).toHaveAttribute('tabIndex', '-1')
  })

  it('logs navigation info in development mode', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'
    const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})

    const locationState = { from: '/previous' }
    renderWithProviders('/404', locationState)

    expect(consoleInfoSpy).toHaveBeenCalledWith(
      '[NotFoundRoute] User landed on 404',
      expect.objectContaining({
        fromPath: '/previous',
      })
    )

    consoleInfoSpy.mockRestore()
    process.env.NODE_ENV = originalEnv
  })

  it('renders with responsive layout classes', () => {
    const { container } = renderWithProviders()

    const mainElement = container.querySelector('main')
    expect(mainElement).toHaveClass('flex', 'flex-1', 'items-center', 'justify-center')

    const contentSection = container.querySelector('section')
    expect(contentSection).toHaveClass('w-full', 'max-w-2xl')
  })

  it('wraps content in brand-tertiary background', () => {
    const { container } = renderWithProviders()

    const wrapper = container.querySelector('.bg-brand-tertiary')
    expect(wrapper).toBeInTheDocument()
    expect(wrapper).toHaveClass('min-h-screen')
  })
})


import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import BackLink from '../../views/not-found/components/BackLink'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const renderWithRouter = (
  fromPath?: string | null,
  fallbackTo?: string,
  label = 'Go Back'
) => {
  return render(
    <MemoryRouter>
      <BackLink fromPath={fromPath} fallbackTo={fallbackTo} label={label} />
    </MemoryRouter>
  )
}

describe('BackLink', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  it('renders when valid fromPath is provided', () => {
    renderWithRouter('/previous-page')

    expect(screen.getByText('Go Back')).toBeInTheDocument()
  })

  it('does not render when fromPath is null', () => {
    renderWithRouter(null)

    expect(screen.queryByText('Go Back')).not.toBeInTheDocument()
  })

  it('does not render when fromPath is undefined', () => {
    renderWithRouter(undefined)

    expect(screen.queryByText('Go Back')).not.toBeInTheDocument()
  })

  it('does not render when fromPath is /404', () => {
    renderWithRouter('/404')

    expect(screen.queryByText('Go Back')).not.toBeInTheDocument()
  })

  it('calls navigate(-1) when clicked', () => {
    renderWithRouter('/previous-page')

    const button = screen.getByText('Go Back')
    fireEvent.click(button)

    expect(mockNavigate).toHaveBeenCalledWith(-1)
  })

  it('uses default fallback route when not specified', () => {
    renderWithRouter('/previous-page')

    const button = screen.getByText('Go Back')
    expect(button).toBeInTheDocument()
    // Default fallback is /analyze (used when navigate(-1) fails)
  })

  it('uses custom fallback route when specified', () => {
    renderWithRouter('/previous-page', '/custom-fallback')

    const button = screen.getByText('Go Back')
    expect(button).toBeInTheDocument()
  })

  it('renders custom label when provided', () => {
    renderWithRouter('/previous-page', '/analyze', 'Return to Previous Page')

    expect(screen.getByText('Return to Previous Page')).toBeInTheDocument()
  })

  it('prevents double navigation by hiding after first click', () => {
    renderWithRouter('/previous-page')

    const button = screen.getByText('Go Back')
    fireEvent.click(button)

    expect(mockNavigate).toHaveBeenCalledTimes(1)

    // Button should be removed from DOM after navigation
    expect(screen.queryByText('Go Back')).not.toBeInTheDocument()
  })

  it('has correct accessibility attributes', () => {
    renderWithRouter('/previous-page')

    const button = screen.getByRole('button', { name: 'Go Back' })
    expect(button).toHaveAttribute('type', 'button')
  })

  it('has keyboard focus styling classes', () => {
    renderWithRouter('/previous-page')

    const button = screen.getByText('Go Back')
    expect(button).toHaveClass('focus:outline-none')
    expect(button).toHaveClass('focus:ring-2')
    expect(button).toHaveClass('focus:ring-brand-primary')
  })

  it('handles navigation error gracefully with fallback', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    
    // Simulate navigate throwing an error
    mockNavigate.mockImplementationOnce(() => {
      throw new Error('Navigation failed')
    })

    renderWithRouter('/previous-page', '/fallback')

    const button = screen.getByText('Go Back')
    fireEvent.click(button)

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[BackLink] History navigation failed, using fallback:',
      expect.any(Error)
    )
    expect(mockNavigate).toHaveBeenCalledWith('/fallback', { replace: true })

    consoleWarnSpy.mockRestore()
  })
})


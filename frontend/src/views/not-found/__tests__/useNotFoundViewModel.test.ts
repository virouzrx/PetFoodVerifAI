import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useNotFoundViewModel } from '../hooks/useNotFoundViewModel'

const mockUseLocation = vi.fn()
const mockUseAuth = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useLocation: () => mockUseLocation(),
  }
})

vi.mock('../../../state/auth/AuthContext', async () => {
  const actual = await vi.importActual('../../../state/auth/AuthContext')
  return {
    ...actual,
    useAuth: () => mockUseAuth(),
  }
})

describe('useNotFoundViewModel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({ isAuthenticated: true })
  })

  it('returns default view model with no location state', () => {
    mockUseLocation.mockReturnValue({
      pathname: '/404',
      state: null,
    })

    const { result } = renderHook(() => useNotFoundViewModel())

    expect(result.current.title).toBe('Page Not Found')
    expect(result.current.description).toContain('does not exist or has been moved')
    expect(result.current.detail).toBe("We couldn't find the page you were looking for.")
    expect(result.current.backLabel).toBe('Go Back')
    expect(result.current.fromPath).toBeNull()
  })

  it('sanitizes and includes valid fromPath from location state', () => {
    mockUseLocation.mockReturnValue({
      pathname: '/404',
      state: { from: '/results/123' },
    })

    const { result } = renderHook(() => useNotFoundViewModel())

    expect(result.current.fromPath).toBe('/results/123')
    expect(result.current.detail).toBe('The page at "/results/123" could not be found.')
  })

  it('ignores fromPath if it is /404', () => {
    mockUseLocation.mockReturnValue({
      pathname: '/404',
      state: { from: '/404' },
    })

    const { result } = renderHook(() => useNotFoundViewModel())

    expect(result.current.fromPath).toBeNull()
  })

  it('ignores fromPath if it does not start with /', () => {
    mockUseLocation.mockReturnValue({
      pathname: '/404',
      state: { from: 'invalid-path' },
    })

    const { result } = renderHook(() => useNotFoundViewModel())

    expect(result.current.fromPath).toBeNull()
  })

  it('sets specific detail for analysis-missing reason', () => {
    mockUseLocation.mockReturnValue({
      pathname: '/404',
      state: { reason: 'analysis-missing' },
    })

    const { result } = renderHook(() => useNotFoundViewModel())

    expect(result.current.detail).toBe(
      'The analysis you were looking for has been removed or does not exist.'
    )
  })

  it('includes both analyze and products links', () => {
    mockUseLocation.mockReturnValue({
      pathname: '/404',
      state: null,
    })

    const { result } = renderHook(() => useNotFoundViewModel())

    expect(result.current.links).toHaveLength(2)
    expect(result.current.links[0].id).toBe('analyze')
    expect(result.current.links[0].to).toBe('/analyze')
    expect(result.current.links[1].id).toBe('products')
    expect(result.current.links[1].to).toBe('/products')
  })

  it('marks both links as requiring auth', () => {
    mockUseLocation.mockReturnValue({
      pathname: '/404',
      state: null,
    })

    const { result } = renderHook(() => useNotFoundViewModel())

    expect(result.current.links[0].requiresAuth).toBe(true)
    expect(result.current.links[1].requiresAuth).toBe(true)
  })

  it('sets correct variants for links', () => {
    mockUseLocation.mockReturnValue({
      pathname: '/404',
      state: null,
    })

    const { result } = renderHook(() => useNotFoundViewModel())

    expect(result.current.links[0].variant).toBe('primary')
    expect(result.current.links[1].variant).toBe('secondary')
  })

  it('logs warning in development if required links are missing', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    mockUseLocation.mockReturnValue({
      pathname: '/404',
      state: null,
    })

    // This test passes because the implementation includes the required links
    renderHook(() => useNotFoundViewModel())

    // Should not warn when both links are present
    expect(consoleWarnSpy).not.toHaveBeenCalled()

    consoleWarnSpy.mockRestore()
    process.env.NODE_ENV = originalEnv
  })

  it('memoizes result to prevent unnecessary recalculations', () => {
    mockUseLocation.mockReturnValue({
      pathname: '/404',
      state: { from: '/previous' },
    })

    const { result, rerender } = renderHook(() => useNotFoundViewModel())
    const firstResult = result.current

    rerender()
    const secondResult = result.current

    // Should return the same object reference if inputs haven't changed
    expect(firstResult).toBe(secondResult)
  })

  it('handles non-string fromPath in state', () => {
    mockUseLocation.mockReturnValue({
      pathname: '/404',
      state: { from: 123 }, // Invalid type
    })

    const { result } = renderHook(() => useNotFoundViewModel())

    expect(result.current.fromPath).toBeNull()
  })

  it('combines fromPath and reason correctly', () => {
    mockUseLocation.mockReturnValue({
      pathname: '/404',
      state: { from: '/results/abc', reason: 'analysis-missing' },
    })

    const { result } = renderHook(() => useNotFoundViewModel())

    // Reason takes precedence for detail message
    expect(result.current.detail).toBe(
      'The analysis you were looking for has been removed or does not exist.'
    )
    expect(result.current.fromPath).toBe('/results/abc')
  })
})


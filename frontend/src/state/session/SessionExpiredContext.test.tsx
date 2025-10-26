import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import {
  SessionExpiredProvider,
  useSessionExpiredContext,
  useSessionExpiry,
} from './SessionExpiredContext'
import type { ReactNode } from 'react'

// Mock react-router-dom
const mockNavigate = vi.fn()
const mockLocation = { pathname: '/test' }

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
}))

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    get length() {
      return Object.keys(store).length
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  }
})()

// Mock localStorage for auth clearing
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    get length() {
      return Object.keys(store).length
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  }
})()

describe('SessionExpiredContext', () => {
  let originalFetch: typeof global.fetch

  beforeEach(() => {
    // Store original fetch
    originalFetch = global.fetch

    // Reset mocks
    sessionStorageMock.clear()
    localStorageMock.clear()
    vi.clearAllMocks()
    mockNavigate.mockClear()

    // Set up storage mocks
    Object.defineProperty(global, 'window', {
      value: {
        sessionStorage: sessionStorageMock,
        localStorage: localStorageMock,
        fetch: global.fetch,
      },
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    // Restore original fetch
    global.fetch = originalFetch
    sessionStorageMock.clear()
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  const wrapper = ({ children }: { children: ReactNode }) => (
    <SessionExpiredProvider>{children}</SessionExpiredProvider>
  )

  describe('SessionExpiredProvider', () => {
    it('should initialize with non-expired state', () => {
      const { result } = renderHook(() => useSessionExpiredContext(), { wrapper })

      expect(result.current.state.isExpired).toBe(false)
      expect(result.current.state.message).toBe('')
      expect(result.current.state.triggeredAt).toBe(0)
    })

    it('should load persisted expiry flag from sessionStorage', () => {
      sessionStorageMock.setItem('pfv_session_expired', 'true')

      const { result } = renderHook(() => useSessionExpiredContext(), { wrapper })

      expect(result.current.state.isExpired).toBe(true)
      expect(result.current.state.message).toBe('Your session has expired. Please log in again.')
    })

    it('should restore expired state from sessionStorage on mount', () => {
      sessionStorageMock.setItem('pfv_session_expired', 'true')

      const { result } = renderHook(() => useSessionExpiredContext(), { wrapper })

      expect(result.current.state.isExpired).toBe(true)
      expect(result.current.state.triggeredAt).toBeGreaterThan(0)
    })

    it('should handle missing sessionStorage gracefully', () => {
      Object.defineProperty(global, 'window', {
        value: {},
        writable: true,
        configurable: true,
      })

      const { result } = renderHook(() => useSessionExpiredContext(), { wrapper })

      expect(result.current.state.isExpired).toBe(false)
    })
  })

  describe('triggerExpiry function', () => {
    it('should set isExpired to true', () => {
      const { result } = renderHook(() => useSessionExpiredContext(), { wrapper })

      act(() => {
        result.current.triggerExpiry()
      })

      expect(result.current.state.isExpired).toBe(true)
    })

    it('should use default message when none provided', () => {
      const { result } = renderHook(() => useSessionExpiredContext(), { wrapper })

      act(() => {
        result.current.triggerExpiry()
      })

      expect(result.current.state.message).toBe('Your session has expired. Please log in again.')
    })

    it('should use custom message when provided', () => {
      const { result } = renderHook(() => useSessionExpiredContext(), { wrapper })

      act(() => {
        result.current.triggerExpiry({ message: 'Custom expiry message' })
      })

      expect(result.current.state.message).toBe('Custom expiry message')
    })

    it('should set returnPath correctly', () => {
      const { result } = renderHook(() => useSessionExpiredContext(), { wrapper })

      act(() => {
        result.current.triggerExpiry({ returnPath: '/dashboard' })
      })

      expect(result.current.state.returnPath).toBe('/dashboard')
    })

    it('should set sourceRequest correctly', () => {
      const { result } = renderHook(() => useSessionExpiredContext(), { wrapper })

      act(() => {
        result.current.triggerExpiry({ sourceRequest: '/api/data' })
      })

      expect(result.current.state.sourceRequest).toBe('/api/data')
    })

    it('should prevent re-trigger if already expired with same message', () => {
      const { result } = renderHook(() => useSessionExpiredContext(), { wrapper })

      act(() => {
        result.current.triggerExpiry({ message: 'Test message' })
      })

      const firstTriggeredAt = result.current.state.triggeredAt

      act(() => {
        result.current.triggerExpiry({ message: 'Test message' })
      })

      expect(result.current.state.triggeredAt).toBe(firstTriggeredAt)
    })

    it('should allow re-trigger with different message', () => {
      const { result } = renderHook(() => useSessionExpiredContext(), { wrapper })

      act(() => {
        result.current.triggerExpiry({ message: 'First message' })
      })

      const firstTriggeredAt = result.current.state.triggeredAt

      act(() => {
        result.current.triggerExpiry({ message: 'Second message' })
      })

      expect(result.current.state.message).toBe('Second message')
      expect(result.current.state.triggeredAt).toBeGreaterThanOrEqual(firstTriggeredAt)
    })

    it('should sanitize returnPath (reject //)', () => {
      const { result } = renderHook(() => useSessionExpiredContext(), { wrapper })

      act(() => {
        result.current.triggerExpiry({ returnPath: '//malicious.com' })
      })

      expect(result.current.state.returnPath).toBeUndefined()
    })

    it('should sanitize returnPath (reject external URLs)', () => {
      const { result } = renderHook(() => useSessionExpiredContext(), { wrapper })

      act(() => {
        result.current.triggerExpiry({ returnPath: 'https://external.com/path' })
      })

      expect(result.current.state.returnPath).toBeUndefined()
    })

    it('should accept valid same-origin paths', () => {
      const { result } = renderHook(() => useSessionExpiredContext(), { wrapper })

      act(() => {
        result.current.triggerExpiry({ returnPath: '/dashboard' })
      })

      expect(result.current.state.returnPath).toBe('/dashboard')
    })
  })

  describe('clearExpiry function', () => {
    it('should reset state to initial values', () => {
      const { result } = renderHook(() => useSessionExpiredContext(), { wrapper })

      act(() => {
        result.current.triggerExpiry({ message: 'Test', returnPath: '/test' })
      })

      expect(result.current.state.isExpired).toBe(true)

      act(() => {
        result.current.clearExpiry()
      })

      expect(result.current.state.isExpired).toBe(false)
      expect(result.current.state.message).toBe('')
      expect(result.current.state.triggeredAt).toBe(0)
    })

    it('should clear sessionStorage flag', () => {
      const { result } = renderHook(() => useSessionExpiredContext(), { wrapper })

      act(() => {
        result.current.triggerExpiry()
      })

      expect(sessionStorageMock.setItem).toHaveBeenCalledWith('pfv_session_expired', 'true')

      act(() => {
        result.current.clearExpiry()
      })

      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('pfv_session_expired')
    })

    it('should clear returnPath', () => {
      const { result } = renderHook(() => useSessionExpiredContext(), { wrapper })

      act(() => {
        result.current.triggerExpiry({ returnPath: '/dashboard' })
      })

      expect(result.current.state.returnPath).toBe('/dashboard')

      act(() => {
        result.current.clearExpiry()
      })

      expect(result.current.state.returnPath).toBeUndefined()
    })
  })

  describe('setReturnPath function', () => {
    it('should set valid return path', () => {
      const { result } = renderHook(() => useSessionExpiredContext(), { wrapper })

      act(() => {
        result.current.setReturnPath('/dashboard')
      })

      expect(result.current.state.returnPath).toBe('/dashboard')
    })

    it('should reject external URLs', () => {
      const { result } = renderHook(() => useSessionExpiredContext(), { wrapper })

      act(() => {
        result.current.setReturnPath('https://external.com')
      })

      expect(result.current.state.returnPath).toBeUndefined()
    })

    it('should reject paths starting with //', () => {
      const { result } = renderHook(() => useSessionExpiredContext(), { wrapper })

      act(() => {
        result.current.setReturnPath('//malicious.com')
      })

      expect(result.current.state.returnPath).toBeUndefined()
    })

    it('should accept paths starting with /', () => {
      const { result } = renderHook(() => useSessionExpiredContext(), { wrapper })

      act(() => {
        result.current.setReturnPath('/valid/path')
      })

      expect(result.current.state.returnPath).toBe('/valid/path')
    })

    it('should handle undefined input', () => {
      const { result } = renderHook(() => useSessionExpiredContext(), { wrapper })

      act(() => {
        result.current.setReturnPath(undefined as any)
      })

      expect(result.current.state.returnPath).toBeUndefined()
    })
  })

  describe('useSessionExpiredContext hook', () => {
    it('should throw error when used outside provider', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        renderHook(() => useSessionExpiredContext())
      }).toThrow('useSessionExpiredContext must be used within a SessionExpiredProvider')

      consoleErrorSpy.mockRestore()
    })

    it('should return context value when used inside provider', () => {
      const { result } = renderHook(() => useSessionExpiredContext(), { wrapper })

      expect(result.current).toHaveProperty('state')
      expect(result.current).toHaveProperty('triggerExpiry')
      expect(result.current).toHaveProperty('clearExpiry')
      expect(result.current).toHaveProperty('setReturnPath')
    })
  })

  describe('sessionStorage persistence', () => {
    it('should persist expiry flag when isExpired changes', () => {
      const { result } = renderHook(() => useSessionExpiredContext(), { wrapper })

      act(() => {
        result.current.triggerExpiry()
      })

      expect(sessionStorageMock.setItem).toHaveBeenCalledWith('pfv_session_expired', 'true')
    })

    it('should remove flag when cleared', () => {
      const { result } = renderHook(() => useSessionExpiredContext(), { wrapper })

      act(() => {
        result.current.triggerExpiry()
        result.current.clearExpiry()
      })

      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('pfv_session_expired')
    })

    it('should handle setItem errors gracefully', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      sessionStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Storage error')
      })

      const { result } = renderHook(() => useSessionExpiredContext(), { wrapper })

      // Should not crash
      expect(() => {
        act(() => {
          result.current.triggerExpiry()
        })
      }).not.toThrow()

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to persist session expiry flag',
        expect.any(Error),
      )

      consoleWarnSpy.mockRestore()
    })

    it('should handle getItem errors gracefully', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      sessionStorageMock.getItem.mockImplementationOnce(() => {
        throw new Error('Storage error')
      })

      // Should not crash
      expect(() => {
        renderHook(() => useSessionExpiredContext(), { wrapper })
      }).not.toThrow()

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to load session expiry flag',
        expect.any(Error),
      )

      consoleWarnSpy.mockRestore()
    })
  })

  describe('useSessionExpiry hook', () => {
    it('should return expiry state correctly', () => {
      const { result } = renderHook(() => useSessionExpiry(), { wrapper })

      expect(result.current.isExpired).toBe(false)
      expect(result.current.message).toBe('')
    })

    it('should reflect context state changes', () => {
      const { result, rerender } = renderHook(() => {
        const context = useSessionExpiredContext()
        const expiry = useSessionExpiry()
        return { context, expiry }
      }, { wrapper })

      // Initially not expired
      expect(result.current.expiry.isExpired).toBe(false)

      // Trigger expiry
      act(() => {
        result.current.context.triggerExpiry({ message: 'Test expiry' })
      })

      // Force re-render to see the change
      rerender()

      // Should now see expired state
      expect(result.current.expiry.isExpired).toBe(true)
      expect(result.current.expiry.message).toBe('Test expiry')
    })

    it('should NOT set returnPath for public routes', () => {
      mockLocation.pathname = '/login'

      const TestComponent = ({ children }: { children: ReactNode }) => (
        <SessionExpiredProvider>{children}</SessionExpiredProvider>
      )

      const { result: contextResult } = renderHook(() => useSessionExpiredContext(), {
        wrapper: TestComponent,
      })
      const { result: expiryResult } = renderHook(() => useSessionExpiry(), {
        wrapper: TestComponent,
      })

      act(() => {
        contextResult.current.triggerExpiry()
      })

      // Public paths should not be saved
      expect(expiryResult.current.returnPath).toBeUndefined()
    })
  })

  describe('handleLoginRedirect function', () => {
    it('should clear pfvauth from localStorage', () => {
      const { result } = renderHook(() => useSessionExpiry(), { wrapper })

      act(() => {
        result.current.handleLoginRedirect()
      })

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('pfvauth')
    })

    it('should navigate to /login', () => {
      const { result } = renderHook(() => useSessionExpiry(), { wrapper })

      act(() => {
        result.current.handleLoginRedirect()
      })

      expect(mockNavigate).toHaveBeenCalled()
      const callArg = mockNavigate.mock.calls[0][0]
      expect(callArg).toMatch(/\/login/)
    })

    it('should preserve returnUrl in query params', () => {
      mockLocation.pathname = '/dashboard'

      const TestComponent = ({ children }: { children: ReactNode }) => (
        <SessionExpiredProvider>{children}</SessionExpiredProvider>
      )

      const { result: contextResult } = renderHook(() => useSessionExpiredContext(), {
        wrapper: TestComponent,
      })
      const { result: expiryResult } = renderHook(() => useSessionExpiry(), {
        wrapper: TestComponent,
      })

      act(() => {
        contextResult.current.setReturnPath('/dashboard')
      })

      act(() => {
        expiryResult.current.handleLoginRedirect()
      })

      expect(mockNavigate).toHaveBeenCalled()
      const callArg = mockNavigate.mock.calls[0][0]
      expect(callArg).toContain('returnUrl=')
    })

    it('should NOT preserve returnUrl for public paths', () => {
      mockLocation.pathname = '/login'

      const { result } = renderHook(() => useSessionExpiry(), { wrapper })

      act(() => {
        result.current.handleLoginRedirect()
      })

      expect(mockNavigate).toHaveBeenCalledWith('/login')
    })

    it('should handle localStorage clear errors gracefully', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      localStorageMock.removeItem.mockImplementationOnce(() => {
        throw new Error('Storage error')
      })

      const { result } = renderHook(() => useSessionExpiry(), { wrapper })

      // Should not crash
      expect(() => {
        act(() => {
          result.current.handleLoginRedirect()
        })
      }).not.toThrow()

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to clear auth storage',
        expect.any(Error),
      )

      consoleWarnSpy.mockRestore()
    })

    it('should encode returnUrl correctly', () => {
      mockLocation.pathname = '/path/with spaces'

      const TestComponent = ({ children }: { children: ReactNode }) => (
        <SessionExpiredProvider>{children}</SessionExpiredProvider>
      )

      const { result: contextResult } = renderHook(() => useSessionExpiredContext(), {
        wrapper: TestComponent,
      })
      const { result: expiryResult } = renderHook(() => useSessionExpiry(), {
        wrapper: TestComponent,
      })

      act(() => {
        contextResult.current.setReturnPath('/path/with spaces')
      })

      act(() => {
        expiryResult.current.handleLoginRedirect()
      })

      const callArg = mockNavigate.mock.calls[0][0]
      expect(callArg).toContain('returnUrl=%2Fpath%2Fwith%20spaces')
    })
  })
})


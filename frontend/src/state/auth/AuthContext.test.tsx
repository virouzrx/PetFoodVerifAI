import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthContext'
import type { ReactNode } from 'react'

// Mock localStorage
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

describe('AuthContext', () => {
  beforeEach(() => {
    // Clear mock and reset storage before each test
    localStorageMock.clear()
    vi.clearAllMocks()
    Object.defineProperty(global, 'window', {
      value: { localStorage: localStorageMock },
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  const wrapper = ({ children }: { children: ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  )

  describe('AuthProvider', () => {
    it('should initialize with empty state', () => {
      const { result } = renderHook(() => useAuth(), { wrapper })

      expect(result.current.state).toEqual({})
      expect(result.current.isAuthenticated).toBe(false)
    })

    it('should load persisted auth state from localStorage on mount', () => {
      const persistedState = {
        token: 'test-token-123',
        user: { userId: 'user-456', email: 'test@example.com' },
      }
      localStorageMock.setItem('pfvauth', JSON.stringify(persistedState))

      const { result } = renderHook(() => useAuth(), { wrapper })

      expect(result.current.state).toEqual(persistedState)
      expect(result.current.isAuthenticated).toBe(true)
    })

    it('should handle corrupted localStorage data gracefully', () => {
      localStorageMock.setItem('pfvauth', 'not-valid-json{]')
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const { result } = renderHook(() => useAuth(), { wrapper })

      expect(result.current.state).toEqual({})
      expect(result.current.isAuthenticated).toBe(false)
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to parse auth state from storage',
        expect.any(Error),
      )

      consoleWarnSpy.mockRestore()
    })

    it('should handle missing localStorage gracefully', () => {
      // Create a window object without localStorage
      Object.defineProperty(global, 'window', {
        value: {},
        writable: true,
        configurable: true,
      })

      // This should not crash
      const { result } = renderHook(() => useAuth(), { wrapper })

      expect(result.current.state).toEqual({})
      expect(result.current.isAuthenticated).toBe(false)
    })

    it('should handle empty localStorage value', () => {
      localStorageMock.setItem('pfvauth', '')

      const { result } = renderHook(() => useAuth(), { wrapper })

      expect(result.current.state).toEqual({})
      expect(result.current.isAuthenticated).toBe(false)
    })

    it('should handle null localStorage value', () => {
      // localStorage returns null when key doesn't exist
      localStorageMock.getItem.mockReturnValueOnce(null)

      const { result } = renderHook(() => useAuth(), { wrapper })

      expect(result.current.state).toEqual({})
      expect(result.current.isAuthenticated).toBe(false)
    })
  })

  describe('login function', () => {
    it('should set token and user data', () => {
      const { result } = renderHook(() => useAuth(), { wrapper })

      act(() => {
        result.current.login('token-123', 'user-456', 'test@example.com')
      })

      expect(result.current.state).toEqual({
        token: 'token-123',
        user: { userId: 'user-456', email: 'test@example.com' },
      })
    })

    it('should persist auth state to localStorage', () => {
      const { result } = renderHook(() => useAuth(), { wrapper })

      act(() => {
        result.current.login('token-123', 'user-456', 'test@example.com')
      })

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'pfvauth',
        JSON.stringify({
          token: 'token-123',
          user: { userId: 'user-456', email: 'test@example.com' },
        }),
      )
    })

    it('should update isAuthenticated to true', () => {
      const { result } = renderHook(() => useAuth(), { wrapper })

      expect(result.current.isAuthenticated).toBe(false)

      act(() => {
        result.current.login('token-123', 'user-456', 'test@example.com')
      })

      expect(result.current.isAuthenticated).toBe(true)
    })

    it('should handle multiple login calls', () => {
      const { result } = renderHook(() => useAuth(), { wrapper })

      act(() => {
        result.current.login('token-1', 'user-1', 'user1@example.com')
      })

      expect(result.current.state.token).toBe('token-1')

      act(() => {
        result.current.login('token-2', 'user-2', 'user2@example.com')
      })

      expect(result.current.state.token).toBe('token-2')
      expect(result.current.state.user?.email).toBe('user2@example.com')
    })

    it('should maintain function reference stability', () => {
      const { result, rerender } = renderHook(() => useAuth(), { wrapper })

      const loginRef1 = result.current.login

      rerender()

      const loginRef2 = result.current.login

      expect(loginRef1).toBe(loginRef2)
    })
  })

  describe('logout function', () => {
    it('should clear auth state', () => {
      const { result } = renderHook(() => useAuth(), { wrapper })

      act(() => {
        result.current.login('token-123', 'user-456', 'test@example.com')
      })

      expect(result.current.state.token).toBe('token-123')

      act(() => {
        result.current.logout()
      })

      expect(result.current.state).toEqual({})
    })

    it('should persist empty state to localStorage', () => {
      const { result } = renderHook(() => useAuth(), { wrapper })

      act(() => {
        result.current.login('token-123', 'user-456', 'test@example.com')
      })

      act(() => {
        result.current.logout()
      })

      expect(localStorageMock.setItem).toHaveBeenLastCalledWith('pfvauth', JSON.stringify({}))
    })

    it('should set isAuthenticated to false', () => {
      const { result } = renderHook(() => useAuth(), { wrapper })

      act(() => {
        result.current.login('token-123', 'user-456', 'test@example.com')
      })

      expect(result.current.isAuthenticated).toBe(true)

      act(() => {
        result.current.logout()
      })

      expect(result.current.isAuthenticated).toBe(false)
    })

    it('should clear user object', () => {
      const { result } = renderHook(() => useAuth(), { wrapper })

      act(() => {
        result.current.login('token-123', 'user-456', 'test@example.com')
      })

      expect(result.current.state.user).toBeDefined()

      act(() => {
        result.current.logout()
      })

      expect(result.current.state.user).toBeUndefined()
    })

    it('should maintain function reference stability', () => {
      const { result, rerender } = renderHook(() => useAuth(), { wrapper })

      const logoutRef1 = result.current.logout

      rerender()

      const logoutRef2 = result.current.logout

      expect(logoutRef1).toBe(logoutRef2)
    })
  })

  describe('isAuthenticated computed property', () => {
    it('should be false when no token exists', () => {
      const { result } = renderHook(() => useAuth(), { wrapper })

      expect(result.current.isAuthenticated).toBe(false)
    })

    it('should be true when token exists', () => {
      const { result } = renderHook(() => useAuth(), { wrapper })

      act(() => {
        result.current.login('token-123', 'user-456', 'test@example.com')
      })

      expect(result.current.isAuthenticated).toBe(true)
    })

    it('should update reactively when token changes', () => {
      const { result } = renderHook(() => useAuth(), { wrapper })

      expect(result.current.isAuthenticated).toBe(false)

      act(() => {
        result.current.login('token-123', 'user-456', 'test@example.com')
      })

      expect(result.current.isAuthenticated).toBe(true)

      act(() => {
        result.current.logout()
      })

      expect(result.current.isAuthenticated).toBe(false)
    })

    it('should be false when token is empty string', () => {
      const { result } = renderHook(() => useAuth(), { wrapper })

      act(() => {
        result.current.login('', 'user-456', 'test@example.com')
      })

      expect(result.current.isAuthenticated).toBe(false)
    })

    it('should be true for any truthy token', () => {
      const { result } = renderHook(() => useAuth(), { wrapper })

      act(() => {
        result.current.login('x', 'user-456', 'test@example.com')
      })

      expect(result.current.isAuthenticated).toBe(true)
    })
  })

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        renderHook(() => useAuth())
      }).toThrow('useAuth must be used within an AuthProvider')

      consoleErrorSpy.mockRestore()
    })

    it('should return context value when used inside AuthProvider', () => {
      const { result } = renderHook(() => useAuth(), { wrapper })

      expect(result.current).toHaveProperty('state')
      expect(result.current).toHaveProperty('login')
      expect(result.current).toHaveProperty('logout')
      expect(result.current).toHaveProperty('isAuthenticated')
    })

    it('should return stable context value reference', () => {
      const { result } = renderHook(() => useAuth(), { wrapper })

      const contextValue1 = result.current

      // Login should create new context value
      act(() => {
        result.current.login('token-123', 'user-456', 'test@example.com')
      })

      // Context value should be different (state changed)
      expect(result.current).not.toBe(contextValue1)

      // But functions should be stable
      expect(result.current.login).toBe(contextValue1.login)
      expect(result.current.logout).toBe(contextValue1.logout)
    })
  })

  describe('localStorage persistence', () => {
    it('should handle localStorage.setItem errors gracefully', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Quota exceeded')
      })

      const { result } = renderHook(() => useAuth(), { wrapper })

      // Should not crash
      act(() => {
        result.current.login('token-123', 'user-456', 'test@example.com')
      })

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to persist auth state',
        expect.any(Error),
      )

      consoleWarnSpy.mockRestore()
    })

    it('should handle localStorage.getItem errors gracefully', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      localStorageMock.getItem.mockImplementationOnce(() => {
        throw new Error('Storage error')
      })

      // Should not crash, should return empty state
      const { result } = renderHook(() => useAuth(), { wrapper })

      expect(result.current.state).toEqual({})
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to parse auth state from storage',
        expect.any(Error),
      )

      consoleWarnSpy.mockRestore()
    })

    it('should handle JSON.parse errors', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      localStorageMock.setItem('pfvauth', '{invalid json')

      const { result } = renderHook(() => useAuth(), { wrapper })

      expect(result.current.state).toEqual({})
      expect(consoleWarnSpy).toHaveBeenCalled()

      consoleWarnSpy.mockRestore()
    })

    it('should handle quota exceeded errors on setItem', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      localStorageMock.setItem.mockImplementationOnce(() => {
        const error = new Error('QuotaExceededError')
        error.name = 'QuotaExceededError'
        throw error
      })

      const { result } = renderHook(() => useAuth(), { wrapper })

      // Should not crash the app
      expect(() => {
        act(() => {
          result.current.login('token-123', 'user-456', 'test@example.com')
        })
      }).not.toThrow()

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to persist auth state',
        expect.any(Error),
      )

      consoleWarnSpy.mockRestore()
    })

    it('should persist on every state change', () => {
      const { result } = renderHook(() => useAuth(), { wrapper })

      // Clear initial mount calls
      const initialCalls = localStorageMock.setItem.mock.calls.length

      act(() => {
        result.current.login('token-1', 'user-1', 'user1@example.com')
      })

      expect(localStorageMock.setItem).toHaveBeenCalledTimes(initialCalls + 1)

      act(() => {
        result.current.login('token-2', 'user-2', 'user2@example.com')
      })

      expect(localStorageMock.setItem).toHaveBeenCalledTimes(initialCalls + 2)

      act(() => {
        result.current.logout()
      })

      expect(localStorageMock.setItem).toHaveBeenCalledTimes(initialCalls + 3)
    })
  })
})


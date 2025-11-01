import { renderHook, act } from '@testing-library/react'
import { vi } from 'vitest'
import useLogin from '../hooks/useLogin'
import * as authService from '../services/authService'

const loginMock = vi.fn()

vi.mock('../state/auth/AuthContext', () => {
  return {
    useAuth: () => {
      const mockFn = vi.fn()
      mockFn.mockImplementation((...args: unknown[]) => loginMock(...args))
      return {
        login: mockFn,
      }
    },
  }
})

vi.mock('../services/authService', () => ({
  loginUser: vi.fn(),
}))

describe('useLogin', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    loginMock.mockClear()
    vi.mocked(authService.loginUser).mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  const flushAsync = async () => {
    await vi.advanceTimersByTimeAsync(600)
  }

  it('logs in successfully and updates auth state', async () => {
    vi.mocked(authService.loginUser).mockResolvedValue({
      token: 'token-123',
      userId: 'user-456',
      email: 'user@test.com',
      emailConfirmed: true,
    })

    const { result } = renderHook(() => useLogin())

    let loginPromise: Promise<void>
    
    await act(async () => {
      loginPromise = result.current.login({ email: 'USER@test.com', password: 'password1' })
      await flushAsync()
      await loginPromise
    })

    expect(vi.mocked(authService.loginUser)).toHaveBeenCalledWith({
      email: 'user@test.com',
      password: 'password1',
    })
    expect(loginMock).toHaveBeenCalledWith('token-123', 'user-456', 'user@test.com')
    expect(result.current.error).toEqual({})
    expect(result.current.isLoading).toBe(false)
  })

  it('handles credential errors with neutral messaging', async () => {
    vi.mocked(authService.loginUser).mockRejectedValue({ status: 401 })

    const { result } = renderHook(() => useLogin())

    let loginPromise: Promise<void>

    await act(async () => {
      loginPromise = result.current.login({ email: 'user@test.com', password: 'wrongpass' })
      await flushAsync()
      await loginPromise
    })

    expect(result.current.error.form).toBe(
      'We couldn\'t sign you in. Check your credentials and try again.',
    )
    expect(loginMock).not.toHaveBeenCalled()
    expect(result.current.isLoading).toBe(false)
  })

  it('handles rate limit errors', async () => {
    vi.mocked(authService.loginUser).mockRejectedValue({ status: 429 })

    const { result } = renderHook(() => useLogin())

    let loginPromise: Promise<void>

    await act(async () => {
      loginPromise = result.current.login({ email: 'user@test.com', password: 'password1' })
      await flushAsync()
      await loginPromise
    })

    expect(result.current.error.form).toBe('Too many attempts. Please wait and try again.')
    expect(result.current.isLoading).toBe(false)
  })
})



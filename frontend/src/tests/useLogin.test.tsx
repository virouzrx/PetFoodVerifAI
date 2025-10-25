import { renderHook, act } from '@testing-library/react'
import { vi } from 'vitest'
import useLogin from '../hooks/useLogin'
import { useAuth } from '../state/auth/AuthContext'
import * as authService from '../services/authService'

vi.mock('../state/auth/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../services/authService')

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

describe('useLogin', () => {
  const loginMock = vi.fn()

  beforeEach(() => {
    vi.useFakeTimers()
    ;(useAuth as unknown as vi.Mock).mockReturnValue({ login: loginMock })
    loginMock.mockReset()
    vi.spyOn(authService, 'loginUser').mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('logs in successfully and updates auth state', async () => {
    vi.spyOn(authService, 'loginUser').mockResolvedValue({
      token: 'token-123',
      userId: 'user-456',
    })

    const { result } = renderHook(() => useLogin())

    await act(async () => {
      const loginPromise = result.current.login({ email: 'USER@test.com', password: 'password1' })
      await sleep(10)
      vi.advanceTimersByTime(600)
      await loginPromise
    })

    expect(authService.loginUser).toHaveBeenCalledWith({
      email: 'user@test.com',
      password: 'password1',
    })
    expect(loginMock).toHaveBeenCalledWith('token-123', 'user-456')
    expect(result.current.error).toEqual({})
    expect(result.current.isLoading).toBe(false)
  })

  it('handles credential errors with neutral messaging', async () => {
    vi.spyOn(authService, 'loginUser').mockRejectedValue({ status: 401 })

    const { result } = renderHook(() => useLogin())

    await act(async () => {
      const loginPromise = result.current.login({ email: 'user@test.com', password: 'wrongpass' })
      await sleep(10)
      vi.advanceTimersByTime(600)
      await loginPromise
    })

    expect(result.current.error.form).toBe(
      "We couldn’t sign you in. Check your credentials and try again.",
    )
    expect(loginMock).not.toHaveBeenCalled()
    expect(result.current.isLoading).toBe(false)
  })

  it('handles rate limit errors', async () => {
    vi.spyOn(authService, 'loginUser').mockRejectedValue({ status: 429 })

    const { result } = renderHook(() => useLogin())

    await act(async () => {
      const loginPromise = result.current.login({ email: 'user@test.com', password: 'password1' })
      await sleep(10)
      vi.advanceTimersByTime(600)
      await loginPromise
    })

    expect(result.current.error.form).toBe('Too many attempts. Please wait and try again.')
  })
})


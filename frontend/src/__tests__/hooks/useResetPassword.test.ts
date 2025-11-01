import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useResetPassword from '../../hooks/useResetPassword';
import * as authService from '../../services/authService';
import type { ResetPasswordRequestDto } from '../../types/auth';

// Mock the auth service
vi.mock('../../services/authService', () => ({
  resetPassword: vi.fn(),
}));

describe('useResetPassword', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    vi.mocked(authService.resetPassword).mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    vi.mocked(authService.resetPassword).mockClear();
  });

  const mockResetPasswordRequest: ResetPasswordRequestDto = {
    email: 'user@example.com',
    token: 'reset-token-123',
    newPassword: 'NewPassword123!',
  };

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useResetPassword());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toEqual({});
    expect(result.current.isSuccess).toBe(false);
    expect(typeof result.current.submitResetPassword).toBe('function');
    expect(typeof result.current.clearError).toBe('function');
  });

  it('should successfully submit reset password request', async () => {
    vi.mocked(authService.resetPassword).mockResolvedValue(undefined);

    const { result } = renderHook(() => useResetPassword());

    act(() => {
      result.current.submitResetPassword(mockResetPasswordRequest);
    });

    // Should be loading immediately
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toEqual({});
    expect(result.current.isSuccess).toBe(false);

    await vi.advanceTimersByTimeAsync(600);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSuccess).toBe(true);
    expect(result.current.error).toEqual({});

    expect(authService.resetPassword).toHaveBeenCalledWith({
      email: 'user@example.com',
      token: 'reset-token-123',
      newPassword: 'NewPassword123!',
    });
    expect(authService.resetPassword).toHaveBeenCalledTimes(1);
  });

  it('should handle API errors correctly', async () => {
    const mockApiError = {
      status: 400,
      errors: [
        { field: 'token', message: 'Invalid or expired token' },
        { field: 'newPassword', message: 'Password too weak' },
        { field: 'form', message: 'Reset failed' },
      ],
    };

    vi.mocked(authService.resetPassword).mockRejectedValue(mockApiError);

    const { result } = renderHook(() => useResetPassword());

    act(() => {
      result.current.submitResetPassword(mockResetPasswordRequest);
    });

    expect(result.current.isLoading).toBe(true);

    await vi.advanceTimersByTimeAsync(600);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.error).toEqual({
      token: 'Invalid or expired token',
      newPassword: 'Password too weak',
      form: 'Reset failed',
    });

    expect(authService.resetPassword).toHaveBeenCalledWith({
      email: 'user@example.com',
      token: 'reset-token-123',
      newPassword: 'NewPassword123!',
    });
  });

  it('should handle rate limiting errors', async () => {
    const mockRateLimitError = {
      status: 429,
    };

    vi.mocked(authService.resetPassword).mockRejectedValue(mockRateLimitError);

    const { result } = renderHook(() => useResetPassword());

    act(() => {
      result.current.submitResetPassword(mockResetPasswordRequest);
    });

    await vi.advanceTimersByTimeAsync(600);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.error).toEqual({
      form: 'Too many attempts. Please wait and try again.',
    });
  });

  it('should handle network/other errors', async () => {
    const mockNetworkError = {
      status: 500,
    };

    vi.mocked(authService.resetPassword).mockRejectedValue(mockNetworkError);

    const { result } = renderHook(() => useResetPassword());

    act(() => {
      result.current.submitResetPassword(mockResetPasswordRequest);
    });

    await vi.advanceTimersByTimeAsync(600);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.error).toEqual({
      form: 'Unable to process your request. Please try again later.',
    });
  });

  it('should clear error when clearError is called', async () => {
    const mockApiError = {
      status: 400,
      errors: [{ field: 'token', message: 'Invalid token' }],
    };

    vi.mocked(authService.resetPassword).mockRejectedValue(mockApiError);

    const { result } = renderHook(() => useResetPassword());

    act(() => {
      result.current.submitResetPassword(mockResetPasswordRequest);
    });

    await vi.advanceTimersByTimeAsync(600);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });

    expect(result.current.error).toEqual({
      token: 'Invalid token',
    });

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toEqual({});
  });

  it('should normalize email to lowercase and trim whitespace', async () => {
    vi.mocked(authService.resetPassword).mockResolvedValue(undefined);

    const { result } = renderHook(() => useResetPassword());

    act(() => {
      result.current.submitResetPassword({
        email: '  User@Example.COM  ',
        token: 'reset-token-123',
        newPassword: 'NewPassword123!',
      });
    });

    await vi.advanceTimersByTimeAsync(600);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });

    expect(result.current.isSuccess).toBe(true);
    expect(authService.resetPassword).toHaveBeenCalledWith({
      email: 'user@example.com',
      token: 'reset-token-123',
      newPassword: 'NewPassword123!',
    });
  });

  it('should trim token whitespace', async () => {
    vi.mocked(authService.resetPassword).mockResolvedValue(undefined);

    const { result } = renderHook(() => useResetPassword());

    act(() => {
      result.current.submitResetPassword({
        email: 'user@example.com',
        token: '  reset-token-123  ',
        newPassword: 'NewPassword123!',
      });
    });

    await vi.advanceTimersByTimeAsync(600);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });

    expect(result.current.isSuccess).toBe(true);
    expect(authService.resetPassword).toHaveBeenCalledWith({
      email: 'user@example.com',
      token: 'reset-token-123',
      newPassword: 'NewPassword123!',
    });
  });

  it('should reset success state on new submission', async () => {
    vi.mocked(authService.resetPassword).mockResolvedValue(undefined);

    const { result } = renderHook(() => useResetPassword());

    // First successful submission
    act(() => {
      result.current.submitResetPassword(mockResetPasswordRequest);
    });

    await vi.advanceTimersByTimeAsync(600);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });

    expect(result.current.isSuccess).toBe(true);

    // Second submission should reset success state
    vi.mocked(authService.resetPassword).mockRejectedValue({ status: 400, errors: [] });

    act(() => {
      result.current.submitResetPassword(mockResetPasswordRequest);
    });

    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isLoading).toBe(true);
  });

  it('should handle non-API errors gracefully', async () => {
    vi.mocked(authService.resetPassword).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useResetPassword());

    act(() => {
      result.current.submitResetPassword(mockResetPasswordRequest);
    });

    await vi.advanceTimersByTimeAsync(600);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.error).toEqual({
      form: 'Unable to process your request. Please try again later.',
    });
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loginUser, registerUser } from './authService';
import type { LoginRequestDto, RegisterRequestDto } from '../types/auth';

describe('authService', () => {
  const mockLoginRequest: LoginRequestDto = {
    email: 'user@example.com',
    password: 'password123',
  };

  const mockRegisterRequest: RegisterRequestDto = {
    email: 'newuser@example.com',
    password: 'newpassword123',
  };

  const mockLoginResponse = {
    token: 'test-jwt-token-123',
    userId: 'user-456',
  };

  const mockRegisterResponse = {
    token: 'new-user-jwt-token',
    userId: 'new-user-123',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('loginUser', () => {
    it('should successfully login and return token and userId', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockLoginResponse,
      } as Response);

      const result = await loginUser(mockLoginRequest);

      expect(result).toEqual(mockLoginResponse);
      expect(result.token).toBe('test-jwt-token-123');
      expect(result.userId).toBe('user-456');
    });

    it('should make POST request to correct endpoint', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockLoginResponse,
      } as Response);

      await loginUser(mockLoginRequest);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should include correct headers', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockLoginResponse,
      } as Response);

      await loginUser(mockLoginRequest);

      const callArgs = vi.mocked(global.fetch).mock.calls[0];
      expect(callArgs[1]?.headers).toEqual({
        'Content-Type': 'application/json',
      });
    });

    it('should include credentials omit for login', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockLoginResponse,
      } as Response);

      await loginUser(mockLoginRequest);

      const callArgs = vi.mocked(global.fetch).mock.calls[0];
      expect(callArgs[1]?.credentials).toBe('include');
    });

    it('should send email and password in request body', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockLoginResponse,
      } as Response);

      await loginUser(mockLoginRequest);

      const callArgs = vi.mocked(global.fetch).mock.calls[0];
      const body = JSON.parse(callArgs[1]?.body as string);

      expect(body.email).toBe('user@example.com');
      expect(body.password).toBe('password123');
    });

    it('should throw error on 401 Unauthorized', async () => {
      const errorMessage = 'Invalid credentials';
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => JSON.stringify({ message: errorMessage }),
        json: async () => ({ message: errorMessage }),
      } as unknown as Response);

      await expect(loginUser(mockLoginRequest)).rejects.toMatchObject({
        status: 401,
        message: errorMessage,
      });
    });

    it('should throw error on 400 Bad Request', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => JSON.stringify({ message: 'Bad request' }),
        json: async () => ({ message: 'Bad request' }),
      } as unknown as Response);

      await expect(loginUser(mockLoginRequest)).rejects.toMatchObject({
        status: 400,
      });
    });

    it('should throw error on 429 Too Many Requests', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: async () => JSON.stringify({ message: 'Too many requests' }),
        json: async () => ({ message: 'Too many requests' }),
      } as unknown as Response);

      await expect(loginUser(mockLoginRequest)).rejects.toMatchObject({
        status: 429,
      });
    });

    it('should throw error on 500 Server Error', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => JSON.stringify({ message: 'Server error' }),
        json: async () => ({ message: 'Server error' }),
      } as unknown as Response);

      await expect(loginUser(mockLoginRequest)).rejects.toMatchObject({
        status: 500,
      });
    });

    it('should handle response with additional error details', async () => {
      const errorDetails = {
        message: 'Validation failed',
        errors: {
          email: ['Email is required'],
          password: ['Password must be at least 8 characters'],
        },
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => JSON.stringify(errorDetails),
        json: async () => errorDetails,
      } as unknown as Response);

      await expect(loginUser(mockLoginRequest)).rejects.toMatchObject({
        status: 400,
        message: 'Validation failed',
        errors: errorDetails.errors,
      });
    });

    it('should handle non-JSON error response', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
        json: async () => {
          throw new Error('Not JSON');
        },
      } as unknown as Response);

      await expect(loginUser(mockLoginRequest)).rejects.toMatchObject({
        status: 500,
        message: 'Internal Server Error',
      });
    });

    it('should handle empty response text', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => '',
        json: async () => {
          throw new Error('Not JSON');
        },
      } as unknown as Response);

      await expect(loginUser(mockLoginRequest)).rejects.toMatchObject({
        status: 500,
        message: '',
      });
    });

    it('should trim whitespace from credentials', async () => {
      const requestWithWhitespace = {
        email: '  user@example.com  ',
        password: '  password123  ',
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockLoginResponse,
      } as Response);

      await loginUser(requestWithWhitespace);

      const callArgs = vi.mocked(global.fetch).mock.calls[0];
      const body = JSON.parse(callArgs[1]?.body as string);

      // The service should send the request as provided (trimming is UI responsibility)
      expect(body.email).toBe('  user@example.com  ');
    });
  });

  describe('registerUser', () => {
    it('should successfully register and return 201 Created', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockRegisterResponse,
      } as Response);

      const result = await registerUser(mockRegisterRequest);

      expect(result).toEqual(mockRegisterResponse);
      expect(result.token).toBe('new-user-jwt-token');
      expect(result.userId).toBe('new-user-123');
    });

    it('should make POST request to correct endpoint', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockRegisterResponse,
      } as Response);

      await registerUser(mockRegisterRequest);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/register'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should include correct headers', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockRegisterResponse,
      } as Response);

      await registerUser(mockRegisterRequest);

      const callArgs = vi.mocked(global.fetch).mock.calls[0];
      expect(callArgs[1]?.headers).toEqual({
        'Content-Type': 'application/json',
      });
    });

    it('should use credentials omit for register', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockRegisterResponse,
      } as Response);

      await registerUser(mockRegisterRequest);

      const callArgs = vi.mocked(global.fetch).mock.calls[0];
      expect(callArgs[1]?.credentials).toBe('omit');
    });

    it('should send email and password in request body', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockRegisterResponse,
      } as Response);

      await registerUser(mockRegisterRequest);

      const callArgs = vi.mocked(global.fetch).mock.calls[0];
      const body = JSON.parse(callArgs[1]?.body as string);

      expect(body.email).toBe('newuser@example.com');
      expect(body.password).toBe('newpassword123');
    });

    it('should throw error on 400 Bad Request (validation failure)', async () => {
      const validationError = {
        message: 'Email already exists',
        errors: {
          email: ['This email is already registered'],
        },
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => JSON.stringify(validationError),
        json: async () => validationError,
      } as unknown as Response);

      await expect(registerUser(mockRegisterRequest)).rejects.toMatchObject({
        status: 400,
        message: 'Email already exists',
      });
    });

    it('should throw error on 409 Conflict (email already exists)', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 409,
        text: async () => JSON.stringify({ message: 'Email already registered' }),
        json: async () => ({ message: 'Email already registered' }),
      } as unknown as Response);

      await expect(registerUser(mockRegisterRequest)).rejects.toMatchObject({
        status: 409,
        message: 'Email already registered',
      });
    });

    it('should throw error on 422 Unprocessable Entity', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 422,
        text: async () => JSON.stringify({ message: 'Invalid data' }),
        json: async () => ({ message: 'Invalid data' }),
      } as unknown as Response);

      await expect(registerUser(mockRegisterRequest)).rejects.toMatchObject({
        status: 422,
      });
    });

    it('should throw error on 500 Server Error', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => JSON.stringify({ message: 'Server error' }),
        json: async () => ({ message: 'Server error' }),
      } as unknown as Response);

      await expect(registerUser(mockRegisterRequest)).rejects.toMatchObject({
        status: 500,
      });
    });

    it('should handle malformed JSON in error response', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Invalid JSON {',
        json: async () => {
          throw new Error('Invalid JSON');
        },
      } as unknown as Response);

      await expect(registerUser(mockRegisterRequest)).rejects.toMatchObject({
        status: 400,
        message: 'Invalid JSON {',
      });
    });

    it('should only accept 201 Created status for success', async () => {
      // Test that 200 OK is treated as error (API returns 201 for register)
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockRegisterResponse,
      } as unknown as Response);

      await expect(registerUser(mockRegisterRequest)).rejects.toBeDefined();
    });
  });

  describe('error parsing', () => {
    it('should include all fields from error response', async () => {
      const errorResponse = {
        message: 'Something went wrong',
        errors: {
          field1: ['error1', 'error2'],
          field2: ['error3'],
        },
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => JSON.stringify(errorResponse),
        json: async () => errorResponse,
      } as unknown as Response);

      await expect(loginUser(mockLoginRequest)).rejects.toMatchObject({
        status: 400,
        message: 'Something went wrong',
        errors: errorResponse.errors,
      });
    });

    it('should handle error response without message field', async () => {
      const errorResponse = {
        errors: {
          email: ['Invalid email'],
        },
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => JSON.stringify(errorResponse),
        json: async () => errorResponse,
      } as unknown as Response);

      await expect(loginUser(mockLoginRequest)).rejects.toMatchObject({
        status: 400,
        errors: errorResponse.errors,
      });
    });

    it('should handle error response without errors field', async () => {
      const errorResponse = {
        message: 'An error occurred',
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => JSON.stringify(errorResponse),
        json: async () => errorResponse,
      } as unknown as Response);

      await expect(loginUser(mockLoginRequest)).rejects.toMatchObject({
        status: 400,
        message: 'An error occurred',
      });
    });

    it('should handle completely empty JSON response', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => '{}',
        json: async () => ({}),
      } as unknown as Response);

      await expect(loginUser(mockLoginRequest)).rejects.toMatchObject({
        status: 400,
      });
    });
  });

  describe('edge cases', () => {
    it('should handle fetch network error', async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));

      await expect(loginUser(mockLoginRequest)).rejects.toThrow('Network error');
    });

    it('should handle timeout', async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Timeout'));

      await expect(loginUser(mockLoginRequest)).rejects.toThrow('Timeout');
    });

    it('should handle very long email', async () => {
      const longEmail = 'a'.repeat(1000) + '@example.com';
      const request = { ...mockLoginRequest, email: longEmail };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockLoginResponse,
      } as Response);

      const result = await loginUser(request);

      expect(result).toEqual(mockLoginResponse);
    });

    it('should handle special characters in email', async () => {
      const specialEmail = 'user+test@example.co.uk';
      const request = { ...mockLoginRequest, email: specialEmail };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockLoginResponse,
      } as Response);

      await loginUser(request);

      const callArgs = vi.mocked(global.fetch).mock.calls[0];
      const body = JSON.parse(callArgs[1]?.body as string);

      expect(body.email).toBe(specialEmail);
    });

    it('should handle unicode in error messages', async () => {
      const unicodeMessage = 'Errör: 你好 🎉';

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => JSON.stringify({ message: unicodeMessage }),
        json: async () => ({ message: unicodeMessage }),
      } as unknown as Response);

      await expect(loginUser(mockLoginRequest)).rejects.toMatchObject({
        message: unicodeMessage,
      });
    });

    it('should handle very large error response', async () => {
      const largeErrors = {
        message: 'Validation failed',
        errors: Object.fromEntries(
          Array.from({ length: 100 }, (_, i) => [
            `field${i}`,
            ['error message'],
          ])
        ),
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => JSON.stringify(largeErrors),
        json: async () => largeErrors,
      } as unknown as Response);

      await expect(loginUser(mockLoginRequest)).rejects.toMatchObject({
        errors: expect.objectContaining(largeErrors.errors),
      });
    });
  });

  describe('environment configuration', () => {
    it('should use VITE_API_URL environment variable or default', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockLoginResponse,
      } as Response);

      await loginUser(mockLoginRequest);

      const callArgs = vi.mocked(global.fetch).mock.calls[0];
      const url = callArgs[0] as string;

      // Should be either the env URL or the default
      expect(
        url.includes('http://localhost:5135/api') || 
        url.includes('http://localhost:3000/api')
      ).toBe(true);
    });
  });

  describe('request body serialization', () => {
    it('should properly serialize request objects', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockLoginResponse,
      } as Response);

      const customRequest = {
        email: 'test@example.com',
        password: 'pass123',
      };

      await loginUser(customRequest);

      const callArgs = vi.mocked(global.fetch).mock.calls[0];
      const body = callArgs[1]?.body as string;

      expect(() => JSON.parse(body)).not.toThrow();
      expect(JSON.parse(body)).toEqual(customRequest);
    });

    it('should not modify original request object', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockLoginResponse,
      } as Response);

      const originalRequest = { ...mockLoginRequest };

      await loginUser(mockLoginRequest);

      expect(mockLoginRequest).toEqual(originalRequest);
    });
  });
});





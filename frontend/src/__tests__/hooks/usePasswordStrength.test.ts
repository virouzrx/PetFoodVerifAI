import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePasswordStrength } from '../../hooks/usePasswordStrength';
import type { PasswordStrengthResult } from '../../types/auth';

describe('usePasswordStrength', () => {
  const testCases: Array<{
    password: string;
    expected: PasswordStrengthResult;
    description: string;
  }> = [
    {
      password: '',
      expected: {
        score: 0,
        checks: {
          minLength8: false,
          hasUpper: false,
          hasLower: false,
          hasDigit: false,
          hasSpecial: false,
        },
      },
      description: 'empty password',
    },
    {
      password: 'short',
      expected: {
        score: 0,
        checks: {
          minLength8: false,
          hasUpper: false,
          hasLower: true,
          hasDigit: false,
          hasSpecial: false,
        },
      },
      description: 'password too short with only lowercase',
    },
    {
      password: 'password',
      expected: {
        score: 1,
        checks: {
          minLength8: true,
          hasUpper: false,
          hasLower: true,
          hasDigit: false,
          hasSpecial: false,
        },
      },
      description: '8+ chars but only lowercase',
    },
    {
      password: 'Password',
      expected: {
        score: 2,
        checks: {
          minLength8: true,
          hasUpper: true,
          hasLower: true,
          hasDigit: false,
          hasSpecial: false,
        },
      },
      description: '8+ chars with upper and lowercase',
    },
    {
      password: 'Password1',
      expected: {
        score: 3,
        checks: {
          minLength8: true,
          hasUpper: true,
          hasLower: true,
          hasDigit: true,
          hasSpecial: false,
        },
      },
      description: '8+ chars with upper, lowercase, and digit',
    },
    {
      password: 'Password1!',
      expected: {
        score: 4,
        checks: {
          minLength8: true,
          hasUpper: true,
          hasLower: true,
          hasDigit: true,
          hasSpecial: true,
        },
      },
      description: 'strong password with all requirements',
    },
    {
      password: 'VeryLongPasswordWithoutSpecialChars123',
      expected: {
        score: 3,
        checks: {
          minLength8: true,
          hasUpper: true,
          hasLower: true,
          hasDigit: true,
          hasSpecial: false,
        },
      },
      description: 'long password missing special character',
    },
    {
      password: '!@#$%^&*()',
      expected: {
        score: 1,
        checks: {
          minLength8: true,
          hasUpper: false,
          hasLower: false,
          hasDigit: false,
          hasSpecial: true,
        },
      },
      description: 'only special characters',
    },
    {
      password: '123456789',
      expected: {
        score: 1,
        checks: {
          minLength8: true,
          hasUpper: false,
          hasLower: false,
          hasDigit: true,
          hasSpecial: false,
        },
      },
      description: 'only digits',
    },
    {
      password: 'ABCDEFGHI',
      expected: {
        score: 1,
        checks: {
          minLength8: true,
          hasUpper: true,
          hasLower: false,
          hasDigit: false,
          hasSpecial: false,
        },
      },
      description: 'only uppercase letters',
    },
    {
      password: 'abcdefghijklmnop',
      expected: {
        score: 1,
        checks: {
          minLength8: true,
          hasUpper: false,
          hasLower: true,
          hasDigit: false,
          hasSpecial: false,
        },
      },
      description: 'only lowercase letters',
    },
    {
      password: 'Pass123!',
      expected: {
        score: 4,
        checks: {
          minLength8: true,
          hasUpper: true,
          hasLower: true,
          hasDigit: true,
          hasSpecial: true,
        },
      },
      description: 'minimum strong password',
    },
  ];

  testCases.forEach(({ password, expected, description }) => {
    it(`returns correct strength for ${description}`, () => {
      const { result } = renderHook(() => usePasswordStrength(password));

      expect(result.current).toEqual(expected);
    });
  });

  it('memoizes the result to prevent unnecessary recalculations', () => {
    const { result, rerender } = renderHook(
      ({ password }) => usePasswordStrength(password),
      { initialProps: { password: 'Password1!' } }
    );

    const firstResult = result.current;

    // Rerender with same password
    rerender({ password: 'Password1!' });

    // Should return the same object reference (memoized)
    expect(result.current).toBe(firstResult);
  });

  it('updates result when password changes', () => {
    const { result, rerender } = renderHook(
      ({ password }) => usePasswordStrength(password),
      { initialProps: { password: 'weak' } }
    );

    expect(result.current.score).toBe(0);

    // Change to strong password
    rerender({ password: 'Password1!' });

    expect(result.current.score).toBe(4);
  });

  it('handles null/undefined password gracefully', () => {
    const { result: result1 } = renderHook(() => usePasswordStrength(null as any));
    const { result: result2 } = renderHook(() => usePasswordStrength(undefined as any));

    const expectedEmpty = {
      score: 0,
      checks: {
        minLength8: false,
        hasUpper: false,
        hasLower: false,
        hasDigit: false,
        hasSpecial: false,
      },
    };

    expect(result1.current).toEqual(expectedEmpty);
    expect(result2.current).toEqual(expectedEmpty);
  });

  it('correctly identifies special characters', () => {
    const passwordsWithSpecialChars = [
      'Password1!',
      'Password1@',
      'Password1#',
      'Password1$',
      'Password1%',
      'Password1^',
      'Password1&',
      'Password1*',
      'Password1(',
      'Password1)',
      'Password1-',
      'Password1_',
      'Password1+',
      'Password1=',
      'Password1[',
      'Password1]',
      'Password1{',
      'Password1}',
      'Password1|',
      'Password1\\',
      'Password1;',
      'Password1:',
      'Password1\'',
      'Password1"',
      'Password1<',
      'Password1>',
      'Password1,',
      'Password1.',
      'Password1?',
      'Password1/',
      'Password1~',
      'Password1`',
    ];

    passwordsWithSpecialChars.forEach(password => {
      const { result } = renderHook(() => usePasswordStrength(password));
      expect(result.current.checks.hasSpecial).toBe(true);
    });
  });

  it('correctly identifies missing special characters', () => {
    const passwordsWithoutSpecialChars = [
      'Password1',
      'Password',
      'password123',
      'PASSWORD123',
      'Pass123',
      'abc123DEF',
    ];

    passwordsWithoutSpecialChars.forEach(password => {
      const { result } = renderHook(() => usePasswordStrength(password));
      expect(result.current.checks.hasSpecial).toBe(false);
    });
  });
});

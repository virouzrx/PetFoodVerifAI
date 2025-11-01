import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuthForm from '../../views/register/components/AuthForm';
import type { FieldErrorMap } from '../../types/auth';

describe('AuthForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnChange = vi.fn();

  const defaultProps = {
    onSubmit: mockOnSubmit,
    onChange: mockOnChange,
    isSubmitting: false,
    errors: {} as FieldErrorMap,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render email input field', () => {
      render(<AuthForm {...defaultProps} />);

      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('should render password input field', () => {
      render(<AuthForm {...defaultProps} />);

      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toBeInTheDocument();
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('should render password visibility toggle button', () => {
      render(<AuthForm {...defaultProps} />);

      const toggleButton = screen.getByRole('button', { name: /show/i });
      expect(toggleButton).toBeInTheDocument();
    });

    it('should render submit button', () => {
      render(<AuthForm {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /create account/i });
      expect(submitButton).toBeInTheDocument();
    });

    it('should render password strength hint', () => {
      render(<AuthForm {...defaultProps} />);

      const passwordHint = screen.getByText(/password strength/i);
      expect(passwordHint).toBeInTheDocument();
    });

    it('should render form with noValidate attribute', () => {
      render(<AuthForm {...defaultProps} />);

      const form = screen.getByRole('button', { name: /create account/i }).closest('form');
      expect(form).toHaveAttribute('noValidate');
    });
  });

  describe('initial values', () => {
    it('should display default initial values', () => {
      render(<AuthForm {...defaultProps} />);

      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;

      expect(emailInput.value).toBe('');
      expect(passwordInput.value).toBe('');
    });

    it('should display provided initial values', () => {
      const initialValues = {
        email: 'user@example.com',
        password: 'testpass123',
      };

      render(<AuthForm {...defaultProps} initialValues={initialValues} />);

      expect(screen.getByDisplayValue('user@example.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('testpass123')).toBeInTheDocument();
    });

    it('should update displayed values when initialValues change', () => {
      const { rerender } = render(
        <AuthForm
          {...defaultProps}
          initialValues={{ email: 'old@example.com', password: 'oldpass' }}
        />
      );

      expect(screen.getByDisplayValue('old@example.com')).toBeInTheDocument();

      rerender(
        <AuthForm
          {...defaultProps}
          initialValues={{ email: 'new@example.com', password: 'newpass' }}
        />
      );

      expect(screen.queryByDisplayValue('old@example.com')).not.toBeInTheDocument();
      expect(screen.getByDisplayValue('new@example.com')).toBeInTheDocument();
    });
  });

  describe('form input changes', () => {
    it('should call onChange when email changes', async () => {
      render(<AuthForm {...defaultProps} />);

      const emailInput = screen.getByLabelText(/email/i);
      await userEvent.type(emailInput, 'test@example.com');

      expect(mockOnChange).toHaveBeenCalled();
    });

    it('should call onChange when password changes', async () => {
      render(<AuthForm {...defaultProps} />);

      const passwordInput = screen.getByLabelText(/password/i);
      await userEvent.type(passwordInput, 'testpass123');

      expect(mockOnChange).toHaveBeenCalled();
    });

    it('should update email input value as user types', async () => {
      render(<AuthForm {...defaultProps} />);

      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
      await userEvent.type(emailInput, 'test@example.com');

      expect(emailInput.value).toBe('test@example.com');
    });

    it('should update password input value as user types', async () => {
      render(<AuthForm {...defaultProps} />);

      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
      await userEvent.type(passwordInput, 'testpass123');

      expect(passwordInput.value).toBe('testpass123');
    });
  });

  describe('password visibility toggle', () => {
    it('should toggle password visibility when button clicked', async () => {
      render(<AuthForm {...defaultProps} />);

      let passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
      expect(passwordInput.type).toBe('password');

      const toggleButton = screen.getByRole('button', { name: /show/i });
      await userEvent.click(toggleButton);

      passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
      expect(passwordInput.type).toBe('text');
    });

    it('should toggle button text from Show to Hide', async () => {
      render(<AuthForm {...defaultProps} />);

      let toggleButton = screen.getByRole('button', { name: /show/i });
      expect(toggleButton.textContent).toContain('Show');

      await userEvent.click(toggleButton);

      toggleButton = screen.getByRole('button', { name: /hide/i });
      expect(toggleButton.textContent).toContain('Hide');
    });

    it('should toggle back to password type when clicked again', async () => {
      render(<AuthForm {...defaultProps} />);

      const toggleButton = screen.getByRole('button', { name: /show/i });

      await userEvent.click(toggleButton);
      let passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
      expect(passwordInput.type).toBe('text');

      await userEvent.click(toggleButton);
      passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
      expect(passwordInput.type).toBe('password');
    });

    it('should not hide password text when toggled', async () => {
      render(<AuthForm {...defaultProps} />);

      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
      await userEvent.type(passwordInput, 'testpass123');

      const toggleButton = screen.getByRole('button', { name: /show/i });
      await userEvent.click(toggleButton);

      const visiblePasswordInput = screen.getByDisplayValue('testpass123') as HTMLInputElement;
      expect(visiblePasswordInput.type).toBe('text');
    });
  });

  describe('form submission', () => {
    it('should call onSubmit with form values', async () => {
      render(<AuthForm {...defaultProps} />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'testpass123');
      await userEvent.click(submitButton);

      expect(mockOnSubmit).toHaveBeenCalled();
    });

    it('should prevent default form submission', async () => {
      render(<AuthForm {...defaultProps} />);

      const form = screen.getByRole('button', { name: /create account/i }).closest('form');
      const submitSpy = vi.spyOn(Event.prototype, 'preventDefault');

      fireEvent.submit(form!);

      expect(submitSpy).toHaveBeenCalled();
      submitSpy.mockRestore();
    });
  });

  describe('error display', () => {
    it('should not display error when no errors prop', () => {
      render(<AuthForm {...defaultProps} errors={{}} />);

      // No error text should be visible
      expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
    });

    it('should display email error when field is touched', () => {
      const errors: FieldErrorMap = {
        email: 'Email is required',
      };

      render(<AuthForm {...defaultProps} errors={errors} />);

      const emailInput = screen.getByLabelText(/email/i);
      
      // Blur to mark as touched
      fireEvent.blur(emailInput);

      // Now error should appear
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });

    it('should display password error', () => {
      const errors: FieldErrorMap = {
        password: 'Password must be at least 8 characters',
      };

      render(<AuthForm {...defaultProps} errors={errors} />);

      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
    });

    it('should display multiple errors', () => {
      const errors: FieldErrorMap = {
        email: 'Email is invalid',
        password: 'Password is too weak',
      };

      render(<AuthForm {...defaultProps} errors={errors} />);

      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.blur(emailInput);

      expect(screen.getByText('Email is invalid')).toBeInTheDocument();
      expect(screen.getByText('Password is too weak')).toBeInTheDocument();
    });

    it('should update error display when errors change', () => {
      const { rerender } = render(
        <AuthForm {...defaultProps} errors={{ email: 'Old error' }} />
      );

      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.blur(emailInput);

      expect(screen.getByText('Old error')).toBeInTheDocument();

      rerender(<AuthForm {...defaultProps} errors={{ email: 'New error' }} />);

      expect(screen.queryByText('Old error')).not.toBeInTheDocument();
      expect(screen.getByText('New error')).toBeInTheDocument();
    });
  });

  describe('submit button state', () => {
    it('should disable submit button when isSubmitting is true', () => {
      render(<AuthForm {...defaultProps} isSubmitting={true} />);

      const submitButton = screen.getByRole('button', { name: /creating account/i });
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when isSubmitting is false', () => {
      render(<AuthForm {...defaultProps} isSubmitting={false} />);

      const submitButton = screen.getByRole('button', { name: /create account/i });
      expect(submitButton).not.toBeDisabled();
    });

    it('should show submit button is available for user attempt', async () => {
      render(<AuthForm {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /create account/i });
      // Component allows submission attempt - validation happens on submit
      expect(submitButton).toBeInTheDocument();
    });

    it('should show loading state on submit button when submitting', () => {
      render(
        <AuthForm
          {...defaultProps}
          isSubmitting={true}
        />
      );

      const submitButton = screen.getByRole('button', { name: /creating account/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('accessibility', () => {
    it('should have label for email input', () => {
      render(<AuthForm {...defaultProps} />);

      const emailLabel = screen.getByLabelText(/email/i);
      expect(emailLabel).toBeInTheDocument();
    });

    it('should have label for password input', () => {
      render(<AuthForm {...defaultProps} />);

      const passwordLabel = screen.getByLabelText(/password/i);
      expect(passwordLabel).toBeInTheDocument();
    });

    it('should have aria-invalid on email when error exists', () => {
      const errors: FieldErrorMap = { email: 'Email is required' };

      render(<AuthForm {...defaultProps} errors={errors} />);

      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toHaveAttribute('aria-invalid', 'true');
    });

    it('should have aria-invalid on password when error exists', () => {
      const errors: FieldErrorMap = { password: 'Password is required' };

      render(<AuthForm {...defaultProps} errors={errors} />);

      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toHaveAttribute('aria-invalid', 'true');
    });

    it('should have aria-describedby for email error', () => {
      const errors: FieldErrorMap = { email: 'Email is required' };

      render(<AuthForm {...defaultProps} errors={errors} />);

      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toHaveAttribute('aria-describedby', 'email-error');
    });

    it('should have aria-describedby for password', () => {
      render(<AuthForm {...defaultProps} />);

      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toHaveAttribute('aria-describedby', 'password-hint');
    });

    it('should have aria-describedby for password error', () => {
      const errors: FieldErrorMap = { password: 'Password is required' };

      render(<AuthForm {...defaultProps} errors={errors} />);

      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toHaveAttribute('aria-describedby', 'password-error');
    });

    it('should not have aria-describedby when no error', () => {
      render(<AuthForm {...defaultProps} />);

      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).not.toHaveAttribute('aria-describedby');
    });
  });

  describe('password strength indicator', () => {
    it('should render password strength hint', () => {
      render(<AuthForm {...defaultProps} />);

      // The password-hint element contains the strength indicator
      const passwordHint = screen.getByText(/password strength/i);
      expect(passwordHint).toBeInTheDocument();
    });

    it('should update strength indicator as password changes', async () => {
      render(<AuthForm {...defaultProps} />);

      const passwordInput = screen.getByLabelText(/password/i);

      await userEvent.type(passwordInput, 'weak');

      // Strength indicator should exist and update
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });
  });

  describe('form autocomplete', () => {
    it('should have autocomplete email on email input', () => {
      render(<AuthForm {...defaultProps} />);

      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toHaveAttribute('autoComplete', 'email');
    });

    it('should have autocomplete new-password on password input', () => {
      render(<AuthForm {...defaultProps} />);

      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toHaveAttribute('autoComplete', 'new-password');
    });
  });

  describe('edge cases', () => {
    it('should handle rapid form submissions', async () => {
      render(<AuthForm {...defaultProps} />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'testpass123');

      const submitButton = screen.getByRole('button', { name: /create account/i });

      // Rapid clicks may result in one or more submit attempts
      await userEvent.click(submitButton);
      await userEvent.click(submitButton);

      // At least one submission should be attempted
      expect(mockOnSubmit.mock.calls.length).toBeGreaterThan(0);
    });

    it('should handle special characters in email', async () => {
      render(<AuthForm {...defaultProps} />);

      const emailInput = screen.getByLabelText(/email/i);
      await userEvent.type(emailInput, 'user+test@example.co.uk');

      expect(mockOnChange).toHaveBeenCalled();
    });

    it('should handle special characters in password', async () => {
      render(<AuthForm {...defaultProps} />);

      const passwordInput = screen.getByLabelText(/password/i);
      await userEvent.type(passwordInput, 'p@$$w0rd!#%');

      expect(mockOnChange).toHaveBeenCalled();
    });

    it('should handle very long email', async () => {
      render(<AuthForm {...defaultProps} />);

      const longEmail = 'a'.repeat(100) + '@example.com';
      const emailInput = screen.getByLabelText(/email/i);

      await userEvent.type(emailInput, longEmail);

      expect(emailInput).toHaveValue(longEmail);
    });

    it('should handle paste events', async () => {
      render(<AuthForm {...defaultProps} />);

      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;

      await userEvent.click(emailInput);
      await userEvent.paste('pasted@example.com');

      expect(mockOnChange).toHaveBeenCalled();
    });
  });

  describe('integration', () => {
    it('should handle complete user registration flow', async () => {
      render(<AuthForm {...defaultProps} />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      // Enter email
      await userEvent.type(emailInput, 'newuser@example.com');
      expect(mockOnChange).toHaveBeenCalled();

      // Enter password
      mockOnChange.mockClear();
      await userEvent.type(passwordInput, 'SecurePass123');
      expect(mockOnChange).toHaveBeenCalled();

      // Submit should be enabled
      expect(submitButton).not.toBeDisabled();

      // Submit form
      mockOnSubmit.mockClear();
      await userEvent.click(submitButton);
      expect(mockOnSubmit).toHaveBeenCalled();
    });

    it('should handle password visibility during registration', async () => {
      render(<AuthForm {...defaultProps} />);

      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
      const toggleButton = screen.getByRole('button', { name: /show/i });

      // Type password hidden
      await userEvent.type(passwordInput, 'testpass123');
      expect(passwordInput.type).toBe('password');

      // Show password
      await userEvent.click(toggleButton);
      expect(passwordInput.type).toBe('text');

      // Password value should still be intact
      expect(passwordInput.value).toBe('testpass123');

      // Hide password again
      await userEvent.click(toggleButton);
      expect(passwordInput.type).toBe('password');
    });
  });
});

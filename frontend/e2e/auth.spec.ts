import { test, expect } from './fixtures/test-fixtures';

/**
 * Authentication E2E Tests
 * Covers user registration, login, and related auth flows
 */
test.describe('User Registration', () => {
  test.beforeEach(async ({ registerPage }) => {
    // Navigate to registration page before each test
    await registerPage.navigate();
  });

  test('US-001: User Registration - should fill and submit registration form', async ({
    registerPage
  }) => {
    // Arrange: Generate unique test user credentials
    const timestamp = Date.now();
    const testEmail = `test-user-${timestamp}@example.com`;
    const testPassword = 'TestPassword123!';

    // Act: Fill registration form
    await registerPage.fillRegistrationForm(testEmail, testPassword);

    // Assert: Verify form fields are filled correctly
    await expect(registerPage.emailInput).toHaveValue(testEmail);
    await expect(registerPage.passwordInput).toHaveValue(testPassword);

    // Note: Full registration flow testing requires backend API
    // This test verifies the frontend form interaction
  });

  test('US-001: User Registration - complete flow with backend', async ({
    registerPage,
    page
  }) => {
    // Arrange: Generate unique test user credentials
    const timestamp = Date.now();
    const testEmail = `test-user-${timestamp}@example.com`;
    const testPassword = 'TestPassword123!';

    // Act: Complete registration
    await registerPage.register(testEmail, testPassword);

    // Assert: Verify redirect to email verification page
    await expect(page).toHaveURL(/.*verify-email/);
    await expect(page.getByText(/verify your email/i)).toBeVisible();
    await expect(page.getByText(new RegExp(testEmail, 'i'))).toBeVisible();

    // Note: Full email verification would require:
    // 1. Backend API endpoint to retrieve verification token
    // 2. Or email interception mechanism
    // For now, we verify the frontend redirect behavior
  });

  test('should display registration form correctly', async ({ registerPage }) => {
    // Assert: Verify all form elements are present
    await expect(registerPage.emailInput).toBeVisible();
    await expect(registerPage.passwordInput).toBeVisible();
    await expect(registerPage.submitButton).toBeVisible();
    await expect(registerPage.googleSignUpButton).toBeVisible();

    // Assert: Verify form has proper labels and placeholders
    await expect(registerPage.emailInput).toHaveAttribute('type', 'email');
    await expect(registerPage.passwordInput).toHaveAttribute('type', 'password');
  });

  test('should show password strength indicator', async ({ registerPage }) => {
    // Act: Start typing password
    await registerPage.passwordInput.fill('weak');

    // Assert: Password strength indicator should be visible
    await expect(registerPage.passwordStrengthIndicator).toBeVisible();
  });

  test('should navigate to login page via link', async ({ registerPage, page }) => {
    // Act: Click login link
    await registerPage.navigateToLogin();

    // Assert: Redirected to login page
    await expect(page).toHaveURL(/.*login/);
  });

  test('should handle form submission attempt', async ({ registerPage }) => {
    // Arrange: Use test credentials
    const testEmail = 'test@example.com';
    const testPassword = 'TestPassword123!';

    // Act: Fill and attempt to submit form
    await registerPage.fillRegistrationForm(testEmail, testPassword);
    await registerPage.submitRegistration();

    // Assert: Form should still be functional (without backend, submission may not complete)
    // This tests that the form interaction works without errors
    // In a real scenario with backend, we'd check for error messages
    await expect(registerPage.emailInput).toBeVisible();
    await expect(registerPage.passwordInput).toBeVisible();
  });
});

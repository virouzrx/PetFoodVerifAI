import { test, expect } from './fixtures/test-fixtures';

/**
 * Example E2E test demonstrating Page Object Model pattern
 * This test suite shows best practices for Playwright testing
 */
test.describe('Home Page', () => {
  test.beforeEach(async ({ homePage }) => {
    // Setup: Navigate to home page before each test
    await homePage.navigate();
  });

  test('should display the home page correctly', async ({ homePage }) => {
    // Arrange & Act - done in beforeEach

    // Assert
    await expect(homePage.navigationBar).toBeVisible();
  });

  test('should navigate to login page', async ({ homePage, page }) => {
    // Act
    await homePage.navigateToLogin();

    // Assert
    await expect(page).toHaveURL(/.*login/);
  });

  test('should have accessible navigation elements', async ({ homePage }) => {
    // Assert - testing accessibility
    await expect(homePage.loginButton).toBeVisible();
  });

  // Visual regression test example
  test('should match homepage screenshot', async ({ page, homePage }) => {
    // Visual comparison test
    await expect(page).toHaveScreenshot('homepage.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });
});

test.describe('Login Page', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.navigate();
  });

  test('should display login form', async ({ loginPage }) => {
    // Assert
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.loginButton).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ loginPage }) => {
    // Act
    await loginPage.login('invalid@example.com', 'wrongpassword');

    // Assert - wait for error message to appear
    await expect(loginPage.errorMessage).toBeVisible({ timeout: 5000 });
  });

  test('should have accessible form elements', async ({ loginPage }) => {
    // Assert - testing accessibility with labels
    await expect(loginPage.emailInput).toHaveAttribute('type', 'email');
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
  });

  test('should navigate to forgot password page', async ({ loginPage, page }) => {
    // Act
    await loginPage.forgotPasswordLink.click();

    // Assert
    await expect(page).toHaveURL(/.*forgot-password/);
  });
});

// Example of API testing within E2E tests
test.describe('API Integration', () => {
  test('should receive valid response from health endpoint', async ({ request }) => {
    // Act - make API call
    const response = await request.get('/api/health');

    // Assert
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
  });
});


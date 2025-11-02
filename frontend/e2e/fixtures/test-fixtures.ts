import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { HomePage } from '../pages/HomePage';
import { RegisterPage } from '../pages/RegisterPage';
import { VerifyEmailPage } from '../pages/VerifyEmailPage';

/**
 * Custom test fixtures that extend Playwright's base test
 * This provides page objects to all tests automatically
 */
type TestFixtures = {
  loginPage: LoginPage;
  homePage: HomePage;
  registerPage: RegisterPage;
  verifyEmailPage: VerifyEmailPage;
};

/**
 * Extended test with page object fixtures
 * Use this in your tests instead of the default 'test' from @playwright/test
 * 
 * Example:
 * import { test, expect } from '../fixtures/test-fixtures';
 * 
 * test('should login successfully', async ({ loginPage }) => {
 *   await loginPage.navigate();
 *   await loginPage.login('user@example.com', 'password123');
 * });
 */
export const test = base.extend<TestFixtures>({
  loginPage: async ({ page }, provide) => {
    const loginPage = new LoginPage(page);
    await provide(loginPage);
  },

  homePage: async ({ page }, provide) => {
    const homePage = new HomePage(page);
    await provide(homePage);
  },

  registerPage: async ({ page }, provide) => {
    const registerPage = new RegisterPage(page);
    await provide(registerPage);
  },

  verifyEmailPage: async ({ page }, provide) => {
    const verifyEmailPage = new VerifyEmailPage(page);
    await provide(verifyEmailPage);
  },
});

export { expect } from '@playwright/test';


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
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  homePage: async ({ page }, use) => {
    const homePage = new HomePage(page);
    await use(homePage);
  },

  registerPage: async ({ page }, use) => {
    const registerPage = new RegisterPage(page);
    await use(registerPage);
  },

  verifyEmailPage: async ({ page }, use) => {
    const verifyEmailPage = new VerifyEmailPage(page);
    await use(verifyEmailPage);
  },
});

export { expect } from '@playwright/test';


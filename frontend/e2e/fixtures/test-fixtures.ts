import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { HomePage } from '../pages/HomePage';

/**
 * Custom test fixtures that extend Playwright's base test
 * This provides page objects to all tests automatically
 */
type TestFixtures = {
  loginPage: LoginPage;
  homePage: HomePage;
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
});

export { expect } from '@playwright/test';


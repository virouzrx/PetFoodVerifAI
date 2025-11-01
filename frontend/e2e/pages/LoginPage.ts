import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object for the Login Page
 * Implements the Page Object Model pattern for maintainable tests
 */
export class LoginPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /**
   * Locators for login page elements using resilient selectors
   */
  get emailInput() {
    return this.getByLabel(/email/i);
  }

  get passwordInput() {
    return this.getByLabel(/password/i);
  }

  get loginButton() {
    return this.getByRole('button', { name: /sign in|log in/i });
  }

  get forgotPasswordLink() {
    return this.getByRole('link', { name: /forgot password/i });
  }

  get signUpLink() {
    return this.getByRole('link', { name: /sign up|register/i });
  }

  get errorMessage() {
    return this.getByRole('alert');
  }

  /**
   * Navigate to the login page
   */
  async navigate() {
    await this.goto('/login');
    await this.waitForPageLoad();
  }

  /**
   * Perform login with credentials
   */
  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  /**
   * Check if user is on the login page
   */
  async isOnLoginPage() {
    return await this.loginButton.isVisible();
  }

  /**
   * Get error message text
   */
  async getErrorText() {
    return await this.errorMessage.textContent();
  }
}


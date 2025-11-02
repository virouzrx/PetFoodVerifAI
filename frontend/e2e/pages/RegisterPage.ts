import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object for the Registration Page
 * Implements the Page Object Model pattern for maintainable tests
 */
export class RegisterPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /**
   * Locators for registration page elements using resilient selectors
   */
  get emailInput() {
    return this.page.getByLabel(/email/i);
  }

  get passwordInput() {
    return this.page.getByLabel(/password/i);
  }

  get submitButton() {
    return this.page.getByRole('button', { name: 'Create account' });
  }

  get googleSignUpButton() {
    return this.page.getByRole('button', { name: /sign up with google/i });
  }

  get loginLink() {
    return this.page.getByRole('link', { name: /sign in|log in/i });
  }

  get errorMessage() {
    return this.page.getByRole('alert');
  }

  get passwordStrengthIndicator() {
    return this.page.getByText(/password strength/i);
  }

  /**
   * Navigate to the registration page
   */
  async navigate() {
    await this.goto('/register');
    await this.waitForPageLoad();
  }

  /**
   * Fill the registration form with email and password
   */
  async fillRegistrationForm(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  /**
   * Submit the registration form
   */
  async submitRegistration() {
    await this.submitButton.click();
  }

  /**
   * Perform complete registration process
   */
  async register(email: string, password: string) {
    await this.fillRegistrationForm(email, password);
    await this.submitRegistration();
  }

  /**
   * Check if user is on the registration page
   */
  async isOnRegistrationPage() {
    return await this.submitButton.isVisible();
  }

  /**
   * Get error message text
   */
  async getErrorText() {
    return await this.errorMessage.textContent();
  }

  /**
   * Navigate to login page via link
   */
  async navigateToLogin() {
    await this.loginLink.click();
  }
}

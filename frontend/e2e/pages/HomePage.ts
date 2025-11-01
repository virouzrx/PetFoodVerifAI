import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object for the Home/Landing Page
 */
export class HomePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /**
   * Locators for home page elements
   */
  get heroSection() {
    return this.getByRole('banner');
  }

  get loginButton() {
    return this.getByRole('link', { name: /login|sign in/i });
  }

  get signUpButton() {
    return this.getByRole('link', { name: /sign up|register|get started/i });
  }

  get navigationBar() {
    return this.getByRole('navigation');
  }

  /**
   * Navigate to the home page
   */
  async navigate() {
    await this.goto('/');
    await this.waitForPageLoad();
  }

  /**
   * Navigate to login page via button
   */
  async navigateToLogin() {
    await this.loginButton.click();
  }

  /**
   * Navigate to sign up page via button
   */
  async navigateToSignUp() {
    await this.signUpButton.click();
  }
}


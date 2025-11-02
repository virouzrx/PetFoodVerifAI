import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object for the Email Verification Page
 * Implements the Page Object Model pattern for maintainable tests
 */
export class VerifyEmailPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /**
   * Locators for email verification page elements using resilient selectors
   */
  get verificationCodeInput() {
    return this.page.getByLabel(/verification code|token/i);
  }

  get submitButton() {
    return this.page.getByRole('button', { name: /verify|submit/i });
  }

  get resendEmailButton() {
    return this.page.getByRole('button', { name: /resend.*email/i });
  }

  get successMessage() {
    return this.page.getByText(/verified successfully|email verified/i);
  }

  get countdownTimer() {
    return this.page.getByText(/expires in|token expires/i);
  }

  get expiredMessage() {
    return this.page.getByText(/expired/i);
  }

  get errorMessage() {
    return this.page.getByRole('alert');
  }

  get emailResendInput() {
    return this.page.getByPlaceholder(/enter your email address/i);
  }

  /**
   * Navigate to the email verification page
   */
  async navigate() {
    await this.goto('/verify-email');
    await this.waitForPageLoad();
  }

  /**
   * Fill the verification code input
   */
  async fillVerificationCode(code: string) {
    await this.verificationCodeInput.fill(code);
  }

  /**
   * Submit the verification form
   */
  async submitVerification() {
    await this.submitButton.click();
  }

  /**
   * Perform complete verification process
   */
  async verifyEmail(code: string) {
    await this.fillVerificationCode(code);
    await this.submitVerification();
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(email?: string) {
    if (email) {
      await this.emailResendInput.fill(email);
    }
    await this.resendEmailButton.click();
  }

  /**
   * Check if user is on the verification page
   */
  async isOnVerificationPage() {
    return await this.submitButton.isVisible();
  }

  /**
   * Get error message text
   */
  async getErrorText() {
    return await this.errorMessage.textContent();
  }

  /**
   * Get success message text
   */
  async getSuccessText() {
    return await this.successMessage.textContent();
  }

  /**
   * Wait for verification success
   */
  async waitForVerificationSuccess(timeout = 10000) {
    await this.page.waitForURL('**/analyze', { timeout });
  }

  /**
   * Check if verification was successful by URL change
   */
  async isVerificationSuccessful() {
    return this.page.url().includes('/analyze');
  }
}

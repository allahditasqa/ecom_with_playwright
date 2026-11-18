import { Locator, Page } from '@playwright/test';
import { BasePage } from './basePage';
import { User } from '../data/userBuilder';

export class LoginPage extends BasePage {
  protected get path(): string {
    return '/login';
  }
  readonly loginHeading: Locator;
  readonly signupHeading: Locator;
  readonly loginEmail: Locator;
  readonly loginPassword: Locator;
  readonly loginButton: Locator;
  readonly loginError: Locator;
  readonly signupName: Locator;
  readonly signupEmail: Locator;
  readonly signupButton: Locator;
  readonly signupError: Locator;

  constructor(page: Page) {
    super(page);
    this.loginHeading = page.getByRole('heading', { name: 'Login to your account' });
    this.signupHeading = page.getByRole('heading', { name: 'New User Signup!' });
    this.loginEmail = page.locator('[data-qa=login-email]');
    this.loginPassword = page.locator('[data-qa=login-password]');
    this.loginButton = page.locator('[data-qa=login-button]');
    this.loginError = page.locator('.login-form p');
    this.signupName = page.locator('[data-qa=signup-name]');
    this.signupEmail = page.locator('[data-qa=signup-email]');
    this.signupButton = page.locator('[data-qa=signup-button]');
    this.signupError = page.locator('.signup-form p');
  }

  async login(email: string, password: string): Promise<void> {
    await this.loginEmail.fill(email);
    await this.loginPassword.fill(password);
    await this.loginButton.click();
  }

  async startSignup(name: string, email: string): Promise<void> {
    await this.signupName.fill(name);
    await this.signupEmail.fill(email);
    await this.signupButton.click();
  }

  /** Full UI login; returns once the header shows the user as logged in. */
  async loginAs(user: Pick<User, 'email' | 'password'>): Promise<void> {
    // One retry: right after API account creation the shared site occasionally rejects the first login.
    for (let attempt = 1; attempt <= 2; attempt++) {
      await this.open();
      await this.login(user.email, user.password);
      try {
        await this.header.loggedInAs.waitFor({ timeout: 10_000 });
        return;
      } catch (error) {
        if (attempt === 2) throw error;
      }
    }
  }
}

import { Locator, Page } from '@playwright/test';
import { BasePage } from './basePage';
import { User } from '../data/userBuilder';

/** "Enter Account Information" form + the confirmation pages that follow. */
export class SignupPage extends BasePage {
  protected get path(): string {
    return '/signup';
  }
  readonly heading: Locator;
  readonly password: Locator;
  readonly createAccountButton: Locator;
  readonly accountCreated: Locator;
  readonly continueButton: Locator;
  readonly accountDeleted: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByText('Enter Account Information');
    this.password = page.locator('[data-qa=password]');
    this.createAccountButton = page.locator('[data-qa=create-account]');
    this.accountCreated = page.locator('[data-qa=account-created]');
    this.continueButton = page.locator('[data-qa=continue-button]');
    this.accountDeleted = page.locator('[data-qa=account-deleted]');
  }

  async fillAndSubmit(user: User): Promise<void> {
    const p = this.page;
    await p.locator(user.title === 'Mr' ? '#id_gender1' : '#id_gender2').check();
    await this.password.fill(user.password);
    await p.locator('[data-qa=days]').selectOption(user.birthDay);
    await p.locator('[data-qa=months]').selectOption(user.birthMonth);
    await p.locator('[data-qa=years]').selectOption(user.birthYear);
    await p.locator('#newsletter').check();
    await p.locator('#optin').check();
    await p.locator('[data-qa=first_name]').fill(user.firstName);
    await p.locator('[data-qa=last_name]').fill(user.lastName);
    await p.locator('[data-qa=company]').fill(user.company);
    await p.locator('[data-qa=address]').fill(user.address1);
    await p.locator('[data-qa=address2]').fill(user.address2);
    await p.locator('[data-qa=country]').selectOption(user.country);
    await p.locator('[data-qa=state]').fill(user.state);
    await p.locator('[data-qa=city]').fill(user.city);
    await p.locator('[data-qa=zipcode]').fill(user.zipcode);
    await p.locator('[data-qa=mobile_number]').fill(user.mobile);
    await this.createAccountButton.click();
  }
}

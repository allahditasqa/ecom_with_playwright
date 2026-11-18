import { Locator, Page } from '@playwright/test';

/** Footer: newsletter subscription + the scroll-up arrow. */
export class Footer {
  readonly heading: Locator;
  readonly emailInput: Locator;
  readonly subscribeButton: Locator;
  readonly successAlert: Locator;
  readonly scrollUpArrow: Locator;

  constructor(page: Page) {
    this.heading = page.locator('footer').getByRole('heading', { name: 'Subscription' });
    this.emailInput = page.locator('#susbscribe_email'); // (sic) the typo is in the site's markup
    this.subscribeButton = page.locator('#subscribe');
    this.successAlert = page.locator('#success-subscribe');
    this.scrollUpArrow = page.locator('#scrollUp');
  }

  async scrollToBottom(): Promise<void> {
    await this.heading.scrollIntoViewIfNeeded();
  }

  async subscribe(email: string): Promise<void> {
    await this.scrollToBottom();
    await this.emailInput.fill(email);
    await this.subscribeButton.click();
  }
}

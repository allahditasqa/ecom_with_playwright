import { Locator, Page } from '@playwright/test';
import { BasePage } from './basePage';

export class ContactUsPage extends BasePage {
  readonly heading: Locator;
  readonly name: Locator;
  readonly email: Locator;
  readonly subject: Locator;
  readonly message: Locator;
  readonly upload: Locator;
  readonly submit: Locator;
  readonly success: Locator;
  readonly homeButton: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Get In Touch' });
    this.name = page.locator('[data-qa=name]');
    this.email = page.locator('[data-qa=email]');
    this.subject = page.locator('[data-qa=subject]');
    this.message = page.locator('[data-qa=message]');
    this.upload = page.locator('input[name=upload_file]');
    this.submit = page.locator('[data-qa=submit-button]');
    this.success = page.locator('.status.alert-success');
    this.homeButton = page.locator('#form-section a.btn-success');
  }

  protected get path(): string {
    return '/contact_us';
  }
}

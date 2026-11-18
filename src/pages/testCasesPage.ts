import { Locator, Page } from '@playwright/test';
import { BasePage } from './basePage';

export class TestCasesPage extends BasePage {
  readonly heading: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Test Cases', exact: true });
  }

  protected get path(): string {
    return '/test_cases';
  }
}

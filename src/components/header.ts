import { Locator, Page } from '@playwright/test';

/** Top navigation bar shown on every page. */
export class Header {
  readonly loggedInAs: Locator;
  constructor(private readonly page: Page) {
    this.loggedInAs = page.locator('header').getByText('Logged in as');
  }

  private link(href: string): Locator {
    return this.page.locator(`header a[href="${href}"]`);
  }

  get home(): Locator {
    return this.link('/');
  }
  get products(): Locator {
    return this.link('/products');
  }
  get cart(): Locator {
    return this.link('/view_cart');
  }
  get signupLogin(): Locator {
    return this.link('/login');
  }
  get logout(): Locator {
    return this.link('/logout');
  }
  get deleteAccount(): Locator {
    return this.link('/delete_account');
  }
  get testCases(): Locator {
    return this.link('/test_cases');
  }
  get contactUs(): Locator {
    return this.link('/contact_us');
  }
  get loggedInName(): Locator {
    return this.loggedInAs.locator('b');
  }
}

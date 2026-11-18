import { Locator, Page } from '@playwright/test';

/** The "Added!" confirmation modal after clicking Add to cart. */
export class CartModal {
  readonly root: Locator;
  readonly message: Locator;
  readonly viewCart: Locator;
  readonly continueShopping: Locator;

  constructor(page: Page) {
    this.root = page.locator('#cartModal');
    this.message = this.root.getByText('Your product has been added to cart.');
    this.viewCart = this.root.getByRole('link', { name: 'View Cart' });
    this.continueShopping = this.root.getByRole('button', { name: 'Continue Shopping' });
  }
}

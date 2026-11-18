import { Locator, Page } from '@playwright/test';
import { BasePage } from './basePage';

export class CheckoutPage extends BasePage {
  readonly deliveryAddress: Locator;
  readonly billingAddress: Locator;
  readonly reviewRows: Locator;
  readonly comment: Locator;
  readonly placeOrder: Locator;
  readonly totalAmount: Locator;

  constructor(page: Page) {
    super(page);
    this.deliveryAddress = page.locator('#address_delivery');
    this.billingAddress = page.locator('#address_invoice');
    this.reviewRows = page.locator('#cart_info tbody tr');
    this.comment = page.locator('textarea[name=message]');
    this.placeOrder = page.getByRole('link', { name: 'Place Order' });
    this.totalAmount = page.locator('.cart_total_price').last();
  }

  protected get path(): string {
    return '/checkout';
  }
}

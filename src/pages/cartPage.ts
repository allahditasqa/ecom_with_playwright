import { Locator, Page } from '@playwright/test';
import { BasePage } from './basePage';

export interface CartLine {
  name: string;
  price: string;
  quantity: string;
  total: string;
}

export class CartPage extends BasePage {
  readonly rows: Locator;
  readonly emptyMessage: Locator;
  readonly proceedToCheckout: Locator;
  readonly checkoutModal: Locator;
  readonly modalRegisterLogin: Locator;
  readonly breadcrumb: Locator;

  constructor(page: Page) {
    super(page);
    this.rows = page.locator('#cart_info_table tbody tr');
    this.emptyMessage = page.locator('#empty_cart');
    this.proceedToCheckout = page.locator('.check_out');
    this.checkoutModal = page.locator('#checkoutModal');
    this.modalRegisterLogin = this.checkoutModal.getByRole('link', { name: 'Register / Login' });
    this.breadcrumb = page.locator('.breadcrumb');
  }

  protected get path(): string {
    return '/view_cart';
  }

  row(name: string): Locator {
    return this.rows.filter({ has: this.page.locator('.cart_description h4 a', { hasText: name }) });
  }

  async lines(): Promise<CartLine[]> {
    const count = await this.rows.count();
    const out: CartLine[] = [];
    for (let i = 0; i < count; i++) {
      const r = this.rows.nth(i);
      out.push({
        name: (await r.locator('.cart_description h4 a').innerText()).trim(),
        price: (await r.locator('.cart_price p').innerText()).trim(),
        quantity: (await r.locator('.cart_quantity button').innerText()).trim(),
        total: (await r.locator('.cart_total_price').innerText()).trim(),
      });
    }
    return out;
  }

  async remove(name: string): Promise<void> {
    await this.row(name).locator('.cart_quantity_delete').click();
  }
}

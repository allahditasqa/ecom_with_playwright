import { Page } from '@playwright/test';
import { Header } from '../components/header';
import { Footer } from '../components/footer';
import { CartModal } from '../components/cartModal';

export abstract class BasePage {
  readonly header: Header;
  readonly footer: Footer;
  readonly cartModal: CartModal;

  constructor(protected readonly page: Page) {
    this.header = new Header(page);
    this.footer = new Footer(page);
    this.cartModal = new CartModal(page);
  }

  protected abstract get path(): string;

  /**
   * Navigates to the page. The public site sometimes answers with a "heavy load (queue full)"
   * placeholder when many visitors are on it; that is an infrastructure hiccup, not a product
   * behaviour, so we reload a few times before giving up.
   */
  async open(): Promise<this> {
    for (let attempt = 1; attempt <= 4; attempt++) {
      await this.page.goto(this.path, { waitUntil: 'domcontentloaded' });
      const overloaded = await this.page.getByText('This website is under heavy load').count();
      if (!overloaded) break;
      await this.page.waitForTimeout(2_000 * attempt);
    }
    return this;
  }
}

import { Locator, Page } from '@playwright/test';
import { BasePage } from './basePage';

export const escapeRe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export class ProductsPage extends BasePage {
  protected get path(): string {
    return '/products';
  }
  readonly title: Locator;
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly cards: Locator;
  readonly names: Locator;
  readonly brandLinks: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.locator('.features_items .title');
    this.searchInput = page.locator('#search_product');
    this.searchButton = page.locator('#submit_search');
    this.cards = page.locator('.features_items .product-image-wrapper');
    this.names = page.locator('.features_items .productinfo p');
    this.brandLinks = page.locator('.brands-name a');
  }

  card(name: string): Locator {
    return this.cards.filter({
      has: this.page.locator('.productinfo p', { hasText: new RegExp(`^${escapeRe(name)}$`) }),
    });
  }

  async search(term: string): Promise<void> {
    await this.searchInput.fill(term);
    await this.searchButton.click();
    await this.title.filter({ hasText: 'Searched Products' }).waitFor();
  }

  async addToCartByIndex(index: number): Promise<{ name: string; price: string }> {
    const card = this.cards.nth(index);
    const name = (await card.locator('.productinfo p').innerText()).trim();
    const price = (await card.locator('.productinfo h2').innerText()).trim();
    await card.scrollIntoViewIfNeeded();
    await card.hover();
    await card.locator('.overlay-content a.add-to-cart').click();
    return { name, price };
  }

  async viewProduct(index = 0): Promise<void> {
    await this.cards.nth(index).getByRole('link', { name: 'View Product' }).click();
  }

  async openCategory(parent: 'Women' | 'Men' | 'Kids', sub: string): Promise<void> {
    await this.page.locator(`.category-products a[href="#${parent}"]`).click();
    await this.page.locator(`#${parent} a`, { hasText: sub }).click();
  }

  async openBrand(brand: string): Promise<void> {
    await this.page.locator(`.brands-name a[href="/brand_products/${brand}"]`).click();
  }
}

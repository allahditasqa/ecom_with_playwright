import { Locator, Page } from '@playwright/test';
import { BasePage } from './basePage';

export class ProductDetailPage extends BasePage {
  readonly info: Locator;
  readonly name: Locator;
  readonly category: Locator;
  readonly price: Locator;
  readonly availability: Locator;
  readonly condition: Locator;
  readonly brand: Locator;
  readonly quantity: Locator;
  readonly addToCartButton: Locator;
  readonly reviewHeading: Locator;
  readonly reviewName: Locator;
  readonly reviewEmail: Locator;
  readonly reviewText: Locator;
  readonly reviewSubmit: Locator;
  readonly reviewSuccess: Locator;

  constructor(
    page: Page,
    private readonly productId = 1,
  ) {
    super(page);
    this.info = page.locator('.product-information');
    this.name = this.info.locator('h2');
    this.category = this.info.locator('p', { hasText: 'Category:' });
    this.price = this.info.locator('span span');
    this.availability = this.info.locator('p', { hasText: 'Availability:' });
    this.condition = this.info.locator('p', { hasText: 'Condition:' });
    this.brand = this.info.locator('p', { hasText: 'Brand:' });
    this.quantity = page.locator('#quantity');
    this.addToCartButton = page.locator('button.cart');
    this.reviewHeading = page.getByRole('link', { name: 'Write Your Review' });
    this.reviewName = page.locator('#name');
    this.reviewEmail = page.locator('#email');
    this.reviewText = page.locator('#review');
    this.reviewSubmit = page.locator('#button-review');
    this.reviewSuccess = page.locator('#review-section .alert-success');
  }

  protected get path(): string {
    return `/product_details/${this.productId}`;
  }

  async setQuantity(qty: number): Promise<void> {
    await this.quantity.fill(String(qty));
  }

  async writeReview(name: string, email: string, text: string): Promise<void> {
    await this.reviewName.fill(name);
    await this.reviewEmail.fill(email);
    await this.reviewText.fill(text);
    await this.reviewSubmit.click();
  }
}

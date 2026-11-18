import { Locator, Page } from '@playwright/test';
import { BasePage } from './basePage';

export class HomePage extends BasePage {
  protected get path(): string {
    return '/';
  }
  readonly slider: Locator;
  readonly sliderHeading: Locator;
  readonly featuredItems: Locator;
  readonly recommended: Locator;
  readonly categorySidebar: Locator;

  constructor(page: Page) {
    super(page);
    this.slider = page.locator('#slider-carousel');
    this.sliderHeading = this.slider
      .getByRole('heading', { name: 'Full-Fledged practice website for Automation Engineers' })
      .first();
    this.featuredItems = page.locator('.features_items');
    this.recommended = page.locator('.recommended_items');
    this.categorySidebar = page.locator('.left-sidebar');
  }

  /** Add the first visible product of the "Recommended items" carousel to the cart. */
  async addFirstRecommendedToCart(): Promise<string> {
    await this.recommended.scrollIntoViewIfNeeded();
    const item = this.recommended.locator('.carousel-inner .item.active .product-image-wrapper').first();
    const name = (await item.locator('.productinfo p').innerText()).trim();
    await item.locator('a.add-to-cart').first().click();
    return name;
  }
}

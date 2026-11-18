import { Locator, Page } from '@playwright/test';
import { BasePage } from './basePage';
import { PaymentCard } from '../data/payment';

export class PaymentPage extends BasePage {
  readonly nameOnCard: Locator;
  readonly cardNumber: Locator;
  readonly cvc: Locator;
  readonly expiryMonth: Locator;
  readonly expiryYear: Locator;
  readonly payButton: Locator;
  readonly orderPlaced: Locator;
  readonly successMessage: Locator;
  readonly downloadInvoice: Locator;
  readonly continueButton: Locator;

  constructor(page: Page) {
    super(page);
    this.nameOnCard = page.locator('[data-qa=name-on-card]');
    this.cardNumber = page.locator('[data-qa=card-number]');
    this.cvc = page.locator('[data-qa=cvc]');
    this.expiryMonth = page.locator('[data-qa=expiry-month]');
    this.expiryYear = page.locator('[data-qa=expiry-year]');
    this.payButton = page.locator('[data-qa=pay-button]');
    this.orderPlaced = page.locator('[data-qa=order-placed]');
    this.successMessage = page.getByText('Congratulations! Your order has been confirmed!');
    this.downloadInvoice = page.getByRole('link', { name: 'Download Invoice' });
    this.continueButton = page.locator('[data-qa=continue-button]');
  }

  protected get path(): string {
    return '/payment';
  }

  async pay(card: PaymentCard): Promise<void> {
    await this.nameOnCard.fill(card.nameOnCard);
    await this.cardNumber.fill(card.number);
    await this.cvc.fill(card.cvc);
    await this.expiryMonth.fill(card.expiryMonth);
    await this.expiryYear.fill(card.expiryYear);
    await this.payButton.click();
  }
}

import { test, expect } from '../../src/fixtures';

/**
 * Genuine site defects, documented in DEFECTS.md. Each test asserts the CORRECT behaviour and is
 * marked with test.fail(): the suite stays green while the bug exists, and turns red ("expected to
 * fail, but passed") as soon as the site is fixed, reminding us to remove the marker.
 */
test.describe('UI - known defects', { tag: ['@ui', '@defect'] }, () => {
  test('DEF-02 - contact form must not accept an empty name, subject and message', async ({
    contactUsPage,
    page,
  }) => {
    test.fail(true, 'DEF-02: only the e-mail field is mandatory, see DEFECTS.md');
    await contactUsPage.open();
    await contactUsPage.email.fill('qa.tester@example.com');
    page.once('dialog', (d) => void d.accept());
    await contactUsPage.submit.click();
    await expect(contactUsPage.success).toBeHidden();
  });

  for (const [n, qty] of [
    [1, 0],
    [2, -3],
  ] as const) {
    test(`DEF-03.${n} - quantity ${qty} must not be accepted into the cart`, async ({
      productDetailPage,
      cartPage,
    }) => {
      test.fail(true, 'DEF-03: min=1 is only a client-side hint, cart accepts 0 / negative quantities');
      await productDetailPage.open();
      await productDetailPage.setQuantity(qty);
      await productDetailPage.addToCart();
      await expect(productDetailPage.cartModal.message).toBeVisible(); // the AJAX call has finished
      await cartPage.open();
      await expect(cartPage.rows).toHaveCount(0);
    });
  }
});

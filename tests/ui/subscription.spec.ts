import { test, expect } from '../../src/fixtures';

test.describe('Newsletter subscription', { tag: ['@ui', '@regression'] }, () => {
  test('TC10 - subscribe from the home page footer', { tag: '@smoke' }, async ({ homePage }) => {
    await homePage.open();
    await homePage.footer.subscribe('subscriber@example.com');
    await expect(homePage.footer.successAlert).toHaveText('You have been successfully subscribed!');
  });

  test('TC11 - subscribe from the cart page footer', async ({ cartPage }) => {
    await cartPage.open();
    await cartPage.footer.subscribe('subscriber@example.com');
    await expect(cartPage.footer.successAlert).toHaveText('You have been successfully subscribed!');
  });

  test('TC11b - subscription rejects a malformed e-mail', async ({ homePage }) => {
    await homePage.open();
    await homePage.footer.subscribe('no-at-sign');
    await expect(homePage.footer.successAlert).toBeHidden();
    expect(await homePage.footer.emailInput.evaluate((e: HTMLInputElement) => e.validity.typeMismatch)).toBe(
      true,
    );
  });

  test('TC11c - subscription rejects an empty e-mail', async ({ homePage }) => {
    await homePage.open();
    await homePage.footer.subscribe('');
    await expect(homePage.footer.successAlert).toBeHidden();
  });
});

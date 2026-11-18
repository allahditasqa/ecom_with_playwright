import { readFileSync } from 'node:fs';
import { test, expect } from '../../src/fixtures';
import { aUser } from '../../src/data/userBuilder';
import { testCard } from '../../src/data/payment';

test.describe('Checkout & orders', { tag: ['@ui', '@regression'] }, () => {
  test(
    'TC14 - place an order: register while checking out',
    { tag: '@smoke' },
    async ({ productsPage, cartPage, loginPage, signupPage, checkoutPage, paymentPage, api, page }) => {
      const user = aUser().build();
      try {
        await productsPage.open();
        await productsPage.addToCartByIndex(0);
        await productsPage.cartModal.viewCart.click();
        await expect(page).toHaveURL(/\/view_cart/);

        await cartPage.proceedToCheckout.click();
        await expect(cartPage.checkoutModal).toBeVisible();
        await cartPage.modalRegisterLogin.click();

        await loginPage.startSignup(user.name, user.email);
        await signupPage.fillAndSubmit(user);
        await expect(signupPage.accountCreated).toBeVisible();
        await signupPage.continueButton.click();
        await expect(loginPage.header.loggedInName).toHaveText(user.name);

        await cartPage.open();
        await expect(cartPage.rows).toHaveCount(1);
        await cartPage.proceedToCheckout.click();
        await expect(checkoutPage.deliveryAddress).toBeVisible();
        await checkoutPage.comment.fill('Please deliver in the evening');
        await checkoutPage.placeOrder.click();

        await paymentPage.pay(testCard(user.name));
        await expect(paymentPage.successMessage).toBeVisible();

        await loginPage.header.deleteAccount.click();
        await expect(signupPage.accountDeleted).toBeVisible();
      } finally {
        await api.deleteAccountQuietly(user);
      }
    },
  );

  test('TC15 - place an order: register before checkout', async ({
    loginPage,
    signupPage,
    productsPage,
    cartPage,
    checkoutPage,
    paymentPage,
    api,
  }) => {
    const user = aUser().build();
    try {
      await loginPage.open();
      await loginPage.startSignup(user.name, user.email);
      await signupPage.fillAndSubmit(user);
      await signupPage.continueButton.click();
      await expect(loginPage.header.loggedInName).toHaveText(user.name);

      await productsPage.open();
      await productsPage.addToCartByIndex(2);
      await productsPage.cartModal.viewCart.click();
      await cartPage.proceedToCheckout.click();
      await checkoutPage.placeOrder.click();
      await paymentPage.pay(testCard());
      await expect(paymentPage.orderPlaced).toHaveText('Order Placed!');
    } finally {
      await api.deleteAccountQuietly(user);
    }
  });

  test(
    'TC16 - place an order: login before checkout',
    { tag: '@smoke' },
    async ({ loggedInUser, productsPage, cartPage, checkoutPage, paymentPage }) => {
      await productsPage.open();
      await productsPage.addToCartByIndex(0);
      await productsPage.cartModal.viewCart.click();
      await cartPage.proceedToCheckout.click();
      await expect(checkoutPage.reviewRows.first()).toBeVisible();
      await checkoutPage.placeOrder.click();
      await paymentPage.pay(testCard(loggedInUser.name));
      await expect(paymentPage.orderPlaced).toHaveText('Order Placed!');
      await expect(paymentPage.successMessage).toBeVisible();
    },
  );

  test('TC23 - delivery and billing address match the registration details', async ({
    loggedInUser,
    productsPage,
    cartPage,
    checkoutPage,
  }) => {
    await productsPage.open();
    await productsPage.addToCartByIndex(0);
    await productsPage.cartModal.viewCart.click();
    await cartPage.proceedToCheckout.click();

    for (const box of [checkoutPage.deliveryAddress, checkoutPage.billingAddress]) {
      await expect(box).toContainText(`${loggedInUser.firstName} ${loggedInUser.lastName}`);
      await expect(box).toContainText(loggedInUser.company);
      await expect(box).toContainText(loggedInUser.address1);
      await expect(box).toContainText(loggedInUser.address2);
      await expect(box).toContainText(`${loggedInUser.city} ${loggedInUser.state} ${loggedInUser.zipcode}`);
      await expect(box).toContainText(loggedInUser.country);
      await expect(box).toContainText(loggedInUser.mobile);
    }
  });

  test('TC23b - order review lists the products and the correct total', async ({
    loggedInUser,
    productsPage,
    cartPage,
    checkoutPage,
  }) => {
    expect(loggedInUser.email).toBeTruthy();
    await productsPage.open();
    await productsPage.addToCartByIndex(0); // Blue Top  Rs. 500
    await productsPage.cartModal.continueShopping.click();
    await productsPage.addToCartByIndex(1); // Men Tshirt Rs. 400
    await productsPage.cartModal.viewCart.click();
    await cartPage.proceedToCheckout.click();
    await expect(checkoutPage.reviewRows).toHaveCount(3); // 2 lines + total row
    await expect(checkoutPage.totalAmount).toHaveText('Rs. 900');
  });

  test('TC24 - download the invoice after the order', async ({
    loggedInUser,
    productsPage,
    cartPage,
    checkoutPage,
    paymentPage,
    page,
  }) => {
    await productsPage.open();
    await productsPage.addToCartByIndex(0);
    await productsPage.cartModal.viewCart.click();
    await cartPage.proceedToCheckout.click();
    await checkoutPage.placeOrder.click();
    await paymentPage.pay(testCard(loggedInUser.name));
    await expect(paymentPage.orderPlaced).toBeVisible();

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      paymentPage.downloadInvoice.click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/invoice/i);
    const path = await download.path();
    const content = readFileSync(path, 'utf8');
    expect(content).toContain(`${loggedInUser.firstName} ${loggedInUser.lastName}`);
    expect(content).toContain('500');

    await paymentPage.continueButton.click();
    await expect(page).toHaveURL('/');
  });

  test('TC24b - guest is asked to register or login when checking out', async ({
    productsPage,
    cartPage,
    page,
  }) => {
    await productsPage.open();
    await productsPage.addToCartByIndex(0);
    await productsPage.cartModal.viewCart.click();
    await cartPage.proceedToCheckout.click();
    await expect(cartPage.checkoutModal).toBeVisible();
    await cartPage.modalRegisterLogin.click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('TC24c - payment form blocks an empty submit', async ({
    loggedInUser,
    productsPage,
    cartPage,
    checkoutPage,
    paymentPage,
    page,
  }) => {
    expect(loggedInUser.email).toBeTruthy();
    await productsPage.open();
    await productsPage.addToCartByIndex(0);
    await productsPage.cartModal.viewCart.click();
    await cartPage.proceedToCheckout.click();
    await checkoutPage.placeOrder.click();
    await paymentPage.payButton.click();
    await expect(page).toHaveURL(/\/payment$/);
    await expect(paymentPage.orderPlaced).toHaveCount(0);
  });
});

import { test, expect } from '../../src/fixtures';

test.describe('Cart', { tag: ['@ui', '@regression'] }, () => {
  test('TC12 - add two products to the cart', { tag: '@smoke' }, async ({ productsPage, cartPage }) => {
    await productsPage.open();
    const first = await productsPage.addToCartByIndex(0);
    await expect(productsPage.cartModal.message).toBeVisible();
    await productsPage.cartModal.continueShopping.click();
    const second = await productsPage.addToCartByIndex(1);
    await productsPage.cartModal.viewCart.click();

    await expect(cartPage.rows).toHaveCount(2);
    const lines = await cartPage.lines();
    expect(lines.map((l) => l.name)).toEqual([first.name, second.name]);
    for (const [i, expected] of [first, second].entries()) {
      expect(lines[i]?.price).toBe(expected.price);
      expect(lines[i]?.quantity).toBe('1');
      expect(lines[i]?.total).toBe(expected.price);
    }
  });

  test('TC13 - product quantity from the detail page is kept in the cart', async ({
    productDetailPage,
    cartPage,
  }) => {
    await productDetailPage.open();
    await productDetailPage.setQuantity(4);
    await productDetailPage.addToCartButton.click();
    await productDetailPage.cartModal.viewCart.click();

    const [line] = await cartPage.lines();
    expect(line?.quantity).toBe('4');
    expect(line?.price).toBe('Rs. 500');
    expect(line?.total).toBe('Rs. 2000');
  });

  test('TC13b - adding the same product twice increases the quantity', async ({ productsPage, cartPage }) => {
    await productsPage.open();
    await productsPage.addToCartByIndex(0);
    await productsPage.cartModal.continueShopping.click();
    await productsPage.addToCartByIndex(0);
    await productsPage.cartModal.viewCart.click();
    await expect(cartPage.rows).toHaveCount(1);
    expect((await cartPage.lines())[0]?.quantity).toBe('2');
  });

  test('TC17 - remove a product from the cart', { tag: '@smoke' }, async ({ productsPage, cartPage }) => {
    await productsPage.open();
    const { name } = await productsPage.addToCartByIndex(0);
    await productsPage.cartModal.viewCart.click();
    await expect(cartPage.row(name)).toBeVisible();

    await cartPage.remove(name);
    await expect(cartPage.row(name)).toHaveCount(0);
    await expect(cartPage.emptyMessage).toContainText('Cart is empty!');
  });

  test('TC17b - a fresh visitor has an empty cart', async ({ cartPage }) => {
    await cartPage.open();
    await expect(cartPage.emptyMessage).toContainText('Cart is empty!');
    await expect(cartPage.rows).toHaveCount(0);
  });

  test('TC22 - add a product from the recommended items', async ({ homePage, cartPage }) => {
    await homePage.open();
    const name = await homePage.addFirstRecommendedToCart();
    await homePage.cartModal.viewCart.click();
    await expect(cartPage.row(name).first()).toBeVisible();
  });

  test('TC20 - search products and verify the cart after login', async ({
    productsPage,
    cartPage,
    newUser,
    loginPage,
  }) => {
    await productsPage.open();
    await productsPage.search('top');
    const names = await productsPage.names.allInnerTexts();
    expect(names.length).toBeGreaterThan(0);
    for (let i = 0; i < Math.min(names.length, 2); i++) {
      await productsPage.addToCartByIndex(i);
      await productsPage.cartModal.continueShopping.click();
    }

    await cartPage.open();
    const expected = Math.min(names.length, 2);
    await expect(cartPage.rows).toHaveCount(expected);

    await loginPage.loginAs(newUser);
    await cartPage.open();
    await expect(cartPage.rows).toHaveCount(expected);
  });
});

test.describe('Cart with a saved session', { tag: ['@ui', '@regression'] }, () => {
  test.use({ storageState: '.auth/user.json' });

  test('TC22b - logged-in header is shown on the products page', async ({ productsPage, sharedUser }) => {
    await productsPage.open();
    await expect(productsPage.header.loggedInName).toHaveText(sharedUser.name);
  });
});

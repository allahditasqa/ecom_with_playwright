import { test, expect } from '../../src/fixtures';

test.describe('Products', { tag: ['@ui', '@regression'] }, () => {
  test(
    'TC08 - all products list and product detail page',
    { tag: '@smoke' },
    async ({ productsPage, productDetailPage, page }) => {
      await productsPage.open();
      await expect(productsPage.title).toHaveText('All Products');
      expect(await productsPage.cards.count()).toBeGreaterThan(0);

      await productsPage.viewProduct(0);
      await expect(page).toHaveURL(/\/product_details\/\d+/);
      await expect(productDetailPage.name).toBeVisible();
      await expect(productDetailPage.category).toBeVisible();
      await expect(productDetailPage.price).toContainText('Rs.');
      await expect(productDetailPage.availability).toContainText('In Stock');
      await expect(productDetailPage.condition).toContainText('New');
      await expect(productDetailPage.brand).toBeVisible();
    },
  );

  for (const [id, name, brand] of [
    [1, 'Blue Top', 'Polo'],
    [2, 'Men Tshirt', 'H&M'],
    [3, 'Sleeveless Dress', 'Madame'],
  ] as const) {
    test(`TC08b - product ${id} detail shows ${name} / ${brand}`, async ({ page, productDetailPage }) => {
      await page.goto(`/product_details/${id}`);
      await expect(productDetailPage.name).toHaveText(name);
      await expect(productDetailPage.brand).toContainText(brand);
    });
  }

  test('TC09 - search for a product', { tag: '@smoke' }, async ({ productsPage }) => {
    await productsPage.open();
    await productsPage.search('top');
    await expect(productsPage.title).toHaveText('Searched Products');
    // The site matches on name OR category ("Tops"), so assert on known names instead of every row.
    // eslint-disable-next-line playwright/prefer-web-first-assertions
    const names = await productsPage.names.allInnerTexts();
    expect(names.length).toBeGreaterThan(1);
    expect(names).toEqual(expect.arrayContaining(['Blue Top', 'Winter Top']));
  });

  test('TC09b - search with no match shows no products', async ({ productsPage }) => {
    await productsPage.open();
    await productsPage.search('zzzz-no-such-product');
    await expect(productsPage.title).toHaveText('Searched Products');
    await expect(productsPage.cards).toHaveCount(0);
  });

  test('TC09c - search is case-insensitive', async ({ productsPage }) => {
    await productsPage.open();
    await productsPage.search('BLUE TOP');
    await expect(productsPage.names.first()).toHaveText('Blue Top');
  });

  test('TC18 - view category products', async ({ productsPage }) => {
    await productsPage.open();
    await productsPage.openCategory('Women', 'Dress');
    await expect(productsPage.title).toHaveText('Women - Dress Products');
    expect(await productsPage.cards.count()).toBeGreaterThan(0);

    await productsPage.openCategory('Men', 'Tshirts');
    await expect(productsPage.title).toHaveText('Men - Tshirts Products');
    expect(await productsPage.cards.count()).toBeGreaterThan(0);
  });

  test('TC19 - view brand products', async ({ productsPage }) => {
    await productsPage.open();
    await expect(productsPage.brandLinks.first()).toBeVisible();
    await productsPage.openBrand('Polo');
    await expect(productsPage.title).toHaveText('Brand - Polo Products');
    expect(await productsPage.cards.count()).toBeGreaterThan(0);

    await productsPage.openBrand('H&M');
    await expect(productsPage.title).toHaveText('Brand - H&M Products');
    expect(await productsPage.cards.count()).toBeGreaterThan(0);
  });

  test('TC21 - add a review on a product', async ({ productDetailPage }) => {
    await productDetailPage.open();
    await expect(productDetailPage.reviewHeading).toBeVisible();
    await productDetailPage.writeReview(
      'QA Tester',
      'qa.tester@example.com',
      'Great product, automated review.',
    );
    await expect(productDetailPage.reviewSuccess).toHaveText('Thank you for your review.');
  });

  test('TC21b - review with an invalid e-mail is blocked', async ({ productDetailPage }) => {
    await productDetailPage.open();
    await productDetailPage.writeReview('QA Tester', 'bad-email', 'text');
    await expect(productDetailPage.reviewSuccess).toBeHidden();
  });

  test('TC21c - the products page lists as many products as the API', async ({ productsPage, api }) => {
    const { body } = await api.productsList();
    await productsPage.open();
    await expect(productsPage.cards).toHaveCount(body.products?.length ?? -1);
  });
});

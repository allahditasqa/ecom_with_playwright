import { writeFileSync } from 'node:fs';
import { test, expect } from '../../src/fixtures';

test.describe('Contact us & navigation', { tag: ['@ui', '@regression'] }, () => {
  test(
    'TC06 - contact us form with file upload',
    { tag: '@smoke' },
    async ({ contactUsPage, page }, testInfo) => {
      const file = testInfo.outputPath('attachment.txt');
      writeFileSync(file, 'QA attachment');

      await contactUsPage.open();
      await expect(contactUsPage.heading).toBeVisible();
      await contactUsPage.name.fill('QA Tester');
      await contactUsPage.email.fill('qa.tester@example.com');
      await contactUsPage.subject.fill('Automation test');
      await contactUsPage.message.fill('Hello from Playwright');
      await contactUsPage.upload.setInputFiles(file);

      page.once('dialog', (d) => void d.accept()); // the site shows a confirm() before sending
      await contactUsPage.submit.click();
      await expect(contactUsPage.success).toHaveText(
        'Success! Your details have been submitted successfully.',
      );

      await contactUsPage.homeButton.click();
      await expect(page).toHaveURL('/');
    },
  );

  test('TC06b - contact form blocks an invalid e-mail', async ({ contactUsPage, page }) => {
    await contactUsPage.open();
    await contactUsPage.name.fill('QA Tester');
    await contactUsPage.email.fill('broken-email');
    await contactUsPage.subject.fill('Subject');
    await contactUsPage.message.fill('Message');
    await contactUsPage.submit.click();
    await expect(contactUsPage.success).toBeHidden();
    expect(await contactUsPage.email.evaluate((e: HTMLInputElement) => e.validity.typeMismatch)).toBe(true);
    await expect(page).toHaveURL(/contact_us/);
  });

  test('TC06c - contact form blocks a submit without an e-mail', async ({ contactUsPage }) => {
    await contactUsPage.open();
    await contactUsPage.submit.click();
    await expect(contactUsPage.success).toBeHidden();
    expect(await contactUsPage.email.evaluate((e: HTMLInputElement) => e.validity.valueMissing)).toBe(true);
  });

  test(
    'TC07 - test cases page is reachable from the header',
    { tag: '@smoke' },
    async ({ homePage, testCasesPage, page }) => {
      await homePage.open();
      await homePage.header.testCases.click();
      await expect(page).toHaveURL(/\/test_cases/);
      await expect(testCasesPage.heading).toBeVisible();
    },
  );

  test('TC25 - scroll up using the arrow button', async ({ homePage }) => {
    await homePage.open();
    await homePage.footer.scrollToBottom();
    await expect(homePage.footer.heading).toBeInViewport();
    await homePage.footer.scrollUpArrow.click();
    await expect(homePage.sliderHeading).toBeInViewport();
  });

  test('TC26 - scroll up without the arrow button', async ({ homePage, page }) => {
    await homePage.open();
    await homePage.footer.scrollToBottom();
    await expect(homePage.footer.heading).toBeInViewport();
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(homePage.sliderHeading).toBeInViewport();
  });

  for (const [label, link, url] of [
    ['Products', 'products', /\/products/],
    ['Cart', 'cart', /\/view_cart/],
    ['Signup / Login', 'signupLogin', /\/login/],
    ['Contact us', 'contactUs', /\/contact_us/],
  ] as const) {
    test(`TC26b - header link "${label}" navigates correctly`, async ({ homePage, page }) => {
      await homePage.open();
      await homePage.header[link].click();
      await expect(page).toHaveURL(url);
    });
  }
});

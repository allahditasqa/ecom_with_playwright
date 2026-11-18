import { test as base, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { ApiClient } from '../api/apiClient';
import { aUser, User } from '../data/userBuilder';
import { AUTH_USER_FILE } from '../config/env';
import { installResilientNavigation } from '../utils/resilientNavigation';
import {
  CartPage,
  CheckoutPage,
  ContactUsPage,
  HomePage,
  LoginPage,
  PaymentPage,
  ProductDetailPage,
  ProductsPage,
  SignupPage,
  TestCasesPage,
} from '../pages';

/** Ad / tracker hosts: they inject full-page overlays (#google_vignette) that make UI tests flaky. */
const AD_HOSTS =
  /googlesyndication|doubleclick|googleadservices|adservice\.google|googletagmanager|google-analytics|adsbygoogle|pagead/;

interface Fixtures {
  api: ApiClient;
  homePage: HomePage;
  loginPage: LoginPage;
  signupPage: SignupPage;
  productsPage: ProductsPage;
  productDetailPage: ProductDetailPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  paymentPage: PaymentPage;
  contactUsPage: ContactUsPage;
  testCasesPage: TestCasesPage;
  /** A brand-new account created through the API and deleted after the test. Not logged in. */
  newUser: User;
  /** Same as newUser, but the page is already logged in through the UI. */
  loggedInUser: User;
  /** The long-lived user created once by the `setup` project (use together with storageState). */
  sharedUser: User;
  blockAds: void;
}

export const test = base.extend<Fixtures>({
  blockAds: [
    async ({ context }, use) => {
      await context.route(AD_HOSTS, (route) => route.abort());
      await installResilientNavigation(context);
      await use();
    },
    { auto: true },
  ],
  api: async ({ request }, use) => use(new ApiClient(request)),
  homePage: async ({ page }, use) => use(new HomePage(page)),
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  signupPage: async ({ page }, use) => use(new SignupPage(page)),
  productsPage: async ({ page }, use) => use(new ProductsPage(page)),
  productDetailPage: async ({ page }, use) => use(new ProductDetailPage(page)),
  cartPage: async ({ page }, use) => use(new CartPage(page)),
  checkoutPage: async ({ page }, use) => use(new CheckoutPage(page)),
  paymentPage: async ({ page }, use) => use(new PaymentPage(page)),
  contactUsPage: async ({ page }, use) => use(new ContactUsPage(page)),
  testCasesPage: async ({ page }, use) => use(new TestCasesPage(page)),

  newUser: async ({ api }, use) => {
    const user = aUser().build();
    await api.createAccountOrThrow(user);
    await use(user);
    await api.deleteAccountQuietly(user);
  },

  loggedInUser: async ({ newUser, loginPage }, use) => {
    await loginPage.loginAs(newUser);
    await use(newUser);
  },

  // eslint-disable-next-line no-empty-pattern -- Playwright requires a destructuring pattern here
  sharedUser: async ({}, use) => {
    await use(JSON.parse(readFileSync(AUTH_USER_FILE, 'utf8')) as User);
  },
});

export { expect };

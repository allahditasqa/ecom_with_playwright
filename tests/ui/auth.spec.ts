import { test, expect } from '../../src/fixtures';
import { aUser } from '../../src/data/userBuilder';

test.describe('Authentication', { tag: ['@ui', '@regression'] }, () => {
  test(
    'TC01 - register a new user and delete the account',
    { tag: '@smoke' },
    async ({ homePage, loginPage, signupPage, api }) => {
      const user = aUser().build();
      try {
        await homePage.open();
        await expect(homePage.sliderHeading).toBeVisible();
        await homePage.header.signupLogin.click();
        await expect(loginPage.signupHeading).toBeVisible();

        await loginPage.startSignup(user.name, user.email);
        await expect(signupPage.heading).toBeVisible();
        await signupPage.fillAndSubmit(user);

        await expect(signupPage.accountCreated).toHaveText('Account Created!');
        await signupPage.continueButton.click();
        await expect(homePage.header.loggedInName).toHaveText(user.name);

        await homePage.header.deleteAccount.click();
        await expect(signupPage.accountDeleted).toHaveText('Account Deleted!');
        await signupPage.continueButton.click();
      } finally {
        await api.deleteAccountQuietly(user); // safety net if the test failed half-way
      }
    },
  );

  test('TC02 - login with correct email and password', { tag: '@smoke' }, async ({ newUser, loginPage }) => {
    await loginPage.open();
    await expect(loginPage.loginHeading).toBeVisible();
    await loginPage.login(newUser.email, newUser.password);
    await expect(loginPage.header.loggedInName).toHaveText(newUser.name);
    await expect(loginPage.header.logout).toBeVisible();
    await expect(loginPage.header.signupLogin).toHaveCount(0);
  });

  test(
    'TC03 - login with incorrect password shows an error',
    { tag: '@smoke' },
    async ({ newUser, loginPage }) => {
      await loginPage.open();
      await loginPage.login(newUser.email, `${newUser.password}-wrong`);
      await expect(loginPage.loginError).toHaveText('Your email or password is incorrect!');
      await expect(loginPage.header.loggedInAs).toHaveCount(0);
    },
  );

  test('TC03b - login with an unknown e-mail shows an error', async ({ loginPage }) => {
    await loginPage.open();
    await loginPage.login(aUser().build().email, 'whatever123');
    await expect(loginPage.loginError).toHaveText('Your email or password is incorrect!');
  });

  test(
    'TC04 - logout returns the visitor to the login page',
    { tag: '@smoke' },
    async ({ loggedInUser, loginPage, page }) => {
      expect(loggedInUser.email).toBeTruthy();
      await loginPage.header.logout.click();
      await expect(page).toHaveURL(/\/login$/);
      await expect(loginPage.loginHeading).toBeVisible();
      await expect(loginPage.header.loggedInAs).toHaveCount(0);
    },
  );

  test('TC05 - register with an existing e-mail is rejected', async ({ newUser, loginPage }) => {
    await loginPage.open();
    await loginPage.startSignup('Another Name', newUser.email);
    await expect(loginPage.signupError).toHaveText('Email Address already exist!');
  });

  test('TC05b - the password is case sensitive', async ({ newUser, loginPage }) => {
    await loginPage.open();
    await loginPage.login(newUser.email, newUser.password.toUpperCase());
    await expect(loginPage.loginError).toBeVisible();
  });

  test('TC05c - empty login form is blocked by browser validation', async ({ loginPage, page }) => {
    await loginPage.open();
    await loginPage.loginButton.click();
    await expect(page).toHaveURL(/\/login$/);
    expect(await loginPage.loginEmail.evaluate((e: HTMLInputElement) => e.validity.valueMissing)).toBe(true);
  });

  test('TC05d - signup with a malformed e-mail is blocked by browser validation', async ({
    loginPage,
    page,
  }) => {
    await loginPage.open();
    await loginPage.startSignup('Some Name', 'not-an-email');
    await expect(page).toHaveURL(/\/login$/);
    expect(await loginPage.signupEmail.evaluate((e: HTMLInputElement) => e.validity.typeMismatch)).toBe(true);
  });

  test('TC05e - signup with an empty name is blocked by browser validation', async ({ loginPage, page }) => {
    await loginPage.open();
    await loginPage.startSignup('', aUser().build().email);
    await expect(page).toHaveURL(/\/login$/);
    expect(await loginPage.signupName.evaluate((e: HTMLInputElement) => e.validity.valueMissing)).toBe(true);
  });
});

test.describe('Reused login session (storageState)', { tag: ['@ui', '@regression'] }, () => {
  test.use({ storageState: '.auth/user.json' });

  test('TC05f - a saved session opens the site already logged in', async ({ homePage, sharedUser }) => {
    await homePage.open();
    await expect(homePage.header.loggedInName).toHaveText(sharedUser.name);
    await expect(homePage.header.logout).toBeVisible();
  });
});

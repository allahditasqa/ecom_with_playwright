import { mkdirSync, writeFileSync } from 'node:fs';
import { test as setup, expect } from '../../src/fixtures';
import { aUser } from '../../src/data/userBuilder';
import { AUTH_FILE, AUTH_USER_FILE } from '../../src/config/env';

/**
 * Runs once before the suites: creates a shared account through the API (fast, no UI),
 * logs in through the real login form and stores the session as storageState.
 * Tests that only need "a logged-in visitor" reuse the saved session.
 */
setup('create shared user and save login session', async ({ api, loginPage, page }) => {
  const user = aUser().with('name', 'Shared QA').build();
  await api.createAccountOrThrow(user);

  await loginPage.loginAs(user);
  await expect(page.locator('header').getByText('Logged in as')).toBeVisible();
  mkdirSync('.auth', { recursive: true });
  await page.context().storageState({ path: AUTH_FILE });
  writeFileSync(AUTH_USER_FILE, JSON.stringify(user));
});

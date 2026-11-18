import { existsSync, readFileSync, rmSync } from 'node:fs';
import { test as teardown, expect } from '../../src/fixtures';
import { User } from '../../src/data/userBuilder';
import { AUTH_FILE, AUTH_USER_FILE } from '../../src/config/env';

teardown('delete shared user', async ({ api }) => {
  if (existsSync(AUTH_USER_FILE)) {
    await api.deleteAccountQuietly(JSON.parse(readFileSync(AUTH_USER_FILE, 'utf8')) as User);
  }
  rmSync(AUTH_FILE, { force: true });
  rmSync(AUTH_USER_FILE, { force: true });
  expect(existsSync(AUTH_USER_FILE)).toBe(false);
});

import { test, expect } from '../../src/fixtures';
import { aUser } from '../../src/data/userBuilder';

/**
 * The 14 official endpoints from https://automationexercise.com/api_list plus extra
 * negative / contract checks. The API always returns HTTP 200 and reports the logical status
 * in the JSON body (`responseCode`) - see DEFECTS.md DEF-04.
 */
test.describe('API - products & brands', { tag: ['@api', '@regression'] }, () => {
  test('API1 - GET productsList returns all products', { tag: '@smoke' }, async ({ api }) => {
    const { body } = await api.productsList();
    expect(body.responseCode).toBe(200);
    expect(body.products?.length).toBeGreaterThan(20);
    for (const p of body.products ?? []) {
      expect(p).toMatchObject({
        id: expect.any(Number),
        name: expect.any(String),
        price: expect.stringMatching(/^Rs\. \d+$/),
        brand: expect.any(String),
      });
      expect(p.category.category).toBeTruthy();
    }
  });

  test('API1b - product ids are unique', async ({ api }) => {
    const { body } = await api.productsList();
    const ids = (body.products ?? []).map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('API2 - POST to productsList is not supported', async ({ api }) => {
    const { body } = await api.call('POST', 'productsList');
    expect(body.responseCode).toBe(405);
    expect(body.message).toBe('This request method is not supported.');
  });

  test('API3 - GET brandsList returns all brands', { tag: '@smoke' }, async ({ api }) => {
    const { body } = await api.brandsList();
    expect(body.responseCode).toBe(200);
    expect(body.brands?.length).toBeGreaterThan(0);
    expect(body.brands?.map((b) => b.brand)).toEqual(expect.arrayContaining(['Polo', 'H&M']));
  });

  test('API4 - PUT to brandsList is not supported', async ({ api }) => {
    const { body } = await api.call('PUT', 'brandsList');
    expect(body.responseCode).toBe(405);
  });

  test('API5 - POST searchProduct returns matching products', { tag: '@smoke' }, async ({ api }) => {
    const { body } = await api.searchProduct('top');
    expect(body.responseCode).toBe(200);
    expect(body.products?.length).toBeGreaterThan(0);
    // matches on name or category ("Tops")
    for (const p of body.products ?? []) {
      expect(`${p.name} ${p.category.category}`.toLowerCase()).toContain('top');
    }
    expect(body.products?.map((p) => p.name)).toContain('Blue Top');
  });

  test('API5b - searchProduct with no match returns an empty list', async ({ api }) => {
    const { body } = await api.searchProduct('zzzz-no-such-product');
    expect(body.responseCode).toBe(200);
    expect(body.products).toEqual([]);
  });

  test('API6 - searchProduct without search_product parameter is a bad request', async ({ api }) => {
    const { body } = await api.searchProduct();
    expect(body.responseCode).toBe(400);
    expect(body.message).toBe('Bad request, search_product parameter is missing in POST request.');
  });

  test('API6b - search results are a subset of productsList', async ({ api }) => {
    const all = (await api.productsList()).body.products ?? [];
    const found = (await api.searchProduct('dress')).body.products ?? [];
    const allIds = new Set(all.map((p) => p.id));
    expect(found.length).toBeGreaterThan(0);
    for (const p of found) expect(allIds.has(p.id)).toBe(true);
  });
});

test.describe('API - user accounts', { tag: ['@api', '@regression'] }, () => {
  test('API7 - verifyLogin with valid credentials', { tag: '@smoke' }, async ({ api, newUser }) => {
    const { body } = await api.verifyLogin({ email: newUser.email, password: newUser.password });
    expect(body.responseCode).toBe(200);
    expect(body.message).toBe('User exists!');
  });

  test('API8 - verifyLogin without email is a bad request', async ({ api }) => {
    const { body } = await api.verifyLogin({ password: 'abc' });
    expect(body.responseCode).toBe(400);
    expect(body.message).toBe('Bad request, email or password parameter is missing in POST request.');
  });

  test('API9 - DELETE to verifyLogin is not supported', async ({ api }) => {
    const { body } = await api.call('DELETE', 'verifyLogin');
    expect(body.responseCode).toBe(405);
    expect(body.message).toBe('This request method is not supported.');
  });

  test('API10 - verifyLogin with invalid credentials', async ({ api, newUser }) => {
    const { body } = await api.verifyLogin({ email: newUser.email, password: 'wrong-password' });
    expect(body.responseCode).toBe(404);
    expect(body.message).toBe('User not found!');
  });

  test('API11 - createAccount registers a user', { tag: '@smoke' }, async ({ api }) => {
    const user = aUser().build();
    try {
      const { body } = await api.createAccount(user);
      expect(body.responseCode).toBe(201);
      expect(body.message).toBe('User created!');
      const login = await api.verifyLogin({ email: user.email, password: user.password });
      expect(login.body.responseCode).toBe(200);
    } finally {
      await api.deleteAccountQuietly(user);
    }
  });

  test('API11b - createAccount with an existing e-mail is rejected', async ({ api, newUser }) => {
    const { body } = await api.createAccount(newUser);
    expect(body.responseCode).toBe(400);
    expect(body.message).toBe('Email already exists!');
  });

  test('API11c - createAccount with missing fields is a bad request', async ({ api }) => {
    const { body } = await api.call('POST', 'createAccount', { name: 'Only Name' });
    expect(body.responseCode).toBe(400);
  });

  test('API12 - deleteAccount removes the user', { tag: '@smoke' }, async ({ api }) => {
    const user = aUser().build();
    await api.createAccountOrThrow(user);
    const { body } = await api.deleteAccount(user.email, user.password);
    expect(body.responseCode).toBe(200);
    expect(body.message).toBe('Account deleted!');
    const login = await api.verifyLogin({ email: user.email, password: user.password });
    expect(login.body.responseCode).toBe(404);
  });

  test('API12b - deleteAccount with wrong password keeps the account', async ({ api, newUser }) => {
    const { body } = await api.deleteAccount(newUser.email, 'wrong');
    expect(body.responseCode).toBe(404);
    const login = await api.verifyLogin({ email: newUser.email, password: newUser.password });
    expect(login.body.responseCode).toBe(200);
  });

  test('API13 - updateAccount changes the stored details', async ({ api, newUser }) => {
    const { body } = await api.updateAccount({ ...newUser, city: 'Karachi', company: 'Updated Co' });
    expect(body.responseCode).toBe(200);
    expect(body.message).toBe('User updated!');
    const details = await api.getUserByEmail(newUser.email);
    expect(details.body.user).toMatchObject({ city: 'Karachi', company: 'Updated Co' });
  });

  test('API14 - getUserDetailByEmail returns the profile', { tag: '@smoke' }, async ({ api, newUser }) => {
    const { body } = await api.getUserByEmail(newUser.email);
    expect(body.responseCode).toBe(200);
    expect(body.user).toMatchObject({
      name: newUser.name,
      email: newUser.email,
      first_name: newUser.firstName,
      last_name: newUser.lastName,
      country: newUser.country,
    });
  });

  test('API14b - getUserDetailByEmail for an unknown e-mail', async ({ api }) => {
    const { body } = await api.getUserByEmail(aUser().build().email);
    expect(body.responseCode).toBe(404);
    expect(body.message).toBe('Account not found with this email, try another email!');
  });
});

test.describe('API - known defects', { tag: ['@api', '@defect'] }, () => {
  // DEF-01: the endpoint is unauthenticated and returns the full profile (PII) of any e-mail.
  test('DEF-01 - getUserDetailByEmail must not return a profile without credentials', async ({
    api,
    newUser,
  }) => {
    test.fail(true, 'DEF-01: personal data returned to anonymous callers, see DEFECTS.md');
    const { body } = await api.getUserByEmail(newUser.email);
    expect(body.user).toBeUndefined();
  });

  // DEF-04: error conditions are reported with HTTP 200 instead of a real 4xx/5xx status.
  test('DEF-04 - unsupported method should answer with HTTP 405', async ({ api }) => {
    test.fail(true, 'DEF-04: HTTP status is always 200, see DEFECTS.md');
    const { response, body } = await api.call('POST', 'productsList');
    expect(body.responseCode).toBe(405);
    expect(response.status()).toBe(405);
  });
});

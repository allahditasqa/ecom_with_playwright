import { APIRequestContext, APIResponse, expect } from '@playwright/test';
import { User } from '../data/userBuilder';

export interface ApiBody {
  responseCode: number;
  message?: string;
  products?: ApiProduct[];
  brands?: { id: number; brand: string }[];
  user?: Record<string, unknown>;
}

export interface ApiProduct {
  id: number;
  name: string;
  price: string;
  brand: string;
  category: { usertype: { usertype: string }; category: string };
}

/**
 * Thin typed client for https://automationexercise.com/api_list.
 *
 * NOTE: this API always answers with HTTP 200 and puts the *logical* status in the
 * JSON field `responseCode` (see DEFECTS.md, DEF-04). `call()` therefore returns
 * both, and tests assert on `body.responseCode`.
 */
export class ApiClient {
  constructor(private readonly request: APIRequestContext) {}

  async call(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    form?: Record<string, string>,
  ): Promise<{ response: APIResponse; body: ApiBody }> {
    // The shared public host sometimes answers with an HTML "heavy load" page or drops the
    // connection. Retry a few times; real API answers are always JSON.
    let lastError: unknown;
    for (let attempt = 1; attempt <= 4; attempt++) {
      try {
        const response = await this.request.fetch(`/api/${path}`, { method, form });
        return { response, body: JSON.parse(await response.text()) as ApiBody };
      } catch (error) {
        lastError = error;
        await new Promise((r) => setTimeout(r, 1_500 * attempt));
      }
    }
    throw lastError;
  }

  productsList = () => this.call('GET', 'productsList');
  brandsList = () => this.call('GET', 'brandsList');
  searchProduct = (term?: string) =>
    this.call('POST', 'searchProduct', term === undefined ? undefined : { search_product: term });
  verifyLogin = (form?: Record<string, string>) => this.call('POST', 'verifyLogin', form);
  getUserByEmail = (email: string) =>
    this.call('GET', `getUserDetailByEmail?email=${encodeURIComponent(email)}`);

  static accountForm(u: User): Record<string, string> {
    return {
      name: u.name,
      email: u.email,
      password: u.password,
      title: u.title,
      birth_date: u.birthDay,
      birth_month: u.birthMonth,
      birth_year: u.birthYear,
      firstname: u.firstName,
      lastname: u.lastName,
      company: u.company,
      address1: u.address1,
      address2: u.address2,
      country: u.country,
      zipcode: u.zipcode,
      state: u.state,
      city: u.city,
      mobile_number: u.mobile,
    };
  }

  createAccount = (u: User) => this.call('POST', 'createAccount', ApiClient.accountForm(u));
  updateAccount = (u: User) => this.call('PUT', 'updateAccount', ApiClient.accountForm(u));
  deleteAccount = (email: string, password: string) =>
    this.call('DELETE', 'deleteAccount', { email, password });

  /** Fast data set-up: creates the account and fails loudly if the site refuses. */
  async createAccountOrThrow(u: User): Promise<void> {
    const { body } = await this.createAccount(u);
    expect(body.responseCode, `createAccount: ${body.message}`).toBe(201);
  }

  /** Best-effort clean-up; never throws so it can be used in fixture teardown. */
  async deleteAccountQuietly(u: Pick<User, 'email' | 'password'>): Promise<void> {
    try {
      await this.deleteAccount(u.email, u.password);
    } catch {
      /* the account may already have been removed by the test itself */
    }
  }
}

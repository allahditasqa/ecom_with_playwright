import { randomBytes } from 'node:crypto';

export interface User {
  title: 'Mr' | 'Mrs';
  name: string;
  email: string;
  password: string;
  birthDay: string;
  birthMonth: string;
  birthYear: string;
  firstName: string;
  lastName: string;
  company: string;
  address1: string;
  address2: string;
  country: string;
  state: string;
  city: string;
  zipcode: string;
  mobile: string;
}

const unique = () => `${Date.now().toString(36)}${randomBytes(3).toString('hex')}`;

/**
 * Test data builder: every call produces a user with a unique e-mail, so parallel
 * workers and repeated runs never collide. Passwords are generated per user - nothing
 * is hard-coded or read from secrets.
 */
export class UserBuilder {
  private user: User;

  constructor() {
    const id = unique();
    this.user = {
      title: 'Mr',
      name: `QA ${id}`,
      email: `qa.${id}@example.com`,
      password: `Pw!${randomBytes(6).toString('hex')}`,
      birthDay: '15',
      birthMonth: 'June',
      birthYear: '1992',
      firstName: 'Test',
      lastName: `User${id.slice(-4)}`,
      company: 'QA Labs',
      address1: '12 Testing Street',
      address2: 'Suite 4',
      country: 'India',
      state: 'Punjab',
      city: 'Lahore',
      zipcode: '54000',
      mobile: '03001234567',
    };
  }

  with<K extends keyof User>(key: K, value: User[K]): this {
    this.user[key] = value;
    return this;
  }

  withEmail(email: string): this {
    return this.with('email', email);
  }

  build(): User {
    return { ...this.user };
  }
}

export const aUser = (): UserBuilder => new UserBuilder();

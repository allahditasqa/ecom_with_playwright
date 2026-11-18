export const env = {
  baseUrl: process.env.BASE_URL ?? 'https://automationexercise.com',
  workers: Number(process.env.WORKERS ?? (process.env.CI ? 2 : 2)),
} as const;

export const AUTH_FILE = '.auth/user.json';
export const AUTH_USER_FILE = '.auth/user-credentials.json';

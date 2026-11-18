import { BrowserContext } from '@playwright/test';
import { env } from '../config/env';

const OVERLOADED = /This website is under heavy load/i;
const MAX_ATTEMPTS = 4;
const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * The public target is shared by many visitors and occasionally answers a page request with a
 * "heavy load (queue full)" placeholder, or drops the connection. That is infrastructure noise, not
 * product behaviour, and it would otherwise show up as random failures in the middle of a
 * click-through flow (where no page object can retry).
 *
 * This context-level route transparently re-requests *document* navigations to the site when:
 *   - the response is the overload placeholder (any method - the request was not processed), or
 *   - the connection fails (GET only, so a form POST is never submitted twice).
 * Real application responses (including 4xx/5xx from the app itself) are passed through untouched.
 */
export async function installResilientNavigation(context: BrowserContext): Promise<void> {
  const origin = new URL(env.baseUrl).origin;
  await context.route(
    (url) => url.origin === origin,
    async (route) => {
      const request = route.request();
      if (request.resourceType() !== 'document') {
        await route.fallback();
        return;
      }
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        const isLast = attempt === MAX_ATTEMPTS;
        try {
          // maxRedirects: 0 lets the browser follow redirects itself, so the URL bar stays correct.
          const response = await route.fetch({ maxRedirects: 0 });
          const body = response.status() < 300 || response.status() >= 400 ? await response.text() : '';
          if (OVERLOADED.test(body) && !isLast) {
            await pause(1_500 * attempt);
            continue;
          }
          await route.fulfill({ response, body: body || undefined });
          return;
        } catch {
          if (request.method() !== 'GET' || isLast) {
            await route.abort();
            return;
          }
          await pause(1_000 * attempt);
        }
      }
    },
  );
}

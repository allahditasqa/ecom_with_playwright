# Test strategy

## Scope

System under test: **https://automationexercise.com** - a public practice e-commerce site (catalogue of 34 products, brands and
categories, registration / login, cart, checkout with a fake payment form, contact form, newsletter and a small REST-like
API documented at `/api_list`).

The framework automates **all 26 official test cases** published on the site's _Test Cases_ page, adds negative and
validation cases around them, and covers the 14 documented API endpoints.

Out of scope: performance/load (the site is shared and throttles under load), visual regression, real payments (the payment form accepts any values), accessibility audits.

## Test levels and where they live

| Level  | Folder        | Purpose                                                                           |
| ------ | ------------- | --------------------------------------------------------------------------------- |
| Setup  | `tests/setup` | Create a shared account through the API, log in once through the UI, save session |
| UI     | `tests/ui`    | End-to-end user journeys per module, positive and negative                        |
| API    | `tests/api`   | Contract and behaviour of the 14 endpoints, plus negative cases                   |
| Defect | `@defect` tag | Genuine site bugs asserted with `test.fail()` (see `DEFECTS.md`)                  |

## Risk-based prioritisation

| Priority | Module                           | Why                                    | Tag               |
| -------- | -------------------------------- | -------------------------------------- | ----------------- |
| P0       | Register, login, logout          | Nothing else works without an account  | `@smoke`          |
| P0       | Add to cart, checkout, payment   | Revenue path                           | `@smoke`          |
| P1       | Search, categories, brands       | Product discovery                      | `@regression`     |
| P1       | API users / products             | Used for fast set-up and as a contract | `@smoke` (subset) |
| P2       | Contact, subscription, scrolling | Low business risk, simple to check     | `@regression`     |

`@smoke` is a fast gate (core journey of every module); `@regression` is everything.

## Data strategy

- **No hard-coded users or secrets.** `UserBuilder` produces a unique e-mail (timestamp + random) and a random password per test.
- Accounts needed by a test are created through the **API** (fixture `newUser`) and deleted in the fixture teardown, so UI tests stay short and independent.
- One shared account (project `setup`) provides a reusable **storageState** for tests that only need "a logged-in visitor"; it is deleted by the `cleanup` project.
- Tests that change server-side state (cart, orders) always use their own user or a fresh anonymous session - never the shared one - so they are safe to run in parallel.

## Environment & stability decisions

- The site is public and shared. It occasionally returns a "heavy load (queue full)" page, so workers default to **2** and `BasePage.open()` reloads when it sees that page.
- Google ad scripts are blocked at the browser-context level (fixture `blockAds`); they inject full-page overlays.
- **Retries are off locally** (failures are real signals) and **on in CI** (2 retries) because CI runs from a different network.
- Browser coverage: Chromium by default; Firefox and WebKit are opt-in projects (`npm run test:firefox`, `npm run test:webkit`).
- Evidence on failure: screenshot, video and trace; HTML report uploaded as a CI artifact.

## Exit criteria

- `npm run verify` (typecheck + ESLint + Prettier) is clean.
- Full chromium run: 0 unexpected failures with retries disabled, run at least twice.
- Every `test.fail()` is backed by an entry in `DEFECTS.md`.

# ecom_with_playwright

**Automation Framework:** a full-fledged **Playwright + TypeScript** test automation framework for the public e-commerce practice site
**[automationexercise.com](https://automationexercise.com)**. It automates **all 26 official test cases** published on the site's
_Test Cases_ page, adds negative / validation cases around them, covers the **14 documented API endpoints**, and documents the genuine site bugs it found.

[![CI](https://github.com/allahditasqa/ecom_with_playwright/actions/workflows/ci.yml/badge.svg)](https://github.com/allahditasqa/ecom_with_playwright/actions/workflows/ci.yml)

**79 automated tests** (56 UI + 23 API, of which 5 are known-defect tests) · Page Object Model · custom fixtures · API-assisted test data · saved login session · CI.

## Why this site?

[automationexercise.com](https://automationexercise.com) is built for test-automation practice. It has registration and login, product search,
categories and brands, product details with reviews, a cart, a complete checkout with payment and invoice download, a contact form with file upload,
a newsletter subscription and a public REST-style API (`/api_list`). It publishes a list of 26 official test cases, which gave this project an
objective coverage target: every one of those 26 cases is automated here (see [docs/test-cases.md](docs/test-cases.md)).

## What is inside

| Capability        | How it is done                                                                                                                          |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Language / runner | TypeScript (`strict`, `noUncheckedIndexedAccess`) + Playwright Test                                                                     |
| Design pattern    | Page Object Model with reusable **components** (`Header`, `Footer`, `CartModal`) composed into every page                               |
| Fixtures          | Custom fixtures: one per page object, `api`, `newUser`, `loggedInUser`, `sharedUser`, and automatic `blockAds`                          |
| Test data         | `UserBuilder` (unique e-mail + random password per test, nothing hard-coded), `testCard` factory                                        |
| Session reuse     | `setup` project creates an account through the API, logs in through the UI once and stores `storageState`; `cleanup` project deletes it |
| API layer         | Typed `ApiClient` for the 14 endpoints; also used to create / delete accounts quickly for UI tests                                      |
| Tags              | `@smoke`, `@regression`, `@ui`, `@api`, `@defect`                                                                                       |
| Browsers          | Chromium by default; Firefox / WebKit on demand (`ALL_BROWSERS=1`, see npm scripts)                                                     |
| Parallelism       | `fullyParallel`; 2 workers by default (the public site throttles under load), configurable via `WORKERS`                                |
| Retries           | **Off locally, 2 on CI**                                                                                                                |
| Evidence          | Screenshot + video + trace kept on failure, HTML report                                                                                 |
| Quality gates     | ESLint (typescript-eslint + eslint-plugin-playwright), Prettier, `tsc --noEmit`                                                         |
| CI                | GitHub Actions: lint + typecheck + format → smoke → regression, report uploaded as an artifact                                          |
| Known bugs        | Asserted with `test.fail()` and written up in [DEFECTS.md](DEFECTS.md)                                                                  |

## Architecture

```
.
├── playwright.config.ts        # projects: setup -> chromium (+ firefox/webkit opt-in) -> cleanup
├── src
│   ├── api/apiClient.ts        # typed client for /api/* (productsList, searchProduct, createAccount, ...)
│   ├── components/             # Header, Footer (subscription + scroll-up), CartModal
│   ├── config/env.ts           # BASE_URL, workers, auth file paths (from .env)
│   ├── data/                   # UserBuilder, payment card factory
│   ├── fixtures/index.ts       # custom `test`: page objects, api, users, ad blocking
│   ├── pages/                  # Home, Login, Signup, Products, ProductDetail, Cart, Checkout, Payment, ContactUs, TestCases
│   └── utils/resilientNavigation.ts   # retries the site's "heavy load" placeholder pages
├── tests
│   ├── setup/                  # auth.setup.ts (create user + save session), auth.teardown.ts (delete user)
│   ├── ui/                     # auth, contactAndNavigation, products, subscription, cart, checkout, defects
│   └── api/api.spec.ts         # 14 endpoints + negatives + defects
├── docs/                       # test-strategy.md, test-cases.md
├── DEFECTS.md                  # genuine site bugs and how they are asserted
└── .github/workflows/ci.yml
```

### Design decisions

- **Page objects expose locators and intent-level actions; tests own the assertions.** Components are composed into `BasePage`, so every page gets the header, footer and cart modal for free.
- **Stable locators first.** The site ships `data-qa` attributes on its forms; I use them, then roles and ids. No XPath.
- **API for set-up, UI for behaviour.** Accounts are created through `/api/createAccount` and removed in fixture teardown, so UI tests do not repeat the 20-field registration form. Registration itself is still tested end-to-end (TC01, TC14, TC15).
- **Isolation for parallel runs.** Anything that changes server state (cart, orders) uses its own user or an anonymous session. The shared `storageState` user is only used by read-only tests.
- **Honest about a flaky environment.** The public site is shared. It sometimes answers a page request with a "heavy load (queue full)" placeholder or drops the connection, and it injects Google ad overlays. The framework blocks ad hosts and, in `resilientNavigation.ts`, re-requests such placeholder pages (GET connection drops are retried too, form POSTs never are). Real application responses are never touched. Everything else uses Playwright's auto-waiting, web-first assertions - no blind `sleep`s in tests.
- **Defects do not hide.** A genuine bug is asserted with `test.fail()`: the suite is green while the bug exists and turns red ("expected to fail, but passed") the day the site is fixed.
- **The API quirk.** Every endpoint answers HTTP 200 and puts the real status in the JSON `responseCode`; the client and the tests assert on `responseCode`, and DEF-04 tracks the quirk.

## Getting started

Requirements: Node.js 20+ (developed on Node 24).

```bash
git clone https://github.com/allahditasqa/ecom_with_playwright.git
cd ecom_with_playwright
npm ci
npx playwright install chromium     # add "firefox webkit" for cross-browser runs
cp .env.example .env                # optional - the defaults work out of the box
```

### Run

| Command                                | What it runs                                  |
| -------------------------------------- | --------------------------------------------- |
| `npm test`                             | Everything on Chromium                        |
| `npm run test:smoke`                   | `@smoke` subset (fast gate)                   |
| `npm run test:regression`              | `@regression`                                 |
| `npm run test:ui` / `npm run test:api` | UI only / API only                            |
| `npm run test:auth`                    | Register, login, logout                       |
| `npm run test:products`                | Products, search, categories, brands, reviews |
| `npm run test:cart`                    | Cart                                          |
| `npm run test:checkout`                | Checkout, payment, invoice                    |
| `npm run test:contact`                 | Contact form, navigation, scrolling           |
| `npm run test:subscription`            | Newsletter subscription                       |
| `npm run test:defects`                 | Known-defect tests (`test.fail()`)            |
| `npm run test:headed`                  | Headed, single worker (debugging)             |
| `npm run test:firefox` / `test:webkit` | Same suite on Firefox / WebKit                |
| `npm run report`                       | Open the HTML report                          |
| `npm run verify`                       | `tsc --noEmit` + ESLint + Prettier check      |

Environment variables (see `.env.example`): `BASE_URL`, `WORKERS`. Nothing secret is needed - the target is a public practice site.

## Coverage

| Module                      | UI tests | API tests        | Official test cases covered |
| --------------------------- | -------- | ---------------- | --------------------------- |
| Register / login / logout   | 11       | 12 (API7-API14b) | TC01 TC02 TC03 TC04 TC05    |
| Contact us / navigation     | 10       | -                | TC06 TC07 TC25 TC26         |
| Products / search / filter  | 12       | 9 (API1-API6b)   | TC08 TC09 TC18 TC19 TC21    |
| Subscription                | 4        | -                | TC10 TC11                   |
| Cart                        | 8        | -                | TC12 TC13 TC17 TC20 TC22    |
| Checkout / order / invoice  | 8        | -                | TC14 TC15 TC16 TC23 TC24    |
| Known defects (`test.fail`) | 3        | 2                | -                           |
| **Total**                   | **56**   | **23**           | **26 of 26**                |

Full list with IDs: [docs/test-cases.md](docs/test-cases.md) · Strategy: [docs/test-strategy.md](docs/test-strategy.md).

## Results

Last verified locally on Chromium, **retries off**, 2 workers, against the live site:

| Run | Result                                     | Duration |
| --- | ------------------------------------------ | -------- |
| 1   | 81 passed (79 tests + `setup` + `cleanup`) | 4.0 min  |
| 2   | 81 passed (79 tests + `setup` + `cleanup`) | 4.9 min  |

The 5 known-defect tests count as _passed_ because they are marked `test.fail()` (they assert the correct behaviour and the bug makes them fail, as expected).

**Honest history:** the first full runs (before the resilience layer) produced 13, then 2, 1 and 5 failures. Causes were, in order: wrong assumptions in my tests (search matches categories, availability text structure, invoice shows first + last name, `display:none` alerts), and the site's own "heavy load (queue full)" placeholder / dropped connections under parallel load. Test bugs were fixed in the tests; the infrastructure noise is handled in `src/utils/resilientNavigation.ts` and `ApiClient` (retries, documented above). On a very busy day the public site can still be slow or unavailable - that is outside the framework's control; CI therefore uses 2 retries.

## Roadmap

- Visual regression for the home page and product grid.
- Accessibility checks with `@axe-core/playwright`.
- Mobile-viewport project (Pixel / iPhone emulation).
- Sharding in CI with a merged blob report.
- Schema validation (zod) for the API contract tests.
- Run the Firefox / WebKit projects in a nightly CI job.

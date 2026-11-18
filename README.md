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
objective coverage target: every one of those 26 cases is automated here (see [docs/test-cases/](docs/test-cases/)).

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
├── scripts/cases.ts            # generates docs/test-cases/* and runs the traceability check
├── reporters/                  # moduleReporter.ts, testCaseCatalog.ts, modules.ts
├── reports/                    # module-wise reports of real runs (committed)
├── docs/                       # TEST_STRATEGY.md, TEST_CASE_STANDARD.md, test-cases/<module>.md + .csv
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

| Command                                  | What it runs                                                 |
| ---------------------------------------- | ------------------------------------------------------------ |
| `npm test`                               | Everything on Chromium                                       |
| `npm run test:smoke`                     | `@smoke` subset (fast gate)                                  |
| `npm run test:regression`                | `@regression`                                                |
| `npm run test:ui` / `npm run test:api`   | UI only / API only                                           |
| `npm run test:auth`                      | Register, login, logout                                      |
| `npm run test:products`                  | Products, search, categories, brands, reviews                |
| `npm run test:cart`                      | Cart                                                         |
| `npm run test:checkout`                  | Checkout, payment, invoice                                   |
| `npm run test:contact`                   | Contact form, navigation, scrolling                          |
| `npm run test:subscription`              | Newsletter subscription                                      |
| `npm run test:defects`                   | Known-defect tests (`test.fail()`)                           |
| `npm run test:headed`                    | Headed, single worker (debugging)                            |
| `npm run test:firefox` / `test:webkit`   | Same suite on Firefox / WebKit                               |
| `npm run report`                         | Open the HTML report                                         |
| `npm run verify`                         | `tsc --noEmit` + ESLint + Prettier + traceability check      |
| `npm run cases:generate` / `cases:check` | Generate the test case documents / check code and docs agree |

Environment variables (see `.env.example`): `BASE_URL`, `WORKERS`. Nothing secret is needed - the target is a public practice site.

## Test cases

All **79 automated test cases** (56 UI + 23 API, including 5 known-defect tests) are documented in the standard format of a QA test case document - ID, module, title, priority, type, preconditions, test data, numbered steps, expected result, automation status and script. The ID in the document is the same as in the test title in the code (`TC02 - login with correct email and password`).

| Module       | Document                                           | Master CSV                                           | Cases  | Official test cases covered    |
| ------------ | -------------------------------------------------- | ---------------------------------------------------- | ------ | ------------------------------ |
| Auth         | [auth.md](docs/test-cases/auth.md)                 | [auth.csv](docs/test-cases/auth.csv)                 | 11     | TC01 TC02 TC03 TC04 TC05       |
| Products     | [products.md](docs/test-cases/products.md)         | [products.csv](docs/test-cases/products.csv)         | 12     | TC08 TC09 TC18 TC19 TC21       |
| Cart         | [cart.md](docs/test-cases/cart.md)                 | [cart.csv](docs/test-cases/cart.csv)                 | 8      | TC12 TC13 TC17 TC20 TC22       |
| Checkout     | [checkout.md](docs/test-cases/checkout.md)         | [checkout.csv](docs/test-cases/checkout.csv)         | 8      | TC14 TC15 TC16 TC23 TC24       |
| Contact      | [contact.md](docs/test-cases/contact.md)           | [contact.csv](docs/test-cases/contact.csv)           | 10     | TC06 TC07 TC25 TC26            |
| Subscription | [subscription.md](docs/test-cases/subscription.md) | [subscription.csv](docs/test-cases/subscription.csv) | 4      | TC10 TC11                      |
| Defects (UI) | [defects.md](docs/test-cases/defects.md)           | [defects.csv](docs/test-cases/defects.csv)           | 3      | -                              |
| API          | [api.md](docs/test-cases/api.md)                   | [api.csv](docs/test-cases/api.csv)                   | 23     | API1 - API14 (all 14)          |
| **Total**    |                                                    |                                                      | **79** | **26 of 26 UI + 14 of 14 API** |

- Format rules: [docs/TEST_CASE_STANDARD.md](docs/TEST_CASE_STANDARD.md) · Strategy: [docs/TEST_STRATEGY.md](docs/TEST_STRATEGY.md).
- The documents and master CSVs are **generated** (`npm run cases:generate`) from the test titles plus `reporters/testCaseCatalog.ts`.
- **Traceability check:** `npm run cases:check` (part of `npm run verify` and of CI) fails when a test has no documented case, a documented case has no test, IDs are duplicated, or the generated documents are out of date.

## Reports

Every run writes module-wise reports into [`reports/`](reports/) (committed, never overwritten):

```
reports/
├── index.html                                   # all runs, newest first, grouped by date-time
├── history.json                                 # append-only history
└── <module>/
    ├── <Module Name> test <DD-MM-YYYY>_<HH-mm-ss>.html         # executed cases, status, time, screenshot of every UI test
    └── <Module Name> test cases <DD-MM-YYYY>_<HH-mm-ss>.csv    # the same cases as a test case sheet with the result
```

### Real runs committed in `reports/`

All four are full-suite runs of all 79 tests on Chromium against the live site, **retries off**. Open `reports/index.html`.

| Run (18-11-2026) | Workers | Result                  | Duration |
| ---------------- | ------- | ----------------------- | -------- |
| 14:42:53         | 2       | **79 passed, 0 failed** | 3.6 min  |
| 14:47:07         | 2       | 74 passed, 5 failed     | 8.3 min  |
| 14:56:07         | 2       | 76 passed, 3 failed     | 5.6 min  |
| 15:02:03         | 1       | 78 passed, 1 failed     | 8.1 min  |

("passed" includes the 5 known-defect tests, which pass because the bug is still present.)

**Honest reading of these numbers:** the target is a shared public site and its speed changes during the day. In the fast run (3.6 min) everything passed; in the slower runs (5-8 min) between 1 and 5 UI tests failed, and **a different set each time** (add-to-cart confirmation not shown, login page or "Place Order" not rendered within 30 s, a 120 s test timeout in long checkout flows). Failed cases are kept in the reports with their error and screenshot, nothing was edited out. The framework already absorbs the known infrastructure noise (queue-full page, dropped connections, duplicate account creation after a retry, click before page scripts are loaded), but it cannot make a slow public site fast. CI runs with 2 retries for this reason; locally retries stay off so that every failure is visible.

Earlier development runs (before the fixes above) are not part of `reports/`.

## Roadmap

- Visual regression for the home page and product grid.
- Accessibility checks with `@axe-core/playwright`.
- Mobile-viewport project (Pixel / iPhone emulation).
- Sharding in CI with a merged blob report.
- Schema validation (zod) for the API contract tests.
- Run the Firefox / WebKit projects in a nightly CI job.

# Test strategy

## 1. Scope

System under test: **https://automationexercise.com** - a public practice e-commerce site (34 products, brands and categories,
registration / login, cart, checkout with a fake payment form, contact form, newsletter and a small REST-style API documented at `/api_list`).

The framework automates **all 26 official test cases** published on the site's _Test Cases_ page, adds negative and validation
cases around them, and covers the **14 documented API endpoints**. Every case is documented in the standard format
([TEST_CASE_STANDARD.md](TEST_CASE_STANDARD.md)) in [docs/test-cases/](test-cases/).

**Out of scope:** load / performance (the site is shared and throttles under load), visual regression, real payments (the payment form accepts any values), accessibility audits, e-mail delivery of the newsletter and contact form.

## 2. Test levels and where they live

| Level  | Folder        | Purpose                                                                           |
| ------ | ------------- | --------------------------------------------------------------------------------- |
| Setup  | `tests/setup` | Create a shared account through the API, log in once through the UI, save session |
| UI     | `tests/ui`    | End-to-end user journeys per module, positive and negative                        |
| API    | `tests/api`   | Contract and behaviour of the 14 endpoints, plus negative cases                   |
| Defect | `@defect` tag | Genuine site bugs asserted with `test.fail()` (see `DEFECTS.md`)                  |

## 3. Test design techniques used

- **Equivalence partitioning / boundary values:** valid vs malformed e-mail, quantity 0 / -3 / 1 / 4, empty vs filled forms.
- **Positive and negative pairs:** every happy path has at least one negative neighbour (wrong password, existing e-mail, empty payment form).
- **State transition:** guest -> registered -> logged in -> order placed; cart contents before and after login.
- **Data-driven cases:** one ID per data row (`TC08.1`, `TC26.3`, `DEF-03.2`).
- **API / UI cross-check:** the number of products in the UI equals the API list (TC21c).
- **Error guessing:** case sensitivity of the password, the same product added twice, a search with no result.

## 4. Risk-based prioritisation

| Priority | Module                           | Why                                    | Tag               |
| -------- | -------------------------------- | -------------------------------------- | ----------------- |
| P0       | Register, login, logout          | Nothing else works without an account  | `@smoke`          |
| P0       | Add to cart, checkout, payment   | Revenue path                           | `@smoke`          |
| P1       | Search, categories, brands       | Product discovery                      | `@regression`     |
| P1       | API users / products             | Used for fast set-up and as a contract | `@smoke` (subset) |
| P2       | Contact, subscription, scrolling | Low business risk, simple to check     | `@regression`     |

`@smoke` is a fast gate (the core journey of every module); `@regression` is everything.

## 5. Data strategy

- **No hard-coded users or secrets.** `UserBuilder` produces a unique e-mail (timestamp + random) and a random password per test.
- Accounts needed by a test are created through the **API** (fixture `newUser`) and deleted in the fixture teardown, so UI tests stay short and independent.
- One shared account (project `setup`) provides a reusable **storageState** for tests that only need "a logged-in visitor"; it is deleted by the `cleanup` project.
- Tests that change server-side state (cart, orders) always use their own user or a fresh anonymous session - never the shared one - so they are safe to run in parallel.

## 6. Environment and stability decisions

- The site is public and shared. It occasionally returns a "heavy load (queue full)" page or drops the connection, so workers default to **2**, document navigations and API calls are retried (`src/utils/resilientNavigation.ts`, `ApiClient`).
- Google ad scripts are blocked at browser-context level (fixture `blockAds`); they inject full-page overlays.
- **Retries are off locally** (a failure is a real signal) and **on in CI** (2 retries).
- Browsers: Chromium by default; Firefox and WebKit are opt-in projects (`npm run test:firefox`, `npm run test:webkit`).
- Evidence: a screenshot of every UI test, video and trace on failure.

## 7. Reporting

Every run writes a report per module into `reports/` (committed to the repository):
`reports/<module>/<Module Name> test <DD-MM-YYYY>_<HH-mm-ss>.html`, the run CSV `<Module Name> test cases <DD-MM-YYYY>_<HH-mm-ss>.csv`, and the overview `reports/index.html` (+ `history.json`).
Reports are never overwritten. See the README section "Reports".

## 8. Traceability

`npm run cases:check` (part of `npm run verify` and CI) proves that code, test case catalogue, documents and master CSVs describe the same set of test cases.

## 9. Entry and exit criteria

- **Entry:** the site answers on `/`; `npm ci` and `npx playwright install chromium` are done.
- **Exit:** `npm run verify` is clean; a full Chromium run with retries off has no unexpected failure; every `test.fail()` is backed by an entry in `DEFECTS.md`; the report of the run is committed.

## 10. Risks

| Risk                              | Mitigation                                                         |
| --------------------------------- | ------------------------------------------------------------------ |
| Shared public site is slow / down | Low worker count, navigation retries, CI retries, honest reports   |
| Site catalogue changes            | Assertions use stable product names / counts compared with the API |
| Defects fixed by the site owner   | `test.fail()` turns red -> remove the marker, close the defect     |

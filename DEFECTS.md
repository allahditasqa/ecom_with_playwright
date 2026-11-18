# Defects found on automationexercise.com

These are genuine behaviours of the **public practice site** that I observed while automating it. Each one has a
test that asserts the **correct** behaviour and is marked with `test.fail()`, so the suite is green while the bug
exists and goes red ("Expected to fail, but passed") the day the site is fixed. Run them alone with `npm run test:defects`.

| ID     | Area         | Severity | Test                                                                                           |
| ------ | ------------ | -------- | ---------------------------------------------------------------------------------------------- |
| DEF-01 | API          | High     | `tests/api/api.spec.ts` - _getUserDetailByEmail must not return a profile without credentials_ |
| DEF-02 | Contact form | Low      | `tests/ui/defects.spec.ts` - _contact form must not accept an empty name, subject and message_ |
| DEF-03 | Cart         | Medium   | `tests/ui/defects.spec.ts` - _quantity 0 / -3 must not be accepted into the cart_              |
| DEF-04 | API          | Low      | `tests/api/api.spec.ts` - _unsupported method should answer with HTTP 405_                     |

## DEF-01 - Unauthenticated API returns any user's personal data

- **Endpoint:** `GET /api/getUserDetailByEmail?email=<any registered e-mail>`
- **Steps:** call it without any credentials for an e-mail that exists.
- **Actual:** `200` with name, e-mail, title, date of birth, company, full address, country, zip.
- **Expected:** profile data must only be available to the authenticated owner (or an admin); anonymous callers should get 401/403.
- **Impact:** anyone can harvest PII by guessing e-mails (information disclosure / broken access control).
- _Note:_ the password is **not** returned - I checked this explicitly and did not claim otherwise.

## DEF-02 - Contact form only validates the e-mail field

- **Page:** `/contact_us`
- **Steps:** fill only the e-mail, leave name, subject and message empty, submit (confirm the dialog).
- **Actual:** "Success! Your details have been submitted successfully."
- **Expected:** an empty message/subject (and ideally name) should be rejected - the form currently stores empty enquiries.

## DEF-03 - Cart accepts zero and negative quantities

- **Page:** `/product_details/1`
- **Steps:** set quantity `0` (or `-3`) in the field, click **Add to cart**, open the cart.
- **Actual:** the line is added with quantity `0` / `-3`.
- **Expected:** quantity must be an integer >= 1. The `min="1"` attribute on the input is not enforced because the button is not inside a `<form>`, and the server does not validate it either.

## DEF-04 - API reports errors with HTTP 200

- **Endpoints:** all `/api/*` endpoints.
- **Steps:** `POST /api/productsList` (an unsupported method), or login with wrong credentials.
- **Actual:** the HTTP status is always `200`; the real status (`405`, `404`, `400` ...) is only in the JSON body field `responseCode`.
- **Expected:** the HTTP status line should carry the status so that generic clients, proxies and monitors can react.
- **Framework impact:** the API client asserts on `responseCode` (the documented contract) and the defect test additionally asserts the real HTTP status.

## Not defects (but worth knowing)

- **Search matches the category too**: searching "top" also returns kids' shirts because their category is "Tops". Tests assert on known product names instead of "every result contains the term".
- **"Heavy load (queue full)" page**: the shared public site sometimes answers with a placeholder page when many visitors are connected. This is infrastructure, not product behaviour; `BasePage.open()` reloads up to 4 times and the default worker count is kept low (2).
- **Third-party ads**: Google ad frames can overlay the page (`#google_vignette`); the `blockAds` fixture blocks those hosts so tests are deterministic.

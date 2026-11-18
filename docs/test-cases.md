# Test case list

IDs `TC01`-`TC26` are the **official test cases from https://automationexercise.com/test_cases**; the letter suffixes
(`TC05b`, ...) are extra negative / validation cases added around them. `API1`-`API14` follow https://automationexercise.com/api_list.

Kind: **P** = positive, **N** = negative / validation.

## UI

| ID     | Title                                                         | Kind | Tags   | File                            |
| ------ | ------------------------------------------------------------- | ---- | ------ | ------------------------------- |
| TC01   | Register a new user and delete the account                    | P    | smoke  | ui/auth.spec.ts                 |
| TC02   | Login with correct e-mail and password                        | P    | smoke  | ui/auth.spec.ts                 |
| TC03   | Login with incorrect password shows an error                  | N    | smoke  | ui/auth.spec.ts                 |
| TC03b  | Login with an unknown e-mail shows an error                   | N    |        | ui/auth.spec.ts                 |
| TC04   | Logout returns to the login page                              | P    | smoke  | ui/auth.spec.ts                 |
| TC05   | Register with an existing e-mail is rejected                  | N    |        | ui/auth.spec.ts                 |
| TC05b  | Password is case sensitive                                    | N    |        | ui/auth.spec.ts                 |
| TC05c  | Empty login form blocked by browser validation                | N    |        | ui/auth.spec.ts                 |
| TC05d  | Signup with malformed e-mail blocked                          | N    |        | ui/auth.spec.ts                 |
| TC05e  | Signup with empty name blocked                                | N    |        | ui/auth.spec.ts                 |
| TC05f  | Saved session (storageState) opens the site logged in         | P    |        | ui/auth.spec.ts                 |
| TC06   | Contact us form with file upload                              | P    | smoke  | ui/contactAndNavigation.spec.ts |
| TC06b  | Contact form blocks an invalid e-mail                         | N    |        | ui/contactAndNavigation.spec.ts |
| TC06c  | Contact form blocks a submit without e-mail                   | N    |        | ui/contactAndNavigation.spec.ts |
| TC07   | Test cases page reachable from the header                     | P    | smoke  | ui/contactAndNavigation.spec.ts |
| TC25   | Scroll up using the arrow button                              | P    |        | ui/contactAndNavigation.spec.ts |
| TC26   | Scroll up without the arrow button                            | P    |        | ui/contactAndNavigation.spec.ts |
| TC26b  | Header navigation links                                       | P    |        | ui/contactAndNavigation.spec.ts |
| TC08   | All products list and product detail page                     | P    | smoke  | ui/products.spec.ts             |
| TC08b  | Product 1 / 2 / 3 detail data (name, brand)                   | P    |        | ui/products.spec.ts             |
| TC09   | Search for a product                                          | P    | smoke  | ui/products.spec.ts             |
| TC09b  | Search with no match                                          | N    |        | ui/products.spec.ts             |
| TC09c  | Search is case-insensitive                                    | P    |        | ui/products.spec.ts             |
| TC18   | View category products (Women > Dress, Men > Tshirts)         | P    |        | ui/products.spec.ts             |
| TC19   | View brand products (Polo, H&M)                               | P    |        | ui/products.spec.ts             |
| TC21   | Add a review on a product                                     | P    |        | ui/products.spec.ts             |
| TC21b  | Review with invalid e-mail is blocked                         | N    |        | ui/products.spec.ts             |
| TC21c  | Products page lists as many products as the API               | P    |        | ui/products.spec.ts             |
| TC10   | Subscription from the home page footer                        | P    | smoke  | ui/subscription.spec.ts         |
| TC11   | Subscription from the cart page footer                        | P    |        | ui/subscription.spec.ts         |
| TC11b  | Subscription rejects malformed e-mail                         | N    |        | ui/subscription.spec.ts         |
| TC11c  | Subscription rejects empty e-mail                             | N    |        | ui/subscription.spec.ts         |
| TC12   | Add two products to the cart (name, price, quantity, total)   | P    | smoke  | ui/cart.spec.ts                 |
| TC13   | Quantity from detail page is kept in the cart                 | P    |        | ui/cart.spec.ts                 |
| TC13b  | Adding the same product twice increases the quantity          | P    |        | ui/cart.spec.ts                 |
| TC17   | Remove a product from the cart                                | P    | smoke  | ui/cart.spec.ts                 |
| TC17b  | A fresh visitor has an empty cart                             | N    |        | ui/cart.spec.ts                 |
| TC20   | Search products and verify the cart after login               | P    |        | ui/cart.spec.ts                 |
| TC22   | Add a product from recommended items                          | P    |        | ui/cart.spec.ts                 |
| TC22b  | Logged-in header on products page via saved session           | P    |        | ui/cart.spec.ts                 |
| TC14   | Place order: register while checking out                      | P    | smoke  | ui/checkout.spec.ts             |
| TC15   | Place order: register before checkout                         | P    |        | ui/checkout.spec.ts             |
| TC16   | Place order: login before checkout                            | P    | smoke  | ui/checkout.spec.ts             |
| TC23   | Delivery and billing address match registration               | P    |        | ui/checkout.spec.ts             |
| TC23b  | Order review shows products and correct total                 | P    |        | ui/checkout.spec.ts             |
| TC24   | Download invoice after the order (file content checked)       | P    |        | ui/checkout.spec.ts             |
| TC24b  | Guest is asked to register / login at checkout                | N    |        | ui/checkout.spec.ts             |
| TC24c  | Payment form blocks an empty submit                           | N    |        | ui/checkout.spec.ts             |
| DEF-02 | Contact form accepts empty name/subject/message (`test.fail`) | N    | defect | ui/defects.spec.ts              |
| DEF-03 | Cart accepts quantity 0 and -3 (`test.fail`, 2 cases)         | N    | defect | ui/defects.spec.ts              |

## API

| ID     | Title                                                      | Kind | Tags   | File            |
| ------ | ---------------------------------------------------------- | ---- | ------ | --------------- |
| API1   | GET productsList returns all products (schema checked)     | P    | smoke  | api/api.spec.ts |
| API1b  | Product ids are unique                                     | P    |        | api/api.spec.ts |
| API2   | POST productsList not supported (405)                      | N    |        | api/api.spec.ts |
| API3   | GET brandsList                                             | P    | smoke  | api/api.spec.ts |
| API4   | PUT brandsList not supported (405)                         | N    |        | api/api.spec.ts |
| API5   | POST searchProduct                                         | P    | smoke  | api/api.spec.ts |
| API5b  | searchProduct with no match returns empty list             | N    |        | api/api.spec.ts |
| API6   | searchProduct without parameter (400)                      | N    |        | api/api.spec.ts |
| API6b  | Search results are a subset of productsList                | P    |        | api/api.spec.ts |
| API7   | verifyLogin with valid credentials                         | P    | smoke  | api/api.spec.ts |
| API8   | verifyLogin without e-mail (400)                           | N    |        | api/api.spec.ts |
| API9   | DELETE verifyLogin not supported (405)                     | N    |        | api/api.spec.ts |
| API10  | verifyLogin with invalid credentials (404)                 | N    |        | api/api.spec.ts |
| API11  | createAccount                                              | P    | smoke  | api/api.spec.ts |
| API11b | createAccount with an existing e-mail                      | N    |        | api/api.spec.ts |
| API11c | createAccount with missing fields                          | N    |        | api/api.spec.ts |
| API12  | deleteAccount                                              | P    | smoke  | api/api.spec.ts |
| API12b | deleteAccount with wrong password keeps the account        | N    |        | api/api.spec.ts |
| API13  | updateAccount                                              | P    |        | api/api.spec.ts |
| API14  | getUserDetailByEmail                                       | P    | smoke  | api/api.spec.ts |
| API14b | getUserDetailByEmail for an unknown e-mail                 | N    |        | api/api.spec.ts |
| DEF-01 | getUserDetailByEmail exposes PII anonymously (`test.fail`) | N    | defect | api/api.spec.ts |
| DEF-04 | Errors reported with HTTP 200 (`test.fail`)                | N    | defect | api/api.spec.ts |

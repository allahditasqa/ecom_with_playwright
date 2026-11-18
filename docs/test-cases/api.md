# API Test Cases

**Automation:** `tests/api/api.spec.ts`  |  **Master CSV:** `docs/test-cases/api.csv`  |  **Reports:** `reports/api/API test <DD-MM-YYYY>_<HH-mm-ss>.html` (all runs: `reports/index.html`)
**Application:** https://automationexercise.com

## Overview
The 14 documented REST-style endpoints (products, brands, search, user account) plus negative cases and API defects.

## Scope and notes
The API answers every call with HTTP 200 and puts the real status in the JSON field responseCode (DEF-04), so functional assertions use responseCode.

## A. Positive cases

| ID | Title | Priority | Preconditions | Test data | Steps | Expected result |
| --- | --- | --- | --- | --- | --- | --- |
| API1 | GET productsList returns all products | P0 - Critical | API reachable. | - | 1. Send GET /api/productsList. | responseCode 200; every product has id, name, price "Rs. n", brand and category. |
| API1b | product ids are unique | P2 - Medium | API reachable. | - | 1. Send GET /api/productsList and collect all product ids. | All product ids are unique. |
| API3 | GET brandsList returns all brands | P1 - High | API reachable. | - | 1. Send GET /api/brandsList. | responseCode 200 and a list of brands that includes Polo and H&M. |
| API5 | POST searchProduct returns matching products | P1 - High | API reachable. | search_product = "top" | 1. Send POST /api/searchProduct with search_product=top. | responseCode 200; every product matches "top" by name or category and "Blue Top" is included. |
| API6b | search results are a subset of productsList | P3 - Low | API reachable. | search_product = "dress" | 1. Get all products, search "dress", compare the ids. | All search results are a subset of productsList. |
| API7 | verifyLogin with valid credentials | P0 - Critical | A registered user exists (created through the API with a unique e-mail). | Valid credentials. | 1. Send POST /api/verifyLogin with the user e-mail and password. | responseCode 200, message "User exists!" |
| API11 | createAccount registers a user | P0 - Critical | API reachable. | Generated unique user. | 1. Send POST /api/createAccount with a full unique user. 2. Send POST /api/verifyLogin with the same credentials. | responseCode 201 "User created!"; the login verification returns 200. |
| API12 | deleteAccount removes the user | P1 - High | A user created through the API. | Valid credentials. | 1. Send DELETE /api/deleteAccount with e-mail and password. 2. Send POST /api/verifyLogin with the same credentials. | responseCode 200 "Account deleted!"; the following login returns 404. |
| API13 | updateAccount changes the stored details | P2 - Medium | A registered user exists (created through the API with a unique e-mail). | city = Karachi, company = Updated Co | 1. Send PUT /api/updateAccount with a new city and company. 2. Send GET /api/getUserDetailByEmail. | responseCode 200 "User updated!"; the profile shows the new values. |
| API14 | getUserDetailByEmail returns the profile | P1 - High | A registered user exists (created through the API with a unique e-mail). | Registered e-mail. | 1. Send GET /api/getUserDetailByEmail?email=<user e-mail>. | responseCode 200 and the profile (name, e-mail, first/last name, country) matches the registration. |

## B. Negative cases

| ID | Title | Priority | Preconditions | Test data | Steps | Expected result |
| --- | --- | --- | --- | --- | --- | --- |
| API2 | POST to productsList is not supported | P2 - Medium | API reachable. | - | 1. Send POST /api/productsList. | responseCode 405, message "This request method is not supported." |
| API4 | PUT to brandsList is not supported | P2 - Medium | API reachable. | - | 1. Send PUT /api/brandsList. | responseCode 405. |
| API5b | searchProduct with no match returns an empty list | P2 - Medium | API reachable. | search_product = "zzzz-no-such-product" | 1. Send POST /api/searchProduct with a term that matches nothing. | responseCode 200 and an empty products list. |
| API6 | searchProduct without search_product parameter is a bad request | P2 - Medium | API reachable. | - | 1. Send POST /api/searchProduct without the search_product parameter. | responseCode 400, message "Bad request, search_product parameter is missing in POST request." |
| API8 | verifyLogin without email is a bad request | P2 - Medium | API reachable. | Missing e-mail. | 1. Send POST /api/verifyLogin with only a password. | responseCode 400, message "Bad request, email or password parameter is missing in POST request." |
| API9 | DELETE to verifyLogin is not supported | P3 - Low | API reachable. | - | 1. Send DELETE /api/verifyLogin. | responseCode 405, message "This request method is not supported." |
| API10 | verifyLogin with invalid credentials | P1 - High | A registered user exists (created through the API with a unique e-mail). | Invalid password. | 1. Send POST /api/verifyLogin with the correct e-mail and a wrong password. | responseCode 404, message "User not found!" |
| API11b | createAccount with an existing e-mail is rejected | P1 - High | A registered user exists (created through the API with a unique e-mail). | Duplicate e-mail. | 1. Send POST /api/createAccount with the e-mail of the existing user. | responseCode 400, message "Email already exists!" |
| API11c | createAccount with missing fields is a bad request | P2 - Medium | API reachable. | Missing mandatory parameters. | 1. Send POST /api/createAccount with only the name. | responseCode 400 (bad request). |
| API12b | deleteAccount with wrong password keeps the account | P1 - High | A registered user exists (created through the API with a unique e-mail). | Wrong password. | 1. Send DELETE /api/deleteAccount with a wrong password. 2. Verify the user can still log in. | responseCode 404 and the account is kept. |
| API14b | getUserDetailByEmail for an unknown e-mail | P3 - Low | API reachable. | Unknown e-mail. | 1. Send GET /api/getUserDetailByEmail with an unregistered e-mail. | responseCode 404, message "Account not found with this email, try another email!" |

## C. Security cases

| ID | Title | Priority | Preconditions | Test data | Steps | Expected result |
| --- | --- | --- | --- | --- | --- | --- |
| DEF-01 | getUserDetailByEmail must not return a profile without credentials | P0 - Critical | A registered user exists (created through the API with a unique e-mail). | Registered e-mail, no credentials. | 1. Send GET /api/getUserDetailByEmail for the user WITHOUT any authentication. | CORRECT behaviour: no profile data for anonymous callers. Actual: full profile (PII) is returned (known defect DEF-01, marked test.fail). |

## D. Defect cases

| ID | Title | Priority | Preconditions | Test data | Steps | Expected result |
| --- | --- | --- | --- | --- | --- | --- |
| DEF-04 | unsupported method should answer with HTTP 405 | P2 - Medium | API reachable. | - | 1. Send POST /api/productsList (unsupported method) and read the HTTP status line and body. | CORRECT behaviour: HTTP 405 as well as responseCode 405. Actual: HTTP 200 (known defect DEF-04, marked test.fail). |

## Summary

| Type | Cases | Automated |
| --- | --- | --- |
| Positive | 10 | 10 |
| Negative | 11 | 11 |
| Security | 1 | 1 |
| Defect | 1 | 1 |
| **Total** | **23** | **23** |

> Generated by `npm run cases:generate` from the test titles and `reporters/testCaseCatalog.ts`. Do not edit by hand; `npm run cases:check` fails when this file and the code differ.

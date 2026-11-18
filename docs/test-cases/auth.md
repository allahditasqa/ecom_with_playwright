# Auth Test Cases

**Automation:** `tests/ui/auth.spec.ts`  |  **Master CSV:** `docs/test-cases/auth.csv`  |  **Reports:** `reports/auth/Auth test <DD-MM-YYYY>_<HH-mm-ss>.html` (all runs: `reports/index.html`)
**Application:** https://automationexercise.com

## Overview
Registration, login and logout of a customer, plus the reuse of a saved login session.

## Scope and notes
Each test creates its own user (unique e-mail, random password) through the API and deletes it afterwards, so tests can run in parallel. Client-side (browser) validation is asserted through the HTML5 validity API.

## A. Positive cases

| ID | Title | Priority | Preconditions | Test data | Steps | Expected result |
| --- | --- | --- | --- | --- | --- | --- |
| TC01 | register a new user and delete the account | P0 - Critical | Browser open, user not logged in, empty cart. | Generated unique user (name, e-mail, random password, DOB, address, phone). | 1. Open the home page and verify it is visible. 2. Click "Signup / Login" and verify "New User Signup!" is visible. 3. Enter a unique name and e-mail and click "Signup". 4. Fill every field of "Enter Account Information" and click "Create Account". 5. Verify "ACCOUNT CREATED!" and click "Continue". 6. Verify "Logged in as <name>" in the header. 7. Click "Delete Account" and verify "ACCOUNT DELETED!". | Account is created, user is logged in with the correct name, and the account can be deleted. |
| TC02 | login with correct email and password | P0 - Critical | A registered user exists (created through the API with a unique e-mail). | Valid e-mail + valid password of the registered user. | 1. Open /login and verify "Login to your account" is visible. 2. Enter the registered e-mail and password and click "Login". | "Logged in as <name>" and "Logout" are shown; "Signup / Login" is no longer in the header. |
| TC04 | logout returns the visitor to the login page | P0 - Critical | A registered user is logged in. | - | 1. Click "Logout" in the header. | User is redirected to /login, the login form is shown and "Logged in as" is gone. |
| TC05f | a saved session opens the site already logged in | P2 - Medium | A saved login session (storageState) of the shared user exists. | Stored cookies of the shared user. | 1. Open the home page with the saved session. | The site opens already logged in: "Logged in as <shared user>" and "Logout" are visible. |

## B. Negative cases

| ID | Title | Priority | Preconditions | Test data | Steps | Expected result |
| --- | --- | --- | --- | --- | --- | --- |
| TC03 | login with incorrect password shows an error | P0 - Critical | A registered user exists (created through the API with a unique e-mail). | Valid e-mail + incorrect password. | 1. Open /login. 2. Enter the registered e-mail with a wrong password and click "Login". | Error "Your email or password is incorrect!" is shown and the user stays logged out. |
| TC03b | login with an unknown e-mail shows an error | P1 - High | Browser open, user not logged in, empty cart. | Unregistered e-mail + arbitrary password. | 1. Open /login. 2. Enter an e-mail that is not registered and any password, click "Login". | Error "Your email or password is incorrect!" is shown. |
| TC05 | register with an existing e-mail is rejected | P1 - High | A registered user exists (created through the API with a unique e-mail). | E-mail that already exists. | 1. Open /login. 2. In "New User Signup!" enter any name and the e-mail of the existing user, click "Signup". | Error "Email Address already exist!" is shown; no second account is created. |
| TC05b | the password is case sensitive | P2 - Medium | A registered user exists (created through the API with a unique e-mail). | Password with changed letter case. | 1. Open /login. 2. Enter the correct e-mail with the password in UPPER CASE and click "Login". | Login is rejected with an error: the password is case sensitive. |

## C. Validation cases

| ID | Title | Priority | Preconditions | Test data | Steps | Expected result |
| --- | --- | --- | --- | --- | --- | --- |
| TC05c | empty login form is blocked by browser validation | P2 - Medium | Browser open, user not logged in, empty cart. | Empty e-mail and password. | 1. Open /login. 2. Click "Login" with both fields empty. | Browser validation blocks the submit (required field); the page does not change. |
| TC05d | signup with a malformed e-mail is blocked by browser validation | P2 - Medium | Browser open, user not logged in, empty cart. | Malformed e-mail "not-an-email". | 1. Open /login. 2. In the signup form enter a name and the e-mail "not-an-email", click "Signup". | Browser validation reports an invalid e-mail; the signup page is not opened. |
| TC05e | signup with an empty name is blocked by browser validation | P2 - Medium | Browser open, user not logged in, empty cart. | Empty name, valid e-mail. | 1. Open /login. 2. In the signup form leave the name empty, enter a valid e-mail, click "Signup". | Browser validation reports the required name; the signup page is not opened. |

## Summary

| Type | Cases | Automated |
| --- | --- | --- |
| Positive | 4 | 4 |
| Negative | 4 | 4 |
| Validation | 3 | 3 |
| **Total** | **11** | **11** |

> Generated by `npm run cases:generate` from the test titles and `reporters/testCaseCatalog.ts`. Do not edit by hand; `npm run cases:check` fails when this file and the code differ.

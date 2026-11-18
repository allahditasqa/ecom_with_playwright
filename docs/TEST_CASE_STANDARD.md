# Test Case Standard (the same format in every module)

Every test case of this project is written in **this format**, so that a new team member can read, review and run
any module without asking questions. The language is **simple English**: short sentences, active voice.

## 1. Folder structure (the same for every module)

| Item                                                 | Location                                                                | Example                                                |
| ---------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------ |
| Test case document (English, generated)              | `docs/test-cases/<module>.md`                                           | `docs/test-cases/auth.md`                              |
| **Master CSV** (full list, for regression, no date)  | `docs/test-cases/<module>.csv`                                          | `docs/test-cases/auth.csv`                             |
| Automation code                                      | `tests/ui/<module>.spec.ts` or `tests/api/<module>.spec.ts`             | `tests/ui/auth.spec.ts`                                |
| Page objects / components                            | `src/pages/`, `src/components/`                                         | `src/pages/loginPage.ts`                               |
| Test case catalogue (source of the document columns) | `reporters/testCaseCatalog.ts`                                          |                                                        |
| Module list (slug, display name, overview)           | `reporters/modules.ts`                                                  |                                                        |
| Execution report (a new file for every run)          | `reports/<module>/<Module Name> test <DD-MM-YYYY>_<HH-mm-ss>.html`      | `reports/auth/Auth test 18-11-2026_15-20-31.html`      |
| Run CSV (the cases executed in that run + result)    | `reports/<module>/<Module Name> test cases <DD-MM-YYYY>_<HH-mm-ss>.csv` | `reports/auth/Auth test cases 18-11-2026_15-20-31.csv` |
| History of all runs                                  | `reports/index.html`, `reports/history.json`                            |                                                        |

One module = one document + one master CSV + one spec file + one report per run.

## 2. Test case ID

| Pattern          | Meaning                                                                              | Example          |
| ---------------- | ------------------------------------------------------------------------------------ | ---------------- |
| `TC<NN>`         | The **official** test case number from https://automationexercise.com/test_cases     | `TC14`           |
| `TC<NN><letter>` | An extra case written around the official one (negative, validation, boundary)       | `TC05c`          |
| `TC<NN>.<n>`     | One row of a data-driven case (same steps, different data)                           | `TC26.3`         |
| `API<n>[letter]` | The n-th endpoint of https://automationexercise.com/api_list, or an extra case on it | `API7`, `API11b` |
| `DEF-<NN>[.<n>]` | A test for a known defect (marked `test.fail()`), see `DEFECTS.md`                   | `DEF-03.2`       |

- An ID is **never reused** and never changed.
- In the code the test title starts with the ID: `TC02 - login with correct email and password`.
  The part after `<ID> - ` is exactly the **Title** column of the document.

## 3. Document format (generated for every module)

1. **Title:** `# <Module> Test Cases`
2. **Overview** and **Scope and notes**
3. **Test case tables** grouped by type (Positive, Negative, Validation, Security, Boundary, Defect)
4. **Summary** table (cases and automated cases)

### Columns (never change them)

| Column          | Rule                                                                                                                         |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| ID              | The rule above.                                                                                                              |
| Title           | One short sentence that says what is done. Same text as in the test title.                                                   |
| Priority        | `P0 - Critical` (money / account path, the shop is unusable if it fails), `P1 - High`, `P2 - Medium`, `P3 - Low` (cosmetic). |
| Preconditions   | What must be true before the test (for example "A registered user is logged in"). Never empty.                               |
| Test data       | The data used. Never real personal data; users are generated per run. `-` if none.                                           |
| Steps           | Numbered, short, action based: `1. Open the login page. 2. Enter the e-mail. 3. Click "Login".`                              |
| Expected result | Clear and checkable, with the exact UI text in quotes.                                                                       |

The master CSV adds: **Module, Feature, Type, Automation, Automation Script, Smoke, Regression, Last Updated**.
The run CSV adds the result of the run: **Execution Status, Actual Result, Duration, Executed On, Environment, Remarks**.

### Writing rules

1. One test case checks one thing.
2. Write exact UI text in quotes (`"Your email or password is incorrect!"`).
3. Do not hard-code values that change (counts, dates); describe the relation.
4. Test data is generated (unique e-mail, random password); nothing secret is stored in the repository.
5. A genuine site bug gets a `DEF-` case that asserts the **correct** behaviour with `test.fail()` and an entry in `DEFECTS.md`.
6. A new case gets a new ID; old IDs are not reused.

## 4. Workflow for a new or changed test case

1. Write the test in `tests/...` with the ID at the start of the title.
2. Add (or change) its entry in `reporters/testCaseCatalog.ts` (feature, priority, type, preconditions, data, steps, expected result).
3. If the module is new, add it to `reporters/modules.ts`.
4. Run `npm run cases:generate` - this rewrites `docs/test-cases/<module>.md` and `<module>.csv`.
   Rows that did not change keep their `Last Updated` date; a new or changed row gets today's date.
5. Run `npm run cases:check`.
6. Run the module (`npm run test:<module>`); a new report appears in `reports/<module>/`.
7. Commit the code, the catalogue, the generated docs and the report together.

## 5. Traceability check

`npm run cases:check` (also part of `npm run verify` and of CI) fails when:

- a test title has no valid ID, or two tests share an ID;
- a test exists in the code but is **not documented** in the catalogue;
- a catalogue entry exists but **no test** has that ID;
- `docs/test-cases/<module>.md` or `<module>.csv` is **out of date** compared with the code and catalogue;
- a module has no test or is missing in `reporters/modules.ts`.

Do not edit the generated `.md` / `.csv` files by hand.

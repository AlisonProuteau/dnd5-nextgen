# Cypress Tests for D&D 5e NextGen

End-to-end tests with **focused journeys**: each `it()` covers one user behaviour, shared `before()` data setup, and cached auth via `cy.session()`.

## Test Files

| File                                          | What it covers                                                             |
| --------------------------------------------- | -------------------------------------------------------------------------- |
| `user/auth.cy.ts`                             | Sign-in flows, sign-up & onboarding, header navigation                     |
| `user/settings.cy.ts`                         | App settings                                                               |
| `user/contact.cy.ts`                          | Contact form                                                               |
| `character/character-sheet.cy.ts`             | Stats, tooltips, proficiencies, equipment, descriptions, notes, management |
| `character/character-action-record.cy.ts`     | Action record log                                                          |
| `character/character-spells.cy.ts`            | Spell management                                                           |
| `character/combat/character-health.cy.ts`     | HP & death saves                                                           |
| `character/combat/character-conditions.cy.ts` | Conditions & exhaustion                                                    |
| `character/creation/character-creation.cy.ts` | Creation stepper                                                           |
| `character/creation/character-choices.cy.ts`  | Race/class/background choices                                              |
| `character/creation/character-points.cy.ts`   | Point-buy allocation                                                       |
| `character/economy/character-market.cy.ts`    | Equipment market                                                           |
| `character/economy/character-money.cy.ts`     | Money management                                                           |
| `admin/character-generator.cy.ts`             | AI portrait generation (admin)                                             |

## Running Tests

### Prerequisites

```bash
# Start Firebase emulators (Auth, Firestore, Storage)
yarn firebase:emulate

# Start development server
yarn start:dist
```

### Commands

```bash
# Open Cypress Test Runner (interactive)
yarn cy

# Run all tests in headless mode (CI)
yarn cy:local

# Run a specific spec
SERVICE_ACCOUNT="$(cat ./serviceAccount.json)" yarn run-p -r start:dist \
  'cy:base run --browser chrome --spec "cypress/e2e/user/auth.cy.ts"'

# Run tests for a specific viewport
CYPRESS_VIEWPORT_WIDTH=375 CYPRESS_VIEWPORT_HEIGHT=667 yarn cy:local   # Mobile
CYPRESS_VIEWPORT_WIDTH=1920 CYPRESS_VIEWPORT_HEIGHT=1080 yarn cy:local  # Desktop
```

### CI/CD Integration

Tests run automatically on pull requests via GitHub Actions:

- Parallel execution across mobile and desktop viewports
- Firebase emulator setup with cached data
- Cypress Cloud recording and reporting
- Automatic PR comments with formatted test results

**Report Generation:**

- `yarn merge:reports` — Merge individual test reports
- `yarn generate:reports` — Generate HTML and text reports

### Environment

- **Emulators:** Auth (9099), Firestore (8080), Storage (9199)
- **Viewports:** Mobile (375×667), Desktop (1920×1080)
- **Browsers:** Chrome (primary), Firefox, Edge, Safari
- **Test User:** Created once globally in `before()` via `authGetUser` (idempotent)

## Contributing

Quick guidelines for writing new tests:

- Use `cy.visitAs(uid, path)` to start each test — it handles auth + visit + loading wait.
- Seed Firestore state with `cy.seedCharacter(s)` in `before()`, not via UI walkthroughs.
- One `it()` per user journey — split large features into focused tests sharing one `before()`.
- No `cy.visit()` or `cy.reload()` mid-test unless explicitly testing navigation/persistence.
- No `cy.logout()` between tests — `cy.session` isolation is automatic.
- Clean up test data in `after()` hooks.
- Prefix all test comments with `// Test:`.
- Import character test data from `cypress/support/mocks/characterList.ts`.

> See [`.github/instructions/cypress.instructions.md`](../.github/instructions/cypress.instructions.md) for the full conventions reference.
> See [REFACTOR.md](REFACTOR.md) for migration status and per-spec checklist.

## Debugging

**Common Issues:**

- Firebase connection - Check emulators are running
- Timing issues - Use proper `.should()` assertions instead of fixed waits
- Element selection - Verify selectors with Test Runner
- Test data - Check Firestore emulator data or use factory to regenerate

**Tools:**

- Cypress Test Runner - Interactive debugging with time-travel
- DevTools - Inspect elements and network requests
- Screenshots - Auto-captured on failure
- Console logs - Use `cy.log()` for test flow visibility
- Cypress Cloud - View full test runs with videos and screenshots

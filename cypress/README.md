# Cypress Tests for D&D 5e NextGen

Comprehensive end-to-end tests using a **consolidated full-flow approach** - each test covers complete user workflows with validation, error handling, and success scenarios in single cohesive tests.

## Test Files

- **`auth.cy.ts`** - Authentication workflows (sign in/up, validation, error handling, persistence, network failures)
- **`character-creation.cy.ts`** - Character creation stepper (race/class/background selection, navigation, validation, edge cases)
- **`character-generator.cy.ts`** - AI character portrait generation (admin-only, batch, error handling, download/upload)
- **`character-market.cy.ts`** - Equipment market workflows (buying/selling items, free mode, custom pricing, validation, quantity management)
- **`character-money.cy.ts`** - Money management workflows (adding/removing currency, validation, persistence, error handling)
- **`character-points.cy.ts`** - Character point-buy and ability score allocation workflows
- **`character-sheet.cy.ts`** - Character management (display, editing, notes, spell workflow, features, equipment, error recovery)
- **`contact-settings.cy.ts`** - Contact form and settings workflows (feedback, bug report, feature request, validation, submission)

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

# Run specific test file
SERVICE_ACCOUNT="$(cat ./serviceAccount.json)" yarn run-p -r start:dist 'cy:base run --browser chrome --spec "cypress/e2e/auth.cy.ts"'

# Run tests for specific viewport
CYPRESS_VIEWPORT_WIDTH=375 CYPRESS_VIEWPORT_HEIGHT=667 yarn cy:local  # Mobile
CYPRESS_VIEWPORT_WIDTH=1920 CYPRESS_VIEWPORT_HEIGHT=1080 yarn cy:local  # Desktop
```

### CI/CD Integration

Tests run automatically on pull requests via GitHub Actions:

- Parallel execution across mobile and desktop viewports
- Firebase emulator setup with cached data
- Cypress Cloud recording and reporting
- Automatic PR comments with test results (formatted with markdown)

**Report Generation:**

- `yarn merge:reports` - Merge individual test reports
- `yarn generate:reports` - Generate HTML and text reports with test summary and failure details

### Environment

- **Emulators:** Auth (9099), Firestore (8080), Storage (9199)
- **Viewports:** Mobile (375x667), Desktop (1920x1080)
- **Browsers:** Chrome (primary), Firefox, Edge, Safari
- **Test User:** Created in `before()` hook

## Contributing

Quick guidelines for writing new tests:

- Prefer one comprehensive test per feature covering the full workflow (setup → validation → errors → success → cleanup)
- Use custom commands for all Firebase operations and element selection
- Import test data from `cypress/support/mocks/` rather than hardcoding
- Prefix all test comments with `// Test:`
- Clean up test data in `after()` hooks
- Never use `cy.wait()` — use `cy.waitForLoading()` or `cy.intercept()`

> See [`.github/instructions/cypress.instructions.md`](../.github/instructions/cypress.instructions.md) for the full conventions reference.

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

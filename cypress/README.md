# Cypress Tests for D&D 5e NextGen

Comprehensive end-to-end tests using a **consolidated full-flow approach** - each test covers complete user workflows with validation, error handling, and success scenarios in single cohesive tests.

## Test Files

- **`auth.cy.ts`** - Authentication workflows (sign in/up, validation, error handling, persistence, network failures)
- **`character-creation.cy.ts`** - Character creation stepper (race/class/background selection, navigation, validation, edge cases)
- **`character-generator.cy.ts`** - AI character portrait generation (admin-only, batch, error handling, download/upload)
- **`character-points.cy.ts`** - Character point-buy and ability score allocation workflows
- **`character-sheet.cy.ts`** - Character management (display, editing, notes, spell workflow, features, equipment, error recovery)
- **`contact-settings.cy.ts`** - Contact form and settings workflows (feedback, bug report, feature request, validation, submission)

## Test Philosophy

### Core Principles

- **Minimal Test Splitting** - Prefer complete workflows in single tests, not fragmented steps
- **Validation-Before-Success** - Test errors, validation, and edge cases within main flows
- **Feature-Focused** - Each test covers one feature area comprehensively
- **Real User Journeys** - Mirror actual user behavior patterns
- **Complex Feature Exception** - For complex features, use one E2E "happy path" test plus targeted specific tests when needed
- **Robust Error Handling** - All test setup operations include proper error handling and meaningful context

### Test Structure Approach

**Primary:** One comprehensive test covering the complete workflow (setup → validation → errors → success → cleanup)

**When Complex:** Add specific tests for intricate parts that need detailed validation, but keep the main E2E flow test

### Flow Structure

1. Setup & Navigation → 2. Validation Testing → 3. Error Handling → 4. Success Workflow → 5. Cleanup

**Examples:**

```javascript
// ✅ Preferred - Comprehensive Flow
it('should complete full character creation with validation and error handling');

// ✅ Acceptable for Complex Features - Happy Path + Specific Tests
it('should complete character creation workflow (E2E happy path)');
it('should validate complex race trait selection edge cases');
it('should handle spell slot calculation for multiclass characters');

// ✅ Acceptable for Multiple Distinct Flows - Different User Journeys
it('should handle feedback contact type workflow');
it('should handle bug report contact type workflow');
it('should handle feature request contact type workflow');

// ❌ Avoid - Basic Feature Fragmentation
it('should validate race selection');
it('should validate class selection');
```

**Decision Guidelines:**

- **Same workflow, different paths:** One comprehensive test
- **Completely different user journeys:** Separate tests per journey
- **Complex features:** One E2E + specific edge case tests

## Test Infrastructure

### Setup & Configuration

**Test Environment Setup (`cypress/support/e2e.ts`):**

- Firebase emulator configuration (Auth, Firestore, Storage)
- Custom command attachments from `cypress-firebase`
- Global test user creation in `before()` hook
- Automatic cleanup with `cy.logout()` in `beforeEach()`
- Firebase emulator warning suppression with error handling
- Command overwrites (`visit`, `reload`) with try-catch blocks

### Test Data Management

**Static Mock Data (`cypress/support/mocks/`):**

- `characterList.ts` - Comprehensive character data with full details for all classes
- `baseCharacter.ts` - Minimal character template

**Usage:**
Tests import character data directly from mocks:

```javascript
import { characters } from 'cypress/support/mocks/characterList';
const characterData = characters.find(({ name }) => name === 'Delfy')!;
```

## Custom Commands

### Authentication & Setup

- `cy.login(uid)` - Login as specific user
- `cy.loginNewUser()` - Create and login as new user
- `cy.loginAsAdmin()` - Login with admin privileges
- `cy.logout()` - Logout current user
- `cy.createTestCharacter(uid, characterId, data)` - Create character in Firestore

### Firebase Operations

- `cy.callFirestore(operation, path, data)` - Firestore operations (get, set, update, delete)
- `cy.authCreateUser(userData)` - Create auth user
- `cy.deleteAllAuthUsers()` - Clean up auth users

### Element Selection (MUI-Independent)

- `cy.getByRole('button', 'Submit')` - ARIA-compliant selection
- `cy.getByTestId('submit-button')` - Data-testid selection
- `cy.selectOption('select', 'Option')` - Dropdown selection
- `cy.waitForLoading()` - Loading state handling
- `cy.selectCardAction({ text: 'Note' }, 'Edit')` - Note card actions
- `cy.getButton('Create')` - Button by text
- `cy.press('Escape')` - Keyboard interaction

### Selector Strategy

1. **Semantic HTML** - `button`, `form`, `input`
2. **Text Content** - Button text, labels, headings
3. **ARIA Attributes** - `[role="button"]`, `[aria-label="Close"]`
4. **Data-TestId** - `[data-testid="submit-button"]` when needed
5. **Form Elements** - `input[type="email"]`, `select[name="version"]`

**Avoided:** MUI selectors (`.MuiButton-root`, `.MuiCard-root`) which break with updates.

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
yarn SERVICE_ACCOUNT=\"$(cat ./serviceAccount.json)\" run-p -r start:dist 'cy:base run --browser chrome --spec "cypress/e2e/auth.cy.ts'"

# Run tests for specific viewport
CYPRESS_VIEWPORT_WIDTH=375 CYPRESS_VIEWPORT_HEIGHT=667 yarn cy:ci  # Mobile
CYPRESS_VIEWPORT_WIDTH=1920 CYPRESS_VIEWPORT_HEIGHT=1080 yarn cy:ci  # Desktop
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
- **Viewports:** Mobile (375x667), Tablet (768x1024), Desktop (1920x1080)
- **Browsers:** Chrome (primary), Firefox, Edge, Safari
- **Test User:** Created in `before()` hook

## Contributing

### Test Structure

1. **Prefer Comprehensive Tests** - Start with complete feature workflows in single tests
2. **Full-Flow Integration** - Validation, errors, loading, success in same test
3. **Feature-Focused Scope** - One feature area per test comprehensively
4. **Complex Feature Strategy** - One E2E "happy path" + specific tests for intricate parts when needed
5. **Avoid Basic Fragmentation** - Don't split simple workflows unnecessarily
6. **Realistic Journeys** - Follow actual user navigation patterns

**Decision Framework:**

- **Simple/Medium Features:** One comprehensive test covering all scenarios
- **Complex Features:** One E2E test + targeted tests for complex edge cases, calculations, or integrations
- **Never:** Split basic workflows into multiple small tests

### Technical Requirements

- Use custom commands for common operations
- Include responsive design testing within workflows
- Add accessibility validation within comprehensive tests
- Implement proper cleanup for test independence
- Use semantic selectors with data-testid fallbacks

### Code Quality

- Real E2E workflows, not isolated component tests
- Comprehensive error handling within main flows
- Loading state testing during async operations
- Security and permission validation where applicable
- Optimize execution while maintaining full coverage
- Use static mocks from `characterList.ts` for test data

### Test Commenting Standard

- **Prefix all comments in Cypress test files with `Test:`**
  - Example: `// Test: Setup & Navigation - Verify feedback form`
  - This ensures clarity and consistency for all contributors

### Writing New Tests

1. **Use existing mock data** from `cypress/support/mocks/characterList.ts` for character test data
2. **Test validation before success** - validate errors, edge cases, then happy path
3. **Clean up test data** in `after()` hooks when necessary
4. **Use custom commands** for Firebase operations and common actions

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

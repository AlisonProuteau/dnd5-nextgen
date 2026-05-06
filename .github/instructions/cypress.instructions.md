---
applyTo: 'cypress/**'
---

# Cypress Test Conventions

## Test Philosophy

### Core Principles

- **Minimal Test Splitting** - Prefer complete workflows in single tests, not fragmented steps
- **Validation-Before-Success** - Test errors, validation, and edge cases within main flows
- **Feature-Focused** - Each test covers one feature area comprehensively
- **Real User Journeys** - Mirror actual user behavior patterns
- **Complex Feature Exception** - For complex features, use one E2E "happy path" test plus targeted specific tests when needed
- **Robust Error Handling** - All test setup operations include proper error handling and meaningful context

### Flow Structure

**Primary:** One comprehensive test covering the complete workflow (setup → validation → errors → success → cleanup)

**When Complex:** Add specific tests for intricate parts that need detailed validation, but keep the main E2E flow test

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

// ❌ Avoid - Sub-feature splitting within the same component
it('should handle regular conditions workflow');
it('should handle exhaustion level workflow'); // exhaustion is just a sub-path of conditions
```

**Decision Guidelines:**

- **Same workflow, different paths:** One comprehensive test
- **Sub-features of the same component:** Always merge — different item types, condition types, input modes etc. within one manager/dialog are not separate journeys
- **Completely different user journeys:** Separate tests per journey
- **Complex features:** One E2E + specific edge case tests

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

Tests import character data directly from mocks:

```javascript
import { characters } from '../support/mocks/characterList';
const characterData = characters.find(({ name }) => name === 'Delfy')!;
```

## Writing Tests

### Test Commenting Standard

- **Prefix all comments in Cypress test files with `Test:`**
  - Example: `// Test: Setup & Navigation - Verify feedback form`
  - This ensures clarity and consistency for all contributors

### Naming Conventions

- File names: `character-<feature>.cy.ts` or `<feature>.cy.ts`
- Comprehensive flow: `it('should complete full <feature> workflow with validation and error handling')`
- Multiple journeys: `it('should handle <journey> workflow')`

### Test File Structure

```typescript
describe(`Feature Name End-to-End`, () => {
  before(() => {
    /* one-time Firestore/auth setup */
  });

  beforeEach(() => {
    cy.login(Cypress.testUser.uid);
    cy.visit('/path');
  });

  after(function () {
    cy.callFirestore('delete', `users/${Cypress.testUser.uid}/...`);
  });

  it('should complete full [feature] workflow with validation and error handling', function () {
    // Test: Setup — re-use before() data where possible; add any flow-specific data here
    // Test: Validation / error states
    // Test: Happy path
    // Test: Post-condition assertions
  });
});
```

### Checklist

1. Use existing mock data from `cypress/support/mocks/characterList.ts` for character test data
2. Test validation before success — validate errors, edge cases, then happy path
3. Clean up test data in `after()` hooks when necessary
4. Use custom commands for Firebase operations and common actions
5. Include responsive design handling only when testing breakpoint-specific behavior:
   ```typescript
   cy.wrap(Cypress.config('viewportWidth') === 375).as('isMobile');
   // then: (this.isMobile ? cy.getByTestId('mobile-x') : cy.getByTestId('desktop-x')).click();
   ```

### Constraints

- DO NOT use `cy.wait(ms)` or `sleep()` — use `cy.waitForLoading()` or `cy.intercept()`
- DO NOT use MUI class selectors (`.MuiButton-root`, `.MuiCard-root`, etc.)
- DO NOT split a simple workflow into multiple small tests
- DO NOT create helpers outside `cypress/support/`

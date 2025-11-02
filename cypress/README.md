# Cypress Tests for D&D 5e NextGen

Comprehensive end-to-end tests using a **consolidated full-flow approach** - each test covers complete user workflows with validation, error handling, and success scenarios in single cohesive tests.

## Test Files

- **`auth.cy.ts`** - Authentication workflows (sign in/up, validation, error handling, persistence, network failures)
- **`character-creation.cy.ts`** - Character creation stepper (race/class/background selection, navigation, validation, edge cases)
- **`character-generator.cy.ts`** - AI character portrait generation (admin-only, batch, error handling, download/upload)
- **`character-sheet.cy.ts`** - Character management (display, editing, notes, spell workflow, features, equipment, error recovery)
- **`contact-settings.cy.ts`** - Contact form and settings workflows (feedback, bug report, feature request, validation, submission)

## Test Philosophy

### Core Principles

- **Minimal Test Splitting** - Prefer complete workflows in single tests, not fragmented steps
- **Validation-Before-Success** - Test errors, validation, and edge cases within main flows
- **Feature-Focused** - Each test covers one feature area comprehensively
- **Real User Journeys** - Mirror actual user behavior patterns
- **Complex Feature Exception** - For complex features, use one E2E "happy path" test plus targeted specific tests when needed

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

## Custom Commands

### Authentication & Setup

- `cy.login()` / `cy.loginNewUser()`/ `cy.loginAsAdmin()` / `cy.logout()`
- `cy.createTestCharacter()`

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
yarn firebase:emulate  # Start Firebase emulators
yarn start:dist        # Start development server
```

### Commands

```bash
yarn cy                                           # Test Runner
yarn cy:ci                                      # Run all tests
```

### Environment

- **Emulators:** Auth (9099), Firestore (8080), Storage (9199)
- **Viewports:** Mobile (375x667), Tablet (768x1024), Desktop (1920x1080)
- **Browsers:** Chrome (primary), Firefox, Edge, Safari

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

### Test Commenting Standard

- **Prefix all comments in Cypress test files with `Test:`**
  - Example: `// Test: Setup & Navigation - Verify feedback form`
  - This ensures clarity and consistency for all contributors.

## Debugging

**Common Issues:** Firebase connection, timing, element selection, test data
**Tools:** Test Runner, DevTools, screenshots/videos, console logs

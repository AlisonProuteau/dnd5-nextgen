---
applyTo: 'cypress/**'
---

# Cypress Test Conventions

## Test Philosophy

### Core Principles

- **One journey per `it()`** — each test covers exactly one observable user behaviour from start to finish.
- **Share setup via `before()`** — seed Firestore data once per `context`; tests read it, never recreate state via UI.
- **Cached auth** — use `cy.sessionLogin` / `cy.visitAs`; never rely on a prior test having logged in.
- **No mid-test navigation** — `cy.visit()` and `cy.reload()` only when the test is _about_ navigation or persistence.
- **Seeded state over UI walkthroughs** — use `cy.seedCharacter(s)` / `cy.setCharacterState` instead of clicking through creation flows to set up preconditions.
- **Test independence** — every `it()` must pass when run in isolation (e.g. `it.only`). Do not rely on state left by a previous test.

### Flow Structure

**Standard:** One `before()` seeds data, one `beforeEach()` handles auth + navigation, focused `it()`s each cover one journey.

**When splitting a large feature:** Create one `it()` per distinct user observable behaviour (not per sub-component). Group related `it()`s in a `context()` sharing the same `before()` data.

```typescript
// ✅ Preferred — focused journey, shared seeded data
context('Character stats', () => {
  before(() => cy.seedCharacter(uid, charId, charData));
  beforeEach(() => cy.visitAs(uid, '/'));

  it('displays basic info, stats and ability scores', () => {
    /* verify stats display */
  });
  it('shows and dismisses ability score tooltips', () => {
    /* verify saving throw tooltip */
  });
  it('displays proficiencies, skills, languages, features and traits', () => {
    /* verify characteristics tab */
  });
});

// ✅ Acceptable — multiple distinct journeys (different entry points / flows)
it('should handle feedback contact type workflow');
it('should handle bug report contact type workflow');

// ❌ Avoid — mega-it() covering multiple distinct user journeys
it('should complete full character creation with validation and error handling');

// ❌ Avoid — mid-test navigation not about routing
it('health-workflow', () => {
  cy.visit('/'); // ← sets up precondition: use beforeEach instead
  // ... test
  cy.visit('/'); // ← navigates mid-test to reach a new character: use visitAs at top
});
```

**Decision Guidelines:**

- **Same component, different observable behaviours:** Separate `it()`s sharing one `before()`.
- **Same workflow, different data paths:** One `it()` (e.g. different item types in the same form).
- **Completely different user journeys:** Separate `it()`s.
- **Persistence check:** Keep exactly one `cy.reload()` per persistence `it()`, name it accordingly (e.g. `persistence-across-reload`).

## Custom Commands

### Auth & Navigation (new — use these)

- `cy.sessionLogin(uid)` — Cached login via `cy.session`; use in `beforeEach`
- `cy.sessionLoginAsAdmin()` — Cached admin login
- `cy.visitAs(uid, path)` — `sessionLogin + visit + waitForLoading`; canonical test start helper
- `cy.seedCharacter(uid, characterId, data)` — Firestore-seed one character
- `cy.seedCharacters(uid, characters[])` — Batch-seed multiple characters
- `cy.setCharacterState(uid, charId, partial)` — Partial Firestore update for mid-test state injection
- `cy.logout()` — Logout current user, only for specific session testing

### Firebase Operations

- `cy.callFirestore(operation, path, data)` — Firestore operations (get, set, update, delete)
- `cy.authCreateUser(userData)` — Create auth user
- `cy.clearUser(uid)` — Delete auth user + Firestore user doc
- `cy.clearAllNonDefaultUsers()` — Clean up all non-default auth users

### Element Selection (MUI-Independent)

- `cy.getByRole('button', 'Submit')` — ARIA-compliant selection
- `cy.getByTestId('submit-button')` — Data-testid selection
- `cy.getByTestId('item-', { type: 'contains' })` — Prefix match on data-testid
- `cy.selectOption('select', 'Option')` — Dropdown selection
- `cy.waitForLoading()` — Wait for loading state to clear (included in `cy.visitAs`)
- `cy.selectCardAction({ text: 'Note' }, 'Edit')` — Card action menu
- `cy.getButton('Create')` — Button by text
- `cy.press('Escape')` — Keyboard interaction

### Selector Strategy

1. **Semantic HTML** — `button`, `form`, `input`
2. **Text Content** — Button text, labels, headings
3. **ARIA Attributes** — `[role="button"]`, `[aria-label="Close"]`
4. **Data-TestId** — `[data-testid="submit-button"]` when needed
5. **Form Elements** — `input[type="email"]`, `select[name="version"]`

**Avoided:** MUI selectors (`.MuiButton-root`, `.MuiCard-root`) which break with updates.

## Test Infrastructure

### Setup & Configuration

**Test Environment Setup (`cypress/support/e2e.ts`):**

- Firebase emulator configuration (Auth, Firestore, Storage)
- Custom command attachments from `cypress-firebase`
- Global test user creation in `before()` hook via `authGetUser` (idempotent)
- Firebase emulator warning suppression with error handling
- Command overwrites (`visit`, `reload`) with try-catch blocks

**`cypress.config.ts`:**

- `retries: { runMode: 1, openMode: 0 }` — reduces transient flake noise
- `experimentalRunAllSpecs: true` — run-all button in UI
- `experimentalMemoryManagement: true` — reduces memory pressure across specs

### Test Data Management

**Static Mock Data (`cypress/support/mocks/`):**

- `characterList.ts` — Comprehensive character data (Delfy, Devy, Tilly, etc.)
- `baseCharacter.ts` — Minimal character template

Tests import character data directly from mocks:

```typescript
import { characters } from '../support/mocks/characterList';

const delfyData = characters.find(({ name }) => name === 'Delfy')!;
```

## Writing Tests

### Test Commenting Standard

- **Prefix all comments in Cypress test files with `// Test:`**
  - Example: `// Test: Verify stats panel shows correct armor class`

### Naming Conventions

- File names: `character-<feature>.cy.ts` or `<feature>.cy.ts`
- `describe` title: plain feature name, e.g. `'Character Health Management'`
- `context` title: scenario group, e.g. `'Overview'`, `'Sign In'`
- `it` title: plain-English sentence describing what the user can do or see, e.g. `'displays basic info, stats and ability scores'`, `'state persists after page reload'`, `'shows an error for invalid credentials'` — **no kebab-case slugs**

### Test File Structure

```typescript
describe('Feature Name', () => {
  before(() => /* one-time global setup (e.g. clear users) */);

  context('Scenario group', () => {
    before(() => {
      cy.seedCharacter(Cypress.testUser.uid, charId, charData); // seed once
    });

    beforeEach(() => {
      cy.visitAs(Cypress.testUser.uid, '/'); // auth + navigate every test
      // any navigation to the specific starting point
    });

    after(() => {
      cy.callFirestore('delete', `users/${Cypress.testUser.uid}/characters`);
    });

    it('journey-name', () => {
      // Test: one focused user journey — no cy.visit() / cy.reload() inside
    });

    it('persistence-across-reload', () => {
      // Test: explicitly tests persistence — one cy.reload() allowed
      cy.reload();
      // ...
    });
  });
});
```

### Checklist

1. Use `cy.visitAs(uid, path)` at the start of every test (or in `beforeEach`)
2. Use `cy.seedCharacter(s)` in `before()` to set up data — never via UI walkthrough
3. One `it()` per user journey — split mega-its, keep focused its together in a `context()`
4. No `cy.visit()` or `cy.reload()` mid-test unless the test is explicitly about navigation or persistence
5. No `cy.logout()` calls between tests — `cy.session` and `cy.visitAs` handle isolation
6. Clean up test data in `after()` hooks
7. Prefix all test comments with `// Test:`
8. Use existing mock data from `cypress/support/mocks/characterList.ts`

### Constraints

- **NO** `cy.wait(ms)` or `sleep()` — use `cy.waitForLoading()` or `cy.intercept()`
- **NO** MUI class selectors (`.MuiButton-root`, `.MuiCard-root`, etc.)
- **NO** mega-`it()` blocks covering multiple user journeys
- **NO** `cy.visit()` / `cy.reload()` mid-test (except persistence tests)
- **NO** `cy.logout()` between tests
- **NO** helpers outside `cypress/support/`
- **DO** reference `cypress/REFACTOR.md` for migration status and per-spec checklist

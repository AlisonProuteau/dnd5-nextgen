# GitHub Copilot Instructions for D&D 5e NextGen

## Project Overview

Modern web application for creating and managing D&D 5e characters, built with React 20, TypeScript, Firebase (Firestore, Auth, Storage), and Material-UI.

## Code Style & Conventions

### TypeScript

- **Strict mode enabled** - Always use proper TypeScript types
- **No `any` types** - Use proper type definitions from `src/representations/`
- **Async/await preferred** over `.then()` chains
- **Functional components only** - No class components

### React Patterns

- **Hooks-based** - Use React hooks (useState, useEffect, useContext, etc.)
- **Context providers** for global state (`src/providers/`)
- **Material-UI components** - Use MUI v5 components and theming
- **Responsive design** - Always consider mobile, tablet, and desktop viewports

### File Organization

- **Components** in `src/components/` with clear feature grouping
- **Shared components** in `src/components/shared/` for reusable UI elements
- **Type definitions** in `src/representations/` (e.g., `character.representation.tsx`)
- **API layer** in `src/api/` for external service calls
- **Utilities** in `src/utils/` for helper functions

### Naming Conventions

- **Components**: PascalCase (e.g., `CharacterCard`, `SpellsStep`)
- **Files**: Match component names (e.g., `CharacterCard.tsx`)
- **Functions**: camelCase (e.g., `calculateModifier`, `handleSubmit`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_LEVEL`, `DEFAULT_STATS`)
- **Interfaces/Types**: PascalCase with descriptive names

## Testing Standards

### Cypress E2E Tests

**Philosophy: Comprehensive Full-Flow Approach**

- **Prefer single comprehensive tests** over multiple fragmented tests
- **Include validation, errors, and success** in the same test flow
- **Real user journeys** - Mirror actual user behavior patterns
- **Complex features**: One E2E "happy path" + specific edge case tests when needed

**Test Structure:**

```javascript
// ✅ Preferred - Comprehensive
it('should complete full character creation with validation and error handling');

// ✅ Acceptable for complex features
it('should complete character creation workflow (E2E happy path)');
it('should validate complex multiclass edge cases');

// ❌ Avoid - Basic fragmentation
it('should validate race selection');
it('should validate class selection');
```

**Test Commenting Standard:**

- **Always prefix with `Test:`** - Example: `// Test: Validate form submission errors`

**Custom Commands Usage:**

- `cy.login(uid)` - Authentication
- `cy.createTestCharacter(uid, id, data)` - Test data setup
- `cy.getByTestId('element')` - Element selection
- `cy.getByRole('button', 'Text')` - Semantic selection
- `cy.callFirestore('set', 'path', data)` - Firebase operations

**Selector Strategy (Priority Order):**

1. Semantic HTML (`button`, `form`, `input`)
2. Text content (button text, labels)
3. ARIA attributes (`[role="button"]`, `[aria-label="Close"]`)
4. Data-testid (`[data-testid="submit-button"]`)
5. Form elements (`input[type="email"]`)

**NEVER use MUI class selectors** (`.MuiButton-root`, `.MuiCard-root`) - they break with updates

**Test Data:**

- Use existing mocks from `cypress/support/mocks/characterList.ts`
- Don't create factories unless absolutely necessary
- Keep test data simple and maintainable

### Error Handling in Tests

- All Firebase operations wrapped in try-catch blocks
- Use `.should()` assertions instead of fixed waits
- Include descriptive error messages with emoji indicators (✅, ❌, ⚠️)
- Command overwrites (`visit`, `reload`) include error handling

## Firebase Integration

### Firestore Patterns

- **Real-time listeners** for data synchronization
- **Batch operations** for multiple writes
- **Security rules** enforce user permissions
- **Subcollections** for related data (e.g., `users/{uid}/characters/{characterId}`)

### Authentication

- Firebase Auth with email/password
- Admin privileges via custom claims
- Service account for admin operations

### Storage

- Character portraits stored in Firebase Storage
- AI-generated images (admin feature)

## D&D 5e Specific

### Data Structure

- **Races, Classes, Spells** - Reference D&D 5e API data
- **Character data** - Stored in Firestore with user ownership
- **Ability Scores** - Standard modifiers (score - 10) / 2
- **Proficiency Bonus** - Based on character level
- **Version support** - Legacy (current), 2024 (future)

### Character Creation Flow

1. Race selection (with subraces)
2. Class selection (with subclasses)
3. Background selection
4. Ability scores (point buy/standard array/custom)
5. Equipment assignment
6. Spell selection (for spellcasters)
7. Character details (name, age, appearance, etc.)

### Spell Management

- **Cantrips** - Always prepared, no slots
- **Known spells** vs **Prepared spells** (class-dependent)
- **Spell slots** by level and class
- **Ritual casting** support

## CI/CD & Deployment

### GitHub Actions

- Automated Cypress tests on PRs (parallel mobile/desktop)
- Firebase emulator setup with cached data
- Cypress Cloud recording and reporting
- Auto-generated PR comments with test results (Markdown formatted)

### Report Generation

- `generate-text-report.js` - Creates formatted test reports
- Shows only failed files in breakdown
- Includes Cypress Cloud dashboard URLs
- Emoji indicators for pass/warn/fail status

### Deployment

- Firebase Hosting via GitHub Actions
- Production builds with Vite
- Environment variables via `.env.local`

## Common Patterns

### Component Structure

```typescript
import React, { useState, useEffect } from 'react';
import { Box, Button, Typography } from '@mui/material';
import type { Character } from 'src/representations/character.representation';

export const ComponentName: React.FC<Props> = ({ prop1, prop2 }) => {
  const [state, setState] = useState<Type>(initialValue);

  useEffect(() => {
    // Side effects
  }, [dependencies]);

  const handleAction = async () => {
    try {
      // Implementation
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return <Box data-testid="component-name">{/* Component JSX */}</Box>;
};
```

### Firebase Operations

```typescript
// Prefer subcollections for user data
const characterRef = doc(db, `users/${uid}/characters/${characterId}`);
await setDoc(characterRef, characterData);

// Use batch for multiple writes
const batch = writeBatch(db);
batch.set(ref1, data1);
batch.set(ref2, data2);
await batch.commit();
```

### Error Handling

```typescript
try {
  await someAsyncOperation();
} catch (error) {
  console.error('Descriptive error message:', error);
  // Show user-friendly error message
}
```

## Key Features to Preserve

- **Responsive design** - Mobile-first approach
- **Real-time updates** - Firebase listeners for data sync
- **Admin features** - Character generator, database editor
- **Version support** - Legacy and future 2024 edition
- **Comprehensive validation** - Form validation and error messages
- **Accessibility** - ARIA labels, semantic HTML, keyboard navigation

## Avoid

- ❌ MUI class selectors in tests (`.MuiButton-root`)
- ❌ Fixed timeouts (`cy.wait(5000)`) - use `.should()` assertions
- ❌ `any` types in TypeScript
- ❌ `.then()` chains - use async/await
- ❌ Fragmented Cypress tests - prefer comprehensive flows
- ❌ Class components - use functional components
- ❌ Inline styles - use MUI sx prop or styled components

## Preferred

- ✅ Comprehensive Cypress tests covering full workflows
- ✅ Custom Cypress commands for common operations
- ✅ Static test data from `characterList.ts`
- ✅ `data-testid` for reliable element selection
- ✅ Error handling with try-catch blocks
- ✅ Async/await for async operations
- ✅ Proper TypeScript types from representations
- ✅ MUI components with sx prop for styling
- ✅ Functional components with hooks
- ✅ Firebase real-time listeners

## Resources

- [D&D 5e API](https://5e-bits.github.io/docs/api)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Material-UI Documentation](https://mui.com/)
- [Cypress Best Practices](https://docs.cypress.io/guides/references/best-practices)

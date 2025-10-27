# Cypress Tests for D&D 5e NextGen

This directory contains comprehensive end-to-end tests for the D&D 5e NextGen character generator application using Cypress. The test suite follows a consolidated approach where each test file contains comprehensive workflow tests that cover validation-before-success patterns, ensuring real end-to-end user experiences.

## Test Structure

### Test Files Overview

All test files follow a consolidated approach with comprehensive workflow tests rather than fragmented unit-like tests:

- **`auth.cy.ts`** - Complete authentication workflows (sign in/up with full validation and error handling)
- **`character-creation.cy.ts`** - Complete character creation stepper workflow (race/class/background selection with validation)
- **`character-generator.cy.ts`** - Complete AI character portrait generation workflow (admin-only feature with full form validation)
- **`character-sheet.cy.ts`** - Complete character sheet management workflows (display, editing, notes, persistence)
- **`contact-settings.cy.ts`** - Complete contact form and settings workflows (validation, submission, version management)
- **`navigation.py.ts`** - Complete navigation and authentication state workflows (route protection, redirects, responsive design)

### Test Design Philosophy

Each test follows the **validation-before-success pattern**:
1. **Validation Testing** - Tests form validation, error states, and edge cases first
2. **Loading States** - Tests intermediate states and user feedback
3. **Error Handling** - Tests network failures and unexpected conditions  
4. **Success Workflows** - Tests complete successful user journeys
5. **Post-Action Behavior** - Tests what happens after successful operations

### Custom Commands

Custom Cypress commands are defined in `support/commands.ts`:

- `cy.login()` - Authenticates as a regular test user
- `cy.loginAsAdmin()` - Authenticates as admin user (for character generator access)
- `cy.logout()` - Logs out current user
- `cy.createTestCharacter()` - Creates a test character in Firestore
- `cy.clearUserCharacters()` - Removes all test characters
- `cy.waitForPageLoad()` - Waits for page to fully load
- `cy.fillCharacterCreationForm()` - Fills out the character creation form
- `cy.selectMuiOption(selectId, option)` - Selects option from Material-UI Select component

## Test Coverage

### Authentication Tests (`auth.cy.ts`)

**Complete Sign In Flow**
- Email and password validation with real-time feedback
- Loading states during authentication attempts
- Error handling for invalid credentials and network issues
- Form field interactions and accessibility features
- Successful authentication and redirect to home page

**Sign Up and Onboarding Flow**  
- Comprehensive form validation (email format, password requirements, confirmation matching)
- Password visibility toggle functionality
- Loading states and error handling during account creation
- Complete onboarding process with version selection
- Post-signup navigation and user state management

### Character Creation Tests (`character-creation.cy.ts`)

**Complete Stepper Workflow with Validation**
- Form validation at each step before allowing progression
- Race selection with details display and validation
- Class selection with features, proficiencies, and validation
- Background and alignment selection with comprehensive options
- Character information form with all required field validation
- Stepper navigation (forward/backward) with state persistence
- Loading states during character creation process
- Final character creation, database save, and success confirmation
- Error handling for creation failures and network issues
- Responsive design across all viewport sizes

### Character Generator Tests (`character-generator.py.ts`)

**Complete Generation Workflow with Validation and Error Handling**
- Admin-only access control and permission validation
- Comprehensive form validation for all customization options
- Character customization (race, gender, class, style) with real-time validation
- Image generation workflow with loading states and progress feedback
- Prompt display, refinement, and regeneration options
- Batch generation capabilities with queue management
- Error handling for API failures and rate limiting
- Form reset functionality and state management
- Accessibility features and keyboard navigation
- Responsive design testing across devices

### Character Sheet Tests (`character-sheet.cy.ts`)

**Complete Character Display and Navigation**
- Character sheet layout with all sections (stats, equipment, features)
- Ability scores display with calculated modifiers
- Navigation to character points allocation page
- Equipment and inventory management interface
- Spells section display for spellcaster classes
- Complete tab/section navigation workflow

**Complete Character Editing Workflow with Validation**
- Character name editing with form validation (required fields)
- Character notes editing with length validation and persistence
- Image upload functionality with file validation
- Loading states during save operations
- Data persistence testing after page reload
- Error handling for save failures and network issues
- Character deletion workflow with confirmation dialog
- Security testing (protecting other users' characters)

### Navigation Tests (`navigation.cy.ts`)

**Complete Authentication Workflow with Proper Redirects**
- Unauthenticated user access control and redirect validation
- Version requirement validation before accessing features
- Character requirement validation for home page access
- Successful authentication flow with all validations passing
- Character card display and interaction workflows

**Complete Navigation and Character Management**
- Header navigation between all pages
- Floating action button functionality and accessibility
- Character grid layout with multiple characters
- Protected route access control and security
- Admin feature visibility and access control
- Loading states and error handling for navigation
- Responsive design across all viewport sizes

### Contact & Settings Tests (`contact-settings.cy.ts`)

**Complete Contact Form Workflow**
- Form validation for all fields before submission
- Message type selection with conditional field validation
- Character reference selection for bug reports
- Anonymous contact option functionality
- Loading states during form submission
- Error handling for submission failures
- Success confirmation and form reset

**Complete Settings Management Workflow**
- Version selection interface with validation
- Available vs unavailable version handling
- Loading states during version updates
- Error handling for update failures
- Success confirmation and post-update navigation
- Accessibility features and responsive design

## Firebase Integration

The tests use Firebase emulators for:

- **Authentication** - User sign in/up and session management
- **Firestore** - Character data storage and retrieval
- **Storage** - File uploads (if applicable)

### Emulator Configuration

Tests run against local Firebase emulators configured in `cypress.config.ts`:

- Auth Emulator: `localhost:9099`
- Firestore Emulator: `localhost:8080`
- Storage Emulator: `localhost:9199`

## Running Tests

### Prerequisites

1. Start Firebase emulators: `yarn firebase:emulate`
2. Start the development server: `yarn start:dist`

### Run Tests

```bash
# Open Cypress Test Runner
yarn cy:open

# Run all tests headlessly
yarn cypress run

# Run specific test file
yarn cypress run --spec "cypress/e2e/auth.cy.ts"

# Run tests in specific browser
yarn cypress run --browser chrome
```

### Test Data Setup

Tests automatically create and clean up test data:

- Test users with predictable UIDs
- Sample characters for testing interactions
- Proper Firestore document structure

## Test Best Practices

### 1. Consolidated Workflow Testing

- Each test covers complete user workflows rather than isolated functions
- Tests follow validation-before-success patterns for realistic user experiences
- Comprehensive error handling and edge case coverage within single test cases
- Real end-to-end flows that mirror actual user behavior

### 2. Test Independence and Data Management

- Each test is independent and can run in isolation
- Tests clean up their own data using custom Cypress commands
- No dependencies between test files or individual tests
- Proper Firebase emulator integration for consistent test data

### 3. Real User Experience Testing

- Tests follow actual user navigation patterns and workflows
- Use realistic data and interactions throughout test scenarios
- Comprehensive validation testing before testing success scenarios
- Loading states, error conditions, and recovery testing

### 4. Responsive and Accessible Design Testing

- Tests run on multiple viewport sizes (mobile, tablet, desktop)
- Keyboard navigation and accessibility feature validation
- Touch-friendly interaction testing for mobile devices
- ARIA labels, roles, and screen reader compatibility checks

### 5. Comprehensive Error and Edge Case Handling

- Network failure simulation and recovery testing
- Invalid data handling and form validation testing
- User permission and security validation
- API failure simulation and graceful degradation testing

## Test Configuration

### Viewport Sizes

- Mobile: 375x667 (iPhone SE)
- Tablet: 768x1024 (iPad)
- Desktop: 1920x1080 (Full HD)

### Browser Support

- Chrome (primary)
- Firefox
- Edge
- Safari (via webkit)

## Debugging Tests

### Common Issues

1. **Firebase Connection** - Ensure emulators are running
2. **Timing Issues** - Use proper waits for async operations
3. **Element Selection** - Use reliable selectors (data-testid preferred)
4. **Test Data** - Verify test user and character creation

### Debug Tools

- Cypress Test Runner for interactive debugging
- Browser DevTools integration
- Screenshots and videos on failure
- Console logs and network requests

## Continuous Integration

Tests are configured to run in CI/CD pipelines:

- Headless browser execution
- Parallel test execution support
- Test result reporting
- Failure screenshots and videos

## Contributing

When adding new tests to the consolidated test suite:

### Test Structure Guidelines

1. **Follow Consolidated Workflow Patterns** - Create comprehensive tests that cover complete user workflows rather than fragmented unit-like tests
2. **Use Validation-Before-Success Pattern** - Always test validation, loading states, and error handling before testing successful scenarios
3. **Include Comprehensive Coverage** - Each test should cover the complete user journey including edge cases and error conditions
4. **Follow Existing Naming Conventions** - Use descriptive test names that explain the complete workflow being tested

### Technical Requirements

1. **Use Custom Commands** - Leverage existing custom commands for common operations (login, character creation, etc.)
2. **Add Proper Test Descriptions** - Include detailed descriptions that explain the complete workflow and validation patterns
3. **Include Responsive Design Testing** - Test across multiple viewport sizes within comprehensive workflow tests
4. **Add Accessibility Testing** - Include keyboard navigation and ARIA validation within workflow tests
5. **Implement Proper Cleanup** - Use afterEach/after hooks for data cleanup and test isolation

### Code Quality Standards

1. **Real E2E Testing** - Ensure tests represent actual user workflows, not isolated component testing
2. **Error Handling Coverage** - Include network failures, validation errors, and edge cases in comprehensive tests
3. **Loading State Testing** - Test intermediate states and user feedback during async operations
4. **Security Testing** - Include permission validation and data protection testing where applicable
5. **Performance Considerations** - Optimize test execution while maintaining comprehensive coverage

### File Organization

- Each test file should focus on a specific feature area but contain comprehensive workflow tests
- Group related test scenarios within describe blocks that represent complete user journeys
- Use meaningful describe block names that indicate the scope of the comprehensive workflow testing

## Environment Variables

Required environment variables for testing:

- `FIREBASE_AUTH_EMULATOR_HOST`
- `FIRESTORE_EMULATOR_HOST`
- `FIREBASE_STORAGE_EMULATOR_HOST`

These are automatically set by the test configuration.

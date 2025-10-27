/// <reference types="cypress" />
import type { UserImportRecord } from 'firebase-admin/lib/auth/user-import-builder';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';
import { random } from 'lodash';

// TODO: Update
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Login as a new user
       */
      loginNewUser(): Chainable<string>;

      /**
       * Login as admin user (for character generator access)
       */
      loginAsAdmin(): Chainable<void>;

      /**
       * Create a test character for testing purposes
       */
      createTestCharacter(): Chainable<void>;

      /**
       * Clear all characters for current user
       */
      clearUserCharacters(): Chainable<void>;

      /**
       * Wait for page to load completely
       */
      waitForPageLoad(): Chainable<void>;

      /**
       * Fill character creation form
       */
      fillCharacterCreationForm(): Chainable<void>;

      /**
       * Select from Material-UI Select component
       */
      selectMuiOption(selectId: string, option: string): Chainable<void>;

      /**
       * Check authentication state
       */
      checkAuthState(shouldBeAuthenticated?: boolean): Chainable<void>;

      /**
       * Fill Material-UI TextField
       */
      fillMuiTextField(selector: string, value: string): Chainable<void>;

      /**
       * Wait for React Query to settle
       */
      waitForReactQuery(): Chainable<void>;
    }
  }
}

// Login as regular user - simplified for testing
Cypress.Commands.add('loginNewUser', (id?: string) => {
  if (id && cy.callFirestore('get', `users/${id}`).then((doc) => doc.exists)) {
    cy.login(id);
    return cy.wrap(id);
  }

  const user: UserImportRecord = {
    displayName: 'Test',
    uid: id ? id : random(1000000, 9999999).toString(),
    email: 'test@test.com'
  };
  cy.authImportUsers([user])
    .callFirestore('set', `/users/${user.uid}`, { identifier: user.email, version: 'Legacy' })
    .login(user.uid);
  return cy.wrap(user.uid);
});

// Login as admin user (for character generator access)
Cypress.Commands.add('loginAsAdmin', () => {
  const adminUid = '8lFf6wEj9ARVlilMOrOxYDZOkSS2'; // Admin UID from App.tsx
  if (adminUid && cy.callFirestore('get', `users/${adminUid}`).then((doc) => doc.exists)) {
    cy.login(adminUid);
    return;
  }

  const user: UserImportRecord = {
    displayName: 'Test',
    uid: adminUid,
    email: 'test@test.com'
  };
  cy.authImportUsers([user])
    .callFirestore('set', `/users/${user.uid}`, { identifier: user.email, version: 'Legacy' })
    .login(user.uid);
});

// Create a test character
Cypress.Commands.add('createTestCharacter', () => {
  const characterData = {
    id: 'test-character-1',
    name: 'Test Character',
    age: 25,
    sex: { index: 'M', name: 'Male' },
    race: { index: 'human', name: 'Human' },
    subrace: null,
    class: { index: 'fighter', name: 'Fighter' },
    subclass: null,
    background: { index: 'soldier', name: 'Soldier' },
    alignment: { index: 'lawful-good', name: 'Lawful Good' },
    level: 1,
    version: 'Legacy',
    languages: [],
    proficiencies: [],
    skills: [],
    equipments: []
  };

  cy.callFirestore('set', 'users/test-user/characters/test-character-1', characterData);
});

// Clear all characters for current user
Cypress.Commands.add('clearUserCharacters', () => {
  // TODO: clear all characters programmatically
  // Use multiple delete calls for subcollections since cypress-firebase doesn't support recursive delete
  cy.callFirestore('delete', 'users/test-user/characters/test-character-1');
  cy.callFirestore('delete', 'users/test-user/characters/test-character-2');
  cy.callFirestore('delete', 'users/test-user/characters/test-character-3');
});

// Custom command to wait for page to load
Cypress.Commands.add('waitForPageLoad', () => {
  cy.get('body').should('be.visible');
  cy.get('.MuiCircularProgress-root').should('not.exist');
});

// Custom command to fill character creation form
Cypress.Commands.add('fillCharacterCreationForm', () => {
  // Step 1: Race
  cy.get('[data-testid="race-card"]').first().click();
  cy.get('button:contains("Next")').click();

  // Step 2: Class
  cy.get('[data-testid="class-card"]').first().click();
  cy.get('button:contains("Next")').click();

  // Step 3: Background
  cy.get('.MuiSelect-select').first().click();
  cy.get('.MuiMenuItem-root').first().click();
  cy.get('button:contains("Next")').click();

  // Step 4: Character Info
  cy.get('input[id="name"]').type('Test Character');
  cy.get('input[id="age"]').type('25');
});

// Custom command to select from Material-UI Select component
Cypress.Commands.add('selectMuiOption', (selectId: string, option: string) => {
  cy.get(`[id="${selectId}"]`).click();
  cy.get('.MuiMenuItem-root').contains(option).click();
});

// Custom command to check if user is authenticated
Cypress.Commands.add('checkAuthState', (shouldBeAuthenticated = true) => {
  if (shouldBeAuthenticated) {
    cy.window()
      .its('localStorage')
      .should('have.property', 'firebase:authUser:dnd5-nextgen:[DEFAULT]');
  } else {
    cy.window()
      .its('localStorage')
      .should('not.have.property', 'firebase:authUser:dnd5-nextgen:[DEFAULT]');
  }
});

// Custom command to handle Material-UI form interactions
Cypress.Commands.add('fillMuiTextField', (selector: string, value: string) => {
  cy.get(selector).click().clear().type(value);
});

// Custom command to wait for React Query to settle
Cypress.Commands.add('waitForReactQuery', () => {
  cy.window().should('have.property', '__REACT_QUERY_STATE__');
  cy.window().its('__REACT_QUERY_STATE__').should('have.property', 'queries');
});

export { };


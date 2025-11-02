/// <reference types="cypress" />
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';
import { random } from 'lodash';
import { Character } from 'src/representations/user.representation';
import { baseCharacter } from './mocks/baseCharacter';

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Logs in as a new user. Creates the user if not present.
       * @returns Chainable<string> - The user ID.
       */
      loginNewUser(): Chainable<string>;

      /**
       * Logs in as the admin user.
       * @returns Chainable<void>
       */
      loginAsAdmin(): Chainable<void>;

      /**
       * Creates a test character for testing purposes.
       * Merges baseCharacter with any overrides.
       * @param userId - The user ID.
       * @param characterId - Optional character ID.
       * @param character - Partial<Character> overrides.
       * @returns Chainable<string> - The character ID.
       */
      createTestCharacter(
        userId: string,
        characterId?: string,
        character?: Partial<Character>
      ): Chainable<string>;

      /**
       * Clears all data for the input user (deletes user and all characters).
       * @param uid - The user ID.
       * @returns Chainable<void>
       */
      clearUser(uid: string): Chainable<void>;

      /**
       * Clears all users that are not default users (test user and admin).
       * @returns Chainable<void>
       */
      clearAllNonDefaultUsers(): Chainable<void>;

      /**
       * Selects an action for a note card (Edit, Pin, Archive, etc).
       * @param data - Note card selector data (id or text).
       * @param action - Action to perform.
       * @returns Chainable<JQuery<HTMLElement>>
       */
      selectCardAction(
        data: { id?: string; text?: string },
        action: 'Edit' | 'Pin' | 'Unpin' | 'Archive' | 'Restore' | 'Delete'
      ): Chainable<JQuery<HTMLElement>>;

      /**
       * Selects an option from a dropdown by visible text.
       * @param selectSelector - Selector for the dropdown.
       * @param optionText - Text of the option to select.
       * @returns Chainable<void>
       */
      selectOption(selectSelector: string, optionText: string | RegExp): Chainable<void>;

      /**
       * Gets a button by its text content (supports chaining).
       * @param text - Button text or RegExp.
       * @returns Chainable<JQuery<HTMLButtonElement>>
       */
      getButton(text: string | RegExp): Chainable<JQuery<HTMLButtonElement>>;

      /**
       * Waits for loading spinner to disappear.
       * @returns Chainable<void>
       */
      waitForLoading(): Chainable<void>;

      /**
       * Gets an element by ARIA role (supports chaining).
       * @param role - ARIA role.
       * @param name - Optional accessible name.
       * @returns Chainable<JQuery<HTMLElement>>
       */
      getByRole(role: string, name?: string): Chainable<JQuery<HTMLElement>>;

      /**
       * Gets an element by test id (preferred method, supports chaining).
       * @param testId - The data-testid value.
       * @param options - Selector and type options.
       * @returns Chainable<JQuery<HTMLElement>>
       */
      getByTestId(
        testId: string,
        { selector, type }?: { selector?: string; type?: 'exact' | 'starts' | 'contains' }
      ): Chainable<JQuery<HTMLElement>>;
    }
  }
}

/**
 * Cypress command: loginNewUser
 * Logs in as a regular user for testing. Creates the user if not present.
 */
Cypress.Commands.add('loginNewUser', (id?: string) => {
  const userId = id ? id : random(10000, 99999).toString();

  return cy.authGetUser(userId).then((existingUser) => {
    if (existingUser?.uid) {
    } else {
      const user = {
        displayName: `New User ${userId}`,
        uid: userId,
        email: 'test@test.com'
      };
      cy.authCreateUser(user).callFirestore('set', `/users/${user.uid}`, {
        identifier: user.email,
        version: 'Legacy'
      });
    }

    cy.login(userId);
    return cy.wrap(userId);
  });
});

/**
 * Cypress command: loginAsAdmin
 * Logs in as the admin user for character generator access. Creates the user if not present.
 */
Cypress.Commands.add('loginAsAdmin', () => {
  const adminId = '8lFf6wEj9ARVlilMOrOxYDZOkSS2'; // Admin UID from App.tsx

  cy.authGetUser(adminId).then((existingUser) => {
    if (!existingUser?.uid) {
      const user = {
        displayName: 'Admin User',
        uid: adminId,
        email: 'admin@test.com'
      };
      cy.authCreateUser(user).callFirestore('set', `/users/${user.uid}`, {
        identifier: user.email,
        version: 'Legacy'
      });
    }

    cy.login(adminId);
  });
});

/**
 * Cypress command: createTestCharacter
 * Creates a test character for the given user, merging baseCharacter with overrides.
 */
Cypress.Commands.add(
  'createTestCharacter',
  (userId: string, characterId?: string, character = {}) => {
    const id: string =
      characterId ?? (character?.id as string | undefined) ?? random(10000, 99999).toString();
    const data = { ...baseCharacter, ...character, id };

    cy.callFirestore('set', `users/${userId}/characters/${id}`, data);
    return cy.wrap(id);
  }
);

/**
 * Cypress command: clearUser
 * Clears all data for the input user, including all characters.
 */
Cypress.Commands.add('clearUser', (uid: string) => {
  cy.authGetUser(uid).then((existingUser) => existingUser && cy.authDeleteUser(uid));
  cy.callFirestore('delete', `users/${uid}/characters`);
  cy.callFirestore('delete', `users/${uid}`);
  cy.reload();
});

/**
 * Cypress command: clearAllNonDefaultUsers
 * Clears all users except the default test and admin users.
 */
Cypress.Commands.add('clearAllNonDefaultUsers', () => {
  cy.authListUsers().then((users) => {
    users.users.forEach((user) => {
      if (user.uid !== Cypress.testUser.uid && user.uid !== '8lFf6wEj9ARVlilMOrOxYDZOkSS2') {
        cy.authDeleteUser(user.uid);
        cy.callFirestore('delete', `users/${user.uid}/characters`);
        cy.callFirestore('delete', `users/${user.uid}`);
      }
    });
  });
});

/**
 * Cypress command: selectCardAction
 * Selects an action (Edit, Pin, etc) for a note card by id or text.
 */
Cypress.Commands.add(
  'selectCardAction',
  (
    data: { id?: string; text?: string },
    action: 'Edit' | 'Pin' | 'Unpin' | 'Archive' | 'Restore' | 'Delete'
  ) =>
    (data.id
      ? cy.getByTestId(`note-card-${data.id}`)
      : cy.getByTestId('note-card-', { selector: `:contains("${data.text}")` })
    ).within(() => {
      cy.getByTestId('note-actions-', { selector: '>button' }).focus();
      cy.getByTestId(action, { type: 'exact' }).click();
    })
);

/**
 * Cypress command: selectOption
 * Selects an option from a Select dropdown by visible text.
 */
Cypress.Commands.add('selectOption', (selectId: string, option?: string | RegExp) => {
  cy.get(selectId).click();
  option && cy.get(`[role="option"]`).contains(option).click();
});

/**
 * Cypress command: waitForLoading
 * Waits for loading spinner or progress bar to disappear.
 */
Cypress.Commands.add('waitForLoading', () => {
  cy.get('[role="progressbar"], .loading, [data-testid="loading"]').should('not.exist');
});

/**
 * Cypress command: getByRole
 * Gets an element by ARIA role and optional accessible name. Supports chaining.
 */
Cypress.Commands.add(
  'getByRole',
  { prevSubject: 'optional' },
  (subject, role: string, name?: string) => {
    const current = name ? `[role="${role}"]:contains("${name}")` : `[role="${role}"]`;

    return subject ? cy.wrap(subject).find(current) : cy.get(current);
  }
);

/**
 * Cypress command: getByTestId
 * Gets an element by data-testid, with selector and type options. Supports chaining.
 */
Cypress.Commands.add(
  'getByTestId',
  { prevSubject: 'optional' },
  (subject, testId: string, { selector, type = 'starts' } = { type: 'starts' }) => {
    let baseSelector = `[data-testid^="${testId}"]`;
    if (type === 'exact' || type === 'contains') {
      baseSelector = type === 'exact' ? `[data-testid="${testId}"]` : `[data-testid*="${testId}"]`;
    }
    const current = selector ? `${baseSelector}${selector}` : baseSelector;

    return subject ? cy.wrap(subject).find(current) : cy.get(current);
  }
);

/**
 * Cypress command: getButton
 * Gets a button by its text content. Supports chaining.
 */
Cypress.Commands.add('getButton', { prevSubject: 'optional' }, (subject, text: string | RegExp) => {
  const current = subject ? cy.wrap(subject).find('button') : cy.get('button');

  return current.contains(text).closest('button');
});

export {};

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
       * Waits for loading spinner to disappear.
       * @returns Chainable<void>
       */
      waitForLoading(): Chainable<void>;

      /**
       * Gets a button by its text content (supports chaining).
       * @param text - Button text or RegExp.
       * @returns Chainable<JQuery<HTMLButtonElement>>
       * @description Use `cy.wrap($el).getButton(...)` when scoping inside a `within()` block.
       */
      getButton(text: string | RegExp, selector?: string): Chainable<JQuery<HTMLButtonElement>>;

      /**
       * Gets an element by ARIA role (supports chaining).
       * @param role - ARIA role.
       * @param name - Optional accessible name.
       * @returns Chainable<JQuery<HTMLElement>>
       * @description Use `cy.wrap($el).getByRole(...)` when scoping inside a `within()` block.
       */
      getByRole(role: string, name?: string): Chainable<JQuery<HTMLElement>>;

      /**
       * Gets an element by test id (preferred method, supports chaining).
       * @param testId - The data-testid value.
       * @param options - Selector and type options.
       * @returns Chainable<JQuery<HTMLElement>>
       * @description Use `cy.wrap($el).getByTestId(...)` when scoping inside a `within()` block.
       */
      getByTestId(
        testId: string,
        { selector, type }?: { selector?: string; type?: 'exact' | 'starts' | 'contains' }
      ): Chainable<JQuery<HTMLElement>>;

      /**
       * Asserts that an element with aria-selected is selected.
       * @returns Chainable<JQuery<HTMLElement>>
       */
      shouldBeSelected(): Chainable<JQuery<HTMLElement>>;

      /**
       * Clicks the previous/next step button until the target step section is active.
       * Useful for multi-step character sheet navigation.
       * @param step - The data-testid step name (without '-section' suffix).
       * @param type - Direction: 'previous' or 'next' (default: 'next').
       * @returns Chainable resolving to the active section element.
       */
      clickUntilStep(step: string, type?: 'previous' | 'next'): Chainable<JQuery<HTMLElement>>;
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
  cy.env(['FIREBASE_ADMIN_UID']).then(({ FIREBASE_ADMIN_UID }) => {
    cy.authGetUser(FIREBASE_ADMIN_UID).then((existingUser) => {
      if (!existingUser?.uid) {
        const user = {
          displayName: 'Admin User',
          uid: FIREBASE_ADMIN_UID,
          email: 'admin@test.com'
        };
        cy.authCreateUser(user).callFirestore('set', `/users/${user.uid}`, {
          identifier: user.email,
          version: 'Legacy'
        });
      }

      cy.login(FIREBASE_ADMIN_UID);
    });
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
  cy.callFirestore('delete', `users/${uid}`);
  cy.reload();
});

/**
 * Cypress command: clearAllNonDefaultUsers
 * Clears all users except the default test and admin users.
 */
Cypress.Commands.add('clearAllNonDefaultUsers', () => {
  cy.env(['FIREBASE_ADMIN_UID']).then(({ FIREBASE_ADMIN_UID }) => {
    cy.authListUsers().then((users) => {
      users.users.forEach((user) => {
        if (user.uid !== Cypress.testUser.uid && user.uid !== FIREBASE_ADMIN_UID) {
          cy.authDeleteUser(user.uid);
          cy.callFirestore('delete', `users/${user.uid}/characters`);
          cy.callFirestore('delete', `users/${user.uid}`);
        }
      });
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
    ).within(($el) => {
      cy.wrap($el).getByTestId('note-actions-', { selector: '>button' }).focus();
      cy.wrap($el).getByTestId(action, { type: 'exact' }).click();
    })
);

/**
 * Cypress command: selectOption
 * Selects an option from a Select dropdown by visible text.
 */
Cypress.Commands.add('selectOption', (selectId: string, option?: string | RegExp) => {
  cy.get(selectId).click();
  option && cy.get(`[role="option"]`, { withinSubject: null }).contains(option).click();
});

/**
 * Cypress command: waitForLoading
 * Waits for loading spinner or progress bar to disappear.
 */
Cypress.Commands.add('waitForLoading', () => {
  cy.get('[role="progressbar"], .loading, [data-testid="loading"]').should('not.exist', {
    timeout: 10000
  });
});

/**
 * Cypress command: getByRole
 * Gets an element by ARIA role and optional accessible name. Supports chaining.
 * @description Use `cy.wrap($el).getByRole(...)` when scoping inside a `within()` block.
 */
Cypress.Commands.addQuery('getByRole', function (role: string, name?: string) {
  const nextCommand: Cypress.Command = (this as any)['attributes'].next;

  return (subject) => {
    const current = name ? `[role="${role}"]:contains("${name}")` : `[role="${role}"]`;
    const res = subject ? Cypress.$(subject).find(current) : Cypress.$(current);

    if (
      res.length === 0 &&
      !(nextCommand.get('name') === 'should' && nextCommand.get('args')[0] === 'not.exist')
    )
      throw new Error(`No element found for role: ${role} with text: ${name}`);
    return res;
  };
});

/**
 * Cypress command: getByTestId
 * Gets an element by data-testid, with selector and type options. Supports chaining.
 * @description Use `cy.wrap($el).getByTestId(...)` when scoping inside a `within()` block.
 */
Cypress.Commands.addQuery(
  'getByTestId',
  function (testId: string, { selector, type = 'starts' } = { type: 'starts' }) {
    const nextCommand: Cypress.Command = (this as any)['attributes'].next;

    return (subject) => {
      let baseSelector = `[data-testid^="${testId}"]`;
      if (type === 'exact' || type === 'contains') {
        baseSelector =
          type === 'exact' ? `[data-testid="${testId}"]` : `[data-testid*="${testId}"]`;
      }

      const current = selector ? `${baseSelector}${selector}` : baseSelector;
      const res = subject ? Cypress.$(subject).find(current) : Cypress.$(current);

      if (
        res.length === 0 &&
        !(nextCommand.get('name') === 'should' && nextCommand.get('args')[0] === 'not.exist')
      )
        throw new Error(
          `No element found for testId: ${testId} with selector: ${selector} and type: ${type}`
        );
      return res;
    };
  }
);

/**
 * Cypress command: getButton
 * Gets a button by its text content. Supports chaining.
 * @description WARNING: Doesn't work from "within" due to Cypress limitations.
 */
Cypress.Commands.addQuery('getButton', function (text: string | RegExp, selector?: string) {
  const nextCommand: Cypress.Command = (this as any)['attributes'].next;

  return (subject) => {
    const currentSelector = selector ? `button${selector}` : 'button';
    const current = subject ? cy.$$(subject).find(currentSelector) : cy.$$(currentSelector);
    const res = current.filter((_, btn) =>
      text instanceof RegExp ? text.test(btn.textContent) : btn.textContent === text
    );

    if (
      res.length === 0 &&
      !(nextCommand.get('name') === 'should' && nextCommand.get('args')[0] === 'not.exist')
    )
      throw new Error(`No button found with text: ${text} and selector: ${selector}`);
    return res;
  };
});

/**
 * Cypress command: clickUntilStep
 * Navigates a multi-step character sheet by clicking previous/next until the target step is active.
 */
Cypress.Commands.add(
  'clickUntilStep',
  (step: string, type: 'previous' | 'next' = 'next', i = 1) => {
    cy.getByTestId(`${type}-step`).click();
    return cy.getByTestId('-section', { type: 'contains' }).then((el) => {
      const currentLabel = el.attr('data-testId')?.replace('-section', '') || '';
      const maxReached = i >= 6;

      if (maxReached && currentLabel !== step)
        expect(currentLabel).contains(step, 'Step not found in 6 clicks');
      return currentLabel === step || maxReached
        ? cy.wrap(el)
        : // @ts-ignore
          cy.clickUntilStep(step, type, i + 1);
    });
  }
);

/**
 * Cypress command: shouldBeSelected
 * Asserts that an element has aria-selected="true".
 */
Cypress.Commands.add('shouldBeSelected', { prevSubject: true }, (subject) => {
  cy.wrap(subject).should('have.attr', 'aria-selected', 'true');
  return cy.wrap(subject);
});

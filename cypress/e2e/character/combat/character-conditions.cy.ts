import { characters } from '../support/mocks/characterList';

describe('Character Conditions Management End-to-End', () => {
  const characterData = characters.find(({ name }) => name === 'Delfy')!;
  const conditionsChar = {
    ...characterData,
    id: 'conditions-test-char',
    conditions: [] as NonNullable<(typeof characterData)['conditions']>
  };

  beforeEach(() => {
    cy.createTestCharacter(Cypress.testUser.uid, conditionsChar.id, conditionsChar);
    cy.login(Cypress.testUser.uid);
  });

  afterEach(() => cy.callFirestore('delete', `users/${Cypress.testUser.uid}/characters`));

  it('should complete full conditions management workflow with validation and error handling', () => {
    cy.visit('/');
    cy.getByTestId(`character-card-${conditionsChar.id}`).click();
    cy.getByTestId('stats-section').should('be.visible');
    cy.getByTestId(`condition-chip-`).should('not.exist');

    // Test: Cancel closes dialog without saving changes
    cy.getByTestId(`conditions-${conditionsChar.id}`).should('be.visible').click();
    cy.getByRole('dialog', 'Conditions').within(($dialog) => {
      cy.getByRole('tab', 'Add').shouldBeSelected();
      cy.getByRole('tab', 'Active (0)').should('be.disabled');
      cy.wrap($dialog).getButton('Cancel').click();
    });
    cy.getByRole('dialog', 'Conditions').should('not.exist');
    cy.getByTestId(`condition-chip-`).should('not.exist');

    // Test: Search filtering
    cy.getByTestId(`conditions-${conditionsChar.id}`).click();
    cy.getByRole('dialog', 'Conditions').within(($dialog) => {
      cy.getByTestId('condition-card-').should('have.length.above', 1);
      cy.get('#condition-search').type('blinded');
      cy.getByTestId('condition-card-').should('have.length', 1);

      cy.getByTestId('condition-card-blinded').click();
      cy.get('#condition-search').clear();
      cy.getByTestId('condition-card-').should('have.length.above', 1);

      // Test: Selected card gets aria-selected="true"
      cy.getByTestId('condition-card-charmed').click();
      cy.getByTestId('condition-card-charmed').should('have.attr', 'aria-selected', 'true');

      // Test: Exhaustion increments level on each click; label shows current level
      cy.wrap(Array.from({ length: 6 })).each((_, i) => {
        cy.getByTestId('condition-card-exhaustion').click();
        cy.getByTestId('condition-label-exhaustion').should('contain.text', i + 1);
        cy.getByTestId('condition-card-exhaustion').should('have.attr', 'aria-selected', 'true');
      });

      // Test: Clicking past max level (6) removes the condition
      cy.getByTestId('condition-card-exhaustion').click();
      cy.getByTestId('condition-card-exhaustion').should('not.have.attr', 'aria-selected', 'true');

      cy.getByTestId('condition-card-exhaustion').click();
      cy.getByTestId('condition-card-exhaustion').click();
      cy.getByTestId('condition-card-exhaustion').click();

      cy.wrap($dialog).getButton('Save').click();
    });
    cy.getByRole('dialog', 'Conditions').should('not.exist');
    cy.getByRole('status', 'Conditions Updated').should('be.visible');

    // Test: All condition chips appear in the stats section
    cy.getByTestId('stats-section')
      .getByTestId(`condition-chip-`)
      .should('have.length', 3)
      .and('contain.text', 'Blinded')
      .and('contain.text', 'Charmed')
      .and('contain.text', 'Exhaustion (3)');

    // Test: Re-open - Active tab is now enabled and shows all conditions
    cy.getByTestId(`conditions-${conditionsChar.id}`).click();
    cy.getByRole('dialog', 'Conditions').within(($dialog) => {
      cy.getByRole('tab', 'Active (3)').shouldBeSelected();
      cy.wrap($dialog)
        .should('contain.text', 'Blinded')
        .and('contain.text', 'Charmed')
        .and('contain.text', 'Exhaustion');

      // Test: Switching to Add tab shows active conditions as disabled
      cy.getByRole('tab', 'Add').click();
      cy.getByTestId('condition-card-blinded').should('be.disabled');
      cy.getByTestId('condition-card-charmed').should('be.disabled');
      cy.getByTestId('condition-card-exhaustion').should('be.disabled');
      cy.getByRole('tab', 'Active (3)').click();

      // Test: Exhaustion level can be adjusted via NumberInput
      cy.get('#condition-level-exhaustion').should('have.value', '3');
      cy.get('#condition-level-exhaustion').clear().type('5').blur();
      cy.get('#condition-level-exhaustion').should('have.value', '5');

      cy.getByTestId('condition-remove-exhaustion').click();
      cy.get('#condition-level-exhaustion').should('be.disabled');
      cy.getByTestId('condition-remove-exhaustion').click();
      cy.get('#condition-level-exhaustion').should('not.be.disabled');

      // Test: Pending removal - mark Charmed for removal, then undo
      cy.getByTestId('condition-remove-charmed').click();
      cy.wrap($dialog)
        .getByTestId('condition-chip-charmed')
        .contains('Charmed')
        .should('have.css', 'text-decoration-line', 'line-through');
      cy.getByTestId('condition-remove-charmed').click();
      cy.wrap($dialog)
        .getByTestId('condition-chip-charmed')
        .contains('Charmed')
        .should('not.have.css', 'text-decoration-line', 'line-through');

      // Test: Mark Charmed for removal and save
      cy.getByTestId('condition-remove-charmed').click();
      cy.wrap($dialog).getButton('Save').click();
    });
    cy.getByRole('dialog', 'Conditions').should('not.exist');
    cy.getByRole('status', 'Conditions Updated').should('be.visible');

    // Test: Charmed removed; Blinded and updated Exhaustion (5) remain
    cy.getByTestId('stats-section')
      .getByTestId(`condition-chip-`)
      .should('have.length', 2)
      .and('contain.text', 'Blinded')
      .and('not.contain.text', 'Charmed')
      .and('contain.text', 'Exhaustion')
      .and('contain.text', '(5)');

    // Test: Active tab count updates after save
    cy.getByTestId(`conditions-${conditionsChar.id}`).click();
    cy.getByRole('dialog', 'Conditions').within(($dialog) => {
      cy.getByRole('tab', 'Active (2)').shouldBeSelected();
      cy.wrap($dialog).getButton('Cancel').click();
    });
  });
});

import { characters } from 'cypress/support/mocks/characterList';

describe('Character Money Management End-to-End', () => {
  const characterData = characters.find(({ name }) => name === 'Delfy')!;
  const characterWithMoney = {
    ...characterData,
    id: 'money-test-char',
    money: { gp: 10, sp: 5, cp: 3 }
  };

  beforeEach(() => {
    cy.createTestCharacter(Cypress.testUser.uid, characterWithMoney.id, characterWithMoney);
    cy.login(Cypress.testUser.uid);
  });

  afterEach(() =>
    cy.callFirestore('delete', `users/${Cypress.testUser.uid}/characters/${characterWithMoney.id}`)
  );

  it('should complete full money management workflow with validation and error handling', () => {
    cy.visit('/');
    cy.getByTestId(`character-card-${characterWithMoney.id}`).click();
    cy.getByTestId('character-container').should('be.visible');
    cy.getByTestId('next-step').click();
    cy.getByTestId('next-step').click();
    cy.getByTestId('equipment-section').should('be.visible');

    // Test: Verify initial money display in equipment section
    cy.getByTestId('inventory-money')
      .should('be.visible')
      .within(($purse) => {
        cy.wrap($purse).getByTestId('gp').should('contain.text', '10');
        cy.wrap($purse).getByTestId('sp').should('contain.text', '5');
        cy.wrap($purse).getByTestId('cp').should('contain.text', '3');
      });

    // Test: Verify initial money management dialog and cancel
    cy.getByTestId(`coin-purse-${characterWithMoney.id}`).should('be.visible').click();
    cy.getByRole('dialog').should('be.visible').and('contain.text', 'Manage Money');
    cy.getByRole('dialog').within(($dialog) => {
      cy.get('#money-units-gp').should('have.value', '0').and('be.visible');
      cy.get('#money-units-sp').should('have.value', '0').and('be.visible');
      cy.get('#money-units-cp').should('have.value', '0').and('be.visible');

      cy.wrap($dialog).getByTestId('gp').should('contain.text', '10');
      cy.wrap($dialog).getByTestId('sp').should('contain.text', '5');
      cy.wrap($dialog).getByTestId('cp').should('contain.text', '3');

      cy.getButton('Save').should('be.disabled');
      cy.getButton('Cancel').should('be.enabled');

      cy.get('#money-units-gp').clear().type('5').blur();
      cy.wrap($dialog).getByTestId('gp').should('contain.text', '15');
      cy.wrap($dialog).getByTestId('sp').should('contain.text', '5');
      cy.wrap($dialog).getByTestId('cp').should('contain.text', '3');

      cy.getButton('Save').should('be.enabled');
      cy.getButton('Cancel').click();
    });
    cy.getByRole('dialog').should('not.exist');

    // Test: Verify original balance
    cy.getByTestId('inventory-money')
      .should('be.visible')
      .within(($purse) => {
        cy.wrap($purse).getByTestId('gp').should('contain.text', '10');
        cy.wrap($purse).getByTestId('sp').should('contain.text', '5');
        cy.wrap($purse).getByTestId('cp').should('contain.text', '3');
      });

    cy.getByTestId(`coin-purse-${characterWithMoney.id}`).click();
    cy.getByRole('dialog').within(($dialog) => {
      cy.get('#money-units-gp').should('have.value', '0').and('be.visible');
      cy.get('#money-units-sp').should('have.value', '0').and('be.visible');
      cy.get('#money-units-cp').should('have.value', '0').and('be.visible');

      cy.wrap($dialog).getByTestId('gp').should('contain.text', '10');
      cy.wrap($dialog).getByTestId('sp').should('contain.text', '5');
      cy.wrap($dialog).getByTestId('cp').should('contain.text', '3');
    });

    // Test: Verify adding coins with consolidation and save
    cy.getByRole('dialog').within(($dialog) => {
      // Test: Verify consolidation in preview: 1053 + 100 = 1153 copper = 11gp 5sp 3cp
      cy.get('#money-units-cp').clear().type('100').blur();
      cy.wrap($dialog).getByTestId('gp').should('contain.text', '11');
      cy.wrap($dialog).getByTestId('sp').should('contain.text', '5');
      cy.wrap($dialog).getByTestId('cp').should('contain.text', '3');

      // Test: Verify further consolidation: 11gp 10sp 3cp = 12gp 0sp 3cp
      cy.get('#money-units-sp').clear().type('5').blur();
      cy.wrap($dialog).getByTestId('gp').should('contain.text', '12');
      cy.wrap($dialog).getByTestId('sp').should('contain.text', '0');
      cy.wrap($dialog).getByTestId('cp').should('contain.text', '3');

      cy.getButton('Save').should('be.enabled').click();
    });
    cy.getByRole('status', 'Money Updated').should('be.visible');
    cy.getByRole('dialog').should('not.exist');

    cy.getByTestId('inventory-money')
      .should('be.visible')
      .within(($purse) => {
        cy.wrap($purse).getByTestId('gp').should('contain.text', '12');
        cy.wrap($purse).getByTestId('sp').should('contain.text', '0');
        cy.wrap($purse).getByTestId('cp').should('contain.text', '3');
      });

    // Test: Remove coins (negative values) and save
    cy.getByTestId(`coin-purse-${characterWithMoney.id}`).click();
    cy.getByRole('dialog').within(($dialog) => {
      cy.get('#money-units-gp').should('have.value', '0').and('be.visible');
      cy.get('#money-units-sp').should('have.value', '0').and('be.visible');
      cy.get('#money-units-cp').should('have.value', '0').and('be.visible');

      cy.wrap($dialog).getByTestId('gp').should('contain.text', '12');
      cy.wrap($dialog).getByTestId('sp').should('contain.text', '0');
      cy.wrap($dialog).getByTestId('cp').should('contain.text', '3');

      cy.get('#money-units-gp').clear().type('-5').blur();

      cy.wrap($dialog).getByTestId('gp').should('contain.text', '7');
      cy.wrap($dialog).getByTestId('sp').should('contain.text', '0');
      cy.wrap($dialog).getByTestId('cp').should('contain.text', '3');

      cy.getButton('Save').should('be.enabled').click();
    });
    cy.getByRole('status', 'Money Updated').should('be.visible');
    cy.getByRole('dialog').should('not.exist');

    cy.getByTestId('inventory-money')
      .should('be.visible')
      .within(($purse) => {
        cy.wrap($purse).getByTestId('gp').should('contain.text', '7');
        cy.wrap($purse).getByTestId('sp').should('contain.text', '0');
        cy.wrap($purse).getByTestId('cp').should('contain.text', '3');
      });

    // Test: Validation - Cannot go below zero
    cy.getByTestId(`coin-purse-${characterWithMoney.id}`).click();
    cy.getByRole('dialog').within(($dialog) => {
      cy.get('#money-units-gp').clear().type('-10').blur(); // -1000 copper

      cy.wrap($dialog).getByTestId('gp').should('contain.text', '-2');
      cy.wrap($dialog).getByTestId('sp').should('contain.text', '-9');
      cy.wrap($dialog).getByTestId('cp').should('contain.text', '-7');

      cy.getButton('Save').should('be.disabled');

      cy.get('#money-units-gp').clear().type('-7').blur();

      cy.wrap($dialog).getByTestId('gp').should('contain.text', '0');
      cy.wrap($dialog).getByTestId('sp').should('contain.text', '0');
      cy.wrap($dialog).getByTestId('cp').should('contain.text', '3');

      cy.getButton('Save').should('be.enabled').click();
    });
    cy.getByRole('status', 'Money Updated').should('be.visible');
    cy.getByRole('dialog').should('not.exist');

    cy.getByTestId('inventory-money')
      .should('be.visible')
      .within(($purse) => {
        cy.wrap($purse).getByTestId('gp').should('contain.text', '0');
        cy.wrap($purse).getByTestId('sp').should('contain.text', '0');
        cy.wrap($purse).getByTestId('cp').should('contain.text', '3');
      });

    // Test: Add money starting from zero
    cy.getByTestId(`coin-purse-${characterWithMoney.id}`).click();
    cy.getByRole('dialog').within(($dialog) => {
      cy.wrap($dialog).getByTestId('gp').should('contain.text', '0');
      cy.wrap($dialog).getByTestId('sp').should('contain.text', '0');
      cy.wrap($dialog).getByTestId('cp').should('contain.text', '3');

      // Test: Add mixed denominations
      cy.get('#money-units-gp').clear().type('50');
      cy.get('#money-units-sp').clear().type('25');
      cy.get('#money-units-cp').clear().type('17').blur();

      // Test: Verify consolidation: 3 + 17 = 20cp, 25sp = 2gp 5sp, total = 52gp 5sp 0cp (5000 + 250 + 20 = 5270 copper)
      cy.wrap($dialog).getByTestId('gp').should('contain.text', '52');
      cy.wrap($dialog).getByTestId('sp').should('contain.text', '7');
      cy.wrap($dialog).getByTestId('cp').should('contain.text', '0');

      cy.getButton('Save').should('be.enabled').click();
    });
    cy.getByRole('status', 'Money Updated').should('be.visible');
    cy.getByRole('dialog').should('not.exist');

    cy.getByTestId('inventory-money')
      .should('be.visible')
      .within(($purse) => {
        cy.wrap($purse).getByTestId('gp').should('contain.text', '52');
        cy.wrap($purse).getByTestId('sp').should('contain.text', '7');
        cy.wrap($purse).getByTestId('cp').should('contain.text', '0');
      });

    // Test: Complex scenario - mixed positive and negative adjustments
    cy.getByTestId(`coin-purse-${characterWithMoney.id}`).click();
    cy.getByRole('dialog').within(($dialog) => {
      cy.wrap($dialog).getByTestId('gp').should('contain.text', '52');
      cy.wrap($dialog).getByTestId('sp').should('contain.text', '7');
      cy.wrap($dialog).getByTestId('cp').should('contain.text', '0');

      cy.get('#money-units-gp').clear().type('10');
      cy.get('#money-units-sp').clear().type('-15');
      cy.get('#money-units-cp').clear().type('5').blur();

      // Test: 5270 + 1000 - 150 + 5 = 6125 copper = 61gp 2sp 5cp
      cy.wrap($dialog).getByTestId('gp').should('contain.text', '61');
      cy.wrap($dialog).getByTestId('sp').should('contain.text', '2');
      cy.wrap($dialog).getByTestId('cp').should('contain.text', '5');

      cy.getButton('Save').should('be.enabled').click();
    });
    cy.getByRole('status', 'Money Updated').should('be.visible');
    cy.getByRole('dialog').should('not.exist');

    cy.getByTestId('inventory-money')
      .should('be.visible')
      .within(($purse) => {
        cy.wrap($purse).getByTestId('gp').should('contain.text', '61');
        cy.wrap($purse).getByTestId('sp').should('contain.text', '2');
        cy.wrap($purse).getByTestId('cp').should('contain.text', '5');
      });

    // Test: Escape key closes dialog without saving
    cy.getByTestId(`coin-purse-${characterWithMoney.id}`).click();
    cy.getByRole('dialog').within(($dialog) => {
      cy.get('#money-units-gp').clear().type('100').blur();
      cy.wrap($dialog).getByTestId('gp').should('contain.text', '161'); // Would be 161 if saved
    });
    cy.getByRole('dialog').click();
    cy.press('Escape');
    cy.getByRole('dialog').should('not.exist');

    cy.getByTestId('inventory-money')
      .should('be.visible')
      .within(($purse) => {
        cy.wrap($purse).getByTestId('gp').should('contain.text', '61');
        cy.wrap($purse).getByTestId('sp').should('contain.text', '2');
        cy.wrap($purse).getByTestId('cp').should('contain.text', '5');
      });

    // Test: Navigate back to home and verify persistence
    cy.visit('/');
    cy.reload();

    cy.getByTestId(`character-card-${characterWithMoney.id}`).should('be.visible');
    cy.getByTestId(`character-card-${characterWithMoney.id}`).click();
    cy.getByTestId('next-step').click();
    cy.getByTestId('next-step').click();

    cy.getByTestId('inventory-money')
      .should('be.visible')
      .within(($purse) => {
        cy.wrap($purse).getByTestId('gp').should('contain.text', '61');
        cy.wrap($purse).getByTestId('sp').should('contain.text', '2');
        cy.wrap($purse).getByTestId('cp').should('contain.text', '5');
      });

    cy.getByTestId(`coin-purse-${characterWithMoney.id}`).click();
    cy.getByRole('dialog').within(($dialog) => {
      cy.wrap($dialog).getByTestId('gp').should('contain.text', '61');
      cy.wrap($dialog).getByTestId('sp').should('contain.text', '2');
      cy.wrap($dialog).getByTestId('cp').should('contain.text', '5');

      // Test: No changes means save is disabled
      cy.getButton('Save').should('be.disabled');
      cy.get('#money-units-gp').clear().type('5').blur();
      cy.getButton('Save').should('be.enabled');
      cy.get('#money-units-gp').clear().type('0').blur();
      cy.getButton('Save').should('be.disabled');

      cy.getButton('Cancel').click();
    });
    cy.getByRole('dialog').should('not.exist');

    // Test: Verify all coin icons are visible and correctly colored
    cy.getByTestId('inventory-money')
      .should('be.visible')
      .within(($purse) => {
        cy.wrap($purse).getByTestId('gp').find('svg').should('have.attr', 'fill', 'goldenrod');
        cy.wrap($purse).getByTestId('sp').find('svg').should('have.attr', 'fill', 'silver');
        cy.wrap($purse).getByTestId('cp').find('svg').should('have.attr', 'fill', '#B87333');
      });

    cy.getByTestId(`coin-purse-${characterWithMoney.id}`).click();
    cy.getByRole('dialog').within(($dialog) => {
      cy.wrap($dialog).getByTestId('gp').find('svg').should('have.attr', 'fill', 'goldenrod');
      cy.wrap($dialog).getByTestId('sp').find('svg').should('have.attr', 'fill', 'silver');
      cy.wrap($dialog).getByTestId('cp').find('svg').should('have.attr', 'fill', '#B87333');
    });
  });
});

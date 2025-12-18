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
    cy.getByTestId('money-display')
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
    cy.getByTestId('money-display')
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

    cy.getByTestId('money-display')
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

    cy.getByTestId('money-display')
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

    cy.getByTestId('money-display')
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

      // Test: Verify consolidation: 3 + 5267 = 5270 copper = 52gp 7sp 0cp
      cy.wrap($dialog).getByTestId('gp').should('contain.text', '52');
      cy.wrap($dialog).getByTestId('sp').should('contain.text', '7');
      cy.wrap($dialog).getByTestId('cp').should('contain.text', '0');

      cy.getButton('Save').should('be.enabled').click();
    });
    cy.getByRole('status', 'Money Updated').should('be.visible');
    cy.getByRole('dialog').should('not.exist');

    cy.getByTestId('money-display')
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

    cy.getByTestId('money-display')
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

    cy.getByTestId('money-display')
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

    cy.getByTestId('money-display')
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
    cy.getByTestId('money-display')
      .should('be.visible')
      .within(($purse) => {
        cy.wrap($purse).getByTestId('gp').find('svg').should('have.attr', 'fill', 'goldenrod');
        cy.wrap($purse).getByTestId('sp').find('svg').should('have.attr', 'fill', '#91a1b2');
        cy.wrap($purse).getByTestId('cp').find('svg').should('have.attr', 'fill', '#B87333');
      });

    cy.getByTestId(`coin-purse-${characterWithMoney.id}`).click();
    cy.getByRole('dialog').within(($dialog) => {
      cy.wrap($dialog).getByTestId('gp').find('svg').should('have.attr', 'fill', 'goldenrod');
      cy.wrap($dialog).getByTestId('sp').find('svg').should('have.attr', 'fill', '#91a1b2');
      cy.wrap($dialog).getByTestId('cp').find('svg').should('have.attr', 'fill', '#B87333');
    });
  });

  it('should handle additional currencies workflow with settings configuration and consolidation', () => {
    const characterWithAdditionalCurrency = {
      ...characterData,
      id: 'money-additional-test-char',
      money: { pp: 2, gp: 5, ep: 3, sp: 4, cp: 7 }
    };

    const updateAdditionalCurrenciesAndReload = (currencies: string[]) => {
      cy.callFirestore('update', `users/${Cypress.testUser.uid}`, {
        additionalCurrencies: currencies
      });
      cy.reload();
      cy.waitForLoading();
      cy.getByTestId('character-container').should('be.visible');
      cy.getByTestId('next-step').click();
      cy.getByTestId('next-step').click();
      cy.getByTestId('equipment-section').should('be.visible');
    };

    // Test: Setup & Navigation - Enable both additional currencies in user settings
    cy.createTestCharacter(
      Cypress.testUser.uid,
      characterWithAdditionalCurrency.id,
      characterWithAdditionalCurrency
    );
    cy.login(Cypress.testUser.uid);
    cy.getByTestId(`character-card-${characterWithAdditionalCurrency.id}`).click();
    updateAdditionalCurrenciesAndReload(['pp', 'ep']);

    // Test: Verify initial display with both currencies enabled
    // Character data: pp: 2, gp: 5, ep: 3, sp: 4, cp: 7 = 2697 copper
    // Consolidated with PP and EP enabled: 2pp 6gp 1ep 4sp 7cp
    cy.getByTestId('money-display')
      .should('be.visible')
      .within(($purse) => {
        cy.wrap($purse).getByTestId('pp').should('be.visible').and('contain.text', '2');
        cy.wrap($purse).getByTestId('gp').should('be.visible').and('contain.text', '6');
        cy.wrap($purse).getByTestId('ep').should('be.visible').and('contain.text', '1');
        cy.wrap($purse).getByTestId('sp').should('be.visible').and('contain.text', '4');
        cy.wrap($purse).getByTestId('cp').should('be.visible').and('contain.text', '7');
      });

    // Test: Verify additional currency colors
    cy.getByTestId('money-display').within(($purse) => {
      cy.wrap($purse).getByTestId('pp').find('svg').should('have.attr', 'fill', '#D3D9DE');
      cy.wrap($purse).getByTestId('ep').find('svg').should('have.attr', 'fill', '#B8A865');
    });

    // Test: Verify PP and EP input fields are present in dialog when both are enabled
    cy.getByTestId(`coin-purse-${characterWithAdditionalCurrency.id}`).click();
    cy.getByRole('dialog').within(($dialog) => {
      cy.get('#money-units-pp').should('be.visible');
      cy.get('#money-units-ep').should('be.visible');
      cy.get('#money-units-gp').should('be.visible');
      cy.get('#money-units-sp').should('be.visible');
      cy.get('#money-units-cp').should('be.visible');
      cy.getButton('Cancel').click();
    });
    cy.getByRole('dialog').should('not.exist');

    // Test: Settings Control - Disable all additional currencies
    updateAdditionalCurrenciesAndReload([]);

    // Test: PP and EP should not be visible when disabled in settings (even though they have values)
    // Money should be consolidated without PP/EP: 2697 copper = 26gp 9sp 7cp
    cy.getByTestId('money-display')
      .should('be.visible')
      .within(($purse) => {
        cy.wrap($purse).getByTestId('pp').should('not.exist');
        cy.wrap($purse).getByTestId('ep').should('not.exist');
        cy.wrap($purse).getByTestId('gp').should('be.visible').and('contain.text', '26');
        cy.wrap($purse).getByTestId('sp').should('be.visible').and('contain.text', '9');
        cy.wrap($purse).getByTestId('cp').should('be.visible').and('contain.text', '7');
      });

    // Test: Settings Control - Enable only platinum
    updateAdditionalCurrenciesAndReload(['pp']);

    // Test: Only PP should be visible, EP should be hidden
    // Money should be consolidated with PP but not EP: 2697 copper = 2pp 6gp 9sp 7cp
    cy.getByTestId('money-display')
      .should('be.visible')
      .within(($purse) => {
        cy.wrap($purse).getByTestId('pp').should('be.visible').and('contain.text', '2');
        cy.wrap($purse).getByTestId('gp').should('be.visible').and('contain.text', '6');
        cy.wrap($purse).getByTestId('ep').should('not.exist');
        cy.wrap($purse).getByTestId('sp').should('be.visible').and('contain.text', '9');
        cy.wrap($purse).getByTestId('cp').should('be.visible').and('contain.text', '7');
      });

    // Test: Verify only PP input field is present in dialog
    cy.getByTestId(`coin-purse-${characterWithAdditionalCurrency.id}`).click();
    cy.getByRole('dialog').within(($dialog) => {
      cy.get('#money-units-pp').should('be.visible');
      cy.get('#money-units-ep').should('not.exist');
      cy.get('#money-units-gp').should('be.visible');
      cy.getButton('Cancel').click();
    });
    cy.getByRole('dialog').should('not.exist');

    // Test: Settings Control - Enable only electrum
    updateAdditionalCurrenciesAndReload(['ep']);

    // Test: Only EP should be visible, PP should be hidden
    // Money should be consolidated with EP but not PP: 2697 copper = 26gp 1ep 4sp 7cp
    cy.getByTestId('money-display')
      .should('be.visible')
      .within(($purse) => {
        cy.wrap($purse).getByTestId('pp').should('not.exist');
        cy.wrap($purse).getByTestId('gp').should('be.visible').and('contain.text', '26');
        cy.wrap($purse).getByTestId('ep').should('be.visible').and('contain.text', '1');
        cy.wrap($purse).getByTestId('sp').should('be.visible').and('contain.text', '4');
        cy.wrap($purse).getByTestId('cp').should('be.visible').and('contain.text', '7');
      });

    // Test: Verify only EP input field is present and test electrum-specific consolidation
    cy.getByTestId(`coin-purse-${characterWithAdditionalCurrency.id}`).click();
    cy.getByRole('dialog').within(($dialog) => {
      cy.get('#money-units-pp').should('not.exist');
      cy.get('#money-units-ep').should('be.visible');
      cy.get('#money-units-gp').should('be.visible');

      // Test: Add 50 copper (not enough to create an electrum): 2697 + 50 = 2747 copper = 27gp 0ep 4sp 7cp
      cy.get('#money-units-cp').clear().type('50').blur();

      cy.wrap($dialog).getByTestId('gp').should('contain.text', '27');
      cy.wrap($dialog).getByTestId('ep').should('contain.text', '0');
      cy.wrap($dialog).getByTestId('sp').should('contain.text', '4');
      cy.wrap($dialog).getByTestId('cp').should('contain.text', '7');

      cy.getButton('Cancel').click();
    });
    cy.getByRole('dialog').should('not.exist');

    // Test: Re-enable both currencies for consolidation testing
    updateAdditionalCurrenciesAndReload(['pp', 'ep']);

    // Test: Verify display after re-enabling both currencies
    cy.getByTestId('money-display')
      .should('be.visible')
      .within(($purse) => {
        cy.wrap($purse).getByTestId('pp').should('be.visible').and('contain.text', '2');
        cy.wrap($purse).getByTestId('gp').should('be.visible').and('contain.text', '6');
        cy.wrap($purse).getByTestId('ep').should('be.visible').and('contain.text', '1');
        cy.wrap($purse).getByTestId('sp').should('be.visible').and('contain.text', '4');
        cy.wrap($purse).getByTestId('cp').should('be.visible').and('contain.text', '7');
      });

    // Test: Platinum Consolidation - Add platinum directly then consolidate with copper
    cy.getByTestId(`coin-purse-${characterWithAdditionalCurrency.id}`).click();
    cy.getByRole('dialog').within(($dialog) => {
      // Verify current display in dialog
      cy.wrap($dialog).getByTestId('pp').should('contain.text', '2');
      cy.wrap($dialog).getByTestId('gp').should('contain.text', '6');
      cy.wrap($dialog).getByTestId('ep').should('contain.text', '1');
      cy.wrap($dialog).getByTestId('sp').should('contain.text', '4');
      cy.wrap($dialog).getByTestId('cp').should('contain.text', '7');

      // Test: First add 3pp directly: 2697 + 3000 = 5697 copper = 5pp 6gp 1ep 4sp 7cp
      cy.get('#money-units-pp').clear().type('3').blur();
      cy.wrap($dialog).getByTestId('pp').should('contain.text', '5');
      cy.wrap($dialog).getByTestId('gp').should('contain.text', '6');
      cy.wrap($dialog).getByTestId('ep').should('contain.text', '1');

      // Current: 5pp + 6gp + 1ep + 4sp + 7cp = 5697 copper
      // Now add 2303 copper to reach 8000 total = 8pp
      cy.get('#money-units-cp').clear().type('2303').blur();

      cy.wrap($dialog).getByTestId('pp').should('contain.text', '8');
      cy.wrap($dialog).getByTestId('gp').should('contain.text', '0');
      cy.wrap($dialog).getByTestId('ep').should('contain.text', '0');
      cy.wrap($dialog).getByTestId('sp').should('contain.text', '0');
      cy.wrap($dialog).getByTestId('cp').should('contain.text', '0');

      cy.getButton('Save').should('be.enabled').click();
    });
    cy.getByRole('status', 'Money Updated').should('be.visible');
    cy.getByRole('dialog').should('not.exist');

    cy.getByTestId('money-display')
      .should('be.visible')
      .within(($purse) => {
        cy.wrap($purse).getByTestId('pp').should('contain.text', '8');
        cy.wrap($purse).getByTestId('gp').should('contain.text', '0');
        cy.wrap($purse).getByTestId('ep').should('contain.text', '0');
        cy.wrap($purse).getByTestId('sp').should('contain.text', '0');
        cy.wrap($purse).getByTestId('cp').should('contain.text', '0');
      });

    // Test: Mixed Denomination Consolidation - Add multiple currencies with complex consolidation
    cy.getByTestId(`coin-purse-${characterWithAdditionalCurrency.id}`).click();
    cy.getByRole('dialog').within(($dialog) => {
      // Current: 8pp + 0gp + 0ep + 0sp + 0cp = 8000 copper
      // Add: 10pp + 50gp + 20ep + 30sp + 100cp = 10000 + 5000 + 1000 + 300 + 100 = 16400
      // Total: 8000 + 16400 = 24400 copper = 24pp + 4gp + 0ep + 0sp + 0cp
      cy.get('#money-units-pp').clear().type('10');
      cy.get('#money-units-gp').clear().type('50');
      cy.get('#money-units-ep').clear().type('20');
      cy.get('#money-units-sp').clear().type('30');
      cy.get('#money-units-cp').clear().type('100').blur();

      cy.wrap($dialog).getByTestId('pp').should('contain.text', '24');
      cy.wrap($dialog).getByTestId('gp').should('contain.text', '4');
      cy.wrap($dialog).getByTestId('ep').should('contain.text', '0');
      cy.wrap($dialog).getByTestId('sp').should('contain.text', '0');
      cy.wrap($dialog).getByTestId('cp').should('contain.text', '0');

      cy.getButton('Save').should('be.enabled').click();
    });
    cy.getByRole('status', 'Money Updated').should('be.visible');
    cy.getByRole('dialog').should('not.exist');

    cy.getByTestId('money-display')
      .should('be.visible')
      .within(($purse) => {
        cy.wrap($purse).getByTestId('pp').should('contain.text', '24');
        cy.wrap($purse).getByTestId('gp').should('contain.text', '4');
        cy.wrap($purse).getByTestId('ep').should('contain.text', '0');
        cy.wrap($purse).getByTestId('sp').should('be.visible').and('contain.text', '0');
        cy.wrap($purse).getByTestId('cp').should('be.visible').and('contain.text', '0');
      });

    // Test: Negative Values - Remove platinum with consolidation
    cy.getByTestId(`coin-purse-${characterWithAdditionalCurrency.id}`).click();
    cy.getByRole('dialog').within(($dialog) => {
      // Current (after previous save): 24pp + 4gp + 0ep + 0sp + 0cp = 24400 copper
      // Remove 1pp: 24400 - 1000 = 23400 copper = 23pp + 4gp + 0ep + 0sp + 0cp
      cy.get('#money-units-pp').clear().type('-1').blur();

      cy.wrap($dialog).getByTestId('pp').should('contain.text', '23');
      cy.wrap($dialog).getByTestId('gp').should('contain.text', '4');
      cy.wrap($dialog).getByTestId('ep').should('contain.text', '0');
      cy.wrap($dialog).getByTestId('sp').should('contain.text', '0');
      cy.wrap($dialog).getByTestId('cp').should('contain.text', '0');

      cy.getButton('Save').should('be.enabled').click();
    });
    cy.getByRole('status', 'Money Updated').should('be.visible');
    cy.getByRole('dialog').should('not.exist');

    cy.getByTestId('money-display')
      .should('be.visible')
      .within(($purse) => {
        cy.wrap($purse).getByTestId('pp').should('contain.text', '23');
        cy.wrap($purse).getByTestId('gp').should('contain.text', '4');
        cy.wrap($purse).getByTestId('ep').should('contain.text', '0');
      });

    // Test: Cleanup - Remove test character
    cy.callFirestore(
      'delete',
      `users/${Cypress.testUser.uid}/characters/${characterWithAdditionalCurrency.id}`
    );
  });
});

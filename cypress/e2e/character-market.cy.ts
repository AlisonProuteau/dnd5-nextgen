import { characters } from '../support/mocks/characterList';

describe('Character Equipment Market & Management End-to-End', () => {
  const baseChar = characters.find(({ name }) => name === 'Willy')!;
  let characterWithEquipment: (typeof characters)[0] = {
    ...baseChar,
    id: 'equipment-test-char',
    money: { gp: 50, sp: 6, cp: 0 },
    abilityScores: {
      ...baseChar.abilityScores,
      dex: { ...baseChar.abilityScores.dex, score: 16, modifier: 3 }
    }
  };

  beforeEach(() => {
    cy.createTestCharacter(Cypress.testUser.uid, characterWithEquipment.id, characterWithEquipment);
    cy.login(Cypress.testUser.uid);
  });

  it('should complete equipment buying and selling workflow with validation and free mode', () => {
    cy.visit('/');
    cy.getByTestId(`character-card-${characterWithEquipment.id}`).click();
    cy.waitForLoading();
    cy.getByTestId('character-container').should('be.visible');
    cy.getByTestId('armor-class').should('contain.text', '14');
    cy.getByTestId('next-step').click();
    cy.getByTestId('next-step').click();
    cy.getByTestId('equipment-section').should('be.visible');

    // Test: Verify initial equipment display and money
    cy.getByTestId('money-display').within(($money) => {
      cy.wrap($money).getByTestId('gp').should('contain.text', '50');
      cy.wrap($money).getByTestId('sp').should('contain.text', '6');
      cy.wrap($money).getByTestId('cp').should('contain.text', '0');
    });

    cy.getByTestId('equipment-item-').should('have.length.greaterThan', 0);
    characterWithEquipment.equipments?.forEach(({ index }) =>
      cy.getByTestId(`equipment-item-${index}`).should('be.visible')
    );

    cy.getButton('Market').click();

    // Test: Verify Sell
    cy.getByRole('dialog', 'Market').within(($dialog) => {
      cy.getByRole('tab', 'Sell').shouldBeSelected();
      cy.wrap($dialog).getByTestId('money-display').should('be.visible');
      characterWithEquipment.equipments?.forEach(({ index, name }) => {
        cy.wrap($dialog).getByTestId(`market-sell-${index}`).scrollIntoView();
        cy.contains(name).should('be.visible');
        cy.wrap($dialog)
          .getByTestId(`market-sell-${index}`)
          .getByTestId(`equipment-item-${index}-info`)
          .click();
        cy.getByRole('dialog')
          .contains(new RegExp(`^${name}`))
          .should('be.visible');
        cy.press('Escape');
        cy.getByRole('dialog')
          .contains(new RegExp(`^${name}`))
          .should('not.exist');
      });

      // Test: Verify selling price is displayed and sell an item
      cy.wrap($dialog)
        .getByTestId('market-sell-crossbow-light')
        .within(($item) => {
          cy.wrap($item).getByTestId('gp').should('contain.text', '12');
          cy.wrap($item).getByTestId('sp').should('contain.text', '5');
          cy.wrap($item).getButton('Sell').click();
        });
      cy.getButton('Sell', ':not([role="tab"])').each(($item) =>
        cy.wrap($item).should('be.disabled')
      );
    });

    // Test: Verify successful sell transaction
    cy.getByRole('status', 'Transaction successful').should('be.visible');
    cy.getByRole('dialog', 'Market').within(($dialog) => {
      cy.wrap($dialog)
        .getByTestId('money-display')
        .first()
        .within(($money) => {
          cy.wrap($money).getByTestId('gp').should('contain.text', '63');
          cy.wrap($money).getByTestId('sp').should('contain.text', '1');
        });
      cy.getByTestId('market-sell-crossbow-light').should('not.exist');
    });

    // Test: Verify equipment updated in character sheet
    cy.press('Escape');
    cy.getByRole('dialog', 'Market').should('not.exist');
    cy.getByTestId('equipment-item-', {
      selector: ':not([data-testid$="-info"],[data-testid$="-equip"])'
    }).should('have.length', characterWithEquipment.equipments!.length - 1);
    cy.getByTestId('equipment-section-content').within(($section) => {
      cy.wrap($section).getByTestId('equipment-item-cross-light').should('not.exist');
    });

    // Test: Verify data persists after page reload
    cy.reload();
    cy.waitForLoading();
    cy.getByTestId('character-container').should('be.visible');
    cy.getByTestId('next-step').click();
    cy.getByTestId('next-step').click();
    cy.getByTestId('equipment-section').should('be.visible');

    cy.getByTestId('money-display').within(($money) => {
      cy.wrap($money).getByTestId('gp').should('contain.text', '63');
      cy.wrap($money).getByTestId('sp').should('contain.text', '1');
    });
    cy.getByTestId('equipment-item-crossbow-light').should('not.exist');

    cy.getButton('Market').click();
    cy.getByRole('tab', 'Buy').click();
    cy.getByRole('tab', 'Buy').shouldBeSelected();

    // Test: Verify Buy
    cy.getByRole('dialog', 'Market').within(($dialog) => {
      cy.selectOption('#equipmentCategory', 'Weapon');

      cy.contains('Select a category or search to see items').should('not.exist');
      cy.getByTestId('market-buy-')
        .its('length')
        .as('weaponCount', { type: 'static' })
        .should('be.greaterThan', 0);
      cy.getByTestId('market-buy-')
        .getByTestId('equipment-item-', { selector: ':not([data-testid$="-info"])' })
        .first()
        .within(($item) => {
          const itemName = $item.text().trim();
          cy.wrap($item).getByTestId(`-info`, { type: 'contains' }).click();
          cy.getByRole('dialog')
            .contains(new RegExp(`^${itemName}`))
            .should('be.visible');
          cy.press('Escape');
          cy.getByRole('dialog')
            .contains(new RegExp(`^${itemName}`))
            .should('not.exist');
        });

      // Test: Try to buy expensive item (should be disabled if insufficient funds)
      cy.selectOption('#equipmentCategory', 'Armor');
      cy.selectOption('#equipmentSubcategory', 'Heavy');
      cy.getByTestId('market-buy-')
        .getByTestId('equipment-item-', { selector: ':not([data-testid$="-info"])' })
        .first()
        .within(($item) => {
          const itemName = $item.text().trim();
          cy.wrap($item).getByTestId(`-info`, { type: 'contains' }).click();
          cy.getByRole('dialog')
            .contains(new RegExp(`^${itemName}`))
            .should('be.visible');
          cy.press('Escape');
          cy.getByRole('dialog')
            .contains(new RegExp(`^${itemName}`))
            .should('not.exist');
        });
      cy.get('#search').type('Plate');
      cy.getByTestId('market-buy-plate').within(($item) => {
        cy.wrap($item).getByTestId('gp').should('contain.text', '1500');
        cy.wrap($item).getButton('Buy').should('be.disabled');
      });
      cy.get('#search').clear();

      // Test: Search for non-existent item shows empty state
      cy.get('#search').type('ZzzNonExistentItem123');
      cy.getByTestId('market-sell-').should('not.exist');
      cy.wrap($dialog).should('contain.text', 'No items to buy');
      cy.get('#search').clear();

      // Test: Buy equipment with sufficient funds
      cy.selectOption('#equipmentCategory', 'Weapon');
      cy.get('#search').type('crossbow');
      cy.get('@weaponCount').then((weaponCount) =>
        cy.getByTestId('market-buy-').its('length').should('lessThan', weaponCount)
      );
      cy.getByTestId('market-buy-', { selector: ':contains("light")' }).within(($item) => {
        cy.wrap($item).getByTestId('gp').should('contain.text', '25');
        cy.wrap($item).getButton('Buy').click();
      });
      cy.getButton('Buy', ':not([role="tab"])').each(($item) =>
        cy.wrap($item).should('be.disabled')
      );
      cy.get('#search').clear();

      cy.contains('Select a category or search to see items').should('not.exist');
      cy.get('@weaponCount').then((weaponCount) =>
        cy.getByTestId('market-buy-').its('length').should('equal', weaponCount)
      );
    });

    // Test: Verify successful buy transaction
    cy.getByRole('status', 'Transaction successful').should('be.visible');
    cy.getByRole('dialog', 'Market').within(($dialog) => {
      cy.wrap($dialog)
        .getByTestId('money-display')
        .first()
        .getByTestId('gp')
        .invoke('text')
        .should('equal', '38');
      cy.wrap($dialog).getByRole('tab', 'Sell').click();
      cy.wrap($dialog).getByRole('tab', 'Sell').shouldBeSelected();
      cy.wrap($dialog)
        .getByTestId(`market-sell-crossbow-light`)
        .scrollIntoView()
        .should('be.visible');
    });

    // Test: Free mode buying and verify money doesn't change
    cy.getByRole('dialog', 'Market').within(($dialog) => {
      cy.wrap($dialog)
        .getByTestId('money-display')
        .first()
        .getByTestId('gp')
        .invoke('text')
        .as('moneyBeforeFreeMode', { type: 'static' });

      cy.getByRole('tab', 'Buy').click();
      cy.contains('Free Mode').parent().find('input[type="checkbox"]').click();
      cy.contains('Free Mode').parent().find('input[type="checkbox"]').should('be.checked');
      cy.selectOption('#equipmentCategory', 'Armor');
      cy.getByTestId('market-buy-')
        .its('length')
        .should('be.greaterThan', 0)
        .then((categoryResults) => {
          cy.selectOption('#equipmentSubcategory', 'Light');
          cy.getByTestId('market-buy-').and('have.length.below', categoryResults);

          cy.selectOption('#equipmentSubcategory', 'All');
          cy.getByTestId('market-buy-').should('have.length', categoryResults);

          cy.get('#search').type('sh');
          cy.getByTestId('market-buy-').should('have.length.below', categoryResults);
        });

      // Test: Search for shield
      cy.getByTestId('market-buy-')
        .should('have.length.above', 1)
        .each(($item) => cy.wrap($item.text()).should('match', /sh/i));
      cy.wrap($dialog)
        .getByTestId('market-buy-shield')
        .then(($item) => {
          cy.intercept(
            { method: 'POST', url: '**/google.firestore.v1.Firestore/**', times: 1 },
            { delay: 1000 }
          );
          cy.wrap($item).getButton('Add').click();
        });
      cy.getButton('Add').each(($item) => cy.wrap($item).should('be.disabled'));
    });

    // Test: Verify Add transaction and money unchanged
    cy.getByRole('status', 'Transaction successful').should('be.visible');
    cy.getByRole('dialog', 'Market').within(($dialog) => {
      cy.wrap($dialog).getByRole('tab', 'Sell').click();
      cy.wrap($dialog).getByTestId(`market-sell-shield`).scrollIntoView().should('be.visible');
      cy.get('@moneyBeforeFreeMode').then((moneyBeforeFreeMode) =>
        cy
          .wrap($dialog)
          .getByTestId('money-display')
          .first()
          .getByTestId('gp')
          .should('contain.text', moneyBeforeFreeMode)
      );
    });

    // Test: Verify equipment updated in character sheet
    cy.press('Escape');
    cy.getByRole('dialog', 'Market').should('not.exist');
    cy.getByTestId('equipment-item-', {
      selector: ':not([data-testid$="-info"],[data-testid$="-equip"])'
    }).should('have.length', characterWithEquipment.equipments!.length + 1);
    cy.getByTestId('equipment-section-content').within(($section) =>
      cy.wrap($section).getByTestId('equipment-item-shield').should('be.visible')
    );

    // Test: Equip the newly bought armor and verify AC update
    cy.getByTestId('equipment-item-shield-equip').should('contain.text', 'Equipped');
    cy.getByTestId('previous-step').click();
    cy.getByTestId('previous-step').click();
    cy.getByTestId('stats-section').should('be.visible');
    cy.getByTestId('armor-class').should('contain.text', '16');

    // Test: Verify data persists after page reload
    cy.reload();
    cy.waitForLoading();
    cy.getByTestId('character-container').should('be.visible');
    cy.getByTestId('next-step').click();
    cy.getByTestId('next-step').click();
    cy.getByTestId('equipment-section').should('be.visible');

    cy.get('@moneyBeforeFreeMode').then((moneyBeforeFreeMode) =>
      cy.getByTestId('money-display').getByTestId('gp').should('contain.text', moneyBeforeFreeMode)
    );
    cy.getByTestId('equipment-item-shield').should('be.visible');

    cy.getButton('Market').click();
    // Test: Free mode selling
    cy.getByRole('dialog', 'Market').within(($dialog) => {
      cy.contains('Free Mode').parent().find('input[type="checkbox"]').click();
      cy.contains('Free Mode').parent().find('input[type="checkbox"]').should('be.checked');
      cy.wrap($dialog).getByTestId(`market-sell-shield`).getButton('Remove').click();
      cy.getButton('Remove').each(($item) => cy.wrap($item).should('be.disabled'));
    });

    // Test: Verify Remove transaction and money still unchanged
    cy.getByRole('status', 'Transaction successful').should('be.visible');
    cy.getByRole('dialog', 'Market').within(($dialog) => {
      cy.wrap($dialog).getByTestId(`market-sell-shield`).should('not.exist');
      cy.get('@moneyBeforeFreeMode').then((moneyBeforeFreeMode) =>
        cy
          .wrap($dialog)
          .getByTestId('money-display')
          .first()
          .getByTestId('gp')
          .should('contain.text', moneyBeforeFreeMode)
      );
      cy.getByTestId('close-market').click();
    });
    cy.getByRole('dialog', 'Market').should('not.exist');

    //Test: Verify AC reverts after removing equipped armor
    cy.getByTestId('previous-step').click();
    cy.getByTestId('previous-step').click();
    cy.getByTestId('stats-section').should('be.visible');
    cy.getByTestId('armor-class').should('contain.text', '14');
  });

  it('should handle custom pricing for items without cost', () => {
    cy.visit('/');
    cy.getByTestId(`character-card-${characterWithEquipment.id}`).click();
    cy.waitForLoading();
    cy.getByTestId('character-container').should('be.visible');
    cy.getByTestId('next-step').click();
    cy.getByTestId('next-step').click();
    cy.getByTestId('equipment-section').should('be.visible');

    // Test: Open market and buy potion
    cy.getButton('Market').click();

    cy.getByRole('dialog', 'Market').within(($dialog) => {
      cy.getByRole('tab', 'Buy').click();
      cy.selectOption('#equipmentCategory', 'Magic Items');
      cy.selectOption('#equipmentSubcategory', 'Potion');

      // Test: Buy potion with custom pricing and validation
      cy.wrap($dialog)
        .getByTestId('market-buy-potion-of-healing-common')
        .within(($item) => {
          cy.wrap($item).scrollIntoView();
          cy.wrap($item).getButton('Buy').should('be.disabled');

          cy.wrap($item).get('#money-units-gp').should('be.visible');
          cy.wrap($item).get('#money-units-sp').should('be.visible');
          cy.wrap($item).get('#money-units-cp').should('be.visible');

          // Test: Quantity input validations and enablement
          cy.wrap($item).get('#money-units-gp').type('0');
          cy.wrap($item).getButton('Buy').should('be.disabled');
          cy.wrap($item).get('#money-units-gp').blur();
          cy.wrap($item).get('#money-units-gp').should('have.value', '0');
          cy.wrap($item).getButton('Buy').should('be.disabled');

          // Test: Non-numeric input should be prevented or cleared
          cy.wrap($item).get('#money-units-gp').clear().type('abc').blur();
          cy.wrap($item).get('#money-units-gp').should('not.have.value', 'abc');
          cy.wrap($item).getButton('Buy').should('be.disabled');

          // Test: Multiple currency
          cy.wrap($item).get('#money-units-gp').clear().type('5');
          cy.wrap($item).get('#money-units-sp').type('3').blur();
          cy.wrap($item).get('#money-units-cp').type('2').blur();
          cy.wrap($item).getButton('Buy').click();
        });
    });

    // Test: Verify successful buy transaction with multiple currencies
    cy.getByRole('status', 'Transaction successful').should('be.visible');
    cy.getByRole('dialog', 'Market').within(($dialog) => {
      cy.wrap($dialog)
        .getByTestId('money-display')
        .first()
        .within(($money) => {
          cy.wrap($money).getByTestId('gp').should('contain.text', '45');
          cy.wrap($money).getByTestId('sp').should('contain.text', '2');
          cy.wrap($money).getByTestId('cp').should('contain.text', '8');
        });
      cy.getByRole('tab', 'Sell').click();
      cy.wrap($dialog)
        .getByTestId('market-sell-potion-of-healing')
        .scrollIntoView()
        .should('be.visible');
    });

    // Test: Currency conversion edge case - buy another potion with sp that converts to gp
    cy.getByRole('dialog', 'Market').within(($dialog) => {
      cy.getByRole('tab', 'Buy').click();
      cy.selectOption('#equipmentCategory', 'Magic Items');
      cy.selectOption('#equipmentSubcategory', 'Potion');
      cy.wrap($dialog)
        .getByTestId('market-buy-potion-of-healing-common')
        .within(($item) => {
          cy.wrap($item).scrollIntoView();
          cy.wrap($item).get('#quantity-potion-of-healing-common').clear().type('2').blur();
          cy.wrap($item).get('#money-units-sp').clear().type('15').blur();
          cy.wrap($item).getButton('Buy').click();
        });
    });

    cy.getByRole('status', 'Transaction successful').should('be.visible');
    cy.getByRole('dialog', 'Market').within(($dialog) => {
      cy.wrap($dialog)
        .getByTestId('money-display')
        .first()
        .within(($money) => {
          cy.wrap($money).getByTestId('gp').should('contain.text', '42');
          cy.wrap($money).getByTestId('sp').should('contain.text', '2');
        });

      // Test: Selling all quantity removes item from inventory
      cy.getByRole('tab', 'Sell').click();
      cy.wrap($dialog)
        .getByTestId('market-sell-potion-of-healing')
        .within(($item) => {
          cy.wrap($item).scrollIntoView().should('contain.text', 'Quantity: 3');
          cy.wrap($item).get('#quantity-potion-of-healing-common').clear().type('3').blur();
          cy.wrap($item).get('#money-units-gp').type('10').blur();
          cy.wrap($item).getButton('Sell').click();
        });
    });

    cy.getByRole('status', 'Transaction successful').should('be.visible');
    cy.getByRole('dialog', 'Market').within(($dialog) => {
      cy.wrap($dialog).getByTestId('market-sell-potion-of-healing').should('not.exist');
      cy.wrap($dialog)
        .getByTestId('money-display')
        .first()
        .getByTestId('gp')
        .should('contain.text', '72');
    });
  });

  it('should handle equipment with quantity multipliers', () => {
    cy.visit('/');
    cy.getByTestId(`character-card-${characterWithEquipment.id}`).click();
    cy.waitForLoading();
    cy.getByTestId('character-container').should('be.visible');
    cy.getByTestId('next-step').click();
    cy.getByTestId('next-step').click();
    cy.getByTestId('equipment-section').should('be.visible');

    // Test: Open market and buy first pack of crossbow bolts
    cy.getByTestId(`equipment-item-crossbow-bolt`).should('contain.text', '20 Crossbow bolt');
    cy.getButton('Market').click();

    cy.getByRole('dialog', 'Market').within(($dialog) => {
      cy.getByRole('tab', 'Buy').click();
      cy.getByRole('tab', 'Buy').shouldBeSelected();
      cy.selectOption('#equipmentCategory', 'Adventuring Gear');
      cy.selectOption('#equipmentSubcategory', 'Ammunition');
      cy.wrap($dialog)
        .getByTestId('market-buy-crossbow-bolt')
        .within(($item) => {
          cy.wrap($item).scrollIntoView();
          cy.wrap($item).get('#quantity-crossbow-bolt').should('contain.value', '20');
          cy.wrap($item)
            .get('#quantity-crossbow-bolt')
            .clear()
            .type('50')
            .blur()
            .should('contain.value', '60');
          cy.wrap($item)
            .get('#quantity-crossbow-bolt')
            .clear()
            .type('1000')
            .blur()
            .should('contain.value', '980');
          cy.wrap($item).get('#quantity-crossbow-bolt-decrement').click();
          cy.wrap($item).get('#quantity-crossbow-bolt').should('contain.value', '960');
          cy.wrap($item).get('#quantity-crossbow-bolt').clear().type('20');
          cy.wrap($item).get('#quantity-crossbow-bolt-increment').click();
          cy.wrap($item).get('#quantity-crossbow-bolt').should('contain.value', '40');
          cy.wrap($item)
            .get('#quantity-crossbow-bolt')
            .clear()
            .type('0')
            .blur()
            .should('contain.value', '20');

          cy.wrap($item).get('#quantity-crossbow-bolt').clear().type('40').blur();
          cy.intercept(
            { method: 'POST', url: '**/google.firestore.v1.Firestore/**', times: 1 },
            { delay: 1000 }
          );
          cy.wrap($item).getButton('Buy').click();
          cy.wrap($item).getButton('Buy').should('be.disabled');

          // Test: Buy third pack of crossbow bolts
          cy.wrap($item).getButton('Buy').should('be.enabled');
          cy.wrap($item).get('#quantity-crossbow-bolt').should('contain.value', '20');
          cy.wrap($item).getButton('Buy').click();
        });
    });

    // Test: Verify successful buy transaction
    cy.getByRole('status', 'Transaction successful').should('have.length', 2);
    cy.press('Escape');
    cy.getByRole('dialog', 'Market').should('not.exist');
    cy.getByTestId(`equipment-item-crossbow-bolt`).should('contain.text', '80 Crossbow bolt');

    cy.getButton('Market').click();

    // Test: Sell partial quantity of crossbow bolts
    cy.getByRole('dialog', 'Market').within(($dialog) => {
      cy.getByRole('tab', 'Sell').click();
      cy.getByRole('tab', 'Sell').shouldBeSelected();

      cy.wrap($dialog)
        .getByTestId('market-sell-crossbow-bolt')
        .within(($item) => {
          cy.wrap($item).should('contain.text', 'Quantity: 80');
          cy.wrap($item).get('#quantity-crossbow-bolt').should('have.value', '20');
          cy.wrap($item)
            .get('#quantity-crossbow-bolt')
            .clear()
            .type('100')
            .blur()
            .should('have.value', '80');
          cy.wrap($item).get('#quantity-crossbow-bolt').clear().type('20');
          cy.wrap($item).get('#quantity-crossbow-bolt-increment').click();
          cy.wrap($item).get('#quantity-crossbow-bolt').should('have.value', '40');

          cy.wrap($item).getButton('Sell').click();
        });
    });

    // Test: Verify successful sell transaction
    cy.getByRole('status', 'Transaction successful').should('be.visible');
    cy.getByRole('dialog', 'Market')
      .getByTestId('market-sell-crossbow-bolt')
      .should('contain.text', 'Quantity: 40');
    cy.press('Escape');
    cy.getByRole('dialog', 'Market').should('not.exist');
    cy.getByTestId(`equipment-item-crossbow-bolt`).should('contain.text', '40 Crossbow bolt');
  });
});

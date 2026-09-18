import { characters } from '../../../support/mocks/characterList';

describe('Character Health Management', () => {
  const isMobile = Cypress.config('viewportWidth') === 375;
  const baseHealth = {
    hit_points: 10,
    health: {
      current: 10,
      temporary: 0,
      deathSaves: { successes: 0, failures: 0 }
    },
    resourceUsages: {}
  };

  context('Core HP workflow', () => {
    const tillyData = characters.find(({ name }) => name === 'Tilly')!;
    const healthTestCharId = `health-test-char-${isMobile ? 'mobile' : 'desktop'}`;

    before(() =>
      cy.seedCharacter(Cypress.testUser.uid, healthTestCharId, {
        ...tillyData,
        ...baseHealth,
        id: healthTestCharId
      })
    );

    beforeEach(() => {
      cy.callFirestore('update', `users/${Cypress.testUser.uid}/characters/${healthTestCharId}`, {
        ...baseHealth,
        conditions: []
      });
      cy.callFirestore(
        'delete',
        `users/${Cypress.testUser.uid}/characters/${healthTestCharId}/actionRecords`
      );
    });

    after(() => cy.callFirestore('delete', `users/${Cypress.testUser.uid}/characters`));

    it('should manage current HP, temporary HP, and death saves with input validation', () => {
      cy.visitAs(Cypress.testUser.uid, '/');
      cy.getByTestId(`character-card-${healthTestCharId}`).click();
      cy.getByTestId('character-container').should('be.visible');
      cy.getByTestId('hit-points').should('contain.text', '10');

      // Test: Setup & Initial State - Open, verify, test cancel and ESC
      cy.getByTestId(`health-${healthTestCharId}`).click();
      cy.getByRole('dialog', 'Manage Health').within(($dialog) => {
        cy.get('#temporaryHealth').should('have.value', '0').and('be.visible');
        cy.get('#currentHealth').should('have.value', '10').and('be.visible');
        cy.wrap($dialog).getButton('Save').should('be.enabled');
        cy.wrap($dialog).getButton('Cancel').click();
      });
      cy.getByRole('dialog', 'Manage Health').should('not.exist');

      // Test: ESC key also closes dialog without changes
      cy.getByTestId(`health-${healthTestCharId}`).click();
      cy.press('Escape');
      cy.getByRole('dialog', 'Manage Health').should('not.exist');

      // Test: Temporary Health
      cy.getByTestId(`health-${healthTestCharId}`).click();
      cy.getByRole('dialog', 'Manage Health').within(($dialog) => {
        cy.get('label[for="temporaryHealth"]').find('button').click();
        cy.getByRole('tooltip').should('contain.text', 'Grants a protective buffer');

        cy.get('#temporaryHealth').clear().type('-').blur().should('not.have.value', '-'); // Min 0
        cy.get('#temporaryHealth').clear().type('5').blur();
        cy.get('#currentHealth').should('be.disabled');
        cy.wrap($dialog).click();
        cy.press('Escape');
      });
      cy.getByRole('dialog', 'Unsaved Changes').getButton('Save').click();
      cy.getByRole('dialog', 'Unsaved Changes').should('not.exist');
      cy.getByRole('dialog', 'Manage Health').should('not.exist');
      cy.getByRole('status', 'Health Updated').should('be.visible');
      cy.getByTestId('hit-points').should('contain.text', '15');

      // Test: Full cycle with all states
      cy.getByTestId(`health-${healthTestCharId}`).click();
      cy.getByRole('dialog', 'Manage Health').within(($dialog) => {
        cy.get('#temporaryHealth').clear().type('0').blur();

        cy.get('#currentHealth').clear().type('15').blur();
        cy.get('#currentHealth').should('have.value', '10');

        cy.get('#currentHealth').clear().type('-').blur().should('not.have.value', '-');
        cy.get('#currentHealth').clear().type('0');

        cy.wrap($dialog).getButton('Save').click();
      });
      cy.getByRole('status', 'Health Updated').should('be.visible');
      cy.getByRole('dialog', 'Manage Health').should('not.exist');

      cy.getByTestId(`health-${healthTestCharId}`).should('be.visible').click();
      cy.getByRole('dialog', 'Manage Health')
        .should('contain.text', 'Your character is unconscious. Manage death saves below.')
        .within(($dialog) => {
          cy.get('#deathSaveSuccesses').should('be.visible').and('have.value', '0');
          cy.get('#deathSaveFailures').should('be.visible').and('have.value', '0');

          // Test: Fallen (3 failures)
          cy.get('#deathSaveFailures').clear().type('99').blur();
          cy.get('#deathSaveFailures').should('have.value', '3');
          cy.wrap($dialog).should('contain.text', 'Your character has fallen.');

          cy.get('#deathSaveFailures').clear().type('-').blur().should('not.have.value', '-');
          cy.get('#deathSaveFailures').clear().type('0');

          // Test: Stabilization (3 successes)
          cy.get('#deathSaveSuccesses').clear().type('-').blur().should('not.have.value', '-');
          cy.get('#deathSaveSuccesses').clear().type('10');
          cy.wrap($dialog).should(
            'contain.text',
            "Your character has stabilized but remains unconscious at death's door."
          );
          cy.get('#deathSaveSuccesses').should('not.exist');
          cy.get('#deathSaveFailures').should('not.exist');
          cy.wrap($dialog).getButton('Save').click();
        });
      cy.getByRole('status', 'Health Updated').should('be.visible');

      // Test: Death saves cleared when health restored or healed
      cy.getByTestId(`health-${healthTestCharId}`).click();
      cy.getByRole('dialog', 'Manage Health').within(($dialog) => {
        cy.get('#currentHealth').should('have.value', '0');
        cy.get('#temporaryHealth').should('have.value', '0');
        cy.wrap($dialog).should(
          'contain.text',
          "Your character has stabilized but remains unconscious at death's door."
        );
        cy.get('#deathSaveSuccesses').should('not.exist');
        cy.get('#deathSaveFailures').should('not.exist');

        cy.getByTestId('reset-health-button').should('be.visible').click();
        cy.get('#currentHealth').should('have.value', '10');
        cy.get('#temporaryHealth').should('have.value', '0');
        cy.wrap($dialog).should(
          'not.contain.text',
          "Your character has stabilized but remains unconscious at death's door."
        );

        cy.get('#currentHealth').clear().type('0').blur();
        cy.get('#deathSaveFailures').should('be.visible').clear().type('2').blur();
        cy.get('#currentHealth').clear().type('5').blur();
        cy.get('#deathSaveFailures').should('not.exist');
        cy.wrap($dialog).getButton('Save').click();
      });
      cy.getByRole('status', 'Health Updated').should('be.visible');

      // Test: Unsaved Changes Confirmation
      cy.getByTestId(`health-${healthTestCharId}`).should('be.visible').click();
      cy.getByRole('dialog', 'Manage Health').get('#currentHealth').clear().type('8').blur();
      cy.getByRole('dialog', 'Manage Health').click();
      cy.press('Escape');
      cy.getByRole('dialog', 'Unsaved Changes').getButton('Cancel').click();
      cy.getByRole('dialog', 'Unsaved Changes').should('not.exist');
      cy.getByRole('dialog', 'Manage Health').should('exist');
      cy.press('Escape');
      cy.getByRole('dialog', 'Unsaved Changes').getButton('Discard').click();
      cy.getByRole('dialog', 'Unsaved Changes').should('not.exist');
      cy.getByRole('dialog', 'Manage Health').should('not.exist');
      cy.getByTestId('hit-points').should('contain.text', '5');

      // Test: Persistence - Verify data survives reload
      cy.getByTestId(`health-${healthTestCharId}`).should('be.visible').click();
      cy.getByRole('dialog', 'Manage Health').within(($dialog) => {
        cy.get('#currentHealth').should('have.value', '5').clear().type('8').blur();
        cy.get('#temporaryHealth').clear().type('3').blur();

        cy.wrap($dialog).getButton('Save').click();
      });
      cy.getByRole('status', 'Health Updated').should('be.visible');
      cy.reload();

      cy.getByTestId('hit-points').should('contain.text', '11');
      cy.getByTestId(`health-${healthTestCharId}`).click();
      cy.get('#currentHealth').should('have.value', '8');
      cy.get('#temporaryHealth').should('have.value', '3');
    });

    it('should auto-log damage, healing, temporary HP, death saves, cancel discard, and reset to the action record', () => {
      cy.callFirestore('update', `users/${Cypress.testUser.uid}/characters/${healthTestCharId}`, {
        level: 3,
        traits: [
          ...(tillyData.traits ?? []),
          { index: 'relentless-endurance', name: 'Relentless Endurance' }
        ],
        hit_points: 6,
        health: { current: 3, temporary: 0, deathSaves: { successes: 0, failures: 0 } },
        resourceUsages: {},
        conditions: []
      });

      cy.visitAs(Cypress.testUser.uid, '/');
      cy.getByTestId(`character-card-${healthTestCharId}`).click();
      cy.getByTestId('character-container').should('be.visible');

      // Test: Drawer shows empty state when no records exist
      cy.getByTestId(`action-record-${healthTestCharId}`).click();
      cy.getByTestId(`action-record-drawer-${healthTestCharId}`).should(
        'contain.text',
        'Nothing to show yet'
      );
      cy.getButton('Close').click();
      cy.getByTestId(`action-record-drawer-${healthTestCharId}`).should('not.exist');

      // Test: Health damage
      cy.getByTestId(`health-${healthTestCharId}`).click();
      cy.getByRole('dialog', 'Manage Health').within(($dialog) => {
        cy.get('#currentHealth').clear().type('1');
        cy.wrap($dialog).getButton('Save').click();
      });
      cy.getByRole('status', 'Health Updated').should('be.visible');

      cy.getByTestId(`action-record-${healthTestCharId}`).click();
      cy.getByRole('button', 'Health').click();
      cy.getByTestId('record-item-').should('have.length', 1);
      cy.getByTestId('record-item-')
        .first()
        .should('contain.text', 'Took Damage')
        .and('contain.text', '-2')
        .and('contain.text', 'auto');
      cy.getByTestId('record-item-')
        .first()
        .within(($el) => {
          cy.wrap($el).getByTestId('record-delete').should('exist');
          cy.wrap($el).getByTestId('record-edit').should('exist');
        });

      // Test: Health heal
      cy.getButton('Close').click();
      cy.getByTestId(`health-${healthTestCharId}`).click();
      cy.getByRole('dialog', 'Manage Health').within(($dialog) => {
        cy.get('#currentHealth').clear().type('3');
        cy.wrap($dialog).getButton('Save').click();
      });
      cy.getByRole('status', 'Health Updated').should('be.visible');

      cy.getByTestId(`action-record-${healthTestCharId}`).click();
      cy.getByRole('button', 'Health').click();
      cy.getByTestId('record-item-').should('have.length', 2);
      cy.getByTestId('record-item-')
        .first()
        .should('contain.text', 'Healed')
        .and('contain.text', '+2')
        .and('contain.text', 'auto');
      cy.getByTestId('record-item-').last().should('contain.text', 'Took Damage');

      // Test: Temporary Health gained
      cy.getButton('Close').click();
      cy.getByTestId(`health-${healthTestCharId}`).click();
      cy.getByRole('dialog', 'Manage Health').within(($dialog) => {
        cy.get('#temporaryHealth').clear().type('5').blur();
        cy.wrap($dialog).getButton('Save').click();
      });
      cy.getByRole('status', 'Health Updated').should('be.visible');

      cy.getByTestId(`action-record-${healthTestCharId}`).click();
      cy.getByRole('button', 'Health').click();
      cy.getByTestId('record-item-').should('have.length', 3);
      cy.getByTestId('record-item-')
        .first()
        .should('contain.text', 'Gained Temporary Health')
        .and('contain.text', '+5')
        .and('contain.text', 'auto');
      cy.getButton('Close').click();

      // Test: Temporary Health lost
      cy.getByTestId(`health-${healthTestCharId}`).click();
      cy.getByRole('dialog', 'Manage Health').within(($dialog) => {
        cy.get('#temporaryHealth').clear().type('0').blur();
        cy.wrap($dialog).getButton('Save').click();
      });
      cy.getByRole('status', 'Health Updated').should('be.visible');

      cy.getByTestId(`action-record-${healthTestCharId}`).click();
      cy.getByRole('button', 'Health').click();
      cy.getByTestId('record-item-').should('have.length', 4);
      cy.getByTestId('record-item-')
        .first()
        .should('contain.text', 'Lost Temporary Health')
        .and('contain.text', '-5')
        .and('contain.text', 'auto');
      cy.getButton('Close').click();

      // Test: Relentless Endurance auto-log
      cy.getByTestId(`health-${healthTestCharId}`).click();
      cy.getByRole('dialog', 'Manage Health').within(($dialog) => {
        cy.get('#currentHealth').clear().type('0');
        cy.contains('racial ability').should('be.visible');
        cy.wrap($dialog).getButton('Save').click();
      });
      cy.getByRole('status', 'Health Updated').should('be.visible');

      cy.getByTestId(`action-record-${healthTestCharId}`).click();
      cy.getByRole('button', 'Traits').click();
      cy.getByTestId('record-item-').should('have.length', 1);
      cy.getByTestId('record-item-')
        .first()
        .should('contain.text', 'Relentless Endurance')
        .and('contain.text', 'auto');
      cy.getButton('Close').click();

      // Test: Override Hit Points
      cy.getByTestId(`health-${healthTestCharId}`).click();
      cy.getByRole('dialog', 'Manage Health').within(($dialog) => {
        cy.contains('Override Hit Points').closest('label').find('input[type="checkbox"]').check();
        cy.get('#currentHealth').clear().type('8');
        cy.wrap($dialog).getButton('Save').click();
      });
      cy.getByRole('status', 'Health Updated').should('be.visible');

      cy.getByTestId(`action-record-${healthTestCharId}`).click();
      cy.getByRole('button', 'Health').click();
      cy.getByTestId('record-item-').should('have.length', 7);
      cy.getByTestId('record-item-')
        .first()
        .should('contain.text', 'Hit points updated')
        .and('contain.text', 'Initial: 6')
        .and('contain.text', 'Final: 8')
        .and('contain.text', 'auto');
      cy.getByTestId('record-item-').first().getByTestId('record-delete').should('exist');

      // Test: Death saves — HP drop and first failure in same session
      cy.getButton('Close').click();
      cy.getByTestId(`health-${healthTestCharId}`).click();
      cy.getByRole('dialog', 'Manage Health').within(($dialog) => {
        cy.get('#currentHealth').clear().type('0').blur();
        cy.get('#deathSaveFailures').should('be.visible').clear().type('1').blur();
        cy.wrap($dialog).getButton('Save').click();
      });
      cy.getByRole('status', 'Health Updated').should('be.visible');

      cy.getByTestId(`action-record-${healthTestCharId}`).click();
      cy.getByTestId('record-item-')
        .eq(0)
        .should('contain.text', 'Death Save')
        .and('contain.text', 'failure');
      cy.getByTestId('record-item-').eq(1).should('contain.text', 'Took Damage');

      // Test: Failure incremented twice in the same dialog session
      cy.getButton('Close').click();
      cy.getByTestId(`health-${healthTestCharId}`).click();
      cy.getByRole('dialog', 'Manage Health').within(($dialog) => {
        cy.get('#deathSaveFailures').should('be.visible').clear().type('2').blur();
        cy.get('#deathSaveFailures').clear().type('3').blur();
        cy.wrap($dialog).getButton('Save').click();
      });
      cy.getByRole('status', 'Health Updated').should('be.visible');

      cy.getByTestId(`action-record-${healthTestCharId}`).click();
      cy.getByTestId('record-item-')
        .eq(0)
        .should('contain.text', 'Death Save')
        .and('contain.text', 'failure');
      cy.getByTestId('record-item-')
        .eq(1)
        .should('contain.text', 'Death Save')
        .and('contain.text', 'failure');
      cy.getByTestId('record-item-').eq(2).should('contain.text', 'Took Damage');

      // Test: Success and failure changed in the same session
      cy.getButton('Close').click();
      cy.getByTestId(`health-${healthTestCharId}`).click();
      cy.getByRole('dialog', 'Manage Health').within(($dialog) => {
        cy.get('#deathSaveSuccesses').should('be.visible').clear().type('1').blur();
        cy.get('#deathSaveFailures').clear().type('2').blur();
        cy.wrap($dialog).getButton('Save').click();
      });
      cy.getByRole('status', 'Health Updated').should('be.visible');

      cy.getByTestId(`action-record-${healthTestCharId}`).click();
      cy.getByTestId('record-item-')
        .eq(0)
        .should('contain.text', 'Death Save')
        .and('contain.text', 'failure');
      cy.getByTestId('record-item-')
        .eq(1)
        .should('contain.text', 'Death Save')
        .and('contain.text', 'success');

      // Test: Auto-resets death saves silently on heal
      cy.getButton('Close').click();
      cy.getByTestId(`health-${healthTestCharId}`).click();
      cy.getByRole('dialog', 'Manage Health').within(($dialog) => {
        cy.get('#currentHealth').clear().type('3').blur();
        cy.wrap($dialog).getButton('Save').click();
      });
      cy.getByRole('status', 'Health Updated').should('be.visible');

      cy.getByTestId(`action-record-${healthTestCharId}`).click();
      cy.getByTestId('record-item-').eq(0).should('contain.text', 'Healed');

      // Test: Cancel discards the entire backlog — no new records logged
      cy.getByTestId('record-item-').then(($items) => {
        const countBefore = $items.length;
        cy.getButton('Close').click();
        cy.getByTestId(`health-${healthTestCharId}`).click();
        cy.getByRole('dialog', 'Manage Health').within(($dialog) => {
          cy.get('#currentHealth').clear().type('0').blur();
          cy.get('#deathSaveFailures').should('be.visible').clear().type('1').blur();
          cy.wrap($dialog).getButton('Cancel').click();
        });
        cy.getByTestId(`action-record-${healthTestCharId}`).click();
        cy.getByTestId('record-item-').should('have.length', countBefore);
        cy.getButton('Close').click();
      });

      // Test: Reset button logs a "Reset Health" summary record
      cy.getByTestId(`health-${healthTestCharId}`).click();
      cy.getByRole('dialog', 'Manage Health').within(($dialog) => {
        cy.get('#currentHealth').clear().type('0').blur();
        cy.get('#deathSaveFailures').should('be.visible').clear().type('2').blur();
        cy.getByTestId('reset-health-button').click();
        cy.wrap($dialog).getButton('Save').click();
      });
      cy.getByRole('status', 'Health Updated').should('be.visible');

      cy.getByTestId(`action-record-${healthTestCharId}`).click();
      cy.getByTestId('record-item-')
        .eq(0)
        .should('contain.text', 'Reset Health')
        .and('contain.text', 'Current HP: 3 -> 8')
        .and('contain.text', 'Reset Racial Ability uses')
        .and('contain.text', 'Pending Logs:')
        .and('contain.text', 'Took Damage: -3 HP')
        .and('contain.text', 'Death Save: 2 failure');
      cy.getButton('Close').click();
    });
  });

  context('Special mechanics', () => {
    after(() => cy.callFirestore('delete', `users/${Cypress.testUser.uid}/characters`));

    it('should handle Override Hit Points and the Relentless Endurance racial ability', () => {
      const relentlessCharID = `relentless-test-char-${isMobile ? 'mobile' : 'desktop'}`;
      cy.seedCharacter(Cypress.testUser.uid, relentlessCharID, {
        ...characters.find(({ name }) => name === 'Ravy')!,
        ...baseHealth,
        id: relentlessCharID
      });

      cy.visitAs(Cypress.testUser.uid, '/');
      cy.getByTestId(`character-card-${relentlessCharID}`).click();
      cy.getByTestId('character-container').should('be.visible');

      // Test: Enable override with validations
      cy.getByTestId(`health-${relentlessCharID}`).click();
      cy.getByRole('dialog', 'Manage Health').within(($dialog) => {
        cy.get('#currentHealth').should('have.value', '10');
        cy.contains('Override Hit Points')
          .parent()
          .find('input[type="checkbox"]')
          .should('not.be.checked')
          .check();

        cy.contains('Override Hit Points').parent().find('button').click();
        cy.getByRole('tooltip').should('contain.text', 'Permanently modify');

        cy.get('#temporaryHealth').should('be.disabled');
        cy.getByTestId('reset-health-button').should('be.disabled');

        cy.get('#currentHealth').clear().type('50').blur();
        cy.get('#currentHealth').should('have.value', '50');
        cy.get('#currentHealth').clear().type('100').blur();
        cy.get('#currentHealth').should('have.value', '99');
        cy.get('#currentHealth').clear().type('0').blur();
        cy.wrap($dialog).getButton('Save').should('be.disabled');

        cy.get('#currentHealth').clear().type('15').blur();
        cy.wrap($dialog).getButton('Save').should('be.enabled').click();
      });
      cy.getByRole('status', 'Health Updated').should('be.visible');
      cy.getByTestId('hit-points').should('contain.text', '15');

      // Test: Reset uses new hit_points value
      cy.getByTestId(`health-${relentlessCharID}`).click();
      cy.getByRole('dialog', 'Manage Health').within(($dialog) => {
        cy.get('#currentHealth').should('have.value', '15');
        cy.get('#temporaryHealth').should('be.enabled');

        cy.get('#currentHealth').clear().type('5').blur();
        cy.get('#currentHealth').should('have.value', '5');
        cy.getByTestId('reset-health-button').should('be.enabled').click();
        cy.get('#currentHealth').should('have.value', '15');

        cy.get('#currentHealth').clear().type('5').blur();
        cy.wrap($dialog).getButton('Save').click();
      });
      cy.getByRole('status', 'Health Updated').should('be.visible');

      // Test: Override with higher value keeps damage occured
      cy.getByTestId(`health-${relentlessCharID}`).should('be.visible').click();
      cy.get('#currentHealth').should('have.value', '5');
      cy.contains('Override Hit Points').parent().find('input[type="checkbox"]').check();
      cy.getByRole('dialog', 'Unsaved Changes').should('not.exist');

      cy.get('#currentHealth').clear().type('20').blur();
      cy.contains('Override Hit Points').parent().find('input[type="checkbox"]').uncheck();

      cy.getByRole('dialog', 'Unsaved Changes').getButton('Save').click();
      cy.getByRole('dialog', 'Unsaved Changes').should('not.exist');
      cy.getByRole('status', 'Health Updated').should('be.visible');
      cy.getByTestId('hit-points').should('contain.text', '10');

      // Test: Override below current caps health to 1
      cy.getByRole('dialog', 'Manage Health').within(($dialog) => {
        cy.get('#currentHealth').should('have.value', '10');
        cy.contains('Override Hit Points').parent().find('input[type="checkbox"]').check();
        cy.getByRole('dialog', 'Unsaved Changes').should('not.exist');

        cy.get('#currentHealth').clear().type('3').blur();
        cy.wrap($dialog).getButton('Save').click();
      });
      cy.getByRole('status', 'Health Updated').should('be.visible');
      cy.getByTestId('hit-points').should('contain.text', '1');

      cy.getByTestId(`health-${relentlessCharID}`).should('be.visible').click();
      cy.getByRole('dialog', 'Manage Health').within(($dialog) => {
        cy.get('#currentHealth').should('have.value', '1').clear().type('10').blur();
        cy.get('#currentHealth').should('have.value', '3');
        cy.contains('Override Hit Points').parent().find('input[type="checkbox"]').check();
        cy.getByRole('dialog', 'Unsaved Changes').getButton('Cancel').click();
        cy.getByRole('dialog', 'Unsaved Changes').should('not.exist');
        cy.contains('Override Hit Points')
          .parent()
          .find('input[type="checkbox"]')
          .should('not.be.checked');

        cy.get('#currentHealth').should('have.value', '3');
        cy.contains('Override Hit Points').parent().find('input[type="checkbox"]').check();
        cy.getByRole('dialog', 'Unsaved Changes').getButton('Discard').click();
        cy.getByRole('dialog', 'Unsaved Changes').should('not.exist');
        cy.contains('Override Hit Points')
          .parent()
          .find('input[type="checkbox"]')
          .should('be.checked');
        cy.get('#currentHealth').should('have.value', '1');

        cy.contains('Override Hit Points').parent().find('input[type="checkbox"]').uncheck();
        cy.get('#currentHealth').should('have.value', '1');

        cy.contains('Override Hit Points').parent().find('input[type="checkbox"]').check();
        cy.getByRole('dialog', 'Unsaved Changes').should('not.exist');
        cy.get('#currentHealth').should('have.value', 1).clear().type('10').blur();
        cy.wrap($dialog).getButton('Save').click();
      });

      // Test: Auto-save triggers once and restores health to 1
      cy.getByTestId(`health-${relentlessCharID}`).click();
      cy.getByRole('dialog', 'Manage Health').within(($dialog) => {
        cy.get('#currentHealth').should('have.value', '8');
        cy.getByTestId('reset-health-button').click();
        cy.get('#currentHealth').should('have.value', '10');

        cy.get('#currentHealth').clear().type('0').blur();
        cy.get('#currentHealth').should('have.value', '1');
        cy.wrap($dialog).should(
          'contain.text',
          "Your character's racial ability has been used and won't trigger again until you finish a long rest."
        );
        cy.get('#deathSaveSuccesses').should('not.exist');
        cy.get('#deathSaveFailures').should('not.exist');

        cy.get('#currentHealth').clear().type('0').blur();
        cy.get('#currentHealth').should('have.value', '0');
        cy.get('#deathSaveSuccesses').should('be.visible');
        cy.get('#deathSaveFailures').should('be.visible');

        cy.get('#currentHealth').clear().type('5').blur();
        cy.wrap($dialog).should(
          'contain.text',
          "Your character's racial ability has been used and won't trigger again"
        );

        cy.wrap($dialog).getButton('Save').click();
      });
      cy.getByRole('status', 'Health Updated').should('be.visible');

      // Test: Reset clears flag and ability re-triggers
      cy.getByTestId(`health-${relentlessCharID}`).should('be.visible').click();
      cy.getByRole('dialog', 'Manage Health').within(($dialog) => {
        cy.get('#currentHealth').should('have.value', '5');

        cy.getByTestId('reset-health-button').click();
        cy.get('#currentHealth').should('have.value', '10');
        cy.wrap($dialog).should(
          'not.contain.text',
          "Your character's racial ability has been used"
        );

        cy.get('#currentHealth').clear().type('0').blur();
        cy.get('#currentHealth').should('have.value', '1');
        cy.wrap($dialog).should(
          'contain.text',
          "Your character's racial ability has been used and won't trigger again"
        );

        cy.wrap($dialog).getButton('Save').click();
      });
      cy.getByRole('status', 'Health Updated').should('be.visible');

      // Test: Persistence after reload
      cy.reload();
      cy.getByTestId(`health-${relentlessCharID}`).click();
      cy.getByRole('dialog', 'Manage Health').within(($dialog) => {
        cy.get('#currentHealth').should('have.value', '1');
        cy.wrap($dialog).should(
          'contain.text',
          "Your character's racial ability has been used and won't trigger again"
        );
        cy.wrap($dialog).getButton('Cancel').click();
      });

      // Test: Pre-override dialog save
      cy.getByTestId(`health-${relentlessCharID}`).click();
      cy.get('#currentHealth').clear().type('7').blur();
      cy.contains('Override Hit Points').parent().find('input[type="checkbox"]').check();
      cy.getByRole('dialog', 'Unsaved Changes').getButton('Save').click();
      cy.getByRole('dialog', 'Unsaved Changes').should('not.exist');
      cy.getByRole('status', 'Health Updated').should('be.visible');
      cy.get('#currentHealth').should('have.value', '7');
      cy.contains('Override Hit Points')
        .parent()
        .find('input[type="checkbox"]')
        .should('be.checked');

      // Test: Post-override dialog cancel
      cy.get('#currentHealth').clear().type('12').blur();
      cy.contains('Override Hit Points').parent().find('input[type="checkbox"]').uncheck();
      cy.getByRole('dialog', 'Unsaved Changes').getButton('Cancel').click();
      cy.getByRole('dialog', 'Unsaved Changes').should('not.exist');
      cy.contains('Override Hit Points')
        .parent()
        .find('input[type="checkbox"]')
        .should('be.checked');
      cy.get('#currentHealth').should('have.value', '12');

      // Test: Post-override dialog discard
      cy.contains('Override Hit Points').parent().find('input[type="checkbox"]').uncheck();
      cy.getByRole('dialog', 'Unsaved Changes').getButton('Discard').click();
      cy.getByRole('dialog', 'Unsaved Changes').should('not.exist');
      cy.contains('Override Hit Points')
        .parent()
        .find('input[type="checkbox"]')
        .should('not.be.checked');
      cy.get('#currentHealth').should('have.value', '7');
    });

    it('should recalculate max HP when the Constitution modifier changes', () => {
      const healthTestCharId = `health-test-char-${isMobile ? 'mobile' : 'desktop'}`;
      const characterWithSaves = characters.find(({ name }) => name === 'Delfy')!;
      const baseChar = {
        ...characterWithSaves,
        id: healthTestCharId,
        level: 2,
        abilities: [],
        abilityScores: {
          ...characterWithSaves.abilityScores,
          con: { index: 'con', name: 'CON', full_name: 'Constitution', score: 13, modifier: 1 }
        },
        health: {
          current: 8,
          temporary: 0,
          deathSaves: { successes: 0, failures: 0 }
        }
      };
      cy.seedCharacter(Cypress.testUser.uid, healthTestCharId, baseChar);

      cy.visitAs(Cypress.testUser.uid, '/');
      cy.getByTestId(`character-card-${healthTestCharId}`).click();
      cy.getByTestId('character-container').should('be.visible');
      cy.getByTestId('ability-con').should('contain.text', '13').and('contain.text', '+1');

      // Test: Increase CON to 15 (modifier +2, difference of +1)
      cy.getByTestId(`edit-points-${healthTestCharId}`).click();
      cy.getByRole('dialog', 'Edit Character Points').within(() => {
        cy.get('#ability-con').should('have.value', '13');
        cy.get('#ability-con').clear().type('15').blur();
        cy.getByTestId('save-scores').click();
      });
      cy.getByRole('status', 'Character Points Updated').should('be.visible');
      cy.getByTestId('hit-points').should('contain.text', (baseChar.health.current + 2).toString());
      cy.getByTestId('ability-con').should('contain.text', '15').and('contain.text', '+2');

      // Test: Decrease CON to 11 (modifier 0, difference of -1)
      cy.getByTestId(`edit-points-${healthTestCharId}`).click();
      cy.get('#ability-con').clear().type('11').blur();
      cy.getByTestId('save-scores').click();

      cy.getByRole('status', 'Character Points Updated').should('be.visible');
      cy.getByTestId('hit-points').should('contain.text', (baseChar.health.current - 2).toString());
      cy.getByTestId('ability-con').should('contain.text', '11').and('contain.text', '0');

      // Test: Decrease CON to 9 (modifier -1, difference of -2)
      cy.getByTestId(`edit-points-${healthTestCharId}`).click();
      cy.get('#ability-con').clear().type('9').blur();
      cy.getByTestId('save-scores').click();

      cy.getByRole('status', 'Character Points Updated').should('be.visible');
      cy.getByTestId('hit-points').should('contain.text', (baseChar.health.current - 4).toString());
      cy.getByTestId('ability-con').should('contain.text', '9').and('contain.text', '-1');

      // Test: Edge case - Negative health defaults to 1
      cy.getByTestId(`health-${healthTestCharId}`).click();
      cy.getByRole('dialog', 'Manage Health').within(($dialog) => {
        cy.get('#currentHealth').clear().type('2').blur();
        cy.wrap($dialog).getButton('Save').click();
      });
      cy.getByRole('status', 'Health Updated').should('be.visible');

      cy.getByTestId(`edit-points-${healthTestCharId}`).click();
      cy.get('#ability-con').clear().type('7').blur();
      cy.getByTestId('save-scores').click();
      cy.getByRole('status', 'Character Points Updated').should('be.visible');
      cy.getByTestId('hit-points').should('contain.text', '1');

      cy.getByTestId(`health-${healthTestCharId}`).click();
      cy.getByRole('dialog', 'Manage Health').within(($dialog) => {
        cy.get('#currentHealth').should('have.value', '1');
        cy.get('#currentHealth').clear().type('0').blur();
        cy.wrap($dialog).getButton('Save').click();
      });
      cy.getByRole('status', 'Health Updated').should('be.visible');

      // Test: Edge case - Health stays at 0 when unconscious
      cy.getByTestId(`edit-points-${healthTestCharId}`).click();
      cy.get('#ability-con').clear().type(baseChar.abilityScores.con.score.toString()).blur();
      cy.getByTestId('save-scores').click();
      cy.getByRole('status', 'Character Points Updated').should('be.visible');
      cy.getByTestId('hit-points').should('contain.text', '0');

      cy.getByTestId(`health-${healthTestCharId}`).click();
      cy.get('#currentHealth').should('have.value', '0');
      cy.get('#deathSaveSuccesses').should('be.visible');
      cy.getByTestId('reset-health-button').click();
      cy.get('#currentHealth').should('have.value', baseChar.hit_points.toString());
    });
  });
});

import { characters } from 'cypress/support/mocks/characterList';

describe('Character Health Management End-to-End', () => {
  const characterData = characters.find(({ name }) => name === 'Delfy')!;
  const baseHealth = {
    hit_points: 10,
    health: {
      current: 10,
      temporary: 0,
      deathSaves: { successes: 0, failures: 0 }
    },
    resourceUsages: {}
  };

  beforeEach(() => {
    cy.wrap(Cypress.config('viewportWidth') === 375).as('isMobile');
    cy.login(Cypress.testUser.uid);
  });

  after(() => cy.callFirestore('delete', `users/${Cypress.testUser.uid}/characters`));

  it('should complete full health management workflow with validation and error handling', function () {
    const healthTestChar = {
      ...characterData,
      ...baseHealth,
      id: `health-test-char-${this.isMobile ? 'mobile' : 'desktop'}`
    };
    cy.createTestCharacter(Cypress.testUser.uid, healthTestChar.id, healthTestChar);

    cy.visit('/');
    cy.getByTestId(`character-card-${healthTestChar.id}`).click();
    cy.getByTestId('character-container').should('be.visible');
    cy.getByTestId('hit-points').should('contain.text', '10');

    // Test: Setup & Initial State - Open, verify, test cancel and ESC
    cy.getByTestId(`health-${healthTestChar.id}`).click();
    cy.getByRole('dialog', 'Manage Health').within(($dialog) => {
      cy.get('#temporaryHealth').should('have.value', '0').and('be.visible');
      cy.get('#currentHealth').should('have.value', '10').and('be.visible');
      cy.wrap($dialog).getButton('Save').should('be.enabled');
      cy.wrap($dialog).getButton('Cancel').click();
    });
    cy.getByRole('dialog', 'Manage Health').should('not.exist');

    // Test: ESC key also closes dialog without changes
    cy.getByTestId(`health-${healthTestChar.id}`).click();
    cy.press('Escape');
    cy.getByRole('dialog', 'Manage Health').should('not.exist');

    // Test: Temporary Health
    cy.getByTestId(`health-${healthTestChar.id}`).click();
    cy.getByRole('dialog', 'Manage Health').within(($dialog) => {
      cy.get('label[for="temporaryHealth"]').find('button').click();
      cy.getByRole('tooltip').should('contain.text', 'Grants a protective buffer');

      cy.get('#temporaryHealth').clear().type('-').blur().should('not.have.value', '-'); // Min 0
      cy.get('#temporaryHealth').clear().type('5').blur();
      cy.get('#currentHealth').should('be.disabled');
      cy.wrap($dialog).getButton('Save').click();
    });
    cy.getByRole('status', 'Health Updated').should('be.visible');
    cy.getByTestId('hit-points').should('contain.text', '15');

    // Test: Full cycle with all states
    cy.getByTestId(`health-${healthTestChar.id}`).click();
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

    cy.getByTestId(`health-${healthTestChar.id}`).should('be.visible').click();
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
    cy.getByTestId(`health-${healthTestChar.id}`).click();
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
    cy.getByTestId(`health-${healthTestChar.id}`).should('be.visible').click();
    cy.getByRole('dialog', 'Manage Health').get('#currentHealth').clear().type('8').blur();
    cy.getByRole('dialog', 'Manage Health').click();
    cy.press('Escape');
    cy.getByRole('dialog', 'Leave without saving your changes?').should('exist');
    cy.getButton('No').click();
    cy.getByRole('dialog', 'Manage Health').should('exist');
    cy.press('Escape');
    cy.getButton('Yes').click();
    cy.getByRole('dialog', 'Manage Health').should('not.exist');
    cy.getByTestId('hit-points').should('contain.text', '5');

    // Test: Persistence - Verify data survives reload
    cy.getByTestId(`health-${healthTestChar.id}`).should('be.visible').click();
    cy.getByRole('dialog', 'Manage Health').within(($dialog) => {
      cy.get('#currentHealth').should('have.value', '5').clear().type('8').blur();
      cy.get('#temporaryHealth').clear().type('3').blur();

      cy.wrap($dialog).getButton('Save').click();
    });
    cy.getByRole('status', 'Health Updated').should('be.visible');
    cy.reload();

    cy.getByTestId('hit-points').should('contain.text', '11');
    cy.getByTestId(`health-${healthTestChar.id}`).click();
    cy.getByRole('dialog', 'Manage Health').within(() => {
      cy.get('#currentHealth').should('have.value', '8');
      cy.get('#temporaryHealth').should('have.value', '3');
    });
  });

  it('should handle override hit points and relentless endurance workflows', function () {
    const characterWithSaves = characters.find(({ name }) => name === 'Ravy')!;
    const relentlessChar = {
      ...characterWithSaves,
      id: `relentless-test-char-${this.isMobile ? 'mobile' : 'desktop'}`,
      ...baseHealth
    };
    cy.createTestCharacter(Cypress.testUser.uid, relentlessChar.id, relentlessChar);

    cy.visit('/');
    cy.getByTestId(`character-card-${relentlessChar.id}`).click();
    cy.getByTestId('character-container').should('be.visible');

    // Test: Enable override with validations
    cy.getByTestId(`health-${relentlessChar.id}`).click();
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
    cy.getByTestId(`health-${relentlessChar.id}`).click();
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
    cy.getByTestId(`health-${relentlessChar.id}`).should('be.visible').click();
    cy.getByRole('dialog', 'Manage Health').within(($dialog) => {
      cy.get('#currentHealth').should('have.value', '5');
      cy.contains('Override Hit Points').parent().find('input[type="checkbox"]').check();

      cy.get('#currentHealth').clear().type('20').blur();
      cy.wrap($dialog).getButton('Save').click();
    });
    cy.getByRole('status', 'Health Updated').should('be.visible');
    cy.getByTestId('hit-points').should('contain.text', '10');

    // Test: Override below current caps health to 1
    cy.getByTestId(`health-${relentlessChar.id}`).should('be.visible').click();
    cy.getByRole('dialog', 'Manage Health').within(($dialog) => {
      cy.get('#currentHealth').should('have.value', '10');
      cy.contains('Override Hit Points').parent().find('input[type="checkbox"]').check();

      cy.get('#currentHealth').clear().type('3').blur();
      cy.wrap($dialog).getButton('Save').click();
    });
    cy.getByRole('status', 'Health Updated').should('be.visible');
    cy.getByTestId('hit-points').should('contain.text', '1');

    cy.getByTestId(`health-${relentlessChar.id}`).should('be.visible').click();
    cy.getByRole('dialog', 'Manage Health').within(($dialog) => {
      cy.get('#currentHealth').should('have.value', '1').clear().type('10').blur();
      cy.contains('Override Hit Points').parent().find('input[type="checkbox"]').check();
      cy.contains('Override Hit Points').parent().find('input[type="checkbox"]').uncheck();

      cy.get('#currentHealth').should('have.value', '3');
      cy.contains('Override Hit Points').parent().find('input[type="checkbox"]').check();
      cy.get('#currentHealth').clear().type('10').blur();
      cy.wrap($dialog).getButton('Save').click();
    });

    // Test: Auto-save triggers once and restores health to 1
    cy.getByTestId(`health-${relentlessChar.id}`).click();
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
    cy.getByTestId(`health-${relentlessChar.id}`).should('be.visible').click();
    cy.getByRole('dialog', 'Manage Health').within(($dialog) => {
      cy.get('#currentHealth').should('have.value', '5');

      cy.getByTestId('reset-health-button').click();
      cy.get('#currentHealth').should('have.value', '10');
      cy.wrap($dialog).should('not.contain.text', "Your character's racial ability has been used");

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
    cy.getByTestId(`health-${relentlessChar.id}`).click();
    cy.getByRole('dialog', 'Manage Health').within(($dialog) => {
      cy.get('#currentHealth').should('have.value', '1');
      cy.wrap($dialog).should(
        'contain.text',
        "Your character's racial ability has been used and won't trigger again"
      );
    });
  });

  it('should recalculate hit points when constitution modifier changes', function () {
    // Test: Create character with initial CON modifier of +1 (CON 13), level 2
    const conTestChar = {
      ...characterData,
      id: `con-change-char-${this.isMobile ? 'mobile' : 'desktop'}`,
      level: 2,
      abilityScores: {
        ...characterData.abilityScores,
        con: { index: 'con', name: 'CON', full_name: 'Constitution', score: 13, modifier: 1 }
      },
      health: {
        current: 8,
        temporary: 0,
        deathSaves: { successes: 0, failures: 0 }
      },
      resourceUsages: {}
    };
    cy.createTestCharacter(Cypress.testUser.uid, conTestChar.id, conTestChar);

    cy.visit('/');
    cy.getByTestId(`character-card-${conTestChar.id}`).click();
    cy.getByTestId('character-container').should('be.visible');
    cy.getByTestId('ability-con').should('contain.text', '13').and('contain.text', '+1');

    // Test: Increase CON to 15 (modifier +2, difference of +1)
    cy.getByTestId(`edit-points-${conTestChar.id}`).click();
    cy.getByRole('dialog', 'Edit Character Points').within(() => {
      cy.get('#ability-con').should('have.value', '13');
      cy.get('#ability-con').clear().type('15').blur();
      cy.getByTestId('save-scores').click();
    });
    cy.getByRole('status', 'Character Points Updated').should('be.visible');
    cy.getByTestId('hit-points').should(
      'contain.text',
      (conTestChar.health.current + 2).toString()
    );
    cy.getByTestId('ability-con').should('contain.text', '15').and('contain.text', '+2');

    // Test: Decrease CON to 11 (modifier 0, difference of -1)
    cy.getByTestId(`edit-points-${conTestChar.id}`).click();
    cy.get('#ability-con').clear().type('11').blur();
    cy.getByTestId('save-scores').click();

    cy.getByRole('status', 'Character Points Updated').should('be.visible');
    cy.getByTestId('hit-points').should(
      'contain.text',
      (conTestChar.health.current - 2).toString()
    );
    cy.getByTestId('ability-con').should('contain.text', '11').and('contain.text', '0');

    // Test: Decrease CON to 9 (modifier -1, difference of -2)
    cy.getByTestId(`edit-points-${conTestChar.id}`).click();
    cy.get('#ability-con').clear().type('9').blur();
    cy.getByTestId('save-scores').click();

    cy.getByRole('status', 'Character Points Updated').should('be.visible');
    cy.getByTestId('hit-points').should(
      'contain.text',
      (conTestChar.health.current - 4).toString()
    );
    cy.getByTestId('ability-con').should('contain.text', '9').and('contain.text', '-1');

    // Test: Edge case - Negative health defaults to 1
    cy.getByTestId(`health-${conTestChar.id}`).click();
    cy.getByRole('dialog', 'Manage Health').within(($dialog) => {
      cy.get('#currentHealth').clear().type('2').blur();
      cy.wrap($dialog).getButton('Save').click();
    });
    cy.getByRole('status', 'Health Updated').should('be.visible');

    cy.getByTestId(`edit-points-${conTestChar.id}`).click();
    cy.get('#ability-con').clear().type('7').blur();
    cy.getByTestId('save-scores').click();
    cy.getByRole('status', 'Character Points Updated').should('be.visible');
    cy.getByTestId('hit-points').should('contain.text', '1');

    cy.getByTestId(`health-${conTestChar.id}`).click();
    cy.getByRole('dialog', 'Manage Health').within(($dialog) => {
      cy.get('#currentHealth').should('have.value', '1');
      cy.get('#currentHealth').clear().type('0').blur();
      cy.wrap($dialog).getButton('Save').click();
    });
    cy.getByRole('status', 'Health Updated').should('be.visible');

    // Test: Edge case - Health stays at 0 when unconscious
    cy.getByTestId(`edit-points-${conTestChar.id}`).click();
    cy.get('#ability-con').clear().type(conTestChar.abilityScores.con.score.toString()).blur();
    cy.getByTestId('save-scores').click();
    cy.getByRole('status', 'Character Points Updated').should('be.visible');
    cy.getByTestId('hit-points').should('contain.text', '0');

    cy.getByTestId(`health-${conTestChar.id}`).click();
    cy.getByRole('dialog', 'Manage Health').within(() => {
      cy.get('#currentHealth').should('have.value', '0');
      cy.get('#deathSaveSuccesses').should('be.visible');
      cy.getByTestId('reset-health-button').click();
      cy.get('#currentHealth').should('have.value', conTestChar.hit_points.toString());
    });
  });
});

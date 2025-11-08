import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';

Cypress.viewports.forEach(({ name, width, height }) =>
  describe(`${name} - Character Points End-to-End Flow`, () => {
    beforeEach(() => {
      cy.viewport(width, height);
      cy.login(Cypress.testUser.uid);
    });

    afterEach(() => cy.callFirestore('delete', `users/${Cypress.testUser.uid}/characters`));

    it('should complete full ability score allocation flow with "Set" method and race modifiers', () => {
      // Create character with specific race that has ability modifiers
      cy.createTestCharacter(Cypress.testUser.uid, 'points-test-char', {
        name: 'Points Test Character',
        race: { index: 'dwarf', name: 'Dwarf' },
        abilities: [
          { ability_score: { index: 'con', name: 'CON' }, bonus: 2 },
          { ability_score: { index: 'wis', name: 'WIS' }, bonus: 1 }
        ],
        abilityScores: undefined
      });

      cy.visit('/');
      cy.getByTestId('character-card-points-test-char').click();

      // Test: Should redirect to points page when abilityScores is null
      cy.getByRole('presentation', 'Ability Scores').should('be.visible');

      // Test: Race modifiers are displayed correctly
      cy.contains('Race Modifiers:').should('be.visible');
      cy.contains('CON: +2').should('be.visible');
      cy.contains('WIS: +1').should('be.visible');

      // Test: Select "Simple" (set) method
      cy.contains('button', 'Custom').next().click();
      cy.get('[role="menuitem"]').contains('Simple').click();

      // Test: Standard array values are present
      [15, 14, 13, 12, 10, 8].forEach((score) => {
        cy.get(`#ability-${score}`).should('have.value', score);
      });

      // Test: Assign abilities using dropdowns (prioritize race bonuses)
      cy.get('div#ability-15').click();
      cy.getByRole('option', 'Constitution').click(); // Will be 17 with +2
      cy.getByRole('option', 'Constitution').should('not.be.visible');
      cy.get('div#ability-14').click();
      cy.getByRole('option', 'Constitution').should('have.attr', 'aria-disabled', 'true'); // Already selected
      cy.getByRole('option', 'Wisdom').click(); // Will be 15 with +1
      cy.get('div#ability-13').click();
      cy.getByRole('option', 'Strength').click();
      cy.get('div#ability-12').click();
      cy.getByRole('option', 'Dexterity').click();
      cy.get('div#ability-10').click();
      cy.getByRole('option', 'Intelligence').click();
      cy.get('div#ability-8').click();
      cy.getByRole('option', 'Charisma').click();

      // Test: Save button should be enabled
      cy.getByTestId('SaveAltRoundedIcon').parent().should('be.enabled').click();

      // Test: Success message
      cy.getByRole('status', 'Character Points Updated').should('be.visible');

      // Test: Redirect to character sheet
      cy.url().should('include', '/character');
      cy.url().should('not.include', '/points');

      // Test: Verify ability scores are displayed correctly
      cy.getByTestId('stats-section').should('be.visible');
      cy.getByTestId('ability-con').should('contain.text', '17'); // 15 + 2 race bonus
      cy.getByTestId('ability-wis').should('contain.text', '15'); // 14 + 1 race bonus
      cy.getByTestId('ability-str').should('contain.text', '13');
      cy.getByTestId('ability-dex').should('contain.text', '12');
      cy.getByTestId('ability-int').should('contain.text', '10');
      cy.getByTestId('ability-cha').should('contain.text', '8');

      // Test: Verify modifiers are calculated correctly with race bonuses
      cy.getByTestId('ability-con').should('contain.text', '+3'); // 17 = +3
      cy.getByTestId('ability-wis').should('contain.text', '+2'); // 15 = +2
      cy.getByTestId('ability-str').should('contain.text', '+1'); // 13 = +1
      cy.getByTestId('ability-dex').should('contain.text', '+1'); // 12 = +1
      cy.getByTestId('ability-int').should('contain.text', '0'); // 10 = 0
      cy.getByTestId('ability-cha').should('contain.text', '-1'); // 8 = -1
    });

    it('should complete ability score allocation with "Point Buy" method including validation', () => {
      cy.createTestCharacter(Cypress.testUser.uid, 'pointbuy-char', {
        name: 'Point Buy Character',
        abilityScores: undefined
      });

      cy.visit('/');
      cy.getByTestId('character-card-pointbuy-char').click();
      cy.getByRole('presentation', 'Ability Scores').should('be.visible');

      // Test: Select "Point Buy" method
      cy.contains('button', 'Custom').next().click();
      cy.getByRole('menuitem', 'Point Buy').click();

      // Test: All abilities start at 8
      cy.get('input[id^="ability-"]').each(($input) => {
        cy.wrap($input).should('have.value', '8');
      });

      // Test: Remaining points shows 27
      cy.contains('Remaining Points:').parent().should('contain.text', '27');

      // Test: Try to exceed point limit (invalid state)
      cy.get('#ability-str').clear().type('15');
      cy.get('#ability-dex').clear().type('15');
      cy.get('#ability-con').clear().type('15');
      cy.get('#ability-int').clear().type('15');
      cy.get('#ability-wis').clear().type('15');
      cy.get('#ability-cha').clear().type('15');

      // Test: Remaining points should be negative and red
      cy.contains('Remaining Points:')
        .next()
        .should('contain.text', '-18')
        .should('have.css', 'color', 'rgb(255, 0, 0)'); // red color

      // Test: Save button should be disabled when over limit
      cy.getByTestId('SaveAltRoundedIcon').parent().should('be.disabled');

      // Test: Fix allocation to valid state
      // Allocate: STR=15(7pts), DEX=14(6pts), CON=14(6pts), INT=10(2pts), WIS=10(2pts), CHA=10(2pts) = 25 points
      cy.get('#ability-str').clear().type('15');
      cy.get('#ability-dex').clear().type('13');
      cy.get('#ability-con').clear().type('13');
      cy.get('#ability-int').clear().type('10');
      cy.get('#ability-wis').clear().type('10');
      cy.get('#ability-cha').clear().type('10').blur();

      // Test: Remaining points should update to valid amount
      cy.contains('Remaining Points:')
        .next()
        .should('have.text', '2')
        .should('not.have.css', 'color', 'rgb(255, 0, 0)'); // red color

      // Test: Try to exceed maximum score
      cy.get('#ability-str').clear().type('16').blur();
      cy.get('#ability-str').should('have.value', '15'); // Should be capped at 15

      // Test: Save button enabled when valid
      cy.get('#ability-dex').clear().type('14').blur();
      cy.getByTestId('SaveAltRoundedIcon').parent().should('be.enabled').click();

      // Test: Success message and redirect
      cy.getByRole('status', 'Character Points Updated').should('be.visible');
      cy.url().should('include', '/character');

      // Test: Verify stats on character sheet
      cy.getByTestId('ability-str').should('contain.text', '+316'); //+1 from race
      cy.getByTestId('ability-dex').should('contain.text', '+214');
      cy.getByTestId('ability-con').should('contain.text', '+113');
      cy.getByTestId('ability-int').should('contain.text', '010');
      cy.getByTestId('ability-wis').should('contain.text', '010');
      cy.getByTestId('ability-cha').should('contain.text', '010');
    });

    it('should complete ability score allocation with "Custom" (random) method', () => {
      cy.createTestCharacter(Cypress.testUser.uid, 'random-char', {
        name: 'Random Character',
        abilityScores: undefined
      });

      cy.visit('/');
      cy.getByTestId('character-card-random-char').click();
      cy.getByRole('presentation', 'Ability Scores').should('be.visible');

      // Test: Custom/Random method is default
      cy.contains('button', 'Custom').should('be.visible');
      cy.getButton('Custom').should('be.visible');

      // Test: All ability inputs have random values
      cy.get('input[id^="ability-"]').each(($input) => {
        cy.wrap($input).invoke('val').should('not.be.empty');
        cy.wrap($input)
          .invoke('val')
          .then((val) => {
            const numVal = parseInt(val as string);
            expect(numVal).to.be.at.least(3); // Min roll is 3 (1+1+1)
            expect(numVal).to.be.at.most(18); // Max roll is 18 (6+6+6)
          });
      });

      // Test: Dice icon is present for re-rolling
      cy.getByTestId('CasinoOutlinedIcon').should('have.length', 6);

      // Test: Re-roll a specific ability
      cy.get('#ability-str')
        .invoke('val')
        .then((initialValue) => {
          cy.getByTestId('randomize-str').click();
          cy.get('#ability-str').invoke('val').should('not.eq', initialValue);
        });

      cy.get('#ability-str').invoke('val').as('str-value', { type: 'static' });
      cy.get('#ability-wis').invoke('val').as('wis-value', { type: 'static' });
      cy.get('#ability-dex').invoke('val').as('dex-value', { type: 'static' });
      cy.get('#ability-int').invoke('val').as('int-value', { type: 'static' });
      cy.get('#ability-con').invoke('val').as('con-value', { type: 'static' });

      // Test: Manually edit an ability score
      cy.get('#ability-cha').clear().type('16').blur();
      cy.get('#ability-cha').should('have.value', '16');

      // Test: Save and verify
      cy.getByTestId('SaveAltRoundedIcon').parent().click();
      cy.url().should('include', '/character');

      cy.getByTestId('ability-cha').should('contain.text', '16');
      cy.get('@str-value').then((value: unknown) =>
        cy.getByTestId('ability-str').should('contain.text', parseInt(value as string) + 1)
      );
      cy.get('@wis-value').then((value) =>
        cy.getByTestId('ability-wis').should('contain.text', value)
      );
      cy.get('@dex-value').then((value) =>
        cy.getByTestId('ability-dex').should('contain.text', value)
      );
      cy.get('@int-value').then((value) =>
        cy.getByTestId('ability-int').should('contain.text', value)
      );
      cy.get('@con-value').then((value) =>
        cy.getByTestId('ability-con').should('contain.text', value)
      );
    });

    it('should not show points page for character with already calculated scores', () => {
      // Create character WITH ability scores
      cy.createTestCharacter(Cypress.testUser.uid, 'complete-char', {
        name: 'Complete Character'
        // baseCharacter includes abilityScores
      });

      cy.visit('/');
      cy.getByTestId('character-card-complete-char').click();

      // Test: Should go directly to character sheet
      cy.url().should('include', '/character');
      cy.url().should('not.include', '/points');

      // Test: Stats section is visible
      cy.getByTestId('stats-section').should('be.visible');
      cy.getByTestId('character-container').should('be.visible');
    });

    it('should calculate AC and HP correctly based on ability scores', () => {
      // Test AC calculation and HP with Barbarian (d12 hit die, no armor)
      cy.createTestCharacter(Cypress.testUser.uid, 'derived-stats-char', {
        name: 'Derived Stats Character',
        class: { index: 'barbarian', name: 'Barbarian' }, // d12 hit die for HP test
        equipments: [], // No armor for AC test
        abilityScores: undefined
      });

      cy.visit('/');
      cy.getByTestId('character-card-derived-stats-char').click();

      // Assign ability scores with high CON (for HP) and high DEX (for AC)
      cy.contains('button', 'Custom').next().click();
      cy.getByRole('menuitem', 'Simple').click();

      cy.get('div#ability-15').click();
      cy.getByRole('option', 'Constitution').click(); // 15 = +2 modifier for HP
      cy.get('div#ability-14').click();
      cy.getByRole('option', 'Dexterity').click(); // 14 = +2 modifier for AC
      cy.get('div#ability-13').click();
      cy.getByRole('option', 'Strength').click();
      cy.get('div#ability-12').click();
      cy.getByRole('option', 'Wisdom').click();
      cy.get('div#ability-10').click();
      cy.getByRole('option', 'Intelligence').click();
      cy.get('div#ability-8').click();
      cy.getByRole('option', 'Charisma').click();

      cy.getByTestId('SaveAltRoundedIcon').parent().click();

      // Test: Verify redirect to character sheet
      cy.url().should('include', '/character');
      cy.url().should('not.include', '/points');

      // Test: AC should be 10 + DEX modifier (10 + 2 = 12)
      cy.getByTestId('armor-class').should('contain.text', '12');

      // Test: HP should be hit die + CON modifier (12 + 2 = 14) for Barbarian
      cy.getByTestId('hit-points').should('contain.text', '14');

      // Test: Verify the ability scores and modifiers are correct
      cy.getByTestId('ability-con').should('contain.text', '15');
      cy.getByTestId('ability-con').should('contain.text', '+2');
      cy.getByTestId('ability-dex').should('contain.text', '14');
      cy.getByTestId('ability-dex').should('contain.text', '+2');
    });
  })
);

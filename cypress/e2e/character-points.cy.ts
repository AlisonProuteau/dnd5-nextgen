import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';
import { baseCharacter } from '../support/mocks/baseCharacter';

describe(`Character Points End-to-End Flow`, () => {
  beforeEach(() => {
    cy.wrap(Cypress.config('viewportWidth') === 375).as('isMobile');
    cy.login(Cypress.testUser.uid);
  });

  afterEach(() => cy.callFirestore('delete', `users/${Cypress.testUser.uid}/characters`));

  it('Set - should be able to set ability scores', function () {
    const charId = `points-test-char-${this.isMobile ? 'mobile' : 'desktop'}`;
    cy.createTestCharacter(Cypress.testUser.uid, charId, {
      name: 'Points Test Character',
      race: { index: 'dwarf', name: 'Dwarf' },
      abilities: [
        { ability_score: { index: 'con', name: 'CON' }, bonus: 2 },
        { ability_score: { index: 'wis', name: 'WIS' }, bonus: 1 }
      ],
      abilityScores: undefined
    });

    cy.visit('/');
    cy.getByTestId(`character-card-${charId}`).click();

    // Test: Should redirect to points page when abilityScores is null
    cy.getByRole('presentation', 'Ability Scores').should('be.visible');

    // Test: Race modifiers are displayed correctly
    cy.contains('Race Modifiers:').should('be.visible');
    cy.contains('CON: +2').should('be.visible');
    cy.contains('WIS: +1').should('be.visible');

    // Test: Select "Simple" (set) method
    cy.contains('button', 'Point Buy').next().click();
    cy.get('[role="menuitem"]').contains('Simple').click();

    // Test: Standard array values are present
    [15, 14, 13, 12, 10, 8].forEach((score) => {
      cy.get(`#ability-${score}`).should('have.value', score);
    });

    // Test: Assign abilities using dropdowns (prioritize race bonuses)
    cy.selectOption('#ability-15-value', 'Constitution'); // Will be 17 with +2
    cy.getByRole('option', 'Constitution').should('not.be.visible');
    cy.get('#ability-14-value').click();
    cy.getByRole('option', 'Constitution').should('have.attr', 'aria-disabled', 'true'); // Already selected
    cy.getByRole('option', 'Wisdom').click(); // Will be 15 with +1
    cy.selectOption('#ability-13-value', 'Strength');
    cy.selectOption('#ability-12-value', 'Dexterity');
    cy.selectOption('#ability-10-value', 'Intelligence');
    cy.selectOption('#ability-8-value', 'Charisma');

    // Test: Save button should be enabled
    cy.getByTestId('save-scores').should('be.enabled').click();

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

  it('Point Buy - should be able to set ability scores', function () {
    const charId = `pointbuy-char-${this.isMobile ? 'mobile' : 'desktop'}`;
    cy.createTestCharacter(Cypress.testUser.uid, charId, {
      name: 'Point Buy Character',
      abilityScores: undefined
    });

    cy.visit('/');
    cy.getByTestId(`character-card-${charId}`).click();
    cy.getByRole('presentation', 'Ability Scores').should('be.visible');

    // Test: Point Buy method is default
    cy.contains('button', 'Point Buy').should('be.visible');

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
      .should('contain.text', '-27')
      .should('have.css', 'color', 'rgb(255, 0, 0)'); // red color

    // Test: Save button should be disabled when over limit
    cy.getByTestId('save-scores').should('be.disabled');

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
    cy.getByTestId('save-scores').should('be.enabled').click();

    // Test: Success message and redirect
    cy.getByRole('status', 'Character Points Updated').should('be.visible');
    cy.url().should('include', '/character');

    // Test: Verify stats on character sheet (separate assertions for modifier and score)
    cy.getByTestId('ability-str').should('contain.text', '+3').and('contain.text', '16'); //+1 from race
    cy.getByTestId('ability-dex').should('contain.text', '+2').and('contain.text', '14');
    cy.getByTestId('ability-con').should('contain.text', '+1').and('contain.text', '13');
    cy.getByTestId('ability-int').should('contain.text', '0').and('contain.text', '10');
    cy.getByTestId('ability-wis').should('contain.text', '0').and('contain.text', '10');
    cy.getByTestId('ability-cha').should('contain.text', '0').and('contain.text', '10');
  });

  it('Custom (random) - should be able to set ability scores', function () {
    const charId = `random-char-${this.isMobile ? 'mobile' : 'desktop'}`;
    cy.createTestCharacter(Cypress.testUser.uid, charId, {
      name: 'Random Character',
      abilityScores: undefined
    });

    cy.visit('/');
    cy.getByTestId(`character-card-${charId}`).click();
    cy.getByRole('presentation', 'Ability Scores').should('be.visible');

    // Test: Select "Custom" (random) method
    cy.contains('button', 'Point Buy').next().click();
    cy.getByRole('menuitem', 'Custom').click();

    // Test: All ability inputs have random values
    cy.get('input[id^="ability-"]').first().should('not.have.value', 0); // Wait for first input to populate
    cy.get('input[id^="ability-"]').each(($input) => {
      cy.wrap($input)
        .invoke('val')
        .then((val) => {
          const numVal = parseInt(val as string);
          expect(numVal).to.be.at.least(3); // Min roll is 3 (1+1+1)
          expect(numVal).to.be.at.most(18); // Max roll is 18 (6+6+6)
        });
    });

    // Test: Dice icon is present for re-rolling
    cy.getByTestId('reroll-').should('have.length', 6);

    // Test: Re-roll a specific ability
    cy.get('#ability-str')
      .invoke('val')
      .then((initialValue) => {
        cy.getByTestId('reroll-str').click();
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
    cy.getByTestId('save-scores').click();
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

  it('should not show points page for character with already calculated scores', function () {
    const charId = `complete-char-${this.isMobile ? 'mobile' : 'desktop'}`;
    cy.createTestCharacter(Cypress.testUser.uid, charId, {
      name: 'Complete Character'
      // baseCharacter includes abilityScores
    });

    cy.visit('/');
    cy.getByTestId(`character-card-${charId}`).click();

    // Test: Should go directly to character sheet
    cy.url().should('include', '/character');
    cy.url().should('not.include', '/points');

    // Test: Stats section is visible
    cy.getByTestId('stats-section').should('be.visible');
    cy.getByTestId('character-container').should('be.visible');
  });

  it('should calculate AC and HP correctly based on ability scores', function () {
    const charId = `derived-stats-char-${this.isMobile ? 'mobile' : 'desktop'}`;
    cy.createTestCharacter(Cypress.testUser.uid, charId, {
      name: 'Derived Stats Character',
      class: { index: 'barbarian', name: 'Barbarian' }, // d12 hit die for HP test
      equipments: [], // No armor for AC test
      abilityScores: undefined,
      hit_points: undefined,
      level: 1
    });

    // Test AC calculation and HP with Barbarian (d12 hit die, no armor)
    cy.visit('/');
    cy.getByTestId(`character-card-${charId}`).click();
    cy.url().should('include', '/points');

    // Assign ability scores with high CON (for HP) and high DEX (for AC)
    cy.contains('button', 'Point Buy').next().click();
    cy.getByRole('menuitem', 'Simple').click();

    cy.selectOption('#ability-15-value', 'Constitution'); // 14 = +2 modifier for AC
    cy.selectOption('#ability-14-value', 'Dexterity'); // 14 = +2 modifier for AC
    cy.selectOption('#ability-13-value', 'Strength');
    cy.selectOption('#ability-12-value', 'Wisdom');
    cy.selectOption('#ability-10-value', 'Intelligence');
    cy.selectOption('#ability-8-value', 'Charisma');
    cy.getByTestId('save-scores').click();

    cy.url().should('include', '/character');
    cy.url().should('not.include', '/points');

    // Test: Verify the ability scores and modifiers are correct
    cy.getByTestId('ability-con').should('contain.text', '15').and('contain.text', '+2');
    cy.getByTestId('ability-dex').should('contain.text', '14').and('contain.text', '+2');

    // Test: Verify AC and HP reflect the DEX and CON modifiers
    cy.getByTestId('armor-class').should('contain.text', '12');
    cy.getByTestId('hit-points').should('contain.text', '14');
  });

  it('should be able to edit ability scores', function () {
    // Test: Create character with existing ability scores
    const testCharacter = {
      ...baseCharacter,
      id: `edit-points-char-${this.isMobile ? 'mobile' : 'desktop'}`,
      name: 'Edit Points Character',
      race: { index: 'elf', name: 'Elf' },
      abilities: [{ ability_score: { index: 'dex', name: 'DEX' }, bonus: 2 }],
      class: { index: 'wizard', name: 'Wizard' }
    };
    cy.createTestCharacter(Cypress.testUser.uid, testCharacter.id, testCharacter);

    cy.visit('/');
    cy.waitForLoading();
    cy.getByTestId('character-card-edit-points-char').click();
    cy.getByTestId('character-container').should('be.visible');

    // Test: Edit button only visible on stats step
    cy.getByTestId('stats-section').should('be.visible');
    cy.getByTestId('edit-points-edit-points-char').should('be.visible');
    cy.getByTestId('next-step').click();
    cy.getByTestId('edit-points-edit-points-char').should('not.exist');
    cy.getByTestId('previous-step').click();

    // Test: Navigate to points page via edit button
    cy.getByTestId('edit-points-edit-points-char').click();
    cy.url().should('not.include', '/points');
    cy.getByRole('presentation', 'Ability Scores').should('be.visible');

    // Test: Race modifiers are displayed
    cy.contains('Race Modifiers:').should('be.visible');
    cy.contains('DEX: +2').should('be.visible');

    // Test: Custom (random) method is default for existing characters
    cy.contains('button', 'Custom').should('be.visible');

    // Test: Ability scores are pre-filled with existing values
    cy.get('#ability-str').should('have.value', testCharacter.abilityScores.str.score);
    cy.get('#ability-dex').should('have.value', testCharacter.abilityScores.dex.score - 2); // Without race bonus
    cy.get('#ability-con').should('have.value', testCharacter.abilityScores.con.score);
    cy.get('#ability-int').should('have.value', testCharacter.abilityScores.int.score);
    cy.get('#ability-wis').should('have.value', testCharacter.abilityScores.wis.score);
    cy.get('#ability-cha').should('have.value', testCharacter.abilityScores.cha.score);

    // Test: Edit ability scores using Point Buy method
    cy.getButton('Custom').next().click();
    cy.getByRole('menuitem', 'Point Buy').click();

    // Test: Verify all abilities have their current values
    cy.get('#ability-str').invoke('val').should('not.eq', '8');
    cy.get('#ability-dex').invoke('val').should('not.eq', '8');

    // Test: Modify ability scores
    cy.get('#ability-str').clear().type('13').blur();
    cy.get('#ability-int').clear().type('15').blur();
    cy.get('#ability-wis').clear().type('14').blur();
    cy.get('#ability-cha').clear().type('8').blur();
    cy.get('#ability-con').clear().type('9').blur();
    cy.get('#ability-dex').clear().type('13').blur();

    // Test: Verify points are calculated correctly (should be valid)
    cy.contains('Remaining Points:').should('be.visible');
    cy.contains('Remaining Points:').next().should('not.contain.text', '-');

    // Test: Save modified scores
    cy.getByTestId('save-scores').should('be.enabled').click();
    cy.getByRole('status', 'Character Points Updated').should('be.visible');

    // Test: Verify redirect back to character sheet
    cy.url().should('include', '/character');
    cy.url().should('not.include', '/points');

    // Test: Verify updated ability scores  and modifieres with race modifiers
    cy.getByTestId('ability-str').should('contain.text', '13').and('contain.text', '+1');
    cy.getByTestId('ability-dex').should('contain.text', '15').and('contain.text', '+2'); // With race bonus
    cy.getByTestId('ability-con').should('contain.text', '9').and('contain.text', '-1');
    cy.getByTestId('ability-int').should('contain.text', '15').and('contain.text', '+2');
    cy.getByTestId('ability-wis').should('contain.text', '14').and('contain.text', '+2');
    cy.getByTestId('ability-cha').should('contain.text', '8').and('contain.text', '-1');

    // Test: Verify AC updated based on new DEX modifier
    cy.getByTestId('armor-class')
      .invoke('text')
      .then((newAC) => cy.wrap(parseInt(newAC)).should('eq', testCharacter.armorClass + 2));

    // Test: Navigate back to edit points and switch to Random method
    cy.getByTestId('edit-points-edit-points-char').click();
    cy.url().should('not.include', '/points');
    cy.get('#ability-str').should('have.value', '13');
    cy.get('#ability-dex').should('have.value', '13'); // Without race bonus
    cy.get('#ability-con').should('have.value', '9');
    cy.get('#ability-int').should('have.value', '15');
    cy.get('#ability-wis').should('have.value', '14');
    cy.get('#ability-cha').should('have.value', '8');

    cy.contains('button', 'Point Buy').next().click();
    cy.getByRole('menuitem', 'Custom').click();

    // Test: All abilities should be filled with current values
    cy.get('#ability-str').should('have.value', '13');
    cy.get('#ability-dex').should('have.value', '13'); // Without race bonus
    cy.get('#ability-con').should('have.value', '9');
    cy.get('#ability-int').should('have.value', '15');
    cy.get('#ability-wis').should('have.value', '14');
    cy.get('#ability-cha').should('have.value', '8');

    // Test: Test reroll functionality
    cy.get('#ability-str')
      .invoke('val')
      .then(() => {
        cy.getByTestId('reroll-str').click();
        cy.get('#ability-str').invoke('val').should('not.eq', '13');
      });

    // Test: Cancel edit by navigating back without saving
    cy.visit('/');
    cy.waitForLoading();
    cy.getByTestId('character-card-edit-points-char').click();

    // Test: Verify original values are still there (previous save is persisted)
    cy.getByTestId('ability-str').should('contain.text', '13').and('contain.text', '+1');
    cy.getByTestId('ability-dex').should('contain.text', '15').and('contain.text', '+2'); // With race bonus
    cy.getByTestId('ability-con').should('contain.text', '9').and('contain.text', '-1');
    cy.getByTestId('ability-int').should('contain.text', '15').and('contain.text', '+2');
    cy.getByTestId('ability-wis').should('contain.text', '14').and('contain.text', '+2');
    cy.getByTestId('ability-cha').should('contain.text', '8').and('contain.text', '-1');

    // Test: Edit points using Simple (Set) method
    cy.getByTestId('edit-points-edit-points-char').click();
    cy.contains('button', 'Point Buy').next().click();
    cy.getByRole('menuitem', 'Simple').click();

    // Test: All abilities should have dropdowns with standard array
    [15, 14, 13, 12, 10, 8].forEach((score) => {
      cy.get(`#ability-${score}-value`)
        .then((text) => {
          ['Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma'].forEach(
            (ability) => cy.wrap(text).should('not.contain.text', ability)
          );
        })
        .click();
      cy.getByRole('option')
        .should(
          'have.text',
          ['Intelligence', 'Dexterity', 'Wisdom', 'Strength', 'Charisma', 'Constitution'].join('')
        )
        .each(($option) => cy.wrap($option).should('not.have.attr', 'aria-disabled', 'true'));
      cy.press('Escape');
    });

    // Test: Reassign abilities
    cy.selectOption('#ability-15-value', 'Strength');
    cy.selectOption('#ability-14-value', 'Intelligence');
    cy.selectOption('#ability-13-value', 'Dexterity');
    cy.selectOption('#ability-12-value', 'Wisdom');
    cy.selectOption('#ability-10-value', 'Constitution');
    cy.selectOption('#ability-8-value', 'Charisma');

    cy.getByTestId('save-scores').click();
    cy.getByRole('status', 'Character Points Updated').should('be.visible');

    // Test: Verify newly assigned values
    cy.getByTestId('ability-str').should('contain.text', '15');
    cy.getByTestId('ability-dex').should('contain.text', '15'); // With race bonus
    cy.getByTestId('ability-int').should('contain.text', '14');
    cy.getByTestId('ability-wis').should('contain.text', '12');
    cy.getByTestId('ability-con').should('contain.text', '10');
    cy.getByTestId('ability-cha').should('contain.text', '8');

    // Test: Verify persistence after reload
    cy.reload();
    cy.getByTestId('character-container').should('be.visible');
    cy.getByTestId('ability-str').should('contain.text', '15');
    cy.getByTestId('ability-dex').should('contain.text', '15');

    cy.getByTestId('edit-points-edit-points-char').click();

    cy.get('#ability-15-value').should('have.text', 'Strength');
    cy.get('#ability-14-value').should('have.text', 'Intelligence');
    cy.get('#ability-13-value').should('have.text', 'Dexterity');
    cy.get('#ability-12-value').should('have.text', 'Wisdom');
    cy.get('#ability-10-value').should('have.text', 'Constitution');
    cy.get('#ability-8-value').should('have.text', 'Charisma');

    cy.contains('button', 'Simple').next().click();
    cy.getByRole('menuitem', 'Custom').click();
    cy.get('#ability-str').clear().type('11').blur();
    cy.contains('button', 'Custom').next().click();
    cy.getByRole('menuitem', 'Simple').click();

    cy.get('#ability-15-value').should('not.have.text', 'Strength');
    cy.get('#ability-14-value').should('not.have.text', 'Intelligence');
    cy.get('#ability-13-value').should('not.have.text', 'Dexterity');
    cy.get('#ability-12-value').should('not.have.text', 'Wisdom');
    cy.get('#ability-10-value').should('not.have.text', 'Constitution');
    cy.get('#ability-8-value').should('not.have.text', 'Charisma');
  });
});

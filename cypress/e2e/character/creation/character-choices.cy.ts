describe('Choices', () => {
  beforeEach(() => {
    cy.wrap(Cypress.config('viewportWidth') === 375).as('isMobile');
    cy.login(Cypress.testUser.uid);
    cy.visit('/');
  });

  it('Test the choices in chearacter creation', function () {
    cy.visit('/create');
    cy.getByTestId('step-label').filter('.active').should('contain.text', 'Race');

    // Test: Select race and check choices are reset when changing race
    cy.getByTestId('race-card-current').should('contain.text', 'Dragonborn');
    cy.getByTestId('race-choices-').get('label:visible:contains("Black")').click();
    cy.getByTestId('race-choices-')
      .find('label:visible:contains("Black")')
      .find('input')
      .should('be.checked');

    (this.isMobile
      ? cy.getByTestId('race-card-current').next()
      : cy.getByTestId('race-card-next', { selector: ' button' })
    ).click();
    cy.getByTestId('race-card-current').should('contain.text', 'Dwarf');
    (this.isMobile
      ? cy.getByTestId('race-card-current').prev()
      : cy.getByTestId('race-card-prev', { selector: ' button' })
    ).click();
    cy.getByTestId('race-card-current').should('contain.text', 'Dragonborn');
    cy.getByTestId('race-choices-')
      .find('label:visible:contains("Black")')
      .find('input')
      .should('not.be.checked');

    // Test: Race choice selection with skill and language (Half-elf)
    nextUntilRace('Half-elf');
    cy.get('[id^="choice-0-skill-"]').its('length').as('halfElfSkillCount', { type: 'static' });
    cy.get('#choice-0-skill-nature').click();
    cy.get('@halfElfSkillCount').then((count) => {
      cy.get('[id^="choice-0-skill-"]').should('have.length', count);
    });

    cy.get('#choice-0-skill-survival').click();
    cy.get('[id^="choice-0-skill-"]').should('have.length', 2);
    cy.get('#choice-0-skill-nature').should('be.checked');
    cy.get('#choice-0-skill-survival').should('be.checked');

    cy.get('#choice-0-skill-survival').click();
    cy.get('#choice-0-skill-survival').should('not.be.checked');
    cy.get('@halfElfSkillCount').then((count) => {
      cy.get('[id^="choice-0-skill-"]').should('have.length', count);
    });

    cy.get('#choice-0-skill-animal-handling').click();
    cy.get('[id^="choice-0-skill-"]').should('have.length', 2);
    cy.get('#choice-0-skill-nature').should('be.checked');
    cy.get('#choice-0-skill-animal-handling').should('be.checked');

    cy.get('#choice-0-gnomish').click();
    cy.get('#choice-0-dex').click();
    cy.get('#choice-0-int').click();

    cy.get('[id^="choice-0-"]').should('have.length', 5);

    cy.get('button:contains("Next"):visible').should('be.enabled').click();
    cy.getByTestId('step-label').filter('.active').should('contain.text', 'Class');

    cy.contains('(a) a greataxe or (b) any martial melee weapon')
      .closest('fieldset')
      .find('[role="progressbar"], .loading, [data-testid="loading"]')
      .should('exist');
    cy.contains('(a) a greataxe or (b) any martial melee weapon')
      .closest('fieldset')
      .find('[role="progressbar"], .loading, [data-testid="loading"]')
      .and('not.exist');

    // Test: Bundle selection with 1 resources (Cleric)
    nextUntilClass('Cleric');
    cy.get('#choice-2-crossbow-light-1').should('exist');
    cy.get('#choice-2-crossbow-bolt-20').should('exist');
    cy.get('#choice-2-mace').should('exist');

    cy.get('#choice-2-crossbow-light-1').click();
    cy.get('#choice-2-crossbow-light-1').should('be.checked');
    cy.get('#choice-2-crossbow-bolt-20').should('be.checked');
    cy.get('#choice-2-mace').should('not.exist');

    cy.get('#choice-2-crossbow-bolt-20').click();
    cy.get('#choice-2-crossbow-light-1').should('not.be.checked');
    cy.get('#choice-2-crossbow-bolt-20').should('not.be.checked');
    cy.get('#choice-2-mace').should('exist');

    cy.get('#choice-2-crossbow-bolt-20').click();
    cy.get('#choice-2-crossbow-light-1').should('be.checked');
    cy.get('#choice-2-crossbow-bolt-20').should('be.checked');
    cy.get('#choice-2-mace').should('not.exist');

    cy.get('#choice-2-crossbow-light-1').click();
    cy.get('#choice-2-crossbow-light-1').should('not.be.checked');
    cy.get('#choice-2-crossbow-bolt-20').should('not.be.checked');
    cy.get('#choice-2-mace').should('exist');

    cy.get('#choice-2-mace').click();
    cy.get('#choice-2-mace').should('be.checked');
    cy.get('#choice-2-crossbow-light-1').should('not.exist');
    cy.get('#choice-2-crossbow-bolt-20').should('not.exist');

    // Test: Test: Bundle selection without resources (Fighter)
    nextUntilClass('Fighter');
    cy.get('#choice-0-leather-armor-1').should('exist');
    cy.get('#choice-0-longbow-1').should('exist');
    cy.get('#choice-0-arrow-20').should('exist');

    cy.get('#choice-0-leather-armor-1').click();
    cy.get('#choice-0-leather-armor-1').should('be.checked');
    cy.get('#choice-0-longbow-1').should('be.checked');
    cy.get('#choice-0-arrow-20').should('be.checked');
    cy.get('#choice-0-chain-mail-1').should('not.exist');

    cy.get('#choice-0-longbow-1').click();
    cy.get('#choice-0-leather-armor-1').should('not.be.checked');
    cy.get('#choice-0-longbow-1').should('not.be.checked');
    cy.get('#choice-0-arrow-20').should('not.be.checked');
    cy.get('#choice-0-chain-mail-1').should('exist');

    // Test: Test: Bundle selection with 2 same resources (Fighter)
    cy.contains('(a) a martial weapon and a shield or (b) two martial weapons')
      .closest('fieldset')
      .within(() => {
        cy.get('#choice-1-shield-1').should('exist');
        cy.get('[id="choice-1-pike"]').should('have.length', 2);

        cy.get('#choice-1-shield-1').click();
        cy.get('#choice-1-shield-1').should('be.checked');
        cy.get('[id="choice-1-pike"]').should('have.length', 1);
        cy.get('[id^="choice-1-"]').should('have.length.above', 2);

        cy.get('#choice-1-shield-1').click();
        cy.get('[id="choice-1-pike"]').should('have.length', 2);

        cy.get('[id="choice-1-pike"]').last().click();
        cy.get('[id="choice-1-pike"]').should('have.length', 1).and('be.checked');
        cy.get('[id^="choice-1-"]').should('have.length.above', 2);
        cy.get('#choice-1-shield-1').should('not.exist');
      });

    // Test: Selection from 2 resources (Monk)
    nextUntilClass('Monk');
    cy.get('#choice-1-carpenters-tools').should('exist');
    cy.get('#choice-1-shawm').should('exist');

    cy.get('#choice-1-carpenters-tools').click();
    cy.get('#choice-1-carpenters-tools').should('be.checked');
    cy.get('#choice-1-shawm').should('not.exist');

    cy.get('#choice-1-carpenters-tools').click();
    cy.get('#choice-1-carpenters-tools').should('not.be.checked');
    cy.get('#choice-1-shawm').should('exist');

    cy.get('#choice-1-shawm').click();
    cy.get('#choice-1-shawm').should('be.checked');
    cy.get('#choice-1-carpenters-tools').should('not.exist');

    // Test: Selected skills are removed (Ranger)
    nextUntilClass('Ranger');

    cy.getByTestId('class-choices-proficiency').within(() => {
      cy.get('[id^="choice-0-skill-"]').should('exist');
      cy.get('#choice-0-skill-nature').should('not.exist');
      cy.get('#choice-0-skill-animal-handling').should('not.exist');
    });

    // Test: Selected skills are not removed from expertise (Rogue)
    nextUntilClass('Rogue');
    cy.getByTestId('class-choices-expertise').find(' #choice-0-skill-nature').should('exist');

    // Test: Finalize class selection (Fighter)
    nextUntilClass('Fighter');
    cy.get('#choice-0-leather-armor-1').click();
    cy.get('#choice-1-battleaxe').click();
    cy.get('#choice-2-handaxe-2').click();
    cy.get('#choice-0-fighter-fighting-style-defense').click();
    cy.get('#choice-3-explorers-pack-1').click();
    cy.get('#choice-0-skill-insight').click();
    cy.get('#choice-0-skill-athletics').click();

    // Test: Selected languages are removed (gnomish)
    cy.get('button:contains("Next"):visible').should('be.enabled').click();
    cy.getByTestId('step-label').filter('.active').should('contain.text', 'Background');
    cy.selectOption('#background', 'Acolyte');
    cy.getByTestId('background-selection')
      .getByRole('presentation', 'Choose Languages')
      .next()
      .within(() => {
        cy.get('[id^="choice-0-"]').should('have.length.above', 1);
        cy.get('#choice-0-gnomish').should('not.exist');
      });
  });

  // TODO-blocked: Test proficiency prerequisites
  // it.skip('should respect proficiency prerequisites', () => {
  //   // Cleric WarHammer choice only shown if Proficiency in Warhammers is already selected
  //   // No way to get this proficiency during character creation currently
  // });

  const nextUntilCard = (
    label: string,
    testId: string,
    i = 1
  ): Cypress.Chainable<JQuery<HTMLElement>> => {
    cy.get('@isMobile')
      .then((isMobile) =>
        isMobile
          ? cy.getByTestId(`${testId}-current`).next()
          : cy.getByTestId(`${testId}-next`, { selector: ' button' })
      )
      .click();
    return cy.getByTestId(`${testId}-current`).then((el) => {
      const currentLabel = el.text().trim();
      const maxReached = i >= 10;

      if (maxReached && currentLabel !== label)
        expect(currentLabel).contains(label, 'Element not found in 10 clicks');
      return currentLabel === label || maxReached
        ? cy.wrap(el)
        : nextUntilCard(label, testId, i + 1);
    });
  };
  const nextUntilRace = (label: string) => nextUntilCard(label, 'race-card');
  const nextUntilClass = (label: string) => nextUntilCard(label, 'class-card');
});

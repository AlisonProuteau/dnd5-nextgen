describe(`Character Creation End-to-End`, () => {
  // TODO: Add more detailed testing
  before(() => cy.createTestCharacter(Cypress.testUser.uid).as('characterId'));

  beforeEach(() => {
    cy.wrap(Cypress.config('viewportWidth') === 375).as('isMobile');
    cy.login(Cypress.testUser.uid);
    cy.visit('/');
  });

  after(function () {
    cy.callFirestore('delete', `users/${Cypress.testUser.uid}/characters/${this.characterId}`);
  });

  // TODO: Implement history persistency to enable this test
  it.skip('should handle browser back button during character creation workflow', function () {
    cy.getByTestId('create-character-fab').click();
    cy.url().should('include', '/create');

    // Test: Select race and move to class step
    cy.getByTestId('race-card-current').should('contain.text', 'Dragonborn');
    cy.getByTestId('race-choices-')
      .getByRole('presentation')
      .should('have.length', 1)
      .get('label:visible:contains("Black")')
      .click();
    cy.get('button:contains("Next"):visible').should('be.enabled').click();
    cy.getByTestId('step-label').filter('.active').should('contain.text', 'Class');

    // Test: Browser back button should navigate back to race step
    // cy.go('back');
    cy.get('button:contains("Back"):visible').should('be.enabled').click(); // Fix
    cy.url().should('include', '/create');
    cy.getByTestId('step-label').filter('.active').should('contain.text', 'Race');
    cy.getByTestId('race-card-current').should('contain.text', 'Dragonborn');
    cy.get('button:contains("Next"):visible').click();

    // Test: Select class and move to background
    cy.getByTestId('step-label').filter('.active').should('contain.text', 'Class');
    (this.isMobile
      ? cy.getByTestId('class-card-current').prev()
      : cy.getByTestId('class-card-prev', { selector: ' button' })
    ).click();
    cy.getByTestId('class-card-current').should('contain.text', 'Wizard');
    cy.getByTestId('class-choices-').should('have.length', 2);
    cy.getByTestId('class-choices-')
      .first()
      .within(() => {
        cy.get('label:visible:contains("Skill: Arcana")').click();
        cy.get('label:visible:contains("Skill: History")').click();
      });
    cy.getByTestId('class-choices-')
      .first()
      .next()
      .within(() => {
        cy.get('label:visible:contains("1 Dagger")').click();
        cy.get('label:visible:contains("Crystal")').click();
        cy.get('label:visible:contains("1 Scholar\'s Pack")').click();
      });
    cy.get('button:contains("Next"):visible').click();

    // Test: Browser back button from background to class
    cy.getByTestId('step-label').filter('.active').should('contain.text', 'Background');
    // cy.go('back');
    cy.get('button:contains("Back"):visible').should('be.enabled').click(); // Fix
    cy.url().should('include', '/create');
    cy.getByTestId('step-label').filter('.active').should('contain.text', 'Class');
    cy.getByTestId('class-card-current').should('contain.text', 'Wizard');

    // Test: Browser back button should work multiple times
    // cy.go('back');
    cy.get('button:contains("Back"):visible').should('be.enabled').click(); // Fix
    cy.getByTestId('step-label').filter('.active').should('contain.text', 'Race');
    cy.getByTestId('race-card-current').should('contain.text', 'Dragonborn');
    cy.getByTestId('race-choices-trait').within(() => {
      cy.get('label:visible').should('have.length', 1).should('contain.text', 'Black');
    });

    // Test: Browser back button from creation page should go to home
    cy.go('back');
    cy.url().should('eq', Cypress.config().baseUrl + '/');
    cy.getByTestId('create-character-fab').should('be.visible');
  });

  it('should complete the full character sheet happy path workflow', function () {
    cy.getByTestId('create-character-fab').click();
    cy.url().should('include', '/create');

    cy.getByTestId('character-stepper').should('be.visible');
    ['Race', 'Class', 'Background', 'Character Info'].forEach((step, index) => {
      cy.getByTestId('step-label').eq(index).should('contain.text', step);
    });

    // Test: Race Selection Step
    cy.getByTestId('step-label').filter('.active').should('contain.text', 'Race');
    cy.getByTestId('race-carousel').should('be.visible');
    cy.get('button:contains("Next"):visible').should('be.disabled');
    cy.getByTestId('race-card-').should('have.length', this.isMobile ? 1 : 3);
    cy.getByTestId('race-card-current').should('contain.text', 'Dragonborn');

    cy.getByTestId('race-card-current', { selector: ' button' }).click();
    cy.getByRole('dialog', 'Dragonborn').should('be.visible');
    cy.press('Escape');
    cy.getByRole('dialog', 'Dragonborn').should('not.exist');
    cy.get('#subraces').should('not.exist');

    cy.getByTestId('race-details').within(() => {
      cy.get('h3:contains("Description")').scrollIntoView().should('be.visible');
      cy.get('h3:contains("Characteristics")').scrollIntoView().should('be.visible');
      cy.get('h3:contains("Traits (3)")').scrollIntoView().should('be.visible');
    });
    cy.getByTestId('race-choices-')
      .getByRole('presentation')
      .should('have.length', 1)
      .should('contain.text', 'Choose traits');

    (this.isMobile
      ? cy.getByTestId('race-card-current').next()
      : cy.getByTestId('race-card-next', { selector: ' button' })
    ).click();
    cy.getByTestId('race-card-current').should('contain.text', 'Dwarf');

    cy.getByTestId('race-card-current', { selector: ' button' }).click();
    cy.getByRole('dialog', 'Dwarf').should('be.visible');
    cy.press('Escape');
    cy.getByRole('dialog', 'Dwarf').should('not.exist');
    cy.get('#subraces').should('contain.text', 'Hill Dwarf');

    cy.getByTestId('race-details').within(() => {
      cy.get('h3:contains("Description")').scrollIntoView().should('be.visible');
      cy.get('h3:contains("Characteristics")').scrollIntoView().should('be.visible');
      cy.get('h3:contains("Traits (6)")').scrollIntoView().should('be.visible');
    });
    cy.getByTestId('race-choices-')
      .getByRole('presentation')
      .should('have.length', 1)
      .should('contain.text', 'Choose proficiencies');

    cy.getByTestId('race-choices-proficiency').within(() => {
      cy.get('label:visible').should('have.length', 3);
      cy.get('label:visible:contains("Brewer\'s Supplies")').click();
      cy.get('label:visible').should('have.length', 1).should('contain.text', "Brewer's Supplies");
    });

    //TODO: Check race step details
    cy.get('button:contains("Next"):visible').should('be.enabled').click();

    // Test: Back button
    cy.getByTestId('step-label').filter('.active').should('contain.text', 'Class');
    cy.getByTestId('class-carousel').should('be.visible');
    cy.getButton('Back', ':visible').should('be.enabled').click();
    cy.getByTestId('step-label').filter('.active').should('contain.text', 'Race');
    cy.getByTestId('race-carousel').should('be.visible');
    cy.get('button:contains("Next"):visible').should('be.enabled').click();

    // Test: Class Selection Step
    cy.getByTestId('step-label').filter('.active').should('contain.text', 'Class');
    cy.getByTestId('class-carousel').should('be.visible');
    cy.get('button:contains("Next"):visible').should('be.disabled');
    cy.getByTestId('class-card-').should('have.length', this.isMobile ? 1 : 3);
    cy.getByTestId('class-card-current').should('contain.text', 'Barbarian');
    cy.get('#subclass').should('contain.text', 'Berserker');

    cy.getByTestId('class-card-current', { selector: ' button' }).click();
    cy.getByRole('dialog', 'Barbarian').should('be.visible');
    cy.press('Escape');
    cy.getByRole('dialog', 'Barbarian').should('not.exist');

    cy.getByTestId('class-details').within(() => {
      cy.get('h3:contains("Description")').scrollIntoView().should('be.visible');
      cy.get('h3:contains("Characteristics")').scrollIntoView().should('be.visible');
      cy.get('h3:contains("Features (2)")').scrollIntoView().should('be.visible');
    });
    cy.getByTestId('class-choices-')
      .getByRole('presentation')
      .should('have.length', 2)
      .should('contain.text', 'Choose proficienciesChoose equipments');

    (this.isMobile
      ? cy.getByTestId('class-card-current').prev()
      : cy.getByTestId('class-card-prev', { selector: ' button' })
    ).click();
    (this.isMobile
      ? cy.getByTestId('class-card-current').prev()
      : cy.getByTestId('class-card-prev', { selector: ' button' })
    ).click();
    (this.isMobile
      ? cy.getByTestId('class-card-current').prev()
      : cy.getByTestId('class-card-prev', { selector: ' button' })
    ).click();
    cy.getByTestId('class-card-current').should('contain.text', 'Sorcerer');

    cy.getByTestId('class-card-current', { selector: ' button' }).click();
    cy.getByRole('dialog', 'Sorcerer').should('be.visible');
    cy.press('Escape');
    cy.getByRole('dialog', 'Sorcerer').should('not.exist');
    cy.get('#subclass').should('contain.text', 'Draconic');

    cy.getByTestId('class-details').within(() => {
      cy.get('h3:contains("Description")').scrollIntoView().should('be.visible');
      cy.get('h3:contains("Characteristics")').scrollIntoView().should('be.visible');
      cy.get('h3:contains("Spellcasting")').scrollIntoView().should('be.visible');
      cy.get('h3:contains("Features (4)")').scrollIntoView().should('be.visible');
    });

    cy.getByTestId('class-choices-')
      .getByRole('presentation')
      .should('have.length', 3)
      .should('contain.text', 'Choose proficienciesChoose equipmentsChoose features');
    cy.getByTestId('class-choices-proficiency').within(() => {
      cy.get('label:visible').should('have.length', 6);
      cy.get('label:contains("Skill: Arcana")').click();
      cy.get('label:visible').should('have.length', 6);
      cy.get('label:visible:contains("Skill: Persuasion")').click();
      cy.get('label:visible')
        .should('have.length', 2)
        .should('contain.text', 'Skill: ArcanaSkill: Persuasion');
    });
    cy.getByTestId('class-choices-equipment').within(() => {
      cy.get('fieldset')
        .should('have.length', 3)
        .each((fieldset, i) => {
          cy.wrap(fieldset).within(() => {
            switch (i) {
              case 0:
                cy.get('label:visible').should('have.length', 16);
                cy.get('label:visible:contains("Quarterstaff")').click();
                cy.get('label:visible').should('have.length', 1);
                break;
              case 1:
                cy.get('label:visible').should('have.length', 6);
                cy.get('label:visible:contains("1 Component pouch")').click();
                cy.get('label:visible').should('have.length', 1);
                break;
              case 2:
                cy.get('label:visible').should('have.length', 2);
                cy.get('label:visible:contains("1 Explorer\'s Pack")').click();
                cy.get('label:visible').should('have.length', 1);
                break;
            }
          });
        });
    });
    cy.getByTestId('class-choices-feature').within(() => {
      cy.get('label:visible').should('have.length', 10);
      cy.get('label:contains("Copper")').click();
      cy.get('label:visible').should('have.length', 1);
    });

    // TODO: Check class step details
    cy.get('button:contains("Next"):visible').should('be.enabled').click();

    // Test: Background Selection Step
    cy.getByTestId('step-label').filter('.active').should('contain.text', 'Background');
    cy.selectOption('#background', 'Custom');
    cy.selectOption('#alignment', 'Lawful Good');

    // TODO: Check background step details
    cy.get('button:contains("Next"):visible').should('be.enabled').click();

    // Test: Info Selection Step
    cy.getByTestId('step-label').filter('.active').should('contain.text', 'Character Info');
    cy.get('input[name="name"], input[id="name"]').should('be.visible').type('Test Character');
    cy.get('input[name="age"], input[id="age"]').should('be.visible').type('25');

    // TODO: Check background step details
    cy.getButton('Create').should('be.enabled');

    // Test: Backward Navigation - Navigate back through all steps and verify data persistence
    cy.getButton('Back', ':visible').should('be.enabled').click();
    cy.getByTestId('step-label').filter('.active').should('contain.text', 'Background');
    cy.get('#background').should('contain.text', 'Custom');
    cy.get('#alignment').should('contain.text', 'Lawful Good');

    cy.getButton('Back', ':visible').should('be.enabled').click();
    cy.getByTestId('step-label').filter('.active').should('contain.text', 'Class');
    cy.getByTestId('class-card-current').should('contain.text', 'Sorcerer');
    cy.get('#subclass').should('contain.text', 'Draconic');
    cy.getByTestId('class-choices-proficiency').within(() => {
      cy.get('label:visible')
        .should('have.length', 2)
        .should('contain.text', 'Skill: Arcana')
        .and('contain.text', 'Skill: Persuasion');
    });
    cy.getByTestId('class-choices-equipment').within(() => {
      cy.get('label:visible')
        .should('have.length', 3)
        .should('contain.text', 'Quarterstaff')
        .and('contain.text', '1 Component pouch')
        .and('contain.text', "1 Explorer's Pack");
    });
    cy.getByTestId('class-choices-feature').within(() => {
      cy.get('label:visible').should('have.length', 1).should('contain.text', 'Copper');
    });

    cy.getButton('Back', ':visible').should('be.enabled').click();
    cy.getByTestId('step-label').filter('.active').should('contain.text', 'Race');
    cy.getByTestId('race-card-current').should('contain.text', 'Dwarf');
    cy.get('#subraces').should('contain.text', 'Hill Dwarf');
    cy.getByTestId('race-choices-proficiency').within(() => {
      cy.get('label:visible').should('have.length', 1).should('contain.text', "Brewer's Supplies");
    });

    // Test: Navigate forward again to Character Info
    cy.get('button:contains("Next"):visible').click();
    cy.getByTestId('step-label').filter('.active').should('contain.text', 'Class');
    cy.get('button:contains("Next"):visible').click();
    cy.getByTestId('step-label').filter('.active').should('contain.text', 'Background');
    cy.get('button:contains("Next"):visible').click();
    cy.getByTestId('step-label').filter('.active').should('contain.text', 'Character Info');
    cy.get('input[name="name"], input[id="name"]').should('have.value', 'Test Character');
    cy.get('input[name="age"], input[id="age"]').should('have.value', '25');

    // Test: Character Creation Submission
    cy.getButton('Create').click();
    cy.get('button:contains("Create")').should('not.exist');
    cy.getByRole('progressbar').should('be.visible');
    cy.getByRole('status', 'Character created').should('be.visible');
    cy.url().should('include', '/character');
  });
});

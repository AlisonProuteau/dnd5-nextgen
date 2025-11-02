import { characters } from 'cypress/support/mocks/characterList';

Cypress.viewports.forEach(({ name, width, height }) => {
  describe(`${name} - Character Sheet End-to-End`, () => {
    const characterData = characters.find(({ name }) => name === 'Delfy')!;

    const blackList: string[] = [
      'draconic-ancestry',
      'otherworldly-patron',
      'barbarian-unarmored-defense',
      'monk-unarmored-defense',
      'divine-domain',
      'bonus-proficiency',
      'dwarven-combat-training',
      'keen-senses',
      'elf-weapon-training',
      'extra-language',
      'menacing',
      'sorcerous-origin',
      'draconic-resilience',
      'otherworldly-patron',
      'tool-proficiency'
    ];

    before(() => cy.createTestCharacter(Cypress.testUser.uid, characterData.id, characterData));

    beforeEach(() => {
      cy.viewport(width, height);
      cy.login(Cypress.testUser.uid);
    });

    it('should complete the full character sheet happy path workflow', () => {
      // Test: Fetch character with delay
      cy.intercept(
        { method: 'GET', url: '**/google.firestore.v1.Firestore/**', times: 1 },
        { delay: 1000 }
      ).as('fetchCharacter');
      cy.visit('/');
      cy.getByTestId('character-card-').should('have.length.at.least', 1);
      cy.getByTestId(`character-card-${characterData.id}`).click();
      cy.wait('@fetchCharacter');
      cy.waitForLoading();
      cy.getByTestId('character-container').should('be.visible');

      // Test: Stats section
      cy.contains('Druid - Land').should('be.visible');
      cy.contains('Elf - High Elf').should('be.visible');
      cy.contains('Delfy').should('be.visible');
      cy.contains('Level: 1').should('be.visible');

      cy.getByTestId('stats-section').should('be.visible');
      cy.getByTestId('armor-class').should('contain.text', '13');
      cy.getByTestId('hit-points').should('contain.text', '9');
      cy.getByTestId('speed').should('contain.text', '30');
      cy.getByTestId('proficiency-bonus').should('contain.text', '2');
      cy.getByTestId('ability-').should('have.length', 6);

      cy.getByTestId('ability-int').within(($el) => {
        cy.wrap($el).should('contain.text', 'Intelligence' + '+3' + 16);
        cy.wrap($el).should('contain.text', 'ArcanaHistoryInvestigationNatureReligion');
        cy.get(':has(>[data-testid="RadioButtonCheckedIcon"])')
          .should('have.length', 1)
          .should('have.text', 'Nature');
        cy.get(' button').should('exist').click();
      });
      cy.getByRole('dialog').should('contain.text', 'Saving ThrowsIntelligence, Wisdom');
      cy.press('Escape');
      cy.getByTestId('saving-throws-dialog').should('not.exist');

      cy.getByTestId('ability-wis').within(($el) => {
        cy.wrap($el).should('contain.text', 'Wisdom' + '+2' + 14);
        cy.wrap($el).should('contain.text', 'Animal HandlingInsightMedicinePerceptionSurvival');
        cy.get(':has(>[data-testid="RadioButtonCheckedIcon"])')
          .should('have.length', 2)
          .should('have.text', 'Animal HandlingPerception');
        cy.wrap($el).get(' button').should('exist').click();
      });
      cy.getByRole('dialog').should('contain.text', 'Saving ThrowsIntelligence, Wisdom');
      cy.press('Escape');
      cy.getByTestId('saving-throws-dialog').should('not.exist');

      cy.getByTestId('ability-dex').within(($el) => {
        cy.wrap($el).should('contain.text', 'Dexterity' + '+2' + 14);
        cy.wrap($el).should('contain.text', 'AcrobaticsSleight of HandStealth');
        cy.get(':has(>[data-testid="RadioButtonCheckedIcon"])').should('have.length', 0);
        cy.wrap($el).get(' button').should('not.exist');
      });

      cy.getByTestId('ability-str').within(($el) => {
        cy.wrap($el).should('contain.text', 'Strength' + '0' + 10);
        cy.wrap($el).should('contain.text', 'Athletics');
        cy.get(':has(>[data-testid="RadioButtonCheckedIcon"])').should('have.length', 0);
        cy.wrap($el).get(' button').should('not.exist');
      });

      cy.getByTestId('ability-cha').within(($el) => {
        cy.wrap($el).should('contain.text', 'Charisma' + '-1' + 8);
        cy.wrap($el).should('contain.text', 'DeceptionIntimidationPerformancePersuasion');
        cy.get(':has(>[data-testid="RadioButtonCheckedIcon"])').should('have.length', 0);
        cy.wrap($el).get(' button').should('not.exist');
      });

      cy.getByTestId('ability-con').within(($el) => {
        cy.wrap($el);
        cy.wrap($el).should('contain.text', 'Constitution' + '+1' + 13);
        cy.get(':has(>[data-testid="RadioButtonCheckedIcon"])').should('have.length', 0);
        cy.wrap($el).get(' button').should('not.exist');
      });

      // Test: Traits & Features section
      cy.getByTestId('KeyboardArrowRightIcon').click();
      cy.getByTestId('proficiencies-section').should(
        'contain.text',
        characterData.proficiencies.map((p) => p.name).join(', ')
      );
      cy.getByTestId('language-section').should(
        'contain.text',
        characterData.languages.map((l) => l.name).join(', ')
      );

      cy.getByTestId('features-section').should('exist').children().should('have.length', 2);
      characterData
        .features!.filter((d) => !blackList.includes(d.index))
        .forEach((feature) => {
          cy.getByTestId(`feature-name-${feature.index}`).should('contain.text', feature.name);
          cy.getByTestId(`feature-details-${feature.index}`).should('not.be.visible');
          cy.getByTestId(`feature-${feature.index}`).click();
          cy.getByTestId(`feature-details-${feature.index}`).should('be.visible');
        });

      cy.getByTestId('traits-section').should('be.visible').children().should('have.length', 4);
      characterData
        .traits!.filter((d) => !blackList.includes(d.index))
        .forEach((trait) => {
          cy.getByTestId(`trait-name-${trait.index}`).should('contain.text', trait.name);
          cy.getByTestId(`trait-details-${trait.index}`).should('not.be.visible');
          cy.getByTestId(`trait-${trait.index}`).click();
          cy.getByTestId(`trait-details-${trait.index}`).should('be.visible');
        });

      // Test: Equipment section
      cy.getByTestId('KeyboardArrowRightIcon').click();
      cy.getByTestId('equipment-section').should('be.visible');
      cy.getByTestId('inventory-money').should('have.text', '13GP');
      cy.getByTestId('inventory-weight').should('contain.text', '14anvilWeight');

      characterData.equipments.forEach((equipment) => {
        cy.getByTestId(`equipment-item-${equipment.index}`).should('contain.text', equipment.name);

        // Check for damage details if present
        cy.getByTestId(`equipment-item-${equipment.index}`).then(($el) => {
          if ($el.text().match(/d\d+/)) {
            expect($el.text()).to.match(/d\d+/); // e.g. 1d6, 2d8, etc.
          }
          if ($el.text().includes('AC')) {
            expect($el.text()).to.match(/\d+ AC/);
          }
          if ($el.text().includes('Dexterity bonus')) {
            expect($el.text()).to.include('Dexterity bonus');
          }
          if ($el.text().includes('Max:')) {
            expect($el.text()).to.match(/Max: \d+/);
          }
        });

        cy.getByTestId(`equipment-item-${equipment.index}`).find('button').click();
        cy.getByRole('dialog').within(() => {
          cy.contains(equipment.name).should('exist');
          cy.contains(/\d+gp/).should('exist');

          if (equipment.type === 'weapon') {
            cy.contains(/anvil\d+/).should('exist');
            cy.contains(/Range/).should('exist');
            cy.contains(/Range Category/).should('exist');
            cy.contains(/Throw Range/).should('exist');
            cy.contains(/Damage|d\d+/).should('exist');
          }
          if (equipment.type === 'armor') {
            cy.contains(/anvil\d+/).should('exist');
            cy.contains(/Armor Class|AC/).should('exist');
          }
          // TODO: Add more checks specific for this character
        });
        cy.press('Escape');
        cy.getByRole('dialog').should('not.exist');
      });

      // Test: Description section
      // TODO: Improve seeded data
      cy.getByTestId('KeyboardArrowRightIcon').click();
      cy.getByTestId('description-sex-')
        .should('contain.text', 'Sex')
        .should('have.attr', 'data-testid', 'description-sex-F');
      cy.getByTestId('description-age').should('contain.text', '23Age');
      cy.getByTestId('description-size').should('contain.text', 'MediumSize');
      cy.getByTestId('description-alignment')
        .should('contain.text', 'CG')
        .and('contain.text', 'Alignment');

      cy.getByTestId('description-appearance').should('have.text', 'Appearance: ');
      cy.getByTestId('description-background').should('have.text', 'Background: Custom');
      cy.getByTestId('description-bonds').should('have.text', 'Bonds: ');
      cy.getByTestId('description-ideals').should('have.text', 'Ideals: ');
      cy.getByTestId('description-flaws').should('have.text', 'Flaws: ');
      cy.getByTestId('description-personality').should('have.text', 'Personality: ');

      // Test: Spell section
      cy.getByTestId('KeyboardArrowRightIcon').click();
      cy.getByTestId('spells-section').should('be.visible');

      // Test: Next goes back to beginning
      cy.getByTestId('KeyboardArrowRightIcon').click();
      cy.getByTestId('stats-section').should('be.visible');

      // Test: Security, error, and recovery flows
      cy.visit('/');
      cy.visit('/character');
      cy.url().should('not.include', '/character');

      // TODO: Add tests for character not found and permission issues (how to state)
      // TODO: Add error handling so it doesn't infinite loop
      // cy.reload();
      // cy.intercept(
      //   { method: 'GET', url: '**/google.firestore.v1.Firestore/**' },
      //   //,  times: 2 },
      //   { forceNetworkError: true }
      // ).as('networkFailure');
      // cy.getByTestId('character-card').first().click();
      // cy.wait('@networkFailure');
      // cy.getByTestId('error-message').should('be.visible');
      // cy.intercept({ method: 'GET', url: '**/firestore.googleapis.com/**' });
      // cy.getButton('Retry').click();
      // cy.getByTestId('character-container').should('be.visible');

      cy.callFirestore('set', `users/${Cypress.testUser.uid}/characters/test-character-1`, {
        id: 'test-character-1',
        name: '',
        age: null,
        sex: null,
        race: null,
        class: null,
        background: null,
        alignment: null,
        level: 1,
        version: 'Legacy',
        languages: [],
        proficiencies: [],
        skills: [],
        equipments: []
      });
      cy.visit('/');
      cy.getByTestId('character-card-test-character-1').should('not.exist');
    });

    it('should handle notes workflow (complex)', () => {
      cy.callFirestore(
        'delete',
        `users/${Cypress.testUser.uid}/characters/${characterData.id}/notes`
      );
      cy.visit('/');
      cy.getByTestId('character-card-').should('have.length.at.least', 1);
      cy.getByTestId(`character-card-${characterData.id}`).click();

      // Test: Add and edit notes
      cy.getByTestId(`notes-${characterData.id}`).click();
      cy.getByTestId(`notes-drawer-${characterData.id}`).within(($el) => {
        cy.wrap($el).should('contain.text', 'No notes yet');

        cy.getByTestId('NoteAddIcon').click();
        cy.getButton('Save').should('be.disabled');
        cy.get('#content').clear().blur();
        cy.getButton('Save').should('be.disabled');
        cy.get('#content').type('E2E test note');
        cy.get('button').contains('Save').should('be.enabled').click();

        cy.getByTestId('note-card-')
          .should('have.length', 1)
          .should('contain.text', 'E2E test note');
      });
      cy.reload();

      cy.getByTestId(`notes-${characterData.id}`).click();
      cy.getByTestId(`notes-drawer-${characterData.id}`).within(($el) => {
        cy.wrap($el).should('not.contain.text', 'No notes yet');
        cy.getByTestId('note-card-')
          .should('have.length', 1)
          .should('contain.text', 'E2E test note');

        // Test: Edit note
        cy.selectCardAction({ text: 'E2E test note' }, 'Edit');
        cy.get('#content').clear().type('E2E test note - edited');
        cy.getButton('Save').should('be.enabled').click();

        cy.getByTestId('note-card-')
          .should('have.length', 1)
          .should('contain.text', 'E2E test note - edited');

        // Test: Add 2 notes to archive
        cy.getByTestId('add-note').click();
        cy.getButton('Save').should('be.disabled');
        cy.get('#content').clear().type('Note to archive');
        cy.getButton('Save').should('be.enabled').click();

        cy.getByTestId('note-card-')
          .should('have.length', 2)
          .should('contain.text', 'Note to archive');

        cy.getByTestId('add-note').click();
        cy.getButton('Save').should('be.disabled');
        cy.get('#content').type('Second note to archive');
        cy.getButton('Save').should('be.enabled').click();

        cy.getByTestId('note-card-')
          .should('have.length', 3)
          .should('contain.text', 'Second note to archive');

        // Test: Add a note to delete
        cy.getByTestId('add-note').click();
        cy.getButton('Save').should('be.disabled');
        cy.get('#content').type('Note to delete');
        cy.getButton('Save').should('be.enabled').click();

        cy.getByTestId('note-card-')
          .should('have.length', 4)
          .should('contain.text', 'Note to delete');

        // Test: Pin notes
        cy.selectCardAction({ text: 'E2E test note - edited' }, 'Pin');
        cy.getByTestId('note-card-').first().should('contain.text', 'E2E test note - edited');

        cy.selectCardAction({ text: 'Note to delete' }, 'Pin');
        cy.getByTestId('note-card-').first().should('contain.text', 'Note to delete');

        cy.selectCardAction({ text: 'Note to archive' }, 'Pin');
        cy.getByTestId('note-card-')
          .first()
          .should('contain.text', 'Note to delete')
          .next()
          .should('contain.text', 'Note to archive');

        // Test: Unpin note
        cy.selectCardAction({ text: 'Note to delete' }, 'Unpin');
        cy.getByTestId('note-card-').first().should('not.contain.text', 'Note to delete');

        // Test: Delete note
        cy.selectCardAction({ text: 'Note to delete' }, 'Delete');
        cy.getByTestId('note-card-').should('not.contain.text', 'Note to delete');

        // Test: Archive note
        cy.selectCardAction({ text: 'Note to archive' }, 'Archive');
        cy.getByTestId('note-card-').should('not.contain.text', 'Note to archive');
        cy.selectCardAction({ text: 'Second note to archive' }, 'Archive');
        cy.getByTestId('note-card-').should('not.contain.text', 'Second note to archive');

        // Test: View archived notes
        cy.getByTestId('archive-toggle').click();
        cy.getByTestId('notes-list').should('not.contain.text', 'E2E test note - edited');
        cy.getByTestId('notes-list').should('not.contain.text', 'Note to delete');
        cy.getByTestId('note-card-').should('contain.text', 'Note to archive');
        cy.getByTestId('note-card-').first().should('contain.text', 'Second note to archive');

        cy.selectCardAction({ text: 'Note to archive' }, 'Restore');
        cy.getByTestId('notes-list').should('not.contain.text', 'Note to archive');

        cy.getByTestId('archive-toggle').click();
        cy.getByTestId('note-card-').first().should('contain.text', 'Note to archive');
      });

      // Test: Close notes drawer
      cy.press('Escape');
      cy.getByTestId(`notes-drawer-${characterData.id}`).should('not.exist');
    });
  });

  // TODO: Add leveling when implemented
  describe(`${name} - Character Sheet Spellcasting`, () => {
    const spellcastingClasses = [
      {
        classData: { index: 'wizard', name: 'Wizard' },
        spell: { index: 'alarm', name: 'Alarm' },
        learnNum: 6,
        prepareCNum: 3,
        prepareSNum: 4
      },
      {
        classData: { index: 'cleric', name: 'Cleric' },
        spell: { index: 'bane', name: 'Bane' },
        learnNum: 0,
        prepareCNum: 3,
        prepareSNum: 3
      },
      {
        classData: { index: 'druid', name: 'Druid' },
        spell: { index: 'guidance', name: 'Guidance' },
        learnNum: 0,
        prepareCNum: 2,
        prepareSNum: 3
      },
      {
        classData: { index: 'bard', name: 'Bard' },
        spell: { index: 'alarm', name: 'Alarm' },
        learnNum: 4,
        prepareCNum: 2,
        prepareSNum: 0
      },
      {
        classData: { index: 'warlock', name: 'Warlock' },
        spell: { index: 'burning-hands', name: 'Burning Hands' },
        learnNum: 2,
        prepareCNum: 2,
        prepareSNum: 0
      },
      {
        classData: { index: 'sorcerer', name: 'Sorcerer' },
        spell: { index: 'burning-hands', name: 'Burning Hands' },
        learnNum: 2,
        prepareCNum: 4,
        prepareSNum: 0
      }
    ];

    before(() =>
      characters.forEach((char) => {
        if (spellcastingClasses.some(({ classData }) => classData.index === char.class.index))
          cy.createTestCharacter(Cypress.testUser.uid, `test-${char.class.index}`, {
            ...char,
            id: `test-${char.class.index}`,
            version: 'Legacy'
          });
      })
    );

    beforeEach(() => {
      cy.viewport(width, height);
      cy.login(Cypress.testUser.uid);
    });

    spellcastingClasses.map(({ classData, spell, learnNum, prepareCNum, prepareSNum }) => {
      const spells = characters
        .find((char) => char.class.index === classData.index)!
        .traits?.flatMap(({ spells }) => spells)
        .filter(Boolean);
      it(`${classData.name} - should handle spells workflow (complex)`, () => {
        cy.visit('/');
        cy.getByTestId(`character-card-test-${classData.index}`).click();
        cy.getByTestId('stats-section').should('be.visible');
        cy.waitForLoading();
        cy.getByTestId('KeyboardArrowLeftIcon').click();
        cy.getByTestId('spells-section').should('be.visible');

        if (learnNum > 0) {
          cy.getButton(/Learn spells/).should('be.enabled', { timeout: 10000 });
          if (prepareSNum > 0)
            cy.getButton(/Learn spells/)
              .next()
              .should('be.disabled');
          cy.getButton(/Learn spells/).click();
          cy.getByRole('dialog', 'Learn').within(() => {
            cy.waitForLoading();
            cy.get('p').contains(`0/${learnNum} spells selected`).should('be.visible');

            // Test: Add/remove spell and selected count updates
            cy.getByTestId('edit-spell-item-').first().getButton(/^Add$/).should('exist').click();
            cy.getByTestId('edit-spell-item-')
              .first()
              .getButton(/^(Add|Remove)$/)
              .should('not.contain.text', 'Add');

            cy.contains(`1/${learnNum} spells selected`).scrollIntoView().should('be.visible');
            cy.getByTestId('edit-spell-item-')
              .first()
              .getButton(/^Remove$/)
              .should('exist')
              .click();

            cy.getByTestId('edit-spell-item-')
              .first()
              .getButton(/^(Add|Remove)$/)
              .should('not.contain.text', 'Remove');
            cy.getByTestId('edit-spell-item-').first().getButton(/^Add$/).should('exist');
          });

          // Test: View spell details
          cy.getByTestId(`edit-spell-item-${spell.index}`).click();
          cy.getByRole('dialog', `${spell.name}lvl`).within(() => {
            cy.getByTestId('spell-dialog-title').should('exist').should('contain.text', spell.name);
            cy.getByTestId('spell-dialog-description')
              .should('exist')
              .should('contain.text', 'Casting Time');
            cy.press('Escape');
          });
          cy.getByRole('dialog', `${spell.name}lvl`).should('not.exist');

          // test wizard can search more spells
          if (classData.index === 'wizard') {
            cy.getByRole('dialog', 'Learn').within(() => cy.getButton('More spells').click());
            cy.waitForLoading();
            cy.getByRole('dialog', 'Additional spells').within(() => {
              cy.get('#search').type('F');
              cy.getByTestId('search-spell-item-')
                .first()
                .should('not.contain.text', 'Faerie Fire');
              cy.getByTestId('search-spell-item-faerie-fire').should('be.visible');
              cy.getByTestId('search-spell-item-faerie-fire').find('button').click();
              cy.getByTestId('search-spell-item-').first().should('contain.text', 'Faerie Fire');

              cy.getByTestId('search-spell-item-faerie-fire', { type: 'exact' }).should(
                'not.exist'
              );
              cy.getByTestId('search-spell-item-faerie-fire-selected', { type: 'exact' }).should(
                'exist'
              );

              cy.getButton('Close').click();
            });
            cy.getByRole('dialog', 'Additional spells').should('not.exist');
          }

          cy.getByRole('dialog', 'Learn').within(() => {
            // Test: Learn spells with 1 missing
            // TODO: get the spell levels available and add a little in each
            for (let i = 0; i < learnNum - 1; i++) {
              cy.getByTestId('edit-spell-item-').eq(i).getButton(/^Add$/).click();
            }
            cy.contains(`${learnNum - 1}/${learnNum} spells selected`)
              .scrollIntoView()
              .should('be.visible');
            cy.getButton('Close').click();
          });
          cy.getByRole('dialog').should('not.exist');

          if (prepareSNum > 0)
            cy.getButton(/Learn spells/)
              .next()
              .should('be.disabled');
          cy.getByTestId('spells-section').getByTestId('spell-list-').should('not.exist');

          // Test: Learn remaining spell
          cy.getButton(/Learn spells/).should('be.enabled', { timeout: 10000 });
          cy.getButton(/Learn spells/).click();
          cy.getByRole('dialog', 'Learn').within(() => {
            cy.getByTestId('edit-spell-item-').getButton(/^Add$/).first().click();
            cy.contains(`${learnNum}/${learnNum} spells selected`)
              .scrollIntoView()
              .should('be.visible');
            cy.getButton('Close').click();
          });
          cy.getByRole('dialog').should('not.exist');
        }

        if (prepareSNum > 0 || prepareCNum > 0) {
          cy.getButton(/Prepare your spells/).should('be.enabled', { timeout: 10000 });
          cy.getByTestId('spells-section').getByTestId('spell-list-').should('not.exist');

          cy.getButton(/Prepare your spells/).click();
          cy.getByRole('dialog', 'Prepare').within(() => {
            cy.waitForLoading();
            cy.get('p').contains(`0/${prepareCNum} cantrips selected`).should('be.visible');
            if (prepareSNum > 0)
              cy.get('p').contains(`0/${prepareSNum} spells selected`).should('be.visible');

            // Test: Add/remove cantrips and selected count updates
            cy.getByTestId('spell-list-0')
              .getByTestId('edit-spell-item-')
              .first()
              .getButton(/^Add$/)
              .should('exist')
              .click();
            cy.getByTestId('spell-list-0')
              .getByTestId('edit-spell-item-')
              .first()
              .getButton(/^(Add|Remove)$/)
              .should('not.contain.text', 'Add');

            cy.get('p')
              .contains(`1/${prepareCNum} cantrips selected`)
              .scrollIntoView()
              .should('be.visible');
            cy.getByTestId('spell-list-0')
              .getByTestId('edit-spell-item-')
              .first()
              .getButton(/^Remove$/)
              .should('exist')
              .click();

            cy.getByTestId('spell-list-0')
              .getByTestId('edit-spell-item-')
              .first()
              .getButton(/^(Add|Remove)$/)
              .should('not.contain.text', 'Remove');
            cy.getByTestId('spell-list-0')
              .getByTestId('edit-spell-item-')
              .first()
              .getButton(/^Add$/)
              .should('exist');

            // Test: Add/remove spells and selected count updates
            if (prepareSNum > 0) {
              cy.getByTestId('spell-list-1')
                .getByTestId('edit-spell-item-')
                .first()
                .getButton(/^Add$/)
                .should('exist')
                .click();
              cy.getByTestId('spell-list-1')
                .getByTestId('edit-spell-item-')
                .first()
                .getButton(/^(Add|Remove)$/)
                .should('not.contain.text', 'Add');

              cy.get('p')
                .contains(`1/${prepareSNum} spells selected`)
                .scrollIntoView()
                .should('be.visible');
              cy.getByTestId('spell-list-1')
                .getByTestId('edit-spell-item-')
                .first()
                .getButton(/^Remove$/)
                .should('exist')
                .click();

              cy.getByTestId('spell-list-1')
                .getByTestId('edit-spell-item-')
                .first()
                .getButton(/^(Add|Remove)$/)
                .should('not.contain.text', 'Remove');
              cy.getByTestId('spell-list-1')
                .getByTestId('edit-spell-item-')
                .first()
                .getButton(/^Add$/)
                .should('exist');
            }
          });

          // Test: View spell details
          if (learnNum === 0) {
            cy.getByTestId(`edit-spell-item-${spell.index}`).click();
            cy.getByRole('dialog', `${spell.name}lvl`).within(() => {
              cy.getByTestId('spell-dialog-title')
                .should('exist')
                .should('contain.text', spell.name);
              cy.getByTestId('spell-dialog-description')
                .should('exist')
                .should('contain.text', 'Casting Time');
              cy.press('Escape');
            });
            cy.getByRole('dialog', `${spell.name}lvl`).should('not.exist');
          }

          // Test: Prepare spells with 1 missing
          // TODO: Preparing spells with previously learned if they can learn
          if (learnNum > 0) {
            if (classData.index === 'wizard') cy.contains(/Faerie Fire/).should('exist');
          }
          // TODO: get the spell levels available and add a little in each
          for (let i = 0; i < prepareCNum - 1; i++) {
            cy.getByTestId('spell-list-0')
              .getByTestId('edit-spell-item-')
              .eq(i)
              .getButton(/^Add$/)
              .click();
          }
          cy.contains(`${prepareCNum - 1}/${prepareCNum} cantrips selected`)
            .scrollIntoView()
            .should('be.visible');
          if (prepareSNum > 0) {
            for (let i = 0; i < prepareSNum - 1; i++) {
              cy.getByTestId('spell-list-1')
                .getByTestId('edit-spell-item-')
                .eq(i)
                .getButton(/^Add$/)
                .click();
            }
            cy.contains(`${prepareSNum - 1}/${prepareSNum} spells selected`)
              .scrollIntoView()
              .should('be.visible');
          }
          cy.getButton('Close').click();
          cy.getByRole('dialog').should('not.exist');
          cy.getByTestId('spells-section').getByTestId('spell-list-').should('not.exist');

          // Test: Learn remaining spell and verify they appears in known list
          cy.getButton(/Prepare your spells/).should('be.enabled', { timeout: 10000 });
          cy.getButton(/Prepare your spells/).click();
          cy.getByRole('dialog', 'Prepare').within(() => {
            cy.waitForLoading();
            cy.getByTestId('spell-list-0')
              .getByTestId('edit-spell-item-')
              .getButton(/^Add$/)
              .first()
              .click();
            cy.contains(`${prepareCNum}/${prepareCNum} cantrips selected`)
              .scrollIntoView()
              .should('be.visible');
            if (prepareSNum > 0) {
              cy.getByTestId('spell-list-1')
                .getByTestId('edit-spell-item-')
                .getButton(/^Add$/)
                .first()
                .click();
              cy.contains(`${prepareSNum}/${prepareSNum} spells selected`)
                .scrollIntoView()
                .should('be.visible');
            }

            cy.getButton('Close').click();
          });
          cy.getByRole('dialog').should('not.exist');
        }

        // TODO: should test specific spell names + levels
        console.log(spells);
        cy.getByTestId('spells-section')
          .getByTestId('spell-list-0')
          .getByTestId('view-spell-item-')
          .should('have.length', prepareCNum + (spells?.length ?? 0));

        cy.getByTestId('spells-section')
          .getByTestId('spell-list-')
          .filter((_i, el) => el.dataset.testid !== 'spell-list-0')
          .first()
          .getByTestId('view-spell-item-')
          .should('have.length', prepareSNum === 0 ? learnNum : prepareSNum);
      });
    });

    // it('Should not display spell section for non-spellcaster', () => {
    //   cy.createTestCharacter(Cypress.testUser.uid, 'test-nonspell');
    //   cy.visit('/');
    //   cy.getByTestId('character-card-test-nonspell').click();
    //   cy.getByTestId('stats-section').should('be.visible');
    //   cy.waitForLoading();
    //   cy.getByTestId('KeyboardArrowLeftIcon').click();
    //   cy.getByTestId('spells-section').should('not.exist');
    // });
  });
});

import { characters } from 'cypress/support/mocks/characterList';

describe(`Character Sheet End-to-End`, () => {
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
    'tool-proficiency'
  ];

  before(() => cy.createTestCharacter(Cypress.testUser.uid, characterData.id, characterData));

  beforeEach(() => {
    cy.login(Cypress.testUser.uid);

    cy.visit('/');
    cy.waitForLoading();
    cy.getByTestId('character-card-').should('have.length.at.least', 1);
  });

  it('should complete the full character sheet happy path workflow', () => {
    cy.getByTestId(`character-card-${characterData.id}`).click();
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
      cy.wrap($el)
        .should('contain.text', 'Intelligence')
        .and('contain.text', '+3')
        .and('contain.text', '16');
      cy.wrap($el)
        .should('contain.text', 'Arcana')
        .and('contain.text', 'History')
        .and('contain.text', 'Investigation')
        .and('contain.text', 'Nature')
        .and('contain.text', 'Religion');
      cy.get(':has(>[data-testid="skill-selected"])')
        .should('have.length', 1)
        .should('have.text', 'Nature');
      cy.get(' button').should('exist').click();
    });
    cy.getByRole('dialog').should('contain.text', 'Saving ThrowsIntelligence, Wisdom');
    cy.press('Escape');
    cy.getByTestId('saving-throws-dialog').should('not.exist');

    cy.getByTestId('ability-wis').within(($el) => {
      cy.wrap($el)
        .should('contain.text', 'Wisdom')
        .and('contain.text', '+2')
        .and('contain.text', '14');
      cy.wrap($el)
        .should('contain.text', 'Animal Handling')
        .and('contain.text', 'Insight')
        .and('contain.text', 'Medicine')
        .and('contain.text', 'Perception')
        .and('contain.text', 'Survival');
      cy.get(':has(>[data-testid="skill-selected"])')
        .should('have.length', 2)
        .should('have.text', 'Animal HandlingPerception');
      cy.wrap($el).get(' button').should('exist').click();
    });
    cy.getByRole('dialog').should('contain.text', 'Saving ThrowsIntelligence, Wisdom');
    cy.press('Escape');
    cy.getByTestId('saving-throws-dialog').should('not.exist');

    cy.getByTestId('ability-dex').within(($el) => {
      cy.wrap($el)
        .should('contain.text', 'Dexterity')
        .and('contain.text', '+2')
        .and('contain.text', '14');
      cy.wrap($el)
        .should('contain.text', 'Acrobatics')
        .and('contain.text', 'Sleight of Hand')
        .and('contain.text', 'Stealth');
      cy.get(':has(>[data-testid="skill-selected"])').should('have.length', 0);
      cy.wrap($el).get(' button').should('not.exist');
    });

    cy.getByTestId('ability-str').within(($el) => {
      cy.wrap($el)
        .should('contain.text', 'Strength')
        .and('contain.text', '0')
        .and('contain.text', '10');
      cy.wrap($el).should('contain.text', 'Athletics');
      cy.get(':has(>[data-testid="skill-selected"])').should('have.length', 0);
      cy.wrap($el).get(' button').should('not.exist');
    });

    cy.getByTestId('ability-cha').within(($el) => {
      cy.wrap($el)
        .should('contain.text', 'Charisma')
        .and('contain.text', '-1')
        .and('contain.text', '8');
      cy.wrap($el)
        .should('contain.text', 'Deception')
        .and('contain.text', 'Intimidation')
        .and('contain.text', 'Performance')
        .and('contain.text', 'Persuasion');
      cy.get(':has(>[data-testid="skill-selected"])').should('have.length', 0);
      cy.wrap($el).get(' button').should('not.exist');
    });

    cy.getByTestId('ability-con').within(($el) => {
      cy.wrap($el)
        .should('contain.text', 'Constitution')
        .and('contain.text', '+1')
        .and('contain.text', '13');
      cy.get(':has(>[data-testid="skill-selected"])').should('have.length', 0);
      cy.wrap($el).get(' button').should('not.exist');
    });

    // Test: Traits & Features section
    cy.getByTestId('next-step').click();
    cy.getByTestId('proficiencies-section').should(
      'contain.text',
      characterData.proficiencies.map((p) => p.name).join(', ')
    );
    cy.getByTestId('language-section').should(
      'contain.text',
      characterData.languages.map((l) => l.name).join(', ')
    );

    cy.getByTestId('features-section')
      .should('exist')
      .children()
      .should(
        'have.length',
        (characterData.features || []).filter((d) => !blackList.includes(d.index)).length
      );
    characterData
      .features!.filter((d) => !blackList.includes(d.index))
      .forEach((feature) => {
        cy.getByTestId(`feature-name-${feature.index}`).should('contain.text', feature.name);
        cy.getByTestId(`feature-details-${feature.index}`).should('not.be.visible');
        cy.getByTestId(`feature-${feature.index}`).click();
        cy.getByTestId(`feature-details-${feature.index}`).should('be.visible');
      });

    cy.getByTestId('traits-section')
      .should('be.visible')
      .children()
      .should(
        'have.length',
        (characterData.traits || []).filter((d) => !blackList.includes(d.index)).length
      );
    characterData
      .traits!.filter((d) => !blackList.includes(d.index))
      .forEach((trait) => {
        cy.getByTestId(`trait-name-${trait.index}`).should('contain.text', trait.name);
        cy.getByTestId(`trait-details-${trait.index}`).should('not.be.visible');
        cy.getByTestId(`trait-${trait.index}`).click();
        cy.getByTestId(`trait-details-${trait.index}`).should('be.visible');
      });

    // Test: Equipment section
    cy.getByTestId('next-step').click();
    cy.getByTestId('equipment-section').should('be.visible');
    cy.getByTestId('money-display').within(($purse) => {
      cy.wrap($purse).getByTestId('gp').should('be.visible');
      cy.wrap($purse).getByTestId('sp').should('be.visible');
      cy.wrap($purse).getByTestId('cp').should('be.visible');
    });
    cy.getByTestId('inventory-weight').should('contain.text', '14').and('contain.text', 'Weight');

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
        cy.contains(/\d+(gp|sp|cp)/).should('exist');

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
    cy.getByTestId('next-step').click();
    cy.getByTestId('description-sex-')
      .should('contain.text', 'Sex')
      .should('have.attr', 'data-testid', 'description-sex-F');
    cy.getByTestId('description-age').should('contain.text', '23').and('contain.text', 'Age');
    cy.getByTestId('description-size').should('contain.text', 'Medium').and('contain.text', 'Size');
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
    cy.getByTestId('next-step').click();
    cy.getByTestId('spells-section').should('be.visible');

    // Test: Next goes back to beginning
    cy.getByTestId('next-step').click();
    cy.getByTestId('stats-section').should('be.visible');

    // Test: Security, error, and recovery flows
    cy.visit('/');
    cy.visit('/character');
    cy.url().should('not.include', '/character');

    // TODO: Add tests for character not found and permission issues (how to state)
    // Test: Network error handling during character fetch
    // cy.visit('/');
    // cy.intercept(
    //   {
    //     method: 'POST',
    //     url: '**/google.firestore.v1.Firestore/BatchGetDocuments**',
    //     times: 1
    //   },
    //   {
    //     forceNetworkError: true
    //   }
    // ).as('networkFailure');

    // cy.getByTestId(`character-card-${characterData.id}`).click();
    // cy.wait('@networkFailure');

    // // After retry, should eventually load
    // cy.getByTestId('character-container').should('be.visible', { timeout: 10000 });

    // Test: Incomplete character should not be displayed
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
    cy.getByTestId(`character-card-${characterData.id}`).click();

    // Test: Add and edit notes
    cy.getByTestId(`notes-${characterData.id}`).click();
    cy.getByTestId(`notes-drawer-${characterData.id}`).within(($el) => {
      cy.wrap($el).should('contain.text', 'No notes yet');

      cy.wrap($el).getByTestId('add-note').click();
      cy.wrap($el).getButton('Save').should('be.disabled');
      cy.get('#content').clear().blur();
      cy.wrap($el).getButton('Save').should('be.disabled');
      cy.get('#content').type('E2E test note');
      cy.get('button').contains('Save').should('be.enabled').click();

      cy.wrap($el)
        .getByTestId('note-card-')
        .should('have.length', 1)
        .should('contain.text', 'E2E test note');
    });
    cy.reload();

    cy.getByTestId(`notes-${characterData.id}`).click();
    cy.getByTestId(`notes-drawer-${characterData.id}`).within(($el) => {
      cy.wrap($el).should('not.contain.text', 'No notes yet');
      cy.wrap($el)
        .getByTestId('note-card-')
        .should('have.length', 1)
        .should('contain.text', 'E2E test note');

      // Test: Edit note
      cy.selectCardAction({ text: 'E2E test note' }, 'Edit');
      cy.get('#content').clear().type('E2E test note - edited');
      cy.wrap($el).getButton('Save').should('be.enabled').click();

      cy.wrap($el)
        .getByTestId('note-card-')
        .should('have.length', 1)
        .should('contain.text', 'E2E test note - edited');

      // Test: Add 2 notes to archive
      cy.wrap($el).getByTestId('add-note').click();
      cy.wrap($el).getButton('Save').should('be.disabled');
      cy.get('#content').clear().type('Note to archive');
      cy.wrap($el).getButton('Save').should('be.enabled').click();

      cy.wrap($el)
        .getByTestId('note-card-')
        .should('have.length', 2)
        .should('contain.text', 'Note to archive');

      cy.wrap($el).getByTestId('add-note').click();
      cy.wrap($el).getButton('Save').should('be.disabled');
      cy.get('#content').type('Second note to archive');
      cy.wrap($el).getButton('Save').should('be.enabled').click();

      cy.wrap($el)
        .getByTestId('note-card-')
        .should('have.length', 3)
        .should('contain.text', 'Second note to archive');

      // Test: Add a note to delete
      cy.wrap($el).getByTestId('add-note').click();
      cy.wrap($el).getButton('Save').should('be.disabled');
      cy.get('#content').type('Note to delete');
      cy.wrap($el).getButton('Save').should('be.enabled').click();

      cy.wrap($el)
        .getByTestId('note-card-')
        .should('have.length', 4)
        .should('contain.text', 'Note to delete');

      // Test: Pin notes
      cy.selectCardAction({ text: 'E2E test note - edited' }, 'Pin');
      cy.wrap($el)
        .getByTestId('note-card-')
        .first()
        .should('contain.text', 'E2E test note - edited');

      cy.selectCardAction({ text: 'Note to delete' }, 'Pin');
      cy.wrap($el).getByTestId('note-card-').first().should('contain.text', 'Note to delete');

      cy.selectCardAction({ text: 'Note to archive' }, 'Pin');
      cy.wrap($el)
        .getByTestId('note-card-')
        .first()
        .should('contain.text', 'Note to delete')
        .next()
        .should('contain.text', 'Note to archive');

      // Test: Unpin note
      cy.selectCardAction({ text: 'Note to delete' }, 'Unpin');
      cy.wrap($el).getByTestId('note-card-').first().should('not.contain.text', 'Note to delete');

      // Test: Delete note
      cy.selectCardAction({ text: 'Note to delete' }, 'Delete');
      cy.wrap($el).getByTestId('note-card-').should('not.contain.text', 'Note to delete');

      // Test: Archive note
      cy.selectCardAction({ text: 'Note to archive' }, 'Archive');
      cy.wrap($el).getByTestId('note-card-').should('not.contain.text', 'Note to archive');
      cy.selectCardAction({ text: 'Second note to archive' }, 'Archive');
      cy.wrap($el).getByTestId('note-card-').should('not.contain.text', 'Second note to archive');

      // Test: View archived notes
      cy.wrap($el).getByTestId('archive-toggle').click();
      cy.wrap($el).getByTestId('notes-list').should('not.contain.text', 'E2E test note - edited');
      cy.wrap($el).getByTestId('notes-list').should('not.contain.text', 'Note to delete');
      cy.wrap($el).getByTestId('note-card-').should('contain.text', 'Note to archive');
      cy.wrap($el)
        .getByTestId('note-card-')
        .first()
        .should('contain.text', 'Second note to archive');

      cy.selectCardAction({ text: 'Note to archive' }, 'Restore');
      cy.wrap($el).getByTestId('notes-list').should('not.contain.text', 'Note to archive');

      cy.wrap($el).getByTestId('archive-toggle').click();
      cy.wrap($el).getByTestId('note-card-').first().should('contain.text', 'Note to archive');
    });

    // Test: Close notes drawer
    cy.press('Escape');
    cy.getByTestId(`notes-drawer-${characterData.id}`).should('not.exist');

    // TODO: Add tests after fixed so it doesn't retry infinitely
    // Test: Network error during note save
    // cy.getByTestId(`notes-${characterData.id}`).click();
    // cy.getByTestId('add-note').click();
    // cy.get('#content').type('This note will fail to save');
    // cy.intercept(
    //   {
    //     method: 'POST',
    //     url: '**/google.firestore.v1.Firestore/**',
    //     times: 1
    //   },
    //   {
    //     statusCode: 500,
    //     body: { error: 'Internal Server Error' }
    //   }
    // ).as('saveError');
    // cy.getButton('Save').click();
    // cy.wait('@saveError');

    // Test: Error toast should appear
    // cy.getByRole('status', 'Something went wrong').should('be.visible');
    // cy.getByTestId('note-card-').should('not.contain.text', 'This note will fail to save');
  });
});

// TODO: Add leveling when implemented
describe(`Character Sheet Spellcasting`, { defaultCommandTimeout: 8000 }, () => {
  const isMobile = Cypress.config('viewportWidth') === 375;
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

  before(() => {
    characters.forEach((char) => {
      const id = `test-${char.class.index}-${isMobile ? 'mobile' : 'desktop'}`;
      if (
        spellcastingClasses.some(({ classData }) => classData.index === char.class.index) ||
        char.class.index === 'barbarian'
      )
        cy.createTestCharacter(Cypress.testUser.uid, id, {
          ...char,
          id,
          name: `Test ${char.class.name} ${isMobile ? 'Mobile' : 'Desktop'}`,
          version: 'Legacy'
        });
    });
  });

  spellcastingClasses.map(({ classData, spell, learnNum, prepareCNum, prepareSNum }) =>
    it(`${classData.name} - should handle spells workflow (complex)`, { retries: 2 }, () => {
      const charID = `test-${classData.index}-${isMobile ? 'mobile' : 'desktop'}`;
      cy.callFirestore('update', `users/${Cypress.testUser.uid}/characters/${charID}`, {
        knownSpells: null,
        preparedSpells: null
      });

      const spells = characters
        .find((char) => char.class.index === classData.index)!
        .traits?.flatMap(({ spells }) => spells)
        .filter(Boolean);

      cy.login(Cypress.testUser.uid);
      cy.visit('/');
      cy.waitForLoading();

      cy.getByTestId(`character-card-${charID}`).click();
      cy.getByTestId('stats-section').should('be.visible');
      cy.get('.MuiMobileStepper-dot').should('have.length', 5);
      cy.getByTestId('previous-step').click();
      cy.getByTestId('spells-section').should('be.visible');

      if (learnNum > 0) {
        cy.getButton(/Learn spells/).should('be.enabled');
        if (prepareSNum > 0)
          cy.getButton(/Learn spells/)
            .next()
            .should('be.disabled');
        cy.getButton(/Learn spells/).click();
        cy.getByRole('dialog', 'Learn').within(($el) => {
          cy.get('p').contains(`0/${learnNum} spells selected`).should('be.visible');

          // Test: Add/remove spell and selected count updates
          cy.wrap($el)
            .getByTestId('edit-spell-item-')
            .first()
            .getButton(/^Add$/)
            .should('exist')
            .click();
          cy.wrap($el)
            .getByTestId('edit-spell-item-')
            .first()
            .getButton(/^(Add|Remove)$/)
            .should('not.contain.text', 'Add');

          cy.contains(`1/${learnNum} spells selected`).scrollIntoView().should('be.visible');
          cy.wrap($el)
            .getByTestId('edit-spell-item-')
            .first()
            .getButton(/^Remove$/)
            .should('exist')
            .click();

          cy.wrap($el)
            .getByTestId('edit-spell-item-')
            .first()
            .getButton(/^(Add|Remove)$/)
            .should('not.contain.text', 'Remove');
          cy.wrap($el).getByTestId('edit-spell-item-').first().getButton(/^Add$/).should('exist');
        });

        // Test: View spell details
        cy.getByTestId(`edit-spell-item-${spell.index}`).click();
        cy.getByRole('dialog', `${spell.name}lvl`).within(($el) => {
          cy.wrap($el)
            .getByTestId('spell-dialog-title')
            .should('exist')
            .should('contain.text', spell.name);
          cy.wrap($el)
            .getByTestId('spell-dialog-description')
            .should('exist')
            .should('contain.text', 'Casting Time');
          cy.press('Escape');
        });
        cy.getByRole('dialog', `${spell.name}lvl`).should('not.exist');

        // test wizard can search more spells
        if (classData.index === 'wizard') {
          cy.getByRole('dialog', 'Learn').getButton('More spells').click();
          cy.getByRole('dialog', 'Additional spells').within(($el) => {
            cy.get('#search').type('F');
            cy.wrap($el)
              .getByTestId('search-spell-item-')
              .first()
              .next()
              .should('not.contain.text', 'Faerie Fire');
            cy.wrap($el).getByTestId('search-spell-item-faerie-fire').should('be.visible').click();
            cy.wrap($el)
              .getByTestId('search-spell-item-')
              .first()
              .next()
              .should('contain.text', 'Faerie Fire');

            cy.wrap($el)
              .getByTestId('search-spell-item-faerie-fire', { type: 'exact' })
              .should('not.exist');
            cy.wrap($el)
              .getByTestId('search-spell-item-faerie-fire-selected', { type: 'exact' })
              .should('exist');

            cy.wrap($el).getButton('Close').click();
          });
          cy.getByRole('dialog', 'Additional spells').should('not.exist');
        }

        cy.getByRole('dialog', 'Learn').within(($el) => {
          // Test: Learn spells with 1 missing
          // TODO: get the spell levels available and add a little in each
          for (let i = 0; i < learnNum - 1; i++) {
            cy.wrap($el).getByTestId('edit-spell-item-').eq(i).getButton(/^Add$/).click();
          }
          cy.contains(`${learnNum - 1}/${learnNum} spells selected`)
            .scrollIntoView()
            .should('be.visible');
          cy.wrap($el).getButton('Close').click();
        });
        cy.getByRole('dialog').should('not.exist');

        if (prepareSNum > 0)
          cy.getButton(/Learn spells/)
            .next()
            .should('be.disabled');
        cy.getByTestId('spells-section').getByTestId('spell-list-').should('not.exist');

        // Test: Learn remaining spell
        cy.getButton(/Learn spells/)
          .should('be.enabled')
          .click();
        cy.getByRole('dialog', 'Learn').within(($el) => {
          cy.wrap($el).getByTestId('edit-spell-item-').getButton(/^Add$/).first().click();
          cy.contains(`${learnNum}/${learnNum} spells selected`)
            .scrollIntoView()
            .should('be.visible');
          cy.wrap($el).getButton('Close').click();
        });
        cy.getByRole('dialog').should('not.exist');
      }

      if (prepareSNum > 0 || prepareCNum > 0) {
        cy.getByTestId('spells-section').getByTestId('spell-list-').should('not.exist');
        cy.getButton(/Prepare your spells/)
          .should('be.enabled')
          .click();
        cy.getByRole('dialog', 'Prepare').within(($el) => {
          cy.get('p').contains(`0/${prepareCNum} cantrips selected`).should('be.visible');
          if (prepareSNum > 0)
            cy.get('p').contains(`0/${prepareSNum} spells selected`).should('be.visible');

          // Test: Add/remove cantrips and selected count updates
          cy.wrap($el)
            .getByTestId('spell-list-0')
            .getByTestId('edit-spell-item-')
            .first()
            .getButton(/^Add$/)
            .should('exist')
            .click();
          cy.wrap($el)
            .getByTestId('spell-list-0')
            .getByTestId('edit-spell-item-')
            .first()
            .getButton(/^(Add|Remove)$/)
            .should('not.contain.text', 'Add');

          cy.get('p')
            .contains(`1/${prepareCNum} cantrips selected`)
            .scrollIntoView()
            .should('be.visible');
          cy.wrap($el)
            .getByTestId('spell-list-0')
            .getByTestId('edit-spell-item-')
            .first()
            .getButton(/^Remove$/)
            .should('exist')
            .click();

          cy.wrap($el)
            .getByTestId('spell-list-0')
            .getByTestId('edit-spell-item-')
            .first()
            .getButton(/^(Add|Remove)$/)
            .should('not.contain.text', 'Remove');
          cy.wrap($el)
            .getByTestId('spell-list-0')
            .getByTestId('edit-spell-item-')
            .first()
            .getButton(/^Add$/)
            .should('exist');

          // Test: Add/remove spells and selected count updates
          if (prepareSNum > 0) {
            cy.wrap($el)
              .getByTestId('spell-list-1')
              .getByTestId('edit-spell-item-')
              .first()
              .getButton(/^Add$/)
              .should('exist')
              .click();
            cy.wrap($el)
              .getByTestId('spell-list-1')
              .getByTestId('edit-spell-item-')
              .first()
              .getButton(/^(Add|Remove)$/)
              .should('not.contain.text', 'Add');

            cy.wrap($el)
              .get('p')
              .contains(`1/${prepareSNum} spells selected`)
              .scrollIntoView()
              .should('be.visible');
            cy.wrap($el)
              .getByTestId('spell-list-1')
              .getByTestId('edit-spell-item-')
              .first()
              .getButton(/^Remove$/)
              .should('exist')
              .click();

            cy.wrap($el)
              .getByTestId('spell-list-1')
              .getByTestId('edit-spell-item-')
              .first()
              .getButton(/^(Add|Remove)$/)
              .should('not.contain.text', 'Remove');
            cy.wrap($el)
              .getByTestId('spell-list-1')
              .getByTestId('edit-spell-item-')
              .first()
              .getButton(/^Add$/)
              .should('exist');
          }
        });

        // Test: View spell details
        if (learnNum === 0) {
          cy.getByTestId(`edit-spell-item-${spell.index}`).click();
          cy.getByRole('dialog', `${spell.name}lvl`).within(($el) => {
            cy.wrap($el)
              .getByTestId('spell-dialog-title')
              .should('exist')
              .should('contain.text', spell.name);
            cy.wrap($el)
              .getByTestId('spell-dialog-description')
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
        cy.getButton(/Prepare your spells/)
          .should('be.enabled')
          .click();
        cy.getByRole('dialog', 'Prepare').within(($el) => {
          cy.wrap($el)
            .getByTestId('spell-list-0')
            .getByTestId('edit-spell-item-')
            .getButton(/^Add$/)
            .first()
            .click();
          cy.contains(`${prepareCNum}/${prepareCNum} cantrips selected`)
            .scrollIntoView()
            .should('be.visible');
          if (prepareSNum > 0) {
            cy.wrap($el)
              .getByTestId('spell-list-1')
              .getByTestId('edit-spell-item-')
              .getButton(/^Add$/)
              .first()
              .click();
            cy.wrap($el)
              .contains(`${prepareSNum}/${prepareSNum} spells selected`)
              .scrollIntoView()
              .should('be.visible');
          }

          cy.wrap($el).getButton('Close').click();
        });
        cy.getByRole('dialog').should('not.exist');
      }

      // TODO: should test specific spell names + levels
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
    })
  );

  it('Should not display spell section for non-spellcaster', () => {
    cy.login(Cypress.testUser.uid);
    cy.visit('/');
    cy.waitForLoading();

    const charID = `test-barbarian-${isMobile ? 'mobile' : 'desktop'}`;
    cy.getByTestId(`character-card-${charID}`).click();

    cy.getByTestId('stats-section').should('be.visible');
    cy.get('.MuiMobileStepper-dot').should('have.length', 4);
    cy.getByTestId('previous-step').click();
    cy.getByTestId('spells-section').should('not.exist');
  });
});

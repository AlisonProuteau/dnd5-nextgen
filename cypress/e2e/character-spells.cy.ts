import { characters } from 'cypress/support/mocks/characterList';

// TODO-blocked: Add leveling when implemented
describe(`Character Spells`, { defaultCommandTimeout: 8000 }, () => {
  const isMobile = Cypress.config('viewportWidth') === 375;

  // Test: Setup test data for spellcasting classes with ritual spells
  const spellcastingClasses = [
    {
      classData: { index: 'wizard', name: 'Wizard' },
      learnNum: 6,
      prepareCNum: 3,
      prepareSNum: 4,

      level1Spell: { index: 'unseen-servant', name: 'Unseen Servant', ritual: true },
      level2Spell: { index: 'invisibility', name: 'Invisibility', ritual: true },
      expectedSlots: { '1': 2, '2': 0 }
    },
    {
      classData: { index: 'cleric', name: 'Cleric' },
      learnNum: 0,
      prepareCNum: 3,
      prepareSNum: 3,

      level1Spell: { index: 'bane', name: 'Bane' },
      level2Spell: { index: 'hold-person', name: 'Hold Person' },
      expectedSlots: { '1': 2, '2': 0 }
    },
    {
      classData: { index: 'druid', name: 'Druid' },
      learnNum: 0,
      prepareCNum: 2,
      prepareSNum: 3,

      level1Spell: { index: 'charm-person', name: 'Charm Person' },
      level2Spell: { index: 'moonbeam', name: 'Moonbeam' },
      expectedSlots: { '1': 2, '2': 0 }
    },
    {
      classData: { index: 'bard', name: 'Bard' },
      learnNum: 4,
      prepareCNum: 2,
      prepareSNum: 0,

      level1Spell: { index: 'alarm', name: 'Alarm', ritual: true },
      //   level2Spell: { index: '', name: '' },
      expectedSlots: { '1': 2, '2': 0 }
    },
    {
      classData: { index: 'warlock', name: 'Warlock' },
      learnNum: 2,
      prepareCNum: 2,
      prepareSNum: 0,

      level1Spell: { index: 'burning-hands', name: 'Burning Hands' },
      //   level2Spell: { index: '', name: '' },
      expectedSlots: { '1': 1, '2': 0 }
    },
    {
      classData: { index: 'sorcerer', name: 'Sorcerer' },
      spell: { index: 'burning-hands', name: 'Burning Hands' },
      learnNum: 2,
      prepareCNum: 4,
      prepareSNum: 0,

      level1Spell: { index: 'burning-hands', name: 'Burning Hands' },
      level2Spell: { index: 'scorching-ray', name: 'Scorching Ray' },
      expectedSlots: { '1': 2, '2': 0 }
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

  beforeEach(() => cy.login(Cypress.testUser.uid));

  after(() => cy.callFirestore('delete', `users/${Cypress.testUser.uid}/characters`));

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

  it('should handle basic spell casting and spell search', () => {
    const charData = characters.find(({ class: { index } }) => index === 'wizard')!;
    const charID = `test-wizard-views-${isMobile ? 'mobile' : 'desktop'}`;

    cy.createTestCharacter(Cypress.testUser.uid, charID, {
      ...charData,
      id: charID,
      name: 'Test Wizard Racial',
      version: 'Legacy',
      level: 3, // Level 3 has slots: 1st(4), 2nd(2)
      traits: [
        {
          index: 'drow-magic',
          name: 'Drow Magic',
          spells: [
            { index: 'dancing-lights', name: 'Dancing Lights' },
            { index: 'faerie-fire', name: 'Faerie Fire' }
          ]
        }
      ],
      knownSpells: [
        { index: 'alarm', name: 'Alarm', level: 1, ritual: true },
        { index: 'burning-hands', name: 'Burning Hands', level: 1 },
        { index: 'magic-missile', name: 'Magic Missile', level: 1 },
        { index: 'shield', name: 'Shield', level: 1 },
        { index: 'comprehend-languages', name: 'Comprehend Languages', level: 1, ritual: true },
        { index: 'silent-image', name: 'Silent Image', level: 1 },
        { index: 'acid-arrow', name: 'Acid Arrow', level: 2 },
        { index: 'alter-self', name: 'Alter Self', level: 2 },
        { index: 'scorching-ray', name: 'Scorching Ray', level: 2 },
        { index: 'invisibility', name: 'Invisibility', level: 2 }
      ],
      preparedSpells: [
        { index: 'alter-self', name: 'Alter Self', level: 2 },
        { index: 'scorching-ray', name: 'Scorching Ray', level: 2 },
        { index: 'alarm', name: 'Alarm', level: 1 },
        { index: 'burning-hands', name: 'Burning Hands', level: 1 },
        { index: 'magic-missile', name: 'Magic Missile', level: 1 },
        { index: 'shield', name: 'Shield', level: 1 },
        { index: 'acid-splash', name: 'Acid Splash', level: 0 },
        { index: 'chill-touch', name: 'Chill Touch', level: 0 },
        { index: 'dancing-lights', name: 'Dancing Lights', level: 0 }
      ],
      usedSpellSlots: undefined
    });

    cy.login(Cypress.testUser.uid);
    cy.visit('/');
    cy.waitForLoading();

    cy.getByTestId(`character-card-${charID}`).click();
    cy.getByTestId('stats-section').should('be.visible');
    cy.getByTestId('previous-step').click();
    cy.getByTestId('spells-section').should('be.visible');

    // Test: Search functionality in All Spells view
    cy.getButton('Spellbook').next().click();
    cy.getByRole('menuitem', 'All Spells').click();

    cy.get('#search').should('be.visible').type('magic');
    cy.getByTestId('spells-section')
      .getByTestId('view-spell-item-magic-missile')
      .should('be.visible');
    cy.getByTestId('spells-section')
      .getByTestId('view-spell-item-')
      .each(($el) => {
        cy.wrap($el).invoke('text').should('match', /magic/i);
      })
      .its('length')
      .as('filteredCount');

    cy.get('#search').clear();
    cy.get('@filteredCount').then((filteredCount) => {
      cy.getByTestId('spells-section')
        .getByTestId('view-spell-item-')
        .should('have.length.greaterThan', filteredCount);
    });

    // Test: "How does it work?" view
    cy.getButton('All Spells').next().click();
    cy.getByRole('menuitem', 'How does it work ?').click();

    cy.getByTestId('spells-section').within(() => {
      cy.contains('Spellcasting').should('be.visible');
    });

    // Test: Test Spellbook view with spell slots visible
    cy.getButton('How does it work ?').next().click();
    cy.getByRole('menuitem', 'Spellbook').click();
    cy.getByTestId('spells-section').contains('Spell Slots').should('be.visible');

    // Test: Verify racial spells are displayed and don't have Cast button
    cy.getByTestId('spells-section')
      .getByTestId('spell-list-0')
      .within(() => {
        cy.getByTestId('view-spell-item-dancing-lights').should('be.visible');
      });

    cy.getByTestId('spells-section')
      .getByTestId('spell-list-1')
      .within(() => {
        cy.getByTestId('view-spell-item-faerie-fire').should('be.visible');
      });

    cy.getByTestId('spells-section')
      .getByTestId('spell-list-1')
      .getByTestId('view-spell-item-faerie-fire')
      .should('contain.text', 'Racial');

    cy.getByTestId('spells-section')
      .getByTestId('spell-list-1')
      .within(() => {
        cy.getByTestId('cast-spell-faerie-fire').should('not.exist');
      });

    // Test: Verify multiple spell slot levels are displayed
    cy.getByTestId('spells-section').within(() => {
      cy.contains('Level 1').should('be.visible');
      cy.contains('4 of 4').should('be.visible');
      cy.contains('Level 2').should('be.visible');
      cy.contains('2 of 2').should('be.visible');
    });

    // Test: Upast level 1 spell from details modal
    cy.getByTestId('spells-section')
      .getByTestId('spell-list-1')
      .getByTestId('view-spell-item-magic-missile')
      .click();

    cy.getByRole('dialog', 'Magic Missilelvl')
      .getByTestId('cast-spell-magic-missile')
      .should('be.enabled')
      .click();

    cy.getByRole('menu', 'Level').within(() => {
      cy.getByRole('menuitem', 'Level 1').should('be.visible').and('contain.text', '(4 available)');
      cy.getByRole('menuitem', 'Level 2')
        .should('be.visible')
        .and('contain.text', '(2 available)')
        .and('contain.text', '(Upcast)')
        .click();
    });

    cy.getByRole('menu', 'Level').should('not.exist');
    cy.getByRole('dialog', 'Magic Missilelvl').should('not.exist');

    cy.getByTestId('spells-section').within(() => {
      cy.contains('4 of 4').should('be.visible');
      cy.contains('1 of 2').should('be.visible');
    });

    // Test: Cast level 1 spell at normal level from main page
    cy.getByTestId('spells-section')
      .getByTestId('spell-list-1')
      .getByTestId('cast-spell-magic-missile')
      .click();

    cy.getByRole('menu', 'Level').within(() => {
      cy.getByRole('menuitem', 'Level 2')
        .should('be.visible')
        .and('contain.text', '(1 available)')
        .and('contain.text', '(Upcast)');
      cy.getByRole('menuitem', 'Level 1')
        .should('be.visible')
        .and('contain.text', '(4 available)')
        .click();
    });
    cy.getByRole('menu', 'Level').should('not.exist');

    cy.getByTestId('spells-section').within(() => {
      cy.contains('3 of 4').should('be.visible');
      cy.contains('1 of 2').should('be.visible');
    });

    // Test: Verify wizard all rituat spells are displayed and don't have Cast button
    cy.getByTestId('spells-section').getButton('All Ritual Spells').click();
    cy.getByTestId('spells-section')
      .getButton('All Ritual Spells')
      .parent()
      .parent()
      .should('not.contain.text', 'No spells to display')
      .getByTestId('cast-spell-')
      .should('not.exist');
  });

  spellcastingClasses.map(
    ({ classData, learnNum, prepareCNum, prepareSNum, level1Spell, level2Spell, expectedSlots }) =>
      it(`${classData.name} - should handle complete spells workflow`, { retries: 2 }, () => {
        const charID = `test-${classData.index}-${isMobile ? 'mobile' : 'desktop'}`;
        cy.callFirestore('update', `users/${Cypress.testUser.uid}/characters/${charID}`, {
          knownSpells: null,
          preparedSpells: null,
          usedSpellSlots: null
        });
        const spells = characters
          .find((char) => char.class.index === classData.index)!
          .traits?.flatMap(({ spells }) => spells)
          .filter(Boolean);

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

            cy.contains(`1/${learnNum} spells selected`).should('exist');
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
          cy.getByTestId(`edit-spell-item-${level1Spell.index}`).click();
          cy.getByRole('dialog', `${level1Spell.name}lvl`).within(($el) => {
            cy.wrap($el)
              .getByTestId('spell-dialog-title')
              .should('exist')
              .should('contain.text', level1Spell.name);
            cy.wrap($el)
              .getByTestId('spell-dialog-description')
              .should('exist')
              .should('contain.text', 'Casting Time');
            cy.press('Escape');
          });
          cy.getByRole('dialog', `${level1Spell.name}lvl`).should('not.exist');

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
              cy.wrap($el)
                .getByTestId('search-spell-item-faerie-fire')
                .should('be.visible')
                .click();
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
            // TODO-blocked: get the spell levels available and add a little in each
            for (let i = 0; i < learnNum - 1; i++) {
              cy.wrap($el).getByTestId('edit-spell-item-').eq(i).getButton(/^Add$/).click();
            }
            cy.contains(`${learnNum - 1}/${learnNum} spells selected`).should('exist');
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
            cy.contains(`${learnNum}/${learnNum} spells selected`).should('exist');
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

            cy.get('p').contains(`1/${prepareCNum} cantrips selected`).should('exist');
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

              cy.wrap($el).get('p').contains(`1/${prepareSNum} spells selected`).should('exist');
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
            cy.getByTestId(`edit-spell-item-${level1Spell.index}`).click();
            cy.getByRole('dialog', `${level1Spell.name}lvl`).within(($el) => {
              cy.wrap($el)
                .getByTestId('spell-dialog-title')
                .should('exist')
                .should('contain.text', level1Spell.name);
              cy.wrap($el)
                .getByTestId('spell-dialog-description')
                .should('exist')
                .should('contain.text', 'Casting Time');
              cy.press('Escape');
            });
            cy.getByRole('dialog', `${level1Spell.name}lvl`).should('not.exist');
          }

          // Test: Prepare spells with 1 missing
          // TODO-blocked: Preparing spells with previously learned if they can learn
          if (learnNum > 0) {
            if (classData.index === 'wizard') cy.contains(/Faerie Fire/).should('exist');
          }
          // TODO-blocked: get the spell levels available and add a little in each
          for (let i = 0; i < prepareCNum - 1; i++) {
            cy.getByTestId('spell-list-0')
              .getByTestId('edit-spell-item-')
              .eq(i)
              .getButton(/^Add$/)
              .click();
          }
          cy.contains(`${prepareCNum - 1}/${prepareCNum} cantrips selected`).should('exist');
          if (prepareSNum > 0) {
            for (let i = 0; i < prepareSNum - 1; i++) {
              cy.getByTestId('spell-list-1')
                .getByTestId('edit-spell-item-')
                .eq(i)
                .getButton(/^Add$/)
                .click();
            }
            cy.contains(`${prepareSNum - 1}/${prepareSNum} spells selected`).should('exist');
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
            cy.contains(`${prepareCNum}/${prepareCNum} cantrips selected`).should('exist');
            if (prepareSNum > 0) {
              cy.wrap($el)
                .getByTestId('spell-list-1')
                .getByTestId('edit-spell-item-')
                .getButton(/^Add$/)
                .first()
                .click();
              cy.wrap($el)
                .contains(`${prepareSNum}/${prepareSNum} spells selected`)
                .should('exist');
            }

            cy.wrap($el).getButton('Close').click();
          });
          cy.getByRole('dialog').should('not.exist');
        }

        // TODO-blocked: should test specific spell names + levels
        cy.getByTestId('spells-section')
          .getByTestId('spell-list-0')
          .getByTestId('view-spell-item-')
          .should('have.length', prepareCNum + (spells?.length ?? 0));

        cy.getByTestId('spells-section')
          .getByTestId('spell-list-')
          .filter((_i, el) => el.dataset.testid !== 'spell-list-0')
          .first()
          .getByTestId('view-spell-item-')
          .then(($spellItems) => {
            cy.wrap($spellItems[0])
              .find(' p')
              .first()
              .invoke('text')
              .as('firstSpellName', { type: 'static' });
            return cy.wrap($spellItems);
          })
          .should('have.length', prepareSNum === 0 ? learnNum : prepareSNum);

        // Test: Verify prepared spells update when learned spells change (only for classes that can learn)
        if (learnNum > 0 && prepareSNum > 0) {
          // Test: Change learned spells (remove first spell, add a different one)
          cy.getButton(/Learn spells/).click();
          cy.getByRole('dialog', 'Learn').within(($el) => {
            cy.get('@firstSpellName').then((removedSpellName: unknown) =>
              cy
                .wrap($el)
                .getByTestId('edit-spell-item-', {
                  selector: `:has( p:contains(${removedSpellName as string}))`
                })
                .getButton(/^Remove$/)
                .click()
            );
            cy.contains(`${learnNum - 1}/${learnNum} spells selected`).should('exist');
            cy.wrap($el)
              .getByTestId('edit-spell-item-')
              .last()
              .then(($newLearned) => {
                cy.wrap($newLearned)
                  .find(' p')
                  .first()
                  .invoke('text')
                  .as('newLearnedName', { type: 'static' });
                cy.wrap($newLearned).getButton(/^Add$/).click();
              });
            cy.contains(`${learnNum}/${learnNum} spells selected`).should('exist');
            cy.wrap($el).getButton('Close').click();
          });
          cy.getByRole('dialog').should('not.exist');

          // Test: Verify prepared spell count updated (removed spell no longer prepared)
          cy.getByTestId('spells-section').getByTestId('spell-list-').should('not.exist');

          cy.getButton(/Prepare your spells/)
            .should('be.enabled')
            .click();
          cy.getByRole('dialog', 'Prepare').within(($el) => {
            cy.wrap($el)
              .contains(`${prepareSNum - 1}/${prepareSNum} spells selected`)
              .should('exist');
            cy.get('@firstSpellName').then((removedSpellName: unknown) =>
              cy
                .wrap($el)
                .getByTestId('spell-list-')
                .filter((_i, el) => el.dataset.testid !== 'spell-list-0')
                .getByTestId('edit-spell-item-', {
                  selector: `:has( p:contains(${removedSpellName as string}))`
                })
                .should('not.exist')
            );
            cy.contains(`${prepareSNum - 1}/${prepareSNum} spells selected`);
            cy.get('@newLearnedName').then((newLearnedName: unknown) =>
              cy
                .wrap($el)
                .getByTestId('spell-list-')
                .filter((_i, el) => el.dataset.testid !== 'spell-list-0')
                .getByTestId('edit-spell-item-', {
                  selector: `:has( p:contains(${newLearnedName as string}))`
                })
                .getButton(/^Add$/)
                .click()
            );
            cy.contains(`${prepareSNum}/${prepareSNum} spells selected`);
            cy.wrap($el).getButton('Close').click();
          });
          cy.getByRole('dialog').should('not.exist');
          cy.getByTestId('spells-section').getByTestId('spell-list-').should('exist');
        }

        // Test: Verify spell slots display shows correct initial state
        cy.getByTestId('spell-slots').within(($el) => {
          cy.wrap($el).should('contain.text', 'Spell Slots');
          Object.entries(expectedSlots).forEach(([level, total]) => {
            if (total > 0) {
              cy.contains(`Level ${level}`).should('be.visible');
              cy.contains(`${total} of ${total}`).should('be.visible');
            }
          });
          cy.getButton('Rest').should('not.exist');
        });

        // Test: Cantrips should not have Cast button (cantrips don't consume slots)
        cy.getByTestId('spells-section')
          .getByTestId('spell-list-0')
          .getByTestId(`cast-spell-`)
          .should('not.exist');

        // Test: Cast level 1 spell - should consume spell slot
        cy.getByTestId(`cast-spell-${level1Spell.index}`).click();
        if (level1Spell.ritual || expectedSlots[2] > 0) {
          cy.getByRole('menu', 'Level ').within(($el) => {
            if (level1Spell.ritual) {
              cy.wrap($el)
                .getByRole('menuitem', 'Ritual Cast')
                .should('be.visible')
                .and('contain.text', '(+10 minutes - no slot)');
            }
            if (expectedSlots[2] > 0) {
              cy.wrap($el)
                .getByRole('menuitem', 'Level 2')
                .should('be.visible')
                .and('contain.text', `(${expectedSlots[2]} available)`);
            }
            cy.wrap($el)
              .getByRole('menuitem', 'Level 1')
              .should('be.visible')
              .and('contain.text', `(${expectedSlots[1]} available)`)
              .click();
          });
        }
        cy.getByTestId('spell-slots').should(
          'contain.text',
          ['Level 1', `${expectedSlots[1] - 1} of ${expectedSlots[1]}`].join('')
        );
        cy.get('button').contains('Rest').should('be.visible');

        // Test: Consume all remaining level 1 slots
        cy.wrap(Array(expectedSlots[1] - 1)).each(() => {
          cy.getByTestId(`cast-spell-${level1Spell.index}`).click();
          if (level1Spell.ritual || expectedSlots[2] > 0) {
            cy.getByRole('menu', 'Level ')
              .getByRole('menuitem', 'Level 1')
              .should('be.visible')
              .and('contain.text', `(${expectedSlots[1] - 1} available)`)
              .click();
          }
        });
        cy.getByTestId('spell-slots').should(
          'contain.text',
          ['Level 1', `0 of ${expectedSlots[1]}`].join('')
        );

        cy.getByTestId('spells-section')
          .getByTestId('spell-list-1')
          .getByTestId(`cast-spell-`)
          .each(($btn) => cy.wrap($btn).should('be.disabled'));

        // Test: Long Rest - Restore all spell slots
        cy.getByTestId('spell-slots').getButton('Rest').should('be.visible').click();
        cy.getByTestId('spell-slots').within(($el) => {
          cy.wrap($el).should(
            'contain.text',
            ['Level 1', `${expectedSlots[1]} of ${expectedSlots[1]}`].join('')
          );
          cy.wrap($el).getButton('Rest').should('not.exist');
        });
        cy.getByTestId(`cast-spell-${level1Spell.index}`).should('be.enabled');

        // Test: Verify spell slot persistence after reload
        cy.getByTestId(`cast-spell-${level1Spell.index}`).click();
        if (level1Spell.ritual || expectedSlots[2] > 0) {
          cy.getByRole('menu', 'Level ')
            .getByRole('menuitem', 'Level 1')
            .should('be.visible')
            .and('contain.text', `(${expectedSlots[1]} available)`)
            .click();
        }
        cy.getByTestId('spell-slots').should(
          'contain.text',
          ['Level 1', `${expectedSlots[1] - 1} of ${expectedSlots[1]}`].join('')
        );

        cy.reload();
        cy.getByTestId('stats-section').should('be.visible');
        cy.getByTestId('previous-step').click();
        cy.getByTestId('spell-slots').within(($el) => {
          cy.wrap($el).should(
            'contain.text',
            ['Level 1', `${expectedSlots[1] - 1} of ${expectedSlots[1]}`].join('')
          );
          cy.wrap($el).getButton('Rest').should('be.visible');
        });

        // Test: Ritual casting doesn't consume a spell slot
        if (level1Spell.ritual) {
          cy.getByTestId('spell-slots').getButton('Rest').click();
          cy.getByTestId('spell-slots').should(
            'contain.text',
            ['Level 1', `${expectedSlots[1]} of ${expectedSlots[1]}`].join('')
          );

          cy.getByTestId(`cast-spell-${level1Spell.index}`).should('be.enabled').click();
          cy.getByRole('menu', 'Level ').within(($el) => {
            cy.wrap($el).getByRole('menuitem', 'Level 1').should('be.visible');
            cy.wrap($el)
              .getByRole('menuitem', 'Ritual Cast')
              .should('be.visible')
              .and('contain.text', '+10 minutes - no slot')
              .click();
          });
          cy.getByRole('menu', 'Level ').should('not.exist');

          cy.getByTestId('spell-slots').should(
            'contain.text',
            ['Level 1', `${expectedSlots[1]} of ${expectedSlots[1]}`].join('')
          );
        }
      })
  );
});

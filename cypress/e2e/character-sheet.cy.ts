import { characters } from 'cypress/support/mocks/characterList';

describe(`Character Sheet End-to-End`, () => {
  const delfyData = characters.find(({ name }) => name === 'Delfy')!;
  const devyData = characters.find(({ name }) => name === 'Devy')!;
  const blackList: string[] = [
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

  before(() => {
    cy.createTestCharacter(Cypress.testUser.uid, delfyData.id, delfyData);
    cy.createTestCharacter(Cypress.testUser.uid, devyData.id, devyData);
  });

  beforeEach(() => cy.login(Cypress.testUser.uid));

  after(() => cy.callFirestore('delete', `users/${Cypress.testUser.uid}/characters`));

  it('should complete the full character sheet happy path workflow', () => {
    cy.visit('/');
    cy.waitForLoading();
    cy.getByTestId('character-card-').should('have.length.at.least', 1);

    cy.getByTestId(`character-card-${delfyData.id}`).click();
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
    clickUntilStep('characteristics');
    cy.getByTestId('proficiencies-section').should(
      'contain.text',
      delfyData.proficiencies.map((p) => p.name).join(', ')
    );
    cy.getByTestId('language-section').should(
      'contain.text',
      delfyData.languages.map((l) => l.name).join(', ')
    );

    cy.getByTestId('features-section')
      .should('exist')
      .children()
      .should(
        'have.length',
        (delfyData.features || []).filter((d) => !blackList.includes(d.index)).length
      );
    delfyData
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
        (delfyData.traits || []).filter((d) => !blackList.includes(d.index)).length
      );
    delfyData
      .traits!.filter((d) => !blackList.includes(d.index))
      .forEach((trait) => {
        cy.getByTestId(`trait-name-${trait.index}`).should('contain.text', trait.name);
        cy.getByTestId(`trait-details-${trait.index}`).should('not.be.visible');
        cy.getByTestId(`trait-${trait.index}`).click();
        cy.getByTestId(`trait-details-${trait.index}`).should('be.visible');
      });

    // Test: Equipment section
    clickUntilStep('equipment');
    cy.getByTestId('equipment-section-header').should('be.visible');
    cy.getByTestId('money-display').within(($purse) => {
      cy.wrap($purse).getByTestId('gp').should('be.visible');
      cy.wrap($purse).getByTestId('sp').should('be.visible');
      cy.wrap($purse).getByTestId('cp').should('be.visible');
    });
    cy.getByTestId('inventory-weight').should('contain.text', '14').and('contain.text', 'Weight');
    delfyData.equipments.forEach((equipment) => {
      cy.getByTestId(`equipment-item-${equipment.index}`).should('contain.text', equipment.name);
    });

    // Test: Equipment details
    cy.getByTestId('equipment-section-content')
      .children()
      .each(($section) => {
        const sectionName = $section.find('h5').text().trim();
        cy.wrap($section)
          .getByTestId(`equipment-item-`, {
            selector: ':not([data-testid$="-info"],[data-testid$="-equip"])'
          })
          .each(($item) => {
            const name = $item.find('p').first().text().trim();
            if (sectionName === 'Weapon') {
              cy.wrap($item)
                .getByTestId('damage-info')
                .invoke('text')
                .should('match', /\d+d\d+ .*/);
            } else if (sectionName === 'Armor') {
              cy.wrap($item)
                .getByTestId('armor-class-info')
                .invoke('text')
                .should('match', /\d+ AC( - Dexterity bonus)?( \(Max: \d+\))?/);
            }

            cy.wrap($item).getByTestId('-info', { type: 'contains' }).first().click();
            cy.getByRole('dialog', name).within(($dialog) => {
              cy.wrap($dialog)
                .getByTestId('money-display')
                .get('[data-testid="gp"],[data-testid="sp"],[data-testid="cp"]')
                .each(($coin) =>
                  cy
                    .wrap($coin)
                    .invoke('text')
                    .should('match', /[1-9]+/)
                );
              if (sectionName === 'Weapon') {
                cy.wrap($dialog)
                  .getByTestId('weight')
                  .invoke('text')
                  .should('match', /[1-9]+/);

                cy.wrap($dialog)
                  .getByTestId('range-category')
                  .invoke('text')
                  .should('match', /Range Category:.+/);
                cy.wrap($dialog)
                  .getByTestId('range')
                  .invoke('text')
                  .should('match', /Range:\d+ft/);

                cy.wrap($dialog)
                  .invoke('text')
                  .then((dialogText) => {
                    if (dialogText.includes('Throw Range')) {
                      cy.wrap($dialog)
                        .getByTestId('throw-range')
                        .invoke('text')
                        .should('match', /Throw Range:\s*\d+ft[\s\S]*-\s*60ft/);
                    }
                  });
                cy.wrap($dialog)
                  .getByTestId('damage')
                  .invoke('text')
                  .should('match', /Damage:\d+d\d+/);
              } else if (sectionName === 'Armor') {
                cy.wrap($dialog)
                  .getByTestId('weight')
                  .invoke('text')
                  .should('match', /[1-9]+/);
                cy.wrap($dialog)
                  .getByTestId('armor-class')
                  .invoke('text')
                  .should('match', /Armor Class|AC: \d+( - Dexterity bonus)?$/);
              } else {
                cy.wrap($dialog)
                  .find('.MuiDialogContent-root')
                  .find('p')
                  .then(($ps) =>
                    $ps.length === 1
                      ? $ps
                      : $ps.filter((_, el) => el.dataset.testid?.includes('content-') || false)
                  )
                  .should('have.length.greaterThan', 0)
                  .each(($p) => cy.wrap($p.text()).should('not.be.empty'));
              }
            });
            cy.press('Escape');
            cy.getByRole('dialog').should('not.exist');
          });
      });

    // Test: Description section
    clickUntilStep('description');
    cy.getByTestId('description-sex-')
      .should('contain.text', 'Sex')
      .should('have.attr', 'data-testid', 'description-sex-F');
    cy.getByTestId('description-age').should('contain.text', '23').and('contain.text', 'Age');
    cy.getByTestId('description-size').should('contain.text', 'Medium').and('contain.text', 'Size');
    cy.getByTestId('description-alignment')
      .should('contain.text', 'CG')
      .and('contain.text', 'Alignment');

    cy.getByTestId('description-appearance')
      .should('contain.text', 'Appearance')
      .and('include.text', delfyData.appearance!);
    cy.getByTestId('description-background').should('have.text', 'BackgroundCustom');
    cy.getByTestId('description-bonds')
      .should('contain.text', 'Bonds')
      .and('include.text', delfyData.bonds!.join(''));
    cy.getByTestId('description-ideals')
      .should('contain.text', 'Ideals')
      .and('include.text', delfyData.ideals!.join(''));
    cy.getByTestId('description-flaws')
      .should('contain.text', 'Flaws')
      .and('include.text', delfyData.flaws!.join(''));
    cy.getByTestId('description-personality')
      .should('contain.text', 'Personality')
      .and('include.text', delfyData.personality!.join(''));

    // Test: Edit description fields
    cy.getByTestId('description-appearance-edit').should('be.visible').click();
    cy.getByTestId('close-description-edit').should('be.visible');
    cy.getByTestId('description-selection').should('be.visible');

    cy.get('#name').should('have.value', delfyData.name);
    cy.get('#age').should('have.value', delfyData.age);
    cy.get('#sex').should('contain.text', 'Female');
    cy.get('#appearance').should('have.value', delfyData.appearance);

    cy.get('#name').clear().type('Delfy Updated');
    cy.get('#age').clear().type('25');
    cy.selectOption('#sex', 'Male');
    cy.get('#appearance').clear().type('Updated appearance text for testing.');

    cy.getButton('Next').should('be.enabled').click();
    cy.getByRole('status', 'Updated successfully').should('be.visible');
    cy.getByTestId('close-description-edit').should('not.be.visible');

    // Test: Verify changes persisted
    cy.contains('Delfy Updated').should('be.visible');
    cy.getByTestId('description-age').should('contain.text', '25');
    cy.getByTestId('description-sex-M').should('exist');
    cy.getByTestId('description-appearance').should(
      'contain.text',
      'Updated appearance text for testing.'
    );

    // Test: Revert to original
    cy.getByTestId('description-appearance-edit').click();
    cy.get('#name').clear().type('Delfy');
    cy.get('#age').clear().type('23');
    cy.selectOption('#sex', 'Female');
    cy.get('#appearance').clear().type(delfyData.appearance!);
    cy.getButton('Next').click();
    cy.getByRole('status', 'Updated successfully').should('be.visible');

    cy.contains('Updated').should('not.be.visible');
    cy.getByTestId('description-age').should('contain.text', '23');
    cy.getByTestId('description-sex-F').should('exist');
    cy.getByTestId('description-appearance').should('contain.text', delfyData.appearance);

    // Test: Cancel description edit via escape
    cy.getByTestId('description-appearance-edit').click();
    cy.get('#name').clear().type('Should not save');
    cy.press('Escape');
    cy.getByTestId('close-description-edit').should('not.be.visible');
    cy.contains('Delfy').should('be.visible');
    cy.contains('Should not save').should('not.exist');

    // Test: Cancel description edit via close button
    cy.getByTestId('description-appearance-edit').click();
    cy.get('#appearance').clear().type('This should be cancelled');
    cy.getByTestId('close-description-edit').click();
    cy.getByTestId('description-appearance').should('not.contain.text', 'This should be cancelled');
    cy.getByTestId('description-appearance').should('contain.text', delfyData.appearance);

    // Test: Edit background fields (Acolyte)
    cy.getByTestId('description-background-edit').should('be.visible').click();
    cy.getByTestId('close-background-edit').should('be.visible');

    cy.get('#background').should('contain.text', 'Custom');
    cy.get('#bonds').should('have.value', delfyData.bonds!.join('\n'));
    cy.get('#personality').should('have.value', delfyData.personality!.join('\n'));
    cy.get('#ideals').should('have.value', delfyData.ideals!.join('\n'));
    cy.get('#flaws').should('have.value', delfyData.flaws!.join('\n'));

    cy.get('#background').click();
    cy.getByRole('option', 'Acolyte').click();
    cy.get('#alignment').should('have.text', delfyData.alignment.name);

    cy.getByRole('presentation', 'Choose Bonds').next().find('[id^="choice-"]').first().click();
    cy.getByRole('presentation', 'Choose Personality Traits')
      .next()
      .within(() => {
        cy.get('[id^="choice-"]').first().click();
        cy.get('[id^="choice-"]').eq(1).click();
      });
    cy.getByRole('presentation', 'Choose Ideals')
      .next()
      .should('have.text', 'Deselect your aligment to access all ideals');
    cy.getByRole('presentation', 'Choose Ideals')
      .next()
      .next()
      .within(() => {
        cy.get('[id^="choice-"]').should('have.length', 3);
        cy.get('[id^="choice-"]')
          .parentsUntil('label')
          .parent()
          .each(($ideal) => cy.wrap($ideal).should('contain.text', delfyData.alignment.name));
        cy.get('[id^="choice-"]').first().click();
      });
    cy.getByRole('presentation', 'Choose Flaws').next().find('[id^="choice-"]').first().click();
    cy.getByRole('presentation', 'Choose Languages')
      .next()
      .within(() => {
        cy.get('[id^="choice-"]').first().click();
        cy.get('[id^="choice-"]').eq(1).click();
      });
    cy.getByRole('presentation', 'Choose equipments')
      .next()
      .find('[id^="choice-"]')
      .first()
      .click();

    cy.getButton('Next').should('be.enabled').click();
    cy.getByRole('status', 'Updated successfully').should('be.visible');
    cy.getByTestId('close-background-edit').should('not.exist');

    // Test: Verify changes persisted
    cy.getByTestId('description-background').should('have.text', 'BackgroundAcolyte');
    cy.getByTestId('description-bonds').should(
      'have.text',
      'BondsI would die to recover an ancient relic of my faith that was lost long ago.'
    );
    cy.getByTestId('description-personality').should(
      'have.text',
      "PersonalityI idolize a particular hero of my faith, and constantly refer to that person's deeds and example.I can find common ground between the fiercest enemies, empathizing with them and always working toward peace."
    );
    cy.getByTestId('description-ideals').should(
      'have.text',
      'IdealsCharity. I always try to help those in need, no matter what the personal cost.'
    );
    cy.getByTestId('description-flaws').should(
      'have.text',
      'FlawsI judge others harshly, and myself even more severely.'
    );

    // Test: Verify aligment changes to match background restrictions
    cy.getByTestId('description-background-edit').click();
    cy.getByRole('presentation', 'Choose Ideals')
      .next()
      .should('have.text', 'Deselect your ideal to access all aligments');
    cy.getByRole('presentation', 'Choose Ideals')
      .next()
      .next()
      .find('[id^="choice-"]')
      .each(($ideal) => cy.wrap($ideal).click());
    cy.selectOption('#alignment', /^ $/);
    cy.getByRole('presentation', 'Choose Ideals')
      .next()
      .next()
      .within(() => {
        cy.get('[id^="choice-"]').should('have.length.above', 3);
        cy.get('[id^="choice-"]')
          .parentsUntil('label')
          .parent()
          .find(`:not(:contains('${delfyData.alignment.name}'))`)
          .first()
          .click();
      });
    cy.get('#alignment').click();
    cy.getByRole('option')
      .contains(delfyData.alignment.name)
      .should('have.attr', 'aria-disabled', 'true');
    cy.press('Escape');

    // Test: Revert to custom background
    cy.get('#background').click();
    cy.getByRole('option', 'Custom').click();
    cy.get('#alignment').should('have.value', '');
    cy.selectOption('#alignment', delfyData.alignment.name);
    cy.get('#bonds').clear().type(delfyData.bonds!.join('\n'));
    cy.get('#personality').clear().type(delfyData.personality!.join('\n'));
    cy.get('#ideals').clear().type(delfyData.ideals!.join('\n'));
    cy.get('#flaws').clear().type(delfyData.flaws!.join('\n'));
    cy.getButton('Next').click();
    cy.getByRole('status', 'Updated successfully').should('be.visible');

    cy.getByTestId('description-background').should('have.text', 'BackgroundCustom');
    cy.getByTestId('description-bonds').should('have.text', 'Bonds' + delfyData.bonds!.join(''));
    cy.getByTestId('description-personality').should(
      'have.text',
      'Personality' + delfyData.personality!.join('')
    );
    cy.getByTestId('description-ideals').should('have.text', 'Ideals' + delfyData.ideals!.join(''));
    cy.getByTestId('description-flaws').should('have.text', 'Flaws' + delfyData.flaws!.join(''));

    // Test: Cancel background edit via escape
    cy.getByTestId('description-background-edit').click();
    cy.get('#background').click();
    cy.getByRole('option', 'Acolyte').click();
    cy.press('Escape');
    cy.getByTestId('close-background-edit').should('not.exist');
    cy.getByTestId('description-background').should('have.text', 'BackgroundCustom');

    // Test: Cancel background edit via close button
    cy.getByTestId('description-background-edit').click();
    cy.get('#bonds').clear().type('This change should be cancelled');
    cy.getByTestId('close-background-edit').click();
    cy.getByTestId('description-bonds').should(
      'not.contain.text',
      'This change should be cancelled'
    );
    cy.getByTestId('description-bonds').should('include.text', delfyData.bonds![0]);

    // Test: Spell section
    clickUntilStep('spells');

    // Test: Next goes back to beginning
    cy.getByTestId('next-step').click();
    cy.getByTestId('stats-section').should('be.visible');

    // Test: Security, error, and recovery flows
    cy.visit('/');
    cy.visit('/character');
    cy.url().should('not.include', '/character');

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
    cy.visit('/');
    cy.waitForLoading();
    cy.getByTestId('character-card-').should('have.length.at.least', 1);

    cy.callFirestore('delete', `users/${Cypress.testUser.uid}/characters/${delfyData.id}/notes`);
    cy.getByTestId(`character-card-${delfyData.id}`).click();

    // Test: Add and edit notes
    cy.getByTestId(`notes-${delfyData.id}`).click();
    cy.getByTestId(`notes-drawer-${delfyData.id}`).within(($el) => {
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

    cy.getByTestId(`notes-${delfyData.id}`).click();
    cy.getByTestId(`notes-drawer-${delfyData.id}`).within(($el) => {
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
    cy.getByTestId(`notes-drawer-${delfyData.id}`).should('not.exist');
  });

  it('should handle equipment equip/unequip with AC updates, weight tracking, and strength warnings', () => {
    cy.visit('/');
    cy.waitForLoading();
    cy.getByTestId(`character-card-${delfyData.id}`).click();
    cy.getByTestId('character-container').should('be.visible');

    // Test: Initial state with armor equipped by default
    cy.getByTestId('armor-class').should('contain.text', 13);
    clickUntilStep('equipment');
    cy.getByTestId('inventory-weight').should('contain.text', 14);
    cy.getByTestId('-equip', { type: 'contains' }).should('have.length', 1);
    cy.getByTestId('equipment-item-leather-armor-equip').should('contain.text', 'Equipped');

    // Test: Unequip armor - AC & weight should update
    cy.getByTestId('equipment-item-leather-armor-equip').click();
    cy.getByTestId('equipment-item-leather-armor-equip').should('contain.text', 'Unequipped');
    clickUntilStep('stats', 'previous');
    cy.getByTestId('armor-class').should('contain.text', 12);
    clickUntilStep('equipment');
    cy.getByTestId('inventory-weight').should('contain.text', 4);

    // Test: Re-equip armor - AC & weight should update back
    cy.getByTestId('equipment-item-leather-armor-equip').click();
    cy.getByTestId('equipment-item-leather-armor-equip').should('contain.text', 'Equipped');
    clickUntilStep('stats', 'previous');
    cy.getByTestId('armor-class').should('contain.text', 13);
    clickUntilStep('equipment');
    cy.getByTestId('inventory-weight').should('contain.text', 14);

    // Test: Equipment state persists across page refresh
    cy.reload();
    cy.getByTestId('character-container').should('be.visible');
    cy.getByTestId('armor-class').should('contain.text', 13);
    clickUntilStep('equipment');
    cy.getByTestId('equipment-item-leather-armor-equip').should('contain.text', 'Equipped');

    // Test: Strength requirement warnings
    cy.visit('/');
    cy.waitForLoading();
    cy.getByTestId(`character-card-${devyData.id}`).click();
    cy.getByTestId('character-container').should('be.visible');
    cy.getByTestId('armor-class').should('contain.text', 18);
    clickUntilStep('equipment');

    // Test: Should show weight warning for Chain mail
    cy.getByTestId('equipment-item-chain-mail', { type: 'exact' }).within(($el) => {
      cy.wrap($el)
        .getByTestId('strength-requirement-warning')
        .should('be.visible')
        .trigger('mouseover');
    });
    cy.contains('Minimum strength requirement not met').should('be.visible');

    // Test: Shield can be equipped/unequipped independently
    cy.getByTestId('equipment-item-shield-equip').click();
    cy.getByTestId('equipment-item-shield-equip').should('contain.text', 'Unequipped');
    clickUntilStep('stats', 'previous');
    cy.getByTestId('armor-class').should('contain.text', 16);

    clickUntilStep('equipment');
    cy.getByTestId('equipment-item-shield-equip').click();
    cy.getByTestId('equipment-item-shield-equip').should('contain.text', 'Equipped');
    clickUntilStep('stats', 'previous');
    cy.getByTestId('armor-class').should('contain.text', 18);

    // Test: Unequip chain mail - still shows warning when unequipped
    clickUntilStep('equipment');
    cy.getByTestId('equipment-item-chain-mail-equip').click();
    cy.getByTestId('equipment-item-chain-mail-equip').should('contain.text', 'Unequipped');
    cy.getByTestId('equipment-item-chain-mail', { type: 'exact' })
      .getByTestId('strength-requirement-warning')
      .should('be.visible');
    clickUntilStep('stats', 'previous');
    cy.getByTestId('armor-class').should('contain.text', 14);
  });

  it('should handle delete character workflow with confirmation and cancellation', () => {
    const deleteTestCharacter = {
      ...delfyData,
      id: 'delete-test-character',
      name: 'Delete Test Character'
    };
    cy.createTestCharacter(Cypress.testUser.uid, deleteTestCharacter.id, deleteTestCharacter);

    cy.visit('/');
    cy.waitForLoading();
    cy.getByTestId(`character-card-${deleteTestCharacter.id}`).should('be.visible');
    cy.getByTestId(`character-card-${deleteTestCharacter.id}`).click();
    cy.getByTestId('character-container').should('be.visible');

    // Test: Delete button only visible on stats step
    cy.getByTestId(`delete-${deleteTestCharacter.id}`).should('be.visible');
    cy.getByTestId('next-step').click();
    cy.getByTestId(`delete-${deleteTestCharacter.id}`).should('not.exist');
    clickUntilStep('stats', 'previous');

    // Test: Cancel delete via Cancel button
    cy.getByTestId(`delete-${deleteTestCharacter.id}`).click();
    cy.getByRole('dialog').within(($dialog) => {
      cy.wrap($dialog).should('contain.text', `Delete ${deleteTestCharacter.name}`);
      cy.wrap($dialog).should('contain.text', 'Are you sure you want to delete this character?');
      cy.wrap($dialog).should('contain.text', 'This action cannot be undone.');
      cy.wrap($dialog).getButton('Cancel').should('be.visible').click();
    });
    cy.getByRole('dialog').should('not.exist');
    cy.getByTestId('character-container').should('be.visible');

    // Test: Cancel delete via Escape key
    cy.getByTestId(`delete-${deleteTestCharacter.id}`).click();
    cy.getByRole('dialog').should('be.visible');
    cy.press('Escape');
    cy.getByRole('dialog').should('not.exist');
    cy.getByTestId('character-container').should('be.visible');

    // Test: Confirm delete and verify redirect to home
    cy.getByTestId(`delete-${deleteTestCharacter.id}`).click();
    cy.getByRole('dialog').within(($dialog) => {
      cy.wrap($dialog).getButton('Ok').should('be.visible').click();
    });
    cy.url().should('not.include', '/character');
    cy.getByRole('status', 'Character deleted successfully').should('be.visible');

    cy.waitForLoading();
    cy.getByTestId(`character-card-${deleteTestCharacter.id}`).should('not.exist');
    cy.callFirestore(
      'get',
      `users/${Cypress.testUser.uid}/characters/${deleteTestCharacter.id}`
    ).should('be.null');
  });

  const clickUntilStep = (
    step: string,
    type: 'previous' | 'next' = 'next',
    i = 1
  ): Cypress.Chainable<JQuery<HTMLElement>> => {
    cy.getByTestId(`${type}-step`).click();
    return cy.getByTestId('-section', { type: 'contains' }).then((el) => {
      const currentLabel = el.attr('data-testId')?.replace('-section', '') || '';
      const maxReached = i >= 6;

      if (maxReached && currentLabel !== step)
        expect(currentLabel).contains(step, 'Step not found in 10 clicks');
      return currentLabel === step || maxReached ? cy.wrap(el) : clickUntilStep(step, type, i + 1);
    });
  };
});

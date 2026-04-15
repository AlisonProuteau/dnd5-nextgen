import * as dayjs from 'dayjs';
import { characters } from 'cypress/support/mocks/characterList';

describe('Character Action Record End-to-End', () => {
  const tillyData = characters.find(({ name }) => name === 'Tilly')!;
  const defaultCharData = {
    usedSpellSlots: {},
    health: { current: 3, temporary: 0, deathSaves: { successes: 0, failures: 0 } },
    money: { gp: 5, sp: 2, cp: 0 },
    resourceUsages: {}
  };
  const actionRecordChar = {
    ...tillyData,
    id: 'action-record-test-char',
    level: 3,
    traits: [
      ...(tillyData.traits ?? []),
      { index: 'relentless-endurance', name: 'Relentless Endurance' }
    ],
    knownSpells: [
      { index: 'magic-missile', name: 'Magic Missile', level: 1 },
      { index: 'shield', name: 'Shield', level: 1 },
      { index: 'sleep', name: 'Sleep', level: 1 },
      { index: 'burning-hands', name: 'Burning Hands', level: 1 },
      { index: 'detect-magic', name: 'Detect Magic', level: 1, ritual: true },
      { index: 'mage-armor', name: 'Mage Armor', level: 1 },
      { index: 'thunderwave', name: 'Thunderwave', level: 1 },
      { index: 'misty-step', name: 'Misty Step', level: 2 },
      { index: 'scorching-ray', name: 'Scorching Ray', level: 2 },
      { index: 'invisibility', name: 'Invisibility', level: 2 }
    ],
    preparedSpells: [
      { index: 'fire-bolt', name: 'Fire Bolt', level: 0 },
      { index: 'prestidigitation', name: 'Prestidigitation', level: 0 },
      { index: 'mage-hand', name: 'Mage Hand', level: 0 },
      { index: 'magic-missile', name: 'Magic Missile', level: 1 },
      { index: 'shield', name: 'Shield', level: 1 },
      { index: 'sleep', name: 'Sleep', level: 1 },
      { index: 'burning-hands', name: 'Burning Hands', level: 1 },
      { index: 'misty-step', name: 'Misty Step', level: 2 },
      { index: 'scorching-ray', name: 'Scorching Ray', level: 2 }
    ],
    ...defaultCharData
  };

  before(() => cy.createTestCharacter(Cypress.testUser.uid, actionRecordChar.id, actionRecordChar));

  beforeEach(() => {
    cy.callFirestore(
      'delete',
      `users/${Cypress.testUser.uid}/characters/${actionRecordChar.id}/actionRecords`
    );
    cy.callFirestore(
      'update',
      `users/${Cypress.testUser.uid}/characters/${actionRecordChar.id}`,
      defaultCharData
    );
    cy.login(Cypress.testUser.uid);
  });

  after(() =>
    cy.callFirestore('delete', `users/${Cypress.testUser.uid}/characters/${actionRecordChar.id}`)
  );

  it('should handle feature/trait/spell records with usage tracking, type switching, and filters', () => {
    cy.callFirestore(
      'set',
      `users/${Cypress.testUser.uid}/characters/${actionRecordChar.id}/actionRecords/past-custom-record`,
      {
        id: 'past-custom-record',
        type: 'custom',
        name: 'Past Session Notes',
        auto: false,
        createdAt: new Date('2020-06-15')
      }
    );

    cy.visit('/');
    cy.waitForLoading();
    cy.getByTestId(`character-card-${actionRecordChar.id}`).click();
    cy.getByTestId('character-container').should('be.visible');
    cy.getByTestId(`action-record-${actionRecordChar.id}`).click();

    // Test: Escape closes the drawer; Add Record form can also be dismissed with Escape
    cy.press('Escape');
    cy.getByTestId(`action-record-drawer-${actionRecordChar.id}`).should('not.exist');
    cy.getByTestId(`action-record-${actionRecordChar.id}`).click();
    cy.getByTestId('add-action-record').click();
    cy.getByRole('dialog', 'Add Action Record').should('be.visible');
    cy.press('Escape');
    cy.getByRole('dialog', 'Add Action Record').should('not.exist');
    cy.getByTestId(`action-record-drawer-${actionRecordChar.id}`).should('be.visible');
    cy.getByTestId('add-action-record').click();
    cy.getByRole('dialog', 'Add Action Record').should('be.visible');
    cy.getButton('Cancel').click();
    cy.getByRole('dialog', 'Add Action Record').should('not.exist');

    // Test: Add a Feature record (Arcane Recovery)
    cy.getByTestId('add-action-record').click();
    cy.getByRole('dialog', 'Add Action Record').within(($dialog) => {
      cy.wrap($dialog).getByRole('button', 'Feature').click();
      cy.wrap($dialog).getButton('Add Record').should('be.disabled');
    });
    cy.selectOption('#source-select', 'Arcane Recovery');
    cy.getByRole('dialog', 'Add Action Record').within(($dialog) => {
      cy.wrap($dialog).should('contain.text', 'You may push beyond your limit');
      cy.wrap($dialog).should('contain.text', 'uses');
      cy.wrap($dialog).should('contain.text', 'Resets on');
      cy.wrap($dialog).getButton('Add Record').should('be.enabled').click();
    });
    cy.getByRole('dialog', 'Add Action Record').should('not.exist');
    cy.getByTestId('record-item-')
      .should('have.length', 2)
      .should('contain.text', 'Arcane Recovery');

    cy.getButton('Close').click();
    cy.clickUntilStep('characteristics');
    cy.getByTestId('feature-name-arcane-recovery')
      .getButton(/^USE/)
      .should('be.disabled')
      .and('contain.text', '1/1');

    // Test: Add 2 Traits record (Infernal Legacy & Hellish Resistance)
    cy.getByTestId(`action-record-${actionRecordChar.id}`).click();
    cy.getByTestId('add-action-record').click();
    cy.getByRole('dialog', 'Add Action Record').getByRole('button', 'Trait').click();
    cy.selectOption('#source-select', 'Infernal Legacy');

    cy.getByRole('dialog', 'Add Action Record').within(($dialog) => {
      cy.wrap($dialog).should('contain.text', 'uses');
      cy.wrap($dialog).should('contain.text', 'Resets on');
      cy.wrap($dialog).getButton('Add Record').should('be.enabled').click();
    });
    cy.getByRole('dialog', 'Add Action Record').should('not.exist');
    cy.getByTestId('record-item-')
      .should('have.length', 3)
      .should('contain.text', 'Infernal Legacy');

    cy.getByTestId('add-action-record').click();
    cy.getByRole('dialog', 'Add Action Record').getByRole('button', 'Trait').click();
    cy.selectOption('#source-select', 'Hellish Resistance');

    cy.getByRole('dialog', 'Add Action Record').within(($dialog) => {
      cy.wrap($dialog).should('not.contain.text', 'uses');
      cy.wrap($dialog).should('not.contain.text', 'Resets on');
      cy.wrap($dialog).getButton('Add Record').should('be.enabled').click();
    });
    cy.getByRole('dialog', 'Add Action Record').should('not.exist');
    cy.getByTestId('record-item-')
      .should('have.length', 4)
      .should('contain.text', 'Hellish Resistance');

    cy.getButton('Close').click();
    cy.clickUntilStep('characteristics');
    cy.getByTestId('trait-name-infernal-legacy')
      .getButton(/^USE/)
      .should('be.disabled')
      .and('contain.text', '1/1');
    cy.getByTestId('trait-name-hellish-resistance').getButton(/^USE/).should('not.exist');

    // Test: Add a cantrip Spell record (Fire Bolt)
    cy.getByTestId(`action-record-${actionRecordChar.id}`).click();
    cy.getByTestId('add-action-record').click();
    cy.getByRole('dialog', 'Add Action Record').getByRole('button', 'Spell').click();
    cy.selectOption('#source-select', 'Fire Bolt');
    cy.getByRole('dialog', 'Add Action Record').within(($dialog) => {
      cy.wrap($dialog).should('not.contain.text', "Slot consumption isn't tracked here");
      cy.wrap($dialog).getButton('Add Record').should('be.enabled').click();
    });
    cy.getByRole('dialog', 'Add Action Record').should('not.exist');
    cy.getByTestId('record-item-').should('have.length', 5).should('contain.text', 'Fire Bolt');

    // Test: Add a leveled non-ritual Spell record (Magic Missile)
    cy.getByTestId('add-action-record').click();
    cy.getByRole('dialog', 'Add Action Record').getByRole('button', 'Spell').click();
    cy.selectOption('#source-select', 'Magic Missile');
    cy.getByRole('dialog', 'Add Action Record').within(($dialog) => {
      cy.wrap($dialog).getByTestId('ritual-checkbox').should('not.exist');
      cy.wrap($dialog).should('contain.text', "Slot consumption isn't tracked here");
      cy.wrap($dialog).getButton('Add Record').should('be.enabled').click();
    });
    cy.getByRole('dialog', 'Add Action Record').should('not.exist');
    cy.getByTestId('record-item-').should('have.length', 6).should('contain.text', 'Magic Missile');
    cy.getByTestId('record-item-')
      .filter(':contains("Magic Missile")')
      .should('not.contain.text', 'slot lvl');

    // Test: Ritual spell (Detect Magic)
    cy.getByTestId('add-action-record').click();
    cy.getByRole('dialog', 'Add Action Record').getByRole('button', 'Spell').click();
    cy.selectOption('#source-select', 'Detect Magic');
    cy.getByRole('dialog', 'Add Action Record').within(($dialog) => {
      cy.wrap($dialog).getByTestId('ritual-checkbox').should('be.visible');
      cy.wrap($dialog).should('contain.text', "Slot consumption isn't tracked here");
    });
    cy.getByRole('dialog', 'Add Action Record').getByTestId('ritual-checkbox').click();
    cy.getByRole('dialog', 'Add Action Record').within(($dialog) => {
      cy.wrap($dialog).should('not.contain.text', "Slot consumption isn't tracked here");
      cy.wrap($dialog).getButton('Add Record').click();
    });
    cy.getByRole('dialog', 'Add Action Record').should('not.exist');
    cy.getByTestId('record-item-').should('have.length', 7).and('contain.text', 'Detect Magic');
    cy.getByTestId('record-item-')
      .filter(':contains("Detect Magic")')
      .should('contain.text', 'Ritual Cast');

    // Test: Same ritual spell unchecked — no "Ritual Cast" in description
    cy.getByTestId('add-action-record').click();
    cy.getByRole('dialog', 'Add Action Record').getByRole('button', 'Spell').click();
    cy.selectOption('#source-select', 'Detect Magic');
    cy.getByRole('dialog', 'Add Action Record').within(($dialog) => {
      cy.wrap($dialog).getByTestId('ritual-checkbox').should('be.visible');
      cy.wrap($dialog).getButton('Add Record').click();
    });
    cy.getByRole('dialog', 'Add Action Record').should('not.exist');
    cy.getByTestId('record-item-').should('have.length', 8);
    cy.getByTestId('record-item-')
      .filter(':contains("Detect Magic")')
      .first()
      .should('not.contain.text', 'Ritual Cast');

    // Test: Add a full custom record
    cy.getByTestId('add-action-record').click();
    cy.getByRole('dialog', 'Add Action Record').within(($dialog) => {
      cy.wrap($dialog).getButton('Add Record').should('be.disabled');
      cy.get('#name').type('x').blur();
      cy.wrap($dialog).getButton('Add Record').should('be.enabled');
      cy.get('#name').clear().blur();
      cy.wrap($dialog).getButton('Add Record').should('be.disabled');
      cy.get('#name').type('Custom Action');
      cy.get('#value').type('6');
      cy.get('#valueUnit').type('dmg');
      cy.get('#description').type('Hit the goblin scout');
    });
    cy.selectOption('#equipment-select', 'Quarterstaff');
    cy.getByRole('dialog', 'Add Action Record').getButton('Add Record').click();
    cy.getByRole('dialog', 'Add Action Record').should('not.exist');
    cy.getByTestId('record-item-').should('have.length', 9);
    cy.getByTestId('record-item-')
      .filter(':contains("Custom Action")')
      .as('customRecord')
      .should('not.contain.text', 'auto')
      .and('contain.text', '+6 dmg')
      .and('contain.text', 'Hit the goblin scout')
      .and('contain.text', 'Quarterstaff');
    cy.get('@customRecord').getByTestId('record-delete').should('exist');

    // Test: Inline edit: save via click, save via keyboard, clear description
    cy.get('@customRecord').within(($record) => {
      cy.wrap($record).getByTestId('record-edit').click();
      cy.wrap($record).getByTestId('record-edit').should('not.exist');
      cy.wrap($record).find('textarea').first().clear().type('Updated description');
      cy.wrap($record).getByTestId('record-save').click();
      cy.wrap($record).getByTestId('record-save').should('not.exist');
      cy.wrap($record)
        .should('contain.text', 'Updated description')
        .and('not.contain.text', 'Hit the goblin scout');

      cy.wrap($record).getByTestId('record-edit').click();
      cy.wrap($record)
        .find('textarea')
        .first()
        .clear()
        .type('Saved via keyboard')
        .type('{ctrl+enter}');
      cy.wrap($record).getByTestId('record-save').should('not.exist');
      cy.wrap($record).should('contain.text', 'Saved via keyboard');

      cy.wrap($record).getByTestId('record-edit').click();
      cy.wrap($record).find('textarea').first().clear();
      cy.wrap($record).getByTestId('record-save').click();
      cy.wrap($record).should('not.contain.text', 'Saved via keyboard');
    });

    // Test: Type switching resets the source and name fields
    cy.getByTestId('add-action-record').click();
    cy.getByRole('dialog', 'Add Action Record').getByRole('button', 'Spell').click();
    cy.selectOption('#source-select', 'Magic Missile');
    cy.getByRole('dialog', 'Add Action Record').within(($dialog) => {
      cy.get('#source-select').should('contain.text', 'Magic Missile');
      cy.wrap($dialog).getByRole('button', 'Custom').click();
      cy.get('#source-select').should('not.exist');
      cy.get('#name').should('have.value', '');
      cy.wrap($dialog).getButton('Cancel').click();
    });

    // Test: Records persist across page reload
    cy.reload();
    cy.getByTestId(`action-record-${actionRecordChar.id}`).click();
    cy.getByTestId('record-item-').should('have.length', 9);

    // Test: Filter
    cy.getByRole('button', 'Features').click();
    cy.getByTestId('record-item-')
      .should('have.length', 1)
      .should('contain.text', 'Arcane Recovery');

    cy.getByRole('button', 'Traits').click();
    cy.getByTestId('record-item-')
      .should('have.length', 2)
      .should('contain.text', 'Infernal Legacy')
      .should('contain.text', 'Hellish Resistance');

    cy.getByRole('button', 'Spells').click();
    cy.getByTestId('record-item-').should('have.length', 4);
    cy.getByTestId('record-item-').should('contain.text', 'Fire Bolt');
    cy.getByTestId('record-item-').should('contain.text', 'Magic Missile');
    cy.getByTestId('record-item-').should('contain.text', 'Detect Magic');

    cy.getByRole('button', 'Custom').click();
    cy.getByTestId('record-item-')
      .should('have.length', 2)
      .and('contain.text', 'Custom Action')
      .and('contain.text', 'Past Session Notes');

    // Test: All filter restores full list
    cy.getByRole('button', 'All').click();
    cy.getByTestId('record-item-').should('have.length', 9);

    // Test: Active filter doesn't reset to All when drawer is closed and reopened
    cy.getByRole('button', 'Spells').click();
    cy.getByTestId('record-item-').should('have.length', 4);
    cy.getButton('Close').click();
    cy.getByTestId(`action-record-${actionRecordChar.id}`).click();
    cy.getByTestId('record-item-').should('have.length', 4);
    cy.getByRole('button', 'Spells').click();
    cy.getByTestId('record-item-').should('have.length', 9);

    // Test: Deleting the Feature record decrements the resource usage counter
    cy.getByTestId('record-item-')
      .filter(':contains("Arcane Recovery")')
      .getByTestId('record-delete')
      .click();
    cy.getByTestId('record-item-').should('have.length', 8);

    // Test: Active filter with no matching records shows empty state
    cy.getByRole('button', 'Features').click();
    cy.getByTestId(`action-record-drawer-${actionRecordChar.id}`).should(
      'contain.text',
      'Nothing to show yet'
    );

    // Test: Date range filter
    cy.getByRole('button', 'All').click();
    cy.getByTestId('record-item-').should('have.length', 8);
    cy.getByTestId('date-filter-clear').should('not.exist');

    cy.get('#dateFilterTo').parent().type('01012000');
    cy.getByTestId(`action-record-drawer-${actionRecordChar.id}`).should(
      'contain.text',
      'Nothing to show yet'
    );
    cy.getByTestId('date-filter-clear').should('be.visible');
    cy.getByTestId('date-filter-clear').click();

    cy.get('#dateFilterTo').parent().type('31122025');
    cy.getByTestId('record-item-')
      .should('have.length', 1)
      .and('contain.text', 'Past Session Notes');
    cy.getByTestId('date-filter-clear').click();
    cy.getByTestId('record-item-').should('have.length', 8);

    cy.get('#dateFilterFrom').parent().type(dayjs().format('DDMMYYYY'));
    cy.getByTestId('record-item-')
      .should('have.length', 7)
      .and('not.contain.text', 'Past Session Notes');
    cy.getByTestId('date-filter-clear').click();
    cy.getByTestId('record-item-').should('have.length', 8);
    cy.getByTestId(`action-record-drawer`).should('contain.text', '8 records');

    // Test: Clear All
    cy.getByRole('button', 'Custom').click();
    cy.getByTestId('record-item-').should('have.length', 2);
    cy.getByTestId(`action-record-drawer`).should('contain.text', '2 records');
    cy.getByTestId('clear-all-records').click();
    cy.getByTestId(`action-record-drawer`).should('contain.text', 'Nothing to show yet');
    cy.getByRole('button', 'All').click();
    cy.getByTestId('record-item-').should('have.length', 6);
    cy.getByTestId(`action-record-drawer`).should('contain.text', '6 records');
    cy.getByTestId('clear-all-records').click();
    cy.getByTestId(`action-record-drawer`).should('contain.text', 'Nothing to show yet');

    cy.getButton('Close').click();
    cy.clickUntilStep('characteristics');
    cy.getByTestId('feature-name-arcane-recovery')
      .getButton(/^USE/)
      .should('be.enabled')
      .and('contain.text', '0/1');
  });

  it('should auto-log records from health changes, money changes, spell casting, and USE actions', () => {
    cy.visit('/');
    cy.waitForLoading();
    cy.getByTestId(`character-card-${actionRecordChar.id}`).click();
    cy.getByTestId('character-container').should('be.visible');

    // Test: Drawer shows empty state when no records exist
    cy.getByTestId(`action-record-${actionRecordChar.id}`).click();
    cy.getByTestId(`action-record-drawer-${actionRecordChar.id}`).should(
      'contain.text',
      'Nothing to show yet'
    );
    cy.getButton('Close').click();
    cy.getByTestId(`action-record-drawer-${actionRecordChar.id}`).should('not.exist');

    // Test: Health damage
    cy.getByTestId(`health-${actionRecordChar.id}`).click();
    cy.getByRole('dialog', 'Manage Health').within(($dialog) => {
      cy.get('#currentHealth').clear().type('1');
      cy.wrap($dialog).getButton('Save').click();
    });
    cy.getByRole('status', 'Health Updated').should('be.visible');

    cy.getByTestId(`action-record-${actionRecordChar.id}`).click();
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
    cy.getByTestId(`health-${actionRecordChar.id}`).click();
    cy.getByRole('dialog', 'Manage Health').within(($dialog) => {
      cy.get('#currentHealth').clear().type('3');
      cy.wrap($dialog).getButton('Save').click();
    });
    cy.getByRole('status', 'Health Updated').should('be.visible');

    cy.getByTestId(`action-record-${actionRecordChar.id}`).click();
    cy.getByRole('button', 'Health').click();
    cy.getByTestId('record-item-').should('have.length', 2);
    cy.getByTestId('record-item-')
      .first()
      .should('contain.text', 'Healed')
      .and('contain.text', '+2')
      .and('contain.text', 'auto');
    cy.getByTestId('record-item-').last().should('contain.text', 'Took Damage');

    // Test: Temporary Health change
    cy.getButton('Close').click();
    cy.getByTestId(`health-${actionRecordChar.id}`).click();
    cy.getByRole('dialog', 'Manage Health').within(($dialog) => {
      cy.get('#temporaryHealth').clear().type('5').blur();
      cy.wrap($dialog).getButton('Save').click();
    });
    cy.getByRole('status', 'Health Updated').should('be.visible');

    cy.getByTestId(`action-record-${actionRecordChar.id}`).click();
    cy.getByRole('button', 'Health').click();
    cy.getByTestId('record-item-').should('have.length', 3);
    cy.getByTestId('record-item-')
      .first()
      .should('contain.text', 'Gained Temporary Health')
      .and('contain.text', '+5')
      .and('contain.text', 'auto');
    cy.getButton('Close').click();

    // Test: Lost Temporary Health
    cy.getByTestId(`health-${actionRecordChar.id}`).click();
    cy.getByRole('dialog', 'Manage Health').within(($dialog) => {
      cy.get('#temporaryHealth').clear().type('0').blur();
      cy.wrap($dialog).getButton('Save').click();
    });
    cy.getByRole('status', 'Health Updated').should('be.visible');

    cy.getByTestId(`action-record-${actionRecordChar.id}`).click();
    cy.getByRole('button', 'Health').click();
    cy.getByTestId('record-item-').should('have.length', 4);
    cy.getByTestId('record-item-')
      .first()
      .should('contain.text', 'Lost Temporary Health')
      .and('contain.text', '-5')
      .and('contain.text', 'auto');
    cy.getButton('Close').click();

    // Test: Money change
    cy.getByTestId(`coin-purse-${actionRecordChar.id}`).click();
    cy.getByRole('dialog', 'Manage Money').within(($dialog) => {
      cy.get('#money-units-gp').clear().type('3');
      cy.wrap($dialog).getButton('Save').click();
    });
    cy.getByRole('status', 'Money Updated').should('be.visible');

    cy.getByTestId(`action-record-${actionRecordChar.id}`).click();
    cy.getByRole('button', 'Money').click();
    cy.getByTestId('record-item-').should('have.length', 1);
    cy.getByTestId('record-item-')
      .first()
      .should('contain.text', '+3 Gold Pieces')
      .and('contain.text', 'auto');
    cy.getButton('Close').click();

    // Test: Money decrease
    cy.getByTestId(`coin-purse-${actionRecordChar.id}`).click();
    cy.getByRole('dialog', 'Manage Money').within(($dialog) => {
      cy.get('#money-units-gp').clear().type('-4');
      cy.wrap($dialog).getButton('Save').click();
    });
    cy.getByRole('status', 'Money Updated').should('be.visible');

    cy.getByTestId(`action-record-${actionRecordChar.id}`).click();
    cy.getByTestId('record-item-').should('have.length', 2);
    cy.getByTestId('record-item-')
      .first()
      .should('contain.text', '-4 Gold Pieces')
      .and('contain.text', 'auto');
    cy.getButton('Close').click();

    // Test: Cast Spell from Spellbook
    cy.clickUntilStep('spells', 'previous');
    cy.getByTestId('spells-section').should('be.visible');
    cy.getByTestId('spell-list-1').getByTestId('cast-spell-magic-missile').click();
    cy.getByRole('menu', 'Level').getByRole('menuitem', 'Level 1').click();
    cy.getByRole('menu', 'Level').should('not.exist');

    cy.getByTestId(`action-record-${actionRecordChar.id}`).click();
    cy.getByRole('button', 'Spells').click();
    cy.getByTestId('record-item-').should('have.length', 1);
    cy.getByTestId('record-item-')
      .first()
      .should('contain.text', 'Magic Missile')
      .and('contain.text', '+1 slot lvl')
      .and('contain.text', 'auto');
    cy.getButton('Close').click();

    // Test: Upcast Spell from Spellbook
    cy.getByTestId('spell-list-1').getByTestId('cast-spell-magic-missile').click();
    cy.getByRole('menu', 'Level').getByRole('menuitem', 'Level 2').click();
    cy.getByRole('menu', 'Level').should('not.exist');

    cy.getByTestId(`action-record-${actionRecordChar.id}`).click();
    cy.getByTestId('record-item-').should('have.length', 2);
    cy.getByTestId('record-item-')
      .first()
      .should('contain.text', 'Magic Missile')
      .and('contain.text', '+2 slot lvl')
      .and('contain.text', 'Upcast from lvl1 spell')
      .and('contain.text', 'auto');
    cy.getButton('Close').click();

    // Test: Delete auto-logged spell records
    cy.getByTestId('spell-slots').should('contain.text', 'Level 1').and('contain.text', '3 of 4');
    cy.getByTestId('spell-slots').should('contain.text', 'Level 2').and('contain.text', '1 of 2');

    cy.getByTestId(`action-record-${actionRecordChar.id}`).click();
    cy.getByTestId('record-item-').should('have.length', 2);
    cy.getByTestId('record-item-')
      .filter(':contains("+2 slot lvl")')
      .getByTestId('record-delete')
      .click();
    cy.getByTestId('record-item-').should('have.length', 1);
    cy.getButton('Close').click();
    cy.getByTestId('spell-slots').should('contain.text', 'Level 2').and('contain.text', '2 of 2');

    cy.getByTestId(`action-record-${actionRecordChar.id}`).click();
    cy.getByTestId('record-item-')
      .filter(':contains("+1 slot lvl")')
      .getByTestId('record-delete')
      .click();
    cy.getByTestId(`action-record-drawer-${actionRecordChar.id}`).should(
      'contain.text',
      'Nothing to show yet'
    );
    cy.getButton('Close').click();
    cy.getByTestId('spell-slots').should('contain.text', 'Level 1').and('contain.text', '4 of 4');
    cy.getByTestId('spell-slots').getButton('Rest').should('not.exist');

    // Test: Clicking USE on a trait
    cy.clickUntilStep('characteristics');
    cy.getByTestId('trait-name-infernal-legacy').getButton(/^USE/).click();

    cy.getByTestId(`action-record-${actionRecordChar.id}`).click();
    cy.getByRole('button', 'Traits').click();
    cy.getByTestId('record-item-').should('have.length', 1);
    cy.getByTestId('record-item-')
      .first()
      .should('contain.text', 'Infernal Legacy')
      .and('contain.text', 'auto');
    cy.getButton('Close').click();

    // Test: Clicking USE on a feature
    cy.getByTestId('feature-name-arcane-recovery').getButton(/^USE/).click();

    cy.getByTestId(`action-record-${actionRecordChar.id}`).click();
    cy.getByRole('button', 'Features').click();
    cy.getByTestId('record-item-').should('have.length', 1);
    cy.getByTestId('record-item-')
      .first()
      .should('contain.text', 'Arcane Recovery')
      .and('contain.text', 'auto');

    // Test: Delete auto-logged feature record
    cy.getByTestId('record-delete').click();
    cy.getByTestId(`action-record-drawer-${actionRecordChar.id}`).should(
      'contain.text',
      'Nothing to show yet'
    );
    cy.getButton('Close').click();
    cy.getByTestId('feature-name-arcane-recovery')
      .getButton(/^USE/)
      .should('be.enabled')
      .and('contain.text', '0/1');

    // Test: Relentless Endurance
    cy.getByTestId(`health-${actionRecordChar.id}`).click();
    cy.getByRole('dialog', 'Manage Health').within(($dialog) => {
      cy.get('#currentHealth').clear().type('0');
      cy.contains('racial ability').should('be.visible');
      cy.wrap($dialog).getButton('Save').click();
    });
    cy.getByRole('status', 'Health Updated').should('be.visible');

    cy.getByTestId(`action-record-${actionRecordChar.id}`).click();
    cy.getByRole('button', 'Traits').click();
    cy.getByTestId('record-item-').should('have.length', 2);
    cy.getByTestId('record-item-')
      .first()
      .should('contain.text', 'Relentless Endurance')
      .and('contain.text', 'auto');

    // Test: Delete auto-logged trait record
    cy.getByTestId('record-item-', { selector: ':contains("Infernal")' })
      .getByTestId('record-delete')
      .click();

    cy.getByTestId('record-item-').should('have.length', 1);
    cy.getButton('Close').click();
    cy.getByTestId('trait-name-infernal-legacy')
      .getButton(/^USE/)
      .should('be.enabled')
      .and('contain.text', '0/1');

    // Test: Editing an auto-logged record's description
    cy.getByTestId(`action-record-${actionRecordChar.id}`).click();
    cy.getByTestId('record-item-')
      .first()
      .within(($el) => {
        cy.wrap($el).getByTestId('record-edit').click();
        cy.wrap($el).find('textarea').first().type('Saved by Relentless Endurance!');
        cy.wrap($el).getByTestId('record-save').click();
        cy.wrap($el).should('contain.text', 'Saved by Relentless Endurance!');
      });

    // Test: Escape discards unsaved inline edit changes
    cy.getByTestId('record-item-')
      .first()
      .within(($el) => {
        cy.wrap($el).getByTestId('record-edit').click();
        cy.wrap($el).getByTestId('record-save').should('be.visible');
        cy.wrap($el).find('textarea').first().type('Should not save this');
        cy.press('Escape');
        cy.wrap($el).getByTestId('record-save').should('not.exist');
        cy.wrap($el).should('not.contain.text', 'Should not save this');
        cy.wrap($el).should('contain.text', 'Saved by Relentless Endurance!');
      });

    cy.getButton('Close').click();

    // Test: Override Hit Points
    cy.getByTestId(`health-${actionRecordChar.id}`).click();
    cy.getByRole('dialog', 'Manage Health').within(($dialog) => {
      cy.contains('Override Hit Points').closest('label').find('input[type="checkbox"]').check();
      cy.get('#currentHealth').clear().type('8');
      cy.wrap($dialog).getButton('Save').click();
    });
    cy.getByRole('status', 'Health Updated').should('be.visible');

    cy.getByTestId(`action-record-${actionRecordChar.id}`).click();
    cy.getByRole('button', 'Health').click();
    cy.getByTestId('record-item-')
      .first()
      .should('contain.text', 'Hit points updated')
      .and('contain.text', 'Initial: 6')
      .and('contain.text', 'Final: 8')
      .and('contain.text', 'auto');
    cy.getByTestId('record-item-').first().getByTestId('record-delete').should('exist');

    // Test: Death saves – HP drop and first failure in same session
    cy.getButton('Close').click();
    cy.getByTestId(`health-${actionRecordChar.id}`).click();
    cy.getByRole('dialog', 'Manage Health').within(($dialog) => {
      cy.get('#currentHealth').clear().type('0').blur();
      cy.get('#deathSaveFailures').should('be.visible').clear().type('1').blur();
      cy.wrap($dialog).getButton('Save').click();
    });
    cy.getByRole('status', 'Health Updated').should('be.visible');

    cy.getByTestId(`action-record-${actionRecordChar.id}`).click();
    cy.getByTestId('record-item-').should('have.length', 9);
    cy.getByTestId('record-item-')
      .eq(0)
      .should('contain.text', 'Death Save')
      .and('contain.text', 'failure');
    cy.getByTestId('record-item-').eq(1).should('contain.text', 'Took Damage');

    // Test: Failure incremented twice in the same dialog session
    cy.getButton('Close').click();
    cy.getByTestId(`health-${actionRecordChar.id}`).click();
    cy.getByRole('dialog', 'Manage Health').within(($dialog) => {
      cy.get('#deathSaveFailures').should('be.visible').clear().type('2').blur();
      cy.get('#deathSaveFailures').clear().type('3').blur();
      cy.wrap($dialog).getButton('Save').click();
    });
    cy.getByRole('status', 'Health Updated').should('be.visible');

    cy.getByTestId(`action-record-${actionRecordChar.id}`).click();
    cy.getByTestId('record-item-').should('have.length', 10);
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
    cy.getByTestId(`health-${actionRecordChar.id}`).click();
    cy.getByRole('dialog', 'Manage Health').within(($dialog) => {
      cy.get('#deathSaveSuccesses').should('be.visible').clear().type('1').blur();
      cy.get('#deathSaveFailures').clear().type('2').blur();
      cy.wrap($dialog).getButton('Save').click();
    });
    cy.getByRole('status', 'Health Updated').should('be.visible');

    cy.getByTestId(`action-record-${actionRecordChar.id}`).click();
    cy.getByTestId('record-item-').should('have.length', 12);
    cy.getByTestId('record-item-')
      .eq(0)
      .should('contain.text', 'Death Save')
      .and('contain.text', 'failure');
    cy.getByTestId('record-item-')
      .eq(1)
      .should('contain.text', 'Death Save')
      .and('contain.text', 'success');

    // Test: Auto-resets death saves silently
    cy.getButton('Close').click();
    cy.getByTestId(`health-${actionRecordChar.id}`).click();
    cy.getByRole('dialog', 'Manage Health').within(($dialog) => {
      cy.get('#currentHealth').clear().type('3').blur();
      cy.wrap($dialog).getButton('Save').click();
    });
    cy.getByRole('status', 'Health Updated').should('be.visible');

    cy.getByTestId(`action-record-${actionRecordChar.id}`).click();
    cy.getByTestId('record-item-').should('have.length', 13);
    cy.getByTestId('record-item-').eq(0).should('contain.text', 'Healed');

    // Test: Cancel discards the entire backlog – no new records logged
    cy.getButton('Close').click();
    cy.getByTestId(`health-${actionRecordChar.id}`).click();
    cy.getByRole('dialog', 'Manage Health').within(($dialog) => {
      cy.get('#currentHealth').clear().type('0').blur();
      cy.get('#deathSaveFailures').should('be.visible').clear().type('1').blur();
      cy.wrap($dialog).getButton('Cancel').click();
    });
    cy.getByTestId(`action-record-${actionRecordChar.id}`).click();
    cy.getByTestId('record-item-').should('have.length', 13);

    // Test: Reset button logs a "Reset Health" summary record
    cy.getButton('Close').click();
    cy.getByTestId(`health-${actionRecordChar.id}`).click();
    cy.getByRole('dialog', 'Manage Health').within(($dialog) => {
      cy.get('#currentHealth').clear().type('0').blur();
      cy.get('#deathSaveFailures').should('be.visible').clear().type('2').blur();
      cy.getByTestId('reset-health-button').click();
      cy.wrap($dialog).getButton('Save').click();
    });
    cy.getByRole('status', 'Health Updated').should('be.visible');

    cy.getByTestId(`action-record-${actionRecordChar.id}`).click();
    cy.getByTestId('record-item-').should('have.length', 14);
    cy.getByTestId('record-item-')
      .eq(0)
      .should('contain.text', 'Reset Health')
      .and('contain.text', 'Current HP: 3 -> 8')
      .and('contain.text', 'Reset Racial Ability uses')
      .and('contain.text', 'Pending Logs:')
      .and('contain.text', 'Took Damage: -3 HP')
      .and('contain.text', 'Death Save: 2 failure');
  });
});

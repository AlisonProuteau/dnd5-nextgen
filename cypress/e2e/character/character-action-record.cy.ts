import dayjs from 'dayjs';
import { characters } from '../../support/mocks/characterList';

describe('Character Action Record', () => {
  const tillyData = characters.find(({ name }) => name === 'Tilly')!;
  const defaultCharData = {
    usedSpellSlots: {},
    health: { current: 3, temporary: 0, deathSaves: { successes: 0, failures: 0 } },
    money: { gp: 5, sp: 2, cp: 0 },
    resourceUsages: {},
    conditions: [],
    features: [...(tillyData.features ?? []), { index: 'signature-spell', name: 'Signature Spell' }]
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
    temporarySpells: [{ index: 'hold-person', name: 'Hold Person', level: 2 }],
    ...defaultCharData
  };

  before(() => cy.seedCharacter(Cypress.testUser.uid, actionRecordChar.id, actionRecordChar));

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
  });

  after(() =>
    cy.callFirestore('delete', `users/${Cypress.testUser.uid}/characters/${actionRecordChar.id}`)
  );

  context('Manual record creation & edit', () => {
    it('should add Feature and Trait records and update the character sheet USE counters', () => {
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

      cy.visitAs(Cypress.testUser.uid, '/');
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

      // Test: Add a Feature record (Signature Spell)
      cy.getByTestId('add-action-record').click();
      cy.getByRole('dialog', 'Add Action Record').within(($dialog) => {
        cy.wrap($dialog).getByRole('button', 'Feature').click();
        cy.wrap($dialog).getButton('Add Record').should('be.disabled');
      });
      cy.selectOption('#source-select', 'Signature Spell');
      cy.getByRole('dialog', 'Add Action Record').within(($dialog) => {
        cy.wrap($dialog).should('contain.text', 'You may push beyond your limit');
        cy.wrap($dialog).should('contain.text', 'uses');
        cy.wrap($dialog).should('contain.text', 'Resets on');
        cy.wrap($dialog).getButton('Add Record').should('be.enabled').click();
      });
      cy.getByRole('dialog', 'Add Action Record').should('not.exist');
      cy.getByTestId('record-item-')
        .should('have.length', 2)
        .should('contain.text', 'Signature Spell');

      cy.getButton('Close').click();
      cy.clickUntilStep('characteristics');
      cy.getByTestId('feature-name-signature-spell')
        .getButton(/^USE/)
        .should('not.be.disabled')
        .and('contain.text', '1/2');

      // Test: Add 2 Traits records (Infernal Legacy & Hellish Resistance)
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
    });

    it('should add Spell records — cantrip, leveled, temporary, and ritual variants', () => {
      cy.visitAs(Cypress.testUser.uid, '/');
      cy.getByTestId(`character-card-${actionRecordChar.id}`).click();
      cy.getByTestId('character-container').should('be.visible');
      cy.getByTestId(`action-record-${actionRecordChar.id}`).click();

      // Test: Add a cantrip Spell record (Fire Bolt)
      cy.getByTestId('add-action-record').click();
      cy.getByRole('dialog', 'Add Action Record').getByRole('button', 'Spell').click();
      cy.selectOption('#source-select', 'Fire Bolt');
      cy.getByRole('dialog', 'Add Action Record').within(($dialog) => {
        cy.wrap($dialog).should('not.contain.text', "Slot consumption isn't tracked here");
        cy.wrap($dialog).getButton('Add Record').should('be.enabled').click();
      });
      cy.getByRole('dialog', 'Add Action Record').should('not.exist');
      cy.getByTestId('record-item-').should('have.length', 1).should('contain.text', 'Fire Bolt');

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
      cy.getByTestId('record-item-')
        .should('have.length', 2)
        .should('contain.text', 'Magic Missile');
      cy.getByTestId('record-item-')
        .filter(':contains("Magic Missile")')
        .should('not.contain.text', 'slot lvl');

      // Test: Temporary spell — appears in source select with "Temp" label and can be recorded
      cy.getByTestId('add-action-record').click();
      cy.getByRole('dialog', 'Add Action Record').getByRole('button', 'Spell').click();
      cy.get('#source-select').click();
      cy.get('[role="option"]')
        .filter(':contains("Hold Person")')
        .should('contain.text', 'Temp')
        .click();
      cy.getByRole('dialog', 'Add Action Record').within(($dialog) => {
        cy.wrap($dialog).should('contain.text', "Slot consumption isn't tracked here");
        cy.wrap($dialog).getButton('Add Record').should('be.enabled').click();
      });
      cy.getByRole('dialog', 'Add Action Record').should('not.exist');
      cy.getByTestId('record-item-').should('have.length', 3).should('contain.text', 'Hold Person');

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
      cy.getByTestId('record-item-').should('have.length', 4).and('contain.text', 'Detect Magic');
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
      cy.getByTestId('record-item-').should('have.length', 5);
      cy.getByTestId('record-item-')
        .filter(':contains("Detect Magic")')
        .first()
        .should('not.contain.text', 'Ritual Cast');
    });

    it('should add a Custom record with all fields and enforce the required name', () => {
      cy.visitAs(Cypress.testUser.uid, '/');
      cy.getByTestId(`character-card-${actionRecordChar.id}`).click();
      cy.getByTestId('character-container').should('be.visible');
      cy.getByTestId(`action-record-${actionRecordChar.id}`).click();

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
      cy.getByTestId('record-item-').should('have.length', 1);
      cy.getByTestId('record-item-')
        .filter(':contains("Custom Action")')
        .as('customRecord')
        .should('not.contain.text', 'auto')
        .and('contain.text', '+6 dmg')
        .and('contain.text', 'Hit the goblin scout')
        .and('contain.text', 'Quarterstaff');
      cy.get('@customRecord').getByTestId('record-delete').should('exist');
    });

    it('should inline-edit descriptions via click-save and Ctrl+Enter, and discard with Escape', () => {
      cy.callFirestore(
        'set',
        `users/${Cypress.testUser.uid}/characters/${actionRecordChar.id}/actionRecords/custom-1`,
        {
          id: 'custom-1',
          type: 'custom',
          name: 'Custom Action',
          value: 6,
          valueUnit: 'dmg',
          description: 'Hit the goblin scout',
          auto: false,
          createdAt: new Date()
        }
      );

      cy.visitAs(Cypress.testUser.uid, '/');
      cy.getByTestId(`character-card-${actionRecordChar.id}`).click();
      cy.getByTestId(`action-record-${actionRecordChar.id}`).click();
      cy.getByTestId('record-item-').filter(':contains("Custom Action")').as('customRecord');

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

      // Test: Escape discards unsaved inline edit changes
      cy.get('@customRecord').within(($record) => {
        cy.wrap($record).getByTestId('record-edit').click();
        cy.wrap($record).find('textarea').first().type('Unsaved change');
        cy.press('Escape');
        cy.wrap($record).getByTestId('record-save').should('not.exist');
        cy.wrap($record).should('not.contain.text', 'Unsaved change');
      });
    });
  });

  context('Filtering & state', () => {
    beforeEach(() => {
      // Seed a variety of records for filtering tests
      const now = new Date();
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
      cy.callFirestore(
        'set',
        `users/${Cypress.testUser.uid}/characters/${actionRecordChar.id}/actionRecords/feature-rec`,
        {
          id: 'feature-rec',
          type: 'feature',
          name: 'Signature Spell',
          sourceIndex: 'signature-spell',
          auto: false,
          createdAt: now
        }
      );
      cy.callFirestore(
        'set',
        `users/${Cypress.testUser.uid}/characters/${actionRecordChar.id}/actionRecords/trait-rec-1`,
        {
          id: 'trait-rec-1',
          type: 'trait',
          name: 'Infernal Legacy',
          sourceIndex: 'infernal-legacy',
          auto: false,
          createdAt: now
        }
      );
      cy.callFirestore(
        'set',
        `users/${Cypress.testUser.uid}/characters/${actionRecordChar.id}/actionRecords/trait-rec-2`,
        {
          id: 'trait-rec-2',
          type: 'trait',
          name: 'Hellish Resistance',
          auto: false,
          createdAt: now
        }
      );
      cy.callFirestore(
        'set',
        `users/${Cypress.testUser.uid}/characters/${actionRecordChar.id}/actionRecords/spell-rec-1`,
        { id: 'spell-rec-1', type: 'spell', name: 'Fire Bolt', auto: false, createdAt: now }
      );
      cy.callFirestore(
        'set',
        `users/${Cypress.testUser.uid}/characters/${actionRecordChar.id}/actionRecords/spell-rec-2`,
        { id: 'spell-rec-2', type: 'spell', name: 'Magic Missile', auto: false, createdAt: now }
      );
      cy.callFirestore(
        'set',
        `users/${Cypress.testUser.uid}/characters/${actionRecordChar.id}/actionRecords/spell-rec-3`,
        { id: 'spell-rec-3', type: 'spell', name: 'Hold Person', auto: false, createdAt: now }
      );
      cy.callFirestore(
        'set',
        `users/${Cypress.testUser.uid}/characters/${actionRecordChar.id}/actionRecords/spell-rec-4`,
        { id: 'spell-rec-4', type: 'spell', name: 'Detect Magic', auto: false, createdAt: now }
      );
      cy.callFirestore(
        'set',
        `users/${Cypress.testUser.uid}/characters/${actionRecordChar.id}/actionRecords/spell-rec-5`,
        {
          id: 'spell-rec-5',
          type: 'spell',
          name: 'Detect Magic (ritual)',
          auto: false,
          createdAt: now
        }
      );
      cy.callFirestore(
        'set',
        `users/${Cypress.testUser.uid}/characters/${actionRecordChar.id}/actionRecords/custom-rec`,
        { id: 'custom-rec', type: 'custom', name: 'Custom Action', auto: false, createdAt: now }
      );
    });

    it('should filter by type, show empty state, and retain the active filter on drawer reopen', () => {
      cy.visitAs(Cypress.testUser.uid, '/');
      cy.getByTestId(`character-card-${actionRecordChar.id}`).click();
      cy.getByTestId(`action-record-${actionRecordChar.id}`).click();

      // Test: Filter
      cy.getByRole('button', 'Features').click();
      cy.getByTestId('record-item-')
        .should('have.length', 1)
        .should('contain.text', 'Signature Spell');

      cy.getByRole('button', 'Traits').click();
      cy.getByTestId('record-item-')
        .should('have.length', 2)
        .should('contain.text', 'Infernal Legacy')
        .should('contain.text', 'Hellish Resistance');

      cy.getByRole('button', 'Spells').click();
      cy.getByTestId('record-item-').should('have.length', 5);
      cy.getByTestId('record-item-').should('contain.text', 'Fire Bolt');
      cy.getByTestId('record-item-').should('contain.text', 'Magic Missile');
      cy.getByTestId('record-item-').should('contain.text', 'Hold Person');
      cy.getByTestId('record-item-').should('contain.text', 'Detect Magic');

      cy.getByRole('button', 'Custom').click();
      cy.getByTestId('record-item-')
        .should('have.length', 2)
        .and('contain.text', 'Custom Action')
        .and('contain.text', 'Past Session Notes');

      // Test: All filter restores full list
      cy.getByRole('button', 'All').click();
      cy.getByTestId('record-item-').should('have.length', 10);

      // Test: Active filter doesn't reset to All when drawer is closed and reopened
      cy.getByRole('button', 'Spells').click();
      cy.getByTestId('record-item-').should('have.length', 5);
      cy.getButton('Close').click();
      cy.getByTestId(`action-record-${actionRecordChar.id}`).click();
      cy.getByTestId('record-item-').should('have.length', 5);
      cy.getByRole('button', 'Spells').click();
      cy.getByTestId('record-item-').should('have.length', 10);

      // Test: Active filter with no matching records shows empty state
      cy.getByRole('button', 'Features').click();
      cy.getByTestId('record-item-')
        .filter(':contains("Signature Spell")')
        .getByTestId('record-delete')
        .click();
      cy.getByTestId(`action-record-drawer-${actionRecordChar.id}`).should(
        'contain.text',
        'Nothing to show yet'
      );
    });

    it('should filter by date range and restore all records on clear', () => {
      cy.visitAs(Cypress.testUser.uid, '/');
      cy.getByTestId(`character-card-${actionRecordChar.id}`).click();
      cy.getByTestId(`action-record-${actionRecordChar.id}`).click();
      cy.getByTestId('record-item-').should('have.length', 10);
      cy.getByTestId('date-filter-clear').should('not.exist');

      // Test: Date range filter
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
      cy.getByTestId('record-item-').should('have.length', 10);

      cy.get('#dateFilterFrom').parent().type(dayjs().format('DDMMYYYY'));
      cy.getByTestId('record-item-')
        .should('have.length', 9)
        .and('not.contain.text', 'Past Session Notes');
      cy.getByTestId('date-filter-clear').click();
      cy.getByTestId('record-item-').should('have.length', 10);
      cy.getByTestId(`action-record-drawer`).should('contain.text', '10 records');
    });

    it('should clear all records for a type and globally, with correct count messages', () => {
      cy.callFirestore(
        'update',
        `users/${Cypress.testUser.uid}/characters/${actionRecordChar.id}`,
        {
          resourceUsages: {
            'signature-spell': { type: 'feature', usage: 'long_rest', current: 1 },
            'infernal-legacy': { type: 'trait', usage: 'long_rest', current: 1 }
          }
        }
      );

      cy.visitAs(Cypress.testUser.uid, '/');
      cy.getByTestId(`character-card-${actionRecordChar.id}`).click();
      cy.getByTestId(`action-record-${actionRecordChar.id}`).click();
      cy.getByTestId('record-item-').should('have.length', 10);
      cy.getByTestId(`action-record-drawer`).should('contain.text', '10 records');

      // Test: Clear All (type-scoped)
      cy.getByRole('button', 'Custom').click();
      cy.getByTestId('record-item-').should('have.length', 2);
      cy.getByTestId(`action-record-drawer`).should('contain.text', '2 records');
      cy.getByTestId('clear-all-records').click();
      cy.getByTestId(`action-record-drawer`).should('contain.text', 'Nothing to show yet');
      cy.getByRole('button', 'All').click();
      cy.getByTestId('record-item-').should('have.length', 8);
      cy.getByTestId(`action-record-drawer`).should('contain.text', '8 records');

      // Test: Clear All invalidates cache once even when last deleted record has no sourceIndex
      cy.callFirestore(
        'set',
        `users/${Cypress.testUser.uid}/characters/${actionRecordChar.id}/actionRecords/old-custom`,
        {
          id: 'old-custom',
          type: 'custom',
          name: 'Old Custom',
          auto: false,
          createdAt: new Date('2019-01-01')
        }
      );
      cy.getButton('Close').click();
      cy.clickUntilStep('characteristics');
      cy.getByTestId('feature-name-signature-spell').getButton(/^USE/).and('contain.text', '1/2');

      cy.getByTestId('trait-name-infernal-legacy').getButton(/^USE/).and('contain.text', '1/1');

      cy.getByTestId(`action-record-${actionRecordChar.id}`).click();
      cy.getByTestId('record-item-').should('have.length', 9);
      cy.getByTestId('clear-all-records').click();

      cy.getByTestId(`action-record-drawer`).should('contain.text', 'Nothing to show yet');
      cy.getButton('Close').click();
      cy.getByTestId('feature-name-signature-spell').getButton(/^USE/).and('contain.text', '0/2');
      cy.getByTestId('trait-name-infernal-legacy').getButton(/^USE/).and('contain.text', '0/1');
    });

    it('should reset source and name fields when switching record type', () => {
      cy.visitAs(Cypress.testUser.uid, '/');
      cy.getByTestId(`character-card-${actionRecordChar.id}`).click();
      cy.getByTestId(`action-record-${actionRecordChar.id}`).click();

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
    });

    it('should persist all records across a page reload', () => {
      cy.visitAs(Cypress.testUser.uid, '/');
      cy.getByTestId(`character-card-${actionRecordChar.id}`).click();
      cy.getByTestId(`action-record-${actionRecordChar.id}`).click();
      cy.getByTestId('record-item-').should('have.length', 10);

      cy.reload();
      cy.getByTestId(`action-record-${actionRecordChar.id}`).click();
      cy.getByTestId('record-item-').should('have.length', 10);
    });
  });
});

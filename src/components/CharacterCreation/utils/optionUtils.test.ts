import { describe, expect, it } from 'vitest';
import type {
  AbilityBonusOption,
  ChoiceOption,
  CountedReferenceOption,
  DefaultRepresentation,
  IdealOption,
  MultipleOption,
  ReferenceOption,
  StringOption
} from '@representations/common.representation';
import {
  formatOption,
  getBundleItems,
  hasRequiredProficiencies,
  isCheckboxOption
} from './optionUtils';

describe('optionUtils', () => {
  describe('isCheckboxOption', () => {
    it('should return true for reference option', () => {
      const option: ReferenceOption = {
        option_type: 'reference',
        item: { index: 'longsword', name: 'Longsword' }
      };

      expect(isCheckboxOption(option)).toBe(true);
    });

    it('should return true for string option', () => {
      const option: StringOption = {
        option_type: 'string',
        string: 'Test String'
      };

      expect(isCheckboxOption(option)).toBe(true);
    });

    it('should return true for ideal option', () => {
      const option: IdealOption = {
        option_type: 'ideal',
        desc: 'Honor',
        alignments: [{ index: 'lawful-good', name: 'Lawful Good' }]
      };

      expect(isCheckboxOption(option)).toBe(true);
    });

    it('should return true for counted_reference option', () => {
      const option: CountedReferenceOption = {
        option_type: 'counted_reference',
        count: 20,
        of: { index: 'arrow', name: 'Arrow' }
      };

      expect(isCheckboxOption(option)).toBe(true);
    });

    it('should return true for ability_bonus option', () => {
      const option: AbilityBonusOption = {
        option_type: 'ability_bonus',
        ability_score: { index: 'str', name: 'STR' },
        bonus: 1
      };

      expect(isCheckboxOption(option)).toBe(true);
    });

    it('should return false for choice option', () => {
      const option: ChoiceOption = {
        option_type: 'choice',
        choice: {
          choose: 1,
          type: 'equipment',
          from: {
            option_set_type: 'options_array',
            options: []
          }
        }
      };

      expect(isCheckboxOption(option)).toBe(false);
    });

    it('should return false for multiple option', () => {
      const option: MultipleOption = {
        option_type: 'multiple',
        items: []
      };

      expect(isCheckboxOption(option)).toBe(false);
    });
  });

  describe('formatOption', () => {
    describe('reference option', () => {
      it('should format basic reference option', () => {
        const option: ReferenceOption = {
          option_type: 'reference',
          item: { index: 'longsword', name: 'Longsword' }
        };

        const result = formatOption(option);

        expect(result.item).toEqual({
          index: 'longsword',
          name: 'Longsword'
        });
        expect(result.label).toBe('Longsword');
        expect(result.prerequisites).toBe(true);
      });

      it('should format reference option with URL', () => {
        const option: ReferenceOption = {
          option_type: 'reference',
          item: {
            index: 'skill-athletics',
            name: 'Skill: Athletics'
          }
        };

        const result = formatOption(option);

        expect(result.item.index).toBe('skill-athletics');
        expect(result.item.name).toBe('Skill: Athletics');
      });
    });

    describe('string option', () => {
      it('should format string option', () => {
        const option: StringOption = {
          option_type: 'string',
          string: 'Custom Skill'
        };

        const result = formatOption(option, 'proficiencies', 0);

        expect(result.item).toEqual({
          index: 'Custom Skill-proficiencies',
          name: 'Custom Skill'
        });
        expect(result.label).toBe('Custom Skill');
      });

      it('should use type and index when string is present', () => {
        const option: StringOption = {
          option_type: 'string',
          string: 'Test'
        };

        const result = formatOption(option, 'equipment', 5);

        expect(result.item.index).toBe('Test-equipment');
      });
    });

    describe('ideal option', () => {
      it('should format ideal option with alignments', () => {
        const option: IdealOption = {
          option_type: 'ideal',
          desc: 'Honor. I strive to uphold the highest ideals of my order.',
          alignments: [
            { index: 'lawful', name: 'Lawful' },
            { index: 'good', name: 'Good' }
          ]
        };

        const result = formatOption(option, 'ideals', 0);

        expect(result.item.name).toBe('Honor. I strive to uphold the highest ideals of my order.');
        expect(result.labelData).toEqual({
          alignments: 'Lawful / Good',
          desc: 'Honor. I strive to uphold the highest ideals of my order.'
        });
      });

      it('should handle ideal without alignments', () => {
        const option = {
          option_type: 'ideal',
          desc: 'Freedom.'
        };

        const result = formatOption(option as any, 'ideals', 0);
        expect(result.labelData).toBeUndefined();
      });
    });

    describe('counted_reference option', () => {
      it('should format counted reference with count', () => {
        const option: CountedReferenceOption = {
          option_type: 'counted_reference',
          count: 20,
          of: { index: 'arrow', name: 'Arrow' }
        };

        const result = formatOption(option);

        expect(result.item).toEqual({
          index: 'arrow',
          name: 'Arrow',
          count: 20
        });
        expect(result.label).toBe('20 Arrow');
      });

      it('should handle count of 1', () => {
        const option: CountedReferenceOption = {
          option_type: 'counted_reference',
          count: 1,
          of: { index: 'shield', name: 'Shield' }
        };

        const result = formatOption(option);

        expect(result.item.count).toBe(1);
        expect(result.label).toBe('1 Shield');
      });

      it('should handle large counts', () => {
        const option: CountedReferenceOption = {
          option_type: 'counted_reference',
          count: 100,
          of: { index: 'gold-piece', name: 'Gold Piece' }
        };

        const result = formatOption(option);

        expect(result.item.count).toBe(100);
        expect(result.label).toBe('100 Gold Piece');
      });
    });

    describe('ability_bonus option', () => {
      it('should format ability bonus option', () => {
        const option: AbilityBonusOption = {
          option_type: 'ability_bonus',
          ability_score: { index: 'str', name: 'STR' },
          bonus: 1
        };

        const result = formatOption(option);

        expect(result.item).toEqual({
          index: 'str',
          name: 'STR'
        });
        expect(result.label).toBe('STR');
      });

      it('should format ability bonus with different scores', () => {
        const option: AbilityBonusOption = {
          option_type: 'ability_bonus',
          ability_score: { index: 'int', name: 'INT' },
          bonus: 2
        };

        const result = formatOption(option);

        expect(result.item.index).toBe('int');
        expect(result.label).toBe('INT');
      });
    });

    describe('prerequisites', () => {
      it('should return true when no prerequisites', () => {
        const option: ReferenceOption = {
          option_type: 'reference',
          item: { index: 'longsword', name: 'Longsword' }
        };

        const result = formatOption(option);

        expect(result.prerequisites).toBe(true);
      });

      it('should handle prerequisites with proficiency', () => {
        const option: CountedReferenceOption = {
          option_type: 'counted_reference',
          count: 1,
          of: { index: 'martial-weapon', name: 'Martial Weapon' },
          prerequisites: [
            {
              type: 'proficiency',
              proficiency: { index: 'martial-weapons', name: 'Martial Weapons' }
            }
          ]
        };

        const result = formatOption(option);

        // Note: current implementation always returns true for prerequisites
        expect(result.prerequisites).toBe(true);
      });
    });

    describe('fallback values', () => {
      it('should use type and index as fallback for index', () => {
        const option: StringOption = {
          option_type: 'string',
          string: ''
        };

        const result = formatOption(option, 'test-type', 42);

        expect(result.item.index).toBe('test-type-42');
        expect(result.item.name).toBe('test-type-42');
      });

      it('should handle missing optional fields', () => {
        const option: ReferenceOption = {
          option_type: 'reference',
          item: { index: 'test', name: 'Test' }
        };

        const result = formatOption(option);

        expect(result.item.count).toBeUndefined();
        expect(result.labelData).toBeUndefined();
      });
    });
  });

  describe('hasRequiredProficiencies', () => {
    const proficiencies: DefaultRepresentation[] = [
      { index: 'martial-weapons', name: 'Martial Weapons' },
      { index: 'heavy-armor', name: 'Heavy Armor' }
    ];

    it('should return true when no prerequisites', () => {
      const option: ReferenceOption = {
        option_type: 'reference',
        item: { index: 'longsword', name: 'Longsword' }
      };

      expect(hasRequiredProficiencies(option, proficiencies)).toBe(true);
    });

    it('should return true when required proficiency is present', () => {
      const option: CountedReferenceOption = {
        option_type: 'counted_reference',
        count: 1,
        of: { index: 'greatsword', name: 'Greatsword' },
        prerequisites: [
          {
            type: 'proficiency',
            proficiency: { index: 'martial-weapons', name: 'Martial Weapons' }
          }
        ]
      };

      expect(hasRequiredProficiencies(option, proficiencies)).toBe(true);
    });

    it('should return false when required proficiency is missing', () => {
      const option: CountedReferenceOption = {
        option_type: 'counted_reference',
        count: 1,
        of: { index: 'hand-crossbow', name: 'Hand Crossbow' },
        prerequisites: [
          { type: 'proficiency', proficiency: { index: 'exotic-weapons', name: 'Exotic Weapons' } }
        ]
      };

      expect(hasRequiredProficiencies(option, proficiencies)).toBe(false);
    });

    it('should return true when all required proficiencies are present', () => {
      const option: CountedReferenceOption = {
        option_type: 'counted_reference',
        count: 1,
        of: { index: 'platemail', name: 'Platemail' },
        prerequisites: [
          { type: 'proficiency', proficiency: { index: 'heavy-armor', name: 'Heavy Armor' } },
          {
            type: 'proficiency',
            proficiency: { index: 'martial-weapons', name: 'Martial Weapons' }
          }
        ]
      };

      expect(hasRequiredProficiencies(option, proficiencies)).toBe(true);
    });

    it('should return false when any required proficiency is missing', () => {
      const option: CountedReferenceOption = {
        option_type: 'counted_reference',
        count: 1,
        of: { index: 'special-item', name: 'Special Item' },
        prerequisites: [
          { type: 'proficiency', proficiency: { index: 'heavy-armor', name: 'Heavy Armor' } },
          { type: 'proficiency', proficiency: { index: 'arcane-focus', name: 'Arcane Focus' } }
        ]
      };

      expect(hasRequiredProficiencies(option, proficiencies)).toBe(false);
    });

    it('should handle empty proficiencies array', () => {
      const option: CountedReferenceOption = {
        option_type: 'counted_reference',
        count: 1,
        of: { index: 'longsword', name: 'Longsword' },
        prerequisites: [
          {
            type: 'proficiency',
            proficiency: { index: 'martial-weapons', name: 'Martial Weapons' }
          }
        ]
      };

      expect(hasRequiredProficiencies(option, [])).toBe(false);
    });

    it('should return true for prerequisite without proficiency', () => {
      const option: ReferenceOption = {
        option_type: 'reference',
        item: { index: 'test', name: 'Test' },
        prerequisites: [
          {
            type: 'proficiency'
            // No proficiency field
          }
        ] as unknown as ReferenceOption['prerequisites']
      };

      expect(hasRequiredProficiencies(option, proficiencies)).toBe(true);
    });
  });

  describe('getBundleItems', () => {
    it('should combine item with bundle siblings and remove duplicates', () => {
      const itemToSelect: DefaultRepresentation & { count?: number } = {
        index: 'battleaxe',
        name: 'Battleaxe',
        count: 1
      };

      const bundleSiblings: (DefaultRepresentation & { count?: number })[] = [
        { index: 'battleaxe', name: 'Battleaxe', count: 1 },
        { index: 'shield', name: 'Shield', count: 1 }
      ];

      const result = getBundleItems(itemToSelect, bundleSiblings);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ index: 'battleaxe', name: 'Battleaxe', count: 1 });
      expect(result[1]).toEqual({ index: 'shield', name: 'Shield', count: 1 });
    });

    it('should handle item not in bundle siblings', () => {
      const itemToSelect: DefaultRepresentation & { count?: number } = {
        index: 'whip',
        name: 'Whip',
        count: 1
      };

      const bundleSiblings: (DefaultRepresentation & { count?: number })[] = [
        { index: 'shield', name: 'Shield', count: 1 }
      ];

      const result = getBundleItems(itemToSelect, bundleSiblings);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ index: 'whip', name: 'Whip', count: 1 });
      expect(result[1]).toEqual({ index: 'shield', name: 'Shield', count: 1 });
    });

    it('should handle empty bundle siblings', () => {
      const itemToSelect: DefaultRepresentation = {
        index: 'longsword',
        name: 'Longsword'
      };

      const result = getBundleItems(itemToSelect, []);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ index: 'longsword', name: 'Longsword' });
    });

    it('should handle multiple siblings', () => {
      const itemToSelect: DefaultRepresentation & { count?: number } = {
        index: 'crossbow-light',
        name: 'Crossbow, light',
        count: 1
      };

      const bundleSiblings: (DefaultRepresentation & { count?: number })[] = [
        { index: 'crossbow-light', name: 'Crossbow, light', count: 1 },
        { index: 'crossbow-bolt', name: 'Crossbow bolt', count: 20 },
        { index: 'case', name: 'Crossbow bolt case', count: 1 }
      ];

      const result = getBundleItems(itemToSelect, bundleSiblings) as (DefaultRepresentation & {
        count?: number;
      })[];

      expect(result).toHaveLength(3);
      expect(result[0].index).toBe('crossbow-light');
      expect(result[1].index).toBe('crossbow-bolt');
      expect(result[2].index).toBe('case');
    });

    it('should handle ability score bonus item', () => {
      const itemToSelect: AbilityBonusOption = {
        option_type: 'ability_bonus',
        ability_score: { index: 'str', name: 'STR' },
        bonus: 1
      };

      const bundleSiblings: DefaultRepresentation[] = [
        { index: 'str', name: 'STR' },
        { index: 'con', name: 'CON' }
      ];

      const result = getBundleItems(itemToSelect, bundleSiblings);

      // Should filter out the ability score with matching index
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(itemToSelect);
      expect(result[1]).toEqual({ index: 'con', name: 'CON' });
    });

    it('should preserve counts when filtering', () => {
      const itemToSelect: DefaultRepresentation & { count?: number } = {
        index: 'arrow',
        name: 'Arrow',
        count: 20
      };

      const bundleSiblings: (DefaultRepresentation & { count?: number })[] = [
        { index: 'arrow', name: 'Arrow', count: 20 },
        { index: 'longbow', name: 'Longbow', count: 1 }
      ];

      const result = getBundleItems(itemToSelect, bundleSiblings);

      expect(result).toHaveLength(2);
      expect(result[0].count).toBe(20);
      expect(result[1].count).toBe(1);
    });

    it('should handle items without count', () => {
      const itemToSelect: DefaultRepresentation = {
        index: 'longsword',
        name: 'Longsword'
      };

      const bundleSiblings: DefaultRepresentation[] = [
        { index: 'longsword', name: 'Longsword' },
        { index: 'shield', name: 'Shield' }
      ];

      const result = getBundleItems(itemToSelect, bundleSiblings);

      expect(result).toHaveLength(2);
      expect(result[0].count).toBeUndefined();
      expect(result[1].count).toBeUndefined();
    });

    it('should only filter exact index matches', () => {
      const itemToSelect: DefaultRepresentation & { count?: number } = {
        index: 'shield',
        name: 'Shield',
        count: 1
      };

      const bundleSiblings: (DefaultRepresentation & { count?: number })[] = [
        { index: 'shield', name: 'Shield', count: 1 },
        { index: 'shield-wooden', name: 'Wooden Shield', count: 1 },
        { index: 'battleaxe', name: 'Battleaxe', count: 1 }
      ];

      const result = getBundleItems(itemToSelect, bundleSiblings) as (DefaultRepresentation & {
        count?: number;
      })[];

      // Should remove only exact match 'shield', keep 'shield-wooden'
      expect(result).toHaveLength(3);
      expect(result.find((i) => i.index === 'shield-wooden')).toBeDefined();
      expect(result.filter((i) => i.index === 'shield')).toHaveLength(1);
    });
  });

  describe('Integration Tests', () => {
    it('should format and check proficiencies for martial weapon', () => {
      const option: CountedReferenceOption = {
        option_type: 'counted_reference',
        count: 1,
        of: { index: 'longsword', name: 'Longsword' },
        prerequisites: [
          {
            type: 'proficiency',
            proficiency: { index: 'martial-weapons', name: 'Martial Weapons' }
          }
        ]
      };

      const proficiencies: DefaultRepresentation[] = [
        { index: 'martial-weapons', name: 'Martial Weapons' }
      ];

      expect(isCheckboxOption(option)).toBe(true);

      const formatted = formatOption(option);
      expect(formatted.item.index).toBe('longsword');

      expect(hasRequiredProficiencies(option, proficiencies)).toBe(true);
    });

    it('should handle complete bundle workflow', () => {
      // Step 1: Check if options are checkbox options
      const crossbowOption: CountedReferenceOption = {
        option_type: 'counted_reference',
        count: 1,
        of: { index: 'crossbow-light', name: 'Crossbow, light' }
      };
      const boltOption: CountedReferenceOption = {
        option_type: 'counted_reference',
        count: 20,
        of: { index: 'crossbow-bolt', name: 'Crossbow bolt' }
      };

      expect(isCheckboxOption(crossbowOption)).toBe(true);
      expect(isCheckboxOption(boltOption)).toBe(true);

      // Step 2: Format both options
      const formattedCrossbow = formatOption(crossbowOption);
      const formattedBolts = formatOption(boltOption);

      expect(formattedCrossbow.item.count).toBe(1);
      expect(formattedBolts.item.count).toBe(20);

      // Step 3: Create bundle
      const bundleSiblings = [formattedCrossbow.item, formattedBolts.item];

      // Step 4: User selects crossbow - get all bundle items
      const selectedItems = getBundleItems(
        formattedCrossbow.item,
        bundleSiblings
      ) as (DefaultRepresentation & {
        count?: number;
      })[];

      expect(selectedItems).toHaveLength(2);
      expect(selectedItems[0].index).toBe('crossbow-light');
      expect(selectedItems[1].index).toBe('crossbow-bolt');
    });
  });
});

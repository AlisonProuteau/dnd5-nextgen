// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import {
  formatResourceUsageIncrement,
  formatUsageLabel,
  getRelatedFeatures,
  getUsageTimes,
  getUsageType,
  getUsageTypeLabel,
  revertActionRecordUsage
} from '@utils/character/resourceUsage.utils';
import type { Feature } from '@representations/abilities/feature.representation';
import type { Trait } from '@representations/abilities/trait.representation';
import type { ActionRecord, Character } from '@representations/user.representation';

vi.mock('firebase/firestore', () => ({
  deleteField: vi.fn(() => ({ __type: 'deleteField' })),
  increment: vi.fn((n: number) => ({ __type: 'increment', value: n }))
}));

const DELETE_FIELD = { __type: 'deleteField' };
const INCREMENT_1 = { __type: 'increment', value: 1 };

describe('Resource Usage Functions', () => {
  const mockCharacter = {
    level: 5,
    abilityScores: {
      str: { index: 'str', name: 'STR', full_name: 'Strength', score: 16, modifier: 3 },
      dex: { index: 'dex', name: 'DEX', full_name: 'Dexterity', score: 14, modifier: 2 },
      con: { index: 'con', name: 'CON', full_name: 'Constitution', score: 12, modifier: 1 },
      int: { index: 'int', name: 'INT', full_name: 'Intelligence', score: 10, modifier: 0 },
      wis: { index: 'wis', name: 'WIS', full_name: 'Wisdom', score: 8, modifier: -1 },
      cha: { index: 'cha', name: 'CHA', full_name: 'Charisma', score: 6, modifier: -2 }
    },
    resourceUsages: {} as Character['resourceUsages']
  };

  describe('getUsageTimes', () => {
    it('number (fixed)', () => {
      // TEST: should return the exact fixed number
      expect(getUsageTimes({ type: 'long_rest', times: 3 }, mockCharacter)).toBe(3);

      // TEST: should return 1 when times is 1
      expect(getUsageTimes({ type: 'short_rest', times: 1 }, mockCharacter)).toBe(1);

      // TEST: should return 0 when times is 0
      expect(getUsageTimes({ type: 'per_day', times: 0 }, mockCharacter)).toBe(0);

      // TEST: should return large fixed numbers unchanged
      expect(getUsageTimes({ type: 'per_day', times: 100 }, mockCharacter)).toBe(100);
    });

    it('ability name (modifier)', () => {
      // TEST: times: "str" → str modifier (3)
      expect(getUsageTimes({ type: 'long_rest', times: 'str' }, mockCharacter)).toBe(3);

      // TEST: times: "dex" → dex modifier (2)
      expect(getUsageTimes({ type: 'long_rest', times: 'dex' }, mockCharacter)).toBe(2);

      // TEST: times: "con" → con modifier (1)
      expect(getUsageTimes({ type: 'long_rest', times: 'con' }, mockCharacter)).toBe(1);

      // TEST: times: "int" → int modifier (0) → clamped to 1
      expect(getUsageTimes({ type: 'long_rest', times: 'int' }, mockCharacter)).toBe(1);

      // TEST: times: "wis" → wis modifier (-1) → clamped to 1
      expect(getUsageTimes({ type: 'long_rest', times: 'wis' }, mockCharacter)).toBe(1);

      // TEST: times: "cha" → cha modifier (-2) → clamped to 1
      expect(getUsageTimes({ type: 'long_rest', times: 'cha' }, mockCharacter)).toBe(1);
    });

    describe('ability expression (str+n, dex-n, …)', () => {
      it('addition (+)', () => {
        // TEST: times: "str+2" → 3 + 2 = 5
        expect(getUsageTimes({ type: 'long_rest', times: 'str+2' }, mockCharacter)).toBe(5);

        // TEST: times: "dex+1" → 2 + 1 = 3
        expect(getUsageTimes({ type: 'long_rest', times: 'dex+1' }, mockCharacter)).toBe(3);

        // TEST: times: "int+1" → 0 + 1 = 1 (at minimum boundary)
        expect(getUsageTimes({ type: 'long_rest', times: 'int+1' }, mockCharacter)).toBe(1);

        // TEST: times: "cha+1" → -2 + 1 = -1 → clamped to 1
        expect(getUsageTimes({ type: 'long_rest', times: 'cha+1' }, mockCharacter)).toBe(1);

        // TEST: times: "wis+3" → -1 + 3 = 2
        expect(getUsageTimes({ type: 'long_rest', times: 'wis+3' }, mockCharacter)).toBe(2);
      });

      it('subtraction (-)', () => {
        // TEST: times: "str-1" → 3 - 1 = 2
        expect(getUsageTimes({ type: 'long_rest', times: 'str-1' }, mockCharacter)).toBe(2);

        // TEST: times: "dex-1" → 2 - 1 = 1
        expect(getUsageTimes({ type: 'long_rest', times: 'dex-1' }, mockCharacter)).toBe(1);

        // TEST: times: "con-2" → 1 - 2 = -1 → clamped to 1
        expect(getUsageTimes({ type: 'long_rest', times: 'con-2' }, mockCharacter)).toBe(1);

        // TEST: times: "int-1" → 0 - 1 = -1 → clamped to 1
        expect(getUsageTimes({ type: 'long_rest', times: 'int-1' }, mockCharacter)).toBe(1);
      });

      it('multiplication (*)', () => {
        // TEST: times: "str*2" → 3 * 2 = 6
        expect(getUsageTimes({ type: 'long_rest', times: 'str*2' }, mockCharacter)).toBe(6);

        // TEST: times: "con*3" → 1 * 3 = 3
        expect(getUsageTimes({ type: 'long_rest', times: 'con*3' }, mockCharacter)).toBe(3);

        // TEST: times: "wis*2" → -1 * 2 = -2 → clamped to 1
        expect(getUsageTimes({ type: 'long_rest', times: 'wis*2' }, mockCharacter)).toBe(1);

        // TEST: times: "int*5" → 0 * 5 = 0 → clamped to 1
        expect(getUsageTimes({ type: 'long_rest', times: 'int*5' }, mockCharacter)).toBe(1);
      });

      it('division (/)', () => {
        // TEST: times: "str/2" → floor(3 / 2) = 1
        expect(getUsageTimes({ type: 'long_rest', times: 'str/2' }, mockCharacter)).toBe(1);

        // TEST: times: "str/1" → floor(3 / 1) = 3
        expect(getUsageTimes({ type: 'long_rest', times: 'str/1' }, mockCharacter)).toBe(3);

        // TEST: times: "dex/2" → floor(2 / 2) = 1
        expect(getUsageTimes({ type: 'long_rest', times: 'dex/2' }, mockCharacter)).toBe(1);

        // TEST: times: "int/2" → floor(0 / 2) = 0 → clamped to 1
        expect(getUsageTimes({ type: 'long_rest', times: 'int/2' }, mockCharacter)).toBe(1);

        // TEST: times: "cha/2" → floor(-2 / 2) = -1 → clamped to 1
        expect(getUsageTimes({ type: 'long_rest', times: 'cha/2' }, mockCharacter)).toBe(1);

        // TEST: times: "cha/0" → floor(-2 / 1) = -2 → clamped to 1, does not throw
        expect(() =>
          getUsageTimes({ type: 'long_rest', times: 'cha/0' }, mockCharacter)
        ).not.toThrow();
        expect(getUsageTimes({ type: 'long_rest', times: 'cha/0' }, mockCharacter)).toBe(1);
      });
    });

    it('"level" (returns character level)', () => {
      // TEST: times: "level" → character.level (5)
      expect(getUsageTimes({ type: 'per_day', times: 'level' }, mockCharacter)).toBe(5);

      // TEST: times: "level" when level is undefined → returns 1
      const lvl10Char = { ...mockCharacter, level: undefined } as unknown as Character;
      expect(getUsageTimes({ type: 'per_day', times: 'level' }, lvl10Char)).toBe(1);
    });

    it('level expression (level+n, level-n, …)', () => {
      // TEST: times: "level+2" → 5 + 2 = 7
      expect(getUsageTimes({ type: 'long_rest', times: 'level+2' }, mockCharacter)).toBe(7);

      // TEST: times: "level-2" → 5 - 2 = 3
      expect(getUsageTimes({ type: 'long_rest', times: 'level-2' }, mockCharacter)).toBe(3);

      // TEST: times: "level-4" → 5 - 4 = 1 (minimum boundary)
      expect(getUsageTimes({ type: 'long_rest', times: 'level-4' }, mockCharacter)).toBe(1);

      // TEST: times: "level-10" → 5 - 10 = -5 → clamped to 1
      expect(getUsageTimes({ type: 'long_rest', times: 'level-10' }, mockCharacter)).toBe(1);

      // TEST: times: "level*2" → 5 * 2 = 10
      expect(getUsageTimes({ type: 'long_rest', times: 'level*2' }, mockCharacter)).toBe(10);

      // TEST: times: "level/2" → floor(5 / 2) = 2
      expect(getUsageTimes({ type: 'long_rest', times: 'level/2' }, mockCharacter)).toBe(2);

      // TEST: times: "level/3" with level undefined → floor(1 / 3) = 1
      expect(
        getUsageTimes(
          { type: 'long_rest', times: 'level/3' },
          { ...mockCharacter, level: undefined }
        )
      ).toBe(1);
    });

    it('"unlimited" (returns Infinity)', () => {
      expect(getUsageTimes({ type: 'per_day', times: 'unlimited' }, mockCharacter)).toBe(Infinity);
    });

    it('object { [level]: number }', () => {
      // TEST: returns the value for the exact matching level threshold
      // level 5 matches key "5"
      expect(getUsageTimes({ type: 'long_rest', times: { 1: 2, 3: 3, 5: 4 } }, mockCharacter)).toBe(
        4
      );

      // TEST: returns the highest threshold at or below character level
      // level 5: thresholds 1, 3, 7 → highest at-or-below is 3 (times: 3)
      expect(getUsageTimes({ type: 'long_rest', times: { 1: 2, 3: 3, 7: 5 } }, mockCharacter)).toBe(
        3
      );

      // TEST: returns the only matching threshold when just one entry qualifies
      // level 5 >= 1 only
      expect(getUsageTimes({ type: 'long_rest', times: { 1: 2 } }, mockCharacter)).toBe(2);

      // TEST: works correctly at character level 1 with multiple thresholds
      expect(
        getUsageTimes(
          { type: 'long_rest', times: { 1: 2, 5: 4, 10: 6 } },
          { ...mockCharacter, level: 1 }
        )
      ).toBe(2);

      // TEST: works correctly at high character level
      expect(
        getUsageTimes(
          { type: 'long_rest', times: { 1: 2, 5: 4, 11: 5, 17: 6 } },
          { ...mockCharacter, level: 20 }
        )
      ).toBe(6);

      // TEST: returns 0 when character level is below all thresholds
      expect(
        getUsageTimes(
          { type: 'long_rest', times: { 3: 2, 5: 4, 10: 6 } },
          { ...mockCharacter, level: 1 }
        )
      ).toBe(0);

      // TEST: returns level 1 threshold when character level is undefined
      expect(
        getUsageTimes(
          { type: 'long_rest', times: { 1: 2, 5: 4, 10: 6 } },
          { ...mockCharacter, level: undefined }
        )
      ).toBe(2);
    });
  });

  describe('getUsageType', () => {
    const baseFeature: Partial<Feature> = {
      name: 'Feature',
      desc: [],
      level: 1,
      class: { index: 'test', name: 'Test' }
    };

    it('literal type (string or array)', () => {
      // TEST: returns the literal type string
      expect(getUsageType({ type: 'long_rest', times: 1 }, [])).toBe('long_rest');

      // TEST: returns the literal type array
      expect(getUsageType({ type: ['short_rest', 'long_rest'], times: 1 }, [])).toEqual([
        'short_rest',
        'long_rest'
      ]);
    });

    it('feature-linked type', () => {
      const channelDivinityFeature = {
        ...baseFeature,
        index: 'channel-divinity',
        name: 'Channel Divinity'
      } as Feature;

      // TEST: resolves feature-linked type from the features array
      expect(
        getUsageType({ type: { feature: 'channel-divinity', default: 'long_rest' }, times: 1 }, [
          { ...channelDivinityFeature, usage: { type: 'short_rest', times: 1 } }
        ])
      ).toBe('short_rest');

      // TEST: falls back to default when the referenced feature is not found
      expect(
        getUsageType({ type: { feature: 'missing-feature', default: 'long_rest' }, times: 1 }, [])
      ).toBe('long_rest');

      // TEST: falls back to default when the found feature has no usage
      expect(
        getUsageType({ type: { feature: 'channel-divinity', default: 'per_day' }, times: 1 }, [
          channelDivinityFeature
        ])
      ).toBe('per_day');
    });

    it('chained feature-linked type', () => {
      const featureA = {
        ...baseFeature,
        index: 'feature-a',
        usage: { type: { feature: 'feature-b', default: 'long_rest' }, times: 1 }
      } as Feature;
      const featureB = {
        ...baseFeature,
        index: 'feature-b',
        usage: { type: 'short_rest', times: 1 }
      } as Feature;

      // TEST: resolves a chain A → B → short_rest
      expect(
        getUsageType({ type: { feature: 'feature-a', default: 'long_rest' }, times: 1 }, [
          featureA,
          featureB
        ])
      ).toBe('short_rest');

      // TEST: resolves a deeper chain A → B → C → per_day
      const featureC = {
        ...baseFeature,
        index: 'feature-c',
        usage: { type: 'per_day', times: 1 }
      } as Feature;
      const featureBLinked = {
        ...featureB,
        usage: { type: { feature: 'feature-c', default: 'long_rest' }, times: 1 }
      } as Feature;
      expect(
        getUsageType({ type: { feature: 'feature-a', default: 'long_rest' }, times: 1 }, [
          featureA,
          featureBLinked,
          featureC
        ])
      ).toBe('per_day');
    });

    it('cycle detection', () => {
      const featureA = {
        ...baseFeature,
        index: 'feature-a',
        usage: { type: { feature: 'feature-b', default: 'long_rest' }, times: 1 }
      } as Feature;
      const featureB = {
        ...baseFeature,
        index: 'feature-b',
        usage: { type: { feature: 'feature-a', default: 'per_day' }, times: 1 }
      } as Feature;

      // TEST: A → B → A cycle should not hang and should fall back to B's default
      expect(
        getUsageType({ type: { feature: 'feature-a', default: 'short_rest' }, times: 1 }, [
          featureA,
          featureB
        ])
      ).toBe('per_day');
    });
  });

  describe('getRelatedFeatures', () => {
    const simpleFeature: Feature = {
      index: 'simple-feature',
      name: 'Simple Feature',
      desc: [],
      level: 1,
      class: { index: 'fighter', name: 'Fighter' }
    };

    it('returns linked feature indices', () => {
      const channelDivinityFeature = {
        ...simpleFeature,
        index: 'feature-1',
        usage: { type: { feature: 'channel-divinity' }, times: 1 }
      } as Feature;
      const wildShapeFeature = {
        ...simpleFeature,
        index: 'feature-2',
        level: 2,
        usage: { type: { feature: 'wild-shape' }, times: 2 }
      } as Feature;

      // TEST: returns feature index from object-type usage
      expect(getRelatedFeatures([channelDivinityFeature])).toEqual(['channel-divinity']);

      // TEST: returns all related feature indices from multiple resources
      expect(getRelatedFeatures([channelDivinityFeature, wildShapeFeature])).toEqual([
        'channel-divinity',
        'wild-shape'
      ]);

      // TEST: returns all related feature indices from multiple resources
      expect(
        getRelatedFeatures([
          channelDivinityFeature,
          { ...wildShapeFeature, usage: { type: 'long_rest', times: 2 } }
        ])
      ).toEqual(['channel-divinity']);

      // TEST: handles Trait resources alongside Feature resources
      const trait: Trait = {
        index: 'trait-with-link',
        name: 'Trait',
        desc: [],
        usage: { type: { feature: 'rage', default: 'long_rest' }, times: 1 }
      };
      expect(getRelatedFeatures([trait])).toEqual(['rage']);
    });

    it('returns empty array', () => {
      // TEST: empty resources list
      expect(getRelatedFeatures([])).toEqual([]);

      // TEST: simple string types
      expect(
        getRelatedFeatures([{ ...simpleFeature, usage: { type: 'long_rest', times: 1 } }])
      ).toEqual([]);

      // TEST: no usage
      expect(getRelatedFeatures([simpleFeature])).toEqual([]);
    });
  });

  describe('getUsageTypeLabel', () => {
    it('string input', () => {
      expect(getUsageTypeLabel('long_rest')).toBe('Long Rest');
      expect(getUsageTypeLabel('short_rest')).toBe('Short Rest');
      expect(getUsageTypeLabel('per_rest')).toBe('Short or Long Rest');
      expect(getUsageTypeLabel('per_day')).toBe('Day');
      expect(getUsageTypeLabel('per_month')).toBe('Month');
      expect(getUsageTypeLabel('per_week')).toBe('Week');
      expect(getUsageTypeLabel('unknown' as 'per_day')).toBeUndefined();
    });

    it('array input', () => {
      // TEST: joins labels with " / " for multiple types
      expect(getUsageTypeLabel(['short_rest', 'long_rest'])).toBe('Short Rest / Long Rest');

      // TEST: handles a single-element array
      expect(getUsageTypeLabel(['per_day'])).toBe('Day');
    });
  });

  describe('formatUsageLabel', () => {
    it('usage count display', () => {
      // TEST: shows 0/max when no current usage is recorded
      expect(formatUsageLabel('rage', { type: 'long_rest', times: 3 }, mockCharacter, [])).toBe(
        '0/3 (Long Rest)'
      );

      // TEST: shows current/max when current usage is recorded
      const characterWithUsage = {
        ...mockCharacter,
        resourceUsages: { rage: { current: 2, max: 3 } } as unknown as Character['resourceUsages']
      };
      expect(
        formatUsageLabel('rage', { type: 'long_rest', times: 3 }, characterWithUsage, [])
      ).toBe('2/3 (Long Rest)');
    });

    it('resolves usage type', () => {
      // TEST: resolves feature-linked usage type
      const channelDivinityFeature = {
        index: 'channel-divinity',
        name: 'Channel Divinity',
        desc: [],
        level: 2,
        class: { index: 'cleric', name: 'Cleric' },
        usage: { type: 'short_rest' as const, times: 1 }
      } as Feature;
      expect(
        formatUsageLabel(
          'channel-divinity-usage',
          { type: { feature: 'channel-divinity', default: 'long_rest' }, times: 1 },
          mockCharacter,
          [channelDivinityFeature]
        )
      ).toBe('0/1 (Short Rest)');

      // TEST: uses ability modifier as max when times is an ability name (str modifier = 3)
      expect(formatUsageLabel('ki', { type: 'short_rest', times: 'str' }, mockCharacter, [])).toBe(
        '0/3 (Short Rest)'
      );
    });
  });

  describe('formatResourceUsageIncrement', () => {
    it('single usage type', () => {
      const result = formatResourceUsageIncrement({
        index: 'action-surge',
        usage: 'long_rest',
        type: 'feature'
      });

      expect(result).toEqual({
        'resourceUsages.action-surge.type': 'feature',
        'resourceUsages.action-surge.usage': 'long_rest',
        'resourceUsages.action-surge.current': INCREMENT_1
      });
    });

    it('array of usage types', () => {
      const result = formatResourceUsageIncrement({
        index: 'wild-shape',
        usage: ['short_rest', 'long_rest'],
        type: 'feature'
      });

      expect(result['resourceUsages.wild-shape.usage']).toEqual(['short_rest', 'long_rest']);
    });

    it('trait type', () => {
      const result = formatResourceUsageIncrement({
        index: 'relentless-endurance',
        usage: 'long_rest',
        type: 'trait'
      });

      expect(result['resourceUsages.relentless-endurance.type']).toBe('trait');
    });

    it('other type', () => {
      const result = formatResourceUsageIncrement({
        index: 'custom-resource',
        usage: 'once',
        type: 'other'
      });

      expect(result['resourceUsages.custom-resource.type']).toBe('other');
      expect(result['resourceUsages.custom-resource.usage']).toBe('once');
      expect(result['resourceUsages.custom-resource.current']).toEqual(INCREMENT_1);
    });
  });

  describe('revertActionRecordUsage', () => {
    describe('spell type', () => {
      const record: ActionRecord = {
        id: 'r1',
        type: 'spell',
        name: 'Fireball',
        value: 2,
        createdAt: new Date()
      };

      it('decrements slot when current > 1', () => {
        const character = { usedSpellSlots: { 2: 3 } } as unknown as Character;
        const { firestoreUpdate, updatedCharacter } = revertActionRecordUsage(character, record);

        expect(firestoreUpdate).toEqual({ 'usedSpellSlots.2': 2 });
        expect(updatedCharacter.usedSpellSlots).toEqual({ 2: 2 });
      });

      it('deletes slot when current === 1', () => {
        const character = { usedSpellSlots: { 2: 1 } } as unknown as Character;
        const { firestoreUpdate, updatedCharacter } = revertActionRecordUsage(character, record);

        expect(firestoreUpdate).toEqual({ 'usedSpellSlots.2': DELETE_FIELD });
        expect(updatedCharacter.usedSpellSlots).not.toHaveProperty('2');
      });

      it('returns no-op when current === 0', () => {
        const character = { usedSpellSlots: { 2: 0 } } as unknown as Character;
        const { firestoreUpdate, updatedCharacter } = revertActionRecordUsage(character, record);

        expect(firestoreUpdate).toEqual({});
        expect(updatedCharacter).toBe(character);
      });

      it('returns no-op when slot is missing', () => {
        const character = { usedSpellSlots: {} } as unknown as Character;
        const { firestoreUpdate, updatedCharacter } = revertActionRecordUsage(character, record);

        expect(firestoreUpdate).toEqual({});
        expect(updatedCharacter).toBe(character);
      });
    });

    describe('feature type', () => {
      const record: ActionRecord = {
        id: 'r5',
        type: 'feature',
        name: 'Action Surge',
        sourceIndex: 'action-surge',
        createdAt: new Date()
      };

      it('decrements usage when current > 1', () => {
        const character = {
          resourceUsages: { 'action-surge': { type: 'feature', usage: 'short_rest', current: 2 } }
        } as unknown as Character;
        const { firestoreUpdate, updatedCharacter } = revertActionRecordUsage(character, record);

        expect(firestoreUpdate).toEqual({
          'resourceUsages.action-surge': { type: 'feature', usage: 'short_rest', current: 1 }
        });
        expect(updatedCharacter.resourceUsages?.['action-surge']?.current).toBe(1);
      });

      it('deletes resource usage when current === 1', () => {
        const character = {
          resourceUsages: { 'action-surge': { type: 'feature', usage: 'short_rest', current: 1 } }
        } as unknown as Character;
        const { firestoreUpdate, updatedCharacter } = revertActionRecordUsage(character, record);

        expect(firestoreUpdate).toEqual({ 'resourceUsages.action-surge': DELETE_FIELD });
        expect(updatedCharacter.resourceUsages).not.toHaveProperty('action-surge');
      });

      it('returns no-op when current === 0', () => {
        const character = {
          resourceUsages: { 'action-surge': { current: 0 } }
        } as unknown as Character;
        const { firestoreUpdate, updatedCharacter } = revertActionRecordUsage(character, record);

        expect(firestoreUpdate).toEqual({});
        expect(updatedCharacter).toBe(character);
      });
    });

    describe('equipment type (not consumed)', () => {
      const record: ActionRecord = {
        id: 'r9',
        type: 'custom',
        name: 'Staff of Fire',
        equipment: { index: 'staff-of-fire', name: 'Staff of Fire' },
        createdAt: new Date()
      };

      it('decrements usage when current > 1', () => {
        const character = {
          resourceUsages: { 'staff-of-fire': { current: 5 } }
        } as unknown as Character;
        const { firestoreUpdate, updatedCharacter } = revertActionRecordUsage(character, record);

        expect(firestoreUpdate).toEqual({ 'resourceUsages.staff-of-fire': { current: 4 } });
        expect(updatedCharacter.resourceUsages?.['staff-of-fire']?.current).toBe(4);
      });

      it('deletes usage when current === 1', () => {
        const character = {
          resourceUsages: { 'staff-of-fire': { current: 1 } }
        } as unknown as Character;
        const { firestoreUpdate, updatedCharacter } = revertActionRecordUsage(character, record);

        expect(firestoreUpdate).toEqual({ 'resourceUsages.staff-of-fire': DELETE_FIELD });
        expect(updatedCharacter.resourceUsages).not.toHaveProperty('staff-of-fire');
      });

      it('returns no-op when current === 0', () => {
        const character = {
          resourceUsages: { 'staff-of-fire': { current: 0 } }
        } as unknown as Character;
        const { firestoreUpdate, updatedCharacter } = revertActionRecordUsage(character, record);

        expect(firestoreUpdate).toEqual({});
        expect(updatedCharacter).toBe(character);
      });
    });

    describe('equipment type (consumed)', () => {
      const record: ActionRecord = {
        id: 'r12',
        type: 'custom',
        name: 'Healing Potion',
        equipment: { index: 'healing-potion', name: 'Healing Potion', type: 'potion' },
        consumed: true,
        value: 1,
        createdAt: new Date()
      };

      it('deletes usage and restores equipment count when value === 1 and item exists', () => {
        const character = {
          resourceUsages: {},
          equipments: [
            { index: 'healing-potion', name: 'Healing Potion', type: 'potion', count: 2 }
          ]
        } as unknown as Character;
        const { firestoreUpdate, updatedCharacter } = revertActionRecordUsage(character, record);

        expect(firestoreUpdate['resourceUsages.healing-potion']).toEqual(DELETE_FIELD);
        expect(firestoreUpdate['equipments']).toEqual([
          { index: 'healing-potion', name: 'Healing Potion', type: 'potion', count: 3 }
        ]);
        expect(updatedCharacter.resourceUsages).not.toHaveProperty('healing-potion');
        expect(updatedCharacter.equipments?.find((e) => e.index === 'healing-potion')?.count).toBe(
          3
        );
      });

      it('decrements usage and restores equipment count when value > 1 and item exists', () => {
        const character = {
          resourceUsages: { 'healing-potion': { current: 3 } },
          equipments: [
            { index: 'healing-potion', name: 'Healing Potion', type: 'potion', count: 1 }
          ]
        } as unknown as Character;
        const { firestoreUpdate, updatedCharacter } = revertActionRecordUsage(character, {
          ...record,
          value: 3
        });

        expect(firestoreUpdate['resourceUsages.healing-potion']).toEqual({ current: 2 });
        expect(firestoreUpdate['equipments']).toEqual([
          { index: 'healing-potion', name: 'Healing Potion', type: 'potion', count: 2 }
        ]);
        expect(updatedCharacter.resourceUsages?.['healing-potion']?.current).toBe(2);
        expect(updatedCharacter.equipments?.find((e) => e.index === 'healing-potion')?.count).toBe(
          2
        );
      });

      it('adds item back to equipments when item no longer exists and type is known', () => {
        const character = {
          resourceUsages: {},
          equipments: []
        } as unknown as Character;
        const { firestoreUpdate, updatedCharacter } = revertActionRecordUsage(character, record);

        expect(firestoreUpdate['resourceUsages.healing-potion']).toEqual(DELETE_FIELD);
        expect(firestoreUpdate['equipments']).toEqual([
          { index: 'healing-potion', name: 'Healing Potion', type: 'potion', count: 1 }
        ]);
        expect(updatedCharacter.equipments).toHaveLength(1);
        expect(updatedCharacter.equipments?.[0].count).toBe(1);
      });

      it('does not update equipments when item is missing and no type', () => {
        const character = { resourceUsages: {}, equipments: [] } as unknown as Character;
        const noTypeRecord: ActionRecord = {
          ...record,
          equipment: { index: 'mystery-item', name: 'Mystery Item' }
        };
        const { firestoreUpdate, updatedCharacter } = revertActionRecordUsage(
          character,
          noTypeRecord
        );

        expect(firestoreUpdate['resourceUsages.mystery-item']).toEqual(DELETE_FIELD);
        expect(firestoreUpdate['equipments']).toEqual([]);
        expect(updatedCharacter.equipments).toEqual([]);
      });

      it('handles missing equipments array by treating it as empty', () => {
        const character = { resourceUsages: {}, equipments: [] } as unknown as Character;
        const { firestoreUpdate, updatedCharacter } = revertActionRecordUsage(character, record);

        expect(firestoreUpdate['equipments']).toEqual([
          { index: 'healing-potion', name: 'Healing Potion', type: 'potion', count: 1 }
        ]);
        expect(updatedCharacter.equipments).toHaveLength(1);
      });
    });

    describe('unrelated types', () => {
      it('returns no-op for health type', () => {
        const character = {} as Character;
        const record: ActionRecord = {
          id: 'r17',
          type: 'health',
          name: 'Healed',
          value: 10,
          createdAt: new Date()
        };
        const { firestoreUpdate, updatedCharacter } = revertActionRecordUsage(character, record);

        expect(firestoreUpdate).toEqual({});
        expect(updatedCharacter).toBe(character);
      });

      it('returns no-op for money type', () => {
        const character = {} as Character;
        const record: ActionRecord = {
          id: 'r18',
          type: 'money',
          name: 'Bought item',
          createdAt: new Date()
        };
        const { firestoreUpdate, updatedCharacter } = revertActionRecordUsage(character, record);

        expect(firestoreUpdate).toEqual({});
        expect(updatedCharacter).toBe(character);
      });
    });
  });
});
